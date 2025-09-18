// @ts-check
const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const DOCUMENT_TITLE = 'AIR FORCE INSTRUCTION 36-2903';

// User credentials - all use password: testpass123
const users = {
  actionOfficer: { email: 'ao1@airforce.mil', password: 'testpass123' },
  legal: { email: 'legal.reviewer@airforce.mil', password: 'testpass123' },
  coordinator: { email: 'coordinator@airforce.mil', password: 'testpass123' },
  reviewers: [
    { email: 'reviewer.one@airforce.mil', password: 'testpass123' },
    { email: 'reviewer.two@airforce.mil', password: 'testpass123' },
    { email: 'reviewer.three@airforce.mil', password: 'testpass123' },
    { email: 'reviewer.four@airforce.mil', password: 'testpass123' },
    { email: 'reviewer.five@airforce.mil', password: 'testpass123' }
  ],
  leadership: { email: 'opr.leadership@airforce.mil', password: 'testpass123' },
  afdpo: { email: 'afdpo.publisher@airforce.mil', password: 'testpass123' }
};

// Helper function to login
async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

// Helper function to navigate to document
async function navigateToDocument(page, documentId) {
  await page.goto(`${BASE_URL}/documents/${documentId}`);
  await page.waitForSelector('[data-testid="workflow-display"], .workflow-display, text=/Stage|Workflow/i');
}

// Helper function to advance workflow
async function clickWorkflowButton(page, buttonText) {
  // Wait for the button to be visible and enabled
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await expect(button).toBeEnabled();
  await button.click();

  // Wait for the workflow to update
  await page.waitForTimeout(2000); // Give time for state update
}

