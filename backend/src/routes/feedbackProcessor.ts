import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import OpenRouterService from '../services/OpenRouterService';

const router = Router();
const prisma = new PrismaClient();
const openRouterService = new OpenRouterService();

// Middleware to check OPR permissions
const checkOPRPermission = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  
  if (!user || (user.role?.name !== 'OPR' && user.role?.name !== 'ADMIN')) {
    return res.status(403).json({ error: 'Only OPR personnel can process feedback' });
  }
  
  next();
};

/**
 * Get all feedback for a document grouped by location
 */
router.get('/document/:documentId/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { status, severity, groupByLocation } = req.query;
    
    // Get feedback through document approvals
    const approval = await prisma.documentApproval.findFirst({
      where: { 
        documentPublishing: {
          documentId
        }
      },
      include: {
        documentPublishing: true
      }
    });
    
    if (!approval) {
      return res.json({ feedback: [], total: 0 });
    }
    
    const whereClause: any = { approvalId: approval.id };
    
    if (status) {
      whereClause.status = status as string;
    }
    
    if (severity) {
      whereClause.sectionFeedback = {
        path: ['severity'],
        equals: severity
      };
    }
    
    const feedback = await prisma.reviewer_feedback.findMany({
      where: whereClause,
      include: {
        users: true,
        document_approvals: {
          include: {
            documentPublishing: {
              include: {
                documents: {
                  select: {
                    id: true,
                    title: true,
                    currentVersion: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    // Group by location if requested
    if (groupByLocation === 'true') {
      const grouped = new Map<string, any[]>();
      
      feedback.forEach(item => {
        const metadata = item.sectionFeedback as any;
        const locationKey = `${metadata.pageNumber || 0}-${metadata.paragraphNumber || 0}-${metadata.lineNumber || 0}`;
        
        if (!grouped.has(locationKey)) {
          grouped.set(locationKey, []);
        }
        
        grouped.get(locationKey)!.push({
          ...item,
          severity: metadata?.severity || 'SUBSTANTIVE',
          location: {
            page: metadata?.pageNumber,
            paragraph: metadata?.paragraphNumber,
            line: metadata?.lineNumber
          }
        });
      });
      
      const groupedArray = Array.from(grouped.entries()).map(([key, items]) => ({
        locationKey: key,
        location: items[0].location,
        originalSentence: (items[0].sectionFeedback as any)?.originalSentence,
        feedbackCount: items.length,
        hasCritical: items.some(i => (i.sectionFeedback as any)?.severity === 'CRITICAL'),
        items
      }));
      
      return res.json({ grouped: groupedArray, total: feedback.length });
    }
    
    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * Process OPR decision on feedback
 */
router.post('/feedback/:feedbackId/decision', 
  authMiddleware, 
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { feedbackId } = req.params;
      const { decision, justification } = req.body;
      const oprId = (req as any).user?.id;
      
      if (!['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision. Must be APPROVE or REJECT' });
      }
      
      // Process the decision
      const result = await openRouterService.processOPRDecision(
        feedbackId,
        decision,
        oprId,
        justification
      );
      
      // If approved and processed, update the document
      if (result) {
        const feedback = await prisma.reviewer_feedback.findUnique({
          where: { id: feedbackId },
          include: {
            document_approvals: {
              include: {
                documentPublishing: true
              }
            }
          }
        });
        
        if (feedback) {
          const documentId = feedback.document_approvals.documentPublishing.documentId;
          await updateDocumentContent(
            documentId,
            result.originalSentence,
            result.improvedSentence,
            (feedback.sectionFeedback as any)?.lineNumber
          );
          
          // Log the change
          const document = await prisma.document.findUnique({
            where: { id: documentId }
          });
          
          if (document) {
            await prisma.documentVersion.create({
              data: {
                documentId,
                versionNumber: await getNextVersionNumber(documentId),
                title: document.title + ' (Feedback Applied)',
                fileName: document.fileName,
                fileSize: document.fileSize,
                checksum: document.checksum + '-' + Date.now(),
                storagePath: document.storagePath,
                changeNotes: `Applied feedback: ${result.reasoning}`,
                createdById: oprId
              }
            });
          }
        }
      }
      
      res.json({ 
        success: true, 
        decision,
        processed: !!result,
        result 
      });
    } catch (error: any) {
      console.error('Error processing OPR decision:', error);
      res.status(500).json({ error: error.message || 'Failed to process decision' });
    }
});

/**
 * Consolidate and process multiple feedback for same location
 */
router.post('/feedback/consolidate',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId, lineNumber, paragraphNumber, pageNumber } = req.body;
      
      if (!documentId || !lineNumber) {
        return res.status(400).json({ error: 'Document ID and line number are required' });
      }
      
      const consolidated = await openRouterService.consolidateFeedback(
        documentId,
        lineNumber,
        paragraphNumber || '0',
        pageNumber || '1'
      );
      
      res.json(consolidated);
    } catch (error: any) {
      console.error('Error consolidating feedback:', error);
      res.status(500).json({ error: error.message || 'Failed to consolidate feedback' });
    }
});

/**
 * Process batch feedback approval
 */
router.post('/feedback/batch-process',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId, approvedFeedbackIds, rejectedFeedbackIds } = req.body;
      const oprId = (req as any).user?.id;
      
      if (!documentId || (!approvedFeedbackIds?.length && !rejectedFeedbackIds?.length)) {
        return res.status(400).json({ error: 'Invalid batch processing request' });
      }
      
      const results = {
        approved: [] as any[],
        rejected: [] as any[],
        failed: [] as any[]
      };
      
      // Process rejections first (simpler)
      if (rejectedFeedbackIds?.length) {
        for (const feedbackId of rejectedFeedbackIds) {
          try {
            await prisma.reviewer_feedback.update({
              where: { id: feedbackId },
              data: {
                sectionFeedback: {
                  ...(await getFeedbackMetadata(feedbackId)),
                  status: 'REJECTED',
                  oprDecision: 'REJECT',
                  oprId,
                  processedAt: new Date().toISOString()
                }
              }
            });
            results.rejected.push(feedbackId);
          } catch (error) {
            results.failed.push({ feedbackId, error: (error as Error).message });
          }
        }
      }
      
      // Process approvals with AI
      if (approvedFeedbackIds?.length) {
        const processedFeedback = await openRouterService.processBatchFeedback(
          documentId,
          approvedFeedbackIds
        );
        
        // Apply improvements to document
        for (const processed of processedFeedback) {
          try {
            // Update document content
            const document = await prisma.document.findUnique({
              where: { id: documentId }
            });
            
            if (document && document.customFields) {
              const content = (document.customFields as any).content || '';
              const updatedContent = content.replace(
                processed.originalSentence,
                processed.improvedSentence
              );
              
              await prisma.document.update({
                where: { id: documentId },
                data: { 
                  customFields: {
                    ...(document.customFields as any),
                    content: updatedContent,
                    lastModifiedAt: new Date().toISOString(),
                    lastModifiedById: oprId
                  }
                }
              });
              
              // Mark feedback as resolved
              for (const feedbackId of processed.feedbackIds) {
                await prisma.reviewer_feedback.update({
                  where: { id: feedbackId },
                  data: {
                    sectionFeedback: {
                      ...(await getFeedbackMetadata(feedbackId)),
                      status: 'RESOLVED',
                      oprDecision: 'APPROVE',
                      oprId,
                      processedAt: new Date().toISOString(),
                      appliedImprovement: processed.improvedSentence
                    }
                  }
                });
              }
              
              results.approved.push({
                feedbackIds: processed.feedbackIds,
                improvement: processed.improvedSentence,
                modelUsed: processed.modelUsed,
                confidence: processed.confidence
              });
            }
          } catch (error) {
            results.failed.push({ 
              feedbackIds: processed.feedbackIds, 
              error: (error as Error).message 
            });
          }
        }
      }
      
      res.json({
        success: true,
        results,
        summary: {
          approved: results.approved.length,
          rejected: results.rejected.length,
          failed: results.failed.length
        }
      });
    } catch (error: any) {
      console.error('Error in batch processing:', error);
      res.status(500).json({ error: error.message || 'Batch processing failed' });
    }
});

/**
 * Get AI model recommendations for feedback
 */
router.post('/feedback/ai-recommendation',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { originalSentence, feedbackContent, severity, documentContext } = req.body;
      
      if (!originalSentence || !feedbackContent) {
        return res.status(400).json({ error: 'Original sentence and feedback are required' });
      }
      
      // Create temporary feedback item for processing
      const tempFeedback = {
        id: 'temp-' + Date.now(),
        lineNumber: '0',
        paragraphNumber: '0',
        pageNumber: '0',
        content: feedbackContent,
        severity: severity || 'SUBSTANTIVE',
        reviewerId: (req as any).user?.id,
        reviewerName: 'Current User',
        originalSentence
      };
      
      const result = await openRouterService.processFeedback(
        originalSentence,
        [tempFeedback],
        documentContext
      );
      
      res.json({
        recommendation: result.improvedSentence,
        modelUsed: result.modelUsed,
        confidence: result.confidence,
        reasoning: result.reasoning
      });
    } catch (error: any) {
      console.error('Error getting AI recommendation:', error);
      res.status(500).json({ error: error.message || 'Failed to get recommendation' });
    }
});

