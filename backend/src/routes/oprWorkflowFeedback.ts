import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Enhanced feedback system for OPR 8-stage workflow
 * Enables feedback in:
 * - Stage 2: 1st Coordination (External)
 * - Stage 3: OPR Revisions (Internal) - NEW
 * - Stage 4: 2nd Coordination (External)
 * - Stage 5: OPR Final (Critical only)
 * - Stage 6: Legal Review (Legal)
 * - Stage 7: OPR Legal (Collaborative) - NEW
 */

// Define workflow stages with feedback capabilities
const WORKFLOW_STAGES = {
  OPR_CREATES: {
    stage: 1,
    name: 'OPR Creates',
    status: 'DRAFT',
    feedbackEnabled: false
  },
  FIRST_COORDINATION: {
    stage: 2,
    name: '1st Coordination',
    status: 'IN_REVIEW',
    feedbackEnabled: true,
    feedbackTypes: ['TECHNICAL', 'CONTENT', 'GRAMMAR', 'COMPLIANCE']
  },
  OPR_REVISIONS: {
    stage: 3,
    name: 'OPR Revisions',
    status: 'IN_OPR_REVISION',
    feedbackEnabled: true, // NEW - Enable internal feedback
    feedbackTypes: ['IMPLEMENTATION_NOTE', 'CLARIFICATION_REQUEST', 'DECISION_RATIONALE', 'QUALITY_CHECK', 'SUPERVISOR_DIRECTIVE'],
    internalOnly: true
  },
  SECOND_COORDINATION: {
    stage: 4,
    name: '2nd Coordination',
    status: 'IN_REVIEW',
    feedbackEnabled: true,
    feedbackTypes: ['VERIFICATION', 'NEW_ISSUE', 'FINAL_REVIEW']
  },
  OPR_FINAL: {
    stage: 5,
    name: 'OPR Final',
    status: 'IN_APPROVAL',
    feedbackEnabled: true,
    criticalOnly: true
  },
  LEGAL_REVIEW: {
    stage: 6,
    name: 'Legal Review',
    status: 'IN_LEGAL_REVIEW',
    feedbackEnabled: true,
    feedbackTypes: ['LEGAL_COMPLIANCE', 'REGULATORY', 'RISK_ASSESSMENT', 'POLICY_ALIGNMENT']
  },
  OPR_LEGAL: {
    stage: 7,
    name: 'OPR Legal',
    status: 'IN_OPR_LEGAL_RESOLUTION',
    feedbackEnabled: true, // NEW - Enable collaborative feedback
    feedbackTypes: ['ALTERNATIVE_PROPOSAL', 'CLARIFICATION_REQUEST', 'COMPLIANCE_CONFIRMATION', 'RISK_ACCEPTANCE'],
    collaborative: true
  },
  AFDPO_PUBLISH: {
    stage: 8,
    name: 'AFDPO Publish',
    status: 'PUBLISHED',
    feedbackEnabled: false
  }
};

/**
 * Check if feedback is allowed for current stage
 */
async function canLeaveFeedback(
  documentId: string,
  userId: string,
  stageNumber: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Get document and current workflow stage
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    return { allowed: false, reason: 'Document not found' };
  }

  // Find stage configuration
  const stageConfig = Object.values(WORKFLOW_STAGES).find(s => s.stage === stageNumber);
  
  if (!stageConfig) {
    return { allowed: false, reason: 'Invalid workflow stage' };
  }

  if (!stageConfig.feedbackEnabled) {
    return { allowed: false, reason: `Feedback not allowed in stage: ${stageConfig.name}` };
  }

  // Check user permissions based on stage
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Stage-specific permissions
  if ('internalOnly' in stageConfig && stageConfig.internalOnly) {
    // Stage 3: OPR Revisions - Only OPR team can leave feedback
    if (!['OPR', 'OPR_SUPERVISOR', 'OPR_LEAD', 'ADMIN'].includes(user.role?.name || '')) {
      return { allowed: false, reason: 'Only OPR team can leave internal feedback during revisions' };
    }
  }

  if ('collaborative' in stageConfig && stageConfig.collaborative) {
    // Stage 7: OPR Legal - Both OPR and Legal can leave feedback
    if (!['OPR', 'OPR_SUPERVISOR', 'LEGAL_REVIEWER', 'LEGAL_SUPERVISOR', 'ADMIN'].includes(user.role?.name || '')) {
      return { allowed: false, reason: 'Only OPR and Legal teams can participate in collaborative feedback' };
    }
  }

  return { allowed: true };
}

