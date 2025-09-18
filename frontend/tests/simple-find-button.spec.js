// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Simple: Find and click Reset to Start button', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Go directly to the document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForTimeout(2000);
  console.log('✓ Navigated to document');

  // Find ANY button that contains "Reset to Start" text
  const resetButton = page.locator('button').filter({ hasText: 'Reset to Start' }).first();

  if (await resetButton.count() > 0) {
    console.log('✅ Found button with "Reset to Start" text');

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-reset.png' });

    await resetButton.click();
    console.log('✅ Clicked Reset to Start button');

    // Wait for any dialog or confirmation
    await page.waitForTimeout(2000);

    // Look for confirm button in a dialog
    const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|Reset/ }).first();
    if (await confirmButton.count() > 0) {
      console.log('✅ Found confirmation button');
      await confirmButton.click();
      console.log('✅ Clicked confirm button');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No confirmation dialog found');
    }

    // Take screenshot after reset attempt
    await page.screenshot({ path: 'after-reset.png' });

  } else {
    console.log('❌ No button with "Reset to Start" text found');

    // List all buttons to see what's there
    const allButtons = await page.locator('button').all();
    console.log('\nAll buttons on page:');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      console.log(`  - "${text}"`);
    }
  }
});