import { Express } from 'express';
import { healthRouter } from './health';
import { documentsRouter } from './documents';
import { publishingRouter } from './publishing';
import editorRouter from './editor';
import workflowsRouter from './workflows';
import usersRouter from './users';
import attachmentsRouter from './attachments';
import passwordResetsRouter from './password-resets';
import passwordChangesRouter from './password-changes';
import csvExportsRouter from './csv-exports';
import pdfExportsRouter from './pdf-exports';
import confirmationDialogsRouter from './confirmation-dialogs';
import emailVerificationsRouter from './email-verifications';
import passwordStrengthRulesRouter from './password-strength-rules';
import inputSanitizationRulesRouter from './input-sanitization-rules';
import { authController } from '../controllers/auth/authController';
import { versionController } from '../controllers/documents/versionController';
import { documentController } from '../controllers/documents/documentController';
import { taskController } from '../controllers/tasks/taskController';
import { dashboardController } from '../controllers/dashboard/dashboardController';
import { searchController } from '../controllers/search/searchController';
import { authenticateToken } from '../middleware/authenticateToken';
import { upload } from '../middleware/upload/multerConfig';
import headersRouter from './headers';
import imagesRouter from './images';
import { retentionRouter } from './retention';
import complianceRouter from './compliance';
import redlineDiffRouter from './redlineDiff';
import classificationRouter from './classification';
import redactSuggestionsRouter from './redactSuggestions';
import versionSummaryRouter from './versionSummary';
import governedWorkflowRouter from './governed-workflow';

export function setupRoutes(app: Express) {
  // Health check route
  app.use('/health', healthRouter);

  // Public session-establishment routes must be registered before any router
  // that applies authentication at the `/api` mount point.
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/oidc/state', authController.oidcState);
  app.post('/api/auth/oidc/callback', authController.oidcCallback);
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/refresh', authController.refresh);
  app.post('/api/auth/logout', authenticateToken, authController.logout);
  app.get('/api/auth/me', authenticateToken, authController.getMe);

  // Document routes
  app.use('/api/documents', documentsRouter);

  // Publishing routes
  app.use('/api/publishing', publishingRouter);

  // Editor routes
  app.use('/api/editor', editorRouter);

  // Production-supported, transactional 12-stage workflow routes. This is
  // mounted first so it replaces the legacy in-memory handlers at the same URLs.
  app.use('/api/workflow', governedWorkflowRouter);

  // Read-only workflow catalogue. State changes are only exposed by the
  // governed transactional workflow router above.
  app.use('/api/workflows', workflowsRouter);

  // User management routes
  app.use('/api', usersRouter);

  // Attachment routes
  app.use('/api', attachmentsRouter);

  // 8 System Feature routes
  app.use('/api', passwordResetsRouter);
  app.use('/api', passwordChangesRouter);
  app.use('/api', csvExportsRouter);
  app.use('/api', pdfExportsRouter);
  app.use('/api', confirmationDialogsRouter);
  app.use('/api', emailVerificationsRouter);
  app.use('/api', passwordStrengthRulesRouter);
  app.use('/api', inputSanitizationRulesRouter);

  // Header templates routes
  app.use(headersRouter);

  // Image serving routes
  app.use('/api/images', imagesRouter);

  // Tenant-scoped retention, legal hold, export-manifest and deletion jobs.
  app.use('/api', retentionRouter);

  // AI Compliance Checker — score docs against org rule book.
  app.use('/api/compliance', complianceRouter);

  // AI Redline Diff Viewer — diff two versions + AI summary of changes.
  app.use('/api/redline', redlineDiffRouter);

  // AI Document Classification — primaryType + topics + tags per document.
  app.use('/api/classification', classificationRouter);

  // AI Redaction Suggestions — propose sensitive-text redactions.
  app.use('/api/redact-suggestions', redactSuggestionsRouter);

  // AI Version Change Narrative — single-document evolution story.
  app.use('/api/version-summary', versionSummaryRouter);
  // ===== TASK ENDPOINTS =====
  app.get('/api/tasks', authenticateToken, taskController.getUserTasks);
  app.get('/api/workflow/tasks', authenticateToken, taskController.getWorkflowTasks);

  // ===== DOCUMENT VERSION ENDPOINTS =====
  app.post('/api/documents/:id/versions', authenticateToken, upload.single('file'), versionController.createVersion);
  app.get('/api/documents/:id/versions', authenticateToken, versionController.getVersionHistory);
  app.get('/api/documents/:id/versions/:from/compare/:to', authenticateToken, versionController.compareVersions);
  app.get('/api/documents/:id/versions/:versionNumber', authenticateToken, versionController.getVersionDetails);

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
