import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateDocumentGenerationRequest } from '../middleware/ai-document';
import { GeneratorController } from '../controllers/ai-document';

const router = Router();
const generatorController = new GeneratorController();

/**
 * POST /api/ai-document-generator
 * Generate AI document with specified template and parameters
 */
router.post(
  '/',
  authMiddleware,
  validateDocumentGenerationRequest,
  async (req, res) => {
    await generatorController.generateDocument(req, res);
  }
);

/**
 * GET /api/ai-document-generator/status
 * Get generation service status and configuration
 */
router.get(
  '/status',
  authMiddleware,
  async (req, res) => {
    await generatorController.getGenerationStatus(req, res);
  }
);

/**
 * GET /api/ai-document-generator/templates
 * Get available document templates
 */
router.get(
  '/templates',
  authMiddleware,
  async (req, res) => {
    await generatorController.getAvailableTemplates(req, res);
  }
);

export default router;