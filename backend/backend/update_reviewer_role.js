const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateReviewerRole() {
  try {
    // First, find or create REVIEWER role
    let reviewerRole = await prisma.role.findFirst({
      where: { name: 'REVIEWER' }
    });

    if (!reviewerRole) {
      reviewerRole = await prisma.role.create({
        data: {
          name: 'REVIEWER',
          permissions: ['READ', 'REVIEW', 'COMMENT', 'FEEDBACK']
        }
      });
      console.log('Created REVIEWER role:', reviewerRole);
    } else {
      console.log('Found existing REVIEWER role:', reviewerRole);
    }

    // Update the recently created user to have REVIEWER role
    const updatedUser = await prisma.user.update({
      where: {
        email: 'reviewer1@airforce.mil'
      },
      data: {
        roleId: reviewerRole.id
      },
      include: {
        role: true
      }
    });

    console.log('Updated user role to REVIEWER:', {
      email: updatedUser.email,
      roleName: updatedUser.role.name,
      roleId: updatedUser.roleId
    });

  } catch (error) {
    console.error('Error updating role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateReviewerRole();