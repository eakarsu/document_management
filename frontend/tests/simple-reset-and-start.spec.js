// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Simple Reset and Start Test', async ({ page }) => {
  test.setTimeout(60000);

  console.log('\n=== SIMPLE RESET AND START TEST ===\n');

  // CRITICAL: Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    if (dialog.type() === 'confirm') {
      console.log('   ✅ Accepting confirmation');
      await dialog.accept();
    } else if (dialog.type() === 'alert') {
      console.log('   ✅ Dismissing alert');
      await dialog.dismiss();
    }
  });

  // Login as admin
  console.log('1. Logging in as admin...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('   ✓ Logged in\n');

  // Navigate directly to document page
  console.log('2. Navigating to document...');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('   ✓ On document page\n');

  // Look for Reset button
  console.log('3. Looking for Reset button...');
  const resetButton = page.locator('button').filter({ hasText: 'Reset to Start' });

  if (await resetButton.isVisible()) {
    console.log('   ✅ Found Reset button - clicking...');
    await resetButton.click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Reset complete\n');
  } else {
    console.log('   ℹ️ No Reset button visible\n');
  }

  // Look for Start Workflow button
  console.log('4. Looking for Start Workflow button...');
  const startButton = page.locator('button').filter({ hasText: 'Start Selected Workflow' });

  if (await startButton.isVisible()) {
    console.log('   ✅ Found Start Workflow button - clicking...');
    await startButton.click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Workflow started\n');
  } else {
    console.log('   ℹ️ No Start Workflow button visible\n');
  }

  // Verify workflow is active
  console.log('5. Verifying workflow state...');
  const submitBtn = page.locator('button:has-text("Submit to PCM")');
  const hasSubmitBtn = await submitBtn.isVisible();

  if (hasSubmitBtn) {
    console.log('   ✅ SUCCESS: Workflow is active (Submit to PCM visible)\n');
  } else {
    console.log('   ❌ Workflow not active\n');

    // Debug what buttons ARE visible
    const allButtons = await page.locator('button:visible').all();
    console.log(`   Found ${allButtons.length} visible buttons:`);
    for (const btn of allButtons.slice(0, 5)) {
      const text = await btn.textContent();
      if (text?.trim()) {
        console.log(`   - "${text.trim()}"`);
      }
    }
  }

  await page.screenshot({ path: 'simple-reset-test.png' });
  console.log('\n📸 Screenshot saved');

  // Assert
  expect(hasSubmitBtn).toBeTruthy();
});