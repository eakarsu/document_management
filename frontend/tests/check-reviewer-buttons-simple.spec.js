// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Quick Check OPS Reviewer Buttons', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== CHECKING OPS.REVIEWER1 BUTTONS ===\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Login as ops.reviewer1
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as ops.reviewer1@airforce.mil');

  // Navigate directly to document (assuming workflow is already at stage 4)
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

  // Check for any task-related elements
  console.log('\nChecking for task elements:');

  // Check for task cards or sections
  const taskCards = await page.locator('[class*="task"], [class*="Task"]').all();
  console.log(`Found ${taskCards.length} task elements`);

  // Check for any review-related text
  const pageText = await page.locator('body').textContent();

  console.log('\nPage contains:');
  if (pageText.includes('Review')) console.log('  - "Review" text found');
  if (pageText.includes('Complete')) console.log('  - "Complete" text found');
  if (pageText.includes('Submit')) console.log('  - "Submit" text found');
  if (pageText.includes('Feedback')) console.log('  - "Feedback" text found');
  if (pageText.includes('Task')) console.log('  - "Task" text found');

  // Look for reviewer task components
  const reviewerComponents = await page.locator('[data-testid*="reviewer"], [class*="reviewer"], [id*="reviewer"]').all();
  console.log(`\nFound ${reviewerComponents.length} reviewer-specific components`);

  // Take screenshot
  await page.screenshot({ path: 'ops-reviewer-current-view.png', fullPage: true });
  console.log('\n📸 Screenshot saved as ops-reviewer-current-view.png');
});