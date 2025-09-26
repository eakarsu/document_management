import { Request, Response, NextFunction } from 'express';
import { DocumentGenerationRequest, CustomHeaderData } from '../../types/ai-document';

type ValidTemplate = string;

/**
 * Middleware to validate document generation request parameters
 */
export function validateDocumentGeneration(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      template = 'technical',
      pages = 5,
      feedbackCount = 10,
      sealImage,
      headerData
    }: DocumentGenerationRequest = req.body;

    // Validate template
    const validTemplates: ValidTemplate[] = [
      'technical', 'policy', 'training', 'sop',
      'af-manual', 'afi', 'afpd', 'afman', 'afjqs', 'afto', 'afva', 'afh', 'afgm', 'afmd',
      'dafi', 'dafman', 'dafpd',
      'army', 'navy', 'marine', 'spaceforce',
      'dodd', 'dodi', 'cjcs',
      'oplan', 'opord', 'conops', 'ttp'
    ];

    if (!validTemplates.includes(template as ValidTemplate)) {
      return res.status(400).json({
        error: 'Invalid template type',
        validTemplates: validTemplates,
        received: template
      });
    }

    // Validate pages
    if (typeof pages !== 'number' || pages < 1 || pages > 20) {
      return res.status(400).json({
        error: 'Pages must be a number between 1 and 20',
        received: pages
      });
    }

    // Validate feedbackCount
    if (typeof feedbackCount !== 'number' || feedbackCount < 0 || feedbackCount > 50) {
      return res.status(400).json({
        error: 'Feedback count must be a number between 0 and 50',
        received: feedbackCount
      });
    }

    // Validate sealImage (if provided)
    if (sealImage && typeof sealImage !== 'string') {
      return res.status(400).json({
        error: 'Seal image must be a valid base64 string',
        received: typeof sealImage
      });
    }

    // Validate headerData (if provided)
    if (headerData && typeof headerData !== 'object') {
      return res.status(400).json({
        error: 'Header data must be an object',
        received: typeof headerData
      });
    }

    // Validate specific headerData fields if provided
    if (headerData) {
      const stringFields = [
        'byOrderOf', 'secretary', 'organization', 'documentType', 'documentDate',
        'subject', 'category', 'compliance', 'accessibility', 'accessibilityUrl',
        'releasability', 'opr', 'certifiedBy', 'certifiedByName', 'supersedes',
        'classification', 'distributionStatement', 'changeNumber', 'versionNumber',
        'effectiveDate', 'reviewDate', 'pocName', 'pocDSN', 'pocCommercial', 'pocEmail'
      ];

      for (const field of stringFields) {
        if ((headerData as any)[field] && typeof (headerData as any)[field] !== 'string') {
          return res.status(400).json({
            error: `Header data field '${field}' must be a string`,
            received: typeof (headerData as any)[field]
          });
        }
      }

      // Validate totalPages if provided
      if (headerData.totalPages && (typeof headerData.totalPages !== 'number' || headerData.totalPages < 1)) {
        return res.status(400).json({
          error: 'Header data totalPages must be a positive number',
          received: headerData.totalPages
        });
      }

      // Validate classification level
      if (headerData.classification) {
        const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
        if (!validClassifications.includes(headerData.classification)) {
          return res.status(400).json({
            error: 'Invalid classification level',
            validClassifications: validClassifications,
            received: headerData.classification
          });
        }
      }
    }

    // Set validated values back to request body
    req.body = {
      template: template as ValidTemplate,
      pages: Number(pages),
      feedbackCount: Number(feedbackCount),
      sealImage,
      headerData
    };

    next();
  } catch (error: any) {
    console.error('Validation middleware error:', error);
    return res.status(400).json({
      error: 'Request validation failed',
      details: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }
}

/**
 * Middleware to validate request size and API key
 */
export function validateApiRequirements(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if OpenRouter API key is configured
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
      return res.status(500).json({
        error: 'AI document generation is not configured',
        details: 'OpenRouter API key is missing. Please configure OPENROUTER_API_KEY environment variable.'
      });
    }

    // Validate request body size (basic check)
    const bodySize = JSON.stringify(req.body).length;
    const maxBodySize = 1024 * 1024; // 1MB limit

    if (bodySize > maxBodySize) {
      return res.status(413).json({
        error: 'Request body too large',
        maxSize: '1MB',
        received: `${Math.round(bodySize / 1024)}KB`
      });
    }

    next();
  } catch (error: any) {
    console.error('API requirements validation error:', error);
    return res.status(500).json({
      error: 'API validation failed',
      details: error instanceof Error ? error.message : 'Unknown API validation error'
    });
  }
}

/**
 * Combined validation middleware for convenience
 */
export function validateDocumentGenerationRequest(req: Request, res: Response, next: NextFunction) {
  validateApiRequirements(req, res, (err) => {
    if (err) return next(err);
    validateDocumentGeneration(req, res, next);
  });
}