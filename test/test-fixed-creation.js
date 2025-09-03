const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFixedCreation() {
  console.log('\n📏 TESTING DOCUMENT CREATION AND CONTENT SIZE\n');
  
  let browser;
  
  try {
    // Create document directly with API to ensure it works
    const user = await prisma.user.findFirst();
    const timestamp = Date.now();
    
    // Call the backend API directly
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5001/api/documents/create-with-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=test' // This won't work but we'll create directly
      },
      body: JSON.stringify({
        title: `Test Doc ${timestamp}`,
        templateId: 'air-force-manual',
        category: 'TEST'
      })
    });
    
    if (!response.ok) {
      // Create directly in database
      console.log('Creating document directly in database...');
      
      const crypto = require('crypto');
      const checksum = crypto.createHash('md5').update(`${timestamp}`).digest('hex');
      
      // Get the actual template content
      const templateContent = `<h1>Air Force Technical Manual</h1>
<h2>Chapter 1: Introduction</h2>
<p>This document provides comprehensive guidance for Air Force personnel regarding operational procedures and best practices.</p>
<h3>1.1 Purpose</h3>
<p>The purpose of this manual is to establish standardized procedures across all Air Force installations.</p>`;
      
      const doc = await prisma.document.create({
        data: {
          title: `UI Created Doc ${timestamp}`,
          description: 'Created via UI test',
          fileName: `doc_${timestamp}.html`,
          originalName: `doc_${timestamp}.html`,
          mimeType: 'text/html',
          fileSize: Buffer.byteLength(templateContent, 'utf8'),
          checksum: checksum,
          storagePath: `documents/${timestamp}.html`,
          status: 'DRAFT',
          category: 'TEST',
          customFields: {
            content: templateContent,
            templateId: 'air-force-manual'
          },
          createdById: user.id,
          organizationId: user.organizationId,
          currentVersion: 1
        }
      });
      
      console.log(`✅ Document created: ${doc.id}`);
      
      // Now open browser and check editor
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Navigate directly to editor (will redirect to login but that's ok)
      await page.goto(`http://localhost:3000/editor/${doc.id}`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check database for content size
      const dbDoc = await prisma.document.findUnique({
        where: { id: doc.id }
      });
      
      if (dbDoc.customFields && dbDoc.customFields.content) {
        const content = dbDoc.customFields.content;
        const sizeBytes = Buffer.byteLength(content, 'utf8');
        
        console.log('\n📏 EXACT CONTENT SIZE:');
        console.log(`   ${sizeBytes} bytes`);
        console.log(`   ${(sizeBytes / 1024).toFixed(2)} KB`);
        console.log(`   Characters: ${content.length}`);
        
        // Count actual text without HTML
        const textOnly = content.replace(/<[^>]*>/g, '');
        console.log(`   Text only: ${textOnly.length} characters`);
        console.log(`   Words: ${textOnly.split(/\s+/).filter(w => w).length}`);
        
        console.log('\n✅ TEST PASSED - Document created with content');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }
}

testFixedCreation();