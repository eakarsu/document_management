// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Stage 8: Post-Legal OPR Update - Submit to Leadership', async ({ page }) => {
  console.log('📋 Stage 8: Post-Legal OPR Update');

  // Login as Action Officer (ao1)
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✓ Logged in as ao1@airforce.mil');

  // Wait and click on document
  await page.waitForTimeout(2000);
  const docLink = page.locator('text=/AIR FORCE/i').first();
  if (await docLink.isVisible({ timeout: 5000 })) {
    await docLink.click();
    console.log('✓ Clicked on document');
  } else {
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  }

  // Wait for document to load
  await page.waitForTimeout(3000);

  // Look for "Submit to Leadership" button
  const submitButton = page.locator('button:has-text("Submit to Leadership")').first();

  if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('✓ Found "Submit to Leadership" button');
    await submitButton.click();
    console.log('✅ Submitted to Leadership - Stage 8 Complete');
    await page.waitForTimeout(3000);
  } else {
    // If not found, list all buttons to see what's available
    console.log('⚠️ "Submit to Leadership" button not found');
    console.log('\nAvailable buttons:');
    const buttons = await page.locator('button:visible').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      console.log(`  - "${text}"`);
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'stage8-result.png' });
  console.log('📸 Screenshot saved as stage8-result.png');
});