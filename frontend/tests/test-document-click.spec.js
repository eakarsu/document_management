// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test Document Click from Dashboard', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== TEST DOCUMENT CLICK ===\n');

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in\n');

  // Wait for dashboard to load
  await page.waitForTimeout(2000);

  // Debug: Show what's on the page
  console.log('Looking for document to click...\n');

  // Click on the document item (it's not in a tr, it's a different structure)
  const documentItem = page.locator('text=AIR FORCE INSTRUCTION 36-2903').first();
  console.log(`Found document item: ${await documentItem.count() > 0}`);

  if (await documentItem.count() > 0) {
    console.log('Clicking on document...');
    await documentItem.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Check if we navigated
    const url = page.url();
    if (url.includes('/documents/')) {
      console.log('✅ SUCCESS: Clicked and navigated to document page');
      console.log(`   URL: ${url}`);
    } else {
      console.log('❌ Click did not navigate');
      console.log(`   Still on: ${url}`);
    }
  } else {
    console.log('❌ Could not find document row');
  }

  await page.screenshot({ path: 'document-click-test.png' });
});