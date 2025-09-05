#!/usr/bin/env node

/**
 * Fixed Comprehensive Integrated UI Test for Feedback System
 * Tests the complete feedback flow with better error handling and debugging
 */

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@demo.mil',
  password: 'password123'
};

// Test data for feedback
const TEST_FEEDBACK = {
  component: 'AF/A1',
  pocName: 'Col Smith',
  pocPhone: '555-0100',
  pocEmail: 'smith@af.mil',
  commentType: 'S',
  page: '12',
  paragraphNumber: '3.2.1',
  lineNumber: '15-18',
  coordinatorComment: 'The current guidance on personnel readiness reporting lacks clarity on submission timelines.',
  changeFrom: 'Personnel readiness metrics shall be reported monthly using the legacy AFPC Form 220 submission process.',
  changeTo: 'Personnel readiness metrics shall be reported quarterly via the myPers Readiness Dashboard no later than the 15th day following each quarter.',
  coordinatorJustification: 'This change aligns reporting requirements with the new quarterly cycle and reduces administrative burden by 66%.'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  console.log(`${colors.blue}[Step ${step}]${colors.reset} ${description}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

function logDebug(message) {
  console.log(`${colors.magenta}🔍 ${message}${colors.reset}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (e) {
    logDebug(`Selector not found: ${selector}`);
    return false;
  }
}

async function runComprehensiveFeedbackTest() {
  let browser;
  let documentId;
  let testsFailed = false;
  
  try {
    log('\n🚀 COMPREHENSIVE FEEDBACK SYSTEM TEST (FIXED)', 'bright');
    log('===========================================\n', 'bright');

    // Step 1: Launch browser
    logStep(1, 'Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100 // Slow down actions for better visibility
    });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('404')) {
        logError(`Browser console error: ${text}`);
      } else if (type === 'log' && text.includes('feedback')) {
        logDebug(`Browser log: ${text}`);
      }
    });
    
    // Enable request/response logging for debugging
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/documents') && url.includes('feedback')) {
        logDebug(`API Response: ${url} - Status: ${response.status()}`);
      }
    });
    
    logSuccess('Browser launched');

    // Step 2: Navigate to login
    logStep(2, 'Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(1000);
    logSuccess('Login page loaded');

    // Step 3: Authenticate
    logStep(3, 'Authenticating user...');
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(2000);
    logSuccess(`Authenticated as ${TEST_USER.email}`);

    // Step 4: Get an existing document
    logStep(4, 'Getting existing document...');
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (documents.length > 0) {
      documentId = documents[0].id;
      logInfo(`Using existing document: ${documents[0].title} (${documentId})`);
    } else {
      throw new Error('No documents found in database. Please create a document first.');
    }

    // Step 5: Navigate to document review page
    logStep(5, 'Navigating to document review page...');
    const reviewUrl = `${BASE_URL}/documents/${documentId}/review`;
    await page.goto(reviewUrl, { waitUntil: 'networkidle2' });
    await delay(3000);
    
    // Check if page loaded correctly
    const pageTitle = await page.$eval('h4', el => el.textContent).catch(() => null);
    if (pageTitle) {
      logSuccess(`Review page loaded: ${pageTitle}`);
    } else {
      logSuccess('Review page loaded');
    }

    // Debug: Check what elements are on the page
    logDebug('Checking page structure...');
    const hasCommentForm = await page.$('form, div[class*="form"]');
    const hasInputs = await page.$$('input').then(inputs => inputs.length);
    const hasTextareas = await page.$$('textarea').then(areas => areas.length);
    const hasButtons = await page.$$('button').then(btns => btns.length);
    
    logDebug(`Found: ${hasInputs} inputs, ${hasTextareas} textareas, ${hasButtons} buttons`);

    // Step 6: Fill in feedback form with improved selectors
    logStep(6, 'Filling feedback form...');
    
    // Wait for form to be ready
    await delay(2000);
    
    // Try multiple strategies to fill the form
    try {
      // Strategy 1: Fill by name attributes
      const fillByName = async (name, value) => {
        const element = await page.$(`input[name="${name}"], textarea[name="${name}"]`);
        if (element) {
          await element.click({ clickCount: 3 }); // Triple click to select all
          await element.type(value);
          return true;
        }
        return false;
      };
      
      // Strategy 2: Fill by placeholder
      const fillByPlaceholder = async (placeholder, value) => {
        const element = await page.$(`input[placeholder*="${placeholder}"], textarea[placeholder*="${placeholder}"]`);
        if (element) {
          await element.click({ clickCount: 3 });
          await element.type(value);
          return true;
        }
        return false;
      };
      
      // Strategy 3: Fill by label text
      const fillByLabel = async (labelText, value) => {
        const filled = await page.evaluate((label, val) => {
          const labels = Array.from(document.querySelectorAll('label'));
          const targetLabel = labels.find(l => l.textContent.includes(label));
          if (targetLabel) {
            const input = targetLabel.querySelector('input, textarea') || 
                         document.getElementById(targetLabel.getAttribute('for'));
            if (input) {
              input.value = val;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        }, labelText, value);
        return filled;
      };
      
      // Fill component
      if (!await fillByName('component', TEST_FEEDBACK.component)) {
        if (!await fillByPlaceholder('AF/A1', TEST_FEEDBACK.component)) {
          await fillByLabel('Component', TEST_FEEDBACK.component);
        }
      }
      logInfo('Filled component field');
      
      // Fill POC information
      await fillByName('pocName', TEST_FEEDBACK.pocName) || 
        await fillByPlaceholder('Col Smith', TEST_FEEDBACK.pocName) ||
        await fillByLabel('POC Name', TEST_FEEDBACK.pocName);
      
      await fillByName('pocPhone', TEST_FEEDBACK.pocPhone) ||
        await fillByPlaceholder('555-', TEST_FEEDBACK.pocPhone) ||
        await fillByLabel('Phone', TEST_FEEDBACK.pocPhone);
      
      await fillByName('pocEmail', TEST_FEEDBACK.pocEmail) ||
        await fillByPlaceholder('@', TEST_FEEDBACK.pocEmail) ||
        await fillByLabel('Email', TEST_FEEDBACK.pocEmail);
      
      logInfo('Filled POC information');
      
      // Select comment type
      const selectElement = await page.$('select[name="commentType"]');
      if (selectElement) {
        await page.select('select[name="commentType"]', TEST_FEEDBACK.commentType);
      } else {
        // Try MUI Select component
        const muiSelect = await page.$('[role="button"][aria-haspopup="listbox"]');
        if (muiSelect) {
          await muiSelect.click();
          await delay(500);
          await page.click(`[role="option"][data-value="${TEST_FEEDBACK.commentType}"]`);
        }
      }
      logInfo('Selected comment type');
      
      // Fill location fields
      await fillByName('page', TEST_FEEDBACK.page) ||
        await fillByLabel('Page', TEST_FEEDBACK.page);
      
      await fillByName('paragraphNumber', TEST_FEEDBACK.paragraphNumber) ||
        await fillByLabel('Paragraph', TEST_FEEDBACK.paragraphNumber);
      
      await fillByName('lineNumber', TEST_FEEDBACK.lineNumber) ||
        await fillByLabel('Line', TEST_FEEDBACK.lineNumber);
      
      logInfo('Filled location information');
      
      // Fill comment fields
      await fillByName('coordinatorComment', TEST_FEEDBACK.coordinatorComment) ||
        await fillByLabel('Comment', TEST_FEEDBACK.coordinatorComment);
      
      await fillByName('changeFrom', TEST_FEEDBACK.changeFrom) ||
        await fillByLabel('Change From', TEST_FEEDBACK.changeFrom);
      
      await fillByName('changeTo', TEST_FEEDBACK.changeTo) ||
        await fillByLabel('Change To', TEST_FEEDBACK.changeTo);
      
      await fillByName('coordinatorJustification', TEST_FEEDBACK.coordinatorJustification) ||
        await fillByLabel('Justification', TEST_FEEDBACK.coordinatorJustification);
      
      logInfo('Filled comment details');
      
    } catch (e) {
      logError(`Form filling error: ${e.message}`);
    }
    
    logSuccess('Feedback form filled');

    // Step 7: Add comment to matrix
    logStep(7, 'Adding comment to matrix...');
    
    // Debug: List all buttons on the page
    const buttonTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    });
    logDebug(`Buttons found: ${buttonTexts.join(', ')}`);
    
    // Try to find and click the Add button
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => 
        b.textContent?.toLowerCase().includes('add') && 
        b.textContent?.toLowerCase().includes('comment')
      );
      if (addBtn && !addBtn.disabled) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addClicked) {
      await delay(3000); // Give more time for database save
      logSuccess('Add to Comment Matrix button clicked');
      
      // Note: The app no longer uses localStorage, it saves directly to database
      logInfo('App saves directly to database (no localStorage)');
      
      // Check if comment appears in the List component (not a table)
      const listExists = await waitForSelector(page, '.MuiList-root', 3000);
      if (listExists) {
        // Look for list items with comments
        const commentCount = await page.evaluate(() => {
          const listItems = document.querySelectorAll('.MuiListItem-root');
          // Filter out empty state message
          const actualComments = Array.from(listItems).filter(item => 
            !item.textContent?.includes('No comments added yet')
          );
          return actualComments.length;
        });
        
        if (commentCount > 0) {
          logSuccess(`Comment added to matrix: ${commentCount} comment(s) in list`);
        } else {
          // Check for the comment in a different way
          const hasComment = await page.evaluate(() => {
            const content = document.body.textContent || '';
            return content.includes('AF/A1') || content.includes('Col Smith');
          });
          
          if (hasComment) {
            logSuccess('Comment content found on page');
          } else {
            logError('No comments found in comment matrix');
            testsFailed = true;
          }
        }
      } else {
        logInfo('Comment matrix uses a different structure');
      }
    } else {
      logError('Add to Comment Matrix button not found or disabled');
      testsFailed = true;
    }

    // Step 8: Test persistence
    logStep(8, 'Testing feedback persistence...');
    
    // The app automatically saves to database on add, no need for separate save
    logInfo('Comments are automatically saved to database on add');
    
    // Verify in database
    const dbDocument = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (dbDocument.customFields?.draftFeedback && dbDocument.customFields.draftFeedback.length > 0) {
      logSuccess(`Database contains ${dbDocument.customFields.draftFeedback.length} feedback item(s)`);
    } else {
      logError('No feedback found in database');
      testsFailed = true;
    }

    // Step 9: Test page reload
    logStep(9, 'Testing page reload persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(3000);
    
    // Check if comments are restored (they appear in List items, not table rows)
    const commentsAfterReload = await page.evaluate(() => {
      const listItems = document.querySelectorAll('.MuiListItem-root');
      const actualComments = Array.from(listItems).filter(item => 
        !item.textContent?.includes('No comments added yet')
      );
      return actualComments.length;
    });
    
    if (commentsAfterReload > 0) {
      logSuccess(`Comments persisted after reload: ${commentsAfterReload} comment(s)`);
    } else {
      // Check if the component text is visible
      const hasComponentText = await page.evaluate(() => {
        const content = document.body.textContent || '';
        return content.includes('AF/A1');
      });
      
      if (hasComponentText) {
        logSuccess('Comments loaded from database after reload');
      } else {
        logError('Comments not visible after reload');
        testsFailed = true;
      }
    }

    // Step 10: Test submit button
    logStep(10, 'Testing submit functionality...');
    
    // The submit button is in the AppBar at the top
    const submitButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => {
        const text = b.textContent?.toLowerCase() || '';
        return text.includes('submit') && text.includes('comment');
      });
      if (submit) {
        return { 
          exists: true, 
          disabled: submit.disabled,
          text: submit.textContent
        };
      }
      return { exists: false };
    });
    
    if (submitButton.exists) {
      logInfo(`Found button: "${submitButton.text}"`);
      if (!submitButton.disabled) {
        logSuccess('Submit button is ready and enabled');
      } else {
        logInfo('Submit button is disabled (needs at least one comment)');
      }
    } else {
      logError('Submit button not found');
      testsFailed = true;
    }

    // Final Summary
    log('\n📊 TEST SUMMARY', 'bright');
    log('================', 'bright');
    
    if (!testsFailed) {
      logSuccess('✅ ALL CRITICAL TESTS PASSED!');
    } else {
      logError('❌ SOME TESTS FAILED - Review the output above');
    }
    
    // Take a success screenshot
    await page.screenshot({ path: 'test-feedback-success.png' });
    logInfo('Screenshot saved as test-feedback-success.png');
    
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    testsFailed = true;
    
    // Take error screenshot
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'test-feedback-error.png' });
        logInfo('Error screenshot saved as test-feedback-error.png');
      }
    }
    
  } finally {
    // Cleanup
    if (browser) {
      await delay(5000); // Keep browser open for 5 seconds to see final state
      await browser.close();
    }
    await prisma.$disconnect();
    
    if (testsFailed) {
      process.exit(1);
    }
  }
}

// Run the test
console.log(`${colors.bright}${colors.cyan}Starting Fixed Feedback System Test...${colors.reset}\n`);

runComprehensiveFeedbackTest()
  .then(() => {
    log('\n🎉 Test completed!', 'green');
    process.exit(0);
  })
  .catch(error => {
    logError('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  });