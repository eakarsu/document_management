import { Prisma, PrismaClient } from '@prisma/client';
import { StorageService } from './StorageService';
import { appendSignedAudit } from '../security/signedAudit';

const sevenYears = () => new Date(Date.now() + 7 * 365 * 86_400_000);

export class RetentionService {
  constructor(private prisma = new PrismaClient(), private storage = new StorageService()) {}

  async setRetention(documentId: string, organizationId: string, actorId: string, retentionUntil: Date) {
    if (!Number.isFinite(retentionUntil.getTime()) || retentionUntil <= new Date()) throw new Error('FUTURE_RETENTION_DATE_REQUIRED');
    return this.prisma.$transaction(async tx => {
      const document = await tx.document.findFirst({ where: { id: documentId, organizationId } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');
      const updated = await tx.document.update({ where: { id: document.id }, data: { retentionUntil } });
      await tx.attachment.updateMany({ where: { documentId }, data: { retentionUntil } });
      await appendSignedAudit(tx, { organizationId, actorId, action: 'RETENTION_SET', entityType: 'Document', entityId: documentId, payload: { previous: document.retentionUntil?.toISOString(), retentionUntil: retentionUntil.toISOString() }, retentionUntil });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async placeHold(documentId: string, organizationId: string, actorId: string, matter: string, reason: string) {
    if (matter.trim().length < 3 || reason.trim().length < 10) throw new Error('MATTER_AND_REASON_REQUIRED');
    return this.prisma.$transaction(async tx => {
      const document = await tx.document.findFirst({ where: { id: documentId, organizationId } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');
      const hold = await tx.legalHold.create({ data: { organizationId, documentId, matter, reason, placedById: actorId } });
      await tx.document.update({ where: { id: documentId }, data: { legalHoldActive: true } });
      await appendSignedAudit(tx, { organizationId, actorId, action: 'LEGAL_HOLD_PLACED', entityType: 'Document', entityId: documentId, payload: { holdId: hold.id, matter, reason }, retentionUntil: document.retentionUntil ?? sevenYears() });
      return hold;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async releaseHold(holdId: string, organizationId: string, actorId: string, reason: string) {
    if (reason.trim().length < 10) throw new Error('RELEASE_REASON_REQUIRED');
    return this.prisma.$transaction(async tx => {
      const hold = await tx.legalHold.findFirst({ where: { id: holdId, organizationId, releasedAt: null }, include: { document: true } });
      if (!hold) throw new Error('LEGAL_HOLD_NOT_FOUND');
      const released = await tx.legalHold.update({ where: { id: hold.id }, data: { releasedAt: new Date(), releasedById: actorId, reason: `${hold.reason}\nRelease: ${reason}` } });
      const remaining = await tx.legalHold.count({ where: { documentId: hold.documentId, releasedAt: null } });
      if (!remaining) await tx.document.update({ where: { id: hold.documentId }, data: { legalHoldActive: false } });
      await appendSignedAudit(tx, { organizationId, actorId, action: 'LEGAL_HOLD_RELEASED', entityType: 'Document', entityId: hold.documentId, payload: { holdId, reason }, retentionUntil: hold.document.retentionUntil ?? sevenYears() });
      return released;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async requestDeletion(documentId: string, organizationId: string, actorId: string) {
    return this.prisma.$transaction(async tx => {
      const document = await tx.document.findFirst({ where: { id: documentId, organizationId }, include: { versions: true, attachments: { where: { deletedAt: null } } } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');
      if (document.legalHoldActive) throw new Error('LEGAL_HOLD_ACTIVE');
      if (document.retentionUntil && document.retentionUntil > new Date()) throw new Error('RETENTION_ACTIVE');
      const objectKeys = [...new Set([document.storagePath, ...document.versions.map(v => v.storagePath), ...document.attachments.map(a => a.storagePath), ...document.versions.map(v => v.diffPath).filter(Boolean) as string[]])].filter(Boolean);
      const job = await tx.objectDeletionJob.create({ data: { organizationId, documentId, objectKeys, requestedById: actorId } });
      await tx.document.update({ where: { id: document.id }, data: { status: 'DELETED', deletionRequestedAt: new Date() } });
      await appendSignedAudit(tx, { organizationId, actorId, action: 'DELETION_REQUESTED', entityType: 'Document', entityId: documentId, payload: { jobId: job.id, objectCount: objectKeys.length }, retentionUntil: sevenYears() });
      return job;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async processDeletion(jobId: string, organizationId: string, actorId: string) {
    const job = await this.prisma.objectDeletionJob.findFirst({ where: { id: jobId, organizationId, status: { in: ['PENDING', 'FAILED'] } }, include: { document: true } });
    if (!job) throw new Error('DELETION_JOB_NOT_FOUND');
    if (job.document.legalHoldActive) {
      await this.prisma.objectDeletionJob.update({ where: { id: job.id }, data: { status: 'BLOCKED_LEGAL_HOLD', lastError: 'LEGAL_HOLD_ACTIVE' } });
      throw new Error('LEGAL_HOLD_ACTIVE');
    }
    await this.prisma.objectDeletionJob.update({ where: { id: job.id }, data: { status: 'IN_PROGRESS', attempts: { increment: 1 }, lastError: null } });
    const failures: string[] = [];
    for (const key of job.objectKeys) if (!(await this.storage.deleteDocumentForOrganization(key, organizationId))) failures.push(key);
    if (failures.length) {
      await this.prisma.objectDeletionJob.update({ where: { id: job.id }, data: { status: 'FAILED', lastError: `Failed keys: ${failures.join(', ')}`.slice(0, 2000) } });
      throw new Error('OBJECT_DELETION_INCOMPLETE');
    }
    return this.prisma.$transaction(async tx => {
      const completedAt = new Date();
      const completed = await tx.objectDeletionJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt } });
      await tx.document.update({ where: { id: job.documentId }, data: { storageDeletedAt: completedAt } });
      await tx.attachment.updateMany({ where: { documentId: job.documentId }, data: { deletedAt: completedAt } });
      await appendSignedAudit(tx, { organizationId, actorId, action: 'DELETION_PROPAGATED', entityType: 'Document', entityId: job.documentId, payload: { jobId: job.id, objectCount: job.objectKeys.length }, retentionUntil: sevenYears() });
      return completed;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
