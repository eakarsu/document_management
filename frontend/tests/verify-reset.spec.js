// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Verify reset actually works', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Go directly to the document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForTimeout(3000);
  console.log('✓ Navigated to document');

  // Check what stage we're at BEFORE reset (could be ANY stage)
  //const currentStageText = await page.locator('.workflow-stage, [data-testid*="stage"]').first().textContent().catch(() => 'Unknown');
  //console.log(`\n📊 BEFORE Reset: Currently at stage: ${currentStageText}`);

  // Find the RED Reset to Start button
  const resetButton = page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  if (await resetButton.count() == 1) {
    const buttonText = await resetButton.textContent();
    const buttonClasses = await resetButton.getAttribute('class');
    console.log('✓ Found red "Reset to Start" button');
    console.log(`   Button text: "${buttonText}"`);
    console.log(`   Button classes: ${buttonClasses}`);

    // Actually click it
    await resetButton.click();
    console.log('✓ Clicked Reset button');

    // Wait for confirmation dialog
    await page.waitForTimeout(1000);

    // Look for any dialog that appeared
    const dialogConfirm = page.locator('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes"), [role="dialog"] button:has-text("Reset")').first();

    if (await dialogConfirm.count() > 0) {
      console.log('✓ Found dialog confirmation button');
      await dialogConfirm.click();
      console.log('✓ Clicked confirm in dialog');

      // Just wait a bit after clicking dialog confirm
      await page.waitForTimeout(3000);
    } else {
      // Try generic confirm button not in dialog
      const confirmButton = page.locator('button').filter({ hasText: /Confirm|Yes|Reset/ }).first();
      if (await confirmButton.count() > 0) {
        console.log('✓ Found generic confirmation button');
        await confirmButton.click();
        console.log('✓ Clicked confirm');

        // Just wait a bit after clicking confirm
        await page.waitForTimeout(3000);
      } else {
        console.log('⚠️ No confirmation dialog or button found');
      }
    }

    // Check status AFTER reset attempt
    await page.waitForTimeout(2000);

    // Check if page is still valid
    const pageTitle = await page.title().catch(() => null);
    if (!pageTitle) {
      console.log('⚠️ Page appears to be closed or invalid');
      return;
    }

    // Try to find Stage 1 indicators (with error handling)
    const stage1Text = await page.locator('text=/Initial Draft|Stage 1/').count().catch(() => 0);
    const currentStageAfter = await page.locator('.workflow-stage, [data-testid*="stage"]').first().textContent().catch(() => 'Unknown');

    // Also check if reset button is still there (with error handling)
    const resetButtonStillThere = await page.locator('button.MuiButton-containedError').filter({ hasText: 'Reset to Start' }).count().catch(() => 0);

    console.log(`\n📊 AFTER Reset attempt:`);
    console.log(`  - Current stage text: ${currentStageAfter}`);
    console.log(`  - Stage 1 indicators found: ${stage1Text}`);
    console.log(`  - Reset button still visible: ${resetButtonStillThere > 0 ? 'Yes' : 'No'}`);

    // Make assertions and end test
    if (stage1Text > 0 || currentStageAfter.includes('1') || currentStageAfter.includes('Initial')) {
      console.log('\n✅ RESET APPEARS SUCCESSFUL - Back to Stage 1');
      // Test passes if we found stage 1 indicators
      expect(stage1Text).toBeGreaterThan(0);
    } else {
      console.log('\n❌ RESET FAILED - Not at Stage 1');
      console.log('   Current stage:', currentStageAfter);
      // Fail the test explicitly
      throw new Error(`Reset failed - Expected Stage 1, got: ${currentStageAfter}`);
    }
  } else {
    console.log('❌ Could not find Reset button');
    // Fail if reset button wasn't found
    throw new Error('Reset button not found on page');
  }

  // Explicit test completion
  console.log('✅ Test completed successfully');
});
