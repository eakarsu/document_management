// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Check OPS Reviewer 1 Buttons at Stage 4', async ({ page }) => {
  test.setTimeout(60000);

  console.log('\n=== SETUP: GET TO STAGE 4 ===\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Reset as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Click document in dashboard
  const docLink = page.locator(`a[href="/documents/${DOCUMENT_ID}"]`).first();
  await docLink.click();
  await page.waitForLoadState('networkidle');

  // Reset and start
  const resetBtn = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(2000);
  }

  const startBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(2000);
  }

  // Logout
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // STAGE 1: AO1 submits
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  const doc1 = page.locator(`a[href="/documents/${DOCUMENT_ID}"]`).first();
  await doc1.click();
  await page.waitForLoadState('networkidle');

  await page.locator('button:has-text("Submit to PCM")').first().click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // STAGE 2: PCM approves
  await page.fill('input[type="email"]', 'pcm@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  const doc2 = page.locator(`a[href="/documents/${DOCUMENT_ID}"]`).first();
  await doc2.click();
  await page.waitForLoadState('networkidle');

  await page.locator('button:has-text("Approve for Coordination")').first().click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // STAGE 3: Coordinator distributes
  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  const doc3 = page.locator(`a[href="/documents/${DOCUMENT_ID}"]`).first();
  await doc3.click();
  await page.waitForLoadState('networkidle');

  await page.locator('button:has-text("Distribute to Reviewers")').first().click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  console.log('\n=== NOW CHECKING OPS.REVIEWER1 BUTTONS ===\n');

  // Login as ops.reviewer1
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as ops.reviewer1@airforce.mil');

  // Click document
  const doc4 = page.locator(`a[href="/documents/${DOCUMENT_ID}"]`).first();
  await doc4.click();
  await page.waitForLoadState('networkidle');
  console.log('✓ On document page\n');

  // List all visible buttons
  console.log('Available buttons:');
  const buttons = await page.locator('button:visible').all();

  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text?.trim()) {
      console.log(`  - "${text.trim()}"`);
    }
  }

  // Check page text for stage info
  const pageText = await page.locator('body').textContent();

  console.log('\nPage contains:');
  if (pageText.includes('Review Collection')) console.log('  - Review Collection');
  if (pageText.includes('Stage 4')) console.log('  - Stage 4');
  if (pageText.includes('Complete')) console.log('  - Complete (in text)');
  if (pageText.includes('Review')) console.log('  - Review (in text)');
  if (pageText.includes('Submit')) console.log('  - Submit (in text)');

  // Take screenshot
  await page.screenshot({ path: 'reviewer-buttons-stage4.png', fullPage: true });
  console.log('\n📸 Screenshot saved as reviewer-buttons-stage4.png');
});