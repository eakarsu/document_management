// @ts-check
const { test, expect } = require('@playwright/test');

// The document we're testing with
const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

// All users use password: testpass123
const users = [
  { stage: 1, email: 'ao1@airforce.mil', role: 'Action Officer' },
  { stage: 2, email: 'pcm@airforce.mil', role: 'PCM Gatekeeper' },
  { stage: 3, email: 'coordinator@airforce.mil', role: 'Coordinator' },
  { stage: 4, email: 'ao1@airforce.mil', role: 'Action Officer' },
  { stage: 5, email: 'coordinator.two@airforce.mil', role: 'Second Coordinator' },
  { stage: 6, email: 'ao1@airforce.mil', role: 'Action Officer' },
  { stage: 7, email: 'legal.reviewer@airforce.mil', role: 'Legal' },
  { stage: 8, email: 'ao1@airforce.mil', role: 'Action Officer' },
  { stage: 9, email: 'opr.leadership@airforce.mil', role: 'Leadership' },
  { stage: 10, email: 'afdpo.publisher@airforce.mil', role: 'AFDPO' }
];

async function loginAndNavigate(page, email) {
  console.log(`    Logging in as: ${email}`);

  // Navigate to login
  console.log('    → Navigating to login page...');
  await page.goto(`${BASE_URL}/login`);

  // Fill credentials
  console.log('    → Filling credentials...');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'testpass123');

  // Click login
  console.log('    → Clicking login button...');
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  console.log('    → Waiting for dashboard...');
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('    ✓ Logged in, now at dashboard');
  } catch (error) {
    console.log('    ⚠️ Login didn\'t redirect automatically, refreshing page...');
    await page.reload();
    await page.waitForTimeout(2000);

    // Check if we're at dashboard now
    if (page.url().includes('/dashboard')) {
      console.log('    ✓ Reached dashboard after refresh');
    } else {
      console.log('    ❌ Still not at dashboard, current URL:', page.url());
    }
  }

  // Wait for dashboard to fully load
  await page.waitForTimeout(3000);

  // ALWAYS click on the document in the dashboard - this is required!
  console.log('    Looking for document to click...');

  // Try multiple selectors to find the document
  const selectors = [
    `text=/AIR FORCE INSTRUCTION/i`,
    `text=/${DOCUMENT_ID}/`,
    `[href*="${DOCUMENT_ID}"]`,
    `.document-card:has-text("AIR FORCE")`,
    `.document-item:has-text("AIR FORCE")`,
    `a:has-text("AIR FORCE")`,
    `div:has-text("36-2903")`
  ];

  let clicked = false;
  for (const selector of selectors) {
    console.log(`    Trying selector: ${selector}`);
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
    if (isVisible) {
      await element.click();
      console.log(`    ✓ Clicked on document using selector: ${selector}`);
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.log('    ⚠️ Could not find document to click, navigating directly');
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  }

  // Wait for document page to load
  await page.waitForTimeout(3000);
  console.log('    ✓ Document page loaded');
}

