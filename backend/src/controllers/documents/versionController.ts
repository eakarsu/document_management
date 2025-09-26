import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';
import { DocumentService } from '../../services/DocumentService';
import fs from 'fs';

const prisma = new PrismaClient();
const documentService = new DocumentService();

export class VersionController {
  async createVersion(req: AuthenticatedRequest, res: Response) {
    try {
      const documentId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { title, description, changeNotes, changeType } = req.body;

      // Read file from disk since we're using disk storage
      const fileBuffer = fs.readFileSync(req.file.path);

      const newVersion = await documentService.createDocumentVersion(
        documentId,
        fileBuffer,
        {
          title,
          description,
          fileName: req.file.originalname,
          changeNotes,
          changeType: changeType as 'MAJOR' | 'MINOR' | 'PATCH'
        },
        req.user.id,
        req.user.organizationId
      );

      if (!newVersion) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create document version'
        });
      }

      res.json({
        success: true,
        version: newVersion,
        message: `Version ${newVersion.versionNumber} created successfully with binary diff tracking`
      });

    } catch (error: any) {
      console.error('Version creation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Version creation failed'
      });
    }
  }

  async getVersionHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const documentId = req.params.id;

      const versions = await documentService.getVersionHistory(
        documentId,
        req.user.id,
        req.user.organizationId
      );

      // Fetch the document to get customFields with version content
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { customFields: true }
      });

      // Extract version content from customFields
      const customFields = document?.customFields as any || {};
      const versionContents = customFields.versions || [];

      // Merge content data with version records
      const versionsWithContent = versions.map((version: any) => {
        // Find matching content version by versionNumber
        const contentVersion = versionContents.find(
          (v: any) => v.versionNumber === version.versionNumber
        );

        return {
          ...version,
          content: contentVersion?.content || customFields.content || '',
          customFields: contentVersion || customFields
        };
      });

      res.json({
        success: true,
        versions: versionsWithContent,
        totalVersions: versionsWithContent.length
      });

    } catch (error: any) {
      console.error('Failed to get version history:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get version history'
      });
    }
  }

  async compareVersions(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: documentId, from, to } = req.params;
      const fromVersion = parseInt(from);
      const toVersion = parseInt(to);

      if (isNaN(fromVersion) || isNaN(toVersion)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid version numbers'
        });
      }

      const comparison = await documentService.compareVersions(
        documentId,
        fromVersion,
        toVersion,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        comparison
      });

    } catch (error: any) {
      console.error('Version comparison failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Version comparison failed'
      });
    }
  }

  async getVersionDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: documentId, versionNumber } = req.params;
      const versionNum = parseInt(versionNumber);

      if (isNaN(versionNum)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid version number'
        });
      }

      const version = await prisma.documentVersion.findFirst({
        where: {
          documentId,
          versionNumber: versionNum
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

      if (!version) {
        return res.status(404).json({
          success: false,
          error: 'Version not found'
        });
      }

      // Check permissions
      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId: req.user.organizationId }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      res.json({
        success: true,
        version: {
          ...version,
          hasChangeSummary: !!(version.bytesChanged && version.percentChanged),
          changeSummary: version.bytesChanged ? {
            bytesChanged: version.bytesChanged,
            percentChanged: version.percentChanged,
            changeCategory: version.changeCategory,
            similarity: version.similarity,
            diffSize: version.diffSize,
            compressionRatio: version.compressionRatio
          } : null
        }
      });

    } catch (error: any) {
      console.error('Failed to get version details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get version details'
      });
    }
  }
}

export const versionController = new VersionController();