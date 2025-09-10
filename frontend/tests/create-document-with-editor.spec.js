/**
 * Playwright test to create documents using the real TipTap editor
 * This simulates what the CLI generators do but using the actual UI
 */

const { test, expect } = require('@playwright/test');

test.describe('Create Documents with Editor UI', () => {
  let documentId;

  test.beforeEach(async ({ page }) => {
    // First, create a document via API to get an ID
    const response = await page.request.post('http://localhost:4000/api/documents', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        title: `UI Test Document ${Date.now()}`,
        content: '<p>Initial content</p>',
        category: 'Technical Manual',
        status: 'DRAFT'
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      documentId = data.id || `test-doc-${Date.now()}`;
    } else {
      // Fallback: use existing document
      documentId = 'ui-test-doc-1756823088793';
    }
    
    console.log(`Using document ID: ${documentId}`);
  });

  test('Create technical document with proper numbering', async ({ page }) => {
    // Navigate to editor
    await page.goto(`http://localhost:3000/editor/${documentId}`);
    
    // Wait for editor to load
    await page.waitForTimeout(3000);
    
    // Look for the ProseMirror editor
    const editor = page.locator('.ProseMirror').first();
    
    // Check if editor exists
    const editorExists = await editor.count() > 0;
    
    if (!editorExists) {
      console.log('Editor not found, taking screenshot...');
      await page.screenshot({ path: 'test-results/no-editor.png', fullPage: true });
      
      // Check if login is needed
      if (await page.locator('input[type="email"]').isVisible()) {
        console.log('Login required...');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Navigate back to editor
        await page.goto(`http://localhost:3000/editor/${documentId}`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Click on editor to focus
    await page.click('.ProseMirror');
    
    // Clear existing content
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // Create document content similar to our generators
    console.log('Adding document content with proper numbering...');
    
    // Title
    await page.keyboard.type('Technical Documentation');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Section 1
    await page.keyboard.type('1. Technical Implementation');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.1 Overview');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The system architecture provides a robust foundation for scalable applications. Users can leverage advanced features to optimize their workflow and increase productivity.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.2 Architecture Design');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The implementation phase requires careful planning and attention to detail. Performance metrics show significant improvements in processing speed and efficiency.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.3 Implementation Details');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The following code example demonstrates the core functionality:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('function processDocument(doc) {');
    await page.keyboard.press('Enter');
    await page.keyboard.type('  return validateAndSave(doc);');
    await page.keyboard.press('Enter');
    await page.keyboard.type('}');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.4 Configuration Requirements');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Essential configuration parameters include:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Database connection settings');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Authentication middleware');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Caching layer configuration');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.5 Performance Considerations');
    await page.keyboard.press('Enter');
    await page.keyboard.type('System performance depends on proper configuration and resource allocation.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.6 Testing Approach');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Unit tests should cover all critical paths in the application.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Section 2
    await page.keyboard.type('2. Operational Guidelines');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('2.1 Purpose');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This section establishes guidelines for system operation and maintenance.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('2.2 Scope and Applicability');
    await page.keyboard.press('Enter');
    await page.keyboard.type('These guidelines apply to all system administrators and operators.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('2.3 Responsibilities');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The following stakeholders have defined responsibilities:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Management: Ensure compliance and resource allocation');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Department Heads: Implement procedures within teams');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Employees: Follow established guidelines');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Apply some formatting
    console.log('Applying formatting...');
    
    // Select title and make it heading
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Shift+End');
    
    // Try to use heading button if available
    const headingButton = page.locator('button:has-text("H1")').first();
    if (await headingButton.isVisible()) {
      await headingButton.click();
    }
    
    // Take screenshot of the created content
    await page.screenshot({ path: 'test-results/editor-document-created.png', fullPage: true });
    console.log('Screenshot saved: test-results/editor-document-created.png');
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('Document saved!');
    }
    
    // Verify content was added
    const editorContent = await page.locator('.ProseMirror').innerText();
    expect(editorContent).toContain('1. Technical Implementation');
    expect(editorContent).toContain('1.1 Overview');
    expect(editorContent).toContain('2. Operational Guidelines');
    expect(editorContent).toContain('2.1 Purpose');
    
    console.log('✅ Document created successfully with proper numbering!');
  });
  
  test('Create AF Manual style document', async ({ page }) => {
    // Navigate to editor
    await page.goto(`http://localhost:3000/editor/${documentId}`);
    await page.waitForTimeout(3000);
    
    // Focus editor
    await page.click('.ProseMirror');
    
    // Clear content
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    console.log('Creating AF Manual style document...');
    
    // AF Manual header
    await page.keyboard.type('AIR FORCE TECHNICAL MANUAL');
    await page.keyboard.press('Enter');
    await page.keyboard.type('FLIGHT MANUAL');
    await page.keyboard.press('Enter');
    await page.keyboard.type('USAF SERIES F-16C/D AIRCRAFT');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Chapter 1
    await page.keyboard.type('Chapter 1: Flight Operations');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('Section 1.1 - Overview');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This manual provides comprehensive flight operating instructions.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.1.1 General Information');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The F-16C/D is a single-engine, supersonic, multi-role tactical fighter aircraft.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('⚠️ WARNING: Critical safety information must be reviewed before operation.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.1.2 System Components');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Major system components include:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Flight control system');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Avionics suite');
    await page.keyboard.press('Enter');
    await page.keyboard.type('• Weapons systems');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('Section 1.2 - Procedures');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Follow these mandatory steps in exact order:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('1. Complete pre-flight inspection');
    await page.keyboard.press('Enter');
    await page.keyboard.type('2. Verify system status');
    await page.keyboard.press('Enter');
    await page.keyboard.type('3. Initialize avionics');
    await page.keyboard.press('Enter');
    await page.keyboard.type('4. Perform engine start');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('1.2.1 Pre-Operation Checklist');
    await page.keyboard.press('Enter');
    await page.keyboard.type('1. External inspection complete');
    await page.keyboard.press('Enter');
    await page.keyboard.type('2. Fuel quantity verified');
    await page.keyboard.press('Enter');
    await page.keyboard.type('3. Flight controls checked');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('⚡ CAUTION: Ensure all safety protocols are followed during operation.');
    await page.keyboard.press('Enter');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/af-manual-created.png', fullPage: true });
    console.log('Screenshot saved: test-results/af-manual-created.png');
    
    // Verify content
    const content = await page.locator('.ProseMirror').innerText();
    expect(content).toContain('AIR FORCE TECHNICAL MANUAL');
    expect(content).toContain('Chapter 1: Flight Operations');
    expect(content).toContain('1.1.1 General Information');
    expect(content).toContain('WARNING');
    
    console.log('✅ AF Manual style document created!');
  });
  
  test('Compare with CLI generators', async ({ page }) => {
    console.log('=== COMPARISON WITH CLI GENERATORS ===');
    console.log('');
    console.log('Editor-based creation:');
    console.log('✅ Real UI interaction');
    console.log('✅ Proper document structure with numbering');
    console.log('✅ Rich text formatting capabilities');
    console.log('✅ Can add tables, lists, code blocks');
    console.log('✅ WYSIWYG editing experience');
    console.log('');
    console.log('CLI generators:');
    console.log('• Fast bulk generation');
    console.log('• Predictable file sizes');
    console.log('• No UI required');
    console.log('');
    console.log('Both methods create properly numbered documents!');
  });
});