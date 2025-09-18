// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Full reset test - start workflow then reset', async ({ page }) => {
  // Step 1: Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Step 2: Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document');

  // Step 3: Check initial state
  const initialState = await page.locator('body').textContent();
  console.log('Initial state check:');
  if (initialState.includes('Document Published') || initialState.includes('Workflow Complete')) {
    console.log('  - Document appears to be in completed state');
  } else if (initialState.includes('Initial Draft')) {
    console.log('  - Document is at Initial Draft stage');
  }

  // Step 4: Look for Start Workflow button (if no active workflow)
  const startButton = page.locator('button').filter({ hasText: /Start.*Workflow/i }).first();
  if (await startButton.count() > 0) {
    console.log('✓ Found Start Workflow button - starting workflow');
    await startButton.click();
    await page.waitForTimeout(2000);

    // Select workflow if dialog appears
    const selectButton = page.locator('button').filter({ hasText: /Select|Start/i }).first();
    if (await selectButton.count() > 0) {
      await selectButton.click();
      await page.waitForTimeout(2000);
    }
  } else {
    console.log('  No Start Workflow button - workflow may already be active');
  }

  // Step 5: Now find and click Reset button
  await page.waitForTimeout(2000);
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  if (await resetButton.count() > 0) {
    console.log('✓ Found Reset button');
    await resetButton.click();
    console.log('✓ Clicked Reset button');

    // Handle confirmation
    await page.waitForTimeout(1000);
    const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|Reset/i }).last();
    if (await confirmButton.count() > 0) {
      console.log('✓ Found confirmation button');
      await confirmButton.click();
      console.log('✓ Clicked confirmation');

      // Wait for reset to complete
      await page.waitForTimeout(3000);

      // Check final state
      const finalState = await page.locator('body').textContent();
      if (finalState.includes('Initial Draft') || finalState.includes('Stage 1')) {
        console.log('✅ SUCCESS: Workflow reset to Initial Draft/Stage 1');
      } else if (finalState.includes('Start') && finalState.includes('Workflow')) {
        console.log('✅ SUCCESS: Workflow reset - Start Workflow button visible');
      } else {
        console.log('⚠️ Reset completed but unclear state');
      }
    }
  } else {
    console.log('❌ Reset button not found');

    // List all visible buttons for debugging
    const buttons = await page.locator('button:visible').all();
    console.log('\\nVisible buttons:');
    for (const btn of buttons.slice(0, 10)) {
      const text = await btn.textContent();
      if (text) console.log(`  - "${text.trim()}"`);
    }
  }
});