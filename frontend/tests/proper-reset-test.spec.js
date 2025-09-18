// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Properly test reset button with correct waiting', async ({ page }) => {
  // First, ensure we have a workflow to reset
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document');

  // Start a workflow if there isn't one
  const startBtn = page.locator('button').filter({ hasText: /Start.*Workflow/i }).first();
  if (await startBtn.count() > 0) {
    console.log('Starting workflow first...');
    await startBtn.click();
    await page.waitForTimeout(2000);

    // Handle workflow selection dialog if it appears
    const selectBtn = page.locator('button').filter({ hasText: /Select|Hierarchical/i }).first();
    if (await selectBtn.count() > 0) {
      await selectBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Now we should have an active workflow - verify
  let submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();
  if (submitToPCM > 0) {
    console.log('✓ Workflow is active (Submit to PCM visible)');
  }

  // Now click Reset button
  console.log('\n=== PERFORMING RESET ===');
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  if (await resetButton.count() > 0) {
    console.log('✓ Found Reset button');

    // Monitor console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('  🔴 Console Error:', msg.text());
      }
    });

    // Monitor network requests
    const resetPromise = page.waitForResponse(response =>
      response.url().includes('reset'),
      { timeout: 5000 }
    ).catch(() => null);

    // Click reset
    await resetButton.click();
    console.log('✓ Clicked Reset button');

    // Wait for confirmation dialog
    await page.waitForTimeout(500);

    // Find and click confirmation - try multiple selectors
    const confirmBtn = await page.locator('button').filter({ hasText: /Confirm|Yes|OK|Reset/i }).last();
    if (await confirmBtn.count() > 0) {
      console.log('✓ Found confirmation button');
      await confirmBtn.click();
      console.log('✓ Clicked confirmation');

      // Check if reset API was called
      const resetResponse = await resetPromise;
      if (resetResponse) {
        console.log(`✓ Reset API called: ${resetResponse.status()}`);
        const responseBody = await resetResponse.json();
        console.log('  API Response:', JSON.stringify(responseBody, null, 2));
      } else {
        console.log('❌ Reset API was NOT called!');
      }

      // IMPORTANT: Wait for the page to update after reset
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      console.log('✓ Page updated after reset');
    } else {
      console.log('⚠️ No confirmation dialog found');
    }
  } else {
    console.log('❌ Reset button not found');
  }

  // Check final state after reset
  console.log('\n=== FINAL STATE ===');
  const startWorkflowAfter = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  const submitToPCMAfter = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();

  console.log(`  Start Workflow button: ${startWorkflowAfter > 0 ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
  console.log(`  Submit to PCM button: ${submitToPCMAfter > 0 ? '❌ STILL VISIBLE' : '✅ NOT VISIBLE'}`);

  if (startWorkflowAfter > 0 && submitToPCMAfter === 0) {
    console.log('\n✅ RESET SUCCESSFUL - Workflow removed!');
  } else if (submitToPCMAfter > 0) {
    console.log('\n❌ RESET FAILED - Workflow still active');

    // Check database to see what really happened
    const dbCheck = await page.evaluate(async (docId) => {
      const response = await fetch(`/api/workflow-instances/${docId}/status`);
      return await response.json();
    }, DOCUMENT_ID);
    console.log('\nDatabase state:', JSON.stringify(dbCheck, null, 2));
  }
});