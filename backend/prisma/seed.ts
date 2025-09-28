import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const testPassword = await bcrypt.hash('testpass123', 10);
  const reviewerPassword = await bcrypt.hash('reviewer123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Create original demo users (keeping for backward compatibility)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@richmond-dms.com' },
    update: {},
    create: {
      email: 'admin@richmond-dms.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  // Stage 1: Action Officers
  await prisma.user.upsert({
    where: { email: 'ao1@airforce.mil' },
    update: {},
    create: {
      email: 'ao1@airforce.mil',
      password: testPassword,
      name: 'Primary Action Officer',
      role: 'user',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ao2@airforce.mil' },
    update: {},
    create: {
      email: 'ao2@airforce.mil',
      password: testPassword,
      name: 'Secondary Action Officer',
      role: 'user',
    },
  });

  // Stage 2: PCM Review
  await prisma.user.upsert({
    where: { email: 'pcm@airforce.mil' },
    update: {},
    create: {
      email: 'pcm@airforce.mil',
      password: testPassword,
      name: 'Program Control Manager',
      role: 'admin',
    },
  });

  // Stages 3 & 5: Coordinator
  await prisma.user.upsert({
    where: { email: 'coordinator1@airforce.mil' },
    update: {},
    create: {
      email: 'coordinator1@airforce.mil',
      password: testPassword,
      name: 'Workflow Coordinator',
      role: 'admin',
    },
  });

  // Front Office Gatekeepers
  await prisma.user.upsert({
    where: { email: 'ops.frontoffice@airforce.mil' },
    update: {},
    create: {
      email: 'ops.frontoffice@airforce.mil',
      password: testPassword,
      name: 'Operations Front Office',
      role: 'user',
    },
  });

  await prisma.user.upsert({
    where: { email: 'log.frontoffice@airforce.mil' },
    update: {},
    create: {
      email: 'log.frontoffice@airforce.mil',
      password: testPassword,
      name: 'Logistics Front Office',
      role: 'user',
    },
  });

  await prisma.user.upsert({
    where: { email: 'fin.frontoffice@airforce.mil' },
    update: {},
    create: {
      email: 'fin.frontoffice@airforce.mil',
      password: testPassword,
      name: 'Finance Front Office',
      role: 'user',
    },
  });

  await prisma.user.upsert({
    where: { email: 'per.frontoffice@airforce.mil' },
    update: {},
    create: {
      email: 'per.frontoffice@airforce.mil',
      password: testPassword,
      name: 'Personnel Front Office',
      role: 'user',
    },
  });

  // Sub-Reviewers (using reviewer123 password)
  const subReviewers = [
    { email: 'john.doe.ops@airforce.mil', name: 'John Doe', dept: 'Operations' },
    { email: 'david.brown.ops@airforce.mil', name: 'David Brown', dept: 'Operations' },
    { email: 'jane.smith.log@airforce.mil', name: 'Jane Smith', dept: 'Logistics' },
    { email: 'lisa.davis.log@airforce.mil', name: 'Lisa Davis', dept: 'Logistics' },
    { email: 'mike.johnson.fin@airforce.mil', name: 'Mike Johnson', dept: 'Finance' },
    { email: 'robert.miller.fin@airforce.mil', name: 'Robert Miller', dept: 'Finance' },
    { email: 'sarah.williams.per@airforce.mil', name: 'Sarah Williams', dept: 'Personnel' },
    { email: 'emily.wilson.per@airforce.mil', name: 'Emily Wilson', dept: 'Personnel' },
  ];

  for (const reviewer of subReviewers) {
    await prisma.user.upsert({
      where: { email: reviewer.email },
      update: {},
      create: {
        email: reviewer.email,
        password: reviewerPassword,
        name: `${reviewer.name} (${reviewer.dept})`,
        role: 'user',
      },
    });
  }

  // Stage 6: Squadron Leadership
  await prisma.user.upsert({
    where: { email: 'sq.cc@airforce.mil' },
    update: {},
    create: {
      email: 'sq.cc@airforce.mil',
      password: testPassword,
      name: 'Squadron Commander',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'sq.do@airforce.mil' },
    update: {},
    create: {
      email: 'sq.do@airforce.mil',
      password: testPassword,
      name: 'Squadron Director of Operations',
      role: 'admin',
    },
  });

  // Stage 7: Group Leadership
  await prisma.user.upsert({
    where: { email: 'gp.cc@airforce.mil' },
    update: {},
    create: {
      email: 'gp.cc@airforce.mil',
      password: testPassword,
      name: 'Group Commander',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'gp.cd@airforce.mil' },
    update: {},
    create: {
      email: 'gp.cd@airforce.mil',
      password: testPassword,
      name: 'Group Deputy Commander',
      role: 'admin',
    },
  });

  // Stage 8: Wing Leadership
  await prisma.user.upsert({
    where: { email: 'wg.cc@airforce.mil' },
    update: {},
    create: {
      email: 'wg.cc@airforce.mil',
      password: testPassword,
      name: 'Wing Commander',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'wg.cv@airforce.mil' },
    update: {},
    create: {
      email: 'wg.cv@airforce.mil',
      password: testPassword,
      name: 'Wing Vice Commander',
      role: 'admin',
    },
  });

  // Stage 9: Executive Review
  await prisma.user.upsert({
    where: { email: 'exec.reviewer1@airforce.mil' },
    update: {},
    create: {
      email: 'exec.reviewer1@airforce.mil',
      password: testPassword,
      name: 'Executive Reviewer 1',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'exec.reviewer2@airforce.mil' },
    update: {},
    create: {
      email: 'exec.reviewer2@airforce.mil',
      password: testPassword,
      name: 'Executive Reviewer 2',
      role: 'admin',
    },
  });

  // Stage 10: Final Approval
  await prisma.user.upsert({
    where: { email: 'final.approver@airforce.mil' },
    update: {},
    create: {
      email: 'final.approver@airforce.mil',
      password: testPassword,
      name: 'Final Approver',
      role: 'admin',
    },
  });

  // Additional Key Roles
  await prisma.user.upsert({
    where: { email: 'legal.reviewer@airforce.mil' },
    update: {},
    create: {
      email: 'legal.reviewer@airforce.mil',
      password: testPassword,
      name: 'Legal Compliance Officer',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'opr.leadership@airforce.mil' },
    update: {},
    create: {
      email: 'opr.leadership@airforce.mil',
      password: testPassword,
      name: 'OPR Commander',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'afdpo.publisher@airforce.mil' },
    update: {},
    create: {
      email: 'afdpo.publisher@airforce.mil',
      password: testPassword,
      name: 'AFDPO Publisher',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@airforce.mil' },
    update: {},
    create: {
      email: 'admin@airforce.mil',
      password: testPassword,
      name: 'Workflow Administrator',
      role: 'admin',
    },
  });

  console.log('Created Air Force workflow users');

  // Create demo documents
  const doc1 = await prisma.document.create({
    data: {
      title: 'Air Force OPR Review Example',
      content: 'This document demonstrates the 10-stage hierarchical distributed review workflow used by the Air Force.',
      status: 'draft',
      ownerId: admin.id,
      metadata: {
        version: '1.0',
        category: 'OPR',
        workflow: 'hierarchical-distributed',
        stage: 1,
      },
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Squadron Operations Plan',
      content: 'Quarterly operations planning document requiring multi-level review and approval.',
      status: 'in_review',
      ownerId: admin.id,
      metadata: {
        version: '1.0',
        category: 'Operations',
        workflow: 'hierarchical-distributed',
        stage: 3,
      },
    },
  });

  console.log('Created demo documents');
  console.log('\n===========================================');
  console.log('Database seeded successfully!');
  console.log('===========================================');
  console.log('\nTest Accounts (Password: testpass123):');
  console.log('- ao1@airforce.mil (Action Officer)');
  console.log('- ao2@airforce.mil (Action Officer)');
  console.log('- pcm@airforce.mil (Program Control Manager)');
  console.log('- coordinator1@airforce.mil (Coordinator)');
  console.log('- ops.frontoffice@airforce.mil');
  console.log('- sq.cc@airforce.mil (Squadron Commander)');
  console.log('- gp.cc@airforce.mil (Group Commander)');
  console.log('- wg.cc@airforce.mil (Wing Commander)');
  console.log('- legal.reviewer@airforce.mil (Legal Compliance Officer)');
  console.log('- opr.leadership@airforce.mil (OPR Commander)');
  console.log('- afdpo.publisher@airforce.mil (AFDPO Publisher)');
  console.log('- admin@airforce.mil (Workflow Administrator)');
  console.log('\nSub-Reviewers (Password: reviewer123):');
  console.log('- john.doe.ops@airforce.mil');
  console.log('- jane.smith.log@airforce.mil');
  console.log('- mike.johnson.fin@airforce.mil');
  console.log('- sarah.williams.per@airforce.mil');
  console.log('... and more!');
  console.log('\nAdmin Account (Password: admin123):');
  console.log('- admin@richmond-dms.com');
  console.log('===========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });