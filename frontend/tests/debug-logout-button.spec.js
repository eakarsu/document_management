// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test('Debug Logout Button', async ({ page }) => {
  test.setTimeout(30000);

  console.log('\n=== DEBUG LOGOUT BUTTON ===\n');

  // Login first
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in\n');

  // Go back to dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  console.log('On dashboard page\n');

  // Debug: Find ALL icon buttons
  console.log('=== LOOKING FOR ICON BUTTONS ===');
  const iconButtons = await page.locator('button').all();
  console.log(`Found ${iconButtons.length} total buttons\n`);

  // Look specifically for MUI icon buttons
  const muiIconButtons = await page.locator('.MuiIconButton-root').all();
  console.log(`Found ${muiIconButtons.length} MUI icon buttons:`);

  for (let i = 0; i < muiIconButtons.length; i++) {
    const btn = muiIconButtons[i];
    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    const isVisible = await btn.isVisible();
    console.log(`  Button ${i + 1}:`);
    console.log(`    - Aria-label: ${ariaLabel || 'none'}`);
    console.log(`    - Title: ${title || 'none'}`);
    console.log(`    - Visible: ${isVisible}`);

    // Check if it has an svg/icon inside
    const svg = btn.locator('svg');
    if (await svg.count() > 0) {
      console.log(`    - Has SVG icon`);
    }
  }

  console.log('\n=== TRYING TO CLICK LAST ICON BUTTON ===');
  const lastIconBtn = page.locator('.MuiIconButton-root').last();

  if (await lastIconBtn.isVisible()) {
    console.log('Clicking last icon button...');
    await lastIconBtn.click();
    await page.waitForTimeout(1000);

    // Look for dropdown/menu items
    console.log('\n=== LOOKING FOR DROPDOWN ITEMS ===');

    // Check for MUI Menu items
    const menuItems = await page.locator('.MuiMenuItem-root, [role="menuitem"]').all();
    console.log(`Found ${menuItems.length} menu items:`);

    for (const item of menuItems) {
      const text = await item.textContent();
      console.log(`  - "${text?.trim()}"`);
    }

    // Look specifically for logout
    const logoutOptions = [
      'text="Logout"',
      'text="Log out"',
      'text="Sign out"',
      'text="Signout"',
      '[role="menuitem"]:has-text("Logout")',
      '.MuiMenuItem-root:has-text("Logout")'
    ];

    console.log('\n=== SEARCHING FOR LOGOUT ===');
    for (const selector of logoutOptions) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`✅ Found with selector: ${selector}`);
        if (await element.isVisible()) {
          console.log('   And it\'s visible! Clicking...');
          await element.click();
          await page.waitForTimeout(2000);

          // Check if logged out
          const url = page.url();
          if (url.includes('/login')) {
            console.log('   ✅ Successfully logged out!');
          } else {
            console.log(`   Still on: ${url}`);
          }
          break;
        } else {
          console.log('   But it\'s not visible');
        }
      }
    }
  } else {
    console.log('❌ Last icon button not visible');
  }

  // Take screenshot
  await page.screenshot({ path: 'debug-logout.png', fullPage: true });
  console.log('\n📸 Screenshot saved');
});