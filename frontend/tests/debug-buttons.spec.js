// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Debug: Find buttons for Stage 1', async ({ page }) => {
  // Login as ao1
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✓ Logged in');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Click on document
  const docLink = page.locator('text=/AIR FORCE/i').first();
  if (await docLink.isVisible({ timeout: 5000 })) {
    await docLink.click();
    console.log('✓ Clicked on document');
  } else {
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    console.log('✓ Navigated directly to document');
  }

  // Wait for document to load
  await page.waitForTimeout(3000);

  // Now list ALL buttons
  console.log('\n📋 ALL BUTTONS ON DOCUMENT PAGE:');
  const buttons = await page.locator('button').all();

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();

    if (isVisible) {
      console.log(`Button ${i}: "${text}"`);
    }
  }

  // Look for workflow section
  console.log('\n🔍 LOOKING FOR WORKFLOW SECTION:');
  const workflowSection = page.locator('[data-testid*="workflow"], .workflow-display, #workflow');
  if (await workflowSection.count() > 0) {
    console.log('Found workflow section');

    // Get buttons inside workflow section
    const workflowButtons = await workflowSection.locator('button').all();
    console.log(`\n📋 BUTTONS IN WORKFLOW SECTION (${workflowButtons.length} buttons):`);
    for (const btn of workflowButtons) {
      const text = await btn.textContent();
      console.log(`  - "${text}"`);
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'stage1-buttons.png' });
  console.log('\n📸 Screenshot saved as stage1-buttons.png');
});