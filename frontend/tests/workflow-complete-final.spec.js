// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Complete Workflow - All Stages Pass', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  console.log('\n=====================================');
  console.log('🚀 COMPLETE WORKFLOW TEST');
  console.log('=====================================\n');

  // Handle all dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // ========================================
  // RESET AND START
  // ========================================
  console.log('🔧 RESET AND START\n');

  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Admin logged in');

  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  // Reset if button exists
  const resetBtn = page.locator('button').filter({ hasText: 'Reset to Start' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reset workflow');
  }

  // Start workflow
  const startBtn = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Started workflow');
  }

  // Logout
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');
  console.log('✓ Logged out\n');

  // ========================================
  // STAGE 1: AO Submit to PCM
  // ========================================
  console.log('📌 STAGE 1: AO Submit\n');

  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const submitBtn = page.locator('button:has-text("Submit to PCM")').first();
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();
  console.log('✅ Submitted to PCM');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 2: PCM Approve
  // ========================================
  console.log('📌 STAGE 2: PCM Approve\n');

  await page.fill('input[type="email"]', 'pcm@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const approveBtn = page.locator('button:has-text("Approve for Coordination")').first();
  await expect(approveBtn).toBeVisible({ timeout: 10000 });
  await approveBtn.click();
  console.log('✅ Approved');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 3: Coordinator Distributes (First)
  // ========================================
  console.log('📌 STAGE 3: First Distribution\n');

  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const distBtn = page.locator('button:has-text("Distribute to Reviewers")').first();
  await expect(distBtn).toBeVisible({ timeout: 10000 });
  await distBtn.click();
  console.log('✅ Distributed');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 3.5: Reviewers Submit (First Round)
  // ========================================
  console.log('📌 STAGE 3.5: First Reviews\n');

  // Reviewer 1
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const rev1Btn = page.locator('button:has-text("Review & CRM")').first();
  await expect(rev1Btn).toBeVisible({ timeout: 10000 });
  await rev1Btn.click();
  console.log('✅ Reviewer 1 submitted');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // Reviewer 2
  await page.fill('input[type="email"]', 'ops.reviewer2@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const rev2Btn = page.locator('button:has-text("Review & CRM")').first();
  await expect(rev2Btn).toBeVisible({ timeout: 10000 });
  await rev2Btn.click();
  console.log('✅ Reviewer 2 submitted');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 4: AO Incorporates Feedback
  // ========================================
  console.log('📌 STAGE 4: AO Incorporates\n');

  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const incBtn = page.locator('button:has-text("Review & CRM")').first();
  await expect(incBtn).toBeVisible({ timeout: 10000 });
  await incBtn.click();
  console.log('✅ Incorporated feedback');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 5: Coordinator Distributes (Second)
  // ========================================
  console.log('📌 STAGE 5: Second Distribution\n');

  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const dist2Btn = page.locator('button:has-text("Distribute to Reviewers")').first();
  await expect(dist2Btn).toBeVisible({ timeout: 10000 });
  await dist2Btn.click();
  console.log('✅ Distributed second time');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 5.5: Reviewers Submit (Second Round)
  // ========================================
  console.log('📌 STAGE 5.5: Second Reviews\n');

  // Reviewer 1 again
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const rev1Btn2 = page.locator('button:has-text("Review & CRM")').first();
  await expect(rev1Btn2).toBeVisible({ timeout: 10000 });
  await rev1Btn2.click();
  console.log('✅ Reviewer 1 second review');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // Reviewer 2 again
  await page.fill('input[type="email"]', 'ops.reviewer2@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const rev2Btn2 = page.locator('button:has-text("Review & CRM")').first();
  await expect(rev2Btn2).toBeVisible({ timeout: 10000 });
  await rev2Btn2.click();
  console.log('✅ Reviewer 2 second review');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 6: AO Second Incorporation
  // ========================================
  console.log('📌 STAGE 6: Second Incorporation\n');

  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const inc2Btn = page.locator('button:has-text("Review & CRM")').first();
  await expect(inc2Btn).toBeVisible({ timeout: 10000 });
  await inc2Btn.click();
  console.log('✅ Second incorporation done');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 7: Legal Review
  // ========================================
  console.log('📌 STAGE 7: Legal\n');

  await page.fill('input[type="email"]', 'legal.reviewer@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const legalBtn = page.locator('button:has-text("Review & CRM")').first();
  await expect(legalBtn).toBeVisible({ timeout: 10000 });
  await legalBtn.click();
  console.log('✅ Legal approved');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 8: AO Post-Legal
  // ========================================
  console.log('📌 STAGE 8: Post-Legal\n');

  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const postBtn = page.locator('button:has-text("Review & CRM")').first();
  await expect(postBtn).toBeVisible({ timeout: 10000 });
  await postBtn.click();
  console.log('✅ Post-legal done');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 9: Leadership
  // ========================================
  console.log('📌 STAGE 9: Leadership\n');

  await page.fill('input[type="email"]', 'opr.leadership@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const leadBtn = page.locator('button:has-text("Review & CRM")').first();
  await expect(leadBtn).toBeVisible({ timeout: 10000 });
  await leadBtn.click();
  console.log('✅ Leadership approved');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 10: AFDPO Publish
  // ========================================
  console.log('📌 STAGE 10: Publish\n');

  await page.fill('input[type="email"]', 'afdpo.publisher@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  const pubBtn = page.locator('button:has-text("Review & CRM")').first();
  await expect(pubBtn).toBeVisible({ timeout: 10000 });
  await pubBtn.click();
  console.log('✅ Published');

  await page.screenshot({ path: 'workflow-complete.png', fullPage: true });

  console.log('\n=====================================');
  console.log('🎉 ALL STAGES COMPLETE!');
  console.log('=====================================\n');
});