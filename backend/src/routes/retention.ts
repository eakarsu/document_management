import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { RetentionService } from '../services/RetentionService';

const router = Router();
const prisma = new PrismaClient();
const service = new RetentionService(prisma);
router.use(authMiddleware);

function isRecordsAdmin(req: any) { return ['ADMIN', 'ADMINISTRATOR', 'LEGAL', 'RECORDS_MANAGER'].includes(String(req.user?.role?.name).toUpperCase()); }
function fail(res: any, error: unknown) {
  const message = error instanceof Error ? error.message : 'REQUEST_FAILED';
  return res.status(message.includes('NOT_FOUND') ? 404 : message.includes('ACTIVE') ? 409 : 400).json({ success: false, error: message });
}

router.get('/retention/expiring', async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
  const documents = await prisma.document.findMany({ where: { organizationId: req.user.organizationId, retentionUntil: { gte: new Date(), lte: new Date(Date.now() + days * 86_400_000) }, status: { not: 'DELETED' } }, orderBy: { retentionUntil: 'asc' } });
  res.json({ count: documents.length, documents });
});

router.post('/documents/:id/retention', async (req: any, res) => {
  if (!req.user || !isRecordsAdmin(req)) return res.status(403).json({ error: 'RECORDS_ADMIN_REQUIRED' });
  try { res.json({ document: await service.setRetention(req.params.id, req.user.organizationId, req.user.id, new Date(req.body.retentionUntil)) }); }
  catch (error) { fail(res, error); }
});

router.post('/documents/:id/legal-holds', async (req: any, res) => {
  if (!req.user || !isRecordsAdmin(req)) return res.status(403).json({ error: 'RECORDS_ADMIN_REQUIRED' });
  try { res.status(201).json({ hold: await service.placeHold(req.params.id, req.user.organizationId, req.user.id, String(req.body.matter || ''), String(req.body.reason || '')) }); }
  catch (error) { fail(res, error); }
});

router.post('/legal-holds/:id/release', async (req: any, res) => {
  if (!req.user || !isRecordsAdmin(req)) return res.status(403).json({ error: 'RECORDS_ADMIN_REQUIRED' });
  try { res.json({ hold: await service.releaseHold(req.params.id, req.user.organizationId, req.user.id, String(req.body.reason || '')) }); }
  catch (error) { fail(res, error); }
});

router.post('/documents/:id/deletion-jobs', async (req: any, res) => {
  if (!req.user || !isRecordsAdmin(req)) return res.status(403).json({ error: 'RECORDS_ADMIN_REQUIRED' });
  try { res.status(202).json({ job: await service.requestDeletion(req.params.id, req.user.organizationId, req.user.id) }); }
  catch (error) { fail(res, error); }
});

router.post('/deletion-jobs/:id/process', async (req: any, res) => {
  if (!req.user || !isRecordsAdmin(req)) return res.status(403).json({ error: 'RECORDS_ADMIN_REQUIRED' });
  try { res.json({ job: await service.processDeletion(req.params.id, req.user.organizationId, req.user.id) }); }
  catch (error) { fail(res, error); }
});

router.get('/documents/:id/export-manifest', async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const document = await prisma.document.findFirst({ where: { id: req.params.id, organizationId: req.user.organizationId }, include: { versions: true, attachments: true } });
  if (!document) return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' });
  const audits = await prisma.signedAuditEvent.findMany({ where: { organizationId: req.user.organizationId, entityType: 'Document', entityId: document.id }, orderBy: { createdAt: 'asc' } });
  res.json({ exportedAt: new Date().toISOString(), document: { ...document, storagePath: undefined }, objectManifest: [{ kind: 'document', checksum: document.checksum, objectVersionId: document.objectVersionId }, ...document.versions.map(v => ({ kind: 'version', version: v.versionNumber, checksum: v.checksum, objectVersionId: v.objectVersionId })), ...document.attachments.map(a => ({ kind: 'attachment', id: a.id, checksum: a.checksum, objectVersionId: a.objectVersionId }))], signedAudits: audits });
});

export { router as retentionRouter };
