#!/usr/bin/env node

/**
 * Fix document content for documents that don't have content in customFields
 * This ensures all documents can be edited properly
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDocumentContent() {
  console.log('🔧 Fixing document content in database\n');
  
  try {
    // Get all documents
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        customFields: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${documents.length} documents to check\n`);
    
    let fixed = 0;
    let hasContent = 0;
    
    for (const doc of documents) {
      const customFields = doc.customFields || {};
      
      if (!customFields.content) {
        // Document doesn't have content, add default content
        console.log(`📄 Document: ${doc.title} (${doc.id})`);
        console.log('   ❌ No content found, adding default content');
        
        const defaultContent = `
          <h1>${doc.title}</h1>
          <p>This document was created before the editor feature was added.</p>
          <p>You can now edit this document using the rich text editor.</p>
          <h2>Document Information</h2>
          <ul>
            <li>Created: ${new Date(doc.createdAt).toLocaleDateString()}</li>
            <li>Document ID: ${doc.id}</li>
          </ul>
          <p>Start editing to add your content...</p>
        `;
        
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            customFields: {
              ...customFields,
              content: defaultContent.trim(),
              contentFixed: true,
              fixedAt: new Date().toISOString()
            }
          }
        });
        
        fixed++;
        console.log('   ✅ Default content added\n');
      } else {
        hasContent++;
        console.log(`📄 Document: ${doc.title} (${doc.id})`);
        console.log(`   ✅ Already has content (${customFields.content.length} chars)\n`);
      }
    }
    
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Documents with content: ${hasContent}`);
    console.log(`🔧 Documents fixed: ${fixed}`);
    console.log(`📄 Total documents: ${documents.length}`);
    
    if (fixed > 0) {
      console.log('\n✨ All documents now have editable content!');
    } else {
      console.log('\n✨ All documents already have content!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDocumentContent();