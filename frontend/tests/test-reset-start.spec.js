// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test Reset and Start', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== TEST RESET AND START ===\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate directly to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document');

  // Look for all buttons
  console.log('\nAvailable buttons:');
  const buttons = await page.locator('button:visible').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text?.trim()) {
      console.log(`  - "${text.trim()}"`);
    }
  }

  // Reset workflow
  const resetBtn = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetBtn.isVisible()) {
    console.log('\n✓ Found Reset button, clicking...');
    await resetBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reset workflow');
  } else {
    console.log('\n❌ Reset button not visible');
  }

  // Look for buttons again after reset
  console.log('\nButtons after reset:');
  const buttonsAfter = await page.locator('button:visible').all();
  for (const btn of buttonsAfter) {
    const text = await btn.textContent();
    if (text?.trim()) {
      console.log(`  - "${text.trim()}"`);
    }
  }

  // Start workflow
  const startBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startBtn.isVisible()) {
    console.log('\n✓ Found Start button, clicking...');
    await startBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Started workflow');
  } else {
    console.log('\n❌ Start button not visible');
  }

  console.log('\n=== TEST COMPLETE ===\n');
});