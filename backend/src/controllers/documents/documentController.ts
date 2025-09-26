import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';
import { StorageService } from '../../services/StorageService';

const prisma = new PrismaClient();

export class DocumentController {
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, status } = req.params;
      const validStatuses = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      const document = await prisma.document.update({
        where: {
          id: id,
          organizationId: req.user.organizationId
        },
        data: { status: status as DocumentStatus },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      res.json({
        success: true,
        message: `Document status updated to ${status}`,
        document
      });
    } catch (error: any) {
      console.error('Status update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update document status'
      });
    }
  }

  async viewDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
        include: {
          createdBy: true,
          permissions: {
            where: { userId: req.user.id }
          }
        }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      const hasAccess = document.createdById === req.user.id ||
                       document.permissions.some(p => ['READ', 'WRITE', 'ADMIN'].includes(p.permission)) ||
                       req.user.permissions?.includes('documents:read') ||
                       req.user.permissions?.includes('*');

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get file content from storage
      const storageService = new StorageService();
      const fileContent = await storageService.downloadDocument(document.storagePath);

      if (!fileContent) {
        return res.status(404).json({ error: 'File not found in storage' });
      }

      // Log view activity
      await prisma.auditLog.create({
        data: {
          action: 'VIEW',
          resource: 'DOCUMENT',
          resourceId: document.id,
          userId: req.user.id,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      }).catch(() => {}); // Don't fail view if audit log fails

      // Update last accessed
      await prisma.document.update({
        where: { id: document.id },
        data: { lastAccessedAt: new Date() }
      }).catch(() => {}); // Don't fail view if update fails

      // Send file for inline viewing (browser decides how to display)
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', fileContent.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.send(fileContent);

    } catch (error: any) {
      console.error('Document view error:', error);
      res.status(500).json({
        error: 'View failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const documentController = new DocumentController();
// Add missing DocumentStatus enum
enum DocumentStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}
