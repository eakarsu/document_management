const { test } = require('@playwright/test');

test('debug NaN issue', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Navigate to documents page and create a new document via UI
  await page.goto('http://localhost:3000/documents');
  await page.waitForTimeout(1000);
  
  // Click Create Document button
  const createButton = page.locator('button:has-text("Create Document")');
  if (await createButton.isVisible()) {
    await createButton.click();
    console.log('Clicked Create Document button');
    await page.waitForTimeout(2000);
    
    // Check if we're on the create form
    const currentUrl = page.url();
    console.log('Current URL after clicking Create:', currentUrl);
    
    // Fill in the create form if needed
    if (currentUrl.includes('/create')) {
      // Fill required fields
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Document for NaN Check');
      }
      
      // Select category if needed
      const categorySelect = page.locator('select[name="category"]').first();
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({index: 1});
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('Submitted create form');
        await page.waitForTimeout(3000);
      }
    }
    
    // Now check where we ended up
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-nan.png', fullPage: true });
    
    // Get all text content
    const content = await page.textContent('body');
    
    // Search for NaN
    const nanRegex = /([^\w]|^)NaN([^\w]|$)/g;
    const matches = content.match(nanRegex);
    
    if (matches) {
      console.log('❌ Found NaN in document!');
      console.log('NaN occurrences:', matches.length);
      
      // Get context around NaN
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('NaN')) {
          console.log(`Line ${i}: ${line.trim()}`);
        }
      });
      
      // Check specific headings
      const headings = await page.locator('h1, h2, h3, h4').allTextContents();
      console.log('\nHeadings with issues:');
      headings.forEach(h => {
        if (h.includes('NaN')) {
          console.log('  ❌', h);
        }
      });
    } else {
      console.log('✅ No NaN found in document');
    }
  }
});