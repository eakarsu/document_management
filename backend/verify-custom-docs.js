const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCustomDocuments() {
  try {
    // Get the two custom documents we just created
    const customDocs = await prisma.document.findMany({
      where: {
        id: {
          in: ['cmfh7luem0001wlof3sj2ssa4', 'cmfh7lznr0003wlofpygk0e9a']
        }
      },
      select: {
        id: true,
        title: true,
        customFields: true
      }
    });

    for (const doc of customDocs) {
      console.log(`\n=== Document: ${doc.title} ===`);
      console.log(`ID: ${doc.id}`);
      
      // Check if header contains custom data
      const headerHtml = doc.customFields?.headerHtml || '';
      const htmlContent = doc.customFields?.htmlContent || '';
      
      // Check for custom values in the header
      if (doc.id === 'cmfh7luem0001wlof3sj2ssa4') {
        console.log('\nCustom Policy Document checks:');
        console.log('✓ Contains "CHIEF OF STAFF":', headerHtml.includes('CHIEF OF STAFF'));
        console.log('✓ Contains "CUSTOM POLICY DOCUMENT 2025":', headerHtml.includes('CUSTOM POLICY DOCUMENT 2025'));
        console.log('✓ Contains "DATA GOVERNANCE AND SECURITY":', headerHtml.includes('DATA GOVERNANCE AND SECURITY'));
        console.log('✓ Contains "IT/SEC":', headerHtml.includes('IT/SEC'));
        console.log('✓ Contains "John Doe, IT Director":', headerHtml.includes('John Doe, IT Director'));
        console.log('✓ Contains "Internal use only":', headerHtml.includes('Internal use only'));
      }
      
      if (doc.id === 'cmfh7lznr0003wlofpygk0e9a') {
        console.log('\nCustom Technical Document checks:');
        console.log('✓ Contains "TECHNOLOGY OFFICER":', headerHtml.includes('TECHNOLOGY OFFICER'));
        console.log('✓ Contains "TECH SPEC 001":', headerHtml.includes('TECH SPEC 001'));
        console.log('✓ Contains "SYSTEM REQUIREMENTS":', headerHtml.includes('SYSTEM REQUIREMENTS'));
        console.log('✓ Contains custom red seal (CC0000):', htmlContent.includes('CC0000') || htmlContent.includes('CUSTOM'));
      }
    }
    
  } catch (error) {
    console.error('Error verifying documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCustomDocuments();