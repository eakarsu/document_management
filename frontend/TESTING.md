# Document Generation Testing

This document explains how to use both the document generator and the UI test for creating documents.

## Document Generator (Backend/API)

Creates documents directly via API calls to the database.

### Usage
```bash
cd /Users/erolakarsu/projects/document_management/backend
node document-generator-size.js <template> <size_kb> <feedbacks> [title]
```

### Examples
```bash
# Create 30KB technical document with 5 feedbacks
node document-generator-size.js technical 30 5

# Create 50KB safety document with 10 feedbacks
node document-generator-size.js safety 50 10 "Custom Safety Manual"

# Create 100KB operational document with no feedbacks
node document-generator-size.js operational 100 0
```

### Features
- Creates documents directly in database
- Very accurate size control (±0.1KB)
- Fast execution (~2 seconds)
- Supports feedback entries in customFields.draftFeedback

## UI Test (Frontend/Playwright)

Creates documents via the web interface using Playwright automation.

### Usage
```bash
cd /Users/erolakarsu/projects/document_management/frontend
node run-ui-test.js <template> <size_kb> <feedbacks>
```

### Examples
```bash
# Create 30KB technical document with 5 feedbacks via UI
node run-ui-test.js technical 30 5

# Create 25KB safety document with 3 feedbacks via UI
node run-ui-test.js safety 25 3

# Create 10KB operational document with no feedbacks via UI
node run-ui-test.js operational 10 0
```

### Features
- Uses real browser automation
- Tests the actual UI editor (TipTap/ProseMirror)
- Handles authentication properly
- Takes screenshots of results
- Slower execution (~10-15 seconds)

## Supported Templates

Both tools support these templates:

1. **technical** - Technical manuals with calibration, verification procedures
2. **safety** - Safety guidelines with hazard prevention, emergency procedures  
3. **operational** - Operational procedures with daily operations, quality control
4. **maintenance** - Maintenance manuals with preventive maintenance, repair procedures
5. **training** - Training guides with learning objectives, practical exercises

## Size Accuracy

- **Generator**: Very accurate (±0.1KB) - directly controls content size
- **UI Test**: Good accuracy (±1KB) - generates content then measures result

## Authentication

- **Generator**: Uses direct database access (no auth needed)
- **UI Test**: Uses admin@demo.mil / password123 credentials via backend API

## Feedback Support

Both tools can create feedback entries:
- **Generator**: Stores in customFields.draftFeedback
- **UI Test**: Adds via feedback UI (if available)

## Comparison Results

Example results comparing both methods:

```
Document Generator: Creates 30.93 KB documents via API
Playwright UI Test: Creates 30.64 KB documents via editor
✅ Both create documents with same structure!
```

## Running Tests

### Prerequisites
- Backend server running on http://localhost:4000
- Frontend server running on http://localhost:3002
- PostgreSQL database accessible
- Playwright installed (`npx playwright install`)

### Quick Test
```bash
# Generate document via API
cd backend
node document-generator-size.js technical 20 3

# Test same document via UI  
cd ../frontend
node run-ui-test.js technical 20 3
```

## Troubleshooting

### UI Test Issues
- **"Could not find editor"**: Make sure frontend is running and accessible
- **"Authentication failed"**: Check backend is running and credentials are correct
- **Timeout**: Reduce document size or feedbacks for faster execution

### Generator Issues
- **Database connection**: Check PostgreSQL is running and accessible
- **Missing fields**: Verify Prisma schema matches database structure
- **Permission errors**: Ensure write access to database

## Output Files

### Generator
- Creates document in database
- Logs document ID and metrics to console

### UI Test  
- Creates document in database via UI
- Saves screenshot to `test-results/generic-{template}-{size}kb.png`
- Logs detailed execution steps
- Creates Playwright test report