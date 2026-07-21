import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { GovernedWorkflowService, WorkflowActor } from '../services/GovernedWorkflowService';
import { approveAIArtifact, authorizeDocumentAccess, canRoleActAtStage, GovernanceRole, prepareUntrustedDocumentForAI, stageSequence, StageId } from '../security/governancePolicy';
import { appendSignedAudit } from '../security/signedAudit';

const router = Router();
const prisma = new PrismaClient();
const workflow = new GovernedWorkflowService(prisma);
router.use(authMiddleware);

function actor(req: any): WorkflowActor { return req.user as WorkflowActor; }
function status(error: unknown) {
  const message = error instanceof Error ? error.message : 'REQUEST_FAILED';
  if (message.includes('NOT_FOUND')) return 404;
  if (message === 'WORKFLOW_CONFLICT') return 409;
  if (message.includes('REQUIRED') || message.includes('DENIED') || message.includes('MISMATCH') || message.includes('AUTHORIZED') || message.includes('LOW') || message.includes('ACTION') || message.includes('GATE')) return 403;
  return 400;
}

router.post('/documents/:id/workflow/initialize', async (req: any, res) => {
  try { res.status(201).json({ success: true, workflowInstance: await workflow.initialize(req.params.id, actor(req)) }); }
  catch (error) { res.status(status(error)).json({ success: false, error: error instanceof Error ? error.message : 'Initialization failed' }); }
});

router.get('/documents/:id/workflow/status', async (req: any, res) => {
  try { const value = await workflow.status(req.params.id, actor(req)); res.json({ success: Boolean(value), workflow: value }); }
  catch (error) { res.status(status(error)).json({ success: false, error: error instanceof Error ? error.message : 'Status failed' }); }
});

router.post('/documents/:id/workflow/action', async (req: any, res) => {
  try { res.json({ success: true, result: await workflow.transition(req.params.id, actor(req), { action: String(req.body.action ?? ''), comment: req.body.comment }) }); }
  catch (error) { res.status(status(error)).json({ success: false, error: error instanceof Error ? error.message : 'Transition failed' }); }
});

router.post('/documents/:id/ai-artifacts', async (req: any, res) => {
  try {
    const document = await prisma.document.findFirst({ where: { id: req.params.id, organizationId: req.user.organizationId } });
    if (!document) return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' });
    const defended = prepareUntrustedDocumentForAI(String(req.body.sourceContent ?? ''));
    if (!defended.accepted) return res.status(422).json({ error: defended.reason, signals: defended.signals });
    const required = ['provider', 'model', 'modelVersion', 'output'];
    if (required.some((field) => !String(req.body[field] ?? '').trim())) return res.status(400).json({ error: 'PROVENANCE_FIELDS_REQUIRED' });
    const artifact = await prisma.aIReviewArtifact.create({ data: {
      organizationId: req.user.organizationId,
      documentId: document.id,
      documentVersion: document.currentVersion,
      provider: req.body.provider,
      model: req.body.model,
      modelVersion: req.body.modelVersion,
      promptDigest: defended.digest,
      sourceChecksums: [document.checksum],
      outputChecksum: crypto.createHash('sha256').update(String(req.body.output)).digest('hex'),
      feature: String(req.body.feature || 'generatedContent'),
      output: req.body.output,
      promptDefense: { delimiter: 'UNTRUSTED_DOCUMENT', signalsChecked: true },
      createdById: req.user.id,
    } });
    res.status(201).json({ artifact });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'AI_ARTIFACT_FAILED' }); }
});

