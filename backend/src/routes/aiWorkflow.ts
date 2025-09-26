import express from 'express';
import { WorkflowAIService } from '../services/WorkflowAIService';
import { EnhancedPublishingService } from '../services/EnhancedPublishingService';
import { AICollaborativeService } from '../services/AICollaborativeService';
import { authMiddleware } from '../middleware/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Initialize AI services
const workflowAI = new WorkflowAIService();
const enhancedPublishing = new EnhancedPublishingService();
const aiCollaborative = new AICollaborativeService();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * SMART WORKFLOW ROUTING & ANALYSIS
 */

// Analyze document for optimal workflow routing
router.post('/analyze-document', async (req: any, res) => {
  try {
    const { documentId } = req.body;
    
    const analysis = await workflowAI.analyzeDocumentForWorkflow(
      documentId,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    logger.error('Failed to analyze document for workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// Analyze document for decision support
router.post('/analyze-decision-support', async (req: any, res) => {
  try {
    const { documentId } = req.body;
    
    const analysis = await workflowAI.analyzeDocumentForWorkflow(
      documentId,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    logger.error('Failed to analyze document for decision support:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// Auto-assign optimal reviewers
router.post('/auto-assign-reviewers', async (req: any, res) => {
  try {
    const { documentId, workflowId } = req.body;
    
    const assignedReviewers = await workflowAI.autoAssignReviewers(
      documentId,
      workflowId,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      assignedReviewers
    });
  } catch (error: any) {
    logger.error('Failed to auto-assign reviewers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto-assignment failed'
    });
  }
});

// Predict workflow outcome
router.post('/predict-outcome', async (req: any, res) => {
  try {
    const { workflowId, documentId } = req.body;
    
    const prediction = await workflowAI.predictWorkflowOutcome(workflowId, documentId);

    res.json({
      success: true,
      prediction
    });
  } catch (error: any) {
    logger.error('Failed to predict workflow outcome:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Prediction failed'
    });
  }
});

/**
 * SMART PUBLISHING & SUBMISSION
 */

// Smart document submission with AI recommendations
router.post('/smart-submit', async (req: any, res) => {
  try {
    const submissionData = {
      ...req.body,
      useAIRecommendations: req.body.useAIRecommendations !== false // Default to true
    };
    
    const result = await enhancedPublishing.smartSubmitForPublishing(
      submissionData,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    logger.error('Failed to smart submit for publishing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Smart submission failed'
    });
  }
});

// Generate workflow from natural language
router.post('/generate-workflow', async (req: any, res) => {
  try {
    const { description } = req.body;
    
    const workflow = await workflowAI.generateWorkflowFromNaturalLanguage(
      description,
      req.user.organizationId
    );

    res.json({
      success: true,
      workflow
    });
  } catch (error: any) {
    logger.error('Failed to generate workflow from natural language:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Workflow generation failed'
    });
  }
});

// Optimize existing workflow
router.post('/optimize-workflow', async (req: any, res) => {
  try {
    const { workflowId, documentId } = req.body;
    
    // If documentId is provided but not workflowId, analyze the document and create optimization suggestions
    if (!workflowId && documentId) {
      // Analyze document to generate workflow optimization
      const documentAnalysis = await workflowAI.analyzeDocumentForWorkflow(
        documentId,
        req.user.id,
        req.user.organizationId
      );
      
      // Generate optimization suggestions based on document analysis
      const optimizationPrompt = `
        Based on the following document analysis, suggest workflow optimizations:
        Document Risk Score: ${documentAnalysis.riskScore}
        Complexity: ${documentAnalysis.complexity}
        Category: ${documentAnalysis.category}
        Recommended Reviewers: ${documentAnalysis.suggestedReviewers?.join(', ')}
        
        Provide specific optimization recommendations in JSON format:
        {
          "optimizations": [
            {
              "title": "optimization title",
              "description": "detailed description",
              "impact": "HIGH|MEDIUM|LOW",
              "effort": "HIGH|MEDIUM|LOW",
              "estimatedTimeSaving": "percentage or time"
            }
          ],
          "automationOpportunities": ["opportunity1", "opportunity2"],
          "bottleneckAnalysis": {
            "identified": ["bottleneck1", "bottleneck2"],
            "solutions": ["solution1", "solution2"]
          },
          "recommendedWorkflow": {
            "steps": ["step1", "step2"],
            "estimatedDuration": "time",
            "requiredReviewers": number
          }
        }
      `;
      
      const aiResponse = await workflowAI.callOpenRouter(
        process.env.WORKFLOW_AI_MODEL || 'anthropic/claude-sonnet-4',
        optimizationPrompt,
        3,
        true // bypass cache for real-time optimization
      );
      
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const optimization = JSON.parse(cleanedResponse);
      
      res.json({
        success: true,
        optimization: {
          ...optimization,
          documentAnalysis
        }
      });
      return;
    }
    
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Either workflowId or documentId is required'
      });
    }
    
    const optimization = await enhancedPublishing.optimizeWorkflow(
      workflowId,
      req.user.organizationId
    );

    res.json({
      success: true,
      optimization
    });
  } catch (error: any) {
    logger.error('Failed to optimize workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Workflow optimization failed'
    });
  }
});

/**
 * CONTENT ANALYSIS & RECOMMENDATIONS
 */

// Generate approval checklist for document and step
router.post('/generate-checklist', async (req: any, res) => {
  try {
    const { documentId, stepId } = req.body;
    
    const checklist = await workflowAI.generateApprovalChecklist(documentId, stepId);

    res.json({
      success: true,
      checklist
    });
  } catch (error: any) {
    logger.error('Failed to generate approval checklist:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Checklist generation failed'
    });
  }
});

// Analyze content quality
router.post('/analyze-content-quality', async (req: any, res) => {
  try {
    const { documentId } = req.body;
    
    const analysis = await workflowAI.analyzeContentQuality(documentId);

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    logger.error('Failed to analyze content quality:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content analysis failed'
    });
  }
});

