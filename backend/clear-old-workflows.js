const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearOldWorkflows() {
  try {
    console.log('Clearing old workflow instances...');
    
    // Delete all workflow history first
    await prisma.jsonWorkflowHistory.deleteMany({});
    console.log('✓ Cleared workflow history');
    
    // Delete all workflow instances
    await prisma.jsonWorkflowInstance.deleteMany({});
    console.log('✓ Cleared workflow instances');
    
    console.log('\n✅ Successfully cleared all old workflow data');
    console.log('You can now start fresh with the new OPR workflow');
  } catch (error) {
    console.error('Error clearing workflows:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOldWorkflows();