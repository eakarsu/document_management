const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMissingUsers() {
  // First, get or create an organization
  let organization = await prisma.organization.findFirst();

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Air Force',
        type: 'MILITARY'
      }
    });
    console.log('Created organization: Air Force\n');
  } else {
    console.log(`Using existing organization: ${organization.name}\n`);
  }

  const users = [
    { email: 'admin@airforce.mil', firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
    { email: 'ao1@airforce.mil', firstName: 'Action', lastName: 'Officer1', role: 'EDITOR' },
    { email: 'ao2@airforce.mil', firstName: 'Action', lastName: 'Officer2', role: 'EDITOR' },
    { email: 'pcm@airforce.mil', firstName: 'PCM', lastName: 'User', role: 'REVIEWER' },
    { email: 'coordinator@airforce.mil', firstName: 'Coordinator', lastName: 'User', role: 'EDITOR' },
    { email: 'reviewer1@airforce.mil', firstName: 'Reviewer', lastName: 'One', role: 'REVIEWER' },
    { email: 'reviewer2@airforce.mil', firstName: 'Reviewer', lastName: 'Two', role: 'REVIEWER' },
    { email: 'opr@airforce.mil', firstName: 'OPR', lastName: 'User', role: 'EDITOR' },
    { email: 'legal@airforce.mil', firstName: 'Legal', lastName: 'User', role: 'REVIEWER' },
    { email: 'leadership@airforce.mil', firstName: 'Leadership', lastName: 'User', role: 'ADMIN' },
  ];

  const hashedPassword = await bcrypt.hash('testpass123', 10);

  console.log('Creating missing users for workflow test...\n');

  for (const user of users) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            passwordHash: hashedPassword,
            role: user.role,
            isVerified: true,
            organization: {
              connect: { id: organization.id }
            }
          }
        });
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } else {
        console.log(`✓ Exists: ${user.email} (${existing.role})`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.email}: ${error.message}`);
    }
  }

  console.log('\nAll users checked/created!');
}

createMissingUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());