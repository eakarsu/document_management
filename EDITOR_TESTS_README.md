# Document Editor - Comprehensive Test Suite

## Overview

This test suite provides comprehensive end-to-end testing for the document editor, testing every button, toolbar, and feature with real browser interactions (not mocked).

## Test Document

The tests use the following document:
- **URL**: `http://localhost:3000/editor/cmgtc6j770001l138xfbc00vz`
- Make sure this document exists and is accessible before running tests

## What is Tested

### 1. **Navigation & Layout** ✓
- Back button
- Page title and layout
- Editor visibility
- Status indicators (page numbers, word count, character count)

### 2. **Text Formatting** ✓
- Bold (B button and Ctrl+B)
- Italic (I button and Ctrl+I)
- Underline (U button and Ctrl+U)
- Strikethrough (S button)
- Subscript (X₂ button)
- Superscript (X² button)

### 3. **Font Controls** ✓
- Font family dropdown (serif, sans-serif, Arial, Times New Roman, etc.)
- Font size dropdown (12px - 36px)

### 4. **Text Alignment** ✓
- Align Left
- Align Center
- Align Right
- Justify

### 5. **Color Options** ✓
- Text color picker
- Highlight color picker

### 6. **Document Tools** ✓
- Save button (with auto-save verification)
- Undo button (with Ctrl+Z shortcut)
- Redo button (with Ctrl+Y shortcut)
- Find & Replace button
- Print button

### 7. **Export Functionality** ✓
- Top-right Export button with dropdown menu
- Toolbar Export button with dropdown menu
- Export as PDF
- Export as Word (.docx)
- Export as HTML (with download verification)
- Export as Text

### 8. **Track Changes** ✓
- Track Changes toggle switch
- View Changes button
- Comments button

### 9. **Table Controls** ✓
- Table insertion
- Table manipulation (if cursor is in table)

### 10. **View Options** ✓
- Preview button
- View mode toggles (if supplements exist)

### 11. **Editor Functionality** ✓
- Typing and editing
- Content persistence
- Selection and manipulation
- Keyboard shortcuts

### 12. **Performance Testing** ✓
- Typing speed measurement
- Formatting performance
- Large content handling

### 13. **Error Handling** ✓
- Offline mode handling
- Network error graceful degradation

### 14. **Complete Workflow** ✓
- End-to-end editing workflow
- Save and verify persistence
- Format application
- Content verification

## Running the Tests

### Option 1: Using the Shell Script (Recommended)

```bash
./run-editor-tests.sh
```

This will:
- Install dependencies if needed
- Run all tests with browser visible (headed mode)
- Display detailed output
- Show pass/fail summary

### Option 2: Using npm/npx Directly

```bash
cd frontend
npx playwright test tests/editor-comprehensive.spec.js --headed
```

### Option 3: Run Specific Test

```bash
cd frontend
npx playwright test tests/editor-comprehensive.spec.js --grep "should test text formatting"
```

### Option 4: Run in Headless Mode (faster)

```bash
cd frontend
npx playwright test tests/editor-comprehensive.spec.js
```

## Test Options

- `--headed` - Show browser while testing (default in script)
- `--debug` - Run in debug mode with step-by-step execution
- `--timeout=60000` - Set timeout for long operations (60 seconds)
- `--reporter=list` - Show detailed list of test results
- `--grep "pattern"` - Run only tests matching pattern

## Prerequisites

1. **Node.js and npm** installed
2. **Playwright** installed (`npm install @playwright/test`)
3. **Application running** on `http://localhost:3000`
4. **Test document** exists at the specified ID

## Test Results

The tests will output:
- ✓ for passed tests
- ✗ for failed tests
- Detailed logs for each operation
- Performance metrics
- Download verification
- Error messages (if any)

## Expected Output Example

```
================================
Document Editor - Comprehensive Test
================================

Running Comprehensive Editor Tests...

✓ should load editor and display document (2.3s)
✓ should test top navigation buttons (1.5s)
✓ should test text formatting buttons (3.2s)
✓ should test font family and size dropdowns (2.1s)
✓ should test text alignment buttons (2.4s)
✓ should test color pickers (1.2s)
✓ should test Find & Replace button (2.8s)
✓ should test Export button with dropdown menu (2.5s)
✓ should test typing and editing in editor (3.1s)
✓ should test Save functionality (2.9s)
...

25 passed (45.2s)

✓ All tests passed successfully!
================================
```

## Troubleshooting

### Test Fails to Start
- Ensure application is running on localhost:3000
- Check that the document ID is correct and accessible
- Verify Playwright is installed: `npx playwright install`

### Tests Timeout
- Increase timeout: `--timeout=120000`
- Check if editor is loading slowly
- Verify network connectivity

### Tests Fail on Specific Buttons
- Check browser console for errors
- Verify button selectors are correct
- Run in debug mode: `--debug`

### Download Tests Fail
- Ensure download directory is writable
- Check browser download settings
- Verify export endpoints are working

## Test Structure

```
tests/
  └── editor-comprehensive.spec.js  # Main test file
      ├── Document Editor - Comprehensive Test Suite
      │   ├── Basic functionality tests
      │   ├── Button tests
      │   ├── Formatting tests
      │   ├── Export tests
      │   └── Workflow tests
      └── Document Editor - Error Handling
          └── Network error tests
```

## Continuous Integration

To run in CI/CD:

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run tests in headless mode
npx playwright test tests/editor-comprehensive.spec.js
```

## Maintenance

- Update document ID if test document changes
- Add new tests when new features are added
- Update selectors if UI changes
- Keep Playwright updated: `npm update @playwright/test`

## Test Coverage

Current coverage:
- ✅ All visible buttons and controls
- ✅ All keyboard shortcuts
- ✅ All export formats
- ✅ All formatting options
- ✅ Save and persistence
- ✅ Performance metrics
- ✅ Error handling

## Contributing

To add new tests:
1. Add test case to `editor-comprehensive.spec.js`
2. Follow naming convention: `should test [feature]`
3. Include console.log with ✓ for verification
4. Test both UI interaction and functionality
5. Update this README with new test coverage

## License

Part of Document Management System
