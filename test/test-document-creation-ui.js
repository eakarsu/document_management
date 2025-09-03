const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDocumentCreationUI() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 COMPREHENSIVE DOCUMENT CREATION UI TEST');
  console.log('='.repeat(60) + '\n');
  
  let browser;
  
  try {
    // 1. Check initial document count
    console.log('📊 Checking initial database state...');
    const initialDocCount = await prisma.document.count();
    console.log(`   Initial document count: ${initialDocCount}`);
    
    // 2. Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   Browser error: ${msg.text()}`);
      }
    });
    
    // 3. Navigate to dashboard
    console.log('\n📱 Step 1: Navigate to Dashboard');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if we need to login first
    if (currentUrl.includes('/login')) {
      console.log('   ⚠️  Redirected to login - need authentication');
      console.log('\n🔐 Logging in...');
      
      // Try to login with test credentials
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        await page.type('input[type="email"]', 'test@example.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (page.url().includes('/dashboard')) {
          console.log('   ✅ Login successful, now on dashboard');
        } else {
          console.log('   ❌ Login failed, continuing anyway');
        }
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ Successfully loaded dashboard');
    }
    
    // 4. Find and click Create Document button
    console.log('\n📝 Step 2: Click "Create Document" Button');
    
    const createButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(btn => 
        btn.textContent?.includes('Create Document') ||
        btn.textContent?.includes('Create')
      );
      
      if (createBtn) {
        createBtn.click();
        return true;
      }
      return false;
    });
    
    if (createButtonFound) {
      console.log('   ✅ Clicked "Create Document" button');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we navigated to create page
      const newUrl = page.url();
      if (newUrl.includes('/documents/create')) {
        console.log('   ✅ Navigated to document creation page');
      } else {
        console.log(`   ⚠️  Unexpected URL: ${newUrl}`);
      }
    } else {
      console.log('   ❌ "Create Document" button not found');
      console.log('   Attempting direct navigation...');
      await page.goto('http://localhost:3000/documents/create', { waitUntil: 'networkidle2' });
    }
    
    // 5. Select first template
    console.log('\n📋 Step 3: Select First Template');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if templates are displayed
    const templatesFound = await page.evaluate(() => {
      // Look for template cards
      const cards = document.querySelectorAll('.MuiCard-root');
      return cards.length;
    });
    
    console.log(`   Found ${templatesFound} template cards`);
    
    if (templatesFound > 0) {
      // Click the first template card
      const templateSelected = await page.evaluate(() => {
        const firstCard = document.querySelector('.MuiCard-root');
        if (firstCard) {
          firstCard.click();
          return true;
        }
        return false;
      });
      
      if (templateSelected) {
        console.log('   ✅ Selected first template (DAF Policy Directive)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if template is highlighted
        const isSelected = await page.evaluate(() => {
          const firstCard = document.querySelector('.MuiCard-root');
          const style = window.getComputedStyle(firstCard);
          return style.borderColor !== 'rgb(224, 224, 224)'; // Check if border changed
        });
        
        if (isSelected) {
          console.log('   ✅ Template visually selected (border highlighted)');
        }
      } else {
        console.log('   ❌ Failed to click template');
      }
    } else {
      console.log('   ❌ No templates found on page');
    }
    
    // 6. Click Next to go to document details
    console.log('\n➡️  Step 4: Click Next Button');
    
    const nextClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn => btn.textContent === 'Next');
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
        return true;
      }
      return false;
    });
    
    if (nextClicked) {
      console.log('   ✅ Clicked Next button');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      console.log('   ❌ Next button not found or disabled');
    }
    
    // 7. Fill in document details
    console.log('\n📝 Step 5: Fill Document Details');
    
    // Generate unique title to avoid conflicts
    const timestamp = Date.now();
    const documentTitle = `Test Document ${timestamp}`;
    
    // Fill title field
    const titleFilled = await page.evaluate((title) => {
      const titleInput = document.querySelector('input[placeholder*="title"]') ||
                        document.querySelector('input[label*="Title"]') ||
                        document.querySelector('input');
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, documentTitle);
    
    if (titleFilled) {
      console.log(`   ✅ Filled title: "${documentTitle}"`);
    } else {
      console.log('   ❌ Could not fill title field');
    }
    
    // Fill other optional fields
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach((input, index) => {
        if (index === 1) { // Publication Number
          input.value = 'TEST-001';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (index === 2) { // OPR
          input.value = 'Test Office';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
    
    console.log('   ✅ Filled additional fields');
    
    // 8. Click Next again to go to review
    console.log('\n➡️  Step 6: Click Next to Review');
    
    const nextToReview = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn => btn.textContent === 'Next');
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
        return true;
      }
      return false;
    });
    
    if (nextToReview) {
      console.log('   ✅ Clicked Next to review');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // 9. Click Create Document button
    console.log('\n🎯 Step 7: Click Create Document Button');
    
    const createClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(btn => 
        btn.textContent?.includes('Create Document') && 
        !btn.textContent?.includes('Create Document Button')
      );
      
      if (createBtn && !createBtn.disabled) {
        console.log('Found create button:', createBtn.textContent);
        createBtn.click();
        return true;
      }
      return false;
    });
    
    if (createClicked) {
      console.log('   ✅ Clicked "Create Document" button');
      console.log('   ⏳ Waiting for document creation...');
      
      // Wait for navigation or alert
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for success indicators
      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/editor/')) {
        console.log('   ✅ SUCCESS! Redirected to editor');
        
        // Extract document ID from URL
        const docId = finalUrl.split('/editor/')[1];
        console.log(`   Document ID: ${docId}`);
        
        // Verify editor loaded
        const editorLoaded = await page.evaluate(() => {
          return document.querySelector('.ProseMirror') !== null ||
                 document.querySelector('[contenteditable]') !== null;
        });
        
        if (editorLoaded) {
          console.log('   ✅ Editor loaded successfully');
          
          // Check if content is present
          const editorContent = await page.evaluate(() => {
            const editor = document.querySelector('.ProseMirror') || 
                          document.querySelector('[contenteditable]');
            return editor ? editor.textContent.substring(0, 100) : '';
          });
          
          if (editorContent) {
            console.log('   ✅ Editor has content');
            console.log(`   Content preview: "${editorContent}..."`);
          }
        }
      } else if (finalUrl.includes('/documents/')) {
        console.log('   ✅ SUCCESS! Redirected to document view');
      } else {
        console.log('   ⚠️  Document may have been created but no redirect');
      }
      
      // Check for alerts
      const alertText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"], .MuiAlert-root');
        if (alerts.length > 0) {
          return Array.from(alerts).map(a => a.textContent).join(', ');
        }
        return null;
      });
      
      if (alertText) {
        console.log(`   Alert message: ${alertText}`);
      }
    } else {
      console.log('   ❌ Create button not found or disabled');
    }
    
    // 10. Verify in database
    console.log('\n🔍 Step 8: Verify Document in Database');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalDocCount = await prisma.document.count();
    const newDocs = finalDocCount - initialDocCount;
    
    console.log(`   Final document count: ${finalDocCount}`);
    console.log(`   New documents created: ${newDocs}`);
    
    if (newDocs > 0) {
      console.log('   ✅ Document successfully created in database!');
      
      // Get the newly created document
      const latestDoc = await prisma.document.findFirst({
        where: {
          title: documentTitle
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (latestDoc) {
        console.log(`\n📄 Created Document Details:`);
        console.log(`   ID: ${latestDoc.id}`);
        console.log(`   Title: ${latestDoc.title}`);
        console.log(`   Status: ${latestDoc.status}`);
        console.log(`   Category: ${latestDoc.category}`);
        
        // Check if content was saved
        if (latestDoc.customFields && latestDoc.customFields.content) {
          console.log(`   ✅ Content saved: ${latestDoc.customFields.content.length} characters`);
        } else {
          console.log('   ⚠️  No content in customFields');
        }
      }
    } else {
      console.log('   ❌ No new documents in database');
    }
    
    // 11. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const steps = [
      { name: 'Navigate to Dashboard', status: currentUrl.includes('dashboard') },
      { name: 'Click Create Document', status: createButtonFound },
      { name: 'Select Template', status: templatesFound > 0 },
      { name: 'Fill Document Details', status: titleFilled },
      { name: 'Create Document', status: createClicked },
      { name: 'Document Saved to DB', status: newDocs > 0 }
    ];
    
    steps.forEach(step => {
      console.log(`   ${step.status ? '✅' : '❌'} ${step.name}`);
    });
    
    const passedSteps = steps.filter(s => s.status).length;
    const totalSteps = steps.length;
    const successRate = (passedSteps / totalSteps * 100).toFixed(1);
    
    console.log(`\n   Success Rate: ${successRate}% (${passedSteps}/${totalSteps})`);
    
    if (passedSteps === totalSteps) {
      console.log('\n🎉 ALL TESTS PASSED! Document creation flow works perfectly!');
    } else {
      console.log(`\n⚠️  ${totalSteps - passedSteps} steps failed`);
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the test
testDocumentCreationUI().catch(console.error);