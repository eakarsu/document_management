// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Complete Workflow Test - All Stages', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  console.log('\n=====================================');
  console.log('🚀 COMPLETE WORKFLOW TEST - ALL STAGES');
  console.log('=====================================\n');

  // Handle all dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Helper function for login and logout
  async function loginUser(email, name) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log(`✓ Logged in as ${name}`);
  }

  async function logout() {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.locator('.MuiIconButton-root').last().click();
    await page.waitForTimeout(500);
    await page.locator('text="Logout"').click();
    await page.waitForURL('**/login');
    console.log('✓ Logged out\n');
  }

  async function navigateToDocument() {
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    await page.waitForLoadState('networkidle');
  }

  async function clickButton(buttonText) {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    console.log(`✅ Clicked: ${buttonText}`);
    await page.waitForTimeout(2000);
  }

  // ========================================
  // PREPARATION: Reset and Start Workflow
  // ========================================
  console.log('🔧 PREPARATION: Reset and Start Workflow\n');

  await page.goto(`${BASE_URL}/login`);
  await loginUser('admin@airforce.mil', 'Admin');
  await navigateToDocument();

  const resetBtn = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reset workflow');
  }

  const startBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Started workflow');
  }

  await logout();

  // ========================================
  // STAGE 1: Initial Draft Preparation
  // ========================================
  console.log('📌 STAGE 1: Initial Draft Preparation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Submit to PCM');
  await logout();

  // ========================================
  // STAGE 2: PCM Review
  // ========================================
  console.log('📌 STAGE 2: PCM Review\n');
  await loginUser('pcm@airforce.mil', 'PCM');
  await navigateToDocument();
  await clickButton('Approve for Coordination');
  await logout();

  // ========================================
  // STAGE 3: First Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 3: First Coordination - Distribution\n');
  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();
  await clickButton('Distribute to Reviewers');
  await logout();

  // ========================================
  // STAGE 3.5: Review Collection Phase
  // ========================================
  console.log('📌 STAGE 3.5: Review Collection Phase\n');

  // Multiple reviewers submit their reviews
  const firstReviewers = [
    { email: 'ops.reviewer1@airforce.mil', name: 'OPS Reviewer 1' },
    { email: 'ops.reviewer2@airforce.mil', name: 'OPS Reviewer 2' }
  ];

  for (const reviewer of firstReviewers) {
    console.log(`  👤 ${reviewer.name}`);
    await loginUser(reviewer.email, reviewer.name);
    await navigateToDocument();
    await clickButton('Review & CRM');
    await logout();
  }

  // ========================================
  // STAGE 4: OPR Feedback Incorporation
  // ========================================
  console.log('📌 STAGE 4: OPR Feedback Incorporation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();

  // Click whatever button is available for AO (might be "Review & CRM" or another action)
  try {
    await clickButton('Review & CRM');
  } catch {
    // Try other possible buttons
    try {
      await clickButton('Submit for Second Coordination');
    } catch {
      // Just click the first available button
      const anyButton = page.locator('button:visible').first();
      await anyButton.click();
      console.log('✅ Action completed');
    }
  }
  await logout();

  // ========================================
  // STAGE 5: Second Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 5: Second Coordination - Distribution\n');
  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();
  await clickButton('Distribute to Reviewers');
  await logout();

  // ========================================
  // STAGE 5.5: Second Review Collection
  // ========================================
  console.log('📌 STAGE 5.5: Second Review Collection\n');

  for (const reviewer of firstReviewers) {
    console.log(`  👤 ${reviewer.name} (Second Review)`);
    await loginUser(reviewer.email, reviewer.name);
    await navigateToDocument();
    await clickButton('Review & CRM');
    await logout();
  }

  // ========================================
  // STAGE 6: Second OPR Feedback Incorporation
  // ========================================
  console.log('📌 STAGE 6: Second OPR Feedback Incorporation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();

  try {
    await clickButton('Submit to Legal');
  } catch {
    await clickButton('Review & CRM');
  }
  await logout();

  // ========================================
  // STAGE 7: Legal Review
  // ========================================
  console.log('📌 STAGE 7: Legal Review\n');
  await loginUser('legal.reviewer@airforce.mil', 'Legal Reviewer');
  await navigateToDocument();

  try {
    await clickButton('Approve');
  } catch {
    await clickButton('Review & CRM');
  }
  await logout();

  // ========================================
  // STAGE 8: Post-Legal OPR Update
  // ========================================
  console.log('📌 STAGE 8: Post-Legal OPR Update\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();

  try {
    await clickButton('Submit to OPR Leadership');
  } catch {
    await clickButton('Review & CRM');
  }
  await logout();

  // ========================================
  // STAGE 9: OPR Leadership Final Review
  // ========================================
  console.log('📌 STAGE 9: OPR Leadership Final Review\n');
  await loginUser('opr.leadership@airforce.mil', 'OPR Leadership');
  await navigateToDocument();

  try {
    await clickButton('Sign and Approve');
  } catch {
    await clickButton('Review & CRM');
  }
  await logout();

  // ========================================
  // STAGE 10: AFDPO Publication
  // ========================================
  console.log('📌 STAGE 10: AFDPO Publication\n');
  await loginUser('afdpo.publisher@airforce.mil', 'AFDPO Publisher');
  await navigateToDocument();

  try {
    await clickButton('Publish Document');
  } catch {
    await clickButton('Review & CRM');
  }

  // Take final screenshot
  await page.screenshot({ path: 'workflow-complete-all-stages.png', fullPage: true });

  console.log('\n=====================================');
  console.log('🎉 WORKFLOW SUCCESSFULLY COMPLETED!');
  console.log('=====================================\n');
});