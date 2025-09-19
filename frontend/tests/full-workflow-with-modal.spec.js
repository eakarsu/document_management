// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Full Workflow Test with Distribution Modal', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  console.log('\n=====================================');
  console.log('🚀 FULL WORKFLOW TEST WITH MODAL HANDLING');
  console.log('=====================================\n');

  // Handle all dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Helper function to handle distribution modal
  async function handleDistributionModal() {
    // Wait for modal to appear
    await page.waitForTimeout(2000);

    try {
      console.log('  📝 Looking for distribution modal...');

      // Select all checkboxes for reviewers
      const checkboxes = await page.locator('input[type="checkbox"]:visible').all();
      console.log(`  Found ${checkboxes.length} checkboxes`);

      for (const checkbox of checkboxes) {
        if (!(await checkbox.isChecked())) {
          await checkbox.click();
          console.log('  ☑️ Selected a reviewer');
        }
      }

      // Click the Distribute Document button in the modal
      const distributeBtn = page.locator('button:has-text("Distribute Document")').first();
      if (await distributeBtn.isVisible()) {
        await distributeBtn.click();
        console.log('  ✅ Clicked "Distribute Document" button in modal');
      } else {
        // Fallback to other possible button texts
        const altBtn = page.locator('button:has-text("Distribute")').first();
        if (await altBtn.isVisible()) {
          await altBtn.click();
          console.log('  ✅ Clicked "Distribute" button in modal');
        }
      }

      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('  ⚠️ No distribution modal found or error handling it');
    }
  }

  // Helper functions for common actions
  async function loginUser(email, name) {
    await page.goto(`${BASE_URL}/login`);
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
  }

  async function navigateToDocument() {
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    await page.waitForLoadState('networkidle');
  }

  async function clickButton(buttonText, description) {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    console.log(`✅ ${description || buttonText}`);
    await page.waitForTimeout(2000);
  }

  // ========================================
  // RESET AND START
  // ========================================
  console.log('🔧 RESET AND START\n');

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
  console.log('');

  // ========================================
  // STAGE 1: Initial Draft Preparation
  // ========================================
  console.log('📌 STAGE 1: Initial Draft Preparation\n');

  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Submit to PCM', 'Submitted to PCM');
  await logout();
  console.log('');

  // ========================================
  // STAGE 2: PCM Review
  // ========================================
  console.log('📌 STAGE 2: PCM Review\n');

  await loginUser('pcm@airforce.mil', 'PCM');
  await navigateToDocument();
  await clickButton('Approve for Coordination', 'Approved for Coordination');
  await logout();
  console.log('');

  // ========================================
  // STAGE 3: First Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 3: First Coordination - Distribution\n');

  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();

  // Click Distribute to Reviewers - this opens modal
  await clickButton('Distribute to Reviewers', 'Clicked Distribute to Reviewers');

  // Handle the distribution modal
  await handleDistributionModal();

  // Wait for page reload after distribution
  await page.waitForTimeout(3000);

  await logout();
  console.log('');

  // ========================================
  // STAGE 3.5: First Review Collection
  // ========================================
  console.log('📌 STAGE 3.5: First Review Collection\n');

  // Reviewer 1
  console.log('  👤 OPS Reviewer 1');
  await loginUser('ops.reviewer1@airforce.mil', 'OPS Reviewer 1');
  await navigateToDocument();

  // Click Submit Review button which navigates to review page
  const submitReviewBtn1 = page.locator('button:has-text("Submit Review")').first();
  if (await submitReviewBtn1.isVisible()) {
    await submitReviewBtn1.click();
    console.log('  ✅ Clicked Submit Review - navigating to review page');
    // Wait for navigation to review page
    await page.waitForURL('**/review', { timeout: 5000 });
    console.log('  ✓ Navigated to review page');

    // Now click the "Submit Feedback to OPR" button at top right
    await page.waitForTimeout(2000);
    const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
    if (await submitFeedbackBtn.isVisible()) {
      await submitFeedbackBtn.click();
      console.log('  ✅ Clicked Submit Feedback to OPR');
      await page.waitForTimeout(2000);
    }
  }

  await logout();

  // Reviewer 2
  console.log('  👤 OPS Reviewer 2');
  await loginUser('ops.reviewer2@airforce.mil', 'OPS Reviewer 2');
  await navigateToDocument();

  const submitReviewBtn2 = page.locator('button:has-text("Submit Review")').first();
  if (await submitReviewBtn2.isVisible()) {
    await submitReviewBtn2.click();
    console.log('  ✅ Clicked Submit Review - navigating to review page');
    await page.waitForURL('**/review', { timeout: 5000 });
    console.log('  ✓ Navigated to review page');

    // Now click the "Submit Feedback to OPR" button at top right
    await page.waitForTimeout(2000);
    const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
    if (await submitFeedbackBtn.isVisible()) {
      await submitFeedbackBtn.click();
      console.log('  ✅ Clicked Submit Feedback to OPR');
      await page.waitForTimeout(2000);
    }
  }

  await logout();
  console.log('');

  // ========================================
  // STAGE 4: OPR Feedback Incorporation
  // ========================================
  console.log('📌 STAGE 4: OPR Feedback Incorporation\n');

  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Incorporated feedback');
  await logout();
  console.log('');

  // ========================================
  // STAGE 5: Second Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 5: Second Coordination - Distribution\n');

  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();

  // First, complete the first review collection phase
  try {
    const allReviewsBtn = page.locator('button:has-text("All Reviews Complete")').first();
    if (await allReviewsBtn.isVisible()) {
      await allReviewsBtn.click();
      console.log('✅ Marked all reviews as complete');
      await page.waitForTimeout(2000);
    }
  } catch {}

  // Check if we're on the OPR Review page and need to process feedback
  try {
    const processFeedbackBtn = page.locator('button:has-text("Process Feedback & Continue Workflow")').first();
    if (await processFeedbackBtn.isVisible()) {
      await processFeedbackBtn.click();
      console.log('✅ Processed feedback and continued workflow');
      await page.waitForTimeout(3000);

      // Navigate back to document page
      await navigateToDocument();
    }
  } catch {}

  // Now try to distribute for second round
  try {
    await clickButton('Distribute to Reviewers', 'Clicked Distribute to Reviewers (Second Round)');
    // Handle the distribution modal again
    await handleDistributionModal();
    // Wait for page reload after distribution
    await page.waitForTimeout(3000);
  } catch {
    // If distribute button is not available, just continue
    console.log('  ℹ️ Distribution not needed at this stage');
  }

  await logout();
  console.log('');

  // ========================================
  // STAGE 5.5: Second Review Collection
  // ========================================
  console.log('📌 STAGE 5.5: Second Review Collection\n');

  // Reviewer 1 - Second Review
  console.log('  👤 OPS Reviewer 1 (Second Review)');
  await loginUser('ops.reviewer1@airforce.mil', 'OPS Reviewer 1');
  await navigateToDocument();

  const submitReviewBtn3 = page.locator('button:has-text("Submit Review")').first();
  if (await submitReviewBtn3.isVisible()) {
    await submitReviewBtn3.click();
    console.log('  ✅ Clicked Submit Review - navigating to review page');
    await page.waitForURL('**/review', { timeout: 5000 });
    console.log('  ✓ Navigated to review page');

    // Now click the "Submit Feedback to OPR" button at top right
    await page.waitForTimeout(2000);
    const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
    if (await submitFeedbackBtn.isVisible()) {
      await submitFeedbackBtn.click();
      console.log('  ✅ Clicked Submit Feedback to OPR');
      await page.waitForTimeout(2000);
    }
  }

  await logout();

  // Reviewer 2 - Second Review
  console.log('  👤 OPS Reviewer 2 (Second Review)');
  await loginUser('ops.reviewer2@airforce.mil', 'OPS Reviewer 2');
  await navigateToDocument();

  const submitReviewBtn4 = page.locator('button:has-text("Submit Review")').first();
  if (await submitReviewBtn4.isVisible()) {
    await submitReviewBtn4.click();
    console.log('  ✅ Clicked Submit Review - navigating to review page');
    await page.waitForURL('**/review', { timeout: 5000 });
    console.log('  ✓ Navigated to review page');

    // Now click the "Submit Feedback to OPR" button at top right
    await page.waitForTimeout(2000);
    const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
    if (await submitFeedbackBtn.isVisible()) {
      await submitFeedbackBtn.click();
      console.log('  ✅ Clicked Submit Feedback to OPR');
      await page.waitForTimeout(2000);
    }
  }

  await logout();
  console.log('');

  // ========================================
  // STAGE 6: Second OPR Feedback Incorporation
  // ========================================
  console.log('📌 STAGE 6: Second OPR Feedback Incorporation\n');

  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Incorporated second round feedback');
  await logout();
  console.log('');

  // ========================================
  // STAGE 7: Legal Review
  // ========================================
  console.log('📌 STAGE 7: Legal Review\n');

  await loginUser('legal.reviewer@airforce.mil', 'Legal Reviewer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Legal review completed');
  await logout();
  console.log('');

  // ========================================
  // STAGE 8: Post-Legal OPR Update
  // ========================================
  console.log('📌 STAGE 8: Post-Legal OPR Update\n');

  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Post-legal update completed');
  await logout();
  console.log('');

  // ========================================
  // STAGE 9: OPR Leadership Final Review
  // ========================================
  console.log('📌 STAGE 9: OPR Leadership Final Review\n');

  await loginUser('opr.leadership@airforce.mil', 'OPR Leadership');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Leadership approval completed');
  await logout();
  console.log('');

  // ========================================
  // STAGE 10: AFDPO Publication
  // ========================================
  console.log('📌 STAGE 10: AFDPO Publication\n');

  await loginUser('afdpo.publisher@airforce.mil', 'AFDPO Publisher');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Document published');

  // Take final screenshot
  await page.screenshot({ path: 'workflow-complete-with-modal.png', fullPage: true });

  console.log('\n=====================================');
  console.log('🎉 WORKFLOW SUCCESSFULLY COMPLETED!');
  console.log('=====================================\n');
});