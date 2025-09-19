// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

// Helper function for login and navigation
async function loginAndNavigateToDocument(page, email, role) {
  console.log(`\n  📝 Logging in as ${role}: ${email}`);

  // Make sure we're on login page
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  }

  // Clear and fill email
  const emailInput = page.locator('input[type="email"]');
  await emailInput.clear();
  await emailInput.fill(email);

  // Clear and fill password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.clear();
  await passwordInput.fill('testpass123');

  // Click submit
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log(`  ✓ Logged in successfully`);

  // Wait for dashboard to load
  await page.waitForTimeout(2000);

  // Click on the document text (multiple documents may have same name)
  const documentTexts = await page.locator('text=AIR FORCE INSTRUCTION 36-2903').all();

  let clicked = false;
  for (const doc of documentTexts) {
    if (await doc.isVisible()) {
      await doc.click();
      await page.waitForLoadState('networkidle');

      // Check if we're on the right document
      const currentUrl = page.url();
      if (currentUrl.includes(DOCUMENT_ID)) {
        console.log(`  ✓ Clicked on correct document`);
        clicked = true;
        break;
      } else {
        // Wrong document, go back
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(1000);
      }
    }
  }

  if (!clicked) {
    // Fallback: navigate directly
    console.log(`  ⚠️ Could not find correct document, navigating directly`);
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    await page.waitForLoadState('networkidle');
  }

  console.log(`  ✓ On document page`);
}

// Helper to logout
async function logout(page) {
  console.log('  Logging out...');

  // Click on account icon (top right) - use more specific selector
  const accountIcon = page.locator('.MuiIconButton-root').last();

  if (await accountIcon.isVisible()) {
    await accountIcon.click();
    await page.waitForTimeout(500);

    // Click logout option
    const logoutOption = page.locator('text="Logout"').first();
    if (await logoutOption.isVisible()) {
      await logoutOption.click();
      // Wait for redirect to login page
      await page.waitForURL('**/login', { timeout: 5000 });
      console.log('  ✓ Logged out successfully');
    } else {
      console.log('  ❌ Logout option not found');
    }
  } else {
    console.log('  ❌ Account icon not found');
  }
}

