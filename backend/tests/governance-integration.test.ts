import { PrismaClient } from '@prisma/client';
import { GovernedWorkflowService } from '../src/services/GovernedWorkflowService';
import { RetentionService } from '../src/services/RetentionService';
import { AuthService } from '../src/services/AuthService';
import bcrypt from 'bcryptjs';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const testIfDatabase = enabled ? test : test.skip;
const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL } } });

async function clean() {
  const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'");
  if (rows.length) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${rows.map(row => `"${row.tablename.replace(/"/g, '""')}"`).join(', ')} CASCADE`);
}

describe('governed workflow integration', () => {
  beforeAll(async () => { if (enabled) await clean(); });
  afterAll(async () => { await prisma.$disconnect(); });

  testIfDatabase('isolates tenants and completes all twelve stages with a signed audit chain', async () => {
    const orgA = await prisma.organization.create({ data: { name: 'A', domain: 'a.invalid' } });
    const orgB = await prisma.organization.create({ data: { name: 'B', domain: 'b.invalid' } });
    const roleNames = ['ACTION_OFFICER', 'PCM', 'COORDINATOR', 'SUB_REVIEWER', 'OPR', 'LEGAL', 'LEADERSHIP', 'AFDPO'];
    const users: Record<string, any> = {};
    for (const name of roleNames) {
      const role = await prisma.role.create({ data: { name, organizationId: orgA.id, permissions: ['*'] } });
      users[name] = await prisma.user.create({ data: { email: `${name.toLowerCase()}@a.invalid`, passwordHash: 'not-used', firstName: name, lastName: 'Reviewer', roleId: role.id, organizationId: orgA.id, emailVerified: true, clearanceLevel: 'RESTRICTED' }, include: { role: true } });
    }
    const otherRole = await prisma.role.create({ data: { name: 'ADMIN', organizationId: orgB.id, permissions: ['*'] } });
    const outsider = await prisma.user.create({ data: { email: 'admin@b.invalid', passwordHash: 'not-used', firstName: 'Other', lastName: 'Tenant', roleId: otherRole.id, organizationId: orgB.id, emailVerified: true, clearanceLevel: 'RESTRICTED' }, include: { role: true } });
    const document = await prisma.document.create({ data: { title: 'Governed', fileName: 'g.pdf', originalName: 'g.pdf', mimeType: 'application/pdf', fileSize: 5, checksum: 'c'.repeat(64), storagePath: `organizations/${orgA.id}/documents/${'a'.repeat(32)}.pdf`, createdById: users.ACTION_OFFICER.id, organizationId: orgA.id, retentionUntil: new Date(Date.now() + 86_400_000) } });
    const subject = (user: any) => ({ id: user.id, organizationId: user.organizationId, role: { name: user.role.name }, clearanceLevel: user.clearanceLevel, accessAttributes: user.accessAttributes });
    const service = new GovernedWorkflowService(prisma);
    await expect(service.status(document.id, subject(outsider))).rejects.toThrow('DOCUMENT_NOT_FOUND');
    await service.initialize(document.id, subject(users.ACTION_OFFICER));
    const transitions = [
      ['ACTION_OFFICER', 'submit_to_pcm'], ['PCM', 'approve'], ['COORDINATOR', 'distribute_to_reviewers'], ['SUB_REVIEWER', 'complete_reviews'],
      ['ACTION_OFFICER', 'submit_for_second_coordination'], ['COORDINATOR', 'distribute_draft_to_reviewers'], ['SUB_REVIEWER', 'complete_draft_reviews'],
      ['OPR', 'submit_to_legal'], ['LEGAL', 'approve'], ['OPR', 'submit_to_leadership'], ['LEADERSHIP', 'approve'], ['AFDPO', 'publish'],
    ];
    for (const [role, action] of transitions) await service.transition(document.id, subject(users[role]), { action });
    expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).status).toBe('PUBLISHED');
    const audits = await prisma.signedAuditEvent.findMany({ where: { organizationId: orgA.id }, orderBy: { createdAt: 'asc' } });
    expect(audits).toHaveLength(13);
    expect(audits.at(-1)?.action).toBe('DOCUMENT_PUBLISHED');
    expect(audits.slice(1).every((event, index) => event.previousHash === audits[index].eventHash)).toBe(true);
  });

  testIfDatabase('blocks deletion under legal hold and propagates object deletion after release', async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { domain: 'a.invalid' } });
    const user = await prisma.user.findFirstOrThrow({ where: { organizationId: org.id } });
    const document = await prisma.document.create({ data: { title: 'Retention', fileName: 'r.pdf', originalName: 'r.pdf', mimeType: 'application/pdf', fileSize: 5, checksum: 'd'.repeat(64), storagePath: `organizations/${org.id}/documents/${'b'.repeat(32)}.pdf`, createdById: user.id, organizationId: org.id, retentionUntil: new Date(Date.now() - 1000) } });
    const deleted: string[] = [];
    const storage = { deleteDocumentForOrganization: async (key: string) => { deleted.push(key); return true; } };
    const retention = new RetentionService(prisma, storage as any);
    const hold = await retention.placeHold(document.id, org.id, user.id, 'Matter 1', 'Preserve for active litigation');
    await expect(retention.requestDeletion(document.id, org.id, user.id)).rejects.toThrow('LEGAL_HOLD_ACTIVE');
    await retention.releaseHold(hold.id, org.id, user.id, 'Matter is finally closed');
    const job = await retention.requestDeletion(document.id, org.id, user.id);
    const completed = await retention.processDeletion(job.id, org.id, user.id);
    expect(completed.status).toBe('COMPLETED');
    expect(deleted).toContain(document.storagePath);
    expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).storageDeletedAt).not.toBeNull();
  });

  testIfDatabase('enforces organization auth policy, rotates refresh tokens, and revokes sessions', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Session tenant',
        domain: 'session.invalid',
        authPolicy: { create: { requireMfa: false, idleTimeoutMinutes: 15, absoluteSessionHours: 1, maxActiveSessions: 2 } },
      },
    });
    const role = await prisma.role.create({ data: { name: 'USER', organizationId: organization.id, permissions: ['DOCUMENT_READ'] } });
    const password = 'correct horse battery staple';
    const user = await prisma.user.create({
      data: {
        email: 'session@session.invalid',
        passwordHash: await bcrypt.hash(password, 4),
        firstName: 'Session',
        lastName: 'Tester',
        roleId: role.id,
        organizationId: organization.id,
        emailVerified: true,
      },
    });
    const auth = new AuthService(prisma);
    const login = await auth.login(user.email, password, '127.0.0.1', 'integration-test');
    if (!login.success) throw new Error(login.error);
    expect((await auth.verifyToken(login.accessToken))?.organizationId).toBe(organization.id);

    const rotated = await auth.refreshToken(login.refreshToken);
    if (!rotated.refreshToken || !rotated.accessToken) throw new Error(rotated.error);
    expect(rotated.refreshToken).not.toBe(login.refreshToken);
    expect(await auth.verifyToken(rotated.accessToken)).not.toBeNull();
    await expect(auth.refreshToken(login.refreshToken)).resolves.toMatchObject({ error: 'REFRESH_TOKEN_REUSE_DETECTED' });
    expect(await auth.verifyToken(rotated.accessToken)).toBeNull();

    await auth.logout(user.id, login.user.sessionId);
    await prisma.organizationAuthPolicy.update({ where: { organizationId: organization.id }, data: { requireSso: true } });
    await expect(auth.login(user.email, password, '127.0.0.1', 'integration-test')).resolves.toMatchObject({ success: false, error: 'SSO_REQUIRED' });
  });
});
