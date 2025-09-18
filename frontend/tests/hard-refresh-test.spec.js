// @ts-check
const { test } = require('@playwright/test');

const DOCUMENT_ID = 'cmfn33ifj000pfjsqyo04fb7p';
const BASE_URL = 'http://localhost:3000';

test('Hard refresh and check state', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@airforce.mil');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✓ Logged in as admin');

  // Navigate to document with cache disabled
  await page.goto(`${BASE_URL}/documents/${DOCUMENT_ID}`, { waitUntil: 'networkidle' });
  console.log('✓ Initial navigation');

  // Force hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
  await page.keyboard.press('Control+Shift+R');
  await page.waitForTimeout(3000);
  console.log('✓ Performed hard refresh');

  // Or alternatively, clear cache and reload
  await page.evaluate(() => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  });

  // Reload the page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('✓ Cleared cache and reloaded');

  // Now check the state
  const pageText = await page.locator('body').textContent();

  console.log('\n=== After Hard Refresh ===');

  // Check workflow stage
  const stageElement = await page.locator('text=/Stage [0-9]+|Initial Draft|PCM Review|AFDPO Publication/i').first();
  if (await stageElement.count() > 0) {
    const stageText = await stageElement.textContent();
    console.log(`Current Stage shown: "${stageText}"`);
  }

  // Check for specific stage indicators
  if (pageText.includes('AFDPO Publication')) {
    console.log('⚠️ Still shows: AFDPO Publication (Stage 12)');
  }
  if (pageText.includes('Initial Draft')) {
    console.log('✅ Shows: Initial Draft (Stage 1)');
  }

  // Check action buttons
  const buttons = await page.locator('button.MuiButton-containedPrimary, button.MuiButton-containedSecondary').all();
  console.log('\n=== Action Buttons ===');
  for (const btn of buttons.slice(0, 5)) {
    const text = await btn.textContent();
    if (text && text.trim() && !text.includes('Edit') && !text.includes('Download')) {
      console.log(`  - "${text.trim()}"`);
    }
  }

  // Check the database directly from Node to compare
  console.log('\n=== Database Check (for comparison) ===');
  await page.evaluate(async () => {
    const response = await fetch('/api/workflow-instances/cmfn33ifj000pfjsqyo04fb7p');
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  });
});