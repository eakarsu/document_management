const { Client } = require('@elastic/elasticsearch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const client = new Client({ node: 'http://localhost:9200' });
const prisma = new PrismaClient();

async function bulkIndex() {
  try {
    console.log('Getting all documents from database...');
    
    const documents = await prisma.document.findMany({
      where: {
        organizationId: 'cme93490b0000bwkohgvjlyvt'
      }
    });
    
    console.log(`Found ${documents.length} documents to index`);
    
    // Create bulk index operations
    const body = [];
    
    for (const doc of documents) {
      // Add index operation
      body.push({
        index: { _index: 'dms-documents', _id: doc.id }
      });
      
      // Add document data
      body.push({
        id: doc.id,
        title: doc.title,
        content: doc.description || '',
        organizationId: doc.organizationId,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        metadata: doc.metadata
      });
    }
    
    console.log('Bulk indexing documents...');
    const response = await client.bulk({ body });
    
    if (response.errors) {
      console.error('Bulk index errors:', response.items.filter(item => item.index.error));
    } else {
      console.log(`Successfully indexed ${documents.length} documents`);
    }
    
    // Refresh index
    await client.indices.refresh({ index: 'dms-documents' });
    console.log('Index refreshed');
    
  } catch (error) {
    console.error('Bulk index error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

bulkIndex();
