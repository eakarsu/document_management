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
    // USERS - Hash passwords
    // ========================================
    const testPassword = await bcrypt.hash('testpass123', 10);
    const reviewerPassword = await bcrypt.hash('reviewer123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Richmond DMS Admin Users
    const admin = await prisma.user.upsert({
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

    await prisma.user.upsert({
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

    await prisma.user.upsert({
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

    console.log('\n===========================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('===========================================');
    console.log('\n📋 Login Credentials:');
    console.log('\nRichmond DMS Admins:');
    console.log('  admin@richmond-dms.com / admin123');
    console.log('  manager@richmond-dms.com / manager123');
    console.log('  user@richmond-dms.com / user123');
    console.log('\nAir Force Users (Password: testpass123):');
    console.log('  ao1@airforce.mil');
    console.log('  pcm@airforce.mil');
    console.log('  coordinator1@airforce.mil');
    console.log('  sq.cc@airforce.mil');
    console.log('  wg.cc@airforce.mil');
    console.log('  legal.reviewer@airforce.mil');
    console.log('  admin@airforce.mil');
    console.log('\nSub-Reviewers (Password: reviewer123):');
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