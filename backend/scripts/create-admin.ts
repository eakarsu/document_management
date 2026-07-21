import bcrypt from 'bcryptjs';
import { PrismaClient, RoleType } from '@prisma/client';

const acknowledgement = process.env.BOOTSTRAP_ACKNOWLEDGEMENT;
const email = process.env.PROVISION_ADMIN_EMAIL?.trim().toLowerCase();
const displayName = process.env.PROVISION_ADMIN_NAME?.trim() || 'Runtime Administrator';
const password = process.env.PROVISION_ADMIN_PASSWORD;

if (acknowledgement !== 'create-initial-admin') {
  throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
}
if (!email || !password || password.length < 12) {
  throw new Error('PROVISION_ADMIN_EMAIL and a 12+ character PROVISION_ADMIN_PASSWORD are required');
}
const adminEmail: string = email;
const adminPassword: string = password;

const [firstName, ...remainingName] = displayName.split(/\s+/);
const lastName = remainingName.join(' ') || 'Administrator';
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
  if (existing) throw new Error(`Refusing to replace existing account for ${adminEmail}`);

  const organization = await prisma.organization.upsert({
    where: { domain: 'runtime-acceptance.invalid' },
    update: { isActive: true },
    create: { name: 'Runtime Acceptance Organization', domain: 'runtime-acceptance.invalid' },
  });
  await prisma.organizationAuthPolicy.upsert({
    where: { organizationId: organization.id },
    update: { requireSso: false, requireMfa: false },
    create: { organizationId: organization.id, requireSso: false, requireMfa: false },
  });
  const role = await prisma.role.upsert({
    where: { name_organizationId: { name: 'Administrator', organizationId: organization.id } },
    update: { permissions: ['*'], roleType: RoleType.ADMIN },
    create: {
      name: 'Administrator',
      permissions: ['*'],
      isSystem: true,
      roleType: RoleType.ADMIN,
      organizationId: organization.id,
    },
  });
  await prisma.user.create({
    data: {
      email: adminEmail,
      firstName,
      lastName,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      roleId: role.id,
      organizationId: organization.id,
      emailVerified: true,
      mfaEnabled: false,
      isActive: true,
    },
  });
  console.log(`Created initial administrator ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
