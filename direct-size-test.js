const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectSize() {
  const user = await prisma.user.findFirst();
  const timestamp = Date.now();
  const crypto = require('crypto');
  const checksum = crypto.createHash('md5').update(`${timestamp}`).digest('hex');
  
  // Template content from backend
  const content = `<h1>Air Force Technical Manual</h1>
<h2>Chapter 1: Introduction</h2>
<p>This document provides comprehensive guidance for Air Force personnel.</p>
<h3>1.1 Purpose</h3>
<p>The purpose of this manual is to establish standardized procedures.</p>
<ul>
  <li>Flight operations</li>
  <li>Maintenance procedures</li>
  <li>Safety protocols</li>
</ul>`;
  
  // Create document
  const doc = await prisma.document.create({
    data: {
      title: `Size Test ${timestamp}`,
      description: 'Testing exact size',
      fileName: `test_${timestamp}.html`,
      originalName: `test_${timestamp}.html`,
      mimeType: 'text/html',
      fileSize: Buffer.byteLength(content, 'utf8'),
      checksum: checksum,
      storagePath: `documents/${timestamp}.html`,
      status: 'DRAFT',
      category: 'TEST',
      customFields: {
        content: content
      },
      createdById: user.id,
      organizationId: user.organizationId,
      currentVersion: 1
    }
  });
  
  console.log('\n📏 EXACT CONTENT SIZE:');
  console.log(`${Buffer.byteLength(content, 'utf8')} bytes`);
  
  await prisma.$disconnect();
}

testDirectSize();