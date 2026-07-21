import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { DocumentService } from '../services/DocumentService';
import { StorageService } from '../services/StorageService';
import { SearchService } from '../services/SearchService';
import { authMiddleware, requirePermission } from '../middleware/auth';
import winston from 'winston';
import { PrismaClient } from '@prisma/client';
import { getTemplateContent, getTemplateName } from '../templates/documentTemplates';
import { validateUpload } from '../security/storagePolicy';
import { authorizeDocumentAccess, GovernanceRole } from '../security/governancePolicy';
import { prepareUntrustedDocumentForAI } from '../security/governancePolicy';
import { RetentionService } from '../services/RetentionService';

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
const retentionService = new RetentionService(prisma);

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character] as string));
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const knownTypes = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'image/png', 'image/jpeg', 'text/plain', 'text/csv', 'text/html']);
    if (!knownTypes.has(file.mimetype)) return cb(new Error('File type not allowed'));
    cb(null, true);
  }
});

// Middleware to apply to all document routes
router.use(authMiddleware);
router.param('id', async (req: any, res, next, documentId) => {
  try {
    const document = await prisma.document.findFirst({ where: { id: documentId, organizationId: req.user.organizationId, status: { not: 'DELETED' } }, include: { permissions: { where: { userId: req.user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const decision = authorizeDocumentAccess({ id: req.user.id, organizationId: req.user.organizationId, role: req.user.role.name.toUpperCase() as GovernanceRole, clearance: req.user.clearanceLevel, attributes: req.user.accessAttributes || {} }, { organizationId: document.organizationId, classification: document.classification, handlingCaveats: document.handlingCaveats, permittedUserIds: document.permissions.map(permission => permission.userId) });
    if (!decision.allowed) return res.status(403).json({ error: decision.reason });
    req.authorizedDocument = document;
    next();
  } catch { return res.status(500).json({ error: 'Document authorization failed' }); }
});

// List documents (with special handling for legal reviewers)
router.get('/',
  async (req: any, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;

      // Get user's role
      const userRole = req.user.role?.name?.toUpperCase() || '';

      let whereConditions: any = {
        organizationId: req.user.organizationId,
        status: { not: 'DELETED' }
      };

      // Define which stages each role can access
      const roleStageMap: { [key: string]: string[] } = {
        'ACTION_OFFICER': ['1', '4', '6', '8'],
        'OPR': ['1', '3.5', '4', '5.5', '6', '8'],
        'PCM': ['2'],
        'PCM_REVIEWER': ['2'],
        'COORDINATOR': ['3', '5'],
        'SUB_REVIEWER': ['3.5', '5.5'],
        'REVIEWER': ['3.5', '5.5'],
        // Legal users can see documents in stage 7 and later stages (after their review)
        'LEGAL': ['7', '8', '9', '10'],
        'LEGAL_REVIEWER': ['7', '8', '9', '10'],
        'STAFF_JUDGE_ADVOCATE': ['7', '8', '9', '10'],
        'LEADERSHIP': ['9'],
        'LEADER': ['9'],
        'SQUADRON_COMMANDER': ['6'],
        'GROUP_COMMANDER': ['7'],
        'WING_COMMANDER': ['8'],
        'MAJCOM_REVIEWER': ['9'],
        'HQAF_APPROVER': ['10', '11'],
        'FRONT_OFFICE': ['3', '5'],
        'AFDPO': ['11'],
        'PUBLISHER': ['11'],
        'AFDPO_PUBLISHER': ['11'],
        'ADMIN': ['1', '2', '3', '3.5', '4', '5', '5.5', '6', '7', '8', '9', '10']
      };

      if (userRole === 'ADMIN') {
        // Admin users see all documents (no additional conditions)
      } else {
        // Get documents in stages this user can access
        const accessibleStages = roleStageMap[userRole] || [];

        if (accessibleStages.length > 0) {
          // Get documents in workflow stages the user can access
          const workflowDocs = await prisma.jsonWorkflowInstance.findMany({
            where: {
              currentStageId: { in: accessibleStages },
              document: { organizationId: req.user.organizationId }
            },
            select: { documentId: true }
          });

          const workflowDocIds = workflowDocs.map(w => w.documentId);

          if (workflowDocIds.length > 0) whereConditions.id = { in: workflowDocIds };
        }
      }

      // Add additional filters
      if (category) whereConditions.category = category;
      if (status) whereConditions.status = status;
      if (search) {
        whereConditions.AND = [{ OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ] }];
      }

      // Get documents
      const [documents, totalCount] = await Promise.all([
        prisma.document.findMany({
          where: whereConditions,
          skip: offset,
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            folder: {
              select: { name: true }
            }
          }
        }),
        prisma.document.count({ where: whereConditions })
      ]);

      // Debug: Log what stages we're looking for
      logger.info('Documents list query', {
        userId: req.user.id,
        userRole,
        accessibleStages: roleStageMap[userRole] || [],
        whereConditions: JSON.stringify(whereConditions)
      });

      logger.info('Documents list retrieved', {
        userId: req.user.id,
        userRole,
        documentsCount: documents.length,
        totalCount
      });

      res.json({
        success: true,
        documents,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        }
      });

    } catch (error: any) {
      logger.error('Failed to list documents:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve documents'
      });
    }
  }
);

