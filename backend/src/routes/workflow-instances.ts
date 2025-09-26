import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import winston from 'winston';

const router = Router();
const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Get workflow instance by document ID
router.get('/:documentId', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;

    // First check if the document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user has access - allow workflow participants (LEGAL, reviewers, etc.)
    const hasBasicAccess = document.organizationId === req.user.organizationId ||
                          document.createdById === req.user.id;

    // Check role from multiple possible sources
    const userRole = req.user.role?.name || req.user.role || req.user.roleType || req.user.roleName || '';
    console.log('User access check - User ID:', req.user.id, 'Role:', userRole, 'Email:', req.user.email);
    console.log('Document org:', document.organizationId, 'User org:', req.user.organizationId);
    console.log('Has basic access:', hasBasicAccess);

    const isWorkflowParticipant = userRole && typeof userRole === 'string' && [
      'LEGAL', 'LEGAL_REVIEWER', 'SUB_REVIEWER', 'REVIEWER',
      'COORDINATOR', 'PCM', 'ACTION_OFFICER', 'LEADERSHIP', 'ADMIN', 'AFDPO'
    ].includes(userRole.toUpperCase());

    console.log('Is workflow participant:', isWorkflowParticipant);

    if (!hasBasicAccess && !isWorkflowParticipant) {
      console.log('Access denied for user:', req.user.id, 'Role:', userRole);
      return res.status(404).json({
        success: false,
        error: 'Document not found or access denied'
      });
    }

    console.log('Access granted for user:', req.user.id, 'Role:', userRole);

    // Get workflow instance for this document
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId
      },
      include: {
        history: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!workflowInstance) {
      // Return empty response (no workflow for this document)
      return res.json({
        active: false,
        workflowId: null,
        currentStageId: null,
        history: [],
        metadata: {}
      });
    }

    // Parse the metadata JSON field if needed and rename isActive to active
    const response = {
      ...workflowInstance,
      active: workflowInstance.isActive,  // Rename isActive to active for frontend compatibility
      metadata: typeof workflowInstance.metadata === 'string'
        ? JSON.parse(workflowInstance.metadata as string)
        : workflowInstance.metadata,
      // Include history and completion status for frontend
      isCompleted: workflowInstance.completedAt !== null
    };

    // Return the workflow instance directly (not wrapped in success/workflow)
    res.json(response);

  } catch (error: any) {
    logger.error('Failed to get workflow instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow instance'
    });
  }
});

// Start a new workflow for a document
router.post('/:documentId/start', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const { workflowId } = req.body;

    // Check document access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { organizationId: req.user.organizationId },
          { createdById: req.user.id }
        ]
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or access denied'
      });
    }

    // Check if workflow instance already exists and is active
    const existing = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Workflow already active for this document'
      });
    }

    // Create new workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId,
        workflowId: workflowId || 'af-12-stage-review',
        currentStageId: '1',
        isActive: true,
        metadata: JSON.stringify({
          documentType: document.category || 'standard',
          title: document.title,
          startedAt: new Date().toISOString(),
          startedBy: req.user.id
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create initial history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: '1',
        stageName: 'Initial Draft Preparation',
        action: 'workflow_started',
        performedBy: req.user.id,
        metadata: JSON.stringify({
          documentTitle: document.title,
          workflowName: 'Air Force 12-Stage Review'
        })
      }
    });

    res.json({
      success: true,
      workflow: workflowInstance,
      message: 'Workflow started successfully'
    });

  } catch (error: any) {
    logger.error('Failed to start workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start workflow'
    });
  }
});

// Create or update workflow instance
router.post('/:documentId', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const data = req.body;

    // Check document access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { organizationId: req.user.organizationId },
          { createdById: req.user.id }
        ]
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or access denied'
      });
    }

    // Check if workflow instance exists
    const existing = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId }
    });

    let workflowInstance;
    if (existing) {
      // Update existing
      workflowInstance = await prisma.jsonWorkflowInstance.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      workflowInstance = await prisma.jsonWorkflowInstance.create({
        data: {
          ...data,
          documentId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      workflow: workflowInstance
    });

  } catch (error: any) {
    logger.error('Failed to update workflow instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workflow instance'
    });
  }
});

