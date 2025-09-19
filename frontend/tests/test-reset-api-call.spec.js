// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test if Reset Button Actually Calls API', async ({ page }) => {
  console.log('\n=== TESTING RESET BUTTON API CALL ===\n');

  // Monitor API calls
  let resetApiCalled = false;
  let resetApiResponse = null;

  page.on('request', request => {
    if (request.url().includes('/reset')) {
      console.log('🚀 RESET API CALLED:', request.method(), request.url());
      resetApiCalled = true;
    }
  });

  page.on('response', response => {
    if (response.url().includes('/reset')) {
      resetApiResponse = response.status();
      console.log('📥 RESET API RESPONSE:', response.status());
    }
  });

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document\n');

  // Find reset button
  const resetButton = await page.locator('button.MuiButton-containedError').filter({ hasText: '🔄 Reset to Start' }).first();

  if (await resetButton.count() > 0) {
    console.log('✓ Found Reset button');

    // Check if button is actually clickable
    const isVisible = await resetButton.isVisible();
    const isEnabled = await resetButton.isEnabled();
    const boundingBox = await resetButton.boundingBox();

    console.log(`  Visible: ${isVisible}`);
    console.log(`  Enabled: ${isEnabled}`);
    console.log(`  Position: x=${boundingBox?.x}, y=${boundingBox?.y}`);
    console.log(`  Size: ${boundingBox?.width}x${boundingBox?.height}\n`);

    // Try different click methods
    console.log('METHOD 1: Regular click()');
    await resetButton.click();
    await page.waitForTimeout(2000);

    if (!resetApiCalled) {
      console.log('  ❌ API not called with regular click\n');

      console.log('METHOD 2: Force click');
      await resetButton.click({ force: true });
      await page.waitForTimeout(2000);
    }

    if (!resetApiCalled) {
      console.log('  ❌ API not called with force click\n');

      console.log('METHOD 3: Dispatch click event');
      await resetButton.dispatchEvent('click');
      await page.waitForTimeout(2000);
    }

    if (!resetApiCalled) {
      console.log('  ❌ API not called with dispatchEvent\n');

      console.log('METHOD 4: Evaluate click in browser');
      await resetButton.evaluate(button => button.click());
      await page.waitForTimeout(2000);
    }

    // Check for any dialog that might have appeared
    const dialogs = await page.locator('[role="dialog"], .MuiDialog-root').all();
    console.log(`\nDialogs found: ${dialogs.length}`);

    // Check all buttons on page after click
    const allButtons = await page.locator('button:visible').all();
    console.log(`\nVisible buttons after click attempts:`);
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text?.includes('Confirm') || text?.includes('Yes') || text?.includes('Cancel')) {
        console.log(`  - "${text.trim()}"`);
      }
    }

    // Final check
    if (resetApiCalled) {
      console.log(`\n✅ SUCCESS: Reset API was called! Response: ${resetApiResponse}`);
    } else {
      console.log('\n❌ FAILURE: Reset API was never called');
      console.log('   The button click is not triggering the reset function');

      // Check if there's an onclick handler
      const onclickHandler = await resetButton.evaluate(btn => {
        return btn.onclick ? 'Has onclick' : 'No onclick';
      });
      console.log(`   Button onclick: ${onclickHandler}`);

      // Check event listeners
      const hasListeners = await resetButton.evaluate(btn => {
        const listeners = getEventListeners ? getEventListeners(btn) : null;
        return listeners ? JSON.stringify(Object.keys(listeners)) : 'Cannot check listeners';
      }).catch(() => 'Cannot check listeners');
      console.log(`   Event listeners: ${hasListeners}`);
    }

  } else {
    console.log('❌ Reset button not found');
  }

  // Take screenshot
  await page.screenshot({ path: 'reset-api-test.png' });
  console.log('\n📸 Screenshot saved as reset-api-test.png');
});