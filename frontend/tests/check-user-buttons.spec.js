// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Check Coordinator1 Buttons', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== CHECK COORDINATOR1 BUTTONS ===\n');

  // Login as coordinator1
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✓ Logged in as coordinator1@airforce.mil');

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

  // Check page text for stage info
  const pageText = await page.locator('body').textContent();

  console.log('\nPage contains:');
  if (pageText.includes('First Coordination')) console.log('  - First Coordination');
  if (pageText.includes('Second Coordination')) console.log('  - Second Coordination');
  if (pageText.includes('Review Collection')) console.log('  - Review Collection');
  if (pageText.includes('Distribute')) console.log('  - Distribute (in text)');

  // Take screenshot
  await page.screenshot({ path: 'coordinator-buttons.png', fullPage: true });
  console.log('\n📸 Screenshot saved as coordinator-buttons.png');
});