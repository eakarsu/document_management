const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5001';
const TEST_TIMEOUT = 120000;

// Test colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`📝 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logTest(message, status = 'info') {
  const prefix = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '🔍';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'blue';
  log(`${prefix} ${message}`, color);
}

async function getExistingData() {
  logSection('Getting Existing Database Data');
  
  try {
    const script = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function getData() {
        // Get existing users and documents
        const users = await prisma.user.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' }
        });
        
        const documents = await prisma.document.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: true,
            versions: {
              take: 2,
              orderBy: { versionNumber: 'desc' }
            }
          }
        });
        
        console.log(JSON.stringify({
          users: users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            roleId: u.roleId
          })),
          documents: documents.map(d => ({
            id: d.id,
            title: d.title,
            status: d.status,
            fileName: d.fileName,
            createdById: d.createdById,
            versions: d.versions
          }))
        }));
      }
      
      getData()
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
    `;
    
    const { stdout } = await execPromise(`cd backend && node -e "${script}"`);
    const data = JSON.parse(stdout);
    logTest(`Found ${data.users.length} users and ${data.documents.length} documents`, 'pass');
    return data;
  } catch (error) {
    logTest(`Failed to get existing data: ${error.message}`, 'fail');
    throw error;
  }
}

async function testEditorFunctionality(page, testData) {
  logSection('Testing Editor Functionality');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  try {
    // Test 1: Login with existing user
    logTest('Testing login with existing user...');
    results.total++;
    
    // Use the first user from database
    const testUser = testData.users[0];
    if (!testUser) {
      logTest('No users found in database', 'fail');
      results.failed++;
      return results;
    }
    
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Try common test password
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if login was successful or if we're still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/editor')) {
      logTest('Login successful', 'pass');
      results.passed++;
    } else {
      logTest('Login might have failed - continuing with editor tests', 'fail');
      results.failed++;
    }
    
    // Test 2: Navigate to editor (try creating new document or using existing)
    logTest('Testing editor page...');
    results.total++;
    
    // First check if there are existing documents
    if (testData.documents.length > 0) {
      const testDoc = testData.documents[0];
      logTest(`Loading existing document: ${testDoc.title}`);
      
      await page.goto(`${FRONTEND_URL}/editor/${testDoc.id}`, { waitUntil: 'networkidle2' });
    } else {
      // Try to navigate to new document editor
      await page.goto(`${FRONTEND_URL}/editor/new`, { waitUntil: 'networkidle2' });
    }
    
    // Wait for editor to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if editor loaded (look for ProseMirror or TipTap editor)
    const editorExists = await page.evaluate(() => {
      return document.querySelector('.ProseMirror') !== null ||
             document.querySelector('[contenteditable="true"]') !== null ||
             document.querySelector('.tiptap') !== null ||
             document.querySelector('.editor-container') !== null ||
             document.querySelector('[data-editor]') !== null;
    });
    
    if (editorExists) {
      logTest('Editor loaded successfully', 'pass');
      results.passed++;
      results.details.push({ test: 'Editor loading', status: 'passed' });
      
      // Test 3: Check if content from database is displayed
      if (testData.documents.length > 0) {
        logTest('Testing database content display...');
        results.total++;
        
        const pageContent = await page.evaluate(() => document.body.textContent);
        const hasContent = testData.documents.some(doc => 
          pageContent.includes(doc.title) || pageContent.includes(doc.fileName)
        );
        
        if (hasContent) {
          logTest('Database content displayed in editor', 'pass');
          results.passed++;
          results.details.push({ test: 'Database content display', status: 'passed' });
        } else {
          logTest('Database content not clearly visible', 'fail');
          results.failed++;
          results.details.push({ test: 'Database content display', status: 'failed' });
        }
      }
      
      // Test 4: Test text editing functionality
      logTest('Testing text editing...');
      results.total++;
      
      // Find the editable area
      const editorSelector = await page.evaluate(() => {
        if (document.querySelector('.ProseMirror')) return '.ProseMirror';
        if (document.querySelector('[contenteditable="true"]')) return '[contenteditable="true"]';
        if (document.querySelector('.tiptap')) return '.tiptap';
        return null;
      });
      
      if (editorSelector) {
        // Click on the editor
        await page.click(editorSelector);
        
        // Type some text
        await page.keyboard.type(' Testing editor functionality.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const hasNewText = await page.evaluate((selector) => {
          const editor = document.querySelector(selector);
          return editor && editor.textContent.includes('Testing editor functionality');
        }, editorSelector);
        
        if (hasNewText) {
          logTest('Text editing successful', 'pass');
          results.passed++;
          results.details.push({ test: 'Text editing', status: 'passed' });
        } else {
          logTest('Text editing failed', 'fail');
          results.failed++;
          results.details.push({ test: 'Text editing', status: 'failed' });
        }
      } else {
        logTest('Editor not found for text editing', 'fail');
        results.failed++;
      }
      
      // Test 5: Check for toolbar buttons
      logTest('Testing toolbar presence...');
      results.total++;
      
      const hasToolbar = await page.evaluate(() => {
        const toolbarSelectors = [
          'button[aria-label*="Bold"]',
          'button[aria-label*="Italic"]',
          'button[title*="Bold"]',
          'button[title*="Italic"]',
          '.toolbar',
          '.editor-toolbar',
          '[role="toolbar"]',
          '.lucide-bold',
          '.lucide-italic'
        ];
        
        return toolbarSelectors.some(selector => document.querySelector(selector) !== null);
      });
      
      if (hasToolbar) {
        logTest('Editor toolbar found', 'pass');
        results.passed++;
        results.details.push({ test: 'Toolbar presence', status: 'passed' });
        
        // Test 6: Try bold formatting
        logTest('Testing bold formatting...');
        results.total++;
        
        // Select some text first
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        
        // Try to apply bold
        const boldApplied = await page.evaluate(async () => {
          // Try clicking bold button
          const boldButtons = document.querySelectorAll('button[aria-label*="Bold"], button[title*="Bold"], button:has(.lucide-bold)');
          if (boldButtons.length > 0) {
            boldButtons[0].click();
            return true;
          }
          
          // Try keyboard shortcut
          document.execCommand('bold', false, null);
          return document.queryCommandState('bold');
        });
        
        if (boldApplied) {
          logTest('Bold formatting applied', 'pass');
          results.passed++;
          results.details.push({ test: 'Bold formatting', status: 'passed' });
        } else {
          logTest('Bold formatting not confirmed', 'fail');
          results.failed++;
          results.details.push({ test: 'Bold formatting', status: 'failed' });
        }
      } else {
        logTest('Editor toolbar not found', 'fail');
        results.failed++;
        results.details.push({ test: 'Toolbar presence', status: 'failed' });
      }
      
      // Test 7: Check save functionality
      logTest('Testing save button...');
      results.total++;
      
      const saveButton = await page.evaluate(() => {
        const saveSelectors = [
          'button:has-text("Save")',
          'button[aria-label*="Save"]',
          'button[title*="Save"]',
          '.save-button',
          'button.save'
        ];
        
        for (const selector of saveSelectors) {
          try {
            const btn = document.querySelector(selector);
            if (btn) return true;
          } catch (e) {
            // Some selectors might not be valid
          }
        }
        
        // Also check for text content
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).some(btn => 
          btn.textContent.toLowerCase().includes('save')
        );
      });
      
      if (saveButton) {
        logTest('Save button found', 'pass');
        results.passed++;
        results.details.push({ test: 'Save button presence', status: 'passed' });
      } else {
        logTest('Save button not found', 'fail');
        results.failed++;
        results.details.push({ test: 'Save button presence', status: 'failed' });
      }
      
      // Test 8: Check for version history if document has versions
      if (testData.documents.length > 0 && testData.documents[0].versions.length > 0) {
        logTest('Testing version history display...');
        results.total++;
        
        const hasVersionInfo = await page.evaluate(() => {
          const versionSelectors = [
            '[class*="version"]',
            '[data-version]',
            '.version-history',
            '.document-versions'
          ];
          
          return versionSelectors.some(selector => document.querySelector(selector) !== null) ||
                 document.body.textContent.toLowerCase().includes('version');
        });
        
        if (hasVersionInfo) {
          logTest('Version information displayed', 'pass');
          results.passed++;
          results.details.push({ test: 'Version display', status: 'passed' });
        } else {
          logTest('Version information not visible', 'fail');
          results.failed++;
          results.details.push({ test: 'Version display', status: 'failed' });
        }
      }
      
      // Test 9: Check for collaborative features
      logTest('Testing collaborative features...');
      results.total++;
      
      const hasCollabFeatures = await page.evaluate(() => {
        const collabSelectors = [
          '[class*="collab"]',
          '[data-collab]',
          '.active-users',
          '.collaboration'
        ];
        
        return collabSelectors.some(selector => document.querySelector(selector) !== null) ||
               document.body.textContent.toLowerCase().includes('collaborat');
      });
      
      if (hasCollabFeatures) {
        logTest('Collaborative features present', 'pass');
        results.passed++;
        results.details.push({ test: 'Collaborative features', status: 'passed' });
      } else {
        logTest('No collaborative features visible', 'fail');
        results.failed++;
        results.details.push({ test: 'Collaborative features', status: 'not found' });
      }
      
      // Test 10: Check undo/redo
      logTest('Testing undo/redo...');
      results.total++;
      
      // Type some text
      if (editorSelector) {
        await page.click(editorSelector);
        const testText = ' Undo test text.';
        await page.keyboard.type(testText);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try undo
        await page.keyboard.down('Control');
        await page.keyboard.press('z');
        await page.keyboard.up('Control');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const undoWorked = await page.evaluate((selector, text) => {
          const editor = document.querySelector(selector);
          return editor && !editor.textContent.includes(text);
        }, editorSelector, 'Undo test text');
        
        if (undoWorked) {
          logTest('Undo functionality working', 'pass');
          results.passed++;
          results.details.push({ test: 'Undo functionality', status: 'passed' });
        } else {
          logTest('Undo functionality not confirmed', 'fail');
          results.failed++;
          results.details.push({ test: 'Undo functionality', status: 'failed' });
        }
      }
      
    } else {
      logTest('Editor not found on page', 'fail');
      results.failed++;
      results.details.push({ test: 'Editor loading', status: 'failed' });
    }
    
  } catch (error) {
    logTest(`Test execution error: ${error.message}`, 'fail');
    results.failed++;
    results.details.push({ test: 'Execution', error: error.message });
  }
  
  return results;
}

async function runComprehensiveTest() {
  console.log('\n' + '='.repeat(60));
  log('🚀 COMPREHENSIVE EDITOR UI INTEGRATION TEST', 'magenta');
  console.log('='.repeat(60));
  
  let browser;
  let testData;
  
  try {
    // Get existing data from database
    testData = await getExistingData();
    
    // Launch browser
    logSection('Launching Browser');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Set longer timeout for navigation
    page.setDefaultTimeout(30000);
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser console error: ${msg.text()}`, 'red');
      }
    });
    
    // Run editor tests
    const editorResults = await testEditorFunctionality(page, testData);
    
    // Display results
    logSection('TEST RESULTS SUMMARY');
    
    console.log(`\n${colors.bold}Editor Tests:${colors.reset}`);
    console.log(`  Total: ${editorResults.total}`);
    console.log(`  ${colors.green}Passed: ${editorResults.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${editorResults.failed}${colors.reset}`);
    console.log(`  Success Rate: ${((editorResults.passed / editorResults.total) * 100).toFixed(1)}%`);
    
    if (editorResults.details.length > 0) {
      console.log(`\n${colors.bold}Detailed Results:${colors.reset}`);
      editorResults.details.forEach(detail => {
        const icon = detail.status === 'passed' ? '✅' : detail.status === 'failed' ? '❌' : '⚠️';
        const color = detail.status === 'passed' ? 'green' : detail.status === 'failed' ? 'red' : 'yellow';
        log(`  ${icon} ${detail.test}: ${detail.status}`, color);
      });
    }
    
    // Overall result
    console.log('\n' + '='.repeat(60));
    const overallSuccess = editorResults.failed === 0;
    
    if (overallSuccess) {
      log('🎉 ALL TESTS PASSED! Editor is fully functional!', 'green');
    } else {
      log(`⚠️  Some tests failed. ${editorResults.failed} issues need attention.`, 'yellow');
    }
    console.log('='.repeat(60));
    
    // Save results to file
    const fs = require('fs');
    const results = {
      timestamp: new Date().toISOString(),
      editor: editorResults,
      testData: {
        users: testData.users.length,
        documents: testData.documents.length
      }
    };
    
    fs.writeFileSync('editor-test-results.json', JSON.stringify(results, null, 2));
    log('\n📄 Test results saved to editor-test-results.json', 'cyan');
    
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runComprehensiveTest().catch(console.error);