const { PrismaClient } = require('@prisma/client');
const { SearchService } = require('./src/services/SearchService.js');

const prisma = new PrismaClient();
const searchService = new SearchService();

async function reindexAll() {
  try {
    console.log('Final reindexing with correct organization ID...');
    
    const currentUserOrg = 'cme93490b0000bwkohgvjlyvt'; // User's actual org
    
    // Get all documents in the user's organization
    const documents = await prisma.document.findMany({
      where: {
        organizationId: currentUserOrg
      },
      select: {
        id: true,
        title: true,
        storagePath: true,
        mimeType: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    });
    
    console.log(`Found ${documents.length} documents to reindex in org ${currentUserOrg}`);
    
    // Reindex each document
    for (const doc of documents) {
      try {
        console.log(`Reindexing: ${doc.title}...`);
        await searchService.indexDocument(doc);
        console.log(`✅ Successfully indexed: ${doc.title}`);
      } catch (error) {
        console.error(`❌ Failed to index ${doc.title}:`, error.message);
      }
    }
    
    console.log('\nReindexing completed!');
    
  } catch (error) {
    console.error('Reindexing error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reindexAll();
