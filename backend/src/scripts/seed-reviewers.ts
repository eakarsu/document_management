import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Reviewer accounts that match the DistributionDialog
const reviewerAccounts = [
  {
    email: 'john.doe.ops@airforce.mil',
    firstName: 'John',
    lastName: 'Doe',
    role: 'SUB_REVIEWER',
    department: 'Operations',
    password: 'reviewer123',
  },
  {
    email: 'jane.smith.log@airforce.mil',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'SUB_REVIEWER',
    department: 'Logistics',
    password: 'reviewer123',
  },
  {
    email: 'mike.johnson.fin@airforce.mil',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'SUB_REVIEWER',
    department: 'Finance',
    password: 'reviewer123',
  },
  {
    email: 'sarah.williams.per@airforce.mil',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'SUB_REVIEWER',
    department: 'Personnel',
    password: 'reviewer123',
  },
  {
    email: 'david.brown.ops@airforce.mil',
    firstName: 'David',
    lastName: 'Brown',
    role: 'SUB_REVIEWER',
    department: 'Operations',
    password: 'reviewer123',
  },
  {
    email: 'lisa.davis.log@airforce.mil',
    firstName: 'Lisa',
    lastName: 'Davis',
    role: 'SUB_REVIEWER',
    department: 'Logistics',
    password: 'reviewer123',
  },
  {
    email: 'robert.miller.fin@airforce.mil',
    firstName: 'Robert',
    lastName: 'Miller',
    role: 'SUB_REVIEWER',
    department: 'Finance',
    password: 'reviewer123',
  },
  {
    email: 'emily.wilson.per@airforce.mil',
    firstName: 'Emily',
    lastName: 'Wilson',
    role: 'SUB_REVIEWER',
    department: 'Personnel',
    password: 'reviewer123',
  },
];

async function seedReviewers() {
  try {
    console.log('Starting reviewer seed...');

    // Get or create organization
    let organization = await prisma.organization.findFirst({
      where: { domain: 'airforce.mil' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Air Force',
          domain: 'airforce.mil',
          settings: {},
          isActive: true
        }
      });
      console.log('Created organization:', organization.name);
    }

    // Get or create reviewer role
    let reviewerRole = await prisma.role.findFirst({
      where: {
        name: 'SUB_REVIEWER',
        organizationId: organization.id
      }
    });

    if (!reviewerRole) {
      reviewerRole = await prisma.role.create({
        data: {
          name: 'SUB_REVIEWER',
          description: 'Subject Matter Expert Reviewer',
          permissions: ['view_documents', 'add_comments', 'submit_reviews'],
          organizationId: organization.id,
          roleType: 'SUBJECT_MATTER_EXPERT'
        }
      });
      console.log('Created role:', reviewerRole.name);
    }

    // Create reviewer accounts
    for (const reviewer of reviewerAccounts) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: reviewer.email }
      });

      if (existingUser) {
        console.log(`User ${reviewer.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(reviewer.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: reviewer.email,
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          passwordHash,
          department: reviewer.department,
          jobTitle: 'Reviewer',
          isActive: true,
          emailVerified: true,
          roleId: reviewerRole.id,
          organizationId: organization.id,
          username: reviewer.email.split('@')[0]
        }
      });

      console.log(`Created reviewer: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    console.log('\n✅ Reviewer seed completed successfully!');
    console.log('\nReviewers can now log in with:');
    console.log('Email: [any reviewer email from the list]');
    console.log('Password: reviewer123');

  } catch (error) {
    console.error('Error seeding reviewers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedReviewers()
  .catch((error) => {
    console.error('Failed to seed reviewers:', error);
    process.exit(1);
  });