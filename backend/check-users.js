const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users and authentication...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        organizationId: true,
        isActive: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('Total users:', users.length);
    
    users.forEach(user => {
      console.log('- ' + user.email + ' (' + user.id + ') - Org: ' + user.organizationId + ' - Active: ' + user.isActive + ' - Role: ' + (user.role ? user.role.name : 'No role'));
    });
    
    // Check if there's a user with the org ID we're using
    const currentOrgId = 'cmed6dm7f0000ioaciudpllci';
    const usersInOrg = users.filter(user => user.organizationId === currentOrgId);
    
    console.log('\nUsers in organization ' + currentOrgId + ':', usersInOrg.length);
    
    if (usersInOrg.length === 0) {
      console.log('WARNING: NO USERS found in the target organization!');
      console.log('This explains why dashboard shows 0 documents - no authenticated user matches the org.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
