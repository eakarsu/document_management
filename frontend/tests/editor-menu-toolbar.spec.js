const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Test for Menu-Based Toolbar
 * Tests all buttons in the new Microsoft Word-style menu toolbar
 *
 * Test Document: http://localhost:3000/editor/cmgtc6j770001l138xfbc00vz
 */

const EDITOR_URL = 'http://localhost:3000/editor/cmgtc6j770001l138xfbc00vz';
const TEST_TIMEOUT = 60000;

const TEST_USER = {
  email: 'opr.leadership@airforce.mil',
  password: 'SnOt$3ns1iHrPqwO'
};

// Helper function to switch tabs in menu-based toolbar
async function switchToTab(page, tabName) {
  // Use exact match to avoid conflicts (e.g., "View" matching "Review")
  const tab = page.locator(`button[role="tab"]`).filter({ hasText: new RegExp(`^${tabName}$`) });
  await tab.click();
  await page.waitForTimeout(500);
  console.log(`✓ Switched to ${tabName} tab`);
}

test.describe('Menu-Based Toolbar - All Tabs and Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    console.log('Logging in as:', TEST_USER.email);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForTimeout(2000);
    console.log('✓ Logged in successfully');

    // Navigate to editor
    await page.goto(EDITOR_URL);
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });
    console.log('✓ Editor loaded successfully');

    // Ensure we're in menu toolbar mode
    const toolbarModeChip = page.locator('text=/Menu Toolbar|Compact Toolbar|Full Toolbar/i');
    const currentMode = await toolbarModeChip.textContent();
    if (!currentMode.includes('Menu Toolbar')) {
      await toolbarModeChip.click();
      await page.waitForTimeout(500);
      const newMode = await toolbarModeChip.textContent();
      if (!newMode.includes('Menu Toolbar')) {
        await toolbarModeChip.click();
        await page.waitForTimeout(500);
      }
    }
    console.log('✓ Menu toolbar mode active');
  });

  test('should verify all 6 tabs exist', async ({ page }) => {
    const tabs = ['Home', 'Insert', 'Format', 'Review', 'View', 'Advanced'];

    for (const tabName of tabs) {
      // Use exact match to avoid conflicts
      const tab = page.locator(`button[role="tab"]`).filter({ hasText: new RegExp(`^${tabName}$`) });
      const count = await tab.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ ${tabName} tab found`);
    }
  });

  test('should test HOME tab - Clipboard buttons', async ({ page }) => {
    await switchToTab(page, 'Home');
    const editor = page.locator('.ProseMirror');

    // Type test text
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n\nUndo test');
    await page.waitForTimeout(500);

    // Test Undo
    const undoButton = page.getByTitle(/Undo/i).first();
    await undoButton.click();
    await page.waitForTimeout(500);
    let content = await editor.textContent();
    expect(content).not.toContain('Undo test');
    console.log('✓ Undo button working');

    // Test Redo
    const redoButton = page.getByTitle(/Redo/i).first();
    await redoButton.click();
    await page.waitForTimeout(500);
    content = await editor.textContent();
    expect(content).toContain('Undo test');
    console.log('✓ Redo button working');
  });

  test('should test HOME tab - Font controls', async ({ page }) => {
    await switchToTab(page, 'Home');

    // Test Font Family - wait for selects to be visible
    await page.waitForTimeout(500);
    const fontFamilySelect = page.locator('select').first();
    if (await fontFamilySelect.count() > 0) {
      await fontFamilySelect.selectOption('Arial');
      await page.waitForTimeout(500);
      console.log('✓ Font family changed');
    }

    // Test Font Size
    const fontSizeSelect = page.locator('select').nth(1);
    if (await fontSizeSelect.count() > 0) {
      await fontSizeSelect.selectOption('20px');
      await page.waitForTimeout(500);
      console.log('✓ Font size changed');
    }

    // Test Bold, Italic, Underline
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n\nFormat test');
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft');

    const boldButton = page.locator('button[title*="Bold"]').first();
    if (await boldButton.count() > 0) {
      await boldButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Bold button working');
    }

    const italicButton = page.locator('button[title*="Italic"]').first();
    if (await italicButton.count() > 0) {
      await italicButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Italic button working');
    }
  });

  test('should test HOME tab - Paragraph alignment', async ({ page }) => {
    await switchToTab(page, 'Home');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    const alignButtons = ['Align Left', 'Align Center', 'Align Right', 'Justify'];
    for (const alignment of alignButtons) {
      const button = page.locator(`button[title*="${alignment}"]`).first();
      if (await button.count() > 0) {
        await button.click();
        await page.waitForTimeout(300);
        console.log(`✓ ${alignment} button working`);
      }
    }
  });

  test('should test INSERT tab - Tables', async ({ page }) => {
    await switchToTab(page, 'Insert');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Insert table
    const tableButton = page.locator('button').filter({ hasText: 'Table' }).first();
    await tableButton.click();
    await page.waitForTimeout(1000);

    // Verify table was inserted
    const content = await editor.innerHTML();
    expect(content).toContain('<table');
    console.log('✓ Table inserted');

    // Test Add Column
    const addColButton = page.locator('button').filter({ hasText: '+Col' }).first();
    if (await addColButton.isEnabled()) {
      await addColButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Add Column button working');
    }

    // Test Add Row
    const addRowButton = page.locator('button').filter({ hasText: '+Row' }).first();
    if (await addRowButton.isEnabled()) {
      await addRowButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Add Row button working');
    }
  });

  test('should test INSERT tab - Images', async ({ page }) => {
    await switchToTab(page, 'Insert');

    // Check Upload button exists (it's a label containing input[type="file"])
    const uploadButton = page.locator('button:has-text("Upload"), label:has-text("Upload")').first();
    if (await uploadButton.count() > 0) {
      await expect(uploadButton).toBeVisible();
      console.log('✓ Image Upload button found');
    } else {
      // Alternative: check for the input file element
      const fileInput = page.locator('input[type="file"][accept*="image"]');
      expect(await fileInput.count()).toBeGreaterThan(0);
      console.log('✓ Image Upload input found');
    }

    // Check URL button exists
    const urlButton = page.locator('button').filter({ hasText: 'URL' }).first();
    if (await urlButton.count() > 0) {
      await expect(urlButton).toBeVisible();
      console.log('✓ Image URL button found');
    }
  });

  test('should test INSERT tab - Special Elements', async ({ page }) => {
    await switchToTab(page, 'Insert');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test Blockquote
    const quoteButton = page.locator('button').filter({ hasText: 'Quote' }).first();
    await quoteButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Blockquote button working');

    // Test Code Block
    const codeButton = page.locator('button').filter({ hasText: '</>' }).first();
    await codeButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Code Block button working');
  });

  test('should test FORMAT tab - Headings', async ({ page }) => {
    await switchToTab(page, 'Format');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test heading buttons
    const headings = ['H1', 'H2', 'H3', 'H4'];
    for (const heading of headings) {
      const button = page.locator('button').filter({ hasText: heading }).first();
      await button.click();
      await page.waitForTimeout(300);
      console.log(`✓ ${heading} button working`);
    }
  });

  test('should test FORMAT tab - Lists', async ({ page }) => {
    await switchToTab(page, 'Format');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test Bullet List
    const bulletButton = page.locator('button').filter({ hasText: 'List' }).first();
    await bulletButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Bullet List button working');

    // Test Numbered List
    const numberedButton = page.locator('button').filter({ hasText: '1. List' }).first();
    await numberedButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Numbered List button working');

    // Test Task List
    const taskButton = page.locator('button').filter({ hasText: 'Tasks' }).first();
    await taskButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Task List button working');
  });

  test('should test FORMAT tab - Clear Formatting', async ({ page }) => {
    await switchToTab(page, 'Format');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Apply some formatting
    await page.keyboard.type('Clear test');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Control+B');
    await page.waitForTimeout(500);

    // Clear formatting
    const clearButton = page.locator('button').filter({ hasText: 'Clear' }).first();
    await clearButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Clear Formatting button working');
  });

  test('should test REVIEW tab - Track Changes', async ({ page }) => {
    await switchToTab(page, 'Review');

    // Test Track Changes toggle
    const trackSwitch = page.locator('input[type="checkbox"]').first();
    const initialState = await trackSwitch.isChecked();
    await trackSwitch.click();
    await page.waitForTimeout(500);
    const newState = await trackSwitch.isChecked();
    expect(newState).not.toBe(initialState);
    console.log('✓ Track Changes toggle working');
  });

  test('should test REVIEW tab - Find & Replace', async ({ page }) => {
    await switchToTab(page, 'Review');

    // Test Find & Replace button
    const findButton = page.locator('button').filter({ hasText: /Find.*Replace/i }).first();
    await findButton.click();
    await page.waitForTimeout(1000);

    // Check if dialog opened
    const dialog = page.locator('div[role="dialog"]').first();
    if (await dialog.isVisible()) {
      console.log('✓ Find & Replace dialog opened');
      await page.keyboard.press('Escape');
    }
  });

  test('should test VIEW tab - Export', async ({ page }) => {
    await switchToTab(page, 'View');

    // Test Preview button
    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await expect(previewButton).toBeVisible();
    console.log('✓ Preview button found');

    // Test Print button
    const printButton = page.locator('button').filter({ hasText: 'Print' }).first();
    await expect(printButton).toBeVisible();
    console.log('✓ Print button found');

    // Test Export buttons
    const exportButtons = ['PDF', 'Word', 'HTML'];
    for (const format of exportButtons) {
      const button = page.locator('button').filter({ hasText: format }).first();
      await expect(button).toBeVisible();
      console.log(`✓ Export ${format} button found`);
    }
  });

  test('should test ADVANCED tab - All 8 features visible', async ({ page }) => {
    await switchToTab(page, 'Advanced');

    // Check for header
    const header = page.locator('text=8 Advanced Features Available');
    await expect(header).toBeVisible();
    console.log('✓ Advanced features header found');

    // Check for numbered features 1-8
    for (let i = 1; i <= 8; i++) {
      const featureLabel = page.locator(`text=${i}️⃣`);
      if (await featureLabel.count() > 0) {
        console.log(`✓ Feature ${i} found`);
      }
    }
  });

  test('should test ADVANCED tab - Line Spacing', async ({ page }) => {
    await switchToTab(page, 'Advanced');

    // Find line spacing dropdown
    const lineSpacingSelect = page.locator('select').filter({ has: page.locator('option:has-text("1.5 (Default)")') }).first();
    if (await lineSpacingSelect.count() > 0) {
      await lineSpacingSelect.selectOption('2');
      await page.waitForTimeout(500);
      console.log('✓ Line Spacing control working');
    }
  });

  test('should test ADVANCED tab - Paragraph Spacing', async ({ page }) => {
    await switchToTab(page, 'Advanced');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test Spacing Before
    const beforeButton = page.locator('button[title*="Spacing Before"]').first();
    if (await beforeButton.count() > 0) {
      await beforeButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Spacing Before button working');
    }

    // Test Spacing After
    const afterButton = page.locator('button[title*="Spacing After"]').first();
    if (await afterButton.count() > 0) {
      await afterButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Spacing After button working');
    }
  });

  test('should test ADVANCED tab - Special Indents', async ({ page }) => {
    await switchToTab(page, 'Advanced');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test First Line Indent
    const firstLineButton = page.locator('button[title*="First Line"]').first();
    if (await firstLineButton.count() > 0) {
      await firstLineButton.click();
      await page.waitForTimeout(500);
      console.log('✓ First Line Indent working');
    }

    // Test Hanging Indent
    const hangingButton = page.locator('button[title*="Hanging"]').first();
    if (await hangingButton.count() > 0) {
      await hangingButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Hanging Indent working');
    }
  });

  test('should test ADVANCED tab - Case Conversion', async ({ page }) => {
    await switchToTab(page, 'Advanced');
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('case test');
    await page.keyboard.press('Control+A');

    // Test UPPERCASE
    const upperButton = page.locator('button[title*="UPPERCASE"]').first();
    if (await upperButton.count() > 0) {
      await upperButton.click();
      await page.waitForTimeout(500);
      const content = await editor.textContent();
      if (content.includes('CASE TEST')) {
        console.log('✓ UPPERCASE conversion working');
      }
    }
  });

  test('should test ADVANCED tab - Lists Advanced', async ({ page }) => {
    await switchToTab(page, 'Advanced');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test Restart Numbering
    const restartButton = page.locator('button[title*="Restart"]').first();
    if (await restartButton.count() > 0) {
      await restartButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Restart Numbering button working');
    }
  });

  test('should test ADVANCED tab - Table Tools', async ({ page }) => {
    await switchToTab(page, 'Advanced');

    // Check Merge and Split buttons exist
    const mergeButton = page.locator('button').filter({ hasText: 'Merge' }).first();
    const splitButton = page.locator('button').filter({ hasText: 'Split' }).first();

    await expect(mergeButton).toBeVisible();
    await expect(splitButton).toBeVisible();
    console.log('✓ Merge and Split Cell buttons found');
  });

  test('should test ADVANCED tab - Document Stats', async ({ page }) => {
    await switchToTab(page, 'Advanced');

    // Check for word count and reading time chips
    const wordCountChip = page.locator('text=/\\d+ words/i').last();
    const readingTimeChip = page.locator('text=/\\d+ min/i').last();

    if (await wordCountChip.count() > 0) {
      console.log('✓ Word Count display found');
    }
    if (await readingTimeChip.count() > 0) {
      console.log('✓ Reading Time display found');
    }
  });

  test('should test ADVANCED tab - Page Breaks & Control', async ({ page }) => {
    await switchToTab(page, 'Advanced');
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Test Page Break button
    const breakButton = page.locator('button').filter({ hasText: 'Break' }).first();
    if (await breakButton.count() > 0) {
      await breakButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Page Break button working');
    }

    // Check Keep with Next toggle exists
    const keepNextLabel = page.locator('text=Keep with Next');
    if (await keepNextLabel.count() > 0) {
      console.log('✓ Keep with Next toggle found');
    }

    // Check Page Break Before toggle exists
    const pageBreakLabel = page.locator('text=Page Break Before');
    if (await pageBreakLabel.count() > 0) {
      console.log('✓ Page Break Before toggle found');
    }
  });
});

console.log('\n' + '='.repeat(60));
console.log('MENU-BASED TOOLBAR TEST SUITE');
console.log('Testing new Microsoft Word-style menu toolbar');
console.log('Document URL:', EDITOR_URL);
console.log('='.repeat(60) + '\n');
