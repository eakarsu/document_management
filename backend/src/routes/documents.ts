import express from 'express';
import multer from 'multer';
import { DocumentService } from '../services/DocumentService';
import { StorageService } from '../services/StorageService';
import { SearchService } from '../services/SearchService';
import { authMiddleware, requirePermission } from '../middleware/auth';
import winston from 'winston';
import { PrismaClient } from '@prisma/client';
import { getTemplateContent, getTemplateName } from '../templates/documentTemplates';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Initialize services
const documentService = new DocumentService();
const storageService = new StorageService();
const searchService = new SearchService();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    // TODO: Add file type restrictions based on organization settings
    cb(null, true);
  }
});

// Middleware to apply to all document routes
router.use(authMiddleware);

// Create document with template
router.post('/create-with-template',
  async (req: any, res) => {
    try {
      const {
        title,
        templateId,
        category,
        description,
        tags,
        folderId
      } = req.body;

      // Get template content
      const templateContent = getTemplateContent(templateId || 'blank');
      const templateName = getTemplateName(templateId || 'blank');

      // Create document with template content in customFields
      const prisma = new PrismaClient();
      
      // Generate a unique file name for the document
      const fileName = `${title || templateName}_${Date.now()}.html`;
      const storagePath = `documents/${req.user.organizationId}/${fileName}`;
      
      // Create a unique checksum for the content with timestamp to avoid conflicts
      const crypto = require('crypto');
      const uniqueContent = `${templateContent}-${Date.now()}-${Math.random()}`;
      const checksum = crypto.createHash('md5').update(uniqueContent).digest('hex');
      
      const document = await prisma.document.create({
        data: {
          title: title || templateName,
          description: description || `Created from ${templateName} template`,
          fileName: fileName,
          originalName: fileName,
          mimeType: 'text/html',
          fileSize: Buffer.byteLength(templateContent, 'utf8'),
          checksum: checksum,
          storagePath: storagePath,
          category: category || 'GENERAL',
          status: 'DRAFT',
          currentVersion: 1,
          createdById: req.user.id,
          organizationId: req.user.organizationId,
          tags: tags || [],
          customFields: {
            templateId: templateId,
            createdFrom: 'template',
            content: templateContent // Store HTML content in customFields
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Create initial version
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          title: document.title,
          fileName: fileName,
          fileSize: Buffer.byteLength(templateContent, 'utf8'),
          checksum: checksum,
          storagePath: storagePath,
          changeType: 'MINOR',
          changeNotes: 'Initial version created from template',
          createdById: req.user.id
        }
      });

      logger.info('Document created from template', {
        documentId: document.id,
        templateId: templateId,
        userId: req.user.id
      });

      res.json({
        success: true,
        document
      });

    } catch (error) {
      logger.error('Document creation from template failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      });
    }
  }
);

// Upload single document
router.post('/upload', 
  upload.single('file'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const {
        title,
        description,
        category,
        tags,
        customFields,
        folderId,
        parentDocumentId
      } = req.body;

      // Parse tags if it's a string
      let parsedTags: string[] = [];
      if (tags) {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      // Parse custom fields if it's a string
      let parsedCustomFields: Record<string, any> = {};
      if (customFields) {
        parsedCustomFields = typeof customFields === 'string' 
          ? JSON.parse(customFields) 
          : customFields;
      }

      // Create document
      const document = await documentService.createDocument(
        {
          title: title || req.file.originalname,
          description,
          fileName: req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileBuffer: req.file.buffer,
          category,
          tags: parsedTags,
          customFields: parsedCustomFields,
          folderId,
          parentDocumentId
        },
        req.user.id,
        req.user.organizationId
      );

      logger.info('Document uploaded successfully', {
        documentId: document?.id,
        title: document?.title,
        userId: req.user.id
      });

      res.json({
        success: true,
        document
      });

    } catch (error) {
      logger.error('Document upload failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }
);

// Upload multiple documents
router.post('/upload/batch',
  upload.array('files', 10),
  async (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const {
        category,
        tags,
        customFields,
        folderId,
        parentDocumentId
      } = req.body;

      // Parse tags if it's a string
      let parsedTags: string[] = [];
      if (tags) {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      // Parse custom fields if it's a string
      let parsedCustomFields: Record<string, any> = {};
      if (customFields) {
        parsedCustomFields = typeof customFields === 'string' 
          ? JSON.parse(customFields) 
          : customFields;
      }

      const results = [];

      // Process each file
      for (const file of req.files) {
        try {
          const document = await documentService.createDocument(
            {
              title: file.originalname,
              fileName: file.originalname,
              originalName: file.originalname,
              mimeType: file.mimetype,
              fileBuffer: file.buffer,
              category,
              tags: parsedTags,
              customFields: parsedCustomFields,
              folderId,
              parentDocumentId
            },
            req.user.id,
            req.user.organizationId
          );

          results.push({
            success: true,
            document,
            filename: file.originalname
          });

        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
            filename: file.originalname
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      logger.info('Batch upload completed', {
        totalFiles: req.files.length,
        successCount,
        userId: req.user.id
      });

      res.json({
        success: successCount > 0,
        results,
        summary: {
          total: req.files.length,
          successful: successCount,
          failed: req.files.length - successCount
        }
      });

    } catch (error) {
      logger.error('Batch upload failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch upload failed'
      });
    }
  }
);

// Download document
router.get('/:id/download',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;

      // Get document info
      const document = await documentService.getDocumentById(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get file content
      const fileContent = await documentService.getDocumentContent(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!fileContent) {
        return res.status(404).json({
          success: false,
          error: 'File content not found'
        });
      }

      // Set headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', fileContent.length);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Send file
      res.send(fileContent);

    } catch (error) {
      logger.error('Document download failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      });
    }
  }
);

// Preview document (inline display)
router.get('/:id/preview',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;

      // Get document info
      const document = await documentService.getDocumentById(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get file content
      const fileContent = await documentService.getDocumentContent(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!fileContent) {
        return res.status(404).json({
          success: false,
          error: 'File content not found'
        });
      }

      // Set headers for inline display
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', fileContent.length);
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Send file
      res.send(fileContent);

    } catch (error) {
      logger.error('Document preview failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Preview failed'
      });
    }
  }
);

// Get document thumbnail
router.get('/:id/thumbnail',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;

      // Get document info
      const document = await documentService.getDocumentById(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get thumbnail URL
      const thumbnailUrl = await storageService.getThumbnailUrl(document.storagePath);

      if (!thumbnailUrl) {
        return res.status(404).json({
          success: false,
          error: 'Thumbnail not found'
        });
      }

      // Redirect to thumbnail URL (for MinIO presigned URLs)
      res.redirect(thumbnailUrl);

    } catch (error) {
      logger.error('Thumbnail fetch failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Thumbnail fetch failed'
      });
    }
  }
);

// Document version creation is handled in server.ts with DocumentService
// No version endpoint needed in routes - using server.ts endpoints for binary diff functionality

// Search documents - Enhanced with Elasticsearch
router.get('/search',
  async (req: any, res) => {
    try {
      console.log('🚀 Document search endpoint reached with query:', req.query);
      const { 
        q, 
        category, 
        status, 
        folderId, 
        createdBy, 
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // If there's a search query, use Elasticsearch for full-text search
      if (q && typeof q === 'string' && q.trim()) {
        console.log('🔍 Starting Elasticsearch search for query:', q.trim());
        try {
          const searchResults = await searchService.search(
            req.user.organizationId,
            {
              query: q.trim(),
              filters: {
                ...(category && { category: category as string }),
                ...(status && { status: status as string })
              },
              size: parseInt(limit as string) || 20,
              from: ((parseInt(page as string) || 1) - 1) * (parseInt(limit as string) || 20)
            }
          );
          console.log('📊 Elasticsearch results:', { total: searchResults.total, documents: searchResults.documents.length });

          const documents = await Promise.all(
            searchResults.documents.map(async (hit: any) => {
              const doc = await prisma.document.findFirst({
                where: { 
                  id: hit.id,
                  status: { not: 'DELETED' }  // Filter out deleted documents
                },
                include: {
                  createdBy: {
                    select: { firstName: true, lastName: true, email: true }
                  },
                  folder: {
                    select: { name: true }
                  }
                }
              });
              return doc;
            })
          ).then(docs => docs.filter(doc => doc !== null));

          return res.json({
            success: true,
            documents,
            totalCount: searchResults.total,
            query: q.trim(),
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 20
          });

        } catch (esError) {
          console.error('⚠️ Elasticsearch search failed, falling back to database:', esError);
          // Fall through to database search below
        }
      }

      // Fallback to database search for non-text queries
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let where: any = {};

      // Organization filter (always applied for authenticated users)
      where.organizationId = req.user.organizationId;
      
      // Filter out deleted documents
      where.status = { not: 'DELETED' };

      // Search query for metadata fields only
      if (q) {
        where.OR = [
          { title: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
          { originalName: { contains: q as string, mode: 'insensitive' } }
        ];
      }

      // Filters
      if (category) where.category = category;
      if (status) where.status = status;
      if (folderId) where.folderId = folderId;
      if (createdBy) where.createdById = createdBy;

      // Get total count
      const total = await prisma.document.count({ where });

      // Get documents
      const documents = await prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          folder: {
            select: { name: true }
          }
        }
      });

      res.json({
        success: true,
        documents,
        totalCount: total,
        query: q || '',
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      });

    } catch (error) {
      console.error('❌ Document search error:', error);
      logger.error('Document search failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      });
    }
  }
);

// Get document metadata
router.get('/:id',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;

      const document = await documentService.getDocumentById(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Log document data for debugging, especially content in customFields
      logger.info('Document retrieved', {
        documentId: document.id,
        title: document.title,
        hasCustomFields: !!document.customFields,
        customFieldsType: typeof document.customFields,
        customFieldsKeys: document.customFields && typeof document.customFields === 'object' 
          ? Object.keys(document.customFields as any) 
          : [],
        hasContent: !!(document.customFields && typeof document.customFields === 'object' && (document.customFields as any).content),
        contentLength: document.customFields && typeof document.customFields === 'object' && (document.customFields as any).content 
          ? (document.customFields as any).content.length 
          : 0,
        contentPreview: document.customFields && typeof document.customFields === 'object' && (document.customFields as any).content
          ? (document.customFields as any).content.substring(0, 200)
          : 'No content'
      });

      // Ensure content field is accessible in the response
      const documentWithContent = {
        ...document,
        content: document.customFields && typeof document.customFields === 'object' && (document.customFields as any).content
          ? (document.customFields as any).content
          : null
      };

      res.json({
        success: true,
        document: documentWithContent
      });

    } catch (error) {
      logger.error('Failed to get document:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document'
      });
    }
  }
);

// Update document metadata
router.put('/:id',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const updateData = req.body;

      const document = await documentService.updateDocument(
        documentId,
        updateData,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        document
      });

    } catch (error) {
      logger.error('Document update failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  }
);

// Delete document
router.delete('/:id',
  async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const { permanent = false } = req.query;

      const success = await documentService.deleteDocument(
        documentId,
        req.user.id,
        req.user.organizationId,
        permanent === 'true'
      );

      res.json({
        success,
        message: permanent ? 'Document permanently deleted' : 'Document moved to trash'
      });

    } catch (error) {
      logger.error('Document deletion failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      });
    }
  }
);

export { router as documentsRouter };