/**
 * Get critical feedback requiring mandatory resolution
 */
router.get('/feedback/critical/:documentId',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      
      // Get critical feedback through document approvals
      const approval = await prisma.documentApproval.findFirst({
        where: { 
          documentPublishing: {
            documentId
          }
        }
      });
      
      if (!approval) {
        return res.json({ critical: [], count: 0, requiresResolution: false });
      }
      
      const criticalFeedback = await prisma.reviewer_feedback.findMany({
        where: {
          approvalId: approval.id,
          sectionFeedback: {
            path: ['severity'],
            equals: 'CRITICAL'
          }
        },
        include: {
          users: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      const formatted = criticalFeedback.map(item => {
        const metadata = item.sectionFeedback as any;
        return {
          id: item.id,
          content: item.detailedComments || item.summary || '',
          reviewer: `${item.users.firstName} ${item.users.lastName}`,
          location: {
            page: metadata?.pageNumber,
            paragraph: metadata?.paragraphNumber,
            line: metadata?.lineNumber
          },
          originalSentence: metadata?.originalSentence,
          createdAt: item.createdAt,
          mustResolve: true
        };
      });
      
      res.json({
        critical: formatted,
        count: formatted.length,
        requiresResolution: formatted.length > 0
      });
    } catch (error) {
      console.error('Error fetching critical feedback:', error);
      res.status(500).json({ error: 'Failed to fetch critical feedback' });
    }
});

// Helper functions

async function updateDocumentContent(
  documentId: string,
  originalSentence: string,
  improvedSentence: string,
  lineNumber: string
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });
  
  if (!document || !document.customFields) {
    throw new Error('Document not found or has no content');
  }
  
  let content = (document.customFields as any).content || '';
  
  // Replace the sentence in the content
  if (content.includes(originalSentence)) {
    content = content.replace(originalSentence, improvedSentence);
  } else {
    // If exact match not found, try line-based replacement
    const lines = content.split('\n');
    const lineIndex = parseInt(lineNumber) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] = improvedSentence;
      content = lines.join('\n');
    }
  }
  
  await prisma.document.update({
    where: { id: documentId },
    data: { 
      customFields: {
        ...(document.customFields as any),
        content
      }
    }
  });
}

async function getNextVersionNumber(documentId: string): Promise<number> {
  const lastVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: 'desc' }
  });
  
  if (!lastVersion) {
    return 1;
  }
  
  return lastVersion.versionNumber + 1;
}

async function getFeedbackMetadata(feedbackId: string): Promise<any> {
  const feedback = await prisma.reviewer_feedback.findUnique({
    where: { id: feedbackId }
  });
  
  return feedback?.sectionFeedback || {};
}

export default router;