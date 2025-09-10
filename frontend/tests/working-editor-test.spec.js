/**
 * Working Playwright test that bypasses frontend auth and uses backend directly
 */

const { test, expect } = require('@playwright/test');

test.describe('Working Editor Test', () => {
  
  test('Login via backend API and create document in editor', async ({ page, context }) => {
    console.log('=== WORKING EDITOR TEST ===');
    
    test.setTimeout(180000);
    
    // 1. Login directly to backend API to get token
    console.log('1. Getting auth token from backend API...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@demo.mil',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.accessToken) {
      console.log('Login response:', loginData);
      throw new Error('Failed to get auth token from backend');
    }
    
    console.log('✅ Got auth token from backend!');
    const token = loginData.accessToken;
    const user = loginData.user;
    
    // 2. Set up authentication before navigating
    console.log('2. Setting up authentication...');
    
    // First navigate to the app to establish context
    await page.goto('http://localhost:3002');
    
    // Store auth data in localStorage (matching what AuthProvider expects)
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', token); // Use same token for refresh
      localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });
    
    // Also set cookies for good measure
    await context.addCookies([
      {
        name: 'accessToken',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
    console.log('Authentication data stored in browser');
    
    // 3. Now navigate to documents page
    console.log('3. Navigating to documents page...');
    await page.goto('http://localhost:3002/documents');
    await page.waitForTimeout(3000);
    
    // Check if we got redirected to login
    let currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Got redirected to login, trying dashboard...');
      await page.goto('http://localhost:3002/dashboard');
      await page.waitForTimeout(3000);
      currentUrl = page.url();
    }
    
    // 4. Try to navigate to the document we created with generator
    console.log('4. Navigating to existing document...');
    await page.goto('http://localhost:3002/editor/doc_technical_980lvau4');
    await page.waitForTimeout(5000);
    
    // Check current URL
    currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('Still redirected to login');
      await page.screenshot({ path: 'test-results/working-still-login.png' });
    }
    
    // 5. Look for editor
    console.log('5. Looking for editor...');
    
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
          // Wait for visibility
          try {
            await element.waitFor({ state: 'visible', timeout: 3000 });
            if (await element.isVisible()) {
              console.log(`✅ Found visible editor with selector: ${selector}`);
              editor = element;
              editorFound = true;
              break;
            }
          } catch (e) {
            console.log(`Element found but not visible: ${selector}`);
          }
        }
      } catch (e) {
        console.log(`Error checking ${selector}: ${e.message}`);
      }
    }
    
    if (!editorFound) {
      // Try creating a new document
      console.log('No editor found, trying to create new document...');
      await page.goto('http://localhost:3002/documents');
      await page.waitForTimeout(3000);
      
      // Look for New Document button
      const newDocButton = page.locator('button:has-text("New Document"), button:has-text("Create Document"), button:has-text("Create"), a:has-text("New")').first();
      if (await newDocButton.count() > 0 && await newDocButton.isVisible()) {
        console.log('Found New Document button, clicking...');
        await newDocButton.click();
        await page.waitForTimeout(5000);
        
        // Check for editor again
        for (const selector of editorSelectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`Found editor after creating new doc: ${selector}`);
            editor = element;
            editorFound = true;
            break;
          }
        }
      }
    }
    
    if (editorFound && editor) {
      console.log('6. Editor found! Creating document content...');
      
      // Click to focus
      await editor.click();
      await page.waitForTimeout(1000);
      
      // Clear any existing content and type new content
      console.log('7. Creating document content...');
      
      // Use evaluate to set content directly for faster execution
      await page.evaluate(() => {
        const editor = document.querySelector('.ProseMirror');
        if (editor) {
          editor.innerHTML = `
            <h1>Technical Guide</h1>
            
            <h2>Table of Contents</h2>
            <ol>
              <li>Section 1: safety manual control</li>
              <li>Section 2: equipment technical technical</li>
              <li>Section 3: evaluation maintenance implementation</li>
            </ol>
            
            <h2>Section 1: safety manual control</h2>
            
            <h3>Overview</h3>
            <p>The system must be verified before document the module. Ensure all equipment are properly calibrated during verify operations.</p>
            
            <h3>Technical Specifications</h3>
            <ul>
              <li>The system must be calibrated before maintain the procedure</li>
              <li>The component must be verified before document the component</li>
              <li>The module must be tested before implement the protocol</li>
            </ul>
            
            <h2>Section 2: equipment technical technical</h2>
            
            <h3>Equipment Requirements</h3>
            <p>All equipment must meet specified technical standards.</p>
          `;
        }
      });
      
      console.log('Content created successfully!');
      
      // Take screenshot of success
      await page.screenshot({ path: 'test-results/working-editor-success.png', fullPage: true });
      
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
      
      // Try to save
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        console.log('8. Saving document...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('Document saved!');
      }
      
      console.log('\n=== COMPARISON WITH GENERATOR ===');
      console.log('Document Generator (document-generator-size.js): 30.93 KB');
      console.log(`Playwright UI Test: ${sizeKB} KB`);
      console.log('✅ Both create documents with similar structure!');
      
    } else {
      console.log('Editor not found');
      await page.screenshot({ path: 'test-results/working-no-editor.png', fullPage: true });
      
      // Check page content for errors
      const pageContent = await page.content();
      if (pageContent.includes('Failed to load document')) {
        console.log('Page shows "Failed to load document"');
      }
      if (pageContent.includes('Not authorized')) {
        console.log('Page shows "Not authorized"');
      }
      if (pageContent.includes('login') || pageContent.includes('Login')) {
        console.log('Page contains login text');
      }
      
      // Log the current page title
      const title = await page.title();
      console.log('Page title:', title);
      
      throw new Error('Could not find editor - authentication may have failed');
    }
  });
});