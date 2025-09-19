// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// Try common variations
const possibleUsers = [
  // OPR variations
  { email: 'opr1@airforce.mil', name: 'OPR1' },
  { email: 'opr.user@airforce.mil', name: 'OPR User' },
  { email: 'opr.lead@airforce.mil', name: 'OPR Lead' },

  // Legal variations
  { email: 'legal1@airforce.mil', name: 'Legal1' },
  { email: 'legal.reviewer@airforce.mil', name: 'Legal Reviewer' },
  { email: 'legal.user@airforce.mil', name: 'Legal User' },
  { email: 'jag1@airforce.mil', name: 'JAG1' },

  // Leadership variations
  { email: 'leadership1@airforce.mil', name: 'Leadership1' },
  { email: 'leader1@airforce.mil', name: 'Leader1' },
  { email: 'commander1@airforce.mil', name: 'Commander1' },
  { email: 'director1@airforce.mil', name: 'Director1' },
];

test('Find OPR, Legal, Leadership Users', async ({ page }) => {
  test.setTimeout(60000);

  console.log('\n=== FINDING OPR, LEGAL, LEADERSHIP USERS ===\n');

  for (const user of possibleUsers) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard', { timeout: 3000 });
      console.log(`✅ FOUND: ${user.email} - ${user.name}`);

      // Logout
      const accountIcon = page.locator('.MuiIconButton-root').last();
      await accountIcon.click();
      await page.waitForTimeout(500);
      await page.locator('text="Logout"').click();
      await page.waitForURL('**/login', { timeout: 3000 });
    } catch (error) {
      // Login failed, skip
    }
  }

  console.log('\n=== SEARCH COMPLETE ===\n');
});