const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentContent() {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: 'cmffo4zta0001125e4twigu39' },
      select: {
        id: true,
        title: true,
        customFields: true
      }
    });
    
    if (doc && doc.customFields) {
      const customFields = doc.customFields;
      console.log('📄 Document:', doc.title);
      console.log('\n🔍 CustomFields keys:', Object.keys(customFields));
      
      if (customFields.htmlContent) {
        console.log('✅ Has htmlContent:', customFields.htmlContent.substring(0, 200) + '...');
        console.log('Length:', customFields.htmlContent.length, 'characters');
      }
      
      if (customFields.content) {
        console.log('✅ Has content:', customFields.content.substring(0, 200) + '...');
        console.log('Length:', customFields.content.length, 'characters');
      }
      
      // Fix: Copy htmlContent to content field
      if (customFields.htmlContent && !customFields.content) {
        console.log('\n🔧 Fixing: Copying htmlContent to content field...');
        
        const updatedDoc = await prisma.document.update({
          where: { id: 'cmffo4zta0001125e4twigu39' },
          data: {
            customFields: {
              ...customFields,
              content: customFields.htmlContent
            }
          }
        });
        
        console.log('✅ Fixed! Document now has content field.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentContent();