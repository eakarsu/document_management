import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const doc = await prisma.document.findFirst({
    where: { id: 'cmhnyh9q60001q8tp1kh5wah2' },
    select: {
      id: true,
      title: true,
      customFields: true
    }
  });

  if (doc && doc.customFields) {
    const cf = doc.customFields as any;
    console.log('===== DATABASE CONTENT =====');
    console.log('Document ID:', doc.id);
    console.log('Document title:', doc.title);
    console.log('customFields keys:', Object.keys(cf));
    console.log('Has editableContent:', !!cf.editableContent);
    console.log('editableContent length:', cf.editableContent?.length || 0);
    console.log('Has htmlContent:', !!cf.htmlContent);
    console.log('htmlContent length:', cf.htmlContent?.length || 0);
    console.log('Has content:', !!cf.content);
    console.log('content length:', cf.content?.length || 0);

    if (cf.editableContent) {
      const preview = cf.editableContent.substring(0, 300);
      console.log('\nContent preview (first 300 chars):', preview);
      console.log('\nHas paragraph 1.1.1.2:', cf.editableContent.includes('<strong>1.1.1.2</strong>'));
      console.log('Has paragraph 1.1.1.3:', cf.editableContent.includes('<strong>1.1.1.3</strong>'));
      console.log('Has RESTORE markers:', cf.editableContent.includes('<!--RESTORE_'));

      const markerCount = (cf.editableContent.match(/<!--RESTORE_/g) || []).length;
      console.log('Number of RESTORE markers:', markerCount);
    }
  } else {
    console.log('No customFields found');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
