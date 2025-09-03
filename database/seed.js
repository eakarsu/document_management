const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default organization
    const organization = await prisma.organization.upsert({
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

    console.log('✅ Organization created:', organization.name);

    // Create default roles
    const adminRole = await prisma.role.upsert({
      where: { 
        name_organizationId: { 
          name: 'Admin', 
          organizationId: organization.id 
        } 
      },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system administrator with all permissions',
        permissions: ['*'], // Wildcard for all permissions
        isSystem: true,
        organizationId: organization.id,
      },
    });

    const managerRole = await prisma.role.upsert({
      where: { 
        name_organizationId: { 
          name: 'Manager', 
          organizationId: organization.id 
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
        organizationId: organization.id,
      },
    });

    const userRole = await prisma.role.upsert({
      where: { 
        name_organizationId: { 
          name: 'User', 
          organizationId: organization.id 
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
        organizationId: organization.id,
      },
    });

    const guestRole = await prisma.role.upsert({
      where: { 
        name_organizationId: { 
          name: 'Guest', 
          organizationId: organization.id 
        } 
      },
      update: {},
      create: {
        name: 'Guest',
        description: 'Guest user with read-only access',
        permissions: ['DOCUMENT_READ'],
        isSystem: true,
        organizationId: organization.id,
      },
    });

    console.log('✅ Roles created: Admin, Manager, User, Guest');

    // Create default users
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@richmond-dms.com' },
      update: {},
      create: {
        email: 'admin@richmond-dms.com',
        passwordHash: adminPasswordHash,
        firstName: 'System',
        lastName: 'Administrator',
        emailVerified: true,
        isActive: true,
        department: 'IT',
        jobTitle: 'System Administrator',
        roleId: adminRole.id,
        organizationId: organization.id,
      },
    });

    const managerPasswordHash = await bcrypt.hash('manager123', 12);
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@richmond-dms.com' },
      update: {},
      create: {
        email: 'manager@richmond-dms.com',
        passwordHash: managerPasswordHash,
        firstName: 'John',
        lastName: 'Manager',
        emailVerified: true,
        isActive: true,
        department: 'Operations',
        jobTitle: 'Operations Manager',
        roleId: managerRole.id,
        organizationId: organization.id,
      },
    });

    const userPasswordHash = await bcrypt.hash('user123', 12);
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@richmond-dms.com' },
      update: {},
      create: {
        email: 'user@richmond-dms.com',
        passwordHash: userPasswordHash,
        firstName: 'Jane',
        lastName: 'User',
        emailVerified: true,
        isActive: true,
        department: 'Business',
        jobTitle: 'Business Analyst',
        roleId: userRole.id,
        organizationId: organization.id,
      },
    });

    console.log('✅ Users created:');
    console.log('  - admin@richmond-dms.com (password: admin123)');
    console.log('  - manager@richmond-dms.com (password: manager123)');
    console.log('  - user@richmond-dms.com (password: user123)');

    // Create default folder structure
    const rootFolder = await prisma.folder.create({
      data: {
        name: 'Documents',
        description: 'Root document folder',
        fullPath: '/Documents',
        depth: 0,
        organizationId: organization.id,
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

    for (const folderData of folders) {
      await prisma.folder.create({
        data: {
          name: folderData.name,
          description: folderData.description,
          parentFolderId: folderData.parentId,
          fullPath: folderData.path,
          depth: 1,
          organizationId: organization.id,
        },
      });
    }

    console.log('✅ Folder structure created');

    // Create sample workflows
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
        organizationId: organization.id,
      },
    });

    console.log('✅ Sample workflows created');

    // Create system settings
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

    // Create sample documents (metadata only - no actual files)
    const sampleDocuments = [
      {
        title: 'Company Policy Manual 2024',
        fileName: 'policy-manual-2024.pdf',
        originalName: 'policy-manual-2024.pdf',
        mimeType: 'application/pdf',
        fileSize: 2457600,
        checksum: '1234567890abcdef1234567890abcdef12345678',
        storagePath: 'demo/policy-manual-2024.pdf',
        category: 'HR',
        tags: ['policy', 'manual', '2024'],
        status: 'PUBLISHED',
        createdById: adminUser.id,
        folderId: null, // Will be set to HR folder
      },
      {
        title: 'Q4 Financial Report',
        fileName: 'q4-financial-report.xlsx',
        originalName: 'q4-financial-report.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 1048576,
        checksum: '2234567890abcdef1234567890abcdef12345678',
        storagePath: 'demo/q4-financial-report.xlsx',
        category: 'Financial',
        tags: ['quarterly', 'financial', 'report'],
        status: 'APPROVED',
        createdById: managerUser.id,
        folderId: null, // Will be set to Financial folder
      },
      {
        title: 'Marketing Campaign Strategy',
        fileName: 'marketing-strategy.docx',
        originalName: 'marketing-strategy.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 512000,
        checksum: '3234567890abcdef1234567890abcdef12345678',
        storagePath: 'demo/marketing-strategy.docx',
        category: 'Marketing',
        tags: ['strategy', 'campaign', 'marketing'],
        status: 'DRAFT',
        createdById: regularUser.id,
        folderId: null, // Will be set to Marketing folder
      },
    ];

    // Get folder IDs for assignment
    const hrFolder = await prisma.folder.findFirst({
      where: { name: 'HR', organizationId: organization.id },
    });
    const financialFolder = await prisma.folder.findFirst({
      where: { name: 'Financial', organizationId: organization.id },
    });
    const marketingFolder = await prisma.folder.findFirst({
      where: { name: 'Marketing', organizationId: organization.id },
    });

    // Update folder IDs
    sampleDocuments[0].folderId = hrFolder?.id || null;
    sampleDocuments[1].folderId = financialFolder?.id || null;
    sampleDocuments[2].folderId = marketingFolder?.id || null;

    for (const docData of sampleDocuments) {
      // Generate unique checksum for each run to avoid conflicts
      const uniqueChecksum = `${docData.checksum}-${Date.now()}-${Math.random()}`;
      
      // Check if document already exists with this title
      const existingDoc = await prisma.document.findFirst({
        where: {
          title: docData.title,
          organizationId: organization.id
        }
      });

      if (existingDoc) {
        console.log(`  - Document "${docData.title}" already exists, skipping...`);
        continue;
      }

      const document = await prisma.document.create({
        data: {
          ...docData,
          checksum: uniqueChecksum, // Use unique checksum
          organizationId: organization.id,
          documentNumber: `DOC-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
          qrCode: '', // Would be generated in real implementation
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
          checksum: uniqueChecksum, // Use the same unique checksum
          storagePath: docData.storagePath,
          changeNotes: 'Initial version',
          documentId: document.id,
          createdById: docData.createdById,
        },
      });
    }

    console.log('✅ Sample documents created');

    // Create some sample audit logs
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

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('You can now login with:');
    console.log('  Admin: admin@richmond-dms.com / admin123');
    console.log('  Manager: manager@richmond-dms.com / manager123');
    console.log('  User: user@richmond-dms.com / user123');

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