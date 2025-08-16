import express from 'express';
import { PublishingService } from '../services/PublishingService';
import { TemplateService } from '../services/TemplateService';
import { CollaborativeWorkflowService } from '../services/CollaborativeWorkflowService';
import { DistributionService } from '../services/DistributionService';
import { NotificationService } from '../services/NotificationService';
import { authMiddleware, requirePermission } from '../middleware/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Initialize services
const publishingService = new PublishingService();
const templateService = new TemplateService();
const collaborativeWorkflowService = new CollaborativeWorkflowService();
const distributionService = new DistributionService();
const notificationService = new NotificationService();

// Apply authentication to all routes
router.use(authMiddleware);

// PUBLISHING WORKFLOWS

// Create publishing workflow
router.post('/workflows', async (req: any, res) => {
  try {
    const workflow = await publishingService.createPublishingWorkflow(
      req.body,
      req.user.organizationId,
      req.user.id
    );

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    logger.error('Failed to create publishing workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    });
  }
});

// Submit document for publishing
router.post('/submit', async (req: any, res) => {
  try {
    const publishing = await publishingService.submitForPublishing(
      req.body,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      publishing
    });
  } catch (error) {
    logger.error('Failed to submit for publishing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit for publishing'
    });
  }
});

// Process approval/rejection
router.post('/approvals', async (req: any, res) => {
  try {
    const approval = await publishingService.processApproval(
      req.body,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      approval
    });
  } catch (error) {
    logger.error('Failed to process approval:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process approval'
    });
  }
});

// Publish document
router.post('/:publishingId/publish', async (req: any, res) => {
  try {
    const success = await publishingService.publishDocument(
      req.params.publishingId,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success,
      message: success ? 'Document published successfully' : 'Failed to publish document'
    });
  } catch (error) {
    logger.error('Failed to publish document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish document'
    });
  }
});

// Get publishing dashboard
router.get('/dashboard', async (req: any, res) => {
  try {
    const dashboard = await publishingService.getPublishingDashboard(
      req.user.organizationId,
      req.user.id
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error('Failed to get publishing dashboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard'
    });
  }
});

// PUBLISHING TEMPLATES

// Create publishing template
router.post('/templates', async (req: any, res) => {
  try {
    const template = await templateService.createTemplate(
      req.body,
      req.user.organizationId,
      req.user.id
    );

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Failed to create template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template'
    });
  }
});

// Get all templates
router.get('/templates', async (req: any, res) => {
  try {
    const { templateType } = req.query;
    
    const templates = await templateService.getTemplates(
      req.user.organizationId,
      templateType as any
    );

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Failed to get templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates'
    });
  }
});

// Apply template to document
router.post('/templates/apply', async (req: any, res) => {
  try {
    const result = await templateService.applyTemplate(
      req.body,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Failed to apply template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply template'
    });
  }
});

// Preview template
router.get('/templates/:templateId/preview', async (req: any, res) => {
  try {
    const previewBuffer = await templateService.previewTemplate(
      req.params.templateId,
      req.user.organizationId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="template-preview.pdf"');
    res.send(previewBuffer);

  } catch (error) {
    logger.error('Failed to preview template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview template'
    });
  }
});

// COLLABORATIVE WORKFLOWS

// Create collaborative review
router.post('/collaborative/review', async (req: any, res) => {
  try {
    const publishing = await collaborativeWorkflowService.createCollaborativeReview(
      req.body,
      req.user.organizationId,
      req.user.id
    );

    res.json({
      success: true,
      publishing
    });
  } catch (error) {
    logger.error('Failed to create collaborative review:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collaborative review'
    });
  }
});

// Create collaborative editing session
router.post('/collaborative/editing-session', async (req: any, res) => {
  try {
    const { documentId, participantIds } = req.body;
    
    const session = await collaborativeWorkflowService.createEditingSession(
      documentId,
      participantIds,
      req.user.organizationId
    );

    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('Failed to create editing session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create editing session'
    });
  }
});

