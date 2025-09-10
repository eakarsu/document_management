const { test, expect } = require('@playwright/test');

test('check document', async ({ page }) => {
  // Navigate to the document in editor
  await page.goto('http://localhost:3000/editor/doc_editor_technical_2tj1j48j');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/check-document.png', fullPage: true });
  
  // Get all text content
  const content = await page.textContent('body');
  
  // Check for NaN
  if (content.includes('NaN')) {
    console.log('Found NaN in document!');
    const nanMatches = content.match(/[^\w]NaN[^\w]/g);
    console.log('NaN occurrences:', nanMatches);
  } else {
    console.log('No NaN found in document');
  }
  
  // Check for sections with numbers
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Headings found:');
  headings.forEach(h => {
    if (h.includes('NaN')) {
      console.log('  ❌', h);
    } else {
      console.log('  ✅', h);
    }
  });
});