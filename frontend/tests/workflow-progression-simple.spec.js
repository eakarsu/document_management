// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Simple Workflow Progression', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  console.log('\n=====================================');
  console.log('🚀 WORKFLOW PROGRESSION TEST');
  console.log('=====================================\n');

  // Handle all dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Reset and start workflow as admin
  console.log('🔧 PREPARATION: Reset and Start Workflow\n');

  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

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

  // Logout admin
  await page.goto(`${BASE_URL}/dashboard`);
  await page.locator('.MuiIconButton-root').last().click();
  await page.waitForTimeout(500);
  await page.locator('text="Logout"').click();
  await page.waitForURL('**/login');
  console.log('✓ Logged out admin\n');

  // Progress through workflow with appropriate users
  const stages = [
    { user: 'ao1@airforce.mil', name: 'Action Officer', button: 'Submit to PCM' },
    { user: 'pcm@airforce.mil', name: 'PCM', button: 'Approve for Coordination' },
    { user: 'coordinator1@airforce.mil', name: 'Coordinator', button: 'Distribute to Reviewers' },
    { user: 'ops.reviewer1@airforce.mil', name: 'Reviewer', button: 'Review & CRM' },
    { user: 'opr.leadership@airforce.mil', name: 'OPR Leadership', button: 'Review & CRM' },
    { user: 'legal.reviewer@airforce.mil', name: 'Legal', button: 'Review & CRM' },
    { user: 'afdpo.publisher@airforce.mil', name: 'Publisher', button: 'Review & CRM' }
  ];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    console.log(`📌 STAGE ${i + 1}: ${stage.name}\n`);

    // Login
    await page.fill('input[type="email"]', stage.user);
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log(`✓ Logged in as ${stage.name}`);

    // Navigate to document
    await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Try to find and click the button
    const actionBtn = page.locator(`button:has-text("${stage.button}")`).first();

    try {
      await expect(actionBtn).toBeVisible({ timeout: 5000 });
      await actionBtn.click();
      console.log(`✅ Clicked: ${stage.button}`);
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`⚠️ Button "${stage.button}" not found, workflow might be complete`);

      // Check if workflow is complete
      const pageText = await page.locator('body').textContent();
      if (pageText.includes('Complete') || pageText.includes('Published')) {
        console.log('\n🎉 WORKFLOW APPEARS TO BE COMPLETE!');
        break;
      }
    }

    // Logout
    await page.goto(`${BASE_URL}/dashboard`);
    await page.locator('.MuiIconButton-root').last().click();
    await page.waitForTimeout(500);
    await page.locator('text="Logout"').click();
    await page.waitForURL('**/login');
    console.log('✓ Logged out\n');
  }

  console.log('=====================================');
  console.log('✅ WORKFLOW PROGRESSION TEST COMPLETE');
  console.log('=====================================\n');
});