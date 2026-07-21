import crypto from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';

type AuditClient = Prisma.TransactionClient | PrismaClient;

function signingConfig() {
  const secret = process.env.AUDIT_SIGNING_KEY;
  const keyId = process.env.AUDIT_SIGNING_KEY_ID;
  if (!secret || secret.length < 32 || !keyId) throw new Error('AUDIT_SIGNING_KEY (32+ chars) and AUDIT_SIGNING_KEY_ID are required');
  return { secret, keyId };
}

export async function appendSignedAudit(client: AuditClient, input: {
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  retentionUntil: Date;
}) {
  const { secret, keyId } = signingConfig();
  // Serialize each tenant's chain head so concurrent events cannot fork the
  // previousHash lineage. The lock is released with the surrounding DB tx.
  await client.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${input.organizationId}, 0)) IS NULL AS locked`);
  const previous = await client.signedAuditEvent.findFirst({ where: { organizationId: input.organizationId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  const createdAt = new Date();
  const canonical = JSON.stringify({ ...input, retentionUntil: input.retentionUntil.toISOString(), createdAt: createdAt.toISOString(), previousHash: previous?.eventHash ?? null });
  const eventHash = crypto.createHash('sha256').update(canonical).digest('hex');
  const signature = crypto.createHmac('sha256', secret).update(eventHash).digest('hex');
  return client.signedAuditEvent.create({ data: {
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload as Prisma.InputJsonValue,
    previousHash: previous?.eventHash,
    eventHash,
    signature,
    signingKeyId: keyId,
    retentionUntil: input.retentionUntil,
    createdAt,
  } });
}

export function verifyAuditSignature(eventHash: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(eventHash).digest();
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
