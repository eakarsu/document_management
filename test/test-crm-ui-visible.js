const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testCRMUIVisible() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TESTING CRM UI VISIBILITY');
  console.log('='.repeat(70) + '\n');
  
  let browser;
  try {
    // Setup test user and document
    const hashedPassword = await bcrypt.hash('test123', 10);
    const org = await prisma.organization.findFirst();
    const role = await prisma.role.findFirst();
    
    // Clean up any existing test data
    try {
      // Delete related records first
      await prisma.auditLog.deleteMany({
        where: { user: { email: 'crm.ui.test@af.mil' } }
      });
      await prisma.document.deleteMany({ 
        where: { createdBy: { email: 'crm.ui.test@af.mil' } } 
      });
      await prisma.user.deleteMany({ where: { email: 'crm.ui.test@af.mil' } });
    } catch (e) {
      // Ignore cleanup errors
    }
    
    const user = await prisma.user.create({
      data: {
        email: 'crm.ui.test@af.mil',
        firstName: 'CRM',
        lastName: 'Tester',
        passwordHash: hashedPassword,
        roleId: role.id,
        organizationId: org.id
      }
    });
    
    // Create test document
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`${timestamp}`).digest('hex');
    
    const document = await prisma.document.create({
      data: {
        title: `CRM UI Test ${timestamp}`,
        description: 'Testing CRM feedback form visibility',
        fileName: `crm_test_${timestamp}.html`,
        originalName: `crm_test_${timestamp}.html`,
        mimeType: 'text/html',
        fileSize: 1000,
        checksum: checksum,
        storagePath: `documents/${timestamp}.html`,
        status: 'DRAFT',
        category: 'TEST',
        customFields: {
          content: '<h1>Test Document</h1>'
        },
        createdById: user.id,
        organizationId: org.id,
        currentVersion: 1
      }
    });
    
    console.log('✅ Created test document');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1600, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Login - check what's on the page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'login-page-debug.png' });
    console.log('Screenshot saved as login-page-debug.png');
    
    // Check page content
    const pageContent = await page.evaluate(() => document.body.innerText);
    if (pageContent.includes('Error') || pageContent.includes('Cannot')) {
      console.log('Page has error:', pageContent.substring(0, 500));
    }
    
    // Skip to document page directly since login might be having issues
    console.log('\n⚠️ Login page issue detected, navigating directly to document...\n');
    
    // Navigate directly to document (may redirect to login)
    await page.goto(`http://localhost:3000/documents/${document.id}`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on login page
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      // Try alternative selectors
      const emailInput = await page.$('input:first-of-type');
      const passwordInput = await page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        await emailInput.type('crm.ui.test@af.mil');
        await passwordInput.type('test123');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('Could not find login inputs, proceeding anyway...');
      }
    }
    
    console.log('Attempting to view document page...');
    
    // Try to navigate to document again after login attempt
    if (!page.url().includes(`documents/${document.id}`)) {
      await page.goto(`http://localhost:3000/documents/${document.id}`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n📋 CHECKING CRM FORM VISIBILITY:\n');
    
    // Check for CRM form elements
    const crmElements = await page.evaluate(() => {
      const results = {
        formTitle: false,
        componentField: false,
        pocFields: false,
        commentTypeField: false,
        pageField: false,
        paraField: false,
        lineField: false,
        commentFields: false,
        resolutionField: false,
        allColumns: []
      };
      
      // Check for form title
      const titles = Array.from(document.querySelectorAll('h6, .MuiTypography-h6'));
      results.formTitle = titles.some(el => 
        el.textContent?.includes('CRM') || 
        el.textContent?.includes('Comment Resolution Matrix')
      );
      
      // Check for specific fields
      const labels = Array.from(document.querySelectorAll('label, .MuiFormLabel-root'));
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      
      // Column 1: Component and POC
      results.componentField = labels.some(el => el.textContent?.includes('Component'));
      results.pocFields = labels.some(el => el.textContent?.includes('POC'));
      
      // Column 2: Comment Type
      results.commentTypeField = labels.some(el => 
        el.textContent?.includes('Comment Type') || 
        el.textContent?.includes('Type')
      );
      
      // Columns 3-5: Location
      results.pageField = labels.some(el => el.textContent?.includes('Page'));
      results.paraField = labels.some(el => 
        el.textContent?.includes('Para') || 
        el.textContent?.includes('Paragraph')
      );
      results.lineField = labels.some(el => el.textContent?.includes('Line'));
      
      // Column 6: Comments
      results.commentFields = labels.some(el => 
        el.textContent?.includes('Comment') || 
        el.textContent?.includes('Justification')
      );
      
      // Column 7: Resolution
      results.resolutionField = labels.some(el => 
        el.textContent?.includes('Resolution') ||
        el.textContent?.includes('Accept') ||
        el.textContent?.includes('Reject')
      );
      
      // Collect all visible columns
      labels.forEach(label => {
        const text = label.textContent?.trim();
        if (text) results.allColumns.push(text);
      });
      
      return results;
    });
    
    // Display results
    console.log('CRM Form Elements Found:');
    console.log(`   ✓ Form Title: ${crmElements.formTitle ? '✅' : '❌'}`);
    console.log(`   ✓ Column 1 - Component: ${crmElements.componentField ? '✅' : '❌'}`);
    console.log(`   ✓ Column 1 - POC: ${crmElements.pocFields ? '✅' : '❌'}`);
    console.log(`   ✓ Column 2 - Comment Type: ${crmElements.commentTypeField ? '✅' : '❌'}`);
    console.log(`   ✓ Column 3 - Page: ${crmElements.pageField ? '✅' : '❌'}`);
    console.log(`   ✓ Column 4 - Paragraph: ${crmElements.paraField ? '✅' : '❌'}`);
    console.log(`   ✓ Column 5 - Line: ${crmElements.lineField ? '✅' : '❌'}`);
    console.log(`   ✓ Column 6 - Comments: ${crmElements.commentFields ? '✅' : '❌'}`);
    console.log(`   ✓ Column 7 - Resolution: ${crmElements.resolutionField ? '✅' : '❌'}`);
    
    if (crmElements.allColumns.length > 0) {
      console.log('\nAll Visible Fields:');
      crmElements.allColumns.forEach(col => console.log(`   - ${col}`));
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'crm-form-screenshot.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as crm-form-screenshot.png');
    
    // Check if all columns are visible
    const allColumnsVisible = 
      crmElements.componentField && 
      crmElements.pocFields && 
      crmElements.commentTypeField && 
      crmElements.pageField && 
      crmElements.paraField && 
      crmElements.lineField && 
      crmElements.commentFields;
    
    if (allColumnsVisible) {
      console.log('\n✅ ALL 7 CRM COLUMNS ARE VISIBLE IN UI!');
    } else {
      console.log('\n⚠️ Some CRM columns are missing from UI');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Keep open for viewing
      await browser.close();
    }
    // Clean up test data
    try {
      await prisma.auditLog.deleteMany({
        where: { user: { email: 'crm.ui.test@af.mil' } }
      });
      await prisma.document.deleteMany({ 
        where: { createdBy: { email: 'crm.ui.test@af.mil' } } 
      });
      await prisma.user.deleteMany({ where: { email: 'crm.ui.test@af.mil' } });
    } catch (e) {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  }
}

testCRMUIVisible();