// Create document with template
router.post('/create-with-template',
  async (req: any, res) => {
    try {
      const { title, templateId, category, description, tags, folderId, headerContent } = req.body;
      const templateContent = getTemplateContent(templateId || 'blank');
      const templateName = getTemplateName(templateId || 'blank');
      const fileName = `${title || templateName}_${Date.now()}.html`;
      const document = await documentService.createDocument({
        title: title || templateName,
        description: description || `Created from ${templateName} template`,
        fileName,
        originalName: fileName,
        mimeType: 'text/html',
        fileBuffer: Buffer.from(templateContent, 'utf8'),
        category: category || 'GENERAL',
        tags: Array.isArray(tags) ? tags : [],
        folderId,
        customFields: { templateId, createdFrom: 'template', headerHtml: typeof headerContent === 'string' ? headerContent : '', hasHeader: Boolean(headerContent) },
      }, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, document });

    } catch (error: any) {
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

    } catch (error: any) {
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

        } catch (error: any) {
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

    } catch (error: any) {
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
        documentId, req.user.organizationId
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

    } catch (error: any) {
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
        documentId, req.user.organizationId
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

    } catch (error: any) {
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

    } catch (error: any) {
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
                  organizationId: req.user.organizationId,
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
          ).then(docs => docs.filter((doc: any) => doc !== null));

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

      let where: any = { organizationId: req.user.organizationId };

      // Get user's role for workflow access
      const userRole = req.user.role?.name?.toUpperCase() || '';

      // Define which stages each role can access
      const roleStageMap: { [key: string]: string[] } = {
        'ACTION_OFFICER': ['1', '4', '6', '8'],
        'OPR': ['1', '3.5', '4', '5.5', '6', '8'],
        'PCM': ['2'],
        'PCM_REVIEWER': ['2'],
        'COORDINATOR': ['3', '5'],
        'SUB_REVIEWER': ['3.5', '5.5'],
        'REVIEWER': ['3.5', '5.5'],
        // Legal users can see documents in stage 7 and later stages (after their review)
        'LEGAL': ['7', '8', '9', '10'],
        'LEGAL_REVIEWER': ['7', '8', '9', '10'],
        'STAFF_JUDGE_ADVOCATE': ['7', '8', '9', '10'],
        'LEADERSHIP': ['9'],
        'LEADER': ['9'],
        'SQUADRON_COMMANDER': ['6'],
        'GROUP_COMMANDER': ['7'],
        'WING_COMMANDER': ['8'],
        'MAJCOM_REVIEWER': ['9'],
        'HQAF_APPROVER': ['10', '11'],
        'FRONT_OFFICE': ['3', '5'],
        'AFDPO': ['11'],
        'PUBLISHER': ['11'],
        'AFDPO_PUBLISHER': ['11'],
        'ADMIN': ['1', '2', '3', '3.5', '4', '5', '5.5', '6', '7', '8', '9', '10']
      };

      if (userRole !== 'ADMIN') {
        // Get documents user has explicit permission for
        const permittedDocIds = await prisma.documentPermission.findMany({
          where: { userId: req.user.id },
          select: { documentId: true }
        }).then(perms => perms.map(p => p.documentId));

        // User can see: documents from their org OR documents they have permission for
        const accessConditions: any[] = [];

        if (permittedDocIds.length > 0) {
          accessConditions.push({ id: { in: permittedDocIds } });
        }

        // Get documents in stages this user can access
        const accessibleStages = roleStageMap[userRole] || [];
        if (accessibleStages.length > 0) {
          const workflowDocs = await prisma.jsonWorkflowInstance.findMany({
            where: {
              currentStageId: { in: accessibleStages },
              document: { organizationId: req.user.organizationId }
            },
            select: { documentId: true }
          });

          const workflowDocIds = workflowDocs.map(w => w.documentId);
          if (workflowDocIds.length > 0) {
            accessConditions.push({ id: { in: workflowDocIds } });
          }
        }

        if (accessConditions.length) where.AND = [{ OR: accessConditions }];
      }

      // Filter out deleted documents
      where.status = { not: 'DELETED' };

      // Search query for metadata fields only
      if (q) {
        // Combine access conditions with search conditions
        const searchConditions = [
          { title: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
          { originalName: { contains: q as string, mode: 'insensitive' } }
        ];

        where.AND = [...(where.AND || []), { OR: searchConditions }];
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

    } catch (error: any) {
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
  authMiddleware,
  async (req: any, res) => {
    try {
      const documentId = req.params.id;

      // Add debug logging
      logger.info('📄 DOCUMENT ACCESS REQUEST', {
        documentId,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role?.name,
        organizationId: req.user.organizationId
      });

      // Check if document is in workflow stage that allows access
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: { documentId, document: { organizationId: req.user.organizationId } },
        select: { currentStageId: true }
      });

      // Define stage role mappings for the hierarchical workflow
      const stageRoleMap: { [key: string]: string[] } = {
        '1': ['ACTION_OFFICER', 'OPR', 'ADMIN'],
        '2': ['PCM', 'PCM_REVIEWER', 'ADMIN'],
        '3': ['COORDINATOR', 'ADMIN'],
        '3.5': ['SUB_REVIEWER', 'REVIEWER', 'OPR', 'ADMIN'],
        '4': ['ACTION_OFFICER', 'OPR', 'ADMIN'],
        '5': ['COORDINATOR', 'ADMIN'],
        '5.5': ['SUB_REVIEWER', 'REVIEWER', 'OPR', 'ADMIN'],
        '6': ['ACTION_OFFICER', 'OPR', 'SQUADRON_COMMANDER', 'ADMIN'],
        '7': ['LEGAL', 'LEGAL_REVIEWER', 'STAFF_JUDGE_ADVOCATE', 'GROUP_COMMANDER', 'ADMIN'],
        '8': ['ACTION_OFFICER', 'OPR', 'WING_COMMANDER', 'ADMIN', 'LEGAL', 'LEGAL_REVIEWER', 'STAFF_JUDGE_ADVOCATE'],
        '9': ['LEADERSHIP', 'LEADER', 'MAJCOM_REVIEWER', 'ADMIN', 'LEGAL', 'LEGAL_REVIEWER', 'STAFF_JUDGE_ADVOCATE'],
        '10': ['PCM', 'HQAF_APPROVER', 'ADMIN', 'LEGAL', 'LEGAL_REVIEWER', 'STAFF_JUDGE_ADVOCATE'],
        '11': ['AFDPO', 'PUBLISHER', 'AFDPO_PUBLISHER', 'HQAF_APPROVER', 'ADMIN', 'LEGAL', 'LEGAL_REVIEWER', 'STAFF_JUDGE_ADVOCATE']
      };

      // Check if user's role allows access for the current stage
      let hasStageAccess = false;
      if (workflowInstance?.currentStageId) {
        const allowedRoles = stageRoleMap[workflowInstance.currentStageId] || [];
        const userRole = req.user.role?.name?.toUpperCase();
        const userEmail = req.user.email?.toLowerCase() || '';

        // Check if user has access based on role or email
        hasStageAccess = allowedRoles.includes(userRole);

        logger.info('Stage Access Check Details', {
          stage: workflowInstance.currentStageId,
          allowedRoles,
          userRole,
          userEmail,
          hasStageAccess
        });
      }


      logger.info('📄 ACCESS CHECK', {
        currentStage: workflowInstance?.currentStageId,
        userRole: req.user.role?.name,
        hasStageAccess,
        userEmail: req.user.email
      });

      // First check if user has explicit permission for this document
      const hasPermission = await prisma.documentPermission.findFirst({
        where: {
          documentId,
          userId: req.user.id
        }
      });

      let document;
      if (hasPermission || req.user.role?.name === 'Admin' || hasStageAccess) {
        // User has permission or is admin or is legal reviewer in legal stage - get document directly from DB
        document = await prisma.document.findFirst({
          where: {
            id: documentId,
            organizationId: req.user.organizationId,
            status: { not: 'DELETED' }
          },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            folder: {
              select: { name: true }
            },
            versions: {
              orderBy: { versionNumber: "desc" as any },
              take: 10
            }
          }
        });
      } else {
        // Use service method which checks organizationId
        document = await documentService.getDocumentById(
          documentId,
          req.user.id,
          req.user.organizationId
        );
      }

      if (!document) {
        logger.error('📄 DOCUMENT NOT FOUND', {
          documentId,
          userId: req.user.id,
          hasPermission: !!hasPermission,
          isAdmin: req.user.role?.name === 'Admin'
        });
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

      res.json({
        success: true,
        document: document
      });

    } catch (error: any) {
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
      const { content, ...documentUpdateData } = req.body;

      const document = await documentService.updateDocument(
        documentId,
        documentUpdateData,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        document
      });

    } catch (error: any) {
      logger.error('Document update failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  }
);

// Patch document (partial update)
router.patch('/:id', authMiddleware,
  async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const updateData = req.body;
      const userRole = req.user.role?.name?.toUpperCase() || '';

      // Remove content field if present - it should be stored separately
      const { content, ...documentUpdateData } = updateData;

      logger.info('🔵 PATCH document request received:', {
        documentId,
        userId: req.user.id,
        userRole,
        updateDataKeys: Object.keys(documentUpdateData),
        hasCustomFields: !!documentUpdateData.customFields,
        customFieldsKeys: documentUpdateData.customFields ? Object.keys(documentUpdateData.customFields) : []
      });

      // OPR metadata is handled by the same allow-listed service as every other
      // role. Ownership must not enable status/storage/tenant mass assignment.
      if (userRole === 'OPR') {
        const updatedDoc = await documentService.updateDocument(documentId, documentUpdateData, req.user.id, req.user.organizationId);
        return res.json({ success: true, document: updatedDoc });
      }

      // Special handling for reviewers updating feedback
      if (documentUpdateData.customFields &&
          (documentUpdateData.customFields.crmFeedback || documentUpdateData.customFields.draftFeedback ||
           documentUpdateData.customFields.commentMatrix || documentUpdateData.customFields.lastCommentUpdate) &&
          (userRole === 'REVIEWER' || userRole === 'SUB_REVIEWER' || userRole === 'COORDINATOR' ||
           userRole === 'PCM' || userRole === 'PCM_REVIEWER' ||
           userRole === 'ACTION_OFFICER' || userRole === 'LEGAL' || userRole === 'LEGAL_REVIEWER' || userRole === 'ADMIN' ||
           userRole === 'HQAF_APPROVER' || userRole === 'AFDPO' || userRole === 'AFPDO' || userRole === 'PUBLISHER' || userRole === 'AFDPO_PUBLISHER')) {

        logger.info('Reviewer updating feedback for document:', {
          documentId,
          userId: req.user.id,
          userRole,
          feedbackCount: documentUpdateData.customFields.crmFeedback?.length || documentUpdateData.customFields.draftFeedback?.length || 0
        });

        // Check if document exists (without organization filter for reviewers)
        const existingDoc = await prisma.document.findFirst({
          where: {
            id: documentId,
            organizationId: req.user.organizationId
          }
        });

        if (!existingDoc) {
          throw new Error('Document not found');
        }

        // Check if workflow is in a review stage
        const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
          where: { documentId },
          select: { currentStageId: true, isActive: true }
        });

        const reviewStages = ['3', '3.5', '5', '5.5', '7'];
        const isInReviewStage = workflowInstance && reviewStages.includes(workflowInstance.currentStageId || '');

        if (!isInReviewStage && userRole !== 'ADMIN') {
          logger.warn('Attempt to update feedback outside of review stage:', {
            documentId,
            currentStage: workflowInstance?.currentStageId,
            userRole
          });
        }

        // Update only the customFields for feedback
        const newCustomFields = {
          ...(existingDoc.customFields as any || {}),
          ...documentUpdateData.customFields,
          lastFeedbackAt: new Date().toISOString(),
          lastFeedbackBy: req.user.email
        };

        logger.info('📝 Updating customFields:', {
          documentId,
          hasEditableContent: !!newCustomFields.editableContent,
          editableContentLength: newCustomFields.editableContent?.length || 0,
          feedbackCount: newCustomFields.crmFeedback?.length || 0,
          customFieldsKeys: Object.keys(newCustomFields)
        });

        const updatedDoc = await prisma.document.update({
          where: { id: documentId },
          data: {
            customFields: newCustomFields,
            updatedAt: new Date()
          },
          include: {
            createdBy: true,
            organization: true,
            folder: true,
            attachments: true,
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1
            }
          }
        });

        logger.info('Feedback updated successfully:', {
          documentId,
          userId: req.user.id
        });

        res.json({
          success: true,
          document: updatedDoc
        });
        return;
      }

      // Regular update for non-feedback changes or admin users
      const document = await documentService.updateDocument(
        documentId,
        documentUpdateData,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        document
      });

    } catch (error: any) {
      logger.error('Document PATCH failed:', error);
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
      const role = String(req.user.role?.name || '').toUpperCase();
      if (!['ADMIN', 'ADMINISTRATOR', 'LEGAL', 'RECORDS_MANAGER'].includes(role)) {
        return res.status(403).json({ success: false, error: 'RECORDS_ADMIN_REQUIRED' });
      }
      const job = await retentionService.requestDeletion(documentId, req.user.organizationId, req.user.id);
      res.status(202).json({ success: true, message: 'Governed deletion requested', job });

    } catch (error: any) {
      logger.error('Document deletion failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      });
    }
  }
);

