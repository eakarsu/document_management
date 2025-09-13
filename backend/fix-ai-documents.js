const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAIGeneratedDocuments() {
  try {
    console.log('🔍 Finding all AI-generated documents...');
    
    // Find all documents with aiGenerated flag
    const documents = await prisma.document.findMany({
      where: {
        customFields: {
          path: ['aiGenerated'],
          equals: true
        }
      }
    });
    
    console.log(`📄 Found ${documents.length} AI-generated documents`);
    
    let fixedCount = 0;
    
    for (const doc of documents) {
      const customFields = doc.customFields;
      
      if (customFields && typeof customFields === 'object') {
        let needsUpdate = false;
        const updatedFields = { ...customFields };
        
        // Check if content field needs fixing
        if (customFields.htmlContent && (!customFields.content || !customFields.content.startsWith('<'))) {
          console.log(`\n🔧 Fixing document: ${doc.id} (${doc.title})`);
          console.log(`   Current content starts with: "${customFields.content?.substring(0, 50)}..."`);
          
          // Copy htmlContent to content field
          updatedFields.content = customFields.htmlContent;
          needsUpdate = true;
          
          console.log(`   ✅ Updated content field with proper HTML`);
        }
        
        // If the content field contains CSS without HTML wrapper, fix it
        if (customFields.content && 
            typeof customFields.content === 'string' && 
            customFields.content.trim().startsWith('.') && 
            !customFields.content.includes('<style>')) {
          
          console.log(`\n🔧 Fixing malformed content in document: ${doc.id}`);
          
          // If we have htmlContent, use it
          if (customFields.htmlContent) {
            updatedFields.content = customFields.htmlContent;
            needsUpdate = true;
            console.log(`   ✅ Replaced malformed content with htmlContent`);
          } else {
            // Wrap the CSS in proper style tags
            updatedFields.content = `<style>${customFields.content}</style>`;
            needsUpdate = true;
            console.log(`   ✅ Wrapped CSS content in style tags`);
          }
        }
        
        if (needsUpdate) {
          // Update the document
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              customFields: updatedFields
            }
          });
          
          fixedCount++;
          console.log(`   ✅ Document ${doc.id} updated successfully`);
        }
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} documents`);
    console.log(`✅ All AI-generated documents have been checked and fixed`);
    
  } catch (error) {
    console.error('❌ Error fixing documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAIGeneratedDocuments();