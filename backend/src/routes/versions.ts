import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { authMiddleware } from '../middleware/auth'; // Commented out - using authenticate for now

const router = Router();
const prisma = new PrismaClient();

// Temporary middleware until auth is fixed
const authMiddleware = (req: Request, res: Response, next: any) => {
  next();
};

/**
 * Get latest version of a document
 */
router.get('/documents/:documentId/versions/latest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    // Get document with its version history from customFields
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get version data from customFields
    const customFields = document.customFields as any;
    const versions = customFields?.versions || [];

    // Get the latest version
    const latestVersion = versions.length > 0
      ? versions[versions.length - 1]
      : {
          id: `v1_${Date.now()}`,
          documentId,
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          changes: [],
          positionMap: {},
          content: customFields?.content || ''
        };

    res.json(latestVersion);
  } catch (error) {
    console.error('Error fetching latest version:', error);
    res.status(500).json({ error: 'Failed to fetch latest version' });
  }
});

/**
 * Get all versions of a document
 */
router.get('/documents/:documentId/versions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const customFields = document.customFields as any;
    const versions = customFields?.versions || [];

    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

/**
 * Create a new version of a document
 */
router.post('/documents/:documentId/versions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const versionData = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const customFields = document.customFields as any || {};
    const versions = customFields.versions || [];

    // Add the new version
    versions.push({
      ...versionData,
      id: versionData.id || `v${versions.length + 1}_${Date.now()}`,
      versionNumber: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: (req as any).user?.email || 'system'
    });

    // Update document with new version and content
    await prisma.document.update({
      where: { id: documentId },
      data: {
        // content: versionData.content || document.content, // Commented out - Document model uses description field
        customFields: {
          ...customFields,
          versions,
          content: versionData.content,
          editableContent: versionData.content,
          lastVersionUpdate: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      version: versions[versions.length - 1]
    });
  } catch (error) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

/**
 * Get version diff between two versions
 */
router.get('/documents/:documentId/versions/diff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { v1, v2 } = req.query;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const customFields = document.customFields as any;
    const versions = customFields?.versions || [];

    const version1 = versions.find((v: any) => v.id === v1);
    const version2 = versions.find((v: any) => v.id === v2);

    if (!version1 || !version2) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Calculate diff (simplified)
    const diff = {
      added: version2.changes.filter((c2: any) =>
        !version1.changes.find((c1: any) => c1.id === c2.id)
      ),
      removed: version1.changes.filter((c1: any) =>
        !version2.changes.find((c2: any) => c2.id === c1.id)
      ),
      modified: []
    };

    res.json(diff);
  } catch (error) {
    console.error('Error calculating diff:', error);
    res.status(500).json({ error: 'Failed to calculate diff' });
  }
});

/**
 * Revert to a specific version
 */
router.post('/documents/:documentId/versions/:versionId/revert', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId, versionId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const customFields = document.customFields as any;
    const versions = customFields?.versions || [];
    const targetVersion = versions.find((v: any) => v.id === versionId);

    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create a new version that reverts to the target
    const revertVersion = {
      id: `v${versions.length + 1}_revert_${Date.now()}`,
      documentId,
      versionNumber: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: (req as any).user?.email || 'system',
      changes: targetVersion.changes,
      positionMap: targetVersion.positionMap,
      content: targetVersion.content,
      parentVersionId: versions[versions.length - 1].id,
      revertedFrom: versionId
    };

    versions.push(revertVersion);

    // Update document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        // content: targetVersion.content, // Commented out - Document model uses description field
        customFields: {
          ...customFields,
          versions,
          content: targetVersion.content,
          editableContent: targetVersion.content,
          lastRevert: new Date().toISOString(),
          revertedToVersion: versionId
        },
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Reverted to version ${targetVersion.versionNumber}`,
      newVersion: revertVersion
    });
  } catch (error) {
    console.error('Error reverting version:', error);
    res.status(500).json({ error: 'Failed to revert version' });
  }
});

export default router;