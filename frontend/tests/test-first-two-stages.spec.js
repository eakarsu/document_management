// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Test First Two Workflow Stages', async ({ page }) => {
  test.setTimeout(120000);

  console.log('\n=== TEST FIRST TWO STAGES ===\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    } else if (dialog.type() === 'alert') {
      await dialog.dismiss();
    }
  });

  // PREPARATION: Login as admin and reset/start workflow
  console.log('PREPARATION: Setting up workflow\n');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ On document page');

  // Reset if needed
  const resetButton = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetButton.isVisible()) {
    await resetButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reset workflow');
  }

  // Start workflow
  const startButton = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startButton.isVisible()) {
    await startButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Started workflow');
  }

  // Go back to dashboard to logout
  await page.goto(`${BASE_URL}/dashboard`);
  console.log('✓ Back to dashboard');

  // Logout
  const accountIcon = page.locator('.MuiIconButton-root').last();
  await accountIcon.click();
  await page.waitForTimeout(500);
  const logoutOption = page.locator('text="Logout"').first();
  await logoutOption.click();
  await page.waitForURL('**/login');
  console.log('✓ Logged out\n');

  // ============================
  // STAGE 1: Action Officer
  // ============================
  console.log('STAGE 1: Action Officer\n');

  // Login as AO1
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as AO1');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ On document page');

  // Submit to PCM
  const submitBtn = page.locator('button:has-text("Submit to PCM")').first();
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();
  console.log('✅ Submitted to PCM');
  await page.waitForTimeout(2000);

  // Go back and logout
  await page.goto(`${BASE_URL}/dashboard`);
  const accountIcon2 = page.locator('.MuiIconButton-root').last();
  await accountIcon2.click();
  await page.waitForTimeout(500);
  const logoutOption2 = page.locator('text="Logout"').first();
  await logoutOption2.click();
  await page.waitForURL('**/login');
  console.log('✓ Logged out\n');

  // ============================
  // STAGE 2: PCM Review
  // ============================
  console.log('STAGE 2: PCM Review\n');

  // Login as PCM
  await page.fill('input[type="email"]', 'pcm@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as PCM');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ On document page');

  // Approve for Coordination
  const approveBtn = page.locator('button:has-text("Approve for Coordination")').first();
  await expect(approveBtn).toBeVisible({ timeout: 10000 });
  await approveBtn.click();
  console.log('✅ Approved for Coordination');
  await page.waitForTimeout(2000);

  console.log('\n🎉 SUCCESSFULLY COMPLETED FIRST TWO STAGES!');
});