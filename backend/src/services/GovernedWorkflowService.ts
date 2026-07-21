import { ClassificationLevel, Prisma, PrismaClient } from '@prisma/client';
import { appendSignedAudit } from '../security/signedAudit';
import { authorizeDocumentAccess, authorizeTransition, GovernanceRole, StageId, stageSequence } from '../security/governancePolicy';

export interface WorkflowActor {
  id: string;
  organizationId: string;
  role: { name: string };
  clearanceLevel: ClassificationLevel;
  accessAttributes: unknown;
}

const sevenYears = () => new Date(Date.now() + 7 * 365 * 86_400_000);

export class GovernedWorkflowService {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  private async accessibleDocument(documentId: string, actor: WorkflowActor) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organizationId: actor.organizationId, status: { not: 'DELETED' } },
      include: { permissions: { where: { userId: actor.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } },
    });
    if (!document) throw new Error('DOCUMENT_NOT_FOUND');
    const access = authorizeDocumentAccess({
      id: actor.id,
      organizationId: actor.organizationId,
      role: actor.role.name.toUpperCase() as GovernanceRole,
      clearance: actor.clearanceLevel,
      attributes: (actor.accessAttributes ?? {}) as { caveats?: string[]; departments?: string[] },
    }, {
      organizationId: document.organizationId,
      classification: document.classification,
      handlingCaveats: document.handlingCaveats,
      permittedUserIds: document.permissions.map((permission) => permission.userId),
    });
    if (!access.allowed) throw new Error(access.reason);
    return document;
  }

  async initialize(documentId: string, actor: WorkflowActor) {
    const document = await this.accessibleDocument(documentId, actor);
    const role = actor.role.name.toUpperCase();
    if (actor.id !== document.createdById && role !== 'ADMIN' && role !== 'ACTION_OFFICER') throw new Error('INITIALIZATION_NOT_AUTHORIZED');
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.jsonWorkflowInstance.findFirst({ where: { documentId, isActive: true } });
      if (existing) return existing;
      const instance = await tx.jsonWorkflowInstance.create({ data: {
        documentId,
        workflowId: 'af-12-stage-review-v3',
        currentStageId: '1',
        metadata: { sourceChecksum: document.checksum, documentVersion: document.currentVersion, governed: true },
      } });
      await tx.jsonWorkflowHistory.create({ data: {
        workflowInstanceId: instance.id,
        stageId: '1',
        stageName: 'Initial Draft Preparation',
        action: 'workflow_started',
        performedBy: actor.id,
        metadata: { documentVersion: document.currentVersion },
      } });
      await appendSignedAudit(tx, { organizationId: actor.organizationId, actorId: actor.id, action: 'WORKFLOW_STARTED', entityType: 'Document', entityId: documentId, payload: { workflowInstanceId: instance.id, checksum: document.checksum }, retentionUntil: document.retentionUntil ?? sevenYears() });
      return instance;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async status(documentId: string, actor: WorkflowActor) {
    await this.accessibleDocument(documentId, actor);
    const instance = await this.prisma.jsonWorkflowInstance.findFirst({ where: { documentId, isActive: true }, include: { history: { orderBy: { createdAt: 'asc' } } } });
    if (!instance) return null;
    return {
      id: instance.id,
      document_id: documentId,
      current_stage: instance.currentStageId,
      current_stage_id: instance.currentStageId,
      current_stage_order: stageSequence.indexOf(instance.currentStageId as StageId) + 1,
      total_stages: stageSequence.length,
      all_stages: stageSequence.map((id, index) => ({ id, order: index + 1 })),
      is_active: instance.isActive,
      created_at: instance.createdAt,
      updated_at: instance.updatedAt,
      completed_at: instance.completedAt,
      status: instance.isActive ? 'active' : 'completed',
      history: instance.history,
      version: instance.version,
    };
  }

  async transition(documentId: string, actor: WorkflowActor, input: { action: string; comment?: string }) {
    const document = await this.accessibleDocument(documentId, actor);
    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.jsonWorkflowInstance.findFirst({ where: { documentId, isActive: true } });
      if (!instance) throw new Error('WORKFLOW_NOT_INITIALIZED');
      const history = await tx.jsonWorkflowHistory.findMany({ where: { workflowInstanceId: instance.id }, orderBy: { createdAt: 'asc' } });
      const collaborators = await tx.document_collaborators.findMany({ where: { documentId, isActive: true }, select: { userId: true } });
      const delegation = await tx.approvalDelegation.findFirst({ where: {
        organizationId: actor.organizationId,
        delegateId: actor.id,
        status: 'ACCEPTED',
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
        documentId,
        stepId: instance.currentStageId,
      }, include: { grantor: { include: { role: true } } }, orderBy: { createdAt: 'desc' } });
      const aiContentPresent = document.aiClassification !== null || document.aiTags.length > 0 || Object.keys((document.aiResults ?? {}) as object).length > 0;
      const aiReviewApproved = !aiContentPresent || Boolean(await tx.aIReviewArtifact.findFirst({ where: { documentId, documentVersion: document.currentVersion, status: 'APPROVED', organizationId: actor.organizationId } }));
      const decision = authorizeTransition({
        currentStage: instance.currentStageId as StageId,
        action: input.action,
        actor: {
          id: actor.id,
          organizationId: actor.organizationId,
          role: actor.role.name.toUpperCase() as GovernanceRole,
          clearance: actor.clearanceLevel,
          attributes: (actor.accessAttributes ?? {}) as { caveats?: string[] },
        },
        documentCreatorId: document.createdById,
        assignedActorIds: collaborators.map((item) => item.userId),
        acceptedDelegation: delegation?.documentId && delegation.stepId ? {
          grantorId: delegation.grantorId,
          grantorRole: delegation.grantor.role.name.toUpperCase() as GovernanceRole,
          delegateId: delegation.delegateId,
          startsAt: delegation.startsAt,
          expiresAt: delegation.expiresAt,
          documentId: delegation.documentId,
          stageId: delegation.stepId as StageId,
        } : undefined,
        documentId,
        aiContentPresent,
        aiReviewApproved,
        priorStages: history.filter((event) => ['approve', 'complete_reviews', 'complete_draft_reviews'].includes(event.action)).map((event) => event.stageId as StageId),
        comment: input.comment,
      });
      if (!decision.allowed) throw new Error(decision.reason);
      const update = await tx.jsonWorkflowInstance.updateMany({
        where: { id: instance.id, currentStageId: instance.currentStageId, version: instance.version, isActive: true },
        data: { currentStageId: decision.nextStage, version: { increment: 1 }, isActive: !decision.complete, completedAt: decision.complete ? new Date() : null },
      });
      if (update.count !== 1) throw new Error('WORKFLOW_CONFLICT');
      await tx.jsonWorkflowHistory.create({ data: {
        workflowInstanceId: instance.id,
        stageId: instance.currentStageId,
        stageName: instance.currentStageId,
        action: input.action,
        performedBy: actor.id,
        metadata: { nextStage: decision.nextStage, comment: input.comment, delegatedBy: delegation?.grantorId, documentVersion: document.currentVersion },
      } });
      if (decision.complete) await tx.document.update({ where: { id: documentId }, data: { status: 'PUBLISHED' } });
      await appendSignedAudit(tx, { organizationId: actor.organizationId, actorId: actor.id, action: decision.complete ? 'DOCUMENT_PUBLISHED' : 'WORKFLOW_TRANSITION', entityType: 'Document', entityId: documentId, payload: { from: instance.currentStageId, to: decision.nextStage, workflowAction: input.action, workflowVersion: instance.version + 1, delegatedBy: delegation?.grantorId }, retentionUntil: document.retentionUntil ?? sevenYears() });
      return { previousStage: instance.currentStageId, currentStage: decision.nextStage, complete: decision.complete, version: instance.version + 1 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
