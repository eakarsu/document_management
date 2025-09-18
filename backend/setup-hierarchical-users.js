const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupHierarchicalUsers() {
  console.log('🚀 Setting up Hierarchical Distributed Workflow test users...');

  const password = await bcrypt.hash('testpass123', 10);

  // Define all test users with their roles
  const testUsers = [
    // Stage 1: Action Officers
    {
      email: 'ao1@airforce.mil',
      name: 'Primary Action Officer',
      password,
      roles: ['ACTION_OFFICER']
    },
    {
      email: 'ao2@airforce.mil',
      name: 'Secondary Action Officer',
      password,
      roles: ['ACTION_OFFICER']
    },

    // Stage 2: PCM Gatekeeper
    {
      email: 'pcm@airforce.mil',
      name: 'Program Control Manager',
      password,
      roles: ['PCM_GATEKEEPER']
    },

    // Stage 3 & 5: Coordinator
    {
      email: 'coordinator1@airforce.mil',
      name: 'Primary Coordinator',
      password,
      roles: ['COORDINATOR']
    },

    // Stage 3 & 5: Front Office Gatekeepers
    {
      email: 'ops.frontoffice@airforce.mil',
      name: 'Operations Front Office',
      password,
      roles: ['FRONT_OFFICE_GATEKEEPER', 'OPERATIONS_FRONT_OFFICE']
    },
    {
      email: 'log.frontoffice@airforce.mil',
      name: 'Logistics Front Office',
      password,
      roles: ['FRONT_OFFICE_GATEKEEPER', 'LOGISTICS_FRONT_OFFICE']
    },
    {
      email: 'fin.frontoffice@airforce.mil',
      name: 'Finance Front Office',
      password,
      roles: ['FRONT_OFFICE_GATEKEEPER', 'FINANCE_FRONT_OFFICE']
    },
    {
      email: 'per.frontoffice@airforce.mil',
      name: 'Personnel Front Office',
      password,
      roles: ['FRONT_OFFICE_GATEKEEPER', 'PERSONNEL_FRONT_OFFICE']
    },

    // Stage 3 & 5: Sub-Reviewers
    {
      email: 'ops.reviewer1@airforce.mil',
      name: 'Operations Sub-Reviewer 1',
      password,
      roles: ['SUB_REVIEWER', 'OPERATIONS_REVIEWER']
    },
    {
      email: 'ops.reviewer2@airforce.mil',
      name: 'Operations Sub-Reviewer 2',
      password,
      roles: ['SUB_REVIEWER', 'OPERATIONS_REVIEWER']
    },
    {
      email: 'log.reviewer1@airforce.mil',
      name: 'Logistics Sub-Reviewer',
      password,
      roles: ['SUB_REVIEWER', 'LOGISTICS_REVIEWER']
    },
    {
      email: 'fin.reviewer1@airforce.mil',
      name: 'Finance Sub-Reviewer',
      password,
      roles: ['SUB_REVIEWER', 'FINANCE_REVIEWER']
    },
    {
      email: 'per.reviewer1@airforce.mil',
      name: 'Personnel Sub-Reviewer',
      password,
      roles: ['SUB_REVIEWER', 'PERSONNEL_REVIEWER']
    },

    // Stage 7: Legal
    {
      email: 'legal.reviewer@airforce.mil',
      name: 'Legal Compliance Officer',
      password,
      roles: ['LEGAL_REVIEWER']
    },

    // Stage 9: Leadership
    {
      email: 'opr.leadership@airforce.mil',
      name: 'OPR Commander',
      password,
      roles: ['OPR_LEADERSHIP', 'LEADERSHIP']
    },

    // Stage 10: AFDPO
    {
      email: 'afdpo.publisher@airforce.mil',
      name: 'AFDPO Publisher',
      password,
      roles: ['AFDPO_PUBLISHER']
    },

    // Admin
    {
      email: 'admin@airforce.mil',
      name: 'Workflow Administrator',
      password,
      roles: ['ADMIN', 'WORKFLOW_ADMIN']
    }
  ];

  // Create or update each user
  for (const userData of testUsers) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            password: userData.password,
            roles: userData.roles,
            permissions: getPermissionsForRoles(userData.roles)
          }
        });
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: userData.password,
            roles: userData.roles,
            permissions: getPermissionsForRoles(userData.roles)
          }
        });
        console.log(`✅ Created user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error processing user ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 Hierarchical workflow test users setup complete!');
  console.log('All users use password: testpass123');
}

function getPermissionsForRoles(roles) {
  const permissions = new Set(['document:view']);

  roles.forEach(role => {
    switch (role) {
      case 'ACTION_OFFICER':
        permissions.add('document:create');
        permissions.add('document:edit');
        permissions.add('document:submit');
        permissions.add('document:transfer');
        permissions.add('workflow:advance');
        break;

      case 'PCM_GATEKEEPER':
        permissions.add('document:review');
        permissions.add('document:approve');
        permissions.add('document:reject');
        permissions.add('workflow:advance');
        break;

      case 'COORDINATOR':
        permissions.add('document:distribute');
        permissions.add('document:review');
        permissions.add('workflow:distribute');
        permissions.add('workflow:advance');
        break;

      case 'FRONT_OFFICE_GATEKEEPER':
        permissions.add('document:review');
        permissions.add('document:approve');
        permissions.add('document:reject');
        permissions.add('document:route');
        permissions.add('workflow:advance');
        break;

      case 'SUB_REVIEWER':
        permissions.add('document:review');
        permissions.add('document:comment');
        permissions.add('document:feedback');
        permissions.add('workflow:advance');
        break;

      case 'LEGAL_REVIEWER':
        permissions.add('document:review');
        permissions.add('document:approve');
        permissions.add('document:reject');
        permissions.add('document:legal');
        permissions.add('workflow:advance');
        break;

      case 'OPR_LEADERSHIP':
      case 'LEADERSHIP':
        permissions.add('document:review');
        permissions.add('document:sign');
        permissions.add('document:approve');
        permissions.add('document:reject');
        permissions.add('workflow:advance');
        break;

      case 'AFDPO_PUBLISHER':
        permissions.add('document:review');
        permissions.add('document:publish');
        permissions.add('document:archive');
        permissions.add('workflow:complete');
        break;

      case 'ADMIN':
      case 'WORKFLOW_ADMIN':
        permissions.add('document:create');
        permissions.add('document:edit');
        permissions.add('document:delete');
        permissions.add('document:review');
        permissions.add('document:approve');
        permissions.add('document:reject');
        permissions.add('document:override');
        permissions.add('workflow:manage');
        permissions.add('workflow:reset');
        permissions.add('workflow:override');
        permissions.add('workflow:advance');
        permissions.add('user:manage');
        break;
    }
  });

  return Array.from(permissions);
}

setupHierarchicalUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });