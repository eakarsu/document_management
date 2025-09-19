// @ts-check
const { test, expect } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Debug Button Detection', async ({ page }) => {
  test.setTimeout(60000);

  console.log('\n=== DEBUG BUTTON DETECTION TEST ===\n');

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message()}"`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✓ Logged in\n');

  // Click on document - try different methods
  await page.waitForTimeout(2000);

  // Method 1: Try clicking the table row
  const documentRow = page.locator('tr').filter({ hasText: 'AIR FORCE INSTRUCTION 36-2903' }).first();

  if (await documentRow.count() > 0) {
    console.log('Found document row - clicking...');
    await documentRow.click();
  } else {
    // Method 2: Try clicking the link with AI_GENERATED tag
    const documentWithTag = page.locator('text=AIR FORCE INSTRUCTION 36-2903').first();
    if (await documentWithTag.count() > 0) {
      console.log('Found document text - clicking...');
      await documentWithTag.click();
    } else {
      // Method 3: Navigate directly
      console.log('Could not find document to click - navigating directly...');
      await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`);
    }
  }

  await page.waitForLoadState('networkidle');

  // Verify we're on the document page
  const currentUrl = page.url();
  if (currentUrl.includes('/documents/')) {
    console.log('✓ On document page\n');
  } else {
    console.log(`❌ Not on document page. Current URL: ${currentUrl}\n`);
  }

  // Debug: List ALL visible buttons
  console.log('=== ALL VISIBLE BUTTONS ===');
  const allButtons = await page.locator('button:visible').all();
  console.log(`Found ${allButtons.length} visible buttons:\n`);

  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    const isEnabled = await allButtons[i].isEnabled();
    console.log(`Button ${i + 1}: "${text?.trim()}" (Enabled: ${isEnabled})`);
  }

  console.log('\n=== SEARCHING FOR SPECIFIC BUTTONS ===\n');

  // Method 1: Using filter with hasText
  const startBtn1 = page.locator('button').filter({ hasText: 'Start Selected Workflow' });
  console.log(`Method 1 - filter hasText 'Start Selected Workflow': ${await startBtn1.count()} found`);

  // Method 2: Using :has-text
  const startBtn2 = page.locator('button:has-text("Start Selected Workflow")');
  console.log(`Method 2 - :has-text("Start Selected Workflow"): ${await startBtn2.count()} found`);

  // Method 3: Using text selector
  const startBtn3 = page.locator('text="Start Selected Workflow"');
  console.log(`Method 3 - text="Start Selected Workflow": ${await startBtn3.count()} found`);

  // Method 4: Using getByRole
  const startBtn4 = page.getByRole('button', { name: 'Start Selected Workflow' });
  console.log(`Method 4 - getByRole: ${await startBtn4.count()} found`);

  console.log('\n=== SEARCHING FOR RESET BUTTON ===\n');

  // Method 1: Using filter
  const resetBtn1 = page.locator('button').filter({ hasText: 'Reset to Start' });
  console.log(`Method 1 - filter hasText 'Reset to Start': ${await resetBtn1.count()} found`);

  // Method 2: Using :has-text
  const resetBtn2 = page.locator('button:has-text("Reset to Start")');
  console.log(`Method 2 - :has-text("Reset to Start"): ${await resetBtn2.count()} found`);

  // Method 3: Check if contains emoji
  const resetBtn3 = page.locator('button:has-text("🔄 Reset to Start")');
  console.log(`Method 3 - with emoji: ${await resetBtn3.count()} found`);

  // Method 4: Using getByRole
  const resetBtn4 = page.getByRole('button', { name: /Reset to Start/i });
  console.log(`Method 4 - getByRole with regex: ${await resetBtn4.count()} found`);

  console.log('\n=== ATTEMPTING CLICKS ===\n');

  // Try to click Start Selected Workflow if found
  if (await startBtn1.isVisible()) {
    console.log('✅ Start Selected Workflow button IS visible - clicking...');
    await startBtn1.click();
    await page.waitForTimeout(2000);
    console.log('   Clicked!');
  } else {
    console.log('❌ Start Selected Workflow button NOT visible');
  }

  // Check what's visible now
  console.log('\n=== AFTER CLICKING START (if clicked) ===');
  const submitBtn = page.locator('button:has-text("Submit to PCM")');
  if (await submitBtn.count() > 0) {
    console.log('✅ Submit to PCM button found - workflow is active!');
  } else {
    console.log('❌ No Submit to PCM button - workflow may not be active');
  }

  await page.screenshot({ path: 'debug-buttons.png' });
  console.log('\n📸 Screenshot saved\n');
});