// Create supplement document
router.post('/create-supplement',
  async (req: any, res) => {
    try {
      const {
        parentDocumentId,
        supplementSection,
        organization,
        paragraphNumber,
        content,
        opr,
        certifiedBy,
        supplementType,
        title,
        description,
        category,
        headerData
      } = req.body;

      logger.info('Creating supplement document', {
        parentDocumentId,
        organization,
        supplementSection
      });

      // Validate required fields
      if (!parentDocumentId || !supplementSection || !organization || !paragraphNumber || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: parentDocumentId, supplementSection, organization, paragraphNumber, content'
        });
      }

      // Fetch parent document to get details
      const parentDocument = await prisma.document.findFirst({
        where: { id: parentDocumentId, organizationId: req.user.organizationId }
      });

      if (!parentDocument) {
        return res.status(404).json({
          success: false,
          error: 'Parent document not found'
        });
      }

      // Format the supplement content with (Added)(ORG) tag
      const formattedContent = `
        <h4>${escapeHtml(paragraphNumber)}. (Added)(${escapeHtml(organization)})</h4>
        <p>${escapeHtml(content)}</p>
      `;

      const fileName = `supplement_${String(organization).replace(/[^a-z0-9_-]/gi, '_')}_${Date.now()}.html`;
      const supplement = await documentService.createDocument({
          title: title || `${parentDocument.title} - ${organization} Supplement`,
          description: description || `Supplement to ${supplementSection} by ${organization}`,
          fileName,
          originalName: fileName,
          mimeType: 'text/html',
          fileBuffer: Buffer.from(formattedContent, 'utf8'),
          category: category || 'supplement',
          parentDocumentId,
          tags: [],
          customFields: {
            content: formattedContent,
            editableContent: formattedContent,
            htmlContent: formattedContent,
            supplementType: supplementType || 'standalone',
            organization,
            paragraphNumber,
            opr,
            certifiedBy,
            parentDocumentId,
            supplementSection,
            template: 'supplement',
            headerData: headerData || null
          }
      }, req.user.id, req.user.organizationId);
      if (!supplement) throw new Error('SUPPLEMENT_CREATE_FAILED');
      await prisma.document.update({ where: { id: supplement.id }, data: { supplementOrganization: organization, supplementType: supplementType || 'standalone' } });

      logger.info('Supplement created successfully', { supplementId: supplement.id });

      res.status(201).json({
        success: true,
        message: 'Supplement created successfully',
        document: supplement,
        id: supplement.id
      });

    } catch (error: any) {
      logger.error('Supplement creation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create supplement'
      });
    }
  }
);

