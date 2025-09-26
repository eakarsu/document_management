import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { logger } from '../config/logger';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/workflows/documents/:id/distribute
router.post('/documents/:id/distribute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { reviewerEmails, workflowInstanceId, stageId } = req.body;

    logger.info('Distribution request:', {
      documentId,
      reviewerEmails,
      workflowInstanceId,
      stageId
    });

    // Validate inputs
    if (!reviewerEmails || !Array.isArray(reviewerEmails) || reviewerEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one reviewer email is required'
      });
    }

    // Get current workflow instance to check stage
    const currentWorkflow = await prisma.jsonWorkflowInstance.findUnique({
      where: { id: workflowInstanceId }
    });

    if (!currentWorkflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }

    // Determine next stage based on current stage
    let nextStageId: string;
    let nextStageName: string;
    let fromStageName: string;

    if (currentWorkflow.currentStageId === '3') {
      // First Coordination - Distribution Phase
      nextStageId = '3.5';
      nextStageName = 'Review Collection Phase';
      fromStageName = 'First Coordination - Distribution Phase';
    } else if (currentWorkflow.currentStageId === '5') {
      // Second Coordination - Distribution Phase (distributes to reviewers for second round)
      nextStageId = '5.5';
      nextStageName = 'Second Review Collection Phase';
      fromStageName = 'Second Coordination - Distribution Phase';
    } else {
      return res.status(400).json({
        success: false,
        error: `Cannot distribute from stage ${currentWorkflow.currentStageId}. Distribution is only allowed from stages 3 and 5.`
      });
    }

    // Update workflow instance to next stage
    const updatedWorkflow = await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        currentStageId: nextStageId,
        metadata: JSON.stringify({
          distributedTo: reviewerEmails,
          distributedAt: new Date().toISOString(),
          distributedBy: (req as any).user?.email || 'system'
        })
      }
    });

    // Add to workflow history
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstanceId,
        stageId: nextStageId,
        stageName: nextStageName,
        action: 'Distribute to Reviewers',
        performedBy: (req as any).user?.email || 'system',
        metadata: JSON.stringify({
          distributedTo: reviewerEmails,
          fromStage: currentWorkflow.currentStageId,
          fromStageName: fromStageName,
          performedAt: new Date().toISOString()
        })
      }
    });

    logger.info('Document distributed successfully:', {
      documentId,
      workflowInstanceId,
      newStageId: nextStageId,
      reviewerCount: reviewerEmails.length
    });

    res.json({
      success: true,
      message: 'Document distributed successfully',
      distributedTo: reviewerEmails,
      newStage: {
        id: nextStageId,
        name: nextStageName
      }
    });

  } catch (error) {
    logger.error('Error distributing document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to distribute document'
    });
  }
});

// POST /api/workflows/documents/:id/submit-review
router.post('/documents/:id/submit-review', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { workflowInstanceId, review, reviewerEmail } = req.body;

    logger.info('Review submission:', {
      documentId,
      workflowInstanceId,
      reviewerEmail
    });

    // Get current workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findUnique({
      where: { id: workflowInstanceId }
    });

    if (!workflowInstance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }

    // Add review to metadata
    const metadata = typeof workflowInstance.metadata === 'string'
      ? JSON.parse(workflowInstance.metadata)
      : workflowInstance.metadata || {};

    if (!metadata.reviews) {
      metadata.reviews = [];
    }

    metadata.reviews.push({
      reviewerEmail,
      review,
      submittedAt: new Date().toISOString()
    });

    await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    });

    logger.info('Review submitted successfully:', {
      documentId,
      workflowInstanceId,
      reviewerEmail
    });

    res.json({
      success: true,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit review'
    });
  }
});

export default router;