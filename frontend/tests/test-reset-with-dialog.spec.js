// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test Reset Button with Dialog Handling', async ({ page }) => {
  console.log('\n=== TESTING RESET WITH DIALOG HANDLING ===\n');

  // IMPORTANT: Handle the confirm dialog
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog appeared: "${dialog.message()}"`);
    console.log(`   Type: ${dialog.type()}`);

    // Accept confirm dialogs, dismiss others
    if (dialog.type() === 'confirm') {
      console.log('   ✅ Accepting confirm dialog');
      await dialog.accept();
    } else if (dialog.type() === 'alert') {
      console.log('   ✅ Dismissing alert');
      await dialog.dismiss();
    }
  });

  // Monitor API calls
  let resetApiCalled = false;
  page.on('request', request => {
    if (request.url().includes('reset')) {
      console.log(`\n🚀 RESET API CALLED: ${request.method()} ${request.url()}`);
      resetApiCalled = true;
    }
  });

  page.on('response', response => {
    if (response.url().includes('reset')) {
      console.log(`📥 RESET API RESPONSE: ${response.status()}`);
    }
  });

  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document\n');

  // Find and click reset button
  const resetButton = await page.locator('button:has-text("🔄 Reset to Start")').first();

  if (await resetButton.count() > 0) {
    console.log('✓ Found Reset button');

    // Check initial state
    const startWorkflowBefore = await page.locator('button:has-text("Start Selected Workflow")').count();
    const submitToPCMBefore = await page.locator('button:has-text("Submit to PCM")').count();
    console.log(`\nBEFORE Reset:`);
    console.log(`  Start Workflow visible: ${startWorkflowBefore > 0}`);
    console.log(`  Submit to PCM visible: ${submitToPCMBefore > 0}`);

    console.log('\n🖱️ Clicking Reset button...');
    await resetButton.click();

    // Wait for potential page reload or API response
    await page.waitForTimeout(3000);

    // Check if API was called
    if (resetApiCalled) {
      console.log('\n✅ SUCCESS: Reset API was called!');

      // Wait for page to potentially reload
      await page.waitForLoadState('networkidle').catch(() => {
        console.log('   Page reloaded after reset');
      });

      // Check state after reset
      await page.waitForTimeout(2000);
      const startWorkflowAfter = await page.locator('button:has-text("Start Selected Workflow")').count();
      const submitToPCMAfter = await page.locator('button:has-text("Submit to PCM")').count();

      console.log(`\nAFTER Reset:`);
      console.log(`  Start Workflow visible: ${startWorkflowAfter > 0}`);
      console.log(`  Submit to PCM visible: ${submitToPCMAfter > 0}`);

      if (startWorkflowAfter > 0 && submitToPCMAfter === 0) {
        console.log('\n🎉 WORKFLOW SUCCESSFULLY RESET!');
      }
    } else {
      console.log('\n❌ FAILURE: Reset API was not called');
      console.log('   Possible issue with dialog handling');
    }

  } else {
    console.log('❌ Reset button not found');
  }

  // Take screenshot
  await page.screenshot({ path: 'reset-with-dialog.png' });
  console.log('\n📸 Screenshot saved');
});