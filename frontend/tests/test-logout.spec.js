// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test('Test Logout Functionality', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== TEST LOGOUT ===\n');

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin\n');

  // Try to logout
  console.log('Looking for logout option...');

  // Method 1: Look for account/user icon (usually in top right)
  const accountIcon = page.locator('button[aria-label*="account"], button[aria-label*="user"], .MuiIconButton-root').last();

  if (await accountIcon.isVisible()) {
    console.log('Found account icon - clicking...');
    await accountIcon.click();
    await page.waitForTimeout(500);

    // Look for logout option in dropdown
    const logoutOption = page.locator('text="Logout"').first();
    if (await logoutOption.isVisible()) {
      console.log('Found Logout option - clicking...');
      await logoutOption.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('❌ No Logout option found in dropdown');
    }
  } else {
    console.log('❌ No account icon found');

    // Method 2: Look for direct logout button
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      console.log('Found direct Logout button - clicking...');
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Check if we're logged out
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.log('✅ SUCCESS: Logged out (redirected to login page)');
  } else if (currentUrl.includes('/dashboard')) {
    console.log('❌ FAILED: Still on dashboard');
  } else {
    console.log(`⚠️ On unexpected page: ${currentUrl}`);
  }

  await page.screenshot({ path: 'logout-test.png' });
});