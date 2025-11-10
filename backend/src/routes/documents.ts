import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
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
              currentStageId: { in: accessibleStages }
            },
            select: { documentId: true }
          });

          const workflowDocIds = workflowDocs.map(w => w.documentId);

          // Include documents in their organization OR documents in their workflow stages
          whereConditions = {
            ...whereConditions,
            OR: [
              { organizationId: req.user.organizationId },
              ...(workflowDocIds.length > 0 ? [{ id: { in: workflowDocIds } }] : [])
            ]
          };
        } else {
          // Regular users only see documents in their organization
          whereConditions.organizationId = req.user.organizationId;
        }
      }

      // Add additional filters
      if (category) whereConditions.category = category;
      if (status) whereConditions.status = status;
      if (search) {
        whereConditions.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
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
      const {
        title,
        templateId,
        category,
        description,
        tags,
        folderId,
        headerContent
      } = req.body;

      // Get template content
      let templateContent = getTemplateContent(templateId || 'blank');
      const templateName = getTemplateName(templateId || 'blank');

      // Extract header and styles from template content
      let headerHtml = '';
      let contentWithoutHeader = templateContent;
      let styles = '';

      // Check if template content already has a header section
      const styleMatch = templateContent.match(/<style>([\s\S]*?)<\/style>/);
      const headerTableMatch = templateContent.match(/<table class="header-table">[\s\S]*?<\/table>/);
      const complianceMatch = templateContent.match(/<div class="compliance-section">[\s\S]*?<\/div>/);
      const infoTableMatch = templateContent.match(/<table class="info-table">[\s\S]*?<\/table>/);
      const bottomTableMatch = templateContent.match(/<table style="width: 100%; margin-top: 20px; border-top: 1px solid #000;">[\s\S]*?<\/table>/);

      if (styleMatch || headerTableMatch) {
        // Extract complete header including styles
        if (styleMatch) {
          styles = styleMatch[0];
        }

        // Build header HTML from all header components
        const headerParts = [];
        if (headerTableMatch) headerParts.push(headerTableMatch[0]);
        if (complianceMatch) headerParts.push(complianceMatch[0]);
        if (infoTableMatch) headerParts.push(infoTableMatch[0]);
        if (bottomTableMatch) headerParts.push(bottomTableMatch[0]);

        if (headerParts.length > 0) {
          headerHtml = styles + '\n' + headerParts.join('\n');

          // Remove header components from content
          contentWithoutHeader = templateContent;
          if (styles) contentWithoutHeader = contentWithoutHeader.replace(styles, '');
          headerParts.forEach(part => {
            contentWithoutHeader = contentWithoutHeader.replace(part, '');
          });

          // Also remove the page break div that comes after header
          contentWithoutHeader = contentWithoutHeader.replace(/<div style="page-break-before: always; margin-top: 2in;">/, '<div>');
        }
      }

      // If header content is provided from frontend, use it
      if (headerContent) {
        headerHtml = headerContent;
      }

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
            content: contentWithoutHeader || templateContent, // Store content without header
            htmlContent: templateContent, // Store full template with header
            editableContent: contentWithoutHeader || templateContent, // Store editable content without header
            headerHtml: headerHtml, // Store header HTML separately for proper formatting
            hasHeader: !!headerHtml
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
        documentId
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
        documentId
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

      let where: any = {};

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
        const accessConditions: any[] = [
          { organizationId: req.user.organizationId }
        ];

        if (permittedDocIds.length > 0) {
          accessConditions.push({ id: { in: permittedDocIds } });
        }

        // Get documents in stages this user can access
        const accessibleStages = roleStageMap[userRole] || [];
        if (accessibleStages.length > 0) {
          const workflowDocs = await prisma.jsonWorkflowInstance.findMany({
            where: {
              currentStageId: { in: accessibleStages }
            },
            select: { documentId: true }
          });

          const workflowDocIds = workflowDocs.map(w => w.documentId);
          if (workflowDocIds.length > 0) {
            accessConditions.push({ id: { in: workflowDocIds } });
          }
        }

        where.OR = accessConditions;
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

        if (where.OR) {
          // Combine access and search conditions
          where.AND = [
            { OR: where.OR },
            { OR: searchConditions }
          ];
          delete where.OR;
        } else {
          where.OR = searchConditions;
        }
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
        where: { documentId },
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
        hasStageAccess = allowedRoles.some(role => {
          const roleToCheck = role.toLowerCase().replace('_', '.');
          return userRole === role ||
                 userRole?.includes(role) ||
                 userEmail.includes(roleToCheck) ||
                 userEmail.includes('legal') && (role === 'LEGAL' || role === 'LEGAL_REVIEWER');
        });

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

      // Special handling for OPR - they should have full access to their documents
      if (userRole === 'OPR') {
        logger.info('OPR updating document:', {
          documentId,
          userId: req.user.id,
          userRole
        });

        // OPR has full access to update any document fields
        const existingDoc = await prisma.document.findFirst({
          where: {
            id: documentId
          }
        });

        if (!existingDoc) {
          logger.error('Document not found for OPR update:', { documentId });
          return res.status(404).json({
            success: false,
            error: 'Document not found'
          });
        }

        // Update the document with all provided fields (except content)
        // If updating customFields, merge with existing customFields
        let dataToUpdate = documentUpdateData;
        if (documentUpdateData.customFields) {
          dataToUpdate = {
            ...documentUpdateData,
            customFields: {
              ...(existingDoc.customFields as any || {}),
              ...documentUpdateData.customFields
            }
          };

          logger.info('📝 OPR updating customFields:', {
            documentId,
            hasEditableContent: !!dataToUpdate.customFields.editableContent,
            editableContentLength: dataToUpdate.customFields.editableContent?.length || 0,
            customFieldsKeys: Object.keys(dataToUpdate.customFields)
          });
        }

        const updatedDoc = await prisma.document.update({
          where: { id: documentId },
          data: dataToUpdate
        });

        logger.info('✅ Document updated successfully by OPR:', {
          documentId: updatedDoc.id,
          title: updatedDoc.title,
          customFieldsKeys: Object.keys((updatedDoc.customFields as any) || {}),
          hasEditableContent: !!(updatedDoc.customFields as any)?.editableContent,
          editableContentLength: (updatedDoc.customFields as any)?.editableContent?.length || 0
        });

        return res.json({
          success: true,
          document: updatedDoc
        });
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
            id: documentId
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
      const parentDocument = await prisma.document.findUnique({
        where: { id: parentDocumentId }
      });

      if (!parentDocument) {
        return res.status(404).json({
          success: false,
          error: 'Parent document not found'
        });
      }

      // Format the supplement content with (Added)(ORG) tag
      const formattedContent = `
        <h4>${paragraphNumber}. (Added)(${organization})</h4>
        <p>${content}</p>
      `;

      // Generate unique checksum for the supplement
      const checksum = crypto
        .createHash('sha256')
        .update(formattedContent + Date.now() + Math.random())
        .digest('hex');

      // Create supplement document
      const supplement = await prisma.document.create({
        data: {
          title: title || `${parentDocument.title} - ${organization} Supplement`,
          description: description || `Supplement to ${supplementSection} by ${organization}`,
          fileName: `supplement_${organization}_${Date.now()}.html`,
          originalName: `${organization}_Supplement.html`,
          mimeType: 'text/html',
          fileSize: Buffer.byteLength(formattedContent, 'utf8'),
          checksum: checksum,
          storagePath: '',
          storageProvider: 'local',
          status: 'DRAFT',
          category: category || 'supplement',
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
          },
          parentDocumentId: parentDocumentId,
          supplementOrganization: organization,
          supplementType: supplementType || 'standalone',
          createdById: req.user.id,
          organizationId: req.user.organizationId
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
      const existingSupplement = await prisma.document.findUnique({
        where: { id }
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
        <h4>${paragraphNumber}. (Added)(${organization})</h4>
        <p>${content}</p>
      `;

      // Update supplement document
      const updatedSupplement = await prisma.document.update({
        where: { id },
        data: {
          fileSize: Buffer.byteLength(formattedContent, 'utf8'),
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

export { router as documentsRouter };