/**
 * Add feedback during Stage 3: OPR Revisions (Internal)
 */
router.post('/stage3/internal-feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId, lineNumber, feedbackType, comment, linkedExternalFeedbackId } = req.body;
    const userId = (req as any).user?.id;

    // Validate stage
    const canAdd = await canLeaveFeedback(documentId, userId, 3);
    if (!canAdd.allowed) {
      return res.status(403).json({ error: canAdd.reason });
    }

    // Get current approval
    const publishing = await prisma.document_publishings.findFirst({
      where: { documentId },
      include: { approvals: true }
    });

    if (!publishing || !publishing.approvals.length) {
      return res.status(400).json({ error: 'No active approval found' });
    }

    // Create internal feedback
    const feedback = await prisma.reviewer_feedback.create({
      data: {
        id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        approvalId: publishing.approvals[0].id,
        reviewerId: userId,
        feedbackType: feedbackType || 'TECHNICAL',
        summary: `Internal OPR Feedback - ${feedbackType}`,
        detailedComments: comment,
        sectionFeedback: {
          lineNumber: lineNumber || '0',
          feedbackType,
          isInternal: true,
          linkedExternalId: linkedExternalFeedbackId,
          stage: 'OPR_REVISIONS',
          timestamp: new Date().toISOString()
        },
        updatedAt: new Date()
      } as any
    });

    // Log the internal feedback action
    /* await prisma.activityLog.create({
      data: {
        type: 'INTERNAL_FEEDBACK_ADDED',
        description: `OPR team member added internal feedback during revisions`,
        metadata: {
          feedbackId: feedback.id,
          feedbackType,
          stage: 'OPR_REVISIONS',
          lineNumber
        },
        userId,
        timestamp: new Date()
      }
    }); */

    res.json({
      success: true,
      feedback,
      message: 'Internal feedback added successfully'
    });
  } catch (error: any) {
    console.error('Error adding Stage 3 internal feedback:', error);
    res.status(500).json({ error: error.message || 'Failed to add internal feedback' });
  }
});

/**
 * Process external feedback during Stage 3 with internal notes
 * Supports both AI-generated and manual merge options
 */