// Update supplement document
router.put('/:id/update-supplement',
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const {
        organization,
        paragraphNumber,
        content,
        opr,
        certifiedBy
      } = req.body;

      logger.info('Updating supplement document', { supplementId: id });

      // Fetch existing supplement
      const existingSupplement = await prisma.document.findFirst({
        where: { id, organizationId: req.user.organizationId }
      });

      if (!existingSupplement) {
        return res.status(404).json({
          success: false,
          error: 'Supplement document not found'
        });
      }

      // Verify it's a supplement
      const customFields = existingSupplement.customFields as any;
      if (existingSupplement.category !== 'supplement' &&
          customFields?.template !== 'supplement') {
        return res.status(400).json({
          success: false,
          error: 'This document is not a supplement'
        });
      }

      // Format the updated supplement content with (Added)(ORG) tag
      const formattedContent = `
        <h4>${escapeHtml(paragraphNumber)}. (Added)(${escapeHtml(organization)})</h4>
        <p>${escapeHtml(content)}</p>
      `;

      await documentService.createDocumentVersion(id, Buffer.from(formattedContent, 'utf8'), {
        fileName: existingSupplement.fileName,
        title: existingSupplement.title,
        description: existingSupplement.description || undefined,
        changeNotes: 'Supplement content updated',
        changeType: 'MINOR'
      }, req.user.id, req.user.organizationId);

      // Update supplement document
      const updatedSupplement = await prisma.document.update({
        where: { id },
        data: {
          customFields: {
            ...(existingSupplement.customFields as any || {}),
            content: formattedContent,
            editableContent: formattedContent,
            htmlContent: formattedContent,
            organization,
            paragraphNumber,
            opr,
            certifiedBy
          },
          supplementOrganization: organization,
          updatedAt: new Date()
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

      logger.info('Supplement updated successfully', { supplementId: id });

      res.status(200).json({
        success: true,
        message: 'Supplement updated successfully',
        document: updatedSupplement
      });

    } catch (error: any) {
      logger.error('Supplement update failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update supplement'
      });
    }
  }
);