router.post('/ai-artifacts/:id/review', async (req: any, res) => {
  const artifact = await prisma.aIReviewArtifact.findFirst({ where: { id: req.params.id, organizationId: req.user.organizationId } });
  if (!artifact) return res.status(404).json({ error: 'AI_ARTIFACT_NOT_FOUND' });
  const decision = approveAIArtifact({ creatorId: artifact.createdById, reviewerId: req.user.id, reviewerRole: req.user.role.name.toUpperCase(), rationale: String(req.body.rationale ?? '') });
  if (!decision.allowed) return res.status(403).json({ error: decision.reason });
  if (artifact.documentVersion !== (await prisma.document.findFirst({ where: { id: artifact.documentId, organizationId: req.user.organizationId }, select: { currentVersion: true } }))?.currentVersion) {
    return res.status(409).json({ error: 'AI_ARTIFACT_STALE_DOCUMENT_VERSION' });
  }
  const isApproved = req.body.decision !== 'REJECTED';
  const updated = await prisma.$transaction(async tx => {
    const document = await tx.document.findFirst({ where: { id: artifact.documentId, organizationId: artifact.organizationId } });
    if (!document) throw new Error('DOCUMENT_NOT_FOUND');
    if (!/^[a-z][a-zA-Z0-9]{1,63}$/.test(artifact.feature) || ['__proto__', 'constructor', 'prototype'].includes(artifact.feature)) throw new Error('INVALID_AI_FEATURE');
    if (document.currentVersion !== artifact.documentVersion) throw new Error('AI_ARTIFACT_STALE_DOCUMENT_VERSION');
    const claimed = await tx.aIReviewArtifact.updateMany({
      where: { id: artifact.id, status: 'PENDING' },
      data: { status: isApproved ? 'APPROVED' : 'REJECTED', reviewedById: req.user.id, reviewerRationale: req.body.rationale, reviewedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error('AI_REVIEW_CONFLICT');
    const reviewed = await tx.aIReviewArtifact.findUniqueOrThrow({ where: { id: artifact.id } });
    if (isApproved) await tx.document.update({ where: { id: document.id }, data: { aiResults: { ...((document.aiResults as Record<string, unknown>) || {}), [artifact.feature]: artifact.output } as any } });
    await appendSignedAudit(tx, { organizationId: artifact.organizationId, actorId: req.user.id, action: isApproved ? 'AI_ARTIFACT_APPROVED' : 'AI_ARTIFACT_REJECTED', entityType: 'AIReviewArtifact', entityId: artifact.id, payload: { documentId: artifact.documentId, documentVersion: artifact.documentVersion, feature: artifact.feature, outputChecksum: artifact.outputChecksum }, retentionUntil: document.retentionUntil || new Date(Date.now() + 7 * 365 * 86_400_000) });
    return reviewed;
  });
  res.json({ artifact: updated });
});

router.post('/delegations', async (req: any, res) => {
  const delegate = await prisma.user.findFirst({ where: { id: req.body.delegateId, organizationId: req.user.organizationId, isActive: true } });
  if (!delegate || delegate.id === req.user.id) return res.status(400).json({ error: 'VALID_DELEGATE_REQUIRED' });
  const documentId = String(req.body.documentId || '');
  const stageId = String(req.body.stepId || '') as StageId;
  if (!documentId || !stageSequence.includes(stageId)) return res.status(400).json({ error: 'DOCUMENT_AND_STAGE_REQUIRED' });
  const grantorRole = req.user.role.name.toUpperCase() as GovernanceRole;
  if (!canRoleActAtStage(grantorRole, stageId)) return res.status(403).json({ error: 'GRANTOR_NOT_AUTHORIZED_FOR_STAGE' });
  const document = await prisma.document.findFirst({
    where: { id: documentId, organizationId: req.user.organizationId, status: { not: 'DELETED' } },
    include: { permissions: { where: { userId: req.user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } },
  });
  if (!document) return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' });
  const access = authorizeDocumentAccess(
    { id: req.user.id, organizationId: req.user.organizationId, role: grantorRole, clearance: req.user.clearanceLevel, attributes: req.user.accessAttributes || {} },
    { organizationId: document.organizationId, classification: document.classification, handlingCaveats: document.handlingCaveats, permittedUserIds: document.permissions.map((permission: any) => permission.userId) },
  );
  if (!access.allowed) return res.status(403).json({ error: access.reason });
  const startsAt = new Date(req.body.startsAt); const expiresAt = new Date(req.body.expiresAt);
  const reason = String(req.body.reason ?? '').trim();
  if (!(startsAt < expiresAt) || expiresAt <= new Date() || expiresAt.getTime() - startsAt.getTime() > 30 * 86_400_000 || reason.length < 10) return res.status(400).json({ error: 'VALID_DELEGATION_WINDOW_AND_REASON_REQUIRED' });
  const delegation = await prisma.$transaction(async tx => {
    const created = await tx.approvalDelegation.create({ data: { organizationId: req.user.organizationId, grantorId: req.user.id, delegateId: delegate.id, documentId, stepId: stageId, reason, startsAt, expiresAt } });
    await appendSignedAudit(tx, { organizationId: req.user.organizationId, actorId: req.user.id, action: 'DELEGATION_CREATED', entityType: 'ApprovalDelegation', entityId: created.id, payload: { documentId, stageId, delegateId: delegate.id, startsAt: startsAt.toISOString(), expiresAt: expiresAt.toISOString() }, retentionUntil: document.retentionUntil || new Date(Date.now() + 7 * 365 * 86_400_000) });
    return created;
  });
  res.status(201).json({ delegation });
});

router.post('/delegations/:id/accept', async (req: any, res) => {
  const accepted = await prisma.$transaction(async tx => {
    const delegation = await tx.approvalDelegation.findFirst({ where: { id: req.params.id, organizationId: req.user.organizationId, delegateId: req.user.id, status: 'PENDING', expiresAt: { gt: new Date() } } });
    if (!delegation?.documentId) return null;
    const document = await tx.document.findFirst({ where: { id: delegation.documentId, organizationId: req.user.organizationId } });
    if (!document) return null;
    const result = await tx.approvalDelegation.updateMany({ where: { id: delegation.id, status: 'PENDING' }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
    if (result.count !== 1) return null;
    await appendSignedAudit(tx, { organizationId: req.user.organizationId, actorId: req.user.id, action: 'DELEGATION_ACCEPTED', entityType: 'ApprovalDelegation', entityId: delegation.id, payload: { documentId: delegation.documentId, stageId: delegation.stepId, grantorId: delegation.grantorId }, retentionUntil: document.retentionUntil || new Date(Date.now() + 7 * 365 * 86_400_000) });
    return delegation;
  });
  if (!accepted) return res.status(404).json({ error: 'DELEGATION_NOT_FOUND' });
  res.json({ accepted: true });
});

export default router;
