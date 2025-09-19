// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

// Helper functions shared across all tests
async function loginUser(page, email, name) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log(`✓ Logged in as ${name}`);
}

async function logout(page) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');
  console.log('✓ Logged out');
}

async function navigateToDocument(page) {
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
}

async function handleDistributionModal(page) {
  await page.waitForTimeout(2000);
  try {
    console.log('  📝 Looking for distribution modal...');
    const checkboxes = await page.locator('input[type="checkbox"]:visible').all();
    console.log(`  Found ${checkboxes.length} checkboxes`);

    for (const checkbox of checkboxes) {
      if (!(await checkbox.isChecked())) {
        await checkbox.click();
        console.log('  ☑️ Selected a reviewer');
      }
    }

    const distributeBtn = page.locator('button:has-text("Distribute Document")').first();
    if (await distributeBtn.isVisible()) {
      await distributeBtn.click();
      console.log('  ✅ Clicked "Distribute Document" button in modal');
    }
    await page.waitForTimeout(3000); // Wait for page reload
  } catch (error) {
    console.log('  ⚠️ Error handling distribution modal');
  }
}

// Run tests in serial mode to ensure proper workflow progression
test.describe.serial('12-Stage Workflow Tests', () => {

  // Handle dialogs in all tests
  test.beforeEach(async ({ page }) => {
    page.on('dialog', async dialog => {
      console.log(`📋 Dialog: "${dialog.message()}"`);
      await dialog.accept();
    });
  });

  // STAGE 0: Reset and Initialize
  test('Stage 0: Reset and Initialize Workflow', async ({ page }) => {
    console.log('\n🔧 STAGE 0: Reset and Initialize\n');

    await loginUser(page, 'admin@airforce.mil', 'Admin');
    await navigateToDocument(page);

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

    await logout(page);
  });

  // STAGE 1: Initial Draft Preparation
  test('Stage 1: Initial Draft Preparation - AO to PCM', async ({ page }) => {
    console.log('\n📌 STAGE 1: Initial Draft Preparation\n');

    await loginUser(page, 'ao1@airforce.mil', 'Action Officer');
    await navigateToDocument(page);

    await page.locator('button:has-text("Submit to PCM")').first().click();
    console.log('✅ Submitted to PCM');
    await page.waitForTimeout(2000);

    await logout(page);
  });

  // STAGE 2: PCM Review
  test('Stage 2: PCM Review and Approval', async ({ page }) => {
    console.log('\n📌 STAGE 2: PCM Review\n');

    await loginUser(page, 'pcm@airforce.mil', 'PCM');
    await navigateToDocument(page);

    await page.locator('button:has-text("Approve for Coordination")').first().click();
    console.log('✅ Approved for Coordination');
    await page.waitForTimeout(2000);

    await logout(page);
  });

  // STAGE 3: First Coordination Distribution
  test('Stage 3: First Coordination - Distribute to Reviewers', async ({ page }) => {
    console.log('\n📌 STAGE 3: First Coordination - Distribution\n');

    await loginUser(page, 'coordinator1@airforce.mil', 'Coordinator');
    await navigateToDocument(page);

    await page.locator('button:has-text("Distribute to Reviewers")').first().click();
    console.log('✅ Clicked Distribute to Reviewers');

    await handleDistributionModal(page);
    await logout(page);
  });

  // STAGE 3.5: First Review Collection - Reviewer 1
  test('Stage 3.5a: First Review Collection - Reviewer 1', async ({ page }) => {
    console.log('\n📌 STAGE 3.5a: First Review - Reviewer 1\n');

    await loginUser(page, 'ops.reviewer1@airforce.mil', 'OPS Reviewer 1');
    await navigateToDocument(page);

    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('✅ Clicked Submit Review');

      // Wait for navigation to review page
      await page.waitForTimeout(2000);
      if (page.url().includes('/review')) {
        const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
        if (await submitFeedbackBtn.isVisible()) {
          await submitFeedbackBtn.click();
          console.log('✅ Submitted Feedback to OPR');
        }
      }
    }

    await logout(page);
  });

  // STAGE 3.5: First Review Collection - Reviewer 2
  test('Stage 3.5b: First Review Collection - Reviewer 2', async ({ page }) => {
    console.log('\n📌 STAGE 3.5b: First Review - Reviewer 2\n');

    await loginUser(page, 'ops.reviewer2@airforce.mil', 'OPS Reviewer 2');
    await navigateToDocument(page);

    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('✅ Clicked Submit Review');

      await page.waitForTimeout(2000);
      if (page.url().includes('/review')) {
        const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
        if (await submitFeedbackBtn.isVisible()) {
          await submitFeedbackBtn.click();
          console.log('✅ Submitted Feedback to OPR');
        }
      }
    }

    await logout(page);
  });

  // STAGE 4: OPR Feedback Incorporation
  test('Stage 4: OPR Feedback Incorporation', async ({ page }) => {
    console.log('\n📌 STAGE 4: OPR Feedback Incorporation\n');

    await loginUser(page, 'ao1@airforce.mil', 'Action Officer');
    await navigateToDocument(page);

    await page.locator('button:has-text("Review & CRM")').first().click();
    console.log('✅ Incorporated feedback');
    await page.waitForTimeout(2000);

    await logout(page);
  });

  // STAGE 5: Complete First Reviews and Submit for Second Coordination
  test('Stage 5: Complete First Reviews & Submit Second Coordination', async ({ page }) => {
    console.log('\n📌 STAGE 5: Process Reviews & Second Coordination\n');

    // Coordinator completes first review cycle
    await loginUser(page, 'coordinator1@airforce.mil', 'Coordinator');
    await navigateToDocument(page);

    await page.locator('button:has-text("All Reviews Complete")').first().click();
    console.log('✅ Clicked All Reviews Complete');

    // Wait for navigation to OPR review page
    await page.waitForURL('**/opr-review', { timeout: 5000 });
    console.log('📋 Navigated to OPR review page');
    await page.waitForTimeout(2000);

    // Process feedback
    const processFeedbackBtn = page.locator('button:has-text("Process Feedback & Continue Workflow")').first();
    await processFeedbackBtn.click();
    console.log('✅ Processed feedback');
    await page.waitForTimeout(3000);

    await logout(page);

    // AO submits for second coordination
    await loginUser(page, 'ao1@airforce.mil', 'Action Officer');
    await navigateToDocument(page);

    await page.locator('button:has-text("Submit for Second Coordination")').first().click();
    console.log('✅ Submitted for Second Coordination');
    await page.waitForTimeout(2000);

    await logout(page);
  });

  // STAGE 6: Second Coordination Distribution
  test('Stage 6: Second Coordination - Distribute Draft', async ({ page }) => {
    console.log('\n📌 STAGE 6: Second Coordination - Distribution\n');

    await loginUser(page, 'coordinator1@airforce.mil', 'Coordinator');
    await navigateToDocument(page);

    await page.locator('button:has-text("Distribute Draft to Reviewers")').first().click();
    console.log('✅ Clicked Distribute Draft to Reviewers');

    await handleDistributionModal(page);
    await logout(page);
  });

  // STAGE 6.5: Second Review Collection - Reviewer 1
  test('Stage 6.5a: Second Review Collection - Reviewer 1', async ({ page }) => {
    console.log('\n📌 STAGE 6.5a: Second Review - Reviewer 1\n');

    await loginUser(page, 'ops.reviewer1@airforce.mil', 'OPS Reviewer 1');
    await navigateToDocument(page);

    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('✅ Clicked Submit Review');

      await page.waitForTimeout(2000);
      if (page.url().includes('/review')) {
        const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
        if (await submitFeedbackBtn.isVisible()) {
          await submitFeedbackBtn.click();
          console.log('✅ Submitted Feedback to OPR');
        }
      }
    }

    await logout(page);
  });

  // STAGE 6.5: Second Review Collection - Reviewer 2
  test('Stage 6.5b: Second Review Collection - Reviewer 2', async ({ page }) => {
    console.log('\n📌 STAGE 6.5b: Second Review - Reviewer 2\n');

    await loginUser(page, 'ops.reviewer2@airforce.mil', 'OPS Reviewer 2');
    await navigateToDocument(page);

    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('✅ Clicked Submit Review');

      await page.waitForTimeout(2000);
      if (page.url().includes('/review')) {
        const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
        if (await submitFeedbackBtn.isVisible()) {
          await submitFeedbackBtn.click();
          console.log('✅ Submitted Feedback to OPR');
        }
      }
    }

    await logout(page);
  });

  // STAGE 7: Complete Second Review Collection
  test('Stage 7: Complete Second Review Collection', async ({ page }) => {
    console.log('\n📌 STAGE 7: Complete Second Review Collection\n');

    await loginUser(page, 'coordinator1@airforce.mil', 'Coordinator');
    await navigateToDocument(page);

    await page.locator('button:has-text("All Draft Reviews Complete")').first().click();
    console.log('✅ Clicked All Draft Reviews Complete');

    // Wait for navigation to OPR review page
    await page.waitForURL('**/opr-review', { timeout: 5000 });
    console.log('📋 Navigated to OPR review page');
    await page.waitForTimeout(2000);

    // Process feedback
    const processFeedbackBtn = page.locator('button:has-text("Process Feedback & Continue Workflow")').first();
    await processFeedbackBtn.click();
    console.log('✅ Processed feedback and continued workflow');
    await page.waitForTimeout(3000);

    await logout(page);

    console.log('\n=====================================');
    console.log('✅ ALL 12 WORKFLOW STAGES COMPLETE!');
    console.log('=====================================\n');
  });
});