const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  const doc = await prisma.document.findFirst({
    where: { title: { contains: 'Technical Documentation' }},
    orderBy: { createdAt: 'desc' }
  });
  
  const content = doc?.customFields?.content || '';
  const htmlContent = doc?.customFields?.htmlContent || '';
  
  // Analyze content field
  console.log('\n=== CONTENT FIELD ===');
  console.log('Has inline styles:', content.includes('style="margin-left'));
  console.log('Level 5 pattern:', /\d+\.\d+\.\d+\.\d+\.\d+/.test(content));
  console.log('First 300 chars:', content.substring(0, 300));
  
  // Analyze htmlContent field  
  console.log('\n=== HTML CONTENT FIELD ===');
  console.log('Has inline styles:', htmlContent.includes('style="margin-left'));
  console.log('Level 5 pattern:', /\d+\.\d+\.\d+\.\d+\.\d+/.test(htmlContent));
  
  await prisma.$disconnect();
}

analyze();
