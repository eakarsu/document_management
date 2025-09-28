import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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

    console.log('✅ Organizations created:', richmondOrg.name, airforceOrg.name);

    // ========================================
    // ROLES - Complete Set
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
        description: 'Full system administrator with all permissions',
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
        description: 'Department manager with advanced permissions',
        permissions: [
          'DOCUMENT_READ',
          'DOCUMENT_WRITE',
          'DOCUMENT_DELETE',
          'DOCUMENT_SHARE',
          'FOLDER_MANAGE',
          'USER_MANAGEMENT',
          'WORKFLOW_MANAGE',
          'ANALYTICS_VIEW',
        ],
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
        description: 'Standard user with basic permissions',
        permissions: [
          'DOCUMENT_READ',
          'DOCUMENT_WRITE',
          'DOCUMENT_SHARE',
          'FOLDER_READ',
        ],
        isSystem: true,
        organizationId: richmondOrg.id,
      },
    });

    const guestRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Guest',
          organizationId: richmondOrg.id
        }
      },
      update: {},
      create: {
        name: 'Guest',
        description: 'Guest user with read-only access',
        permissions: ['DOCUMENT_READ'],
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

    console.log('✅ Roles created: Admin, Manager, User, Guest, SUB_REVIEWER');

    // ========================================
    // PASSWORD HASHING
    // ========================================
    const testPassword = await bcrypt.hash('testpass123', 12);
    const reviewerPassword = await bcrypt.hash('reviewer123', 12);
    const adminPassword = await bcrypt.hash('admin123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    // ========================================
    // RICHMOND DMS USERS (from database/seed.js)
    // ========================================
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@richmond-dms.com' },
      update: {},
      create: {
        email: 'admin@richmond-dms.com',
        passwordHash: adminPassword,
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

    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@richmond-dms.com' },
      update: {},
      create: {
        email: 'manager@richmond-dms.com',
        passwordHash: managerPassword,
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

    const regularUser = await prisma.user.upsert({
      where: { email: 'user@richmond-dms.com' },
      update: {},
      create: {
        email: 'user@richmond-dms.com',
        passwordHash: userPassword,
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

    console.log('✅ Richmond DMS users created');

    // ========================================
    // AIR FORCE WORKFLOW USERS (testpass123)
    // ========================================
    const airforceAdminRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Admin',
          organizationId: airforceOrg.id
        }
      },
      update: {},
      create: {
        name: 'Admin',
        description: 'Air Force Administrator',
        permissions: ['*'],
        isSystem: true,
        organizationId: airforceOrg.id,
      },
    });

    const airforceUserRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'User',
          organizationId: airforceOrg.id
        }
      },
      update: {},
      create: {
        name: 'User',
        description: 'Air Force User',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE'],
        isSystem: true,
        organizationId: airforceOrg.id,
      },
    });

    const airforceUsers = [
      // Stage 1: Action Officers
      { email: 'ao1@airforce.mil', firstName: 'Primary', lastName: 'Action Officer', role: airforceUserRole },
      { email: 'ao2@airforce.mil', firstName: 'Secondary', lastName: 'Action Officer', role: airforceUserRole },

      // Stage 2: PCM
      { email: 'pcm@airforce.mil', firstName: 'Program', lastName: 'Control Manager', role: airforceAdminRole },

      // Coordinator
      { email: 'coordinator1@airforce.mil', firstName: 'Workflow', lastName: 'Coordinator', role: airforceAdminRole },

      // Front Office Gatekeepers
      { email: 'ops.frontoffice@airforce.mil', firstName: 'Operations', lastName: 'Front Office', role: airforceUserRole },
      { email: 'log.frontoffice@airforce.mil', firstName: 'Logistics', lastName: 'Front Office', role: airforceUserRole },
      { email: 'fin.frontoffice@airforce.mil', firstName: 'Finance', lastName: 'Front Office', role: airforceUserRole },
      { email: 'per.frontoffice@airforce.mil', firstName: 'Personnel', lastName: 'Front Office', role: airforceUserRole },

      // Squadron Leadership
      { email: 'sq.cc@airforce.mil', firstName: 'Squadron', lastName: 'Commander', role: airforceAdminRole },
      { email: 'sq.do@airforce.mil', firstName: 'Squadron', lastName: 'Director Ops', role: airforceAdminRole },

      // Group Leadership
      { email: 'gp.cc@airforce.mil', firstName: 'Group', lastName: 'Commander', role: airforceAdminRole },
      { email: 'gp.cd@airforce.mil', firstName: 'Group', lastName: 'Deputy Commander', role: airforceAdminRole },

      // Wing Leadership
      { email: 'wg.cc@airforce.mil', firstName: 'Wing', lastName: 'Commander', role: airforceAdminRole },
      { email: 'wg.cv@airforce.mil', firstName: 'Wing', lastName: 'Vice Commander', role: airforceAdminRole },

      // Executive Review
      { email: 'exec.reviewer1@airforce.mil', firstName: 'Executive', lastName: 'Reviewer One', role: airforceAdminRole },
      { email: 'exec.reviewer2@airforce.mil', firstName: 'Executive', lastName: 'Reviewer Two', role: airforceAdminRole },

      // Final Approval
      { email: 'final.approver@airforce.mil', firstName: 'Final', lastName: 'Approver', role: airforceAdminRole },

      // Additional Key Roles
      { email: 'legal.reviewer@airforce.mil', firstName: 'Legal', lastName: 'Compliance Officer', role: airforceAdminRole },
      { email: 'opr.leadership@airforce.mil', firstName: 'OPR', lastName: 'Commander', role: airforceAdminRole },
      { email: 'afdpo.publisher@airforce.mil', firstName: 'AFDPO', lastName: 'Publisher', role: airforceAdminRole },
      { email: 'admin@airforce.mil', firstName: 'Workflow', lastName: 'Administrator', role: airforceAdminRole },
    ];

    for (const userData of airforceUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          passwordHash: testPassword,
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

    console.log('✅ Air Force workflow users created');

    // ========================================
    // SUB-REVIEWERS (reviewer123)
    // ========================================
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
        update: {},
        create: {
          email: reviewer.email,
          passwordHash: reviewerPassword,
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

    console.log('✅ Sub-reviewers created');

    // ========================================
    // FOLDER STRUCTURE (from database/seed.js)
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

    const folders = [
      {
        name: 'Financial',
        description: 'Financial documents and reports',
        parentId: rootFolder.id,
        path: '/Documents/Financial',
      },
      {
        name: 'HR',
        description: 'Human Resources documents',
        parentId: rootFolder.id,
        path: '/Documents/HR',
      },
      {
        name: 'Technical',
        description: 'Technical documentation and specs',
        parentId: rootFolder.id,
        path: '/Documents/Technical',
      },
      {
        name: 'Marketing',
        description: 'Marketing materials and campaigns',
        parentId: rootFolder.id,
        path: '/Documents/Marketing',
      },
      {
        name: 'Legal',
        description: 'Legal documents and contracts',
        parentId: rootFolder.id,
        path: '/Documents/Legal',
      },
    ];

    const folderMap: { [key: string]: any } = {};
    for (const folderData of folders) {
      const folder = await prisma.folder.create({
        data: {
          name: folderData.name,
          description: folderData.description,
          parentFolderId: folderData.parentId,
          fullPath: folderData.path,
          depth: 1,
          organizationId: richmondOrg.id,
        },
      });
      folderMap[folderData.name] = folder;
    }

    console.log('✅ Folder structure created');

    // ========================================
    // WORKFLOWS (from database/seed.js)
    // ========================================
    const approvalWorkflow = await prisma.workflow.create({
      data: {
        name: 'Document Approval',
        description: 'Standard document approval workflow',
        definition: {
          steps: [
            {
              id: 1,
              name: 'Review',
              type: 'approval',
              assigneeRole: 'Manager',
              autoApprove: false,
            },
            {
              id: 2,
              name: 'Final Approval',
              type: 'approval',
              assigneeRole: 'Admin',
              autoApprove: false,
            },
            {
              id: 3,
              name: 'Publish',
              type: 'action',
              autoExecute: true,
            },
          ],
        },
        isActive: true,
        organizationId: richmondOrg.id,
      },
    });

    console.log('✅ Sample workflows created');

    // ========================================
    // SYSTEM SETTINGS (from database/seed.js)
    // ========================================
    const settings = [
      {
        key: 'SYSTEM_NAME',
        value: 'Richmond Document Management System',
        description: 'Display name for the system',
      },
      {
        key: 'MAX_FILE_SIZE',
        value: '104857600', // 100MB in bytes
        description: 'Maximum file size for uploads',
      },
      {
        key: 'ALLOWED_FILE_TYPES',
        value: JSON.stringify([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
        ]),
        description: 'Allowed MIME types for file uploads',
      },
      {
        key: 'OCR_ENABLED',
        value: 'true',
        description: 'Enable OCR processing for uploaded documents',
      },
      {
        key: 'AI_CLASSIFICATION_ENABLED',
        value: 'true',
        description: 'Enable AI-powered document classification',
      },
      {
        key: 'RETENTION_DAYS',
        value: '2555', // 7 years
        description: 'Default document retention period in days',
      },
      {
        key: 'EMAIL_NOTIFICATIONS',
        value: 'true',
        description: 'Enable email notifications',
      },
    ];

    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

    console.log('✅ System settings configured');

    // ========================================
    // SAMPLE DOCUMENTS (from all sources)
    // ========================================
    const sampleDocuments = [
      {
        title: 'Company Policy Manual 2024',
        fileName: 'policy-manual-2024.pdf',
        originalName: 'policy-manual-2024.pdf',
        mimeType: 'application/pdf',
        fileSize: 2457600,
        storagePath: 'demo/policy-manual-2024.pdf',
        category: 'HR',
        tags: ['policy', 'manual', '2024'],
        status: 'PUBLISHED',
        createdById: adminUser.id,
        folderId: folderMap['HR']?.id || null,
      },
      {
        title: 'Q4 Financial Report',
        fileName: 'q4-financial-report.xlsx',
        originalName: 'q4-financial-report.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 1048576,
        storagePath: 'demo/q4-financial-report.xlsx',
        category: 'Financial',
        tags: ['quarterly', 'financial', 'report'],
        status: 'APPROVED',
        createdById: managerUser.id,
        folderId: folderMap['Financial']?.id || null,
      },
      {
        title: 'Marketing Campaign Strategy',
        fileName: 'marketing-strategy.docx',
        originalName: 'marketing-strategy.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 512000,
        storagePath: 'demo/marketing-strategy.docx',
        category: 'Marketing',
        tags: ['strategy', 'campaign', 'marketing'],
        status: 'DRAFT',
        createdById: regularUser.id,
        folderId: folderMap['Marketing']?.id || null,
      },
      {
        title: 'Air Force OPR Review Example',
        fileName: 'opr-review.pdf',
        originalName: 'opr-review.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        storagePath: 'demo/opr-review.pdf',
        category: 'OPR',
        tags: ['opr', 'workflow', 'airforce'],
        status: 'DRAFT',
        createdById: adminUser.id,
        folderId: null,
      },
      {
        title: 'Squadron Operations Plan',
        fileName: 'squadron-ops.docx',
        originalName: 'squadron-ops.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 512000,
        storagePath: 'demo/squadron-ops.docx',
        category: 'Operations',
        tags: ['operations', 'planning', 'squadron'],
        status: 'IN_REVIEW',
        createdById: adminUser.id,
        folderId: null,
      },
    ];

    for (const docData of sampleDocuments) {
      const uniqueChecksum = `${docData.fileName}-${Date.now()}-${Math.random()}`;

      const existingDoc = await prisma.document.findFirst({
        where: {
          title: docData.title,
          organizationId: richmondOrg.id
        }
      });

      if (existingDoc) {
        console.log(`  - Document "${docData.title}" already exists, skipping...`);
        continue;
      }

      const document = await prisma.document.create({
        data: {
          ...docData,
          checksum: uniqueChecksum,
          organizationId: richmondOrg.id,
          documentNumber: `DOC-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
          qrCode: '',
          currentVersion: 1,
        },
      });

      // Create initial version
      await prisma.documentVersion.create({
        data: {
          versionNumber: 1,
          title: docData.title,
          fileName: docData.fileName,
          fileSize: docData.fileSize,
          checksum: uniqueChecksum,
          storagePath: docData.storagePath,
          changeNotes: 'Initial version',
          documentId: document.id,
          createdById: docData.createdById,
        },
      });
    }

    console.log('✅ Sample documents created');

    // ========================================
    // AUDIT LOGS (from database/seed.js)
    // ========================================
    const auditLogs = [
      {
        action: 'LOGIN',
        resource: 'USER',
        resourceId: adminUser.id,
        userId: adminUser.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        action: 'CREATE',
        resource: 'DOCUMENT',
        resourceId: 'sample-doc-1',
        userId: managerUser.id,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        newValues: {
          title: 'New Document',
          category: 'Financial',
        },
      },
    ];

    for (const logData of auditLogs) {
      await prisma.auditLog.create({
        data: logData,
      });
    }

    console.log('✅ Sample audit logs created');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n===========================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('===========================================');
    console.log('\n📋 Login Credentials:');
    console.log('\nRichmond DMS Admins:');
    console.log('  admin@richmond-dms.com / admin123');
    console.log('  manager@richmond-dms.com / manager123');
    console.log('  user@richmond-dms.com / user123');
    console.log('\nAir Force Users (Password: testpass123):');
    console.log('  ao1@airforce.mil (Action Officer)');
    console.log('  ao2@airforce.mil (Action Officer)');
    console.log('  pcm@airforce.mil (Program Control Manager)');
    console.log('  coordinator1@airforce.mil (Coordinator)');
    console.log('  sq.cc@airforce.mil (Squadron Commander)');
    console.log('  gp.cc@airforce.mil (Group Commander)');
    console.log('  wg.cc@airforce.mil (Wing Commander)');
    console.log('  legal.reviewer@airforce.mil (Legal Compliance)');
    console.log('  opr.leadership@airforce.mil (OPR Commander)');
    console.log('  afdpo.publisher@airforce.mil (AFDPO Publisher)');
    console.log('  admin@airforce.mil (Workflow Administrator)');
    console.log('\nSub-Reviewers (Password: reviewer123):');
    console.log('  john.doe.ops@airforce.mil');
    console.log('  jane.smith.log@airforce.mil');
    console.log('  mike.johnson.fin@airforce.mil');
    console.log('  sarah.williams.per@airforce.mil');
    console.log('  ... and 4 more reviewers');
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