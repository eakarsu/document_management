const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGeneratedDocuments() {
  try {
    // Get the two most recent AI-generated documents
    const documents = await prisma.document.findMany({
      where: {
        customFields: {
          path: ['aiGenerated'],
          equals: true
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 2,
      select: {
        id: true,
        title: true,
        customFields: true,
        createdAt: true
      }
    });

    console.log(`Found ${documents.length} AI-generated documents:\n`);
    
    for (const doc of documents) {
      console.log(`ID: ${doc.id}`);
      console.log(`Title: ${doc.title}`);
      console.log(`Created: ${doc.createdAt}`);
      console.log(`Template: ${doc.customFields?.template || 'N/A'}`);
      console.log(`Has Custom Header: ${doc.customFields?.hasCustomHeader || false}`);
      console.log(`Header HTML exists: ${!!doc.customFields?.headerHtml}`);
      
      // Check if header is present in the content
      const htmlContent = doc.customFields?.htmlContent || '';
      const hasAirForceHeader = htmlContent.includes('air-force-document-header');
      console.log(`Air Force header in content: ${hasAirForceHeader}`);
      
      if (doc.customFields?.headerHtml) {
        console.log(`Header HTML length: ${doc.customFields.headerHtml.length} chars`);
        console.log(`Header contains seal: ${doc.customFields.headerHtml.includes('data:image')}`);
      }
      
      console.log('\n---\n');
    }
  } catch (error) {
    console.error('Error checking documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGeneratedDocuments();