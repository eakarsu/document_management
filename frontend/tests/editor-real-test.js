/**
 * Real UI Test for Document Editor
 * This test actually opens the editor and creates documents
 */

const { test, expect } = require('@playwright/test');

test.describe('Real Editor UI Test', () => {
  test('Open editor and create document content', async ({ page }) => {
    console.log('Starting real editor test...');
    
    // Navigate to an existing document's editor
    const documentId = 'ui-test-doc-1756823088793';
    const editorUrl = `http://localhost:3000/editor/${documentId}`;
    
    console.log(`Opening editor at: ${editorUrl}`);
    await page.goto(editorUrl);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for the TipTap editor - it might be in an iframe or have different selector
    console.log('Looking for editor...');
    
    // Try multiple possible selectors
    const possibleSelectors = [
      '.ProseMirror',
      '[contenteditable="true"]',
      '.tiptap',
      '.editor-content',
      'div[role="textbox"]'
    ];
    
    let editorFound = false;
    let editorSelector = null;
    
    for (const selector of possibleSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`Found editor with selector: ${selector}`);
          editorSelector = selector;
          editorFound = true;
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found`);
      }
    }
    
    if (!editorFound) {
      // Take screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/editor-not-found.png', fullPage: true });
      console.log('Editor not found - screenshot saved to test-results/editor-not-found.png');
      
      // Log page content to help debug
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Current URL:', page.url());
      
      // Check if we need to login first
      if (pageContent.includes('login') || pageContent.includes('Login')) {
        console.log('Login required - attempting login...');
        
        // Try to find login form
        const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
        
        if (await emailInput.isVisible() && await passwordInput.isVisible()) {
          await emailInput.fill('test@example.com');
          await passwordInput.fill('password123');
          
          // Find and click login button
          const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
          await loginButton.click();
          
          // Wait for navigation
          await page.waitForTimeout(3000);
          
          // Try to navigate to editor again
          await page.goto(editorUrl);
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Try again after potential login
    if (!editorFound) {
      for (const selector of possibleSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`Found editor with selector: ${selector}`);
            editorSelector = selector;
            editorFound = true;
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
    }
    
    if (editorFound && editorSelector) {
      console.log('Editor found! Adding content...');
      
      // Click on the editor to focus it
      await page.locator(editorSelector).first().click();
      
      // Clear existing content (select all and delete)
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Type new content with proper numbering
      await page.keyboard.type('1. Introduction');
      await page.keyboard.press('Enter');
      await page.keyboard.type('This is the introduction section with proper numbering.');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('1.1 Overview');
      await page.keyboard.press('Enter');
      await page.keyboard.type('This subsection provides an overview of the document.');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('1.2 Scope');
      await page.keyboard.press('Enter');
      await page.keyboard.type('This subsection defines the scope of the document.');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('2. Technical Details');
      await page.keyboard.press('Enter');
      await page.keyboard.type('This section covers technical implementation details.');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('2.1 Architecture');
      await page.keyboard.press('Enter');
      await page.keyboard.type('System architecture description goes here.');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      await page.keyboard.type('2.2 Components');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Component descriptions go here.');
      await page.keyboard.press('Enter');
      
      console.log('Content added successfully!');
      
      // Try to apply formatting
      console.log('Applying formatting...');
      
      // Select "Introduction" and make it bold
      await page.keyboard.press('Control+Home'); // Go to start
      await page.keyboard.press('Shift+End'); // Select first line
      await page.keyboard.press('Control+B'); // Make bold
      
      // Take screenshot of edited content
      await page.screenshot({ path: 'test-results/editor-with-content.png', fullPage: true });
      console.log('Screenshot saved to test-results/editor-with-content.png');
      
      // Try to save if there's a save button
      const saveButton = await page.locator('button:has-text("Save"), button[title*="save" i]').first();
      if (await saveButton.isVisible()) {
        console.log('Saving document...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('Document saved!');
      }
      
      console.log('✅ Test completed successfully!');
    } else {
      // Final screenshot if editor still not found
      await page.screenshot({ path: 'test-results/final-page-state.png', fullPage: true });
      throw new Error('Could not find editor on the page');
    }
  });
});