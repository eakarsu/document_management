const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test organization and user...');

    // Check if organization exists
    let organization = await prisma.organization.findFirst({
      where: { domain: 'test.com' }
    });

    if (!organization) {
      // Create test organization
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          domain: 'test.com',
          settings: {},
          isActive: true
        }
      });
      console.log('✅ Test organization created:', organization.id);
    } else {
      console.log('✅ Test organization already exists:', organization.id);
    }

    // Create role
    let role = await prisma.role.findFirst({
      where: { 
        name: 'Admin',
        organizationId: organization.id 
      }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Administrator role',
          permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN'],
          isSystem: true,
          organizationId: organization.id
        }
      });
      console.log('✅ Admin role created:', role.id);
    } else {
      console.log('✅ Admin role already exists:', role.id);
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    });

    if (!user) {
      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create test user
      user = await prisma.user.create({
        data: {
          email: 'admin@admin.com',
          firstName: 'Test',
          lastName: 'Admin',
          passwordHash: hashedPassword,
          isActive: true,
          emailVerified: true,
          organizationId: organization.id,
          roleId: role.id
        }
      });
      console.log('✅ Test user created:', user.id);
    } else {
      console.log('✅ Test user already exists:', user.id);
    }

    // Create a test document for publishing tests
    let testDoc = await prisma.document.findFirst({
      where: { 
        title: 'Test Document for Publishing',
        organizationId: organization.id 
      }
    });

    if (!testDoc) {
      testDoc = await prisma.document.create({
        data: {
          title: 'Test Document for Publishing',
          description: 'A test document for publishing endpoint tests',
          fileName: 'test-document.pdf',
          originalName: 'test-document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          checksum: 'test-checksum-' + Date.now(),
          storagePath: '/test/path/test-document.pdf',
          status: 'APPROVED',
          category: 'Test',
          tags: ['test', 'publishing'],
          customFields: {},
          createdById: user.id,
          organizationId: organization.id,
          currentVersion: 1
        }
      });
      console.log('✅ Test document created:', testDoc.id);
    } else {
      console.log('✅ Test document already exists:', testDoc.id);
    }

    console.log('\n🎉 Test data setup complete!');
    console.log('Login credentials:');
    console.log('Email: admin@admin.com');
    console.log('Password: password123');
    console.log('Organization:', organization.name);
    console.log('Document ID:', testDoc.id);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();