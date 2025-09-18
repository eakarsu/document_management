// @ts-check
const { test } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Check current UI state', async ({ page }) => {
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

  // Take screenshot
  await page.screenshot({ path: 'current-document-state.png', fullPage: true });
  console.log('📸 Screenshot saved as current-document-state.png');

  // Check what stage text is visible
  const pageText = await page.locator('body').textContent();

  console.log('\n=== UI Analysis ===');

  // Check for stage indicators
  if (pageText.includes('AFDPO Publication')) {
    console.log('❌ UI shows: AFDPO Publication (Stage 12)');
  }
  if (pageText.includes('Document Published')) {
    console.log('❌ UI shows: Document Published');
  }
  if (pageText.includes('Workflow Complete')) {
    console.log('❌ UI shows: Workflow Complete');
  }
  if (pageText.includes('Initial Draft')) {
    console.log('✅ UI shows: Initial Draft (Stage 1)');
  }
  if (pageText.includes('Stage 1')) {
    console.log('✅ UI shows: Stage 1');
  }

  // Check for buttons
  const startWorkflowBtn = await page.locator('button').filter({ hasText: /Start.*Workflow/i }).count();
  const resetBtn = await page.locator('button').filter({ hasText: '🔄 Reset to Start' }).count();
  const submitToPCMBtn = await page.locator('button').filter({ hasText: 'Submit to PCM' }).count();

  console.log('\n=== Buttons Visible ===');
  console.log(`  Start Workflow button: ${startWorkflowBtn > 0 ? 'YES' : 'NO'}`);
  console.log(`  Reset button: ${resetBtn > 0 ? 'YES' : 'NO'}`);
  console.log(`  Submit to PCM button: ${submitToPCMBtn > 0 ? 'YES' : 'NO'}`);

  // List workflow progress indicators
  const workflowStages = await page.locator('[class*="MuiStepper"], [class*="workflow-progress"], [class*="stage"]').all();
  if (workflowStages.length > 0) {
    console.log('\n=== Workflow Progress ===');
    for (const stage of workflowStages.slice(0, 3)) {
      const text = await stage.textContent();
      if (text && text.trim()) {
        console.log(`  - ${text.trim().substring(0, 50)}`);
      }
    }
  }
});