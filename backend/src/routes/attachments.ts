import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'attachments');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Extend Request type to include user
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

// GET /api/editor/documents/:id/attachments - Get all attachments for a document
router.get('/editor/documents/:id/attachments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: documentId } = req.params;

    // Check if document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        organizationId: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user belongs to the same organization
    if (document.organizationId !== req.user?.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all attachments for the document
    const attachments = await prisma.attachment.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { attachmentOrder: 'asc' },
        { uploadedAt: 'desc' }
      ]
    });

    res.json({ attachments });
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// POST /api/editor/documents/:id/attachments/upload - Upload attachments
router.post(
  '/editor/documents/:id/attachments/upload',
  authMiddleware,
  upload.array('files', 10), // Allow up to 10 files at once
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: documentId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Check if document exists and user has access
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          organizationId: true
        }
      });

      if (!document) {
        // Clean up uploaded files
        await Promise.all(files.map(file => fs.unlink(file.path)));
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check if user belongs to the same organization
      if (document.organizationId !== req.user?.organizationId) {
        // Clean up uploaded files
        await Promise.all(files.map(file => fs.unlink(file.path)));
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get the current max order for existing attachments
      const maxOrder = await prisma.attachment.aggregate({
        where: { documentId },
        _max: { attachmentOrder: true }
      });

      let currentOrder = (maxOrder._max.attachmentOrder || 0) + 1;

      // Create attachment records
      const attachments = await Promise.all(
        files.map(async (file) => {
          const attachment = await prisma.attachment.create({
            data: {
              documentId,
              fileName: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              fileSize: file.size,
              storagePath: file.path,
              storageProvider: 'local',
              attachmentType: determineAttachmentType(file.mimetype),
              attachmentOrder: currentOrder++,
              uploadedById: req.user!.id
            },
            include: {
              uploadedBy: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });

          return attachment;
        })
      );

      res.json({ attachments });
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      res.status(500).json({ error: 'Failed to upload attachments' });
    }
  }
);

// GET /api/editor/documents/:id/attachments/:attachmentId/download - Download attachment
router.get(
  '/editor/documents/:id/attachments/:attachmentId/download',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: documentId, attachmentId } = req.params;

      // Get attachment with document info
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          document: {
            select: {
              organizationId: true
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify attachment belongs to the specified document
      if (attachment.documentId !== documentId) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Check if user belongs to the same organization
      if (attachment.document.organizationId !== req.user?.organizationId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      try {
        await fs.access(attachment.storagePath);
      } catch {
        return res.status(404).json({ error: 'File not found' });
      }

      // Send file
      res.download(attachment.storagePath, attachment.originalName);
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  }
);

// DELETE /api/editor/documents/:id/attachments/:attachmentId - Delete attachment
router.delete(
  '/editor/documents/:id/attachments/:attachmentId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: documentId, attachmentId } = req.params;

      // Get attachment with document info
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          document: {
            select: {
              organizationId: true,
              createdById: true
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify attachment belongs to the specified document
      if (attachment.documentId !== documentId) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Check if user has permission to delete (document owner or admin)
      const isOwner = attachment.document.createdById === req.user?.id;
      const isAdmin = req.user?.role?.name === 'Administrator' || req.user?.role?.name === 'Admin';
      const isUploader = attachment.uploadedById === req.user?.id;

      if (!isOwner && !isAdmin && !isUploader) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Delete file from storage
      try {
        await fs.unlink(attachment.storagePath);
      } catch (error: any) {
        console.error('Error deleting file:', error);
        // Continue even if file deletion fails
      }

      // Delete attachment record
      await prisma.attachment.delete({
        where: { id: attachmentId }
      });

      res.json({ message: 'Attachment deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }
);

// PUT /api/editor/documents/:id/attachments/:attachmentId - Update attachment metadata
router.put(
  '/editor/documents/:id/attachments/:attachmentId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: documentId, attachmentId } = req.params;
      const { description, attachmentType, attachmentOrder } = req.body;

      // Get attachment with document info
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          document: {
            select: {
              organizationId: true,
              createdById: true
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify attachment belongs to the specified document
      if (attachment.documentId !== documentId) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Check if user has permission to update
      const isOwner = attachment.document.createdById === req.user?.id;
      const isAdmin = req.user?.role?.name === 'Administrator' || req.user?.role?.name === 'Admin';
      const isUploader = attachment.uploadedById === req.user?.id;

      if (!isOwner && !isAdmin && !isUploader) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Update attachment
      const updatedAttachment = await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          ...(description !== undefined && { description }),
          ...(attachmentType !== undefined && { attachmentType }),
          ...(attachmentOrder !== undefined && { attachmentOrder })
        },
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.json({ attachment: updatedAttachment });
    } catch (error: any) {
      console.error('Error updating attachment:', error);
      res.status(500).json({ error: 'Failed to update attachment' });
    }
  }
);

// Helper function to determine attachment type based on MIME type
function determineAttachmentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType === 'application/pdf') return 'REFERENCE';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'SUPPORTING';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'FORM';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'APPENDIX';
  return 'SUPPORTING';
}

export default router;