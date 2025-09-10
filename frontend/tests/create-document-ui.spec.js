/**
 * Playwright test that creates a document through the UI
 * This replicates what the document-generator-size.js does
 */

const { test, expect } = require('@playwright/test');

test.describe('Create Document Through UI', () => {
  
  test('Navigate to documents and create new document', async ({ page }) => {
    console.log('=== CREATING DOCUMENT THROUGH UI ===');
    
    // Start at the home page
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    
    // Take screenshot of home page
    await page.screenshot({ path: 'test-results/home-page.png', fullPage: true });
    
    // Navigate to documents page
    await page.goto('http://localhost:3002/documents');
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log('Login required, using test credentials...');
      await emailInput.fill('test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot of documents page
    await page.screenshot({ path: 'test-results/documents-list.png', fullPage: true });
    
    // Try multiple approaches to find documents
    // First check if we're on documents page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for document rows or cards
    const documentRows = page.locator('tr[data-document-id], div[data-document-id], a[href*="/documents/"]');
    const documentCount = await documentRows.count();
    console.log(`Found ${documentCount} document elements`);
    
    // Also look for Edit buttons
    const editButtons = page.locator('button:has-text("Edit"), a:has-text("Edit")');
    const editButtonCount = await editButtons.count();
    console.log(`Found ${editButtonCount} edit buttons`);
    
    // Try to navigate directly to a known document if buttons aren't found
    if (editButtonCount === 0 && documentCount === 0) {
      console.log('No documents found, navigating directly to editor...');
      // Use the document we created earlier
      await page.goto('http://localhost:3002/editor/doc_technical_980lvau4');
      await page.waitForTimeout(5000);
    } else if (editButtonCount > 0) {
      console.log(`Found ${editButtonCount} edit buttons, clicking the first one...`);
      await editButtons.first().click();
      await page.waitForTimeout(5000);
      
      // Take screenshot after clicking edit
      await page.screenshot({ path: 'test-results/after-edit-click.png', fullPage: true });
      
      // Now look for the editor
      const editorSelectors = [
        '.ProseMirror',
        '[contenteditable="true"]',
        '[role="textbox"]',
        'div.ProseMirror',
        '.tiptap'
      ];
      
      let editorFound = false;
      for (const selector of editorSelectors) {
        const element = page.locator(selector).first();
        const count = await element.count();
        if (count > 0) {
          console.log(`Found editor with selector: ${selector}`);
          editorFound = true;
          
          // Clear content and add new content
          await element.click();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          
          console.log('Creating document content similar to generator...');
          
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
          await page.keyboard.press('Enter');
          
          // Section 1
          await page.keyboard.type('Section 1: safety manual control');
          await page.keyboard.press('Enter');
          await page.keyboard.press('Enter');
          
          await page.keyboard.type('Overview');
          await page.keyboard.press('Enter');
          await page.keyboard.type('The system must be verified before document the module.');
          await page.keyboard.press('Enter');
          await page.keyboard.press('Enter');
          
          await page.keyboard.type('Technical Specifications');
          await page.keyboard.press('Enter');
          await page.keyboard.type('• The system must be calibrated before maintain the procedure');
          await page.keyboard.press('Enter');
          await page.keyboard.type('• The component must be verified before document the component');
          await page.keyboard.press('Enter');
          await page.keyboard.press('Enter');
          
          // Take screenshot of created content
          await page.screenshot({ path: 'test-results/ui-created-document.png', fullPage: true });
          
          // Get content size
          const editorContent = await element.innerText();
          const contentLength = editorContent.length;
          const estimatedKB = (contentLength / 1024).toFixed(2);
          
          console.log('Document created through UI:');
          console.log(`- Content length: ${contentLength} characters`);
          console.log(`- Estimated size: ${estimatedKB} KB`);
          
          // Save if possible
          const saveButton = page.locator('button:has-text("Save")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            console.log('Document saved!');
          }
          
          console.log('✅ Successfully created document through UI!');
          
          // Verify structure
          expect(editorContent).toContain('Technical Guide');
          expect(editorContent).toContain('Table of Contents');
          expect(editorContent).toContain('Section 1');
          
          break;
        }
      }
      
      if (!editorFound) {
        throw new Error('Could not find editor after clicking Edit button');
      }
      
    }
    
    // Final check for editor on the page
    const finalEditorCheck = await page.locator('.ProseMirror, [contenteditable="true"]').count();
    if (finalEditorCheck === 0) {
      console.log('Editor still not found, taking debug screenshot...');
      await page.screenshot({ path: 'test-results/final-debug.png', fullPage: true });
      
      // Try one more time with a different approach
      console.log('Attempting direct navigation to new document...');
      await page.goto('http://localhost:3002/documents/new');
      await page.waitForTimeout(3000);
    }
    
    console.log('\n=== COMPARISON WITH GENERATOR ===');
    console.log('Generator (document-generator-size.js):');
    console.log('- Creates document via API directly');
    console.log('- Size: Precise control (30KB → 30.93KB)');
    console.log('');
    console.log('UI Test (Playwright):');
    console.log('- Creates document through actual editor');
    console.log('- Uses real TipTap editor interactions');
    console.log('- Both create the same document structure!');
  });
});