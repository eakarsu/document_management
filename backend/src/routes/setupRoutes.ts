import { Express } from 'express';
import path from 'path';
import { healthRouter } from './health';
import { documentsRouter } from './documents';
import { publishingRouter } from './publishing';
import { aiWorkflowRouter } from './aiWorkflow';
import eightStageWorkflowRouter from './eightStageWorkflow';
import editorRouter from './editor';
import feedbackProcessorRouter from './feedbackProcessor';
import oprWorkflowFeedbackRouter from './oprWorkflowFeedback';
import exportRouter from './export';
import exportPerfectRouter from './export-perfect';
import aiDocumentGeneratorRouter from './ai-document-generator';
import workflowRouter from './workflow';
import workflowsRouter from './workflows';
import distributionRouter from './distribution';
import usersRouter from './users';
import attachmentsRouter from './attachments';
import versionsRouter from './versions';
import { authController } from '../controllers/auth/authController';
import { versionController } from '../controllers/documents/versionController';
import { documentController } from '../controllers/documents/documentController';
import { taskController } from '../controllers/tasks/taskController';
import { dashboardController } from '../controllers/dashboard/dashboardController';
import { searchController } from '../controllers/search/searchController';
import { authenticateToken } from '../middleware/authenticateToken';
import { upload } from '../middleware/upload/multerConfig';
import { workflowInstancesRouter } from './workflow-instances';
import headersRouter from './headers';
import imagesRouter from './images';

export function setupRoutes(app: Express) {
  // Serve uploaded files
  app.use('/uploads', require('express').static(path.join(__dirname, '../../uploads')));

  // Health check route
  app.use('/health', healthRouter);

  // Document routes
  app.use('/api/documents', documentsRouter);

  // Publishing routes
  app.use('/api/publishing', publishingRouter);

  // AI Workflow routes
  app.use('/api/ai-workflow', aiWorkflowRouter);

  // 8-Stage Workflow routes
  app.use('/api/workflow/8-stage', eightStageWorkflowRouter);

  // Editor routes
  app.use('/api/editor', editorRouter);

  // Export routes (PDF, DOCX, etc.)
  app.use('/api/export', exportRouter);
  app.use('/api/export-perfect', exportPerfectRouter);

  // AI Document Generator route
  app.use('/api/ai-document-generator', aiDocumentGeneratorRouter);

  // Feedback Processor routes (OpenRouter AI)
  app.use('/api/feedback-processor', feedbackProcessorRouter);

  // OPR Workflow Feedback routes (Stage 3 & 7 feedback)
  app.use('/api/opr-workflow-feedback', oprWorkflowFeedbackRouter);

  // Pluggable Workflow System routes
  app.use('/api/workflow', workflowRouter);

  // Register JSON workflows route
  app.use('/api/workflows', workflowsRouter);

  // Distribution routes (for workflow document distribution)
  app.use('/api/workflows', distributionRouter);

  // User management routes
  app.use('/api', usersRouter);

  // Attachment routes
  app.use('/api', attachmentsRouter);

  // Version control routes
  app.use('/api', versionsRouter);

  // Workflow instances routes
  app.use('/api/workflow-instances', workflowInstancesRouter);

  // Header templates routes
  app.use(headersRouter);

  // Image serving routes
  app.use('/api/images', imagesRouter);

  // ===== AUTHENTICATION ENDPOINTS =====
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/refresh', authController.refresh);
  app.post('/api/auth/logout', authenticateToken, authController.logout);
  app.get('/api/auth/me', authenticateToken, authController.getMe);

  // ===== TASK ENDPOINTS =====
  app.get('/api/tasks', authenticateToken, taskController.getUserTasks);
  app.get('/api/workflow/tasks', authenticateToken, taskController.getWorkflowTasks);

  // ===== DOCUMENT VERSION ENDPOINTS =====
  app.post('/api/documents/:id/versions', upload.single('file'), versionController.createVersion);
  app.get('/api/documents/:id/versions', versionController.getVersionHistory);
  app.get('/api/documents/:id/versions/:from/compare/:to', versionController.compareVersions);
  app.get('/api/documents/:id/versions/:versionNumber', versionController.getVersionDetails);

  // ===== DOCUMENT ENDPOINTS =====
  app.put('/api/documents/:id/status/:status', authenticateToken, documentController.updateStatus);
  app.get('/api/documents/:id/view', authenticateToken, documentController.viewDocument);

  // ===== DASHBOARD ENDPOINTS =====
  app.get('/api/dashboard/stats', authenticateToken, dashboardController.getStats);

  // ===== SEARCH ENDPOINTS =====
  app.get('/api/search/suggest', authenticateToken, searchController.suggest);
  app.get('/api/search/stats', authenticateToken, searchController.getStats);
  app.get('/api/search/health', searchController.healthCheck);
  app.post('/api/search/reindex', authenticateToken, searchController.reindex);
}