// Record collaborative change
router.post('/collaborative/changes', async (req: any, res) => {
  try {
    const { sessionId, changeType, description, data } = req.body;
    
    const success = await collaborativeWorkflowService.recordCollaborativeChange(
      sessionId,
      req.user.id,
      changeType,
      description,
      data
    );

    res.json({
      success,
      message: success ? 'Change recorded successfully' : 'Failed to record change'
    });
  } catch (error) {
    logger.error('Failed to record collaborative change:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record change'
    });
  }
});

// Acquire document lock
router.post('/collaborative/lock', async (req: any, res) => {
  try {
    const { sessionId, lockDurationMinutes } = req.body;
    
    const success = await collaborativeWorkflowService.acquireDocumentLock(
      sessionId,
      req.user.id,
      lockDurationMinutes
    );

    res.json({
      success,
      message: success ? 'Document lock acquired' : 'Failed to acquire lock'
    });
  } catch (error) {
    logger.error('Failed to acquire document lock:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acquire lock'
    });
  }
});

// Release document lock
router.delete('/collaborative/lock/:sessionId', async (req: any, res) => {
  try {
    const success = await collaborativeWorkflowService.releaseDocumentLock(
      req.params.sessionId,
      req.user.id
    );

    res.json({
      success,
      message: success ? 'Document lock released' : 'Failed to release lock'
    });
  } catch (error) {
    logger.error('Failed to release document lock:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release lock'
    });
  }
});

// Process collaborative approval
router.post('/collaborative/approvals', async (req: any, res) => {
  try {
    const { publishingId, stepId, decision, comments, conditions } = req.body;
    
    const result = await collaborativeWorkflowService.processCollaborativeApproval(
      publishingId,
      stepId,
      req.user.id,
      decision,
      comments,
      conditions
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Failed to process collaborative approval:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process approval'
    });
  }
});

// Resolve workflow conflict
router.post('/collaborative/resolve-conflict', async (req: any, res) => {
  try {
    req.body.resolvedBy = req.user.id; // Add resolver ID
    
    const success = await collaborativeWorkflowService.resolveConflict(
      req.body,
      req.user.organizationId
    );

    res.json({
      success,
      message: success ? 'Conflict resolved successfully' : 'Failed to resolve conflict'
    });
  } catch (error) {
    logger.error('Failed to resolve conflict:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve conflict'
    });
  }
});

// Get collaborative workflow status
router.get('/collaborative/:publishingId/status', async (req: any, res) => {
  try {
    const status = await collaborativeWorkflowService.getCollaborativeWorkflowStatus(
      req.params.publishingId,
      req.user.organizationId
    );

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Failed to get workflow status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow status'
    });
  }
});

// DOCUMENT DISTRIBUTION

// Create distribution
router.post('/distribution', async (req: any, res) => {
  try {
    const distribution = await distributionService.createDistribution(
      req.body,
      req.user.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      distribution
    });
  } catch (error) {
    logger.error('Failed to create distribution:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create distribution'
    });
  }
});

// Get distribution analytics
router.get('/distribution/analytics', async (req: any, res) => {
  try {
    const { from, to } = req.query;
    let dateRange;
    
    if (from && to) {
      dateRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const analytics = await distributionService.getDistributionAnalytics(
      req.user.organizationId,
      dateRange
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get distribution analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics'
    });
  }
});

// NOTIFICATIONS

// Get user notifications
router.get('/notifications', async (req: any, res) => {
  try {
    const { unreadOnly, notificationType, limit, offset } = req.query;
    
    const options = {
      unreadOnly: unreadOnly === 'true',
      notificationType: notificationType as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await notificationService.getUserNotifications(
      req.user.id,
      options
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req: any, res) => {
  try {
    const success = await notificationService.markAsRead(
      req.params.notificationId,
      req.user.id
    );

    res.json({
      success,
      message: success ? 'Notification marked as read' : 'Notification not found or already read'
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as read'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req: any, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      count,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all as read'
    });
  }
});

// Send notification digest
router.post('/notifications/digest', async (req: any, res) => {
  try {
    const { digestType } = req.body;
    
    const success = await notificationService.sendNotificationDigest(
      req.user.id,
      digestType
    );

    res.json({
      success,
      message: success ? 'Digest sent successfully' : 'Failed to send digest'
    });
  } catch (error) {
    logger.error('Failed to send notification digest:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send digest'
    });
  }
});

export { router as publishingRouter };