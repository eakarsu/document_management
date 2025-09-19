// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Reset and Start Workflow', async ({ page }) => {
  test.setTimeout(60000); // 1 minute timeout

  console.log('\n=== RESET AND START WORKFLOW TEST ===\n');

  // CRITICAL: Handle confirmation dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    console.log(`   Type: ${dialog.type()}`);
    if (dialog.type() === 'confirm') {
      console.log('   ✅ Accepting confirmation');
      await dialog.accept();
    } else if (dialog.type() === 'alert') {
      console.log('   ✅ Dismissing alert');
      await dialog.dismiss();
    }
  });

  // Step 1: Login as admin
  console.log('1. Logging in as admin...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('   ✓ Logged in successfully\n');

  // Step 2: Click on document in dashboard
  console.log('2. Clicking on document in dashboard...');
  await page.waitForTimeout(2000);

  // Look for the document link in the dashboard
  const documentLink = page.locator('text=/AIR FORCE/i').first();

  if (await documentLink.isVisible({ timeout: 5000 })) {
    await documentLink.click();
    console.log('   ✓ Clicked on document in dashboard');
  } else {
    // Fallback to direct navigation if can't find it
    console.log('   ⚠️ Could not find document in dashboard, navigating directly...');
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  }

  await page.waitForLoadState('networkidle');
  console.log('   ✓ On document page\n');

  // Step 3: Look for and click reset button if present
  console.log('3. Looking for reset button...');
  // The reset button is in the right panel
  const resetButton = page.locator('button').filter({ hasText: 'Reset to Start' });

  if (await resetButton.isVisible()) {
    console.log('   Found reset button - clicking...');
    await resetButton.click();

    // Wait for potential page reload after reset
    await page.waitForTimeout(3000);
    console.log('   ✓ Reset clicked\n');
  } else {
    console.log('   No reset button found - workflow may already be at start\n');
  }

  // Step 4: Look for and click Start Workflow button
  console.log('4. Looking for Start Workflow button...');
  // This button is in the left panel
  const startWorkflowBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });

  if (await startWorkflowBtn.isVisible()) {
    console.log('   Found Start Workflow button - clicking...');
    await startWorkflowBtn.click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Workflow started\n');
  } else {
    console.log('   No Start Workflow button - workflow may already be active\n');
  }

  // Step 5: Verify workflow is active
  console.log('5. Verifying workflow state...');
  await page.waitForTimeout(2000);

  // Check for Submit to PCM button (indicates workflow is at stage 1)
  const submitToPCMBtn = page.locator('button:has-text("Submit to PCM")').first();
  const hasSubmitButton = await submitToPCMBtn.count() > 0;

  if (hasSubmitButton) {
    console.log('   ✅ SUCCESS: Workflow is active at Stage 1 (Submit to PCM visible)');
  } else {
    // Check if workflow might be at a different stage
    const pageText = await page.locator('body').textContent();
    if (pageText.includes('PCM Review')) {
      console.log('   ⚠️ Workflow is at Stage 2 (PCM Review)');
    } else if (pageText.includes('Coordination')) {
      console.log('   ⚠️ Workflow is at Stage 3+ (Coordination)');
    } else {
      console.log('   ❌ Could not determine workflow state');
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'reset-and-start-result.png' });
  console.log('\n📸 Screenshot saved as reset-and-start-result.png');

  // Assert success
  expect(hasSubmitButton).toBeTruthy();

  console.log('\n=== TEST COMPLETE ===\n');
});