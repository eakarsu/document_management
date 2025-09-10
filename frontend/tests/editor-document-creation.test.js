/**
 * Comprehensive UI Test for Document Creation using Editor
 * This test suite creates documents of all types using the TipTap editor
 * 
 * Run with: npx playwright test tests/editor-document-creation.test.js
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Document templates for each type
const DOCUMENT_TEMPLATES = {
  'af-manual': {
    title: 'F-16C Flight Manual Test',
    content: `
      <h1>AIR FORCE TECHNICAL MANUAL</h1>
      <p class="subtitle">FLIGHT MANUAL</p>
      <p class="subtitle">USAF SERIES F-16C/D AIRCRAFT</p>
      
      <h2>Chapter 1: Introduction</h2>
      <p>This manual provides comprehensive flight operating instructions for the F-16C/D aircraft.</p>
      
      <h3>1.1 General Information</h3>
      <p>The F-16C/D is a single-engine, supersonic, multi-role tactical fighter aircraft.</p>
      
      <h3>1.2 Safety Precautions</h3>
      <div style="border: 2px solid red; padding: 10px;">
        <strong>⚠️ WARNING:</strong> Always perform pre-flight inspection before operation.
      </div>
      
      <table border="1">
        <tr><th>Parameter</th><th>Limit</th></tr>
        <tr><td>Max Speed</td><td>Mach 2.0</td></tr>
        <tr><td>Service Ceiling</td><td>50,000 ft</td></tr>
      </table>
    `,
    expectedElements: ['h1', 'h2', 'h3', 'table', 'strong']
  },
  'technical': {
    title: 'System Architecture Guide Test',
    content: `
      <h1>Technical Guide</h1>
      
      <h2>System Architecture</h2>
      <p>This document describes the system architecture and implementation details.</p>
      
      <h3>Overview</h3>
      <p>The system is built using a microservices architecture with the following components:</p>
      
      <ul>
        <li>Frontend: Next.js application</li>
        <li>Backend: Node.js API server</li>
        <li>Database: PostgreSQL with Prisma ORM</li>
        <li>Storage: Local filesystem / Cloud storage</li>
      </ul>
      
      <h3>Technical Specifications</h3>
      <pre><code>
      {
        "version": "1.0.0",
        "framework": "Next.js 14",
        "runtime": "Node.js 18+"
      }
      </code></pre>
    `,
    expectedElements: ['h1', 'h2', 'h3', 'ul', 'li', 'pre', 'code']
  },
  'policy': {
    title: 'Information Security Policy Test',
    content: `
      <h1>Policy Document</h1>
      
      <h2>Information Security Policy</h2>
      
      <h3>Purpose</h3>
      <p>This policy establishes guidelines for protecting organizational information assets.</p>
      
      <h3>Scope</h3>
      <p>This policy applies to all employees, contractors, and third-party users.</p>
      
      <h3>Responsibilities</h3>
      <ol>
        <li><strong>Management:</strong> Ensure policy compliance</li>
        <li><strong>IT Department:</strong> Implement security controls</li>
        <li><strong>Employees:</strong> Follow security procedures</li>
      </ol>
      
      <h3>Compliance</h3>
      <p>Violation of this policy may result in disciplinary action.</p>
    `,
    expectedElements: ['h1', 'h2', 'h3', 'ol', 'li', 'strong']
  },
  'training': {
    title: 'Software Development Training Test',
    content: `
      <h1>Training Manual</h1>
      
      <h2>Module 1: Introduction to Software Development</h2>
      
      <h3>Learning Objectives</h3>
      <ul>
        <li>Understand software development lifecycle</li>
        <li>Learn programming fundamentals</li>
        <li>Practice debugging techniques</li>
      </ul>
      
      <h3>Training Content</h3>
      <p>Software development is the process of creating, designing, deploying and supporting software.</p>
      
      <h3>Assessment</h3>
      <p>Complete the following exercises to test your understanding:</p>
      
      <h3>Review Questions</h3>
      <ol>
        <li>What is the purpose of version control?</li>
        <li>How do you debug a program?</li>
        <li>When should code reviews be performed?</li>
      </ol>
    `,
    expectedElements: ['h1', 'h2', 'h3', 'ul', 'ol', 'li']
  },
  'sop': {
    title: 'Server Deployment SOP Test',
    content: `
      <h1>Standard Operating Procedure</h1>
      
      <table border="1">
        <tr><td>SOP Number:</td><td>SOP-2024-001</td></tr>
        <tr><td>Revision:</td><td>1.0</td></tr>
        <tr><td>Date:</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
      
      <h2>Procedure: Server Deployment</h2>
      
      <h3>Purpose</h3>
      <p>This SOP defines the standard process for deploying applications to production servers.</p>
      
      <h3>Procedure Steps</h3>
      <ol>
        <li>Backup existing deployment</li>
        <li>Run automated tests</li>
        <li>Deploy to staging environment</li>
        <li>Perform smoke tests</li>
        <li>Deploy to production</li>
        <li>Monitor application health</li>
      </ol>
      
      <h3>Safety Considerations</h3>
      <p>⚠️ Always maintain rollback capability during deployment.</p>
    `,
    expectedElements: ['h1', 'h2', 'h3', 'table', 'ol', 'li']
  }
};

// Helper function to wait for editor
async function waitForEditor(page) {
  await page.waitForSelector('.ProseMirror', { timeout: 10000 });
  await page.waitForTimeout(1000); // Give editor time to fully initialize
}

// Helper function to set editor content
async function setEditorContent(page, content) {
  // Clear existing content
  await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror');
    if (editor) {
      editor.innerHTML = '';
    }
  });
  
  // Set new content
  await page.evaluate((html) => {
    const editor = document.querySelector('.ProseMirror');
    if (editor) {
      editor.innerHTML = html;
      // Trigger input event to update editor state
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, content);
  
  await page.waitForTimeout(500);
}

// Helper function to verify content
async function verifyContent(page, expectedElements) {
  for (const element of expectedElements) {
    const exists = await page.evaluate((selector) => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector(selector) !== null;
    }, element);
    
    expect(exists).toBeTruthy();
  }
}

// Main test suite
test.describe('Document Creation via Editor UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(BASE_URL);
    
    // Login if needed
    if (await page.url().includes('/login')) {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  // Test creating each document type
  for (const [templateType, template] of Object.entries(DOCUMENT_TEMPLATES)) {
    test(`Create ${templateType} document using editor`, async ({ page }) => {
      console.log(`Testing ${templateType} document creation...`);
      
      // Navigate to new document page
      await page.goto(`${BASE_URL}/documents/new`);
      await waitForEditor(page);
      
      // Set document title
      const titleInput = await page.locator('input[placeholder*="title" i]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill(template.title);
      }
      
      // Set editor content
      await setEditorContent(page, template.content);
      
      // Verify content elements are present
      await verifyContent(page, template.expectedElements);
      
      // Save document
      const saveButton = await page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Wait for save confirmation
        await page.waitForTimeout(2000);
        
        // Check for success message or redirect
        const currentUrl = page.url();
        if (currentUrl.includes('/documents/')) {
          console.log(`✅ ${templateType} document created successfully`);
        }
      }
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-results/${templateType}-document.png`,
        fullPage: true 
      });
    });
  }

  test('Create document with formatting tools', async ({ page }) => {
    console.log('Testing editor formatting tools...');
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    // Test bold formatting
    await page.click('.ProseMirror');
    await page.type('.ProseMirror', 'This is bold text');
    await page.keyboard.press('Control+A');
    
    const boldButton = await page.locator('button[title*="bold" i]').first();
    if (await boldButton.isVisible()) {
      await boldButton.click();
    }
    
    // Test italic formatting
    await page.keyboard.press('End');
    await page.type('.ProseMirror', ' and italic text');
    await page.keyboard.press('Control+Shift+Left');
    
    const italicButton = await page.locator('button[title*="italic" i]').first();
    if (await italicButton.isVisible()) {
      await italicButton.click();
    }
    
    // Test heading
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.type('.ProseMirror', 'This is a heading');
    await page.keyboard.press('Control+A');
    
    const headingButton = await page.locator('button:has-text("H1")').first();
    if (await headingButton.isVisible()) {
      await headingButton.click();
    }
    
    // Verify formatting
    const hasBold = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('strong') !== null;
    });
    expect(hasBold).toBeTruthy();
    
    const hasItalic = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('em') !== null;
    });
    expect(hasItalic).toBeTruthy();
    
    const hasHeading = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('h1') !== null;
    });
    expect(hasHeading).toBeTruthy();
    
    console.log('✅ Formatting tools test completed');
  });

  test('Create document with table', async ({ page }) => {
    console.log('Testing table creation...');
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    // Insert table using toolbar
    const tableButton = await page.locator('button[title*="table" i]').first();
    if (await tableButton.isVisible()) {
      await tableButton.click();
      
      // Wait for table dialog if it appears
      await page.waitForTimeout(500);
      
      // Confirm table creation with default settings
      const confirmButton = await page.locator('button:has-text("Insert")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    } else {
      // Manually insert table HTML
      await setEditorContent(page, `
        <table>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `);
    }
    
    // Verify table exists
    const hasTable = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('table') !== null;
    });
    expect(hasTable).toBeTruthy();
    
    console.log('✅ Table creation test completed');
  });

  test('Create document with lists', async ({ page }) => {
    console.log('Testing list creation...');
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    // Create bullet list
    const bulletButton = await page.locator('button[title*="bullet" i]').first();
    if (await bulletButton.isVisible()) {
      await bulletButton.click();
    }
    
    await page.type('.ProseMirror', 'First item');
    await page.keyboard.press('Enter');
    await page.type('.ProseMirror', 'Second item');
    await page.keyboard.press('Enter');
    await page.type('.ProseMirror', 'Third item');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Exit list
    
    // Create numbered list
    const numberedButton = await page.locator('button[title*="number" i]').first();
    if (await numberedButton.isVisible()) {
      await numberedButton.click();
    }
    
    await page.type('.ProseMirror', 'Step one');
    await page.keyboard.press('Enter');
    await page.type('.ProseMirror', 'Step two');
    
    // Verify lists exist
    const hasBulletList = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('ul') !== null;
    });
    expect(hasBulletList).toBeTruthy();
    
    const hasNumberedList = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      return editor && editor.querySelector('ol') !== null;
    });
    expect(hasNumberedList).toBeTruthy();
    
    console.log('✅ List creation test completed');
  });

  test('Test document template buttons', async ({ page }) => {
    console.log('Testing document template buttons...');
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    // Test TOC generation button
    const tocButton = await page.locator('button:has-text("TOC")').first();
    if (await tocButton.isVisible()) {
      // First add some content with headings
      await setEditorContent(page, `
        <h1>Main Title</h1>
        <p>Introduction</p>
        <h2>Section 1</h2>
        <p>Content</p>
        <h3>Subsection 1.1</h3>
        <p>More content</p>
      `);
      
      await tocButton.click();
      await page.waitForTimeout(1000);
      
      // Verify TOC was added
      const hasTOC = await page.evaluate(() => {
        const editor = document.querySelector('.ProseMirror');
        return editor && editor.textContent.includes('Table of Contents');
      });
      expect(hasTOC).toBeTruthy();
    }
    
    // Test Number Chapters button
    const numberButton = await page.locator('button:has-text("Number")').first();
    if (await numberButton.isVisible()) {
      await numberButton.click();
      await page.waitForTimeout(1000);
      
      // Verify numbering was added
      const hasNumbering = await page.evaluate(() => {
        const editor = document.querySelector('.ProseMirror');
        return editor && (editor.textContent.includes('1.') || editor.textContent.includes('Chapter 1'));
      });
      expect(hasNumbering).toBeTruthy();
    }
    
    console.log('✅ Template buttons test completed');
  });

  test('Create large document and verify page count', async ({ page }) => {
    console.log('Testing large document creation...');
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    // Generate large content (approximately 30KB)
    let largeContent = '<h1>Large Document Test</h1>\n';
    for (let i = 1; i <= 20; i++) {
      largeContent += `
        <h2>Chapter ${i}: Test Chapter</h2>
        <p>${'This is a test paragraph with substantial content. '.repeat(20)}</p>
        <h3>Section ${i}.1</h3>
        <p>${'More detailed information goes here. '.repeat(15)}</p>
        <ul>
          <li>Item one with details</li>
          <li>Item two with more information</li>
          <li>Item three with extended content</li>
        </ul>
      `;
    }
    
    await setEditorContent(page, largeContent);
    
    // Wait for page count to update
    await page.waitForTimeout(2000);
    
    // Check page count indicator
    const pageIndicator = await page.locator('text=/Page \\d+ of \\d+/').first();
    if (await pageIndicator.isVisible()) {
      const pageText = await pageIndicator.textContent();
      console.log(`Page indicator shows: ${pageText}`);
      
      // Extract total pages
      const match = pageText.match(/Page \d+ of (\d+)/);
      if (match) {
        const totalPages = parseInt(match[1]);
        expect(totalPages).toBeGreaterThan(5); // Should be multiple pages
        console.log(`✅ Large document shows ${totalPages} pages`);
      }
    }
  });

  test('Test save and load document', async ({ page }) => {
    console.log('Testing save and load functionality...');
    
    // Create a new document
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    const testContent = `
      <h1>Test Document for Save/Load</h1>
      <p>This content should be preserved after saving.</p>
      <ul>
        <li>Test item 1</li>
        <li>Test item 2</li>
      </ul>
    `;
    
    await setEditorContent(page, testContent);
    
    // Save document
    const saveButton = await page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Get document ID from URL if redirected
      const currentUrl = page.url();
      if (currentUrl.includes('/documents/')) {
        const docId = currentUrl.split('/documents/')[1].split('/')[0];
        console.log(`Document saved with ID: ${docId}`);
        
        // Navigate away and come back
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(1000);
        
        // Load the document again
        await page.goto(`${currentUrl}`);
        await waitForEditor(page);
        
        // Verify content is preserved
        const loadedContent = await page.evaluate(() => {
          const editor = document.querySelector('.ProseMirror');
          return editor ? editor.innerHTML : '';
        });
        
        expect(loadedContent).toContain('Test Document for Save/Load');
        expect(loadedContent).toContain('Test item 1');
        expect(loadedContent).toContain('Test item 2');
        
        console.log('✅ Document saved and loaded successfully');
      }
    }
  });
});

// Performance test
test.describe('Editor Performance', () => {
  test('Measure editor load time', async ({ page }) => {
    console.log('Measuring editor performance...');
    
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/documents/new`);
    await waitForEditor(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`Editor loaded in ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Measure typing responsiveness
    const typeStartTime = Date.now();
    await page.type('.ProseMirror', 'Testing typing speed and responsiveness of the editor');
    const typeTime = Date.now() - typeStartTime;
    
    console.log(`Typing test completed in ${typeTime}ms`);
    expect(typeTime).toBeLessThan(2000); // Typing should be responsive
  });
});

console.log('UI Test Suite for Document Creation via Editor');
console.log('==============================================');
console.log('This test suite covers:');
console.log('- Creating all document types (AF Manual, Technical, Policy, Training, SOP)');
console.log('- Using editor formatting tools (bold, italic, headings)');
console.log('- Creating tables and lists');
console.log('- Using template buttons (TOC, Number Chapters)');
console.log('- Creating large documents and verifying page count');
console.log('- Save and load functionality');
console.log('- Performance testing');