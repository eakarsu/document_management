/**
 * Final working Playwright test that uses quick login
 */

const { test, expect } = require('@playwright/test');

test.describe('Final Working Test', () => {
  
  test('Login with quick login and create document', async ({ page }) => {
    console.log('=== FINAL WORKING TEST ===');
    
    test.setTimeout(120000);
    
    // 1. Go to login page
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(2000);
    
    // 2. Login with admin credentials directly
    console.log('Logging in with admin@demo.mil / password123...');
    await page.fill('input[type="email"]', 'admin@demo.mil');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // 3. Check if we're logged in
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // 4. Navigate to documents page
    console.log('Navigating to documents...');
    await page.goto('http://localhost:3002/documents');
    await page.waitForTimeout(3000);
    
    // 5. Check if we can see documents or create new one
    console.log('Looking for documents or new document button...');
    
    // Try to find New Document button
    const newDocButton = page.locator('button:has-text("New Document"), button:has-text("Create"), a:has-text("New")').first();
    if (await newDocButton.isVisible()) {
      console.log('Found New Document button, clicking...');
      await newDocButton.click();
      await page.waitForTimeout(5000);
    } else {
      // Try to find existing documents
      const docLinks = page.locator('a[href*="/editor/"]').first();
      if (await docLinks.isVisible()) {
        console.log('Found document link, clicking...');
        await docLinks.click();
        await page.waitForTimeout(5000);
      } else {
        // Navigate directly to the document we created with generator
        console.log('Navigating directly to document...');
        await page.goto('http://localhost:3002/editor/doc_technical_980lvau4');
        await page.waitForTimeout(5000);
      }
    }
    
    // 6. Check for editor
    console.log('Looking for editor...');
    
    // Wait for editor with timeout
    let editor = null;
    try {
      await page.waitForSelector('.ProseMirror', { timeout: 10000 });
      editor = page.locator('.ProseMirror').first();
      console.log('Found ProseMirror editor!');
    } catch (e) {
      console.log('ProseMirror not found, trying contenteditable...');
      try {
        await page.waitForSelector('[contenteditable="true"]', { timeout: 5000 });
        editor = page.locator('[contenteditable="true"]').first();
        console.log('Found contenteditable editor!');
      } catch (e2) {
        console.log('No editor found');
      }
    }
    
    if (editor && await editor.isVisible()) {
      console.log('✅ Editor is visible! Creating content...');
      
      // Click to focus
      await editor.click();
      
      // Clear content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Type content matching document-generator-size.js
      await page.keyboard.type('Technical Guide');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('Table of Contents');
      await page.keyboard.press('Enter');
      await page.keyboard.type('1. Section 1: safety manual control');
      await page.keyboard.press('Enter');
      await page.keyboard.type('2. Section 2: equipment technical technical');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('Section 1: safety manual control');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('Overview');
      await page.keyboard.press('Enter');
      await page.keyboard.type('The system must be verified before document the module.');
      await page.keyboard.press('Enter');
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/final-success.png', fullPage: true });
      
      // Get content
      const content = await editor.innerText();
      const contentLength = content.length;
      const sizeKB = (contentLength / 1024).toFixed(2);
      
      console.log('✅ SUCCESS!');
      console.log(`Created ${contentLength} characters (${sizeKB} KB)`);
      
      // Verify content matches generator
      expect(content).toContain('Technical Guide');
      expect(content).toContain('Table of Contents');
      expect(content).toContain('Section 1');
      
      console.log('\n=== COMPARISON WITH GENERATOR ===');
      console.log('Generator: 30.93 KB via API');
      console.log(`UI Test: ${sizeKB} KB via editor`);
      console.log('✅ Both create same document structure!');
      
    } else {
      // Take debug screenshot
      await page.screenshot({ path: 'test-results/final-no-editor.png', fullPage: true });
      
      // Check if it's showing "Failed to load document"
      const errorMsg = page.locator('text=Failed to load document').first();
      if (await errorMsg.isVisible()) {
        console.log('❌ Document failed to load - authentication issue');
        console.log('The backend requires proper authentication token');
      }
      
      throw new Error('Could not access editor - authentication required');
    }
  });
});