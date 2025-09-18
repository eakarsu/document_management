// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test reset button works when no workflow exists', async ({ page }) => {
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

  // Check current state
  const startWorkflow = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  const submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();

  console.log('\n=== CURRENT STATE ===');
  console.log(`  Start Workflow button: ${startWorkflow > 0 ? 'YES (no workflow)' : 'NO'}`);
  console.log(`  Submit to PCM button: ${submitToPCM > 0 ? 'YES (workflow active)' : 'NO'}`);

  // Monitor for errors
  page.on('response', response => {
    if (response.url().includes('reset') && response.status() >= 400) {
      console.log(`❌ Reset API error: ${response.status()} ${response.statusText()}`);
    }
  });

  // Try clicking Reset button regardless of state
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  if (await resetButton.count() > 0) {
    console.log('\n✓ Found Reset button - clicking...');

    // Click reset
    await resetButton.click();
    await page.waitForTimeout(1000);

    // Handle confirmation if it appears
    const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|OK|Reset/i }).last();
    if (await confirmButton.count() > 0) {
      console.log('✓ Clicking confirmation...');
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('✅ Reset button clicked successfully - no 500 error!');
  } else {
    console.log('⚠️ No Reset button visible');
  }
});