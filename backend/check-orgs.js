const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrgs() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@richmond-dms.com' },
    include: { organization: true }
  });
  
  console.log('Admin user org:', adminUser?.organizationId);
  
  const doc = await prisma.document.findUnique({
    where: { id: 'cmffo4zta0001125e4twigu39' }
  });
  
  console.log('Document org:', doc?.organizationId);
  console.log('Match?', adminUser?.organizationId === doc?.organizationId);
  
  // Update document to match admin's organization
  if (adminUser && doc && adminUser.organizationId !== doc.organizationId) {
    await prisma.document.update({
      where: { id: 'cmffo4zta0001125e4twigu39' },
      data: { organizationId: adminUser.organizationId }
    });
    console.log('✅ Fixed document organization');
  }
  
  await prisma.$disconnect();
}

checkOrgs();