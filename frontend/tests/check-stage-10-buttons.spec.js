// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Check Stage 10 Buttons', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== CHECK STAGE 10 BUTTONS ===\n');

  // Login as ao1 (assuming workflow is at stage 10)
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as ao1@airforce.mil');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ On document page\n');

  // List all visible buttons
  console.log('Available buttons:');
  const buttons = await page.locator('button:visible').all();

  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text?.trim()) {
      console.log(`  - "${text.trim()}"`);
    }
  }

  // Check page text
  const pageText = await page.locator('body').textContent();

  console.log('\nPage contains:');
  if (pageText.includes('Stage 10')) console.log('  - "Stage 10" text found');
  if (pageText.includes('Post-Legal')) console.log('  - "Post-Legal" text found');
  if (pageText.includes('Submit')) console.log('  - "Submit" text found');
  if (pageText.includes('Leadership')) console.log('  - "Leadership" text found');
  if (pageText.includes('Review')) console.log('  - "Review" text found');

  // Take screenshot
  await page.screenshot({ path: 'stage-10-buttons.png', fullPage: true });
  console.log('\n📸 Screenshot saved as stage-10-buttons.png');
});