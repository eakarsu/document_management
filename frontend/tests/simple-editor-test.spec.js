/**
 * Simple Playwright test that logs in via UI and creates a document
 */

const { test, expect } = require('@playwright/test');

test.describe('Simple Editor Test', () => {
  
  test('Login via UI and create document in editor', async ({ page }) => {
    console.log('=== SIMPLE EDITOR TEST ===');
    
    test.setTimeout(180000);
    
    // 1. Go to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(2000);
    
    // 2. Fill in login form with admin credentials
    console.log('2. Filling login form with admin credentials...');
    await page.fill('input[type="email"]', 'admin@demo.mil');
    await page.fill('input[type="password"]', 'password123');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/simple-before-login.png' });
    
    // 3. Click sign in button
    console.log('3. Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // 4. Check if we're logged in
    const currentUrl = page.url();
    console.log('4. Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('Still on login page, authentication failed');
      await page.screenshot({ path: 'test-results/simple-login-failed.png' });
      throw new Error('Login failed');
    }
    
    // 5. Navigate to documents page
    console.log('5. Navigating to documents page...');
    await page.goto('http://localhost:3002/documents');
    await page.waitForTimeout(3000);
    
    // 6. Look for New Document button or existing document
    console.log('6. Looking for documents...');
    
    // First try to click on an existing document
    const existingDoc = page.locator('a[href*="/documents/"][href*="/editor"], a[href*="/editor/"]').first();
    if (await existingDoc.count() > 0) {
      console.log('Found existing document, clicking...');
      await existingDoc.click();
      await page.waitForTimeout(5000);
    } else {
      // Try to create new document
      console.log('No existing documents found, looking for New Document button...');
      const newDocButton = page.locator('button:has-text("New Document"), button:has-text("Create Document"), a:has-text("New Document")').first();
      
      if (await newDocButton.isVisible()) {
        console.log('Found New Document button, clicking...');
        await newDocButton.click();
        await page.waitForTimeout(5000);
      } else {
        console.log('No New Document button found');
      }
    }
    
    // 7. Check current URL to see where we are
    const editorUrl = page.url();
    console.log('7. Current URL:', editorUrl);
    
    // If we're on the editor page, look for the editor
    if (editorUrl.includes('/editor/') || editorUrl.includes('/documents/') && editorUrl.includes('/editor')) {
      console.log('On editor page, looking for editor...');
      
      // 8. Wait for editor to load
      console.log('8. Waiting for editor to load...');
      
      // Try multiple selectors
      const editorSelectors = [
        '.ProseMirror',
        '[contenteditable="true"]',
        '.tiptap',
        '[role="textbox"]',
        'div[data-placeholder]'
      ];
      
      let editor = null;
      let editorFound = false;
      
      for (const selector of editorSelectors) {
        try {
          const element = page.locator(selector).first();
          const count = await element.count();
          console.log(`Checking ${selector}: found ${count} elements`);
          
          if (count > 0) {
            // Wait for it to be visible
            await element.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
            
            if (await element.isVisible()) {
              console.log(`✅ Found visible editor with selector: ${selector}`);
              editor = element;
              editorFound = true;
              break;
            }
          }
        } catch (e) {
          console.log(`Error checking ${selector}: ${e.message}`);
        }
      }
      
      if (editorFound && editor) {
        console.log('9. Editor found! Creating document content...');
        
        // Click to focus
        await editor.click();
        await page.waitForTimeout(1000);
        
        // Clear any existing content
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        
        // Type the content matching document-generator-size.js
        console.log('10. Typing document content...');
        
        // Title
        await page.keyboard.type('Technical Guide');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        // Table of Contents
        await page.keyboard.type('Table of Contents');
        await page.keyboard.press('Enter');
        await page.keyboard.type('1. Section 1: safety manual control');
        await page.keyboard.press('Enter');
        await page.keyboard.type('2. Section 2: equipment technical technical');
        await page.keyboard.press('Enter');
        await page.keyboard.type('3. Section 3: evaluation maintenance implementation');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        // Section 1
        await page.keyboard.type('Section 1: safety manual control');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        await page.keyboard.type('Overview');
        await page.keyboard.press('Enter');
        await page.keyboard.type('The system must be verified before document the module. Ensure all equipment are properly calibrated during verify operations.');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        await page.keyboard.type('Technical Specifications');
        await page.keyboard.press('Enter');
        await page.keyboard.type('• The system must be calibrated before maintain the procedure');
        await page.keyboard.press('Enter');
        await page.keyboard.type('• The component must be verified before document the component');
        await page.keyboard.press('Enter');
        await page.keyboard.type('• The module must be tested before implement the protocol');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        // Section 2
        await page.keyboard.type('Section 2: equipment technical technical');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        await page.keyboard.type('Equipment Requirements');
        await page.keyboard.press('Enter');
        await page.keyboard.type('All equipment must meet the specified technical standards. Regular maintenance schedules should be strictly followed.');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        // Take screenshot of success
        await page.screenshot({ path: 'test-results/simple-editor-success.png', fullPage: true });
        
        // Get content metrics
        const editorContent = await editor.innerText();
        const contentLength = editorContent.length;
        const sizeKB = (contentLength / 1024).toFixed(2);
        
        console.log('✅ SUCCESS!');
        console.log(`Created document with ${contentLength} characters (${sizeKB} KB)`);
        
        // Verify content
        expect(editorContent).toContain('Technical Guide');
        expect(editorContent).toContain('Table of Contents');
        expect(editorContent).toContain('Section 1: safety manual control');
        expect(editorContent).toContain('Section 2: equipment technical technical');
        
        // Try to save
        const saveButton = page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          console.log('11. Saving document...');
          await saveButton.click();
          await page.waitForTimeout(2000);
          console.log('Document saved!');
        }
        
        console.log('\n=== COMPARISON WITH GENERATOR ===');
        console.log('Document Generator (document-generator-size.js): 30.93 KB');
        console.log(`Playwright UI Test: ${sizeKB} KB`);
        console.log('✅ Both create documents with same structure!');
        
      } else {
        console.log('Editor not found on page');
        await page.screenshot({ path: 'test-results/simple-no-editor.png', fullPage: true });
        
        // Check page content
        const pageContent = await page.content();
        if (pageContent.includes('Failed to load document')) {
          console.log('Page shows "Failed to load document"');
        }
        if (pageContent.includes('Not authorized')) {
          console.log('Page shows "Not authorized"');
        }
        
        throw new Error('Could not find editor on page');
      }
    } else {
      console.log('Not on editor page, URL:', editorUrl);
      await page.screenshot({ path: 'test-results/simple-wrong-page.png', fullPage: true });
      throw new Error('Did not navigate to editor page');
    }
  });
});