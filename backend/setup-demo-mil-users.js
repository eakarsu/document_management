const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDemoMilUsers() {
  try {
    console.log('🚀 Setting up demo.mil workflow test users...');

    // Get existing organization
    let org = await prisma.organization.findFirst({
      where: { domain: 'richmond-dms.com' }
    });

    if (!org) {
      console.error('❌ Richmond DMS organization not found. Run setup-8stage-workflow-users.js first.');
      return;
    }

    console.log(`✅ Using organization: ${org.name}`);

    // Get existing roles
    const roles = await prisma.role.findMany({
      where: { organizationId: org.id }
    });

    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role;
    });

    // Create demo.mil users matching the login page
    const demoUsers = [
      {
        email: 'opr@demo.mil',
        password: 'password123',
        firstName: 'OPR',
        lastName: 'User',
        role: 'OPR',
        description: 'Office of Primary Responsibility'
      },
      {
        email: 'icu@demo.mil', 
        password: 'password123',
        firstName: 'ICU',
        lastName: 'Reviewer',
        role: 'TECHNICAL_REVIEWER',
        description: 'Internal Coordination Unit'
      },
      {
        email: 'technical@demo.mil',
        password: 'password123',
        firstName: 'Technical',
        lastName: 'Reviewer',
        role: 'TECHNICAL_REVIEWER',
        description: 'Technical Reviewer'
      },
      {
        email: 'legal@demo.mil',
        password: 'password123',
        firstName: 'Legal',
        lastName: 'Reviewer',
        role: 'LEGAL_REVIEWER',
        description: 'Legal Reviewer'
      },
      {
        email: 'publisher@demo.mil',
        password: 'password123',
        firstName: 'Publisher',
        lastName: 'User',
        role: 'PUBLISHER',
        description: 'Publisher (AFDPO)'
      },
      {
        email: 'admin@demo.mil',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        description: 'Workflow Administrator'
      }
    ];

    console.log(`\n📝 Creating ${demoUsers.length} demo.mil users...`);

    for (const userData of demoUsers) {
      let user = await prisma.user.findFirst({
        where: { email: userData.email }
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const role = roleMap[userData.role];

        if (!role) {
          console.error(`❌ Role not found: ${userData.role}`);
          continue;
        }

        user = await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordHash: hashedPassword,
            isActive: true,
            emailVerified: true,
            organizationId: org.id,
            roleId: role.id
          }
        });
        console.log(`✅ Created user: ${user.email} (${userData.role}) - ${userData.description}`);
      } else {
        console.log(`✅ User exists: ${user.email} (${userData.role}) - ${userData.description}`);
      }
    }

    console.log('\n🎉 Demo.mil User Setup Complete!');
    console.log('\n📋 DEMO.MIL LOGIN CREDENTIALS:\n');
    
    console.log('📝 OPR: opr@demo.mil / password123');
    console.log('🔄 ICU: icu@demo.mil / password123');
    console.log('⚙️ Technical: technical@demo.mil / password123');
    console.log('⚖️ Legal: legal@demo.mil / password123');
    console.log('📰 Publisher: publisher@demo.mil / password123');
    console.log('👑 Admin: admin@demo.mil / password123');

    console.log('\n✨ All demo.mil accounts are ready for workflow testing!');

  } catch (error) {
    console.error('❌ Error setting up demo.mil users:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setupDemoMilUsers();