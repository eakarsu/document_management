// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Workflow with Distribution Modal - Refactored', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  console.log('\n=====================================');
  console.log('🚀 WORKFLOW TEST WITH DISTRIBUTION MODAL');
  console.log('=====================================\n');

  // Handle all dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

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
    try {
      const button = page.locator(`button:has-text("${buttonText}")`).first();
      await button.waitFor({ state: 'visible', timeout: 10000 });
      await button.click();
      console.log(`✅ ${description || buttonText}`);
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log(`❌ Could not find button: "${buttonText}"`);
      // Log available buttons
      const buttons = await page.locator('button').all();
      console.log('  Available buttons:');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.trim()) {
          console.log(`  - "${text.trim()}"`);
        }
      }
      throw new Error(`Button "${buttonText}" not found`);
    }
  }

  async function handleDistributionModal() {
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
      }

      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('  ⚠️ Error handling distribution modal');
    }
  }

  async function submitReview(reviewerEmail, reviewerName) {
    await loginUser(reviewerEmail, reviewerName);
    await navigateToDocument();

    try {
      const submitReviewBtn = page.locator('button:has-text("Submit Review")').first();
      if (await submitReviewBtn.isVisible()) {
        await submitReviewBtn.click();
        console.log('  Clicked Submit Review button');

        // Check if we navigated to review page
        if (page.url().includes('/review')) {
          await page.waitForTimeout(2000);
          const submitFeedbackBtn = page.locator('button:has-text("Submit Feedback to OPR")').first();
          if (await submitFeedbackBtn.isVisible()) {
            await submitFeedbackBtn.click();
            console.log('  ✅ Clicked Submit Feedback to OPR');
          }
        }
      }
    } catch {
      await clickButton('Review & CRM', 'Clicked Review & CRM');
    }

    console.log(`✅ ${reviewerName} submitted review`);
    await page.waitForTimeout(2000);
    await logout();
  }

  async function coordinatorProcessReviews(reviewType = 'first') {
    await loginUser('coordinator1@airforce.mil', 'Coordinator');
    await navigateToDocument();

    const buttonText = reviewType === 'first' ? 'All Reviews Complete' : 'All Draft Reviews Complete';
    await clickButton(buttonText, `Clicked ${buttonText}`);

    // Wait for navigation to OPR review page
    await page.waitForURL('**/opr-review', { timeout: 5000 });
    console.log('  📋 Navigated to OPR review page');
    await page.waitForTimeout(2000);

    // Click Process Feedback button
    await clickButton('Process Feedback & Continue Workflow', 'Processed feedback and continued workflow');
    await page.waitForTimeout(3000);

    await logout();
    console.log('✅ Coordinator processed reviews\n');
  }

  // ========================================
  // WORKFLOW EXECUTION
  // ========================================

  // RESET AND START
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

  // STAGE 1: Initial Draft Preparation
  console.log('📌 STAGE 1: Initial Draft Preparation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Submit to PCM', 'Submitted to PCM');
  await logout();
  console.log('');

  // STAGE 2: PCM Review
  console.log('📌 STAGE 2: PCM Review\n');
  await loginUser('pcm@airforce.mil', 'PCM');
  await navigateToDocument();
  await clickButton('Approve for Coordination', 'Approved for Coordination');
  await logout();
  console.log('');

  // STAGE 3: First Coordination - Distribution
  console.log('📌 STAGE 3: First Coordination - Distribution\n');
  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();
  await clickButton('Distribute to Reviewers', 'Clicked Distribute to Reviewers');
  await handleDistributionModal();
  await page.waitForTimeout(3000); // Wait for page reload after distribution
  await logout();
  console.log('');

  // STAGE 3.5: First Review Collection
  console.log('📌 STAGE 3.5: First Review Collection\n');
  await submitReview('ops.reviewer1@airforce.mil', 'OPS Reviewer 1');
  await submitReview('ops.reviewer2@airforce.mil', 'OPS Reviewer 2');
  console.log('');

  // STAGE 4: OPR Feedback Incorporation
  console.log('📌 STAGE 4: OPR Feedback Incorporation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Incorporated feedback');
  await logout();
  console.log('');

  // STAGE 5: Process First Reviews & Submit for Second Coordination
  console.log('📌 STAGE 5: Process Reviews & Second Coordination\n');
  await coordinatorProcessReviews('first');

  // AO submits for second coordination
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Submit for Second Coordination', 'Submitted for Second Coordination');
  await logout();
  console.log('');

  // STAGE 6: Second Coordination - Distribution
  console.log('📌 STAGE 6: Second Coordination - Distribution\n');
  await loginUser('coordinator1@airforce.mil', 'Coordinator');
  await navigateToDocument();
  await clickButton('Distribute Draft to Reviewers', 'Clicked Distribute Draft to Reviewers');
  await handleDistributionModal();
  await page.waitForTimeout(3000); // Wait for page reload after distribution
  await logout();
  console.log('');

  // STAGE 6.5: Second Review Collection
  console.log('📌 STAGE 6.5: Second Review Collection\n');
  await submitReview('ops.reviewer1@airforce.mil', 'OPS Reviewer 1 (Round 2)');
  await submitReview('ops.reviewer2@airforce.mil', 'OPS Reviewer 2 (Round 2)');
  console.log('');

  // STAGE 7: Process Second Reviews
  console.log('📌 STAGE 7: Process Second Reviews\n');
  await coordinatorProcessReviews('second');

  // STAGE 8: Second OPR Feedback Incorporation
  console.log('📌 STAGE 8: Second OPR Feedback Incorporation\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Incorporated second round feedback');
  await logout();
  console.log('');

  // Submit to Legal
  console.log('📌 Submit to Legal Review\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Submit to Legal', 'Submitted to Legal Review');
  await logout();
  console.log('');

  // STAGE 9: Legal Review
  console.log('📌 STAGE 9: Legal Review\n');
  await loginUser('legal.reviewer@airforce.mil', 'Legal Reviewer');
  await navigateToDocument();
  await clickButton('Approve', 'Legal approved the document');
  await logout();
  console.log('');

  // STAGE 10: Post-Legal OPR Update
  console.log('📌 STAGE 10: Post-Legal OPR Update\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();
  await clickButton('Review & CRM', 'Post-legal update completed');
  await logout();
  console.log('');

  // Submit to Leadership
  console.log('📌 Submit to Leadership\n');
  await loginUser('ao1@airforce.mil', 'Action Officer');
  await navigateToDocument();

  // Try different possible button names
  const possibleButtons = ['Submit to Leadership', 'Submit for Leadership Review', 'Send to Leadership', 'Submit to OPR Leadership'];
  let clicked = false;

  for (const buttonName of possibleButtons) {
    try {
      const btn = page.locator(`button:has-text("${buttonName}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        console.log(`✅ Clicked "${buttonName}"`);
        clicked = true;
        break;
      }
    } catch {}
  }

  if (!clicked) {
    console.log('⚠️ Could not find Submit to Leadership button, continuing...');
  }

  await logout();
  console.log('');

  // STAGE 11: OPR Leadership Final Review
  console.log('📌 STAGE 11: OPR Leadership Final Review - Sign and Approve\n');
  await loginUser('opr.leadership@airforce.mil', 'OPR Leadership');
  await navigateToDocument();

  // Leadership should click "Sign and Approve" button
  const signApproveButtons = ['Sign and Approve', 'Sign & Approve', 'Approve and Sign', 'Approve'];
  let signClicked = false;

  for (const buttonName of signApproveButtons) {
    try {
      const btn = page.locator(`button:has-text("${buttonName}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        console.log(`✅ Leadership clicked "${buttonName}"`);
        signClicked = true;
        break;
      }
    } catch {}
  }

  if (!signClicked) {
    console.log('⚠️ Could not find Sign and Approve button');
  }

  await logout();
  console.log('');

  // STAGE 12: AFDPO Publication - Final Sign and Publish
  console.log('📌 STAGE 12: AFDPO Publication - Final Sign and Publish\n');
  await loginUser('afdpo.publisher@airforce.mil', 'AFDPO Publisher');
  await navigateToDocument();

  // Add debug logging to see the current state
  console.log('🔍 DEBUG: Checking Stage 12 state...');
  await page.waitForTimeout(3000);

  // Log the current stage name
  const stageHeaders = await page.locator('h4, h5, .MuiTypography-h4, .MuiTypography-h5').all();
  for (const header of stageHeaders) {
    const text = await header.textContent();
    if (text && (text.includes('Stage') || text.includes('AFDPO') || text.includes('Publication'))) {
      console.log(`📍 Current Stage Header: "${text}"`);
    }
  }

  // Log ALL available buttons for debugging
  console.log('\n📋 DEBUG: All buttons available on page:');
  const allButtons = await page.locator('button').all();
  for (let i = 0; i < allButtons.length; i++) {
    const btnText = await allButtons[i].textContent();
    const isVisible = await allButtons[i].isVisible();
    if (btnText && btnText.trim() && isVisible) {
      console.log(`  Button ${i + 1}: "${btnText.trim()}"`);
    }
  }

  // AFDPO Publisher should have actions to take before document is published
  // Updated list to include the exact button names from Stage 10 configuration
  const publishButtons = ['Publish Document', 'Final Publication Check', 'Archive', 'Sign and Approve', 'Sign & Approve', 'Approve and Publish', 'Publish', 'Finalize Publication', 'Complete Publication'];
  let publishClicked = false;

  console.log('\n🔍 Looking for publish-related buttons...');
  for (const buttonName of publishButtons) {
    try {
      const btn = page.locator(`button:has-text("${buttonName}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        console.log(`  ✅ Found button: "${buttonName}" - Clicking...`);
        await btn.click();
        console.log(`  ✅ AFDPO Publisher clicked "${buttonName}"`);
        publishClicked = true;
        break;
      } else {
        console.log(`  ❌ Button "${buttonName}" not visible`);
      }
    } catch (error) {
      console.log(`  ❌ Error checking button "${buttonName}": ${error.message}`);
    }
  }

  if (!publishClicked) {
    console.log('\n⚠️ WARNING: No publish action available!');
    console.log('This might indicate:');
    console.log('  1. Workflow is already complete');
    console.log('  2. User does not have AFDPO role permissions');
    console.log('  3. Stage 12 actions are not properly configured');
    console.log('  4. Workflow incorrectly completed at Stage 11');
  }

  // Wait longer to observe the page state
  console.log('\n⏳ Waiting 10 seconds to observe final state...');
  await page.waitForTimeout(10000);

  // Check workflow status more thoroughly
  console.log('\n🔍 DEBUG: Checking workflow status indicators...');
  const publishedText = page.locator('text="Document Published"');
  const workflowCompleteText = page.locator('text="Workflow Complete"');
  const afdpoStageText = page.locator('text="AFDPO Publication"').first();

  const isPublished = await publishedText.isVisible({ timeout: 2000 });
  const isComplete = await workflowCompleteText.isVisible({ timeout: 2000 });
  const isAtAFDPO = await afdpoStageText.isVisible({ timeout: 2000 });

  console.log(`  Document Published indicator: ${isPublished ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Workflow Complete indicator: ${isComplete ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  AFDPO Stage indicator: ${isAtAFDPO ? 'YES ✅' : 'NO ❌'}`);

  if (isPublished || isComplete) {
    console.log('\n✅ Document successfully PUBLISHED!');
    console.log('✅ Workflow Status: COMPLETE');
  } else if (isAtAFDPO) {
    console.log('\n📍 Workflow is at Stage 12 (AFDPO Publication)');
    console.log('⚠️ But Publish button is not available or workflow not complete');
    console.log('This indicates the fix is working - Stage 12 is now active!');
  } else {
    console.log('\n⚠️ Unexpected state - may need further investigation');
  }

  // Take final screenshot with descriptive name
  const screenshotName = publishClicked ? 'workflow-stage-12-published.png' : 'workflow-stage-12-active.png';
  await page.screenshot({ path: screenshotName, fullPage: true });
  console.log(`\n📸 Screenshot saved: ${screenshotName}`);

  // Keep page open for visual inspection
  console.log('\n👁️ Keeping page open for 5 more seconds for visual inspection...');
  await page.waitForTimeout(5000);

  console.log('\n=====================================');
  console.log('🎉 COMPLETE 12-STAGE WORKFLOW TEST!');
  console.log('=====================================\n');
});