// ============================================================
// POST /api/documents/:id/summarize
// AI-powered document summarization
// ============================================================
router.post('/:id/summarize', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.body;

    // Fetch document
    const document = await prisma.document.findFirst({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Return cached summary if available and not forcing regeneration
    const existingFields = (document.customFields as any) || {};
    if (existingFields.aiSummary && !force) {
      return res.json({
        success: true,
        summary: existingFields.aiSummary,
        cached: true,
        documentId: id
      });
    }

    // Extract text content from the document
    let textContent = document.ocrText || document.content || '';

    // If no extracted text is stored, only decode explicitly text-based objects.
    if (!textContent && document.storagePath) {
      try {
        const rawBuffer = await storageService.downloadDocument(document.storagePath, req.user.organizationId);
        if (rawBuffer && document.mimeType?.includes('text')) textContent = rawBuffer.toString('utf-8');
      } catch (readErr: any) {
        logger.warn('Could not read document from storage for summarization', { id, error: readErr.message });
      }
    }

    if (!textContent || textContent.trim().length < 50) {
      return res.status(422).json({
        success: false,
        error: 'Document has insufficient text content for summarization. Ensure OCR has been run or document contains extractable text.'
      });
    }

    // Bound and delimit untrusted content before sending it to a model.
    const truncatedContent = textContent.length > 8000
      ? textContent.slice(0, 8000) + '\n...[content truncated for summarization]'
      : textContent;
    const defended = prepareUntrustedDocumentForAI(truncatedContent);
    if (!defended.accepted) return res.status(422).json({ success: false, error: defended.reason, signals: defended.signals });

    // Call OpenRouter for summarization
    const axios = await import('axios');
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return res.status(503).json({ success: false, error: 'AI service not configured (OPENROUTER_API_KEY missing)' });
    }

    const aiResponse = await axios.default.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a document intelligence system. Generate concise, accurate summaries of documents. Include: key points, main purpose, important entities, and action items if any. Format your response as structured markdown.'
          },
          {
            role: 'user',
            content: `${defended.instruction}\nSummarize the document titled "${document.title}".\n${defended.content}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
          'X-Title': 'Document Management System',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const summaryContent = aiResponse.data?.choices?.[0]?.message?.content;
    if (!summaryContent) {
      return res.status(502).json({ success: false, error: 'AI service returned empty summary' });
    }

    const summaryRecord = {
      content: summaryContent,
      model: aiResponse.data?.model,
      tokensUsed: aiResponse.data?.usage?.total_tokens,
      generatedAt: new Date().toISOString(),
      documentLength: textContent.length
    };

    const artifact = await prisma.aIReviewArtifact.create({ data: {
      organizationId: req.user.organizationId,
      documentId: document.id,
      documentVersion: document.currentVersion,
      provider: 'openrouter',
      model: String(summaryRecord.model || process.env.OPENROUTER_MODEL || 'unknown'),
      modelVersion: String(aiResponse.data?.system_fingerprint || aiResponse.data?.created || 'provider-current'),
      promptDigest: defended.digest,
      sourceChecksums: [document.checksum],
      outputChecksum: crypto.createHash('sha256').update(summaryContent).digest('hex'),
      feature: 'summary',
      output: summaryRecord,
      promptDefense: { delimiter: 'UNTRUSTED_DOCUMENT', signalsChecked: true },
      createdById: req.user.id,
    } });

    logger.info('Document summarized successfully', {
      documentId: id,
      model: summaryRecord.model,
      tokensUsed: summaryRecord.tokensUsed
    });

    res.json({
      success: true,
      documentId: id,
      documentTitle: document.title,
      summary: summaryRecord,
      artifactId: artifact.id,
      reviewStatus: artifact.status,
      warning: 'AI output is advisory and cannot enter the governed workflow until independently approved.',
      cached: false
    });

  } catch (error: any) {
    logger.error('Document summarization failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Summarization failed'
    });
  }
});

export { router as documentsRouter };
