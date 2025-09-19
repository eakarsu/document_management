// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

// Simple helper to login and navigate
async function loginAndGotoDocument(page, email, role) {
  console.log(`\n  📝 Logging in as ${role}: ${email}`);

  // If not on login page, go there
  if (!page.url().includes('/login')) {
    await page.goto(`${BASE_URL}/login`);
  }

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log(`  ✓ Logged in`);

  // Navigate directly to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log(`  ✓ On document page`);
}

// Simple logout helper
async function logout(page) {
  // Go to dashboard first
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);

  // Click account icon and logout
  const accountIcon = page.locator('.MuiIconButton-root').last();
  await accountIcon.click();
  await page.waitForTimeout(500);

  const logoutBtn = page.locator('text="Logout"').first();
  await logoutBtn.click();
  await page.waitForURL('**/login');
  console.log(`  ✓ Logged out`);
}

test('Complete 12-Stage Workflow', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  console.log('\n🚀 STARTING 12-STAGE WORKFLOW TEST\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`  📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // PREPARATION
  console.log('🔧 PREPARATION');
  await loginAndGotoDocument(page, 'admin@airforce.mil', 'Admin');

  // Reset if needed
  const resetBtn = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Reset workflow');
  }

  // Start workflow
  const startBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Started workflow');
  }

  await logout(page);

  // STAGE 1: Initial Draft
  console.log('\n📌 STAGE 1: Initial Draft Preparation');
  await loginAndGotoDocument(page, 'ao1@airforce.mil', 'Action Officer');

  await page.locator('button:has-text("Submit to PCM")').click();
  console.log('  ✅ Submitted to PCM');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 2: PCM Review
  console.log('\n📌 STAGE 2: PCM Review');
  await loginAndGotoDocument(page, 'pcm@airforce.mil', 'PCM');

  await page.locator('button:has-text("Approve for Coordination")').click();
  console.log('  ✅ Approved for Coordination');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 3: First Coordination
  console.log('\n📌 STAGE 3: First Coordination');
  await loginAndGotoDocument(page, 'coordinator@airforce.mil', 'Coordinator');

  await page.locator('button:has-text("Distribute for Review")').click();
  console.log('  ✅ Distributed for Review');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 4: Review Collection
  console.log('\n📌 STAGE 4: Review Collection');
  await loginAndGotoDocument(page, 'reviewer1@airforce.mil', 'Reviewer');

  await page.locator('button:has-text("Complete Review")').click();
  console.log('  ✅ Review Completed');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 5: OPR Feedback
  console.log('\n📌 STAGE 5: OPR Feedback Incorporation');
  await loginAndGotoDocument(page, 'opr@airforce.mil', 'OPR');

  await page.locator('button:has-text("Incorporate Feedback")').click();
  console.log('  ✅ Feedback Incorporated');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 6: Second Coordination
  console.log('\n📌 STAGE 6: Second Coordination');
  await loginAndGotoDocument(page, 'coordinator@airforce.mil', 'Coordinator');

  await page.locator('button:has-text("Distribute for Second Review")').click();
  console.log('  ✅ Distributed for Second Review');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 7: Second Review
  console.log('\n📌 STAGE 7: Second Review Collection');
  await loginAndGotoDocument(page, 'reviewer2@airforce.mil', 'Reviewer');

  await page.locator('button:has-text("Complete Second Review")').click();
  console.log('  ✅ Second Review Completed');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 8: Second OPR Feedback
  console.log('\n📌 STAGE 8: Second OPR Feedback');
  await loginAndGotoDocument(page, 'opr@airforce.mil', 'OPR');

  await page.locator('button:has-text("Finalize Document")').click();
  console.log('  ✅ Document Finalized');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 9: Legal Review
  console.log('\n📌 STAGE 9: Legal Review');
  await loginAndGotoDocument(page, 'legal@airforce.mil', 'Legal');

  await page.locator('button:has-text("Approve Legal Review")').click();
  console.log('  ✅ Legal Review Approved');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 10: Post-Legal Update
  console.log('\n📌 STAGE 10: Post-Legal OPR Update');
  await loginAndGotoDocument(page, 'ao1@airforce.mil', 'Action Officer');

  await page.locator('button:has-text("Submit to Leadership")').click();
  console.log('  ✅ Submitted to Leadership');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 11: Leadership Review
  console.log('\n📌 STAGE 11: Leadership Final Review');
  await loginAndGotoDocument(page, 'leadership@airforce.mil', 'Leadership');

  await page.locator('button:has-text("Sign and Approve")').click();
  console.log('  ✅ Document Signed and Approved');
  await page.waitForTimeout(2000);

  await logout(page);

  // STAGE 12: Publication
  console.log('\n📌 STAGE 12: AFDPO Publication');
  await loginAndGotoDocument(page, 'admin@airforce.mil', 'Admin');

  await page.locator('button:has-text("Publish Document")').click();
  console.log('  ✅ Document Published!');
  await page.waitForTimeout(2000);

  // Verify completion
  const pageText = await page.locator('body').textContent();
  const isComplete = pageText.includes('Published') || pageText.includes('Complete');

  await page.screenshot({ path: 'workflow-12-stages-complete.png' });

  console.log('\n=====================================');
  console.log('🎉 WORKFLOW TEST COMPLETE!');
  console.log('=====================================\n');

  expect(isComplete).toBeTruthy();
});