/**
 * AI COLLABORATIVE FEATURES
 */

// Create AI-enhanced collaborative session
router.post('/collaborative/create-ai-session', async (req: any, res) => {
  try {
    const { publishingId, participantIds, options } = req.body;
    
    const session = await aiCollaborative.createAICollaborativeSession(
      publishingId,
      participantIds,
      req.user.organizationId,
      options
    );

    res.json({
      success: true,
      session
    });
  } catch (error: any) {
    logger.error('Failed to create AI collaborative session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Session creation failed'
    });
  }
});

// Schedule meeting with AI assistance
router.post('/collaborative/schedule-ai-meeting', async (req: any, res) => {
  try {
    const meetingRequest = req.body;
    
    const meeting = await aiCollaborative.scheduleMeetingWithAI(meetingRequest);

    res.json({
      success: true,
      meeting
    });
  } catch (error: any) {
    logger.error('Failed to schedule AI meeting:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Meeting scheduling failed'
    });
  }
});

// Real-time collaboration analysis
router.get('/collaborative/analyze/:sessionId', async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    
    const analysis = await aiCollaborative.analyzeCollaborationInRealTime(sessionId);

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    logger.error('Failed to analyze collaboration in real-time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Real-time analysis failed'
    });
  }
});

// AI conflict mediation
router.post('/collaborative/mediate-conflict', async (req: any, res) => {
  try {
    const { publishingId, conflictDescription, involvedUserIds } = req.body;
    
    const mediation = await aiCollaborative.mediateConflictWithAI(
      publishingId,
      conflictDescription,
      involvedUserIds
    );

    res.json({
      success: true,
      mediation
    });
  } catch (error: any) {
    logger.error('Failed to mediate conflict with AI:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Conflict mediation failed'
    });
  }
});

// AI consensus building
router.post('/collaborative/build-consensus', async (req: any, res) => {
  try {
    const { publishingId } = req.body;
    
    const consensus = await aiCollaborative.buildConsensusWithAI(
      publishingId,
      req.user.userId
    );

    res.json({
      success: true,
      consensus
    });
  } catch (error: any) {
    logger.error('Failed to build consensus with AI:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Consensus building failed'
    });
  }
});

/**
 * ANALYTICS & INSIGHTS
 */

