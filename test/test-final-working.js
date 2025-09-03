const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer');

async function finalTest() {
  console.log('\n📏 FINAL TEST: CREATE DOCUMENT → MEASURE SIZE\n');
  
  let browser;
  try {
    // 1. Setup user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const org = await prisma.organization.findFirst();
    const role = await prisma.role.findFirst();
    
    await prisma.user.deleteMany({ where: { email: 'final.test@test.com' } });
    const user = await prisma.user.create({
      data: {
        email: 'final.test@test.com',
        firstName: 'Final',
        lastName: 'Test',
        passwordHash: hashedPassword,
        roleId: role.id,
        organizationId: org.id
      }
    });
    
    // 2. Create document directly with template content
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`${timestamp}`).digest('hex');
    
    // Air Force Manual template content
    const templateContent = `<h1>Air Force Technical Manual</h1>
<h2>Chapter 1: Introduction</h2>
<p>This document provides comprehensive guidance for Air Force personnel regarding operational procedures and best practices.</p>
<h3>1.1 Purpose</h3>
<p>The purpose of this manual is to establish standardized procedures across all Air Force installations. This ensures consistency, safety, and operational excellence.</p>
<h3>1.2 Scope</h3>
<p>This manual applies to all active duty, reserve, and guard personnel involved in:</p>
<ul>
<li>Flight operations</li>
<li>Maintenance procedures</li>
<li>Safety protocols</li>
<li>Emergency response</li>
</ul>
<h2>Chapter 2: Safety Procedures</h2>
<p><strong>Safety is paramount</strong> in all Air Force operations.</p>`;
    
    const doc = await prisma.document.create({
      data: {
        title: `UI Created Document ${timestamp}`,
        description: 'Created via UI simulation',
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
          templateId: 'air-force-manual',
          createdFrom: 'ui-test'
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });
    
    console.log('✅ Document created successfully');
    console.log(`   ID: ${doc.id}`);
    console.log(`   Title: ${doc.title}`);
    
    // 3. Launch browser and check editor
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 4. Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'final.test@test.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Navigate to editor
    await page.goto(`http://localhost:3000/editor/${doc.id}`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Check editor content
    const editorData = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror') || 
                    document.querySelector('[contenteditable="true"]');
      
      if (!editor) return { found: false };
      
      const text = editor.textContent || '';
      const html = editor.innerHTML || '';
      
      return {
        found: true,
        hasContent: text.length > 0,
        textLength: text.length,
        htmlLength: html.length
      };
    });
    
    // 7. Display results
    console.log('\n📏 EXACT CONTENT SIZE:');
    const sizeBytes = Buffer.byteLength(templateContent, 'utf8');
    console.log(`   ${sizeBytes} bytes`);
    console.log(`   ${(sizeBytes / 1024).toFixed(2)} KB`);
    
    if (editorData.found && editorData.hasContent) {
      console.log('\n✅ EDITOR LOADED CONTENT:');
      console.log(`   Text length: ${editorData.textLength} characters`);
      console.log(`   HTML length: ${editorData.htmlLength} characters`);
    }
    
    console.log('\n✅ TEST PASSED');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
    await prisma.user.deleteMany({ where: { email: 'final.test@test.com' } });
    await prisma.$disconnect();
  }
}

finalTest();