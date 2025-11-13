# Comprehensive Workflow E2E Test Instructions

## Overview
This test automates the complete 10-stage hierarchical distributed workflow, simulating all user interactions through the UI.

## Test Details
- **Document ID**: `cmfn33ifj000pfjsqyo04fb7p`
- **Document Title**: AIR FORCE INSTRUCTION 36-2903
- **Total Stages**: 10
- **Total Users**: 11 unique users
- **Expected Duration**: ~5-10 minutes

## Prerequisites

1. **Backend Server Running**:
   ```bash
   cd backend
   npm run dev
   # Should be running on http://localhost:4000
   ```

2. **Frontend Server Running**:
   ```bash
   cd frontend
   npm run dev
   # Should be running on http://localhost:3000
   ```

3. **Database Ready**:
   - Document `cmfn33ifj000pfjsqyo04fb7p` must exist
   - All test users must exist with correct roles
   - Workflow should be at Stage 1 (or reset it first)

## Running the Test

### Option 1: Run Full Workflow Test
```bash
cd frontend
npx playwright test tests/full-workflow-ui-buttons.spec.js
```

### Option 2: Run with UI Mode (Interactive)
```bash
cd frontend
npx playwright test tests/full-workflow-ui-buttons.spec.js --ui
```

### Option 3: Run with Headed Browser (Watch it happen)
```bash
cd frontend
npx playwright test tests/full-workflow-ui-buttons.spec.js --headed
```

### Option 4: Debug Mode
```bash
cd frontend
npx playwright test tests/full-workflow-ui-buttons.spec.js --debug
```

## Test Users
All users use password: `testpass123`

| Stage | User Email | Role | Actions |
|-------|------------|------|---------|
| 1 | ao1@airforce.mil | ACTION_OFFICER | Create draft, Submit to Legal |
| 2 | legal.reviewer@airforce.mil | LEGAL | Review, Approve to Coordinator |
| 3 | coordinator@airforce.mil | COORDINATOR | Distribute to 5 reviewers |
| 3.5 | reviewer.one@airforce.mil | REVIEWER | Submit technical feedback |
| 3.5 | reviewer.two@airforce.mil | REVIEWER | Submit policy feedback |
| 3.5 | reviewer.three@airforce.mil | REVIEWER | Submit operations feedback |
| 3.5 | reviewer.four@airforce.mil | REVIEWER | Submit finance feedback |
| 3.5 | reviewer.five@airforce.mil | REVIEWER | Submit personnel feedback |
| 4 | ao1@airforce.mil | ACTION_OFFICER | Incorporate 50 comments |
| 5 | legal.reviewer@airforce.mil | LEGAL | Second legal review |
| 6 | ao1@airforce.mil | ACTION_OFFICER | Second OPR update |
| 7 | legal.reviewer@airforce.mil | LEGAL | Final legal review |
| 8 | ao1@airforce.mil | ACTION_OFFICER | Post-legal update |
| 9 | opr.leadership@airforce.mil | LEADERSHIP | Leadership approval |
| 10 | afdpo.publisher@airforce.mil | AFDPO | Final check & Publish |

## What the Test Does

### Stage-by-Stage Actions:

1. **Stage 1**: Action Officer submits initial draft → Clicks "Submit to Legal Review"
2. **Stage 2**: Legal reviews and approves → Clicks "Approve and Send to Coordinator"
3. **Stage 3**: Coordinator distributes → Opens modal, selects 5 reviewers, clicks "Send to Reviewers"
4. **Stage 3.5**: Each reviewer submits feedback → 5 users each click "Submit Review"
5. **Coordinator**: Collects feedback → Clicks "Send to Action Officer"
6. **Stage 4**: AO incorporates feedback → Clicks "Submit to Legal Review"
7. **Stage 5**: Second legal review → Clicks "Approve"
8. **Stage 6**: Second OPR update → Clicks "Submit to Legal"
9. **Stage 7**: Final legal review → Clicks "Final Approval"
10. **Stage 8**: Post-legal OPR update → Clicks "Submit to Leadership"
11. **Stage 9**: Leadership review → Clicks "Approve"
12. **Stage 10**: AFDPO publication → Clicks "Final Publication Check" then "Publish Document"

## Expected Results

✅ **Success Indicators**:
- All 10 stages complete without errors
- Document status changes to "PUBLISHED"
- "Workflow Complete" message appears
- All stage nodes show checkmarks
- Total time: ~5-10 minutes

❌ **Common Issues**:
- **Timeout errors**: Increase timeout in test config
- **Element not found**: Check if UI has changed
- **Login fails**: Verify user credentials in database
- **Button disabled**: Check user roles and permissions
- **Workflow stuck**: Reset workflow and try again

## Reset Workflow (if needed)

If you need to reset the workflow to start over:

```javascript
// Run this script to reset workflow
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetWorkflow() {
  await prisma.jsonWorkflowInstance.updateMany({
    where: { documentId: 'cmfn33ifj000pfjsqyo04fb7p' },
    data: {
      currentStageId: '1',
      isActive: true,
      completedAt: null
    }
  });

  await prisma.document.update({
    where: { id: 'cmfn33ifj000pfjsqyo04fb7p' },
    data: { status: 'DRAFT' }
  });

  console.log('Workflow reset to Stage 1');
  await prisma.$disconnect();
}

resetWorkflow();
```

## Viewing Test Results

After running the test, you can:

1. **View HTML Report**:
   ```bash
   npx playwright show-report
   ```

2. **Check Screenshots** (if test fails):
   ```bash
   ls test-results/
   ```

3. **View Videos** (if configured):
   ```bash
   ls test-results/videos/
   ```

## Troubleshooting

### If test fails at specific stage:

1. **Check console output** - Shows which button click failed
2. **Run in headed mode** - Watch what happens visually
3. **Use debug mode** - Step through each action
4. **Check browser console** - Look for JavaScript errors
5. **Verify database state** - Ensure workflow is in correct state

### Common Fixes:

- **Clear browser cache**: Sometimes old state causes issues
- **Restart servers**: Both frontend and backend
- **Reset database**: Use the reset script above
- **Update selectors**: If UI has changed, update button text in test

## CI/CD Integration

To run in CI/CD pipeline:

```yaml
# .github/workflows/e2e-test.yml
name: E2E Workflow Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Summary

This comprehensive test ensures the entire 10-stage workflow functions correctly by:
- Logging in as 11 different users
- Clicking actual UI buttons
- Simulating real user interactions
- Verifying stage transitions
- Confirming final publication

The test provides confidence that the workflow system works end-to-end as designed.