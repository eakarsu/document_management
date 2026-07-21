import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { StorageService } from '../services/StorageService';
import { authorizeDocumentAccess, GovernanceRole } from '../security/governancePolicy';
import crypto from 'node:crypto';

const router = Router();
const prisma = new PrismaClient();
const storageService = new StorageService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 10 } });

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    role: { id: string; name: string; permissions: string[] };
  };
}

function safeDownloadName(name: string) {
  return name.replace(/[\r\n"\\/]/g, '_').slice(0, 180);
}

async function scopedDocument(documentId: string, user: NonNullable<AuthenticatedRequest['user']>) {
  const document = await prisma.document.findFirst({ where: { id: documentId, organizationId: user.organizationId, status: { not: 'DELETED' } }, include: { permissions: { where: { userId: user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } } });
  if (!document) return null;
  const access = authorizeDocumentAccess({ id: user.id, organizationId: user.organizationId, role: user.role.name.toUpperCase() as GovernanceRole, clearance: (user as any).clearanceLevel, attributes: (user as any).accessAttributes || {} }, { organizationId: document.organizationId, classification: document.classification, handlingCaveats: document.handlingCaveats, permittedUserIds: document.permissions.map(permission => permission.userId) });
  return access.allowed ? document : null;
}

router.get('/editor/documents/:id/attachments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !(await scopedDocument(req.params.id, req.user))) return res.status(404).json({ error: 'Document not found' });
    const attachments = await prisma.attachment.findMany({
      where: { documentId: req.params.id, deletedAt: null },
      include: { uploadedBy: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: [{ attachmentOrder: 'asc' }, { uploadedAt: 'desc' }],
    });
    res.json({ attachments });
  } catch { res.status(500).json({ error: 'Failed to fetch attachments' }); }
});

router.post('/editor/documents/:id/attachments/upload', authMiddleware, upload.array('files', 10), async (req: AuthenticatedRequest, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  try {
    if (!req.user || !files?.length) return res.status(400).json({ error: 'No files uploaded' });
    const document = await scopedDocument(req.params.id, req.user);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const maxOrder = await prisma.attachment.aggregate({ where: { documentId: document.id }, _max: { attachmentOrder: true } });
    let order = (maxOrder._max.attachmentOrder || 0) + 1;
    const attachments = [];
    for (const file of files) {
      const result = await storageService.uploadDocument(file.buffer, {
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }, req.user.organizationId, req.user.id);
      if (!result.success || !result.storagePath) return res.status(422).json({ error: result.error || 'Upload rejected' });
      const attachment = await prisma.attachment.create({
        data: {
          documentId: document.id,
          fileName: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storagePath: result.storagePath,
          storageProvider: 'minio',
          attachmentType: determineAttachmentType(file.mimetype),
          attachmentOrder: order++,
          uploadedById: req.user.id,
          checksum: result.checksum,
          objectVersionId: result.storageVersionId,
          malwareScan: 'CLEAN',
          retentionUntil: document.retentionUntil,
        },
        include: { uploadedBy: { select: { firstName: true, lastName: true, email: true } } },
      });
      attachments.push(attachment);
    }
    res.status(201).json({ attachments });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload attachments' }); }
});

router.get('/editor/documents/:id/attachments/:attachmentId/download', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const attachment = await prisma.attachment.findFirst({
      where: { id: req.params.attachmentId, documentId: req.params.id, deletedAt: null, document: { organizationId: req.user.organizationId } },
    });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
    const buffer = await storageService.downloadDocument(attachment.storagePath, req.user.organizationId);
    if (!buffer) return res.status(404).json({ error: 'Object not found' });
    if (attachment.checksum && crypto.createHash('sha256').update(buffer).digest('hex') !== attachment.checksum) {
      return res.status(409).json({ error: 'Attachment checksum verification failed' });
    }
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName(attachment.originalName)}"`);
    res.send(buffer);
  } catch { res.status(500).json({ error: 'Failed to download attachment' }); }
});

router.delete('/editor/documents/:id/attachments/:attachmentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const attachment = await prisma.attachment.findFirst({
      where: { id: req.params.attachmentId, documentId: req.params.id, deletedAt: null, document: { organizationId: req.user.organizationId } },
      include: { document: true },
    });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
    const privileged = [attachment.document.createdById, attachment.uploadedById].includes(req.user.id) || ['Administrator', 'Admin'].includes(req.user.role.name);
    if (!privileged) return res.status(403).json({ error: 'Permission denied' });
    if (attachment.document.legalHoldActive) return res.status(409).json({ error: 'LEGAL_HOLD_ACTIVE' });
    if (attachment.retentionUntil && attachment.retentionUntil > new Date()) return res.status(409).json({ error: 'RETENTION_ACTIVE' });
    const deleted = await storageService.deleteDocumentForOrganization(attachment.storagePath, req.user.organizationId);
    if (!deleted) return res.status(503).json({ error: 'Object deletion was not confirmed' });
    await prisma.attachment.update({ where: { id: attachment.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Attachment deleted and tombstoned' });
  } catch { res.status(500).json({ error: 'Failed to delete attachment' }); }
});

router.put('/editor/documents/:id/attachments/:attachmentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const attachment = await prisma.attachment.findFirst({
      where: { id: req.params.attachmentId, documentId: req.params.id, deletedAt: null, document: { organizationId: req.user.organizationId } },
      include: { document: true },
    });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
    const privileged = [attachment.document.createdById, attachment.uploadedById].includes(req.user.id) || ['Administrator', 'Admin'].includes(req.user.role.name);
    if (!privileged) return res.status(403).json({ error: 'Permission denied' });
    const { description, attachmentType, attachmentOrder } = req.body;
    const updated = await prisma.attachment.update({
      where: { id: attachment.id },
      data: {
        ...(typeof description === 'string' && { description: description.slice(0, 1000) }),
        ...(typeof attachmentType === 'string' && { attachmentType: attachmentType.slice(0, 50) }),
        ...(Number.isInteger(attachmentOrder) && { attachmentOrder }),
      },
    });
    res.json({ attachment: updated });
  } catch { res.status(500).json({ error: 'Failed to update attachment' }); }
});

function determineAttachmentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType === 'application/pdf') return 'REFERENCE';
  if (mimeType.includes('spreadsheet')) return 'FORM';
  if (mimeType.includes('presentation')) return 'APPENDIX';
  return 'SUPPORTING';
}

export default router;
