import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Store credentials for output
interface UserCredential {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  stage?: string;
}

const userCredentials: UserCredential[] = [];

async function main() {
  console.log('🌱 Starting PRODUCTION database seeding with secure passwords...');
  console.log('⚠️  THIS IS FOR PRODUCTION - SECURE PASSWORDS WILL BE GENERATED');

  try {
    // ========================================
    // ORGANIZATIONS
    // ========================================
    const richmondOrg = await prisma.organization.upsert({
      where: { domain: 'richmond-dms.com' },
      update: {},
      create: {
        name: 'Richmond Document Management',
        domain: 'richmond-dms.com',
        settings: {
          theme: 'default',
          allowPublicSignup: false,
          maxStorageSize: 100 * 1024 * 1024 * 1024, // 100GB
          maxFileSize: 100 * 1024 * 1024, // 100MB
          retentionDays: 2555, // 7 years
        },
        isActive: true,
      },
    });

    const airforceOrg = await prisma.organization.upsert({
      where: { domain: 'airforce.mil' },
      update: {},
      create: {
        name: 'Air Force',
        domain: 'airforce.mil',
        settings: {},
        isActive: true
      }
    });

    console.log('✅ Organizations created');

    // ========================================
    // ROLES (same as development)
    // ========================================
    const adminRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Admin',
          organizationId: richmondOrg.id
        }
      },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system administrator',
        permissions: ['*'],
        isSystem: true,
        organizationId: richmondOrg.id,
      },
    });

    // Air Force specific roles
    const actionOfficerRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'ACTION_OFFICER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'ACTION_OFFICER',
        description: 'Action Officer - Stage 1: Initial Draft',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE', 'WORKFLOW_SUBMIT'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const pcmRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'PCM', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'PCM',
        description: 'PCM - Stage 2: OPR Gatekeeper Review',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const oprRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'OPR', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'OPR',
        description: 'OPR - Stage 3: Primary Coordination',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const ocrRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'OCR', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'OCR',
        description: 'OCR - Stage 4: Office of Collateral Responsibility',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const staffJudgeRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'STAFF_JUDGE_ADVOCATE', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'STAFF_JUDGE_ADVOCATE',
        description: 'Staff Judge Advocate - Stage 5: Legal Review',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const commanderRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'SQUADRON_COMMANDER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'SQUADRON_COMMANDER',
        description: 'Squadron Commander - Stage 6: Squadron-Level Approval',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const groupCommanderRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'GROUP_COMMANDER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'GROUP_COMMANDER',
        description: 'Group Commander - Stage 7: Group-Level Approval',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const wingCommanderRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'WING_COMMANDER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'WING_COMMANDER',
        description: 'Wing Commander - Stage 8: Wing-Level Approval',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const majcomRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'MAJCOM_REVIEWER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'MAJCOM_REVIEWER',
        description: 'MAJCOM Reviewer - Stage 9: Major Command Review',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const hqafRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'HQAF_APPROVER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'HQAF_APPROVER',
        description: 'HQ AF Approver - Stage 10: Final Headquarters Approval',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_APPROVE', 'DOCUMENT_PUBLISH'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const subReviewerRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'SUB_REVIEWER', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'SUB_REVIEWER',
        description: 'Subject Matter Expert Reviewer',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_COMMENT'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const coordinatorRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'COORDINATOR', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'COORDINATOR',
        description: 'Workflow Coordinator',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_MANAGE', 'WORKFLOW_APPROVE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    const frontOfficeRole = await prisma.role.upsert({
      where: { name_organizationId: { name: 'FRONT_OFFICE', organizationId: airforceOrg.id } },
      update: {},
      create: {
        name: 'FRONT_OFFICE',
        description: 'Front Office Gatekeeper',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_REVIEW', 'WORKFLOW_GATE'],
        isSystem: false,
        organizationId: airforceOrg.id,
      },
    });

    console.log('✅ Roles created');

    // ========================================
    // USERS WITH SECURE PASSWORDS
    // ========================================

    // Helper function to create user with secure password
    async function createSecureUser(
      email: string,
      firstName: string,
      lastName: string,
      roleObj: any,
      orgId: string,
      stage?: string
    ) {
      const password = generateSecurePassword(16);
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash: hashedPassword,
          firstName,
          lastName,
          roleId: roleObj.id,
          isActive: true,
          emailVerified: true,
        },
        create: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          organizationId: orgId,
          roleId: roleObj.id,
          isActive: true,
          emailVerified: true,
          username: email.split('@')[0],
        },
      });

      // Store credentials for output
      userCredentials.push({
        email,
        password,
        role: roleObj.name,
        firstName,
        lastName,
        stage,
      });

      console.log(`✅ Created user: ${email} (${roleObj.name})`);
    }

    // Admin user
    await createSecureUser(
      'admin@richmond-dms.com',
      'System',
      'Administrator',
      adminRole,
      richmondOrg.id
    );

    // Stage 1: Action Officers
    await createSecureUser('ao1@airforce.mil', 'Primary', 'Action Officer', actionOfficerRole, airforceOrg.id, 'Stage 1: Initial Draft - Action Officers');
    await createSecureUser('ao2@airforce.mil', 'Secondary', 'Action Officer', actionOfficerRole, airforceOrg.id, 'Stage 1: Initial Draft - Action Officers');

    // Stage 2: PCM
    await createSecureUser('pcm@airforce.mil', 'Program Control', 'Manager', pcmRole, airforceOrg.id, 'Stage 2: PCM Review (OPR Gatekeeper)');

    // Coordinator
    await createSecureUser('coordinator1@airforce.mil', 'Workflow', 'Coordinator', coordinatorRole, airforceOrg.id, 'Stages 3 & 5: Coordination Phases');

    // Front Office Gatekeepers
    await createSecureUser('ops.frontoffice@airforce.mil', 'Operations', 'Front Office', frontOfficeRole, airforceOrg.id, 'Front Office Gatekeepers');
    await createSecureUser('log.frontoffice@airforce.mil', 'Logistics', 'Front Office', frontOfficeRole, airforceOrg.id, 'Front Office Gatekeepers');
    await createSecureUser('fin.frontoffice@airforce.mil', 'Finance', 'Front Office', frontOfficeRole, airforceOrg.id, 'Front Office Gatekeepers');
    await createSecureUser('per.frontoffice@airforce.mil', 'Personnel', 'Front Office', frontOfficeRole, airforceOrg.id, 'Front Office Gatekeepers');

    // Sub-Reviewers
    await createSecureUser('john.doe.ops@airforce.mil', 'John', 'Doe', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Operations');
    await createSecureUser('david.brown.ops@airforce.mil', 'David', 'Brown', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Operations');
    await createSecureUser('jane.smith.log@airforce.mil', 'Jane', 'Smith', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Logistics');
    await createSecureUser('lisa.davis.log@airforce.mil', 'Lisa', 'Davis', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Logistics');
    await createSecureUser('mike.johnson.fin@airforce.mil', 'Mike', 'Johnson', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Finance');
    await createSecureUser('robert.miller.fin@airforce.mil', 'Robert', 'Miller', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Finance');
    await createSecureUser('sarah.williams.per@airforce.mil', 'Sarah', 'Williams', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Personnel');
    await createSecureUser('emily.wilson.per@airforce.mil', 'Emily', 'Wilson', subReviewerRole, airforceOrg.id, 'Sub-Reviewers - Personnel');

    // Squadron Leadership
    await createSecureUser('sq.cc@airforce.mil', 'Squadron', 'Commander', commanderRole, airforceOrg.id, 'Stage 6: Squadron Leadership');
    await createSecureUser('sq.do@airforce.mil', 'Squadron Director', 'Operations', commanderRole, airforceOrg.id, 'Stage 6: Squadron Leadership');

    // Group Leadership
    await createSecureUser('gp.cc@airforce.mil', 'Group', 'Commander', groupCommanderRole, airforceOrg.id, 'Stage 7: Group Leadership');
    await createSecureUser('gp.cd@airforce.mil', 'Group Deputy', 'Commander', groupCommanderRole, airforceOrg.id, 'Stage 7: Group Leadership');

    // Wing Leadership
    await createSecureUser('wg.cc@airforce.mil', 'Wing', 'Commander', wingCommanderRole, airforceOrg.id, 'Stage 8: Wing Leadership');
    await createSecureUser('wg.cv@airforce.mil', 'Wing Vice', 'Commander', wingCommanderRole, airforceOrg.id, 'Stage 8: Wing Leadership');

    // Executive Review
    await createSecureUser('exec.reviewer1@airforce.mil', 'Executive Reviewer', 'One', majcomRole, airforceOrg.id, 'Stage 9: Executive Review');
    await createSecureUser('exec.reviewer2@airforce.mil', 'Executive Reviewer', 'Two', majcomRole, airforceOrg.id, 'Stage 9: Executive Review');

    // Final Approval
    await createSecureUser('final.approver@airforce.mil', 'Final', 'Approver', hqafRole, airforceOrg.id, 'Stage 10: Final Approval');

    // Additional Key Roles
    await createSecureUser('legal.reviewer@airforce.mil', 'Legal Compliance', 'Officer', staffJudgeRole, airforceOrg.id, 'Stage 7: Legal Review & Approval');
    await createSecureUser('opr.leadership@airforce.mil', 'OPR', 'Commander', oprRole, airforceOrg.id, 'Stage 9: OPR Leadership Signature');
    await createSecureUser('afdpo.publisher@airforce.mil', 'AFDPO', 'Publisher', hqafRole, airforceOrg.id, 'Stage 10: AFDPO Publication');
    await createSecureUser('admin@airforce.mil', 'Workflow', 'Administrator', adminRole, airforceOrg.id, 'System Administration');

    console.log('✅ All users created with secure passwords');

    // ========================================
    // WRITE CREDENTIALS TO FILE
    // ========================================
    const credentialsOutput = `
==========================================
RICHMOND DMS - PRODUCTION CREDENTIALS
==========================================
Generated: ${new Date().toISOString()}

⚠️  CONFIDENTIAL - SECURE THESE CREDENTIALS
⚠️  Share only with authorized users via secure channel
⚠️  Users should change passwords after first login

==========================================
SYSTEM ADMINISTRATOR
==========================================
Email: ${userCredentials[0].email}
Password: ${userCredentials[0].password}
Role: ${userCredentials[0].role}

==========================================
WORKFLOW USERS (10 STAGES)
==========================================

${userCredentials.slice(1).map((cred, index) => `
${cred.stage || cred.role}
-------------------------------------------
Name: ${cred.firstName} ${cred.lastName}
Email: ${cred.email}
Password: ${cred.password}
Role: ${cred.role}
`).join('\n')}

==========================================
IMPORTANT NOTES:
==========================================
1. All passwords are randomly generated and secure
2. Users MUST change their password after first login
3. Store these credentials in a secure password manager
4. Do NOT commit this file to version control
5. Delete this file after distributing credentials securely

==========================================
LOGIN URL
==========================================
Production: https://your-domain.com/login

==========================================
`;

    const credentialsPath = path.join(__dirname, '../../PRODUCTION_CREDENTIALS.txt');
    fs.writeFileSync(credentialsPath, credentialsOutput);

    console.log('\n🔐 ========================================');
    console.log('🔐 PRODUCTION CREDENTIALS GENERATED');
    console.log('🔐 ========================================');
    console.log(`📄 File: ${credentialsPath}`);
    console.log('⚠️  KEEP THIS FILE SECURE!');
    console.log('⚠️  Share with authorized users via secure channel only');
    console.log('🔐 ========================================\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
