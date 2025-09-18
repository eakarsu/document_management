// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Reset should REMOVE active workflow', async ({ page }) => {
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
  console.log('✓ Navigated to document');

  // Check BEFORE reset
  console.log('\n=== BEFORE RESET ===');
  let submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();
  let startWorkflow = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  console.log(`  Submit to PCM button: ${submitToPCM > 0 ? 'YES (workflow active)' : 'NO'}`);
  console.log(`  Start Workflow button: ${startWorkflow > 0 ? 'YES (no workflow)' : 'NO'}`);

  // Click Reset button
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();
  if (await resetButton.count() > 0) {
    console.log('\n✓ Found Reset button - clicking...');
    await resetButton.click();

    // Handle confirmation
    await page.waitForTimeout(1000);
    const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|Reset/i }).last();
    if (await confirmButton.count() > 0) {
      console.log('✓ Clicking confirmation...');
      await confirmButton.click();
      await page.waitForTimeout(3000);
    }

    // Check AFTER reset
    console.log('\n=== AFTER RESET ===');
    submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();
    startWorkflow = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();

    console.log(`  Submit to PCM button: ${submitToPCM > 0 ? '❌ STILL PRESENT (workflow still active!)' : '✅ GONE'}`);
    console.log(`  Start Workflow button: ${startWorkflow > 0 ? '✅ NOW VISIBLE (no active workflow!)' : '❌ NOT VISIBLE'}`);

    if (startWorkflow > 0 && submitToPCM === 0) {
      console.log('\n✅ SUCCESS: Reset removed the active workflow!');
    } else {
      console.log('\n❌ FAILED: Workflow is still active after reset');
    }
  } else {
    console.log('❌ No Reset button found');
  }

  // Check database
  console.log('\n=== DATABASE CHECK ===');
});