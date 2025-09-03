import { Router, Request, Response } from 'express';
import { EightStageWorkflowService } from '../services/EightStageWorkflowService';
import { authMiddleware } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    organizationId: string;
  };
}

const router = Router();
const workflowService = new EightStageWorkflowService();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Start 8-stage workflow
router.post('/start/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const result = await workflowService.createWorkflowInstance({
      documentId,
      oprUserId: userId,
      organizationId,
      metadata: req.body.metadata || {}
    });

    res.json(result);
  } catch (error) {
    console.error('Error starting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Advance workflow to next stage
router.post('/advance/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { fromStage, toStage, transitionData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let result;
    
    switch (toStage) {
      case 'INTERNAL_COORDINATION':
        result = await workflowService.advanceToInternalCoordination({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'OPR_REVISIONS':
        result = await workflowService.advanceToOPRRevisions({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'EXTERNAL_COORDINATION':
        result = await workflowService.advanceToExternalCoordination({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'OPR_FINAL':
        result = await workflowService.advanceToOPRFinal({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'LEGAL_REVIEW':
        result = await workflowService.advanceToLegalReview({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'OPR_LEGAL':
        result = await workflowService.advanceToOPRLegal({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'FINAL_PUBLISHING':
        result = await workflowService.advanceToFinalPublishing({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      case 'PUBLISHED':
        result = await workflowService.advanceToPublished({
          workflowInstanceId: workflowId,
          fromStage,
          toStage,
          userId,
          transitionData
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid target stage: ${toStage}`
        });
    }

    res.json(result);
  } catch (error) {
    console.error('Error advancing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to advance workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit ICU feedback
router.post('/icu/:workflowId/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { feedback, comments } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const result = await workflowService.submitICUFeedback({
      workflowInstanceId: workflowId,
      userId,
      feedback,
      comments,
      reviewCompletionDate: new Date()
    });

    res.json(result);
  } catch (error) {
    console.error('Error submitting ICU feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow status
router.get('/status/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const result = await workflowService.getWorkflowStatus(workflowId);
    res.json(result);
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow by document ID
router.get('/document/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const result = await workflowService.getWorkflowByDocumentId(documentId);
    res.json(result);
  } catch (error) {
    console.error('Error getting workflow by document ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Move workflow backward (bidirectional)
router.post('/move-backward/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { fromStage, toStage, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!fromStage || !toStage || !reason) {
      return res.status(400).json({
        success: false,
        message: 'fromStage, toStage, and reason are required'
      });
    }

    const result = await workflowService.moveWorkflowBackward({
      workflowInstanceId: workflowId,
      fromStage,
      toStage,
      userId,
      reason,
      transitionData: req.body.transitionData
    });

    res.json(result);
  } catch (error) {
    console.error('Error moving workflow backward:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to move workflow backward'
    });
  }
});

// Get workflow history with enhanced details
router.get('/history/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    
    const result = await workflowService.getWorkflowHistory(workflowId);
    res.json(result);
  } catch (error) {
    console.error('Error getting workflow history:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get workflow history'
    });
  }
});

// Advance workflow with role validation
router.post('/advance-with-validation/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { fromStage, toStage, requiredRole } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!fromStage || !toStage) {
      return res.status(400).json({
        success: false,
        message: 'fromStage and toStage are required'
      });
    }

    const result = await workflowService.transitionStageWithRoleValidation({
      workflowInstanceId: workflowId,
      fromStage,
      toStage,
      userId,
      requiredRole,
      transitionData: req.body.transitionData
    });

    res.json(result);
  } catch (error) {
    console.error('Error advancing workflow with role validation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to advance workflow'
    });
  }
});

// Submit feedback for any role (generic endpoint)
router.post('/:workflowId/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { stage, feedback, comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role?.name;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const result = await workflowService.submitGenericFeedback({
      workflowInstanceId: workflowId,
      userId,
      userRole: userRole || '',
      stage,
      feedback,
      comments,
      reviewCompletionDate: new Date()
    });

    res.json(result);
  } catch (error) {
    console.error('Error submitting generic feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get role-specific UI configuration
router.get('/role-config/:stage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stage } = req.params;
    const userRole = req.user?.role?.name;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const config = await workflowService.getRoleSpecificConfig(stage, userRole);
    res.json(config);
  } catch (error) {
    console.error('Error getting role config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get role configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user permissions for current stage
router.get('/permissions/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const userRole = req.user?.role?.name;
    const userId = req.user?.id;

    if (!userRole || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const permissions = await workflowService.getUserPermissionsForWorkflow(workflowId, userId, userRole);
    res.json(permissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset workflow (Admin only)
router.post('/reset/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role?.name;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin (handle different case variations)
    const isAdmin = userRole === 'ADMIN' || userRole === 'WORKFLOW_ADMIN' || userRole === 'Admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reset workflows'
      });
    }

    const result = await workflowService.resetWorkflow(workflowId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error resetting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;