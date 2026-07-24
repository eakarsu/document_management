import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedToken = (prefix: string): string =>
  `${prefix}-${randomBytes(24).toString('base64url')}`;

async function main() {
  const demoPassword = process.env.DEMO_SEED_PASSWORD || '';
  if (demoPassword.length < 12) throw new Error('DEMO_SEED_PASSWORD must contain at least 12 characters');
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  console.log('🌱 Starting comprehensive database seeding...');

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
    // ROLES
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

    const managerRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Manager',
          organizationId: richmondOrg.id
        }
      },
      update: {},
      create: {
        name: 'Manager',
        description: 'Department manager',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE', 'DOCUMENT_DELETE', 'WORKFLOW_MANAGE'],
        isSystem: true,
        organizationId: richmondOrg.id,
      },
    });

    const userRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'User',
          organizationId: richmondOrg.id
        }
      },
      update: {},
      create: {
        name: 'User',
        description: 'Standard user',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE'],
        isSystem: true,
        organizationId: richmondOrg.id,
      },
    });

    const reviewerRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'SUB_REVIEWER',
          organizationId: airforceOrg.id
        }
      },
      update: {},
      create: {
        name: 'SUB_REVIEWER',
        description: 'Subject Matter Expert Reviewer',
        permissions: ['view_documents', 'add_comments', 'submit_reviews'],
        organizationId: airforceOrg.id,
        roleType: 'SUBJECT_MATTER_EXPERT'
      }
    });

    console.log('✅ Roles created');

    // ========================================
    // USERS
    // ========================================
    // Richmond DMS Admin Users
    const admin = await prisma.user.upsert({
      where: { email: 'admin@richmond-dms.com' },
      update: { passwordHash },
      create: {
        passwordHash,
        email: 'admin@richmond-dms.com',
        firstName: 'System',
        lastName: 'Administrator',
        emailVerified: true,
        isActive: true,
        department: 'IT',
        jobTitle: 'System Administrator',
        roleId: adminRole.id,
        organizationId: richmondOrg.id,
      },
    });

    await prisma.user.upsert({
      where: { email: 'manager@richmond-dms.com' },
      update: { passwordHash },
      create: {
        passwordHash,
        email: 'manager@richmond-dms.com',
        firstName: 'John',
        lastName: 'Manager',
        emailVerified: true,
        isActive: true,
        department: 'Operations',
        jobTitle: 'Operations Manager',
        roleId: managerRole.id,
        organizationId: richmondOrg.id,
      },
    });

    await prisma.user.upsert({
      where: { email: 'user@richmond-dms.com' },
      update: { passwordHash },
      create: {
        passwordHash,
        email: 'user@richmond-dms.com',
        firstName: 'Jane',
        lastName: 'User',
        emailVerified: true,
        isActive: true,
        department: 'Business',
        jobTitle: 'Business Analyst',
        roleId: userRole.id,
        organizationId: richmondOrg.id,
      },
    });

    // Air Force Workflow Users (testpass123)
    const airforceUsers = [
      // Stage 1: Action Officers
      { email: 'ao1@airforce.mil', firstName: 'Primary', lastName: 'Action Officer', role: userRole },
      { email: 'ao2@airforce.mil', firstName: 'Secondary', lastName: 'Action Officer', role: userRole },

      // Stage 2: PCM
      { email: 'pcm@airforce.mil', firstName: 'Program', lastName: 'Control Manager', role: adminRole },

      // Coordinator
      { email: 'coordinator1@airforce.mil', firstName: 'Workflow', lastName: 'Coordinator', role: adminRole },

      // Front Office Gatekeepers
      { email: 'ops.frontoffice@airforce.mil', firstName: 'Operations', lastName: 'Front Office', role: userRole },
      { email: 'log.frontoffice@airforce.mil', firstName: 'Logistics', lastName: 'Front Office', role: userRole },
      { email: 'fin.frontoffice@airforce.mil', firstName: 'Finance', lastName: 'Front Office', role: userRole },
      { email: 'per.frontoffice@airforce.mil', firstName: 'Personnel', lastName: 'Front Office', role: userRole },

      // Squadron Leadership
      { email: 'sq.cc@airforce.mil', firstName: 'Squadron', lastName: 'Commander', role: adminRole },
      { email: 'sq.do@airforce.mil', firstName: 'Squadron', lastName: 'Director Ops', role: adminRole },

      // Group Leadership
      { email: 'gp.cc@airforce.mil', firstName: 'Group', lastName: 'Commander', role: adminRole },
      { email: 'gp.cd@airforce.mil', firstName: 'Group', lastName: 'Deputy Commander', role: adminRole },

      // Wing Leadership
      { email: 'wg.cc@airforce.mil', firstName: 'Wing', lastName: 'Commander', role: adminRole },
      { email: 'wg.cv@airforce.mil', firstName: 'Wing', lastName: 'Vice Commander', role: adminRole },

      // Executive Review
      { email: 'exec.reviewer1@airforce.mil', firstName: 'Executive', lastName: 'Reviewer One', role: adminRole },
      { email: 'exec.reviewer2@airforce.mil', firstName: 'Executive', lastName: 'Reviewer Two', role: adminRole },

      // Final Approval
      { email: 'final.approver@airforce.mil', firstName: 'Final', lastName: 'Approver', role: adminRole },

      // Additional Key Roles
      { email: 'legal.reviewer@airforce.mil', firstName: 'Legal', lastName: 'Compliance Officer', role: adminRole },
      { email: 'opr.leadership@airforce.mil', firstName: 'OPR', lastName: 'Commander', role: adminRole },
      { email: 'afdpo.publisher@airforce.mil', firstName: 'AFDPO', lastName: 'Publisher', role: adminRole },
      { email: 'admin@airforce.mil', firstName: 'Workflow', lastName: 'Administrator', role: adminRole },
    ];

    for (const userData of airforceUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: { passwordHash },
        create: {
          passwordHash,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: true,
          isActive: true,
          department: 'Air Force',
          jobTitle: `${userData.firstName} ${userData.lastName}`,
          roleId: userData.role.id,
          organizationId: airforceOrg.id,
          username: userData.email.split('@')[0]
        },
      });
    }

    // Sub-Reviewers (reviewer123)
    const subReviewers = [
      { email: 'john.doe.ops@airforce.mil', firstName: 'John', lastName: 'Doe', dept: 'Operations' },
      { email: 'david.brown.ops@airforce.mil', firstName: 'David', lastName: 'Brown', dept: 'Operations' },
      { email: 'jane.smith.log@airforce.mil', firstName: 'Jane', lastName: 'Smith', dept: 'Logistics' },
      { email: 'lisa.davis.log@airforce.mil', firstName: 'Lisa', lastName: 'Davis', dept: 'Logistics' },
      { email: 'mike.johnson.fin@airforce.mil', firstName: 'Mike', lastName: 'Johnson', dept: 'Finance' },
      { email: 'robert.miller.fin@airforce.mil', firstName: 'Robert', lastName: 'Miller', dept: 'Finance' },
      { email: 'sarah.williams.per@airforce.mil', firstName: 'Sarah', lastName: 'Williams', dept: 'Personnel' },
      { email: 'emily.wilson.per@airforce.mil', firstName: 'Emily', lastName: 'Wilson', dept: 'Personnel' },
    ];

    for (const reviewer of subReviewers) {
      await prisma.user.upsert({
        where: { email: reviewer.email },
        update: { passwordHash },
        create: {
          passwordHash,
          email: reviewer.email,
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          emailVerified: true,
          isActive: true,
          department: reviewer.dept,
          jobTitle: 'Reviewer',
          roleId: reviewerRole.id,
          organizationId: airforceOrg.id,
          username: reviewer.email.split('@')[0]
        },
      });
    }

    console.log('✅ All users created');

    // ========================================
    // FOLDER STRUCTURE
    // ========================================
    const rootFolder = await prisma.folder.create({
      data: {
        name: 'Documents',
        description: 'Root document folder',
        fullPath: '/Documents',
        depth: 0,
        organizationId: richmondOrg.id,
      },
    });

    const folders = ['Financial', 'HR', 'Technical', 'Marketing', 'Legal'];
    for (const folderName of folders) {
      await prisma.folder.create({
        data: {
          name: folderName,
          description: `${folderName} documents`,
          parentFolderId: rootFolder.id,
          fullPath: `/Documents/${folderName}`,
          depth: 1,
          organizationId: richmondOrg.id,
        },
      });
    }

    console.log('✅ Folder structure created');

    // ========================================
    // SAMPLE DOCUMENTS
    // ========================================
    await prisma.document.create({
      data: {
        title: 'Air Force OPR Review Example',
        fileName: 'opr-review.pdf',
        originalName: 'opr-review.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        checksum: `opr-${Date.now()}-${Math.random()}`,
        storagePath: 'demo/opr-review.pdf',
        category: 'OPR',
        tags: ['opr', 'workflow', 'airforce'],
        status: 'DRAFT',
        createdById: admin.id,
        organizationId: richmondOrg.id,
        documentNumber: `DOC-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        qrCode: '',
        currentVersion: 1,
      },
    });

    await prisma.document.create({
      data: {
        title: 'Squadron Operations Plan',
        fileName: 'squadron-ops.docx',
        originalName: 'squadron-ops.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 512000,
        checksum: `ops-${Date.now()}-${Math.random()}`,
        storagePath: 'demo/squadron-ops.docx',
        category: 'Operations',
        tags: ['operations', 'planning', 'squadron'],
        status: 'IN_REVIEW',
        createdById: admin.id,
        organizationId: richmondOrg.id,
        documentNumber: `DOC-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        qrCode: '',
        currentVersion: 1,
      },
    });

    console.log('✅ Sample documents created');

    // ========================================
    // SYSTEM SETTINGS
    // ========================================
    const settings = [
      { key: 'SYSTEM_NAME', value: 'Richmond Document Management System' },
      { key: 'MAX_FILE_SIZE', value: '104857600' },
      { key: 'OCR_ENABLED', value: 'true' },
      { key: 'AI_CLASSIFICATION_ENABLED', value: 'true' },
      { key: 'EMAIL_NOTIFICATIONS', value: 'true' },
    ];

    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { ...setting, description: setting.key },
      });
    }

    console.log('✅ System settings configured');

    // ========================================
    // PASSWORD RESETS (15 records)
    // ========================================
    const passwordResetData = [
      { email: 'admin@richmond-dms.com', token: seedToken('rst-001'), status: 'PENDING' as const, ipAddress: '192.168.1.10', userAgent: 'Mozilla/5.0 Chrome/120', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'manager@richmond-dms.com', token: seedToken('rst-002'), status: 'USED' as const, ipAddress: '192.168.1.20', userAgent: 'Mozilla/5.0 Firefox/121', expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), usedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'user@richmond-dms.com', token: seedToken('rst-003'), status: 'EXPIRED' as const, ipAddress: '10.0.0.5', userAgent: 'Mozilla/5.0 Safari/17', expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'ao1@airforce.mil', token: seedToken('rst-004'), status: 'CANCELLED' as const, ipAddress: '172.16.0.1', userAgent: 'Mozilla/5.0 Edge/120', expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'pcm@airforce.mil', token: seedToken('rst-005'), status: 'PENDING' as const, ipAddress: '192.168.2.100', userAgent: 'Mozilla/5.0 Chrome/119', expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), userId: admin.id },
      { email: 'admin@richmond-dms.com', token: seedToken('rst-006'), status: 'USED' as const, ipAddress: '192.168.1.10', userAgent: 'Mozilla/5.0 Chrome/120', expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), usedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'coordinator1@airforce.mil', token: seedToken('rst-007'), status: 'EXPIRED' as const, ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 Firefox/120', expiresAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'legal.reviewer@airforce.mil', token: seedToken('rst-008'), status: 'PENDING' as const, ipAddress: '172.16.1.25', userAgent: 'Mozilla/5.0 Safari/16', expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), userId: admin.id },
      { email: 'sq.cc@airforce.mil', token: seedToken('rst-009'), status: 'USED' as const, ipAddress: '192.168.3.75', userAgent: 'Mozilla/5.0 Chrome/118', expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), usedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'wg.cc@airforce.mil', token: seedToken('rst-010'), status: 'CANCELLED' as const, ipAddress: '10.0.2.30', userAgent: 'Mozilla/5.0 Edge/119', expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'user@richmond-dms.com', token: seedToken('rst-011'), status: 'PENDING' as const, ipAddress: '192.168.1.55', userAgent: 'Mozilla/5.0 Chrome/121', expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000), userId: admin.id },
      { email: 'manager@richmond-dms.com', token: seedToken('rst-012'), status: 'EXPIRED' as const, ipAddress: '192.168.1.20', userAgent: 'Mozilla/5.0 Firefox/119', expiresAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'admin@airforce.mil', token: seedToken('rst-013'), status: 'USED' as const, ipAddress: '172.16.2.10', userAgent: 'Mozilla/5.0 Safari/17', expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'gp.cc@airforce.mil', token: seedToken('rst-014'), status: 'PENDING' as const, ipAddress: '10.0.3.15', userAgent: 'Mozilla/5.0 Chrome/120', expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), userId: admin.id },
      { email: 'final.approver@airforce.mil', token: seedToken('rst-015'), status: 'CANCELLED' as const, ipAddress: '192.168.4.40', userAgent: 'Mozilla/5.0 Edge/121', expiresAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: admin.id },
    ];

    for (const data of passwordResetData) {
      await prisma.passwordReset.create({ data });
    }
    console.log('✅ Password Resets seeded (15 records)');

    // ========================================
    // PASSWORD CHANGES (15 records)
    // ========================================
    const passwordChangeData = [
      { changeType: 'USER_INITIATED' as const, status: 'SUCCESS' as const, ipAddress: '192.168.1.10', userAgent: 'Chrome/120', reason: 'Regular password update', userId: admin.id },
      { changeType: 'ADMIN_RESET' as const, status: 'SUCCESS' as const, ipAddress: '192.168.1.20', userAgent: 'Firefox/121', reason: 'User forgot password', userId: admin.id },
      { changeType: 'FORCED_CHANGE' as const, status: 'PENDING' as const, ipAddress: '10.0.0.5', userAgent: 'Safari/17', reason: 'Password expired after 90 days', userId: admin.id },
      { changeType: 'RECOVERY' as const, status: 'SUCCESS' as const, ipAddress: '172.16.0.1', userAgent: 'Edge/120', reason: 'Account recovery via email', userId: admin.id },
      { changeType: 'USER_INITIATED' as const, status: 'FAILED' as const, ipAddress: '192.168.2.100', userAgent: 'Chrome/119', reason: 'Old password incorrect', userId: admin.id },
      { changeType: 'ADMIN_RESET' as const, status: 'SUCCESS' as const, ipAddress: '192.168.1.10', userAgent: 'Chrome/120', reason: 'Security breach response', userId: admin.id },
      { changeType: 'FORCED_CHANGE' as const, status: 'SUCCESS' as const, ipAddress: '10.0.1.50', userAgent: 'Firefox/120', reason: 'Compliance requirement', userId: admin.id },
      { changeType: 'USER_INITIATED' as const, status: 'SUCCESS' as const, ipAddress: '172.16.1.25', userAgent: 'Safari/16', reason: 'Periodic security update', userId: admin.id },
      { changeType: 'RECOVERY' as const, status: 'FAILED' as const, ipAddress: '192.168.3.75', userAgent: 'Chrome/118', reason: 'Recovery token expired', userId: admin.id },
      { changeType: 'ADMIN_RESET' as const, status: 'REVERTED' as const, ipAddress: '10.0.2.30', userAgent: 'Edge/119', reason: 'Unauthorized reset detected', userId: admin.id },
      { changeType: 'USER_INITIATED' as const, status: 'SUCCESS' as const, ipAddress: '192.168.1.55', userAgent: 'Chrome/121', reason: 'Upgrading password strength', userId: admin.id },
      { changeType: 'FORCED_CHANGE' as const, status: 'PENDING' as const, ipAddress: '192.168.1.20', userAgent: 'Firefox/119', reason: 'New policy enforcement', userId: admin.id },
      { changeType: 'RECOVERY' as const, status: 'SUCCESS' as const, ipAddress: '172.16.2.10', userAgent: 'Safari/17', reason: 'Phone-based recovery', userId: admin.id },
      { changeType: 'ADMIN_RESET' as const, status: 'SUCCESS' as const, ipAddress: '10.0.3.15', userAgent: 'Chrome/120', reason: 'New employee onboarding', userId: admin.id },
      { changeType: 'USER_INITIATED' as const, status: 'FAILED' as const, ipAddress: '192.168.4.40', userAgent: 'Edge/121', reason: 'New password too similar to old', userId: admin.id },
    ];

    for (const data of passwordChangeData) {
      await prisma.passwordChange.create({ data });
    }
    console.log('✅ Password Changes seeded (15 records)');

    // ========================================
    // CSV EXPORTS (15 records)
    // ========================================
    const csvExportData = [
      { fileName: 'users-export-2024-01.csv', exportType: 'users', recordCount: 150, fileSize: 45000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'documents-export-2024-01.csv', exportType: 'documents', recordCount: 320, fileSize: 128000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'audit-logs-2024-q1.csv', exportType: 'audit-logs', recordCount: 5000, fileSize: 2048000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'workflows-export.csv', exportType: 'workflows', recordCount: 45, fileSize: 12000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'roles-export.csv', exportType: 'roles', recordCount: 8, fileSize: 2500, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'users-export-2024-02.csv', exportType: 'users', recordCount: 0, fileSize: 0, status: 'PENDING' as const, userId: admin.id },
      { fileName: 'large-audit-export.csv', exportType: 'audit-logs', recordCount: 15000, fileSize: 0, status: 'IN_PROGRESS' as const, startedAt: new Date(), userId: admin.id },
      { fileName: 'documents-failed.csv', exportType: 'documents', recordCount: 0, fileSize: 0, status: 'FAILED' as const, errorMessage: 'Database timeout after 30s', userId: admin.id },
      { fileName: 'users-filtered-dept.csv', exportType: 'users', recordCount: 25, fileSize: 8500, status: 'COMPLETED' as const, filters: { department: 'Operations' }, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'all-data-backup.csv', exportType: 'documents', recordCount: 1200, fileSize: 5120000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'workflow-tasks-q4.csv', exportType: 'workflows', recordCount: 89, fileSize: 34000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'security-audit.csv', exportType: 'audit-logs', recordCount: 0, fileSize: 0, status: 'PENDING' as const, userId: admin.id },
      { fileName: 'monthly-users-march.csv', exportType: 'users', recordCount: 175, fileSize: 52000, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'documents-by-status.csv', exportType: 'documents', recordCount: 0, fileSize: 0, status: 'IN_PROGRESS' as const, startedAt: new Date(Date.now() - 60000), userId: admin.id },
      { fileName: 'roles-permissions.csv', exportType: 'roles', recordCount: 12, fileSize: 4800, status: 'COMPLETED' as const, completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), userId: admin.id },
    ];

    for (const data of csvExportData) {
      await prisma.csvExport.create({ data });
    }
    console.log('✅ CSV Exports seeded (15 records)');

    // ========================================
    // PDF EXPORTS (15 records)
    // ========================================
    const pdfExportData = [
      { fileName: 'annual-report-2024.pdf', exportType: 'report', pageCount: 45, fileSize: 2048000, status: 'COMPLETED' as const, templateUsed: 'executive', orientation: 'portrait', completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'technical-specs-v3.pdf', exportType: 'document', pageCount: 120, fileSize: 8192000, status: 'COMPLETED' as const, templateUsed: 'technical', orientation: 'portrait', completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'user-directory.pdf', exportType: 'users', pageCount: 12, fileSize: 512000, status: 'COMPLETED' as const, templateUsed: 'standard', orientation: 'landscape', completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'audit-summary-q1.pdf', exportType: 'audit-logs', pageCount: 28, fileSize: 1024000, status: 'COMPLETED' as const, templateUsed: 'executive', orientation: 'portrait', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'compliance-report.pdf', exportType: 'report', pageCount: 0, fileSize: 0, status: 'PENDING' as const, templateUsed: 'legal', orientation: 'portrait', userId: admin.id },
      { fileName: 'marketing-brochure.pdf', exportType: 'document', pageCount: 8, fileSize: 4096000, status: 'COMPLETED' as const, templateUsed: 'marketing', orientation: 'landscape', completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'workflow-overview.pdf', exportType: 'workflows', pageCount: 0, fileSize: 0, status: 'IN_PROGRESS' as const, templateUsed: 'standard', orientation: 'portrait', startedAt: new Date(), userId: admin.id },
      { fileName: 'failed-large-export.pdf', exportType: 'document', pageCount: 0, fileSize: 0, status: 'FAILED' as const, templateUsed: 'technical', orientation: 'portrait', errorMessage: 'Out of memory generating PDF', userId: admin.id },
      { fileName: 'executive-summary.pdf', exportType: 'report', pageCount: 6, fileSize: 256000, status: 'COMPLETED' as const, templateUsed: 'executive', orientation: 'portrait', completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'ops-manual-v2.pdf', exportType: 'document', pageCount: 200, fileSize: 15360000, status: 'COMPLETED' as const, templateUsed: 'technical', orientation: 'portrait', completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'training-materials.pdf', exportType: 'document', pageCount: 35, fileSize: 3072000, status: 'COMPLETED' as const, templateUsed: 'standard', orientation: 'portrait', completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'security-policies.pdf', exportType: 'report', pageCount: 18, fileSize: 768000, status: 'COMPLETED' as const, templateUsed: 'legal', orientation: 'portrait', completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'quarterly-metrics.pdf', exportType: 'report', pageCount: 0, fileSize: 0, status: 'PENDING' as const, templateUsed: 'executive', orientation: 'landscape', userId: admin.id },
      { fileName: 'document-inventory.pdf', exportType: 'documents', pageCount: 55, fileSize: 2560000, status: 'COMPLETED' as const, templateUsed: 'standard', orientation: 'landscape', completedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), userId: admin.id },
      { fileName: 'legal-review-pack.pdf', exportType: 'document', pageCount: 75, fileSize: 6144000, status: 'COMPLETED' as const, templateUsed: 'legal', orientation: 'portrait', completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), userId: admin.id },
    ];

    for (const data of pdfExportData) {
      await prisma.pdfExport.create({ data });
    }
    console.log('✅ PDF Exports seeded (15 records)');

    // ========================================
    // CONFIRMATION DIALOGS (15 records)
    // ========================================
    const confirmationDialogData = [
      { name: 'delete-document', title: 'Delete Document', message: 'Are you sure you want to delete this document? This action cannot be undone.', confirmText: 'Delete', cancelText: 'Cancel', dialogType: 'DANGER' as const, severity: 'HIGH' as const, icon: 'delete', usageCount: 234 },
      { name: 'bulk-delete', title: 'Bulk Delete', message: 'You are about to delete multiple items. This action is irreversible.', confirmText: 'Delete All', cancelText: 'Keep All', dialogType: 'DANGER' as const, severity: 'CRITICAL' as const, icon: 'delete_sweep', usageCount: 56 },
      { name: 'archive-workflow', title: 'Archive Workflow', message: 'This workflow will be archived and no longer active. You can restore it later.', confirmText: 'Archive', cancelText: 'Cancel', dialogType: 'WARNING' as const, severity: 'MEDIUM' as const, icon: 'archive', usageCount: 89 },
      { name: 'publish-document', title: 'Publish Document', message: 'This document will be published and visible to all authorized users.', confirmText: 'Publish', cancelText: 'Cancel', dialogType: 'SUCCESS' as const, severity: 'MEDIUM' as const, icon: 'publish', usageCount: 312 },
      { name: 'submit-review', title: 'Submit for Review', message: 'Submit this document for review? Reviewers will be notified.', confirmText: 'Submit', cancelText: 'Cancel', dialogType: 'INFO' as const, severity: 'LOW' as const, icon: 'rate_review', usageCount: 445 },
      { name: 'reject-document', title: 'Reject Document', message: 'Please provide a reason for rejecting this document.', confirmText: 'Reject', cancelText: 'Cancel', dialogType: 'DANGER' as const, severity: 'HIGH' as const, icon: 'thumb_down', requireInput: true, inputLabel: 'Rejection Reason', usageCount: 78 },
      { name: 'approve-document', title: 'Approve Document', message: 'By approving, you confirm this document meets all requirements.', confirmText: 'Approve', cancelText: 'Cancel', dialogType: 'SUCCESS' as const, severity: 'MEDIUM' as const, icon: 'thumb_up', usageCount: 567 },
      { name: 'reset-password', title: 'Reset Password', message: 'A password reset link will be sent to the user\'s email address.', confirmText: 'Send Reset Link', cancelText: 'Cancel', dialogType: 'WARNING' as const, severity: 'MEDIUM' as const, icon: 'lock_reset', usageCount: 123 },
      { name: 'deactivate-user', title: 'Deactivate User', message: 'This user will be deactivated and unable to log in.', confirmText: 'Deactivate', cancelText: 'Cancel', dialogType: 'WARNING' as const, severity: 'HIGH' as const, icon: 'person_off', usageCount: 34 },
      { name: 'export-data', title: 'Export Data', message: 'Your export is being prepared. You will be notified when it\'s ready.', confirmText: 'Start Export', cancelText: 'Cancel', dialogType: 'INFO' as const, severity: 'LOW' as const, icon: 'download', usageCount: 201 },
      { name: 'cancel-workflow', title: 'Cancel Workflow', message: 'Cancelling this workflow will stop all pending tasks and notifications.', confirmText: 'Cancel Workflow', cancelText: 'Keep Active', dialogType: 'DANGER' as const, severity: 'CRITICAL' as const, icon: 'cancel', usageCount: 15 },
      { name: 'transfer-ownership', title: 'Transfer Ownership', message: 'Transfer document ownership to another user? You will lose edit access.', confirmText: 'Transfer', cancelText: 'Keep', dialogType: 'WARNING' as const, severity: 'HIGH' as const, icon: 'swap_horiz', usageCount: 42 },
      { name: 'logout-confirm', title: 'Confirm Logout', message: 'Are you sure you want to log out? Unsaved changes will be lost.', confirmText: 'Logout', cancelText: 'Stay', dialogType: 'INFO' as const, severity: 'LOW' as const, icon: 'logout', usageCount: 890 },
      { name: 'version-rollback', title: 'Rollback Version', message: 'Rolling back will restore the document to a previous version.', confirmText: 'Rollback', cancelText: 'Cancel', dialogType: 'WARNING' as const, severity: 'HIGH' as const, icon: 'restore', usageCount: 28 },
      { name: 'clear-notifications', title: 'Clear All Notifications', message: 'All notifications will be marked as read and cleared from your inbox.', confirmText: 'Clear All', cancelText: 'Cancel', dialogType: 'INFO' as const, severity: 'LOW' as const, icon: 'notifications_off', usageCount: 456 },
    ];

    for (const data of confirmationDialogData) {
      await prisma.confirmationDialog.create({ data });
    }
    console.log('✅ Confirmation Dialogs seeded (15 records)');

    // ========================================
    // EMAIL VERIFICATIONS (15 records)
    // ========================================
    const emailVerificationData = [
      { email: 'admin@richmond-dms.com', token: seedToken('ev-001'), status: 'VERIFIED' as const, attempts: 1, maxAttempts: 3, ipAddress: '192.168.1.10', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'manager@richmond-dms.com', token: seedToken('ev-002'), status: 'VERIFIED' as const, attempts: 1, maxAttempts: 3, ipAddress: '192.168.1.20', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'user@richmond-dms.com', token: seedToken('ev-003'), status: 'VERIFIED' as const, attempts: 2, maxAttempts: 3, ipAddress: '10.0.0.5', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'newuser1@richmond-dms.com', token: seedToken('ev-004'), status: 'PENDING' as const, attempts: 0, maxAttempts: 3, ipAddress: '192.168.1.55', expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), userId: admin.id },
      { email: 'newuser2@richmond-dms.com', token: seedToken('ev-005'), status: 'PENDING' as const, attempts: 1, maxAttempts: 3, ipAddress: '192.168.2.100', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'expired@richmond-dms.com', token: seedToken('ev-006'), status: 'EXPIRED' as const, attempts: 0, maxAttempts: 3, ipAddress: '10.0.1.50', expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'failed@richmond-dms.com', token: seedToken('ev-007'), status: 'FAILED' as const, attempts: 3, maxAttempts: 3, ipAddress: '172.16.0.1', expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'ao1@airforce.mil', token: seedToken('ev-008'), status: 'VERIFIED' as const, attempts: 1, maxAttempts: 3, ipAddress: '172.16.1.25', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'pcm@airforce.mil', token: seedToken('ev-009'), status: 'VERIFIED' as const, attempts: 1, maxAttempts: 3, ipAddress: '192.168.3.75', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'test@example.com', token: seedToken('ev-010'), status: 'EXPIRED' as const, attempts: 2, maxAttempts: 3, ipAddress: '10.0.2.30', expiresAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'bounced@invalid.com', token: seedToken('ev-011'), status: 'FAILED' as const, attempts: 3, maxAttempts: 3, ipAddress: '192.168.4.40', expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'coordinator1@airforce.mil', token: seedToken('ev-012'), status: 'VERIFIED' as const, attempts: 1, maxAttempts: 3, ipAddress: '10.0.3.15', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userId: admin.id },
      { email: 'newhire@richmond-dms.com', token: seedToken('ev-013'), status: 'PENDING' as const, attempts: 0, maxAttempts: 5, ipAddress: '192.168.1.80', expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), userId: admin.id },
      { email: 'contractor@richmond-dms.com', token: seedToken('ev-014'), status: 'PENDING' as const, attempts: 1, maxAttempts: 3, ipAddress: '172.16.2.10', expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), userId: admin.id },
      { email: 'temp@richmond-dms.com', token: seedToken('ev-015'), status: 'EXPIRED' as const, attempts: 0, maxAttempts: 3, ipAddress: '192.168.5.5', expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), userId: admin.id },
    ];

    for (const data of emailVerificationData) {
      await prisma.emailVerification.create({ data });
    }
    console.log('✅ Email Verifications seeded (15 records)');

    // ========================================
    // PASSWORD STRENGTH RULES (15 records)
    // ========================================
    const passwordStrengthRuleData = [
      { name: 'Minimum Length', description: 'Password must be at least 8 characters long', ruleType: 'MIN_LENGTH' as const, value: '8', priority: 1, errorMessage: 'Password must be at least 8 characters' },
      { name: 'Maximum Length', description: 'Password must not exceed 128 characters', ruleType: 'MAX_LENGTH' as const, value: '128', priority: 2, errorMessage: 'Password must not exceed 128 characters' },
      { name: 'Require Uppercase', description: 'At least one uppercase letter required', ruleType: 'REQUIRE_UPPERCASE' as const, value: '1', priority: 3, errorMessage: 'Password must contain at least one uppercase letter' },
      { name: 'Require Lowercase', description: 'At least one lowercase letter required', ruleType: 'REQUIRE_LOWERCASE' as const, value: '1', priority: 4, errorMessage: 'Password must contain at least one lowercase letter' },
      { name: 'Require Number', description: 'At least one numeric digit required', ruleType: 'REQUIRE_NUMBER' as const, value: '1', priority: 5, errorMessage: 'Password must contain at least one number' },
      { name: 'Require Special Character', description: 'At least one special character required (!@#$%^&*)', ruleType: 'REQUIRE_SPECIAL' as const, value: '1', priority: 6, errorMessage: 'Password must contain at least one special character' },
      { name: 'No Common Passwords', description: 'Password must not be in the common passwords list', ruleType: 'NO_COMMON_PASSWORDS' as const, value: 'top-10000', priority: 7, errorMessage: 'This password is too common. Please choose a stronger password' },
      { name: 'No Repeating Characters', description: 'No more than 3 consecutive identical characters', ruleType: 'NO_REPEATING_CHARS' as const, value: '3', priority: 8, errorMessage: 'Password must not contain more than 3 repeating characters' },
      { name: 'No Sequential Characters', description: 'No more than 3 sequential characters (abc, 123)', ruleType: 'NO_SEQUENTIAL_CHARS' as const, value: '3', priority: 9, errorMessage: 'Password must not contain sequential characters' },
      { name: 'No Username in Password', description: 'Password must not contain the username', ruleType: 'NO_USERNAME' as const, value: 'true', priority: 10, errorMessage: 'Password must not contain your username' },
      { name: 'Custom Regex - No Spaces', description: 'Password must not contain spaces', ruleType: 'CUSTOM_REGEX' as const, value: '^\\S+$', priority: 11, errorMessage: 'Password must not contain spaces' },
      { name: 'Minimum Unique Characters', description: 'At least 5 unique characters required', ruleType: 'MIN_UNIQUE_CHARS' as const, value: '5', priority: 12, errorMessage: 'Password must contain at least 5 unique characters' },
      { name: 'No Dictionary Words', description: 'Password should not be a dictionary word', ruleType: 'NO_DICTIONARY_WORDS' as const, value: 'english', priority: 13, errorMessage: 'Password must not be a common dictionary word' },
      { name: 'Password Expiration', description: 'Password expires after 90 days', ruleType: 'EXPIRATION_DAYS' as const, value: '90', priority: 14, errorMessage: 'Your password has expired. Please set a new password' },
      { name: 'Password History', description: 'Cannot reuse last 5 passwords', ruleType: 'HISTORY_CHECK' as const, value: '5', priority: 15, errorMessage: 'Cannot reuse a recent password. Please choose a new one' },
    ];

    for (const data of passwordStrengthRuleData) {
      await prisma.passwordStrengthRule.create({ data });
    }
    console.log('✅ Password Strength Rules seeded (15 records)');

    // ========================================
    // INPUT SANITIZATION RULES (15 records)
    // ========================================
    const inputSanitizationRuleData = [
      { name: 'XSS Script Tag Block', description: 'Blocks script tags to prevent XSS attacks', ruleType: 'XSS_PREVENTION' as const, pattern: '<script[^>]*>[\\s\\S]*?<\\/script>', replacement: '', fieldTarget: '*', priority: 1, blockedCount: 1234, errorMessage: 'Script tags are not allowed' },
      { name: 'SQL Injection - Union Select', description: 'Blocks UNION SELECT SQL injection attempts', ruleType: 'SQL_INJECTION' as const, pattern: '\\bUNION\\s+SELECT\\b', replacement: '', fieldTarget: '*', priority: 2, blockedCount: 567, errorMessage: 'SQL injection pattern detected' },
      { name: 'HTML Tag Escape', description: 'Escapes HTML entities in user input', ruleType: 'HTML_ESCAPE' as const, pattern: '[<>&"\']', replacement: '&entity;', fieldTarget: 'text_fields', priority: 3, blockedCount: 8901, errorMessage: 'HTML characters must be escaped' },
      { name: 'Path Traversal Block', description: 'Prevents directory traversal attacks', ruleType: 'PATH_TRAVERSAL' as const, pattern: '\\.\\.[\\/\\\\]', replacement: '', fieldTarget: 'file_paths', priority: 4, blockedCount: 345, errorMessage: 'Path traversal patterns are not allowed' },
      { name: 'Command Injection Block', description: 'Blocks shell command injection patterns', ruleType: 'COMMAND_INJECTION' as const, pattern: '[;|&`$()]', replacement: '', fieldTarget: 'system_fields', priority: 5, blockedCount: 189, errorMessage: 'Command injection pattern detected' },
      { name: 'LDAP Injection Block', description: 'Prevents LDAP injection in directory queries', ruleType: 'LDAP_INJECTION' as const, pattern: '[()\\\\*]', replacement: '', fieldTarget: 'search_fields', priority: 6, blockedCount: 78, errorMessage: 'LDAP special characters are not allowed' },
      { name: 'XML Entity Block', description: 'Blocks XML external entity injection', ruleType: 'XML_INJECTION' as const, pattern: '<!ENTITY|<!DOCTYPE', replacement: '', fieldTarget: 'xml_fields', priority: 7, blockedCount: 56, errorMessage: 'XML entities are not allowed in input' },
      { name: 'Email Format Validation', description: 'Validates email address format', ruleType: 'EMAIL_VALIDATION' as const, pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', replacement: '', fieldTarget: 'email', priority: 8, blockedCount: 2345, errorMessage: 'Please enter a valid email address' },
      { name: 'URL Format Validation', description: 'Validates URL format and blocks dangerous protocols', ruleType: 'URL_VALIDATION' as const, pattern: '^https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+', replacement: '', fieldTarget: 'url_fields', priority: 9, blockedCount: 456, errorMessage: 'Please enter a valid HTTP/HTTPS URL' },
      { name: 'File Type Restriction', description: 'Only allows safe file extensions', ruleType: 'FILE_TYPE_CHECK' as const, pattern: '\\.(pdf|docx?|xlsx?|pptx?|txt|csv|png|jpe?g|gif)$', replacement: '', fieldTarget: 'file_upload', priority: 10, blockedCount: 234, errorMessage: 'This file type is not allowed' },
      { name: 'File Size Limit', description: 'Maximum file upload size of 100MB', ruleType: 'SIZE_LIMIT' as const, pattern: '104857600', replacement: '', fieldTarget: 'file_upload', priority: 11, blockedCount: 89, errorMessage: 'File exceeds the maximum size limit of 100MB' },
      { name: 'API Rate Limit', description: 'Maximum 100 requests per minute per user', ruleType: 'RATE_LIMIT' as const, pattern: '100/minute', replacement: '', fieldTarget: 'api_endpoints', priority: 12, blockedCount: 4567, errorMessage: 'Rate limit exceeded. Please try again later' },
      { name: 'UTF-8 Encoding Check', description: 'Ensures all input is valid UTF-8', ruleType: 'ENCODING_CHECK' as const, pattern: 'utf-8', replacement: '', fieldTarget: '*', priority: 13, blockedCount: 12, errorMessage: 'Input contains invalid characters' },
      { name: 'Custom Phone Regex', description: 'Validates phone number format', ruleType: 'CUSTOM_REGEX' as const, pattern: '^\\+?[1-9]\\d{1,14}$', replacement: '', fieldTarget: 'phone', priority: 14, blockedCount: 678, errorMessage: 'Please enter a valid phone number' },
      { name: 'Content Type Validation', description: 'Validates Content-Type header matches body', ruleType: 'CONTENT_TYPE_CHECK' as const, pattern: 'application/json|multipart/form-data', replacement: '', fieldTarget: 'headers', priority: 15, blockedCount: 34, errorMessage: 'Invalid Content-Type header' },
    ];

    for (const data of inputSanitizationRuleData) {
      await prisma.inputSanitizationRule.create({ data });
    }
    console.log('✅ Input Sanitization Rules seeded (15 records)');

    console.log('\n===========================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('===========================================');
    console.log('\n📋 Seeded Users:');
    console.log('\nRichmond DMS Admins:');
    console.log('  admin@richmond-dms.com');
    console.log('  manager@richmond-dms.com');
    console.log('  user@richmond-dms.com');
    console.log('\nAir Force Users:');
    console.log('  ao1@airforce.mil');
    console.log('  pcm@airforce.mil');
    console.log('  coordinator1@airforce.mil');
    console.log('  sq.cc@airforce.mil');
    console.log('  wg.cc@airforce.mil');
    console.log('  legal.reviewer@airforce.mil');
    console.log('  admin@airforce.mil');
    console.log('\nSub-Reviewers:');
    console.log('  john.doe.ops@airforce.mil');
    console.log('  jane.smith.log@airforce.mil');
    console.log('  ... and more!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
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
