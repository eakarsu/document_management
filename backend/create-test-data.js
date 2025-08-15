const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test organization and roles...');

    // Create default organization
    const organization = await prisma.organization.upsert({
      where: { domain: 'test.local' },
      update: {},
      create: {
        id: 'test-org-id',
        name: 'Test Organization',
        domain: 'test.local',
        settings: {}
      }
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
        description: 'Administrator with full permissions',
        permissions: ['*'], // All permissions
        isSystem: true,
        organizationId: organization.id
      }
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
        permissions: ['documents:read', 'documents:write', 'documents:share'],
        isSystem: true,
        organizationId: organization.id
      }
    });

    const editorRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Editor',
          organizationId: organization.id
        }
      },
      update: {},
      create: {
        name: 'Editor',
        description: 'Document editor with approval permissions',
        permissions: ['documents:read', 'documents:write', 'documents:approve', 'documents:publish'],
        isSystem: true,
        organizationId: organization.id
      }
    });

    console.log('✅ Roles created:');
    console.log('  - Admin:', adminRole.id);
    console.log('  - User:', userRole.id);
    console.log('  - Editor:', editorRole.id);

    console.log('\n📋 Test data summary:');
    console.log('Organization ID:', organization.id);
    console.log('Admin Role ID:', adminRole.id);
    console.log('User Role ID:', userRole.id);
    console.log('Editor Role ID:', editorRole.id);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();