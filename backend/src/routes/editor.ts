import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import winston from 'winston';

const router = Router();
const prisma = new PrismaClient();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    organizationId: string;
  };
}

// Apply auth middleware to all routes
router.use(authMiddleware);

// Save document content
router.post('/documents/:id/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const { content, title, timestamp } = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Verify user has access to this document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Check if user can edit this document
    // Allow editing based on role and workflow stage
    const userRole = req.user?.role?.name || '';
    
    logger.info('Edit permission check', { 
      userId, 
      documentId, 
      userRole,
      documentCreator: document.createdById 
    });
    
    // Normalize role name for comparison
    const normalizedRole = userRole.toUpperCase().trim();
    
    // List of roles that can edit documents
    const editableRoles = [
      'ADMIN', 
      'OPR', 
      'ICU_REVIEWER', 
      'TECHNICAL_REVIEWER', 
      'LEGAL_REVIEWER', 
      'PUBLISHER', 
      'WORKFLOW_ADMIN'
    ];
    
    // Check if user has permission to edit
    const isCreator = document.createdById === userId;
    const hasEditRole = editableRoles.includes(normalizedRole);
    const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'WORKFLOW_ADMIN';
    
    const canEdit = isCreator || hasEditRole || isAdmin;

    if (!canEdit) {
      logger.warn('Edit permission denied', { 
        userId, 
        documentId, 
        userRole,
        normalizedRole,
        isCreator,
        hasEditRole,
        isAdmin,
        documentCreator: document.createdById 
      });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this document',
        debug: {
          userRole,
          normalizedRole,
          isCreator,
          hasEditRole,
          isAdmin
        }
      });
    }

    // Create a new document version with the content
    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: documentId,
        versionNumber: document.currentVersion + 1,
        title: title || document.title,
        fileName: document.fileName,
        fileSize: content.length,
        checksum: Buffer.from(content).toString('base64').substring(0, 50), // Truncate for storage
        storagePath: `editor/content/${documentId}_v${document.currentVersion + 1}.html`,
        createdById: userId,
        changeNotes: 'Document edited via rich text editor',
        changeType: 'MINOR'
      },
    });

    // Update the document's current version and save content to customFields
    await prisma.document.update({
      where: { id: documentId },
      data: {
        currentVersion: newVersion.versionNumber,
        updatedAt: new Date(),
        ...(title && title !== document.title ? { title } : {}),
        customFields: {
          ...(document.customFields as any || {}),
          content: content, // Save HTML content in customFields
          lastEditedBy: userId,
          lastEditedAt: timestamp
        }
      },
    });

    // Store the actual content in a simple way (you can extend this)
    // For now, we'll just log it and return success
    logger.info('Document content saved', {
      documentId,
      userId,
      newVersion: newVersion.versionNumber,
      contentLength: content.length,
      timestamp
    });

    res.json({
      success: true,
      message: 'Document saved successfully',
      version: newVersion.versionNumber,
      savedAt: newVersion.createdAt
    });

  } catch (error) {
    logger.error('Error saving document content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get document content for editing
router.get('/documents/:id/content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get document with latest version content
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const latestVersion = document.versions[0];
    
    // Get content from customFields if available (for documents created from templates)
    // or provide default content
    let content = '<p>Start editing your document...</p>';
    
    if (document.customFields && typeof document.customFields === 'object') {
      const customFields = document.customFields as any;
      if (customFields.content) {
        content = customFields.content;
        logger.info('Loading content from customFields', {
          documentId: document.id,
          contentLength: content.length,
          contentPreview: content.substring(0, 100)
        });
      }
    }
    
    // Log document data for debugging
    logger.info('Document content endpoint accessed', {
      documentId: document.id,
      title: document.title,
      hasCustomFields: !!document.customFields,
      customFieldsKeys: document.customFields ? Object.keys(document.customFields as any) : [],
      contentLength: content.length,
      contentPreview: content.substring(0, 200)
    });
    
    res.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: content, // Return actual content from customFields
        category: document.category,
        status: document.status,
        currentVersion: document.currentVersion,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        createdBy: document.createdBy,
        customFields: document.customFields // Include customFields for Air Force header
      }
    });

  } catch (error) {
    logger.error('Error fetching document content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create supplement document
router.post('/documents/:id/supplement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const { supplementType, supplementLevel, organization } = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get parent document
    const parentDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      }
    });

    if (!parentDocument) {
      return res.status(404).json({
        success: false,
        message: 'Parent document not found'
      });
    }

    // Create supplement document
    const supplement = await prisma.document.create({
      data: {
        title: `${parentDocument.title}_${organization}SUP`,
        fileName: `${parentDocument.fileName}_supplement`,
        category: parentDocument.category,
        status: 'DRAFT',
        parentDocumentId: documentId,
        supplementType: supplementType,
        supplementLevel: supplementLevel,
        supplementOrganization: organization,
        effectiveDate: new Date(),
        organizationId: organizationId,
        createdById: userId,
        currentVersion: 1,
        customFields: {
          parentDocumentTitle: parentDocument.title,
          supplementMetadata: {
            type: supplementType,
            level: supplementLevel,
            organization: organization,
            authority: req.user?.firstName + ' ' + req.user?.lastName
          }
        }
      }
    });

    logger.info('Supplement document created', {
      supplementId: supplement.id,
      parentId: documentId,
      type: supplementType,
      level: supplementLevel,
      organization
    });

    res.json({
      success: true,
      message: 'Supplement document created successfully',
      supplement: supplement
    });

  } catch (error) {
    logger.error('Error creating supplement document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplement document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add supplemental section
router.post('/documents/:id/supplement/section', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const { parentSectionNumber, parentSectionTitle, action, content, rationale } = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify document exists and user has access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Create supplemental section
    const section = await prisma.supplementalSection.create({
      data: {
        documentId: documentId,
        parentSectionNumber: parentSectionNumber,
        parentSectionTitle: parentSectionTitle,
        action: action,
        content: content,
        rationale: rationale,
        createdById: userId
      }
    });

    logger.info('Supplemental section added', {
      sectionId: section.id,
      documentId: documentId,
      action: action,
      parentSection: parentSectionNumber
    });

    res.json({
      success: true,
      message: 'Supplemental section added successfully',
      section: section
    });

  } catch (error) {
    logger.error('Error adding supplemental section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add supplemental section',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get integrated document (base + supplements)
router.get('/documents/:id/integrated', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get base document with supplements
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      },
      include: {
        supplementalSections: {
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            parentSectionNumber: 'asc'
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get content from customFields
    let baseContent = '<p>Start editing your document...</p>';
    if (document.customFields && typeof document.customFields === 'object') {
      const customFields = document.customFields as any;
      if (customFields.content) {
        baseContent = customFields.content;
      }
    }

    // Apply supplemental sections to base content
    let integratedContent = baseContent;
    
    for (const section of document.supplementalSections) {
      const supplementLabel = `${section.action}-${document.supplementOrganization || 'SUP'}`;
      
      switch (section.action) {
        case 'ADD':
          // Add content after the specified section
          const addPattern = new RegExp(`(<[^>]+>${section.parentSectionNumber}[^<]*</[^>]+>)`, 'gi');
          integratedContent = integratedContent.replace(addPattern, `$1\n<div class="supplement-add" data-supplement="${supplementLabel}">${section.content}</div>`);
          break;
          
        case 'MODIFY':
          // Wrap the modified section
          const modifyPattern = new RegExp(`(<[^>]+>${section.parentSectionNumber}[^<]*</[^>]+>)`, 'gi');
          integratedContent = integratedContent.replace(modifyPattern, `<div class="supplement-modify" data-supplement="${supplementLabel}">$1\n${section.content}</div>`);
          break;
          
        case 'REPLACE':
          // Replace the entire section
          const replacePattern = new RegExp(`<[^>]+>${section.parentSectionNumber}[^<]*</[^>]+>`, 'gi');
          integratedContent = integratedContent.replace(replacePattern, `<div class="supplement-replace" data-supplement="${supplementLabel}">${section.content}</div>`);
          break;
          
        case 'DELETE':
          // Mark section as deleted
          const deletePattern = new RegExp(`(<[^>]+>${section.parentSectionNumber}[^<]*</[^>]+>)`, 'gi');
          integratedContent = integratedContent.replace(deletePattern, `<div class="supplement-delete" data-supplement="${supplementLabel}" title="${section.rationale || 'Deleted'}">$1</div>`);
          break;
      }
    }

    res.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        baseContent: baseContent,
        integratedContent: integratedContent,
        supplementalSections: document.supplementalSections,
        hasSupplements: document.supplementalSections.length > 0
      }
    });

  } catch (error) {
    logger.error('Error getting integrated document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integrated document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supplement tree (hierarchy of supplements)
router.get('/documents/:id/supplement-tree', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get document and all its supplements
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        status: { not: 'DELETED' }
      },
      include: {
        childDocuments: {
          where: {
            supplementType: { not: null }
          },
          orderBy: {
            supplementLevel: 'asc'
          },
          include: {
            supplementalSections: {
              orderBy: {
                parentSectionNumber: 'asc'
              }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Build supplement tree
    const supplementTree = {
      id: document.id,
      title: document.title,
      level: 0,
      type: 'BASE',
      supplements: document.childDocuments.map((supplement: any) => ({
        id: supplement.id,
        title: supplement.title,
        type: supplement.supplementType,
        level: supplement.supplementLevel,
        organization: supplement.supplementOrganization,
        effectiveDate: supplement.effectiveDate,
        expirationDate: supplement.expirationDate,
        sectionsCount: supplement.supplementalSections.length
      }))
    };

    res.json({
      success: true,
      tree: supplementTree
    });

  } catch (error) {
    logger.error('Error getting supplement tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplement tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;