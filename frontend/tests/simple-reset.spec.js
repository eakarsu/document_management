// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Simple reset button test', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Go directly to the document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document');

  // Find the RED Reset to Start button
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  // Check if button exists
  const buttonExists = await resetButton.count() > 0;
  expect(buttonExists).toBe(true);
  console.log('✓ Found Reset button');

  // Click reset button
  await resetButton.click();
  console.log('✓ Clicked Reset button');

  // Wait a bit for any dialog
  await page.waitForTimeout(1000);

  // Try to find and click confirm - don't fail if not found
  const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|Reset/ }).first();
  if (await confirmButton.count() > 0) {
    await confirmButton.click();
    console.log('✓ Clicked confirmation');
  }

  // Wait a moment for the action to complete
  await page.waitForTimeout(2000);

  // Check if we can find any Stage 1 text
  const stage1Found = await page.locator('text=/Initial Draft|Stage 1/').count() > 0;

  // Pass test if we found stage 1
  expect(stage1Found).toBe(true);
  console.log('✅ Reset successful - Stage 1 found');
});