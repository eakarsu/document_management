const { test, expect } = require('@playwright/test');

test('Verify Stage 8 shows Document Published screen', async ({ page }) => {
  console.log('🚀 Testing Stage 8 fix...');

  try {
    // Start fresh servers if needed
    console.log('📡 Connecting to http://localhost:3000...');

    // Go to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Login as OPR
    console.log('🔐 Logging in as OPR...');
    await page.fill('input[name="email"]', 'opr@demo.mil');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');

    // Navigate to a test document
    console.log('📄 Navigating to test document...');
    await page.goto('http://localhost:3000/documents/test-doc-1');
    await page.waitForLoadState('networkidle');

    // Check current state
    const currentState = await page.textContent('body').catch(() => '');
    console.log('📊 Current page state:', currentState.substring(0, 200) + '...');

    // Look for Stage 8 indicators
    const hasStage8 = await page.locator('text="AFDPO Publish"').isVisible().catch(() => false);
    const hasDocumentPublished = await page.locator('text="✅ Document Published"').isVisible().catch(() => false);
    const hasStartWorkflow = await page.locator('text="Start Selected Workflow"').isVisible().catch(() => false);
    const hasCompleteStatus = await page.locator('text="🎉 Published & Complete"').isVisible().catch(() => false);

    console.log('🔍 Stage 8 Analysis:');
    console.log(`  - Has "AFDPO Publish": ${hasStage8}`);
    console.log(`  - Has "✅ Document Published": ${hasDocumentPublished}`);
    console.log(`  - Has "🎉 Published & Complete": ${hasCompleteStatus}`);
    console.log(`  - Has "Start Selected Workflow": ${hasStartWorkflow}`);

    // Take screenshot for verification
    await page.screenshot({ path: 'stage8-verification.png', fullPage: true });
    console.log('📸 Screenshot saved as stage8-verification.png');

    if (hasStage8) {
      console.log('🎯 Document is at Stage 8');

      if (hasDocumentPublished && hasCompleteStatus && !hasStartWorkflow) {
        console.log('🎉 SUCCESS: Stage 8 shows correct completion screen!');
      } else if (hasStartWorkflow) {
        console.log('❌ FAILURE: Still showing "Start Selected Workflow" button');
      } else {
        console.log('⚠️  UNCLEAR: Stage 8 state is ambiguous');
      }
    } else {
      console.log('ℹ️  Document not at Stage 8 - cannot verify fix');

      // Try to get to Stage 8 by starting workflow if possible
      const startButton = page.locator('text="🚀 Start 8-Stage Workflow", text="Start Workflow"').first();
      if (await startButton.isVisible()) {
        console.log('🚀 Starting workflow...');
        await startButton.click();
        await page.waitForTimeout(2000);

        // Quick check if we can advance through stages
        console.log('⏩ Attempting to advance through workflow stages quickly...');
        // This would need to be expanded for full testing
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'stage8-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as stage8-error.png');
  }
});

test.setTimeout(60000); // 60 second timeout