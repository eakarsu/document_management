// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Compare Start Workflow vs Reset Button Clicks', async ({ page }) => {
  console.log('\n=== COMPARING BUTTON BEHAVIORS ===\n');

  // Monitor ALL API calls
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 API Request: ${request.method()} ${request.url().split('/api/')[1]}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') && response.url().includes('workflow')) {
      console.log(`📥 API Response: ${response.status()} ${response.url().split('/api/')[1]}`);
    }
  });

  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin\n');

  // Navigate to document
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to document\n');

  // First, let's check what buttons are visible
  console.log('=== CHECKING INITIAL STATE ===');
  const startWorkflowBtn = await page.locator('button:has-text("Start Selected Workflow")').first();
  const resetBtn = await page.locator('button:has-text("Reset to Start")').first();
  const submitToPCMBtn = await page.locator('button:has-text("Submit to PCM")').first();

  console.log(`Start Workflow button visible: ${await startWorkflowBtn.count() > 0}`);
  console.log(`Reset button visible: ${await resetBtn.count() > 0}`);
  console.log(`Submit to PCM button visible: ${await submitToPCMBtn.count() > 0}\n`);

  // If there's an active workflow, try to reset it
  if (await resetBtn.count() > 0) {
    console.log('=== TESTING RESET BUTTON ===');

    // Get button details
    const resetClasses = await resetBtn.getAttribute('class');
    const resetText = await resetBtn.textContent();
    console.log(`Reset button text: "${resetText}"`);
    console.log(`Reset button classes: ${resetClasses?.substring(0, 100)}...`);

    // Check the onClick handler
    const resetOnClick = await resetBtn.evaluate((btn) => {
      // Try to get React props
      const reactProps = Object.keys(btn).find(key => key.startsWith('__reactProps'));
      if (reactProps) {
        const props = btn[reactProps];
        return props?.onClick ? 'Has React onClick' : 'No React onClick';
      }
      return btn.onclick ? 'Has DOM onclick' : 'No onclick';
    });
    console.log(`Reset button handler: ${resetOnClick}`);

    // Try clicking with wait for response
    console.log('\n🖱️ Clicking Reset button and waiting for API response...');

    const [resetResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('reset'), { timeout: 5000 }).catch(() => null),
      resetBtn.click()
    ]);

    if (resetResponse) {
      console.log(`✅ Reset API called! Status: ${resetResponse.status()}`);
    } else {
      console.log('❌ Reset API was NOT called after clicking');
    }

    // Wait for any potential dialog
    await page.waitForTimeout(1000);

    // Check for confirmation dialog
    const confirmBtn = await page.locator('button').filter({ hasText: /Confirm|Yes|OK/i }).first();
    if (await confirmBtn.count() > 0) {
      console.log('✓ Found confirmation button, clicking...');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No confirmation dialog appeared');
    }
  }

  // Check state after reset attempt
  await page.waitForTimeout(2000);
  console.log('\n=== STATE AFTER RESET ATTEMPT ===');
  console.log(`Start Workflow button visible: ${await startWorkflowBtn.count() > 0}`);
  console.log(`Reset button visible: ${await resetBtn.count() > 0}`);
  console.log(`Submit to PCM button visible: ${await submitToPCMBtn.count() > 0}\n`);

  // Now test Start Workflow button if visible
  if (await startWorkflowBtn.count() > 0) {
    console.log('=== TESTING START WORKFLOW BUTTON ===');

    // Get button details
    const startClasses = await startWorkflowBtn.getAttribute('class');
    const startText = await startWorkflowBtn.textContent();
    console.log(`Start button text: "${startText}"`);
    console.log(`Start button classes: ${startClasses?.substring(0, 100)}...`);

    console.log('\n🖱️ Clicking Start Workflow button and waiting for API response...');

    const [startResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('workflow'), { timeout: 5000 }).catch(() => null),
      startWorkflowBtn.click()
    ]);

    if (startResponse) {
      console.log(`✅ Workflow API called! Status: ${startResponse.status()}`);
      const url = startResponse.url();
      console.log(`   Endpoint: ${url.substring(url.lastIndexOf('/'))}`);
    } else {
      console.log('❌ Workflow API was NOT called after clicking');
    }
  }

  // Final state check
  await page.waitForTimeout(2000);
  console.log('\n=== FINAL STATE ===');
  console.log(`Submit to PCM button visible: ${await submitToPCMBtn.count() > 0}`);

  if (await submitToPCMBtn.count() > 0) {
    console.log('✅ Workflow is now active (Submit to PCM visible)');
  } else {
    console.log('⚠️ Workflow is not active');
  }
});