// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

const users = [
  { email: 'admin@airforce.mil', name: 'Admin' },
  { email: 'ao1@airforce.mil', name: 'Action Officer 1' },
  { email: 'pcm@airforce.mil', name: 'PCM' },
  { email: 'coordinator1@airforce.mil', name: 'Coordinator 1' },
  { email: 'ops.reviewer1@airforce.mil', name: 'OPS Reviewer 1' },
  { email: 'opr.leadership@airforce.mil', name: 'OPR Leadership' },
  { email: 'ops.reviewer2@airforce.mil', name: 'OPS Reviewer 2' },
  { email: 'legal.reviewer@airforce.mil', name: 'Legal Reviewer' },
  { email: 'afdpo.publisher@airforce.mil', name: 'AFDPO Publisher' },
];

test('Verify All Workflow Users Can Login', async ({ page }) => {
  test.setTimeout(120000);

  console.log('\n=== VERIFYING ALL WORKFLOW USERS ===\n');
  let allSuccess = true;

  for (const user of users) {
    console.log(`Testing ${user.name} (${user.email})...`);

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log(`  ✅ ${user.name} - LOGIN SUCCESS`);

      // Logout
      const accountIcon = page.locator('.MuiIconButton-root').last();
      await accountIcon.click();
      await page.waitForTimeout(500);
      await page.locator('text="Logout"').click();
      await page.waitForURL('**/login', { timeout: 5000 });
    } catch (error) {
      console.log(`  ❌ ${user.name} - LOGIN FAILED`);
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log('\n🎉 ALL USERS CAN LOGIN SUCCESSFULLY!');
  } else {
    console.log('\n⚠️ Some users failed to login');
  }

  console.log('\n=== TEST COMPLETE ===\n');
  expect(allSuccess).toBeTruthy();
});