router.post('/stage3/process-with-notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      externalFeedbackId, 
      decision, 
      internalNote, 
      implementationPlan,
      rationale,
      mergeType, // 'AI', 'MANUAL', or 'HYBRID'
      manualMergedContent, // User's manually edited version
      aiSuggestion // AI-generated suggestion (if mergeType is HYBRID)
    } = req.body;
    const userId = (req as any).user?.id;

    // Get external feedback
    const externalFeedback = await prisma.reviewer_feedback.findUnique({
      where: { id: externalFeedbackId }
    });

    if (!externalFeedback) {
      return res.status(404).json({ error: 'External feedback not found' });
    }

    // Determine final content based on merge type
    let finalContent = '';
    let mergeMetadata: any = {
      mergeType: mergeType || 'AI',
      timestamp: new Date().toISOString()
    };

    switch (mergeType) {
      case 'MANUAL':
        // User provides the complete merged content
        finalContent = manualMergedContent;
        mergeMetadata.source = 'USER_MANUAL_EDIT';
        break;
      
      case 'HYBRID':
        // User can edit AI suggestion
        finalContent = manualMergedContent || aiSuggestion;
        mergeMetadata.source = 'USER_EDITED_AI_SUGGESTION';
        mergeMetadata.aiSuggestion = aiSuggestion;
        mergeMetadata.userEdit = manualMergedContent;
        break;
      
      case 'AI':
      default:
        // Pure AI-generated merge
        finalContent = aiSuggestion || '';
        mergeMetadata.source = 'AI_GENERATED';
        break;
    }

    // Update external feedback with decision and merge info
    await prisma.reviewer_feedback.update({
      where: { id: externalFeedbackId },
      data: {
        sectionFeedback: {
          ...(externalFeedback.sectionFeedback as any),
          oprDecision: decision,
          oprProcessedBy: userId,
          processedAt: new Date().toISOString(),
          decisionRationale: rationale,
          implementationPlan,
          mergeMetadata,
          finalContent
        }
      }
    });

    // Create internal note linked to external feedback
    if (internalNote) {
      await prisma.reviewer_feedback.create({
        data: {
          id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          approvalId: externalFeedback.approvalId,
          reviewerId: userId,
          feedbackType: 'TECHNICAL',
          summary: 'OPR Processing Note',
          detailedComments: internalNote,
          sectionFeedback: {
            feedbackType: 'DECISION_RATIONALE',
            isInternal: true,
            linkedExternalId: externalFeedbackId,
            stage: 'OPR_REVISIONS',
            decision,
            rationale,
            implementationPlan,
            timestamp: new Date().toISOString()
          },
          updatedAt: new Date()
        } as any
      });
    }

    res.json({
      success: true,
      message: 'External feedback processed with internal documentation'
    });
  } catch (error: any) {
    console.error('Error processing feedback with notes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add collaborative feedback during Stage 7: OPR Legal
 */
router.post('/stage7/collaborative-feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      documentId, 
      inResponseTo, 
      feedbackType, 
      comment,
      proposedAlternative,
      legalRequirement 
    } = req.body;
    const userId = (req as any).user?.id;

    // Validate stage
    const canAdd = await canLeaveFeedback(documentId, userId, 7);
    if (!canAdd.allowed) {
      return res.status(403).json({ error: canAdd.reason });
    }

    // Get user role to determine feedback source
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    const isOPR = ['OPR', 'OPR_SUPERVISOR', 'OPR_LEAD'].includes(user?.role?.name || '');
    const isLegal = ['LEGAL_REVIEWER', 'LEGAL_SUPERVISOR'].includes(user?.role?.name || '');

    // Get current approval
    const publishing = await prisma.document_publishings.findFirst({
      where: { documentId },
      include: { approvals: true }
    });

    if (!publishing || !publishing.approvals.length) {
      return res.status(400).json({ error: 'No active approval found' });
    }

    // Create collaborative feedback
    const feedback = await prisma.reviewer_feedback.create({
      data: {
        id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        approvalId: publishing.approvals[0].id,
        reviewerId: userId,
        feedbackType: feedbackType || 'TECHNICAL',
        summary: `${isOPR ? 'OPR' : 'Legal'} - ${feedbackType}`,
        detailedComments: comment,
        sectionFeedback: {
          feedbackType,
          isCollaborative: true,
          source: isOPR ? 'OPR' : 'LEGAL',
          inResponseTo,
          proposedAlternative,
          legalRequirement,
          stage: 'OPR_LEGAL',
          timestamp: new Date().toISOString()
        },
        updatedAt: new Date()
      } as any
    });

    // If this is a response to another feedback, create a thread
    if (inResponseTo) {
      // Update the original feedback to show it has responses
      await prisma.reviewer_feedback.update({
        where: { id: inResponseTo },
        data: {
          sectionFeedback: {
            ...(await getOriginalFeedbackMetadata(inResponseTo)),
            hasResponses: true,
            latestResponseId: feedback.id
          }
        }
      });
    }

    // Log collaborative action
    /* await prisma.activityLog.create({
      data: {
        type: 'COLLABORATIVE_FEEDBACK',
        description: `${isOPR ? 'OPR' : 'Legal'} team added collaborative feedback`,
        metadata: {
          feedbackId: feedback.id,
          feedbackType,
          stage: 'OPR_LEGAL',
          source: isOPR ? 'OPR' : 'LEGAL',
          inResponseTo
        },
        userId,
        timestamp: new Date()
      }
    }); */

    res.json({
      success: true,
      feedback,
      message: 'Collaborative feedback added successfully'
    });
  } catch (error: any) {
    console.error('Error adding Stage 7 collaborative feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process feedback with manual merge capability
 * Allows OPR to manually edit and merge feedback with original content
 */
router.post('/process-feedback-merge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      feedbackId,
      originalContent,
      feedbackContent,
      mergeStrategy, // 'ACCEPT_ALL', 'REJECT_ALL', 'MANUAL_MERGE', 'AI_SUGGEST'
      manualMerge, // User's manually merged version
      lineNumber
    } = req.body;
    const userId = (req as any).user?.id;

    // Get feedback record
    const feedback = await prisma.reviewer_feedback.findUnique({
      where: { id: feedbackId }
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    let finalMergedContent = originalContent;
    let mergeDetails: any = {
      strategy: mergeStrategy,
      processedBy: userId,
      timestamp: new Date().toISOString(),
      lineNumber
    };

    // Process based on merge strategy
    switch (mergeStrategy) {
      case 'ACCEPT_ALL':
        // Replace original with feedback content
        finalMergedContent = feedbackContent;
        mergeDetails.action = 'ACCEPTED_FEEDBACK';
        break;

      case 'REJECT_ALL':
        // Keep original content
        finalMergedContent = originalContent;
        mergeDetails.action = 'REJECTED_FEEDBACK';
        break;

      case 'MANUAL_MERGE':
        // Use user's manually edited merge
        if (!manualMerge) {
          return res.status(400).json({ error: 'Manual merge content required' });
        }
        finalMergedContent = manualMerge;
        mergeDetails.action = 'MANUAL_MERGE';
        mergeDetails.userEdited = true;
        break;

      case 'AI_SUGGEST':
        // This would call an AI service to suggest a merge
        // For now, we'll return a placeholder
        finalMergedContent = `[AI Merge Suggestion]\nOriginal: ${originalContent}\nFeedback: ${feedbackContent}`;
        mergeDetails.action = 'AI_SUGGESTED';
        mergeDetails.requiresReview = true;
        break;

      default:
        return res.status(400).json({ error: 'Invalid merge strategy' });
    }

    // Update feedback with merge details
    await prisma.reviewer_feedback.update({
      where: { id: feedbackId },
      data: {
        sectionFeedback: {
          ...(feedback.sectionFeedback as any),
          mergeDetails,
          finalMergedContent,
          mergeCompleted: true
        }
      }
    });

    res.json({
      success: true,
      mergedContent: finalMergedContent,
      mergeDetails,
      message: `Feedback processed with ${mergeStrategy} strategy`
    });
  } catch (error: any) {
    console.error('Error processing feedback merge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get merge suggestions for feedback
 * Provides different merge options for OPR to choose from
 */
router.post('/merge-suggestions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { originalContent, feedbackContent, feedbackSeverity } = req.body;

    // Generate different merge suggestions
    const suggestions = [
      {
        type: 'ACCEPT_FEEDBACK',
        content: feedbackContent,
        description: 'Accept feedback completely, replacing original content'
      },
      {
        type: 'KEEP_ORIGINAL',
        content: originalContent,
        description: 'Keep original content, reject feedback'
      },
      {
        type: 'COMBINE_BOTH',
        content: `${originalContent}\n[Reviewer Feedback: ${feedbackContent}]`,
        description: 'Combine both with clear distinction'
      },
      {
        type: 'MANUAL_EDIT',
        content: originalContent, // Start with original for editing
        description: 'Manually edit and merge content',
        editable: true
      }
    ];

    // Add severity-based recommendation
    let recommendation = 'MANUAL_EDIT';
    if (feedbackSeverity === 'CRITICAL') {
      recommendation = 'ACCEPT_FEEDBACK';
      suggestions.push({
        type: 'CRITICAL_MERGE',
        content: `[CRITICAL FEEDBACK APPLIED]\n${feedbackContent}`,
        description: 'Critical feedback must be addressed'
      });
    }

    res.json({
      suggestions,
      recommendation,
      allowManualEdit: true,
      message: 'Merge suggestions generated'
    });
  } catch (error: any) {
    console.error('Error generating merge suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all feedback for a document by stage
 */
router.get('/document/:documentId/stage/:stageNumber/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId, stageNumber } = req.params;
    const stage = parseInt(stageNumber);

    // Get publishing and approval
    const publishing = await prisma.document_publishings.findFirst({
      where: { documentId },
      include: { 
        approvals: {
          include: {
            reviewer_feedback: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!publishing) {
      return res.json({ feedback: [], total: 0 });
    }

    // Filter feedback by stage
    let stageFeedback: any[] = [];
    
    for (const approval of publishing.approvals) {
      const feedbackForStage = approval.reviewer_feedback.filter((fb: any) => {
        const metadata = fb.sectionFeedback as any;
        
        // Stage-specific filtering
        if (stage === 3) {
          // OPR Revisions - Internal feedback only
          return metadata?.isInternal === true && metadata?.stage === 'OPR_REVISIONS';
        } else if (stage === 7) {
          // OPR Legal - Collaborative feedback only
          return metadata?.isCollaborative === true && metadata?.stage === 'OPR_LEGAL';
        } else {
          // Other stages - check by document/publishing status
          return !metadata?.isInternal && !metadata?.isCollaborative;
        }
      });
      
      stageFeedback = [...stageFeedback, ...feedbackForStage];
    }

    // Group by thread for Stage 7
    if (stage === 7) {
      const threads = groupFeedbackByThread(stageFeedback);
      return res.json({ 
        threads,
        total: stageFeedback.length 
      });
    }

    res.json({
      feedback: stageFeedback,
      total: stageFeedback.length,
      stage: Object.values(WORKFLOW_STAGES)[stage - 1]
    });
  } catch (error: any) {
    console.error('Error fetching stage feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get feedback statistics for all stages
 */
router.get('/document/:documentId/feedback-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const publishing = await prisma.document_publishings.findFirst({
      where: { documentId },
      include: {
        approvals: {
          include: {
            reviewer_feedback: true
          }
        }
      }
    });

    if (!publishing) {
      return res.json({ stats: {} });
    }

    const stats: any = {};

    // Calculate stats for each stage
    Object.entries(WORKFLOW_STAGES).forEach(([key, config]) => {
      if (config.feedbackEnabled) {
        stats[config.name] = {
          stage: config.stage,
          enabled: true,
          count: 0,
          byType: {},
          bySeverity: {}
        };
      }
    });

    // Process all feedback
    for (const approval of publishing.approvals) {
      for (const feedback of approval.reviewer_feedback) {
        const metadata = feedback.sectionFeedback as any;
        
        // Determine which stage this feedback belongs to
        let stageName = '';
        if (metadata?.isInternal && metadata?.stage === 'OPR_REVISIONS') {
          stageName = 'OPR Revisions';
        } else if (metadata?.isCollaborative && metadata?.stage === 'OPR_LEGAL') {
          stageName = 'OPR Legal';
        } else {
          // Map by document/publishing status
          // This would need more complex logic based on when feedback was created
          stageName = '1st Coordination'; // Default for demo
        }

        if (stats[stageName]) {
          stats[stageName].count++;
          
          // Count by type
          const type = metadata?.feedbackType || feedback.feedbackType;
          stats[stageName].byType[type] = (stats[stageName].byType[type] || 0) + 1;
          
          // Count by severity
          const severity = metadata?.severity || 'NORMAL';
          stats[stageName].bySeverity[severity] = (stats[stageName].bySeverity[severity] || 0) + 1;
        }
      }
    }

    res.json({
      documentId,
      stats,
      summary: {
        totalFeedback: Object.values(stats).reduce((sum: number, s: any) => sum + s.count, 0),
        stagesWithFeedback: Object.values(stats).filter((s: any) => s.count > 0).length
      }
    });
  } catch (error: any) {
    console.error('Error calculating feedback stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions

async function getOriginalFeedbackMetadata(feedbackId: string): Promise<any> {
  const feedback = await prisma.reviewer_feedback.findUnique({
    where: { id: feedbackId }
  });
  return feedback?.sectionFeedback || {};
}

function groupFeedbackByThread(feedback: any[]): any[] {
  const threads = new Map();
  
  // First pass: identify root feedback items
  feedback.forEach(item => {
    const metadata = item.sectionFeedback as any;
    if (!metadata?.inResponseTo) {
      threads.set(item.id, {
        root: item,
        responses: []
      });
    }
  });
  
  // Second pass: add responses to threads
  feedback.forEach(item => {
    const metadata = item.sectionFeedback as any;
    if (metadata?.inResponseTo && threads.has(metadata.inResponseTo)) {
      threads.get(metadata.inResponseTo).responses.push(item);
    }
  });
  
  return Array.from(threads.values());
}

export default router;