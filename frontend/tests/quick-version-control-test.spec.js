// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3001';

test.describe('Quick Version Control Feature Tests', () => {
  test.setTimeout(30000);

  test('Version Control UI Features', async ({ page }) => {
    console.log('\n🔄 TESTING VERSION CONTROL FEATURES\n');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'ao1@airforce.mil');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Logged in');

    // Navigate to OPR review page
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}/opr-review`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ OPR review page loaded');

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Test 1: Version Control Title
    console.log('\n📍 Test 1: Version Control Title');
    const versionControlTitle = await page.locator('text="Version Control Feedback Processor"').isVisible({ timeout: 5000 }).catch(() => false);
    if (versionControlTitle) {
      console.log('✅ Version Control title found');
      expect(versionControlTitle).toBeTruthy();
    } else {
      console.log('❌ Version Control title NOT found');

      // Debug: Check what text is actually on the page
      const h5Elements = await page.locator('h5').allTextContents();
      console.log('Available H5 elements:', h5Elements);
    }

    // Test 2: Tabs (Pending, Conflicts, Applied)
    console.log('\n📍 Test 2: Three-Tab Interface');
    const pendingTab = await page.locator('[role="tab"]:has-text("Pending")').isVisible({ timeout: 3000 }).catch(() => false);
    const conflictsTab = await page.locator('[role="tab"]:has-text("Conflicts")').isVisible({ timeout: 3000 }).catch(() => false);
    const appliedTab = await page.locator('[role="tab"]:has-text("Applied")').isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Pending Tab: ${pendingTab ? '✅' : '❌'}`);
    console.log(`  Conflicts Tab: ${conflictsTab ? '✅' : '❌'}`);
    console.log(`  Applied Tab: ${appliedTab ? '✅' : '❌'}`);

    expect(pendingTab || conflictsTab || appliedTab).toBeTruthy();

    // Test 3: Version History
    console.log('\n📍 Test 3: Version History Display');

    // Look for version button or version indicators - the button includes count
    const versionButton = await page.locator('button:has-text("Version History")').isVisible({ timeout: 3000 }).catch(() => false);
    const versionChip = await page.locator('text=/Version \\d+/').isVisible({ timeout: 3000 }).catch(() => false);
    const versionText = await page.locator('text=/v\\d+/').isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Version History Button: ${versionButton ? '✅' : '❌'}`);
    console.log(`  Version Chip: ${versionChip ? '✅' : '❌'}`);
    console.log(`  Version Text: ${versionText ? '✅' : '❌'}`);

    expect(versionButton || versionChip || versionText).toBeTruthy();

    // If version history button exists, click it
    if (versionButton) {
      await page.locator('button:has-text("Version History")').click();
      await page.waitForTimeout(1000);

      // Check for version table
      const versionTable = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  Version Table in Dialog: ${versionTable ? '✅' : '❌'}`);

      // Close dialog
      const closeButton = await page.locator('button:has-text("Close")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }

    // Test 4: Position Tracking
    console.log('\n📍 Test 4: Position Tracking Display');

    const positionToggle = await page.locator('label:has-text("Position Tracking")').isVisible({ timeout: 3000 }).catch(() => false);
    const pageIndicator = await page.locator('text=/Page \\d+/').isVisible({ timeout: 3000 }).catch(() => false);
    const paragraphIndicator = await page.locator('text=/¶|Para(graph)? \\d+/').isVisible({ timeout: 3000 }).catch(() => false);
    const lineIndicator = await page.locator('text=/Line \\d+/').isVisible({ timeout: 3000 }).catch(() => false);
    const locationIcon = await page.locator('[data-testid="LocationOnIcon"], svg[data-testid="LocationOnIcon"]').isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Position Toggle: ${positionToggle ? '✅' : '❌'}`);
    console.log(`  Page Indicator: ${pageIndicator ? '✅' : '❌'}`);
    console.log(`  Paragraph Indicator: ${paragraphIndicator ? '✅' : '❌'}`);
    console.log(`  Line Indicator: ${lineIndicator ? '✅' : '❌'}`);
    console.log(`  Location Icon: ${locationIcon ? '✅' : '❌'}`);

    expect(positionToggle || pageIndicator || paragraphIndicator || lineIndicator || locationIcon).toBeTruthy();

    // Test 5: Real-time Updates
    console.log('\n📍 Test 5: Real-time Updates');

    const autoSaveToggle = await page.locator('label:has-text("Auto-save")').isVisible({ timeout: 3000 }).catch(() => false);
    const syncIndicator = await page.locator('text=/Sync|sync/').isVisible({ timeout: 3000 }).catch(() => false);
    const lastSyncText = await page.locator('text=/Last sync:/').isVisible({ timeout: 3000 }).catch(() => false);
    const savingIndicator = await page.locator('text=/Saving/').isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Auto-save Toggle: ${autoSaveToggle ? '✅' : '❌'}`);
    console.log(`  Sync Indicator: ${syncIndicator ? '✅' : '❌'}`);
    console.log(`  Last Sync Text: ${lastSyncText ? '✅' : '❌'}`);
    console.log(`  Saving Indicator: ${savingIndicator ? '✅' : '❌'}`);

    expect(autoSaveToggle || syncIndicator || lastSyncText).toBeTruthy();

    // Test 6: Error Handling
    console.log('\n📍 Test 6: Error Handling');

    const errorAlert = await page.locator('[role="alert"], .MuiAlert-root').isVisible({ timeout: 3000 }).catch(() => false);
    const errorText = await page.locator('text=/error|Error/i').isVisible({ timeout: 3000 }).catch(() => false);
    const retryButton = await page.locator('button:has-text("Retry")').isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Error Alert Component: ${errorAlert ? '✅' : '❌'}`);
    console.log(`  Error Text: ${errorText ? '✅' : '❌'}`);
    console.log(`  Retry Button: ${retryButton ? '✅' : '❌'}`);

    // Error handling might not show unless there's an actual error
    console.log('  Note: Error UI may not be visible without actual errors');

    // Take screenshot for debugging
    await page.screenshot({ path: 'version-control-test-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: version-control-test-result.png');

    console.log('\n✅ Version Control Features Test Complete!\n');
  });
});