// Advance workflow to next stage
router.post('/:documentId/advance', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const { targetStageId, action, metadata } = req.body;

    // Get current workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!workflowInstance) {
      return res.status(404).json({
        success: false,
        error: 'No active workflow found for this document'
      });
    }

    // Update workflow instance to new stage
    const updatedInstance = await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        currentStageId: targetStageId,
        updatedAt: new Date(),
        metadata: JSON.stringify({
          ...(typeof workflowInstance.metadata === 'object' ? workflowInstance.metadata : {}),
          lastAction: action,
          lastActionAt: new Date().toISOString(),
          ...metadata
        })
      }
    });

    // Add history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: targetStageId,
        stageName: action || 'Stage ' + targetStageId,
        action,
        performedBy: req.user.id,
        metadata: JSON.stringify(metadata || {})
      }
    });

    // Check if workflow is complete (stage 12 is the final stage)
    const isComplete = targetStageId === '12';
    if (isComplete) {
      await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          isActive: false,
          completedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      workflow: updatedInstance,
      isComplete,
      currentStage: targetStageId,
      message: `Workflow ${isComplete ? 'completed' : 'advanced'} successfully`
    });

  } catch (error: any) {
    logger.error('Failed to advance workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to advance workflow'
    });
  }
});

// Reset workflow - removes the workflow instance completely
router.post('/:documentId/reset', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;

    // Get workflow instance (active or completed)
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId
      }
    });

    if (!workflowInstance) {
      return res.status(404).json({
        success: false,
        error: 'No workflow found for this document'
      });
    }

    // Store workflow info for history
    const workflowInfo = {
      workflowId: workflowInstance.workflowId,
      lastStage: workflowInstance.currentStageId,
      wasCompleted: workflowInstance.completedAt !== null
    };

    // Delete all workflow history first (due to foreign key constraint)
    await prisma.jsonWorkflowHistory.deleteMany({
      where: {
        workflowInstanceId: workflowInstance.id
      }
    });

    // Delete the workflow instance
    await prisma.jsonWorkflowInstance.delete({
      where: {
        id: workflowInstance.id
      }
    });

    res.json({
      success: true,
      message: 'Workflow completely reset. You can now start a new workflow.',
      removedWorkflow: workflowInfo
    });

  } catch (error: any) {
    logger.error('Failed to reset workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset workflow'
    });
  }
});

// Get all workflow instances (admin only)
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { status, stage, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (stage) where.currentStageId = stage;

    // Only admin can see all, others see their org's workflows
    if (req.user.role?.name !== 'Admin') {
      where.document = {
        organizationId: req.user.organizationId
      };
    }

    const workflows = await prisma.jsonWorkflowInstance.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        document: {
          select: {
            id: true,
            title: true,
            status: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const total = await prisma.jsonWorkflowInstance.count({ where });

    res.json({
      success: true,
      workflows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error: any) {
    logger.error('Failed to list workflow instances:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list workflow instances'
    });
  }
});

// Complete workflow (for final publish)
router.post('/:documentId/complete', authMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const { action, metadata } = req.body;

    // Get current workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!workflowInstance) {
      return res.status(404).json({
        success: false,
        error: 'No active workflow found for this document'
      });
    }

    // Update workflow instance to complete - keep currentStageId as 11 for UI
    const updated = await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        currentStageId: '11', // Keep at stage 11 for UI to show completion
        isActive: false,
        completedAt: new Date(),
        metadata: JSON.stringify({
          ...(typeof workflowInstance.metadata === 'string'
            ? JSON.parse(workflowInstance.metadata as string)
            : workflowInstance.metadata),
          ...metadata,
          completionAction: action,
          completedAt: new Date().toISOString()
        })
      }
    });

    // Add final history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: workflowInstance.currentStageId,
        stageName: 'Workflow Completed',
        action: action === 'publish' ? 'Published Document' : 'Completed Workflow',
        performedBy: req.user?.email || 'system',
        metadata: JSON.stringify({
          completedAt: new Date().toISOString(),
          finalStage: workflowInstance.currentStageId,
          action
        })
      }
    });

    // Update document status to published
    if (action === 'publish') {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PUBLISHED',
          updatedAt: new Date()
        }
      });
    }

    logger.info('Workflow completed successfully:', {
      documentId,
      workflowId: workflowInstance.id,
      action
    });

    res.json({
      success: true,
      message: action === 'publish'
        ? 'Document published and workflow completed successfully!'
        : 'Workflow completed successfully!',
      isComplete: true,
      workflow: updated
    });

  } catch (error: any) {
    logger.error('Failed to complete workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete workflow'
    });
  }
});

export { router as workflowInstancesRouter };