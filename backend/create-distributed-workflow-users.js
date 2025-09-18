const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDistributedWorkflowUsers() {
  try {
    console.log('🚀 Creating test users for Distributed Workflow...\n');

    // Get or create organizations
    const airForce = await prisma.organization.upsert({
      where: { domain: 'airforce.mil' },
      update: {},
      create: {
        name: 'Air Force',
        domain: 'airforce.mil'
      }
    });

    const operations = await prisma.organization.upsert({
      where: { domain: 'ops.airforce.mil' },
      update: {},
      create: {
        name: 'Operations',
        domain: 'ops.airforce.mil'
      }
    });

    const logistics = await prisma.organization.upsert({
      where: { domain: 'log.airforce.mil' },
      update: {},
      create: {
        name: 'Logistics',
        domain: 'log.airforce.mil'
      }
    });

    const finance = await prisma.organization.upsert({
      where: { domain: 'fin.airforce.mil' },
      update: {},
      create: {
        name: 'Finance',
        domain: 'fin.airforce.mil'
      }
    });

    const personnel = await prisma.organization.upsert({
      where: { domain: 'per.airforce.mil' },
      update: {},
      create: {
        name: 'Personnel',
        domain: 'per.airforce.mil'
      }
    });

    // Get or create roles
    const coordinatorRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Coordinator',
          organizationId: airForce.id
        }
      },
      update: {},
      create: {
        name: 'Coordinator',
        organizationId: airForce.id,
        permissions: ['documents:read', 'documents:write', 'workflow:coordinate', 'workflow:distribute']
      }
    });

    const subReviewerRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'SUB_REVIEWER',
          organizationId: airForce.id
        }
      },
      update: {},
      create: {
        name: 'SUB_REVIEWER',
        organizationId: airForce.id,
        permissions: ['documents:read', 'workflow:review', 'workflow:comment']
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Test users to create
    const testUsers = [
      // Coordinators
      {
        email: 'coordinator1@airforce.mil',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: coordinatorRole,
        organization: airForce,
        description: 'Stage 2 Coordinator - First Distribution Phase'
      },
      {
        email: 'coordinator2@airforce.mil',
        firstName: 'Michael',
        lastName: 'Davis',
        role: coordinatorRole,
        organization: airForce,
        description: 'Stage 4 Coordinator - Second Distribution Phase'
      },
      // Sub-Reviewers
      {
        email: 'ops.reviewer@airforce.mil',
        firstName: 'James',
        lastName: 'Wilson',
        role: subReviewerRole,
        organization: operations,
        description: 'Operations Sub-Reviewer'
      },
      {
        email: 'log.reviewer@airforce.mil',
        firstName: 'Emily',
        lastName: 'Brown',
        role: subReviewerRole,
        organization: logistics,
        description: 'Logistics Sub-Reviewer'
      },
      {
        email: 'fin.reviewer@airforce.mil',
        firstName: 'Robert',
        lastName: 'Taylor',
        role: subReviewerRole,
        organization: finance,
        description: 'Finance Sub-Reviewer'
      },
      {
        email: 'per.reviewer@airforce.mil',
        firstName: 'Lisa',
        lastName: 'Anderson',
        role: subReviewerRole,
        organization: personnel,
        description: 'Personnel Sub-Reviewer'
      }
    ];

    // Create or update users
    for (const userData of testUsers) {
      try {
        const user = await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordHash: hashedPassword,
            roleId: userData.role.id,
            organizationId: userData.organization.id,
            isActive: true
          },
          create: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordHash: hashedPassword,
            roleId: userData.role.id,
            organizationId: userData.organization.id,
            isActive: true
          }
        });

        console.log(`✅ Created/Updated: ${userData.email}`);
        console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
        console.log(`   Role: ${userData.role.name}`);
        console.log(`   Organization: ${userData.organization.name}`);
        console.log(`   Purpose: ${userData.description}`);
        console.log(`   Password: password123`);
        console.log('');
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    // Also ensure other workflow users exist
    const oprRole = await prisma.role.findFirst({
      where: { name: 'OPR', organizationId: airForce.id }
    });

    const legalRole = await prisma.role.findFirst({
      where: { name: 'Legal', organizationId: airForce.id }
    });

    const afdpoRole = await prisma.role.findFirst({
      where: { name: 'AFDPO', organizationId: airForce.id }
    });

    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin', organizationId: airForce.id }
    });

    // Verify/create standard workflow users
    const standardUsers = [
      { email: 'opr@demo.mil', role: oprRole, firstName: 'John', lastName: 'OPR' },
      { email: 'legal@demo.mil', role: legalRole, firstName: 'Jane', lastName: 'Legal' },
      { email: 'afdpo.analyst@demo.mil', role: afdpoRole, firstName: 'Bob', lastName: 'AFDPO' },
      { email: 'admin@demo.mil', role: adminRole, firstName: 'Admin', lastName: 'User' }
    ];

    for (const userData of standardUsers) {
      if (userData.role) {
        try {
          await prisma.user.upsert({
            where: { email: userData.email },
            update: {
              passwordHash: hashedPassword,
              isActive: true
            },
            create: {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              passwordHash: hashedPassword,
              roleId: userData.role.id,
              organizationId: airForce.id,
              isActive: true
            }
          });
          console.log(`✅ Verified: ${userData.email}`);
        } catch (error) {
          console.error(`⚠️ Could not verify ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n📊 User Creation Summary:');
    console.log('================================');

    const userCount = await prisma.user.count();
    const coordinatorCount = await prisma.user.count({
      where: { role: { name: 'Coordinator' } }
    });
    const subReviewerCount = await prisma.user.count({
      where: { role: { name: 'SUB_REVIEWER' } }
    });

    console.log(`Total Users: ${userCount}`);
    console.log(`Coordinators: ${coordinatorCount}`);
    console.log(`Sub-Reviewers: ${subReviewerCount}`);

    console.log('\n✅ All distributed workflow test users are ready!');
    console.log('================================');
    console.log('You can now login with any of these accounts using password: password123');
    console.log('\nCoordinators:');
    console.log('  - coordinator1@airforce.mil (Stage 2 Distribution)');
    console.log('  - coordinator2@airforce.mil (Stage 4 Distribution)');
    console.log('\nSub-Reviewers:');
    console.log('  - ops.reviewer@airforce.mil (Operations)');
    console.log('  - log.reviewer@airforce.mil (Logistics)');
    console.log('  - fin.reviewer@airforce.mil (Finance)');
    console.log('  - per.reviewer@airforce.mil (Personnel)');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDistributedWorkflowUsers();