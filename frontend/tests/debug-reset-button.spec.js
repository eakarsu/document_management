// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Debug Reset Button - Admin Login with Detailed Logging', async ({ page }) => {
  console.log('\n========================================');
  console.log('🔍 RESET BUTTON DEBUG TEST - STARTING');
  console.log('========================================\n');

  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 Browser Console Error:', msg.text());
    }
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('reset') || request.url().includes('workflow')) {
      console.log(`📤 Network Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('reset') || response.url().includes('workflow')) {
      console.log(`📥 Network Response: ${response.status()} ${response.url()}`);
    }
  });

  // STEP 1: LOGIN
  console.log('═══ STEP 1: LOGIN AS ADMIN ═══');
  await page.goto(`${BASE_URL}/login`);
  console.log('  ✓ Navigated to login page');

  await page.fill('input[type="email"]', 'admin@airforce.mil');
  console.log('  ✓ Filled email: admin@airforce.mil');

  await page.fill('input[type="password"]', 'testpass123');
  console.log('  ✓ Filled password');

  await page.click('button[type="submit"]');
  console.log('  ✓ Clicked submit button');

  await page.waitForURL('**/dashboard');
  console.log('  ✅ Successfully logged in - reached dashboard\n');

  // STEP 2: NAVIGATE TO DOCUMENT
  console.log('═══ STEP 2: NAVIGATE TO DOCUMENT ═══');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  console.log(`  ✓ Navigated to: ${BASE_URL}/documents/${DOCUMENT_ID}`);

  await page.waitForLoadState('networkidle');
  console.log('  ✓ Page loaded (network idle)\n');

  // STEP 3: ANALYZE PAGE STATE
  console.log('═══ STEP 3: ANALYZING PAGE STATE ═══');

  // Check for workflow indicators
  const pageText = await page.locator('body').textContent();

  console.log('  Checking for workflow stage indicators:');
  const stages = [
    'Initial Draft', 'PCM Review', 'First Coordination', 'Review Collection',
    'OPR Feedback', 'Second Coordination', 'Legal Review', 'Post-Legal',
    'Leadership', 'AFDPO Publication', 'Document Published', 'Workflow Complete'
  ];

  for (const stage of stages) {
    if (pageText.includes(stage)) {
      console.log(`    ✓ Found: "${stage}"`);
    }
  }

  // STEP 4: FIND ALL BUTTONS
  console.log('\n═══ STEP 4: FINDING ALL BUTTONS ON PAGE ═══');
  const allButtons = await page.locator('button').all();
  console.log(`  Total buttons found: ${allButtons.length}`);

  console.log('\n  Listing ALL buttons with their properties:');
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    const text = await btn.textContent();
    const classes = await btn.getAttribute('class');
    const isVisible = await btn.isVisible();
    const isEnabled = await btn.isEnabled();

    console.log(`\n  Button ${i + 1}:`);
    console.log(`    Text: "${text?.trim() || '(empty)'}"`);
    console.log(`    Visible: ${isVisible}`);
    console.log(`    Enabled: ${isEnabled}`);
    console.log(`    Classes: ${classes?.substring(0, 100)}...`);

    // Special check for reset button
    if (text?.includes('Reset') || text?.includes('🔄')) {
      console.log('    🎯 THIS LOOKS LIKE A RESET BUTTON!');
    }
  }

  // STEP 5: SPECIFICALLY LOOK FOR RESET BUTTON
  console.log('\n═══ STEP 5: SEARCHING FOR RESET BUTTON ═══');

  // Try multiple selectors
  const selectors = [
    { selector: 'button.MuiButton-containedError', name: 'MUI Error Button' },
    { selector: 'button:has-text("Reset")', name: 'Button with "Reset" text' },
    { selector: 'button:has-text("🔄")', name: 'Button with 🔄 emoji' },
    { selector: 'button[class*="error"]', name: 'Button with error class' },
    { selector: 'button[class*="Error"]', name: 'Button with Error class' },
    { selector: '*:has-text("Reset to Start")', name: 'Any element with "Reset to Start"' }
  ];

  let resetButton = null;
  for (const { selector, name } of selectors) {
    console.log(`\n  Trying selector: ${name}`);
    console.log(`    Selector: ${selector}`);

    const elements = await page.locator(selector).all();
    console.log(`    Found ${elements.length} matching elements`);

    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const text = await elem.textContent();
        const tagName = await elem.evaluate(el => el.tagName);
        console.log(`      Element ${i + 1}: <${tagName}> "${text?.trim()}"`);

        if (text?.includes('Reset') && text?.includes('Start')) {
          resetButton = elem;
          console.log('      ✅ FOUND THE RESET BUTTON!');
          break;
        }
      }
    }

    if (resetButton) break;
  }

  // STEP 6: CLICK RESET BUTTON IF FOUND
  if (resetButton) {
    console.log('\n═══ STEP 6: CLICKING RESET BUTTON ═══');

    // Get button properties before clicking
    const buttonText = await resetButton.textContent();
    const buttonClasses = await resetButton.getAttribute('class');
    const boundingBox = await resetButton.boundingBox();

    console.log('  Reset button properties:');
    console.log(`    Full text: "${buttonText}"`);
    console.log(`    Full classes: ${buttonClasses}`);
    console.log(`    Position: x=${boundingBox?.x}, y=${boundingBox?.y}`);
    console.log(`    Size: width=${boundingBox?.width}, height=${boundingBox?.height}`);

    // Monitor for dialog
    const dialogPromise = page.waitForSelector('[role="dialog"], .MuiDialog-root', {
      timeout: 3000
    }).catch(() => null);

    // Click the button
    console.log('\n  🖱️ Clicking reset button...');
    await resetButton.click();
    console.log('  ✓ Click executed');

    // Check if dialog appeared
    const dialog = await dialogPromise;
    if (dialog) {
      console.log('\n  📋 CONFIRMATION DIALOG APPEARED');

      // Find all buttons in dialog
      const dialogButtons = await page.locator('[role="dialog"] button, .MuiDialog-root button').all();
      console.log(`    Found ${dialogButtons.length} buttons in dialog:`);

      for (let i = 0; i < dialogButtons.length; i++) {
        const btn = dialogButtons[i];
        const text = await btn.textContent();
        console.log(`      Button ${i + 1}: "${text?.trim()}"`);

        // Click confirm/yes/reset
        if (text && /confirm|yes|ok|reset/i.test(text)) {
          console.log(`      🎯 Clicking confirmation button: "${text.trim()}"`);
          await btn.click();
          console.log('      ✓ Confirmation clicked');
          break;
        }
      }
    } else {
      console.log('\n  ⚠️ No confirmation dialog appeared within 3 seconds');
    }

    // Wait and check result
    await page.waitForTimeout(3000);

    console.log('\n═══ STEP 7: CHECKING RESULT ═══');

    // Check what buttons are visible now
    const startWorkflowBtn = await page.locator('button:has-text("Start")').filter({hasText: /workflow/i}).count();
    const submitToPCMBtn = await page.locator('button:has-text("Submit to PCM")').count();
    const resetBtnStillThere = await page.locator('button:has-text("Reset to Start")').count();

    console.log('  Button visibility after reset:');
    console.log(`    Start Workflow button: ${startWorkflowBtn > 0 ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    console.log(`    Submit to PCM button: ${submitToPCMBtn > 0 ? 'VISIBLE' : 'NOT VISIBLE'}`);
    console.log(`    Reset button still there: ${resetBtnStillThere > 0 ? 'YES' : 'NO'}`);

    if (startWorkflowBtn > 0 && submitToPCMBtn === 0) {
      console.log('\n  🎉 SUCCESS: Workflow has been reset!');
    } else if (submitToPCMBtn > 0) {
      console.log('\n  ⚠️ Workflow still appears to be active');
    }

  } else {
    console.log('\n═══ ❌ RESET BUTTON NOT FOUND ═══');
    console.log('  The reset button could not be located with any selector');
    console.log('  This could mean:');
    console.log('    1. Button is not visible for current user role');
    console.log('    2. Button is conditionally rendered based on workflow state');
    console.log('    3. Button has different text/classes than expected');
  }

  // STEP 8: TAKE SCREENSHOT
  console.log('\n═══ STEP 8: TAKING SCREENSHOT ═══');
  await page.screenshot({ path: 'debug-reset-button.png', fullPage: true });
  console.log('  📸 Screenshot saved as debug-reset-button.png');

  console.log('\n========================================');
  console.log('🔍 RESET BUTTON DEBUG TEST - COMPLETE');
  console.log('========================================\n');
});