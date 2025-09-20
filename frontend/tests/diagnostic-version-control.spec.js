// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3001';

test.describe('Diagnostic Version Control Test', () => {
  test.setTimeout(30000);

  test('Diagnose what is actually rendered', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC TEST\n');

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

    // Get all text content to see what's rendered
    console.log('\n📋 Page Content Analysis:\n');

    // Check for main headings
    const h1Elements = await page.locator('h1').allTextContents();
    const h2Elements = await page.locator('h2').allTextContents();
    const h3Elements = await page.locator('h3').allTextContents();
    const h4Elements = await page.locator('h4').allTextContents();
    const h5Elements = await page.locator('h5').allTextContents();
    const h6Elements = await page.locator('h6').allTextContents();

    console.log('H1 elements:', h1Elements);
    console.log('H2 elements:', h2Elements);
    console.log('H3 elements:', h3Elements);
    console.log('H4 elements:', h4Elements);
    console.log('H5 elements:', h5Elements);
    console.log('H6 elements:', h6Elements);

    // Check for tabs
    console.log('\n🗂️ Looking for Tabs:\n');
    const tabElements = await page.locator('[role="tab"]').allTextContents();
    console.log('Tab elements:', tabElements);

    const tabButtons = await page.locator('button').allTextContents();
    console.log('All buttons:', tabButtons.slice(0, 10)); // First 10 buttons

    // Check for MUI components
    console.log('\n🎨 MUI Components:\n');
    const muiTabs = await page.locator('.MuiTabs-root').count();
    const muiTabPanels = await page.locator('.MuiTabPanel-root').count();
    const muiCards = await page.locator('.MuiCard-root').count();
    const muiPapers = await page.locator('.MuiPaper-root').count();

    console.log(`MUI Tabs: ${muiTabs}`);
    console.log(`MUI Tab Panels: ${muiTabPanels}`);
    console.log(`MUI Cards: ${muiCards}`);
    console.log(`MUI Papers: ${muiPapers}`);

    // Check for specific text patterns
    console.log('\n🔍 Specific Text Patterns:\n');
    const versionText = await page.locator('text=/version/i').count();
    const pendingText = await page.locator('text=/pending/i').count();
    const conflictText = await page.locator('text=/conflict/i').count();
    const appliedText = await page.locator('text=/applied/i').count();
    const feedbackText = await page.locator('text=/feedback/i').count();

    console.log(`"Version" occurrences: ${versionText}`);
    console.log(`"Pending" occurrences: ${pendingText}`);
    console.log(`"Conflict" occurrences: ${conflictText}`);
    console.log(`"Applied" occurrences: ${appliedText}`);
    console.log(`"Feedback" occurrences: ${feedbackText}`);

    // Check for data attributes
    console.log('\n🏷️ Data Attributes:\n');
    const dataTestIds = await page.locator('[data-testid]').evaluateAll((elements) =>
      elements.map(el => el.getAttribute('data-testid'))
    );
    console.log('Data-testid elements:', dataTestIds.slice(0, 10));

    // Check for feedback items
    console.log('\n📝 Feedback Items:\n');
    const feedbackItems = await page.locator('[class*="feedback"]').count();
    console.log(`Elements with "feedback" in class: ${feedbackItems}`);

    // Take screenshot
    await page.screenshot({ path: 'diagnostic-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: diagnostic-result.png');

    // Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:', consoleErrors);
    }

    console.log('\n✅ Diagnostic Complete!\n');
  });
});