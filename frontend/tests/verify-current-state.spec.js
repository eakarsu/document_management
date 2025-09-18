// @ts-check
const { test } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Verify current state precisely', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document');

  // Get full page text
  const pageText = await page.locator('body').textContent();

  console.log('\n=== CHECKING FOR STAGE INDICATORS ===');

  // Check each possible stage
  const stages = [
    'Initial Draft',
    'PCM Review',
    'First Coordination',
    'Review Collection',
    'OPR Feedback',
    'Second Coordination',
    'Second Review Collection',
    'Second OPR Feedback',
    'Legal Review',
    'Post-Legal OPR Update',
    'OPR Leadership Final Review',
    'AFDPO Publication'
  ];

  let foundStages = [];
  for (const stage of stages) {
    if (pageText.includes(stage)) {
      foundStages.push(stage);
    }
  }

  console.log('Found these stage references in the UI:');
  foundStages.forEach(stage => {
    console.log(`  - ${stage}`);
  });

  // Check for workflow status text
  console.log('\n=== WORKFLOW STATUS ===');
  if (pageText.includes('Workflow Complete')) {
    console.log('  ❌ Shows "Workflow Complete"');
  }
  if (pageText.includes('Document Published')) {
    console.log('  ❌ Shows "Document Published"');
  }
  if (pageText.includes('Stage 1')) {
    console.log('  ✅ Shows "Stage 1"');
  }

  // Check visible buttons
  console.log('\n=== ACTION BUTTONS ===');
  const submitToPCM = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();
  const startWorkflow = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  const resetButton = await page.locator('button').filter({ hasText: '🔄 Reset to Start' }).count();

  console.log(`  Submit to PCM button: ${submitToPCM > 0 ? '✅ YES' : '❌ NO'}`);
  console.log(`  Start Workflow button: ${startWorkflow > 0 ? 'YES' : 'NO'}`);
  console.log(`  Reset to Start button: ${resetButton > 0 ? 'YES' : 'NO'}`);

  // Check the current active stage more precisely
  const activeStageElement = await page.locator('.MuiStepLabel-iconContainer .MuiStepIcon-active').first();
  if (await activeStageElement.count() > 0) {
    const parentElement = await activeStageElement.locator('..').locator('..').textContent();
    console.log(`\n=== ACTIVE STAGE (from stepper) ===`);
    console.log(`  ${parentElement}`);
  }

  // Take a focused screenshot
  await page.screenshot({ path: 'current-state-verify.png', fullPage: false });
  console.log('\n📸 Screenshot saved as current-state-verify.png');
});