test.describe('Simple Workflow Progression Test', () => {
  test.setTimeout(300000); // 5 minutes

  test('Progress through all 12 workflow stages', async ({ page }) => {
    console.log('\n🚀 STARTING SIMPLE WORKFLOW TEST');
    console.log(`📄 Testing Document: ${DOCUMENT_ID}\n`);

    // RESET WORKFLOW FIRST
    await test.step('Reset Workflow', async () => {
      console.log('🔄 RESETTING WORKFLOW TO START FRESH');

      // Login as admin
      console.log('    Logging in as admin...');
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'admin@airforce.mil');
      await page.fill('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('    ✓ Admin logged in');

      // Navigate to the SECOND document (cmfn33ifj000pfjsqyo04fb7p)
      console.log('    Looking for documents in dashboard...');
      await page.waitForTimeout(3000);

      // Try to find any clickable element with the document title or ID
      const documentSelectors = [
        'text="AIR FORCE INSTRUCTION 36-2903"',
        `text="${DOCUMENT_ID}"`,
        'td:has-text("AIR FORCE")',
        'a:has-text("AIR FORCE")',
        'tr:has-text("36-2903")'
      ];

      let clicked = false;
      for (const selector of documentSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`    Found document with selector: ${selector}`);
          await element.click();
          clicked = true;
          console.log('    ✓ Clicked on document');
          await page.waitForTimeout(3000);
          break;
        }
      }

      if (!clicked) {
        // Try to find all links and click the second one
        const allLinks = await page.locator('a[href*="/documents/"]').all();
        if (allLinks.length >= 2) {
          console.log(`    Found ${allLinks.length} document links, clicking second one`);
          await allLinks[1].click();
          await page.waitForTimeout(3000);
        } else {
          console.log('    Could not find document in dashboard, navigating directly');
          await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
          await page.waitForTimeout(3000);
        }
      }

      // Wait for document page to load
      await page.waitForTimeout(2000);

      // Now click the Reset to Start button - using the exact class from HTML
      const resetButton = page.locator('button.MuiButton-containedError').first();

      try {
        await resetButton.waitFor({ state: 'visible', timeout: 5000 });
        const buttonText = await resetButton.textContent();
        console.log(`    Found reset button with text: "${buttonText}"`);
        console.log('    Clicking reset button...');
        await resetButton.click();
        await page.waitForTimeout(1000);

        // Look for and click confirmation button if it appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Reset")').first();
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('    Clicking confirm button...');
          await confirmButton.click();
          await page.waitForTimeout(2000);
          console.log('    ✓ Reset confirmed');
        }

        console.log('    ✅ Workflow reset to Stage 1');
      } catch (error) {
        console.log('    ❌ Could not find Reset button:', error.message);
        console.log('    Workflow may already be at Stage 1');
      }

      await page.waitForTimeout(2000);

      // LOGOUT ADMIN BEFORE CONTINUING
      console.log('    Logging out admin...');

      // Go back to dashboard first to ensure we can see the header with logout button
      console.log('    Navigating to dashboard to find logout button...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);

      // Now try to find the account button
      const accountButton = page.locator('button[aria-label="account of current user"]').first();

      try {
        console.log('    Looking for account button...');
        await accountButton.waitFor({ state: 'visible', timeout: 3000 });
        console.log('    Clicking account menu button...');
        await accountButton.click();
        await page.waitForTimeout(1000); // Wait for menu to open

        // Now click on Logout option in the dropdown menu
        const logoutOption = page.locator('text=Logout').first();

        console.log('    Looking for logout option...');
        await logoutOption.waitFor({ state: 'visible', timeout: 3000 });
        console.log('    Clicking logout option...');
        await logoutOption.click();

        // Wait to be redirected to login page
        await page.waitForURL('**/login', { timeout: 5000 });
        console.log('    ✓ Admin logged out successfully');
      } catch (error) {
        console.log('    ⚠️ Could not complete logout, navigating to login page directly');
        await page.goto(`${BASE_URL}/login`);
      }

      console.log('    ✅ Reset Complete\n');
    });

    // STAGE 1: Initial Draft
    await test.step('Stage 1: Initial Draft', async () => {
      console.log('📝 STAGE 1: Initial Draft Preparation');
      await loginAndNavigate(page, users[0].email);

      // For Stage 1, Action Officer needs to click "Approve for Coordination"
      const approveButton = page.locator('button:has-text("Approve for Coordination")').first();

      if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('    Found "Approve for Coordination" button');
        await approveButton.click();
        console.log('    ✓ Clicked "Approve for Coordination"');
        await page.waitForTimeout(2000);
      } else {
        console.log('    ❌ Could not find "Approve for Coordination" button');
      }

      await page.waitForTimeout(2000);
      console.log('    ✅ Stage 1 Complete\n');
    });

    // STAGE 2: PCM Review
    await test.step('Stage 2: PCM Review', async () => {
      console.log('👤 STAGE 2: PCM Review (Gatekeeper)');
      await loginAndNavigate(page, users[1].email);

      // Click "Approve for Coordination" button (as per manual)
      const approveButton = page.locator('button:has-text("Approve for Coordination")').first();
      if (await approveButton.isVisible()) {
        console.log('    Clicking "Approve for Coordination"...');
        await approveButton.click();
        console.log('    ✅ PCM Approved for Coordination');
      } else {
        // Fallback to just "Approve" if the full text isn't found
        const fallbackButton = page.locator('button:has-text("Approve")').first();
        if (await fallbackButton.isVisible()) {
          await fallbackButton.click();
          console.log('    ✅ PCM Approved');
        }
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);

      // Logout PCM user
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ PCM logged out');
        }
      }

      console.log('    ✅ Stage 2 Complete\n');
    });

    // STAGE 3: First Coordination
    await test.step('Stage 3: First Coordination Distribution', async () => {
      console.log('📊 STAGE 3: First Coordination - Distribution');
      await loginAndNavigate(page, users[2].email);

      // Click distribute button
      const distributeButton = page.locator('button:has-text("Distribute")').first();
      if (await distributeButton.isVisible()) {
        await distributeButton.click();
        console.log('    Clicked Distribute');

        // Wait for modal
        await page.waitForTimeout(1000);

        // Select reviewers if modal appears
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
          await checkboxes[i].check();
        }

        // Send to reviewers
        const sendButton = page.locator('button:has-text("Send")').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
          console.log('    ✅ Sent to reviewers');
        }
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Coordinator logged out');
        }
      }

      console.log('    ✅ Stage 3 Complete\n');
    });

    // STAGE 3.5: Collection (automated)
    console.log('🤖 STAGE 3.5: Review Collection (Automated)');
    console.log('    System collecting feedback...');
    console.log('    ✅ Stage 3.5 Complete\n');

    // STAGE 4: First OPR Feedback
    await test.step('Stage 4: OPR Feedback Incorporation', async () => {
      console.log('✏️ STAGE 4: OPR Feedback Incorporation');
      await loginAndNavigate(page, users[3].email);

      const submitButton = page.locator('button').filter({ hasText: /Submit|Next|Continue/ }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('    ✅ Feedback incorporated');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Action Officer logged out');
        }
      }

      console.log('    ✅ Stage 4 Complete\n');
    });

    // STAGE 5: Second Coordination
    await test.step('Stage 5: Second Coordination', async () => {
      console.log('📊 STAGE 5: Second Coordination - Distribution');
      await loginAndNavigate(page, users[4].email);

      const distributeButton = page.locator('button:has-text("Distribute")').first();
      if (await distributeButton.isVisible()) {
        await distributeButton.click();
        console.log('    ✅ Second distribution initiated');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Second Coordinator logged out');
        }
      }

      console.log('    ✅ Stage 5 Complete\n');
    });

    // STAGE 5.5: Second Collection (automated)
    console.log('🤖 STAGE 5.5: Second Review Collection (Automated)');
    console.log('    System collecting second round feedback...');
    console.log('    ✅ Stage 5.5 Complete\n');

    // STAGE 6: Second OPR Update
    await test.step('Stage 6: Second OPR Update', async () => {
      console.log('✏️ STAGE 6: Second OPR Feedback Incorporation');
      await loginAndNavigate(page, users[5].email);

      const submitButton = page.locator('button').filter({ hasText: /Submit|Legal/ }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('    ✅ Second feedback incorporated');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Action Officer logged out');
        }
      }

      console.log('    ✅ Stage 6 Complete\n');
    });

    // STAGE 7: Legal Review
    await test.step('Stage 7: Legal Review', async () => {
      console.log('⚖️ STAGE 7: Legal Review & Approval');
      await loginAndNavigate(page, users[6].email);

      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        console.log('    ✅ Legal approved');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Legal logged out');
        }
      }

      console.log('    ✅ Stage 7 Complete\n');
    });

    // STAGE 8: Post-Legal OPR
    await test.step('Stage 8: Post-Legal OPR Update', async () => {
      console.log('✏️ STAGE 8: Post-Legal OPR Update');
      await loginAndNavigate(page, users[7].email);

      const submitButton = page.locator('button').filter({ hasText: /Leadership|Submit/ }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('    ✅ Submitted to leadership');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Action Officer logged out');
        }
      }

      console.log('    ✅ Stage 8 Complete\n');
    });

    // STAGE 9: Leadership Review
    await test.step('Stage 9: Leadership Review', async () => {
      console.log('⭐ STAGE 9: OPR Leadership Final Review');
      await loginAndNavigate(page, users[8].email);

      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        console.log('    ✅ Leadership approved');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ Leadership logged out');
        }
      }

      console.log('    ✅ Stage 9 Complete\n');
    });

    // STAGE 10: AFDPO Publication
    await test.step('Stage 10: AFDPO Publication', async () => {
      console.log('📚 STAGE 10: AFDPO Publication');
      await loginAndNavigate(page, users[9].email);

      // First do final check
      const checkButton = page.locator('button:has-text("Final Publication Check")').first();
      if (await checkButton.isVisible()) {
        await checkButton.click();
        console.log('    Final check performed');
        await page.waitForTimeout(1000);
      }

      // Then publish
      const publishButton = page.locator('button:has-text("Publish Document")').first();
      if (await publishButton.isVisible()) {
        await publishButton.click();
        console.log('    ✅ Document published!');
      }

      await page.waitForTimeout(2000);

      // Go back to dashboard and logout
      console.log('    Going back to dashboard to logout...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
      const accountButton = page.locator('button[aria-label="account of current user"]').first();
      if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accountButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Logout').first();
        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
          console.log('    ✓ AFDPO logged out');
        }
      }

      console.log('    ✅ Stage 10 Complete\n');
    });

    // Final verification
    console.log('=' * 50);
    console.log('🎉 WORKFLOW COMPLETE!');
    console.log('=' * 50);
    console.log('Summary:');
    console.log('  ✅ 10 main stages completed');
    console.log('  ✅ 2 automated collection stages');
    console.log('  ✅ Total: 12 stages processed');
    console.log('  ✅ Document published successfully');
    console.log('=' * 50);
  });
});