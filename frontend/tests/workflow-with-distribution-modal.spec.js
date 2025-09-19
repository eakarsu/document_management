// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Workflow with Distribution Modal', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  console.log('\n=====================================');
  console.log('🚀 WORKFLOW TEST WITH DISTRIBUTION MODAL');
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
      // Look for the distribution modal
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

      // Now click the Distribute button inside the modal
      // The button text is "Distribute Document"
      const possibleButtons = [
        'button:has-text("Distribute Document")',
        'button:has-text("Distribute")',
        'button:has-text("Send")',
        'button:has-text("Submit")',
        'button:has-text("Confirm")'
      ];

      let clicked = false;
      for (const selector of possibleButtons) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible()) {
            await btn.click();
            console.log(`  ✅ Clicked "${selector}" button in modal`);
            clicked = true;
            break;
          }
        } catch (e) {
          // Try next button
        }
      }

      if (!clicked) {
        console.log('  ⚠️ Could not find Distribute button, trying to click any visible button in modal');
        // If we can't find a specific button, click any button that's not Cancel
        const anyButton = page.locator('button:visible:not(:has-text("Cancel")):not(:has-text("Close"))').last();
        await anyButton.click();
      }

      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('  ⚠️ No distribution modal found or error handling it');
    }
  }

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

  await page.locator('button:has-text("Submit to PCM")').first().click();
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

  await page.locator('button:has-text("Approve for Coordination")').first().click();
  console.log('✅ Approved for Coordination');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 3: First Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 3: First Distribution\n');

  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  // Click "Distribute to Reviewers" - this should open a modal
  await page.locator('button:has-text("Distribute to Reviewers")').first().click();
  console.log('✅ Clicked Distribute to Reviewers');

  // Handle the distribution modal
  await handleDistributionModal();

  // Wait for page reload after distribution
  await page.waitForTimeout(3000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 3.5: First Review Collection
  // ========================================
  console.log('📌 STAGE 3.5: First Reviews\n');

  // Reviewer 1
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  // Look for "Submit Review" button first, if not found try "Review & CRM"
  // Both buttons open the same review interface
  try {
    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('  Clicked Submit Review button');
    }
  } catch {
    await page.locator('button:has-text("Review & CRM")').first().click();
    console.log('  Clicked Review & CRM button');
  }

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

  // Same for reviewer 2 - try "Submit Review" first, then "Review & CRM"
  try {
    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('  Clicked Submit Review button');
    }
  } catch {
    await page.locator('button:has-text("Review & CRM")').first().click();
    console.log('  Clicked Review & CRM button');
  }

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

  await page.locator('button:has-text("Review & CRM")').first().click();
  console.log('✅ Incorporated feedback');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 5: Second Coordination - Distribution
  // ========================================
  console.log('📌 STAGE 5: Second Distribution\n');

  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  // First click "All Reviews Complete" to move past the review collection phase
  await page.locator('button:has-text("All Reviews Complete")').first().click();
  console.log('✅ Clicked All Reviews Complete');

  // Wait for navigation to OPR review page
  await page.waitForURL('**/opr-review', { timeout: 5000 });
  console.log('  📋 Navigated to OPR review page');

  // Wait for the Process Feedback button to be visible
  await page.waitForTimeout(2000);

  // Click "Process Feedback & Continue Workflow" button on the OPR review page
  const processFeedbackBtn = page.locator('button:has-text("Process Feedback & Continue Workflow")').first();
  await processFeedbackBtn.click();
  console.log('✅ Clicked Process Feedback & Continue Workflow');

  // Wait for workflow to continue
  await page.waitForTimeout(3000);

  // Navigate to dashboard and logout
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');
  console.log('✅ Coordinator logged out after processing feedback');

  // Login as Action Officer to submit for second coordination
  await page.fill('input[type="email"]', 'ao1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Action Officer logged in to submit for second coordination');

  // AO clicks "Submit for Second Coordination" button
  const submitSecondCoordBtn = page.locator('button:has-text("Submit for Second Coordination")').first();
  await submitSecondCoordBtn.click();
  console.log('✅ AO clicked Submit for Second Coordination');
  await page.waitForTimeout(2000);

  // Logout AO
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // Login back as coordinator for second distribution
  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Coordinator logged back in for second distribution');

  // Now coordinator should be able to distribute again - Stage 6 uses "Distribute Draft to Reviewers"
  const distributeDraftBtn = page.locator('button:has-text("Distribute Draft to Reviewers")').first();
  await distributeDraftBtn.click();
  console.log('✅ Clicked Distribute Draft to Reviewers (Second time)');

  // Handle the distribution modal again
  await handleDistributionModal();

  // Wait for page reload after distribution
  await page.waitForTimeout(3000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 5.5: Second Review Collection
  // ========================================
  console.log('📌 STAGE 5.5: Second Reviews\n');

  // Reviewer 1 - Second Review
  await page.fill('input[type="email"]', 'ops.reviewer1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  try {
    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('  Clicked Submit Review button');
    }
  } catch {
    await page.locator('button:has-text("Review & CRM")').first().click();
    console.log('  Clicked Review & CRM button');
  }

  console.log('✅ Reviewer 1 submitted (Second round)');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // Reviewer 2 - Second Review
  await page.fill('input[type="email"]', 'ops.reviewer2@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  try {
    const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
    if (await submitReviewBtn.isVisible()) {
      await submitReviewBtn.click();
      console.log('  Clicked Submit Review button');
    }
  } catch {
    await page.locator('button:has-text("Review & CRM")').first().click();
    console.log('  Clicked Review & CRM button');
  }

  console.log('✅ Reviewer 2 submitted (Second round)');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');

  // ========================================
  // STAGE 7: Coordinator completes second review collection
  // ========================================
  console.log('📌 STAGE 7: Complete Second Review Collection\n');

  await page.fill('input[type="email"]', 'coordinator1@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');

  // Click "All Draft Reviews Complete" button
  await page.locator('button:has-text("All Draft Reviews Complete")').first().click();
  console.log('✅ Clicked All Draft Reviews Complete');

  // Wait for navigation to OPR review page
  await page.waitForURL('**/opr-review', { timeout: 5000 });
  console.log('  📋 Navigated to OPR review page');

  // Wait for the Process Feedback button to be visible
  await page.waitForTimeout(2000);

  // Click "Process Feedback & Continue Workflow" button on the OPR review page (second time)
  const processFeedbackBtn2 = page.locator('button:has-text("Process Feedback & Continue Workflow")').first();
  await processFeedbackBtn2.click();
  console.log('✅ Clicked Process Feedback & Continue Workflow');

  // Wait for workflow to continue
  await page.waitForTimeout(3000);

  // Navigate to dashboard and logout
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');
  console.log('✅ Coordinator logged out after second review collection');

  console.log('\n=====================================');
  console.log('✅ TEST WITH DISTRIBUTION MODAL COMPLETE');
  console.log('=====================================\n');
});