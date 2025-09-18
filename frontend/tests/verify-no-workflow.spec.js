// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Verify no active workflow after manual reset', async ({ page }) => {
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

  // Check for buttons
  const startWorkflow = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  const submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();
  const resetButton = await page.locator('button').filter({ hasText: '🔄 Reset to Start' }).count();

  console.log('\n=== BUTTON STATUS ===');
  console.log(`  Start Workflow: ${startWorkflow > 0 ? '✅ VISIBLE (no active workflow!)' : '❌ NOT VISIBLE'}`);
  console.log(`  Submit to PCM: ${submitToPCM > 0 ? '❌ VISIBLE (workflow still active!)' : '✅ NOT VISIBLE'}`);
  console.log(`  Reset button: ${resetButton > 0 ? 'YES' : 'NO'}`);

  if (startWorkflow > 0 && submitToPCM === 0) {
    console.log('\n✅ SUCCESS: No active workflow - ready to start new workflow');
  } else {
    console.log('\n❌ FAILED: Workflow appears to still be active');
  }

  // Take screenshot
  await page.screenshot({ path: 'no-workflow-state.png' });
  console.log('\n📸 Screenshot saved as no-workflow-state.png');
});