test('Complete Workflow Test - All 12 Stages to Publication', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout for full workflow

  console.log('\n=====================================');
  console.log('🚀 COMPLETE WORKFLOW TEST - 12 STAGES');
  console.log('=====================================\n');

  // Handle all dialogs (confirm, alert)
  page.on('dialog', async dialog => {
    console.log(`  📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Monitor API calls
  page.on('response', response => {
    if (response.url().includes('/api/workflow') && response.status() !== 200) {
      console.log(`  ⚠️ API Error: ${response.status()} ${response.url()}`);
    }
  });

  // PREPARATION: Reset workflow if needed
  console.log('🔧 PREPARATION: Resetting workflow to start fresh');
  await loginAndNavigateToDocument(page, 'admin@airforce.mil', 'Admin');

  // Look for reset button with text "Reset to Start" (with or without emoji)
  const resetButton = page.locator('button').filter({ hasText: 'Reset to Start' }).first();
  if (await resetButton.isVisible()) {
    console.log('  Found reset button - clicking to reset workflow');
    await resetButton.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Workflow reset to beginning');
  } else {
    console.log('  No reset button visible - workflow may already be at start');
  }

  // Check if we need to start workflow
  const startWorkflowBtn = page.locator('button:has-text("Start Selected Workflow")').first();
  if (await startWorkflowBtn.isVisible()) {
    await startWorkflowBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Started new workflow');

    // Go back to dashboard before logging out
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    console.log('  ✓ Back to dashboard');
  }

  // Logout admin before proceeding to Stage 1
  await logout(page);

  // ============================================
  // STAGE 1: Initial Draft Preparation
  // ============================================
  console.log('\n📌 STAGE 1: Initial Draft Preparation');
  await loginAndNavigateToDocument(page, 'ao1@airforce.mil', 'Action Officer');

  // Wait for button to be visible and click
  const submitToPCMBtn = page.locator('button:has-text("Submit to PCM")').first();
  await expect(submitToPCMBtn).toBeVisible({ timeout: 10000 });
  await submitToPCMBtn.click();
  console.log('  ✅ Submitted to PCM');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 2: PCM Review (OPR Gatekeeper)
  // ============================================
  console.log('\n📌 STAGE 2: PCM Review');
  await loginAndNavigateToDocument(page, 'pcm@airforce.mil', 'PCM');

  const approveForCoordinationBtn = page.locator('button:has-text("Approve for Coordination")').first();
  await expect(approveForCoordinationBtn).toBeVisible({ timeout: 10000 });
  await approveForCoordinationBtn.click();
  console.log('  ✅ Approved for Coordination');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 3: First Coordination - Distribution
  // ============================================
  console.log('\n📌 STAGE 3: First Coordination - Distribution');
  await loginAndNavigateToDocument(page, 'coordinator1@airforce.mil', 'Coordinator');

  const distributeBtn = page.locator('button:has-text("Distribute for Review")').first();
  await expect(distributeBtn).toBeVisible({ timeout: 10000 });
  await distributeBtn.click();
  console.log('  ✅ Distributed for Review');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 4: Review Collection Phase
  // ============================================
  console.log('\n📌 STAGE 4: Review Collection Phase');
  await loginAndNavigateToDocument(page, 'reviewer1@airforce.mil', 'Reviewer');

  const completeReviewBtn = page.locator('button:has-text("Complete Review")').first();
  await expect(completeReviewBtn).toBeVisible({ timeout: 10000 });
  await completeReviewBtn.click();
  console.log('  ✅ Review Completed');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 5: OPR Feedback Incorporation
  // ============================================
  console.log('\n📌 STAGE 5: OPR Feedback Incorporation');
  await loginAndNavigateToDocument(page, 'opr@airforce.mil', 'OPR');

  const incorporateFeedbackBtn = page.locator('button:has-text("Incorporate Feedback")').first();
  await expect(incorporateFeedbackBtn).toBeVisible({ timeout: 10000 });
  await incorporateFeedbackBtn.click();
  console.log('  ✅ Feedback Incorporated');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 6: Second Coordination - Distribution
  // ============================================
  console.log('\n📌 STAGE 6: Second Coordination - Distribution');
  await loginAndNavigateToDocument(page, 'coordinator1@airforce.mil', 'Coordinator');

  const secondDistributeBtn = page.locator('button:has-text("Distribute for Second Review")').first();
  await expect(secondDistributeBtn).toBeVisible({ timeout: 10000 });
  await secondDistributeBtn.click();
  console.log('  ✅ Distributed for Second Review');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 7: Second Review Collection
  // ============================================
  console.log('\n📌 STAGE 7: Second Review Collection');
  await loginAndNavigateToDocument(page, 'reviewer2@airforce.mil', 'Reviewer');

  const completeSecondReviewBtn = page.locator('button:has-text("Complete Second Review")').first();
  await expect(completeSecondReviewBtn).toBeVisible({ timeout: 10000 });
  await completeSecondReviewBtn.click();
  console.log('  ✅ Second Review Completed');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 8: Second OPR Feedback Incorporation
  // ============================================
  console.log('\n📌 STAGE 8: Second OPR Feedback Incorporation');
  await loginAndNavigateToDocument(page, 'opr@airforce.mil', 'OPR');

  const finalizeDocumentBtn = page.locator('button:has-text("Finalize Document")').first();
  await expect(finalizeDocumentBtn).toBeVisible({ timeout: 10000 });
  await finalizeDocumentBtn.click();
  console.log('  ✅ Document Finalized');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 9: Legal Review & Approval
  // ============================================
  console.log('\n📌 STAGE 9: Legal Review & Approval');
  await loginAndNavigateToDocument(page, 'legal@airforce.mil', 'Legal');

  const approveLegalBtn = page.locator('button:has-text("Approve Legal Review")').first();
  await expect(approveLegalBtn).toBeVisible({ timeout: 10000 });
  await approveLegalBtn.click();
  console.log('  ✅ Legal Review Approved');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 10: Post-Legal OPR Update
  // ============================================
  console.log('\n📌 STAGE 10: Post-Legal OPR Update');
  await loginAndNavigateToDocument(page, 'ao1@airforce.mil', 'Action Officer');

  const submitToLeadershipBtn = page.locator('button:has-text("Submit to Leadership")').first();
  await expect(submitToLeadershipBtn).toBeVisible({ timeout: 10000 });
  await submitToLeadershipBtn.click();
  console.log('  ✅ Submitted to Leadership');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 11: OPR Leadership Final Review
  // ============================================
  console.log('\n📌 STAGE 11: OPR Leadership Final Review');
  await loginAndNavigateToDocument(page, 'leadership@airforce.mil', 'Leadership');

  const signDocumentBtn = page.locator('button:has-text("Sign and Approve")').first();
  await expect(signDocumentBtn).toBeVisible({ timeout: 10000 });
  await signDocumentBtn.click();
  console.log('  ✅ Document Signed and Approved');
  await page.waitForTimeout(2000);
  await logout(page);

  // ============================================
  // STAGE 12: AFDPO Publication
  // ============================================
  console.log('\n📌 STAGE 12: AFDPO Publication');
  await loginAndNavigateToDocument(page, 'admin@airforce.mil', 'Admin');

  const publishBtn = page.locator('button:has-text("Publish Document")').first();
  await expect(publishBtn).toBeVisible({ timeout: 10000 });
  await publishBtn.click();
  console.log('  ✅ Document Published!');
  await page.waitForTimeout(2000);

  // ============================================
  // VERIFICATION
  // ============================================
  console.log('\n🔍 FINAL VERIFICATION');

  // Check for completion indicators
  const pageText = await page.locator('body').textContent();

  const isPublished = pageText.includes('Document Published') ||
                      pageText.includes('Workflow Complete') ||
                      pageText.includes('PUBLISHED');

  const isAtStage12 = pageText.includes('AFDPO Publication') ||
                       pageText.includes('Stage 12');

  console.log(`  Document Published: ${isPublished ? '✅ YES' : '❌ NO'}`);
  console.log(`  At Final Stage: ${isAtStage12 ? '✅ YES' : '❌ NO'}`);

  // Take final screenshot
  await page.screenshot({ path: 'workflow-complete.png', fullPage: true });
  console.log('\n📸 Final screenshot saved as workflow-complete.png');

  // Assert that workflow completed successfully
  expect(isPublished || isAtStage12).toBeTruthy();
  console.log('\n🎉 SUCCESS: Document successfully processed through all 12 stages!');

  console.log('\n=====================================');
  console.log('✅ WORKFLOW TEST COMPLETE');
  console.log('=====================================\n');
});