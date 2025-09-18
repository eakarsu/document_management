// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test('Test if admin@airforce.mil can login', async ({ page }) => {
  // Try to login as admin@airforce.mil
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');

  // Check if login succeeded
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ admin@airforce.mil login SUCCESSFUL');
  } catch (error) {
    console.log('❌ admin@airforce.mil login FAILED');

    // Check if we're still on login page
    if (page.url().includes('/login')) {
      console.log('   Still on login page - credentials are wrong');
    }
  }
});