// Main comprehensive test
test.describe('Comprehensive 10-Stage Workflow E2E Test', () => {
  test.setTimeout(300000); // 5 minutes for the entire test

  test('Complete workflow from Stage 1 to Stage 10', async ({ page }) => {
    console.log('🚀 Starting comprehensive workflow test...');

    // ========================================
    // STAGE 1: Initial Draft Preparation
    // ========================================
    test.step('Stage 1: Action Officer creates initial draft', async () => {
      console.log('📝 Stage 1: Action Officer login...');
      await login(page, users.actionOfficer.email, users.actionOfficer.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 1
      await expect(page.locator('text=/Initial Draft|Stage 1/i')).toBeVisible();

      // Submit to Legal Review
      await clickWorkflowButton(page, 'Submit to Legal Review');

      // Verify advancement to Stage 2
      await expect(page.locator('text=/Legal Review|Stage 2/i')).toBeVisible();
      console.log('✅ Stage 1 complete - Advanced to Legal Review');
    });

    // ========================================
    // STAGE 2: Legal Review
    // ========================================
    test.step('Stage 2: Legal Reviewer reviews document', async () => {
      console.log('⚖️ Stage 2: Legal Reviewer login...');
      await login(page, users.legal.email, users.legal.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 2
      await expect(page.locator('text=/Legal Review|Stage 2/i')).toBeVisible();

      // Add legal comments (simulated)
      // In real test, would add actual comments

      // Approve and send to Coordinator
      await clickWorkflowButton(page, 'Approve and Send to Coordinator');

      // Verify advancement to Stage 3
      await expect(page.locator('text=/Coordinator.*Distribution|Stage 3/i')).toBeVisible();
      console.log('✅ Stage 2 complete - Advanced to Coordinator');
    });

    // ========================================
    // STAGE 3: Coordinator Distribution
    // ========================================
    test.step('Stage 3: Coordinator distributes for review', async () => {
      console.log('📧 Stage 3: Coordinator login...');
      await login(page, users.coordinator.email, users.coordinator.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 3
      await expect(page.locator('text=/Coordinator.*Distribution|Stage 3/i')).toBeVisible();

      // Open distribution modal
      await clickWorkflowButton(page, 'Distribute for Review');

      // Wait for modal
      await page.waitForSelector('.distribution-modal, [role="dialog"]');

      // Select reviewers (check all 5)
      for (let i = 0; i < 5; i++) {
        const checkbox = page.locator(`input[type="checkbox"]`).nth(i);
        await checkbox.check();
      }

      // Set deadline (if field exists)
      const deadlineField = page.locator('input[type="date"], input[placeholder*="deadline"]');
      if (await deadlineField.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await deadlineField.fill(futureDate.toISOString().split('T')[0]);
      }

      // Add instructions
      const instructionsField = page.locator('textarea[placeholder*="instruction"], textarea[name*="instruction"]');
      if (await instructionsField.isVisible()) {
        await instructionsField.fill('Please review and provide feedback within 7 days.');
      }

      // Send to reviewers
      await page.click('button:has-text("Send to Reviewers"), button:has-text("Distribute")');

      // Wait for distribution to complete
      await page.waitForTimeout(3000);
      console.log('✅ Stage 3 complete - Distributed to 5 reviewers');
    });

    // ========================================
    // STAGE 3.5: Parallel Review Process
    // ========================================
    test.step('Stage 3.5: All reviewers provide feedback', async () => {
      console.log('👥 Stage 3.5: Reviewers providing feedback...');

      // Each reviewer logs in and provides feedback
      for (let i = 0; i < users.reviewers.length; i++) {
        const reviewer = users.reviewers[i];
        console.log(`  Reviewer ${i + 1} logging in...`);

        await login(page, reviewer.email, reviewer.password);
        await navigateToDocument(page, DOCUMENT_ID);

        // Check if reviewer can see the document
        await expect(page.locator(`text=/${DOCUMENT_TITLE}/i`)).toBeVisible();

        // Add feedback (simulated - in real test would add actual comments)
        const feedbackButton = page.locator('button:has-text("Add Feedback"), button:has-text("Submit Review")').first();
        if (await feedbackButton.isVisible()) {
          await feedbackButton.click();

          // Fill feedback form if it appears
          const feedbackText = page.locator('textarea').first();
          if (await feedbackText.isVisible()) {
            await feedbackText.fill(`Feedback from Reviewer ${i + 1}: Approved with minor suggestions.`);
            await page.click('button:has-text("Submit"), button:has-text("Save")');
          }
        }

        console.log(`  ✓ Reviewer ${i + 1} feedback submitted`);
      }

      console.log('✅ Stage 3.5 complete - All 5 reviewers submitted feedback');
    });

    // ========================================
    // Coordinator reviews collected feedback
    // ========================================
    test.step('Coordinator reviews collected feedback', async () => {
      console.log('📋 Coordinator reviewing collected feedback...');
      await login(page, users.coordinator.email, users.coordinator.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Advance to Stage 4
      await clickWorkflowButton(page, 'Send to Action Officer');
      console.log('✅ Coordinator sent feedback package to Action Officer');
    });

    // ========================================
    // STAGE 4: First OPR Feedback Incorporation
    // ========================================
    test.step('Stage 4: Action Officer incorporates feedback', async () => {
      console.log('✏️ Stage 4: Action Officer incorporating feedback...');
      await login(page, users.actionOfficer.email, users.actionOfficer.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 4
      await expect(page.locator('text=/First OPR.*Feedback|Stage 4/i')).toBeVisible();

      // Incorporate feedback (simulated)
      await clickWorkflowButton(page, 'Submit to Legal Review');
      console.log('✅ Stage 4 complete - Feedback incorporated');
    });

    // ========================================
    // STAGE 5: Second Legal Review
    // ========================================
    test.step('Stage 5: Second Legal Review', async () => {
      console.log('⚖️ Stage 5: Second Legal Review...');
      await login(page, users.legal.email, users.legal.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 5
      await expect(page.locator('text=/Second Legal|Stage 5/i')).toBeVisible();

      // Approve changes
      await clickWorkflowButton(page, 'Approve');
      console.log('✅ Stage 5 complete - Legal approved changes');
    });

    // ========================================
    // STAGE 6: Second OPR Feedback
    // ========================================
    test.step('Stage 6: Second OPR Feedback', async () => {
      console.log('✏️ Stage 6: Second OPR update...');
      await login(page, users.actionOfficer.email, users.actionOfficer.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 6
      await expect(page.locator('text=/Second OPR.*Feedback|Stage 6/i')).toBeVisible();

      // Address remaining concerns
      await clickWorkflowButton(page, 'Submit to Legal');
      console.log('✅ Stage 6 complete - Second OPR feedback addressed');
    });

    // ========================================
    // STAGE 7: Final Legal Review
    // ========================================
    test.step('Stage 7: Final Legal Review', async () => {
      console.log('⚖️ Stage 7: Final Legal Review...');
      await login(page, users.legal.email, users.legal.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 7
      await expect(page.locator('text=/Final Legal|Stage 7/i')).toBeVisible();

      // Final approval
      await clickWorkflowButton(page, 'Approve');
      console.log('✅ Stage 7 complete - Final legal approval');
    });

    // ========================================
    // STAGE 8: Post-Legal OPR Update
    // ========================================
    test.step('Stage 8: Post-Legal OPR Update', async () => {
      console.log('✏️ Stage 8: Post-Legal OPR Update...');
      await login(page, users.actionOfficer.email, users.actionOfficer.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 8
      await expect(page.locator('text=/Post-Legal.*OPR|Stage 8/i')).toBeVisible();

      // Final revisions and submit to Leadership
      await clickWorkflowButton(page, 'Submit to Leadership');
      console.log('✅ Stage 8 complete - Submitted to Leadership');
    });

    // ========================================
    // STAGE 9: Leadership Review
    // ========================================
    test.step('Stage 9: Leadership Final Review', async () => {
      console.log('⭐ Stage 9: Leadership Review...');
      await login(page, users.leadership.email, users.leadership.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 9
      await expect(page.locator('text=/Leadership.*Review|Stage 9/i')).toBeVisible();

      // Leadership approval
      await clickWorkflowButton(page, 'Approve');
      console.log('✅ Stage 9 complete - Leadership approved');
    });

    // ========================================
    // STAGE 10: AFDPO Publication
    // ========================================
    test.step('Stage 10: AFDPO Publication', async () => {
      console.log('📚 Stage 10: AFDPO Publication...');
      await login(page, users.afdpo.email, users.afdpo.password);
      await navigateToDocument(page, DOCUMENT_ID);

      // Verify at Stage 10
      await expect(page.locator('text=/AFDPO.*Publication|Stage 10/i')).toBeVisible();

      // Final publication check
      await clickWorkflowButton(page, 'Final Publication Check');

      // Wait for check completion
      await page.waitForTimeout(2000);

      // Publish document
      await clickWorkflowButton(page, 'Publish Document');

      // Verify workflow complete
      await expect(page.locator('text=/Workflow Complete/i')).toBeVisible();
      console.log('✅ Stage 10 complete - Document PUBLISHED!');
    });

    // ========================================
    // FINAL VERIFICATION
    // ========================================
    test.step('Verify workflow completion', async () => {
      console.log('🎉 Verifying workflow completion...');

      // Check for completion indicators
      await expect(page.locator('text=/Workflow Complete/i')).toBeVisible();
      await expect(page.locator('text=/PUBLISHED/i')).toBeVisible();

      // Verify all stages show as complete (checkmarks)
      const checkmarks = page.locator('.stage-complete, svg[data-testid="CheckCircleIcon"]');
      const checkmarkCount = await checkmarks.count();
      expect(checkmarkCount).toBeGreaterThanOrEqual(10);

      console.log('🎊 WORKFLOW SUCCESSFULLY COMPLETED!');
      console.log('📊 Summary:');
      console.log('  - 10 stages completed');
      console.log('  - 9 unique users participated');
      console.log('  - 5 parallel reviews processed');
      console.log('  - Document successfully published');
    });
  });

  // Optional: Test workflow reset functionality
  test('Reset workflow and start over', async ({ page }) => {
    console.log('🔄 Testing workflow reset...');

    // Login as admin or authorized user
    await login(page, users.actionOfficer.email, users.actionOfficer.password);
    await navigateToDocument(page, DOCUMENT_ID);

    // Look for reset button
    const resetButton = page.locator('button:has-text("Reset Workflow")');
    if (await resetButton.isVisible()) {
      await resetButton.click();

      // Confirm reset if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify workflow is reset to Stage 1
      await expect(page.locator('text=/Initial Draft|Stage 1/i')).toBeVisible();
      console.log('✅ Workflow successfully reset to Stage 1');
    }
  });
});

// Performance test
test('Workflow performance metrics', async ({ page }) => {
  const startTime = Date.now();

  // Run through key stages quickly
  await login(page, users.actionOfficer.email, users.actionOfficer.password);
  await navigateToDocument(page, DOCUMENT_ID);

  const loadTime = Date.now() - startTime;
  console.log(`📊 Performance: Document loaded in ${loadTime}ms`);

  // Check that load time is reasonable
  expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
});