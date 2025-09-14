/**
 * MANUAL TEST SCRIPT FOR STAGE 8 WORKFLOW COMPLETION
 *
 * This script helps you manually test that Stage 8 shows the published completion screen
 * instead of the "Start Selected Workflow" screen for all user types.
 */

const { test, expect } = require('@playwright/test');

test('Manual Stage 8 Test - Quick verification', async ({ page }) => {
  console.log('🚀 Quick Stage 8 Manual Test');

  // 1. Login as OPR
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'opr@demo.mil');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✅ Logged in as OPR');

  // 2. Go to any document
  await page.goto('http://localhost:3000/documents/test-doc-1');
  await page.waitForLoadState('networkidle');

  // 3. Check current stage
  const currentStage = await page.locator('[class*="workflow"], [class*="stage"]').first().textContent();
  console.log(`📍 Current stage: ${currentStage}`);

  // 4. If not at Stage 8, manually advance (this is for testing purposes)
  // In real scenario, you would go through all stages

  // 5. Force move to Stage 8 for testing (you can do this via API call)
  console.log('🔧 For manual testing, ensure document is at Stage 8 ("AFDPO Publish")');

  // Wait a moment for any page updates
  await page.waitForTimeout(2000);

  // 6. MAIN TEST: Check if Stage 8 shows completion screen
  const isStage8 = await page.locator('text="AFDPO Publish"').isVisible();

  if (isStage8) {
    console.log('🎯 Document is at Stage 8 - Testing completion screen...');

    // Should see published completion screen
    const hasPublishedScreen = await page.locator('text="✅ Document Published"').isVisible();
    const hasCompleteStatus = await page.locator('text="🎉 Published & Complete"').isVisible();
    const hasStartWorkflow = await page.locator('text="Start Selected Workflow"').isVisible();

    console.log(`✅ Shows "Document Published": ${hasPublishedScreen}`);
    console.log(`✅ Shows "Published & Complete": ${hasCompleteStatus}`);
    console.log(`❌ Shows "Start Selected Workflow": ${hasStartWorkflow} (should be false)`);

    if (hasPublishedScreen && hasCompleteStatus && !hasStartWorkflow) {
      console.log('🎉 SUCCESS: Stage 8 shows correct completion screen!');
    } else {
      console.log('❌ FAILURE: Stage 8 not showing correct completion screen');
    }
  } else {
    console.log('⚠️  Document not at Stage 8 - move it to Stage 8 first');
  }

  // Take a screenshot for verification
  await page.screenshot({ path: 'stage8-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved as stage8-test-result.png');
});

/**
 * MANUAL STEPS TO TEST:
 *
 * 1. Run: npx playwright test test-stage8-manual.js --headed
 * 2. Or follow these steps manually:
 *
 * LOGIN FLOW:
 * a) Go to http://localhost:3000/login
 * b) Login as: opr@demo.mil / password123
 * c) Go to any document
 * d) Start workflow if needed
 * e) Move through stages 1-7 by clicking buttons
 * f) At Stage 7, click "Send to AFDPO"
 * g) Verify Stage 8 shows green completion screen, not "Start Selected Workflow"
 *
 * TEST DIFFERENT USERS:
 * h) Logout, login as: technical@demo.mil / password123
 * i) Go to same document - should still see completion screen
 * j) Logout, login as: legal@demo.mil / password123
 * k) Go to same document - should still see completion screen
 *
 * EXPECTED RESULTS AT STAGE 8:
 * ✅ Green card with "✅ Document Published"
 * ✅ Text "🎉 Published & Complete"
 * ✅ Message about successful publication to AFDPO
 * ❌ NO "Start Selected Workflow" button
 * ✅ Progress shows 100% or Step 8 of 8
 */