// Get AI workflow dashboard
router.get('/analytics/dashboard', async (req: any, res) => {
  try {
    const { from, to } = req.query;
    let timeRange;
    
    if (from && to) {
      timeRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const dashboard = await enhancedPublishing.getAIWorkflowDashboard(
      req.user.organizationId,
      req.user.id,
      timeRange
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error: any) {
    logger.error('Failed to get AI workflow dashboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Dashboard generation failed'
    });
  }
});

// Generate AI insights for documents
router.post('/generate-insights', async (req: any, res) => {
  try {
    const { documentId, organizationId } = req.body;
    
    // Generate comprehensive insights
    const insights = await workflowAI.generateWorkflowPerformanceInsights(
      organizationId || req.user.organizationId
    );
    
    // If documentId is provided, get document-specific insights
    let documentInsights = null;
    if (documentId) {
      try {
        const analysis = await workflowAI.analyzeDocumentForWorkflow(
          documentId,
          req.user.id,
          req.user.organizationId
        );
        
        documentInsights = {
          documentAnalysis: analysis,
          qualityScore: await workflowAI.analyzeContentQuality(documentId)
        };
      } catch (docError) {
        logger.warn('Could not fetch document-specific insights:', docError);
      }
    }
    
    res.json({
      success: true,
      insights,
      documentInsights
    });
  } catch (error: any) {
    logger.error('Failed to generate insights:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Insights generation failed'
    });
  }
});

// Generate workflow performance insights
router.get('/analytics/performance-insights', async (req: any, res) => {
  try {
    const { from, to } = req.query;
    let timeRange;
    
    if (from && to) {
      timeRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const insights = await aiCollaborative.generateWorkflowInsights(
      req.user.organizationId,
      timeRange
    );

    res.json({
      success: true,
      insights
    });
  } catch (error: any) {
    logger.error('Failed to generate performance insights:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Insights generation failed'
    });
  }
});

// Get comprehensive workflow insights
router.get('/analytics/comprehensive-insights', async (req: any, res) => {
  try {
    const { from, to } = req.query;
    let timeRange;
    
    if (from && to) {
      timeRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const insights = await aiCollaborative.generateWorkflowInsights(
      req.user.organizationId,
      timeRange
    );

    res.json({
      success: true,
      insights
    });
  } catch (error: any) {
    logger.error('Failed to generate comprehensive insights:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Comprehensive insights generation failed'
    });
  }
});

/**
 * CONFLICT RESOLUTION & SMART SUGGESTIONS
 */

// Resolve workflow conflict with AI
router.post('/resolve-conflict', async (req: any, res) => {
  try {
    const { publishingId, conflictDescription } = req.body;
    
    const resolution = await enhancedPublishing.resolveWorkflowConflict(
      publishingId,
      conflictDescription,
      req.user.userId
    );

    res.json({
      success: true,
      resolution
    });
  } catch (error: any) {
    logger.error('Failed to resolve workflow conflict:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Conflict resolution failed'
    });
  }
});

// Get AI suggestions for current workflow state
router.get('/suggestions/:publishingId', async (req: any, res) => {
  try {
    const { publishingId } = req.params;
    
    // Get current workflow state and generate AI suggestions
    const prediction = await workflowAI.predictWorkflowOutcome('', publishingId);
    
    const suggestions = {
      nextBestActions: prediction.recommendations,
      potentialIssues: prediction.potentialBottlenecks.map((b: any) => b.mitigation),
      optimizations: [
        'Consider parallel processing for remaining approvals',
        'Send reminder notifications to pending reviewers',
        'Escalate high-risk items to senior management'
      ]
    };

    res.json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    logger.error('Failed to get AI suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Suggestions generation failed'
    });
  }
});

/**
 * WORKFLOW HEALTH MONITORING
 */

// Get real-time workflow health metrics
router.get('/health/real-time', async (req: any, res) => {
  try {
    const insights = await aiCollaborative.generateWorkflowInsights(
      req.user.organizationId
    );

    const healthMetrics = {
      overallHealth: insights.workflowHealth.score,
      status: insights.workflowHealth.status,
      activeAlerts: insights.predictiveAlerts.filter((alert: any) => 
        alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
      ),
      teamEffectiveness: insights.teamCollaboration.effectivenessScore,
      urgentActions: insights.predictiveAlerts.map((alert: any) => ({
        type: alert.type,
        message: alert.message,
        action: alert.suggestedAction,
        timeframe: alert.timeframe
      }))
    };

    res.json({
      success: true,
      healthMetrics
    });
  } catch (error: any) {
    logger.error('Failed to get workflow health metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health metrics generation failed'
    });
  }
});

// Generate meeting summary with AI
router.post('/collaborative/meeting-summary', async (req: any, res) => {
  try {
    const { meetingTranscript, publishingId } = req.body;
    
    const summary = await workflowAI.generateMeetingSummary(meetingTranscript, publishingId);

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    logger.error('Failed to generate meeting summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Meeting summary generation failed'
    });
  }
});

export { router as aiWorkflowRouter };