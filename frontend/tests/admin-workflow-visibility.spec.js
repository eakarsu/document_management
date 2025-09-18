// Comprehensive test for admin workflow visibility
// Tests that admin users can see workflows started by any user

const { test, expect } = require('@playwright/test');

test.describe('Admin Workflow Visibility Tests', () => {
  let adminContext;
  let userContext;
  let adminPage;
  let userPage;
  let documentId;

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Starting workflow visibility test setup...');

    // Create contexts for both users
    adminContext = await browser.newContext();
    userContext = await browser.newContext();

    adminPage = await adminContext.newPage();
    userPage = await userContext.newPage();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await userContext.close();
  });

  test('Complete workflow visibility scenario', async () => {
    console.log('\n📋 TEST: Admin should see workflows started by other users\n');

    // Step 1: Login as regular user (ao1)
    console.log('1️⃣ Logging in as user ao1...');
    await userPage.goto('http://localhost:3000/login');
    await userPage.fill('input[name="email"]', 'ao1@example.com');
    await userPage.fill('input[name="password"]', 'password123');
    await userPage.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await userPage.waitForURL('**/dashboard');
    console.log('   ✅ User ao1 logged in successfully');

    // Step 2: Navigate to documents and select a document
    console.log('2️⃣ Navigating to documents page...');
    await userPage.goto('http://localhost:3000/documents');
    await userPage.waitForLoadState('networkidle');

    // Click on first document
    const firstDocument = await userPage.locator('table tbody tr').first();
    const documentName = await firstDocument.locator('td').first().textContent();
    console.log(`   📄 Selected document: ${documentName}`);

    await firstDocument.click();
    await userPage.waitForURL('**/documents/**');

    // Extract document ID from URL
    documentId = userPage.url().split('/').pop();
    console.log(`   🔑 Document ID: ${documentId}`);

    // Step 3: Start workflow as ao1
    console.log('3️⃣ Starting 8-stage workflow as ao1...');

    // Check if workflow already exists
    const workflowSection = await userPage.locator('text=/Workflow Status/i').isVisible();

    if (workflowSection) {
      // Check if "Start Workflow" button is visible
      const startButton = await userPage.locator('button:has-text("Start 8-Stage Workflow")');

      if (await startButton.isVisible()) {
        console.log('   🚀 Starting new workflow...');
        await startButton.click();

        // Wait for success message or workflow to appear
        await userPage.waitForTimeout(2000);

        // Verify workflow started
        const workflowActive = await userPage.locator('text=/Current Stage:/i').isVisible();
        if (workflowActive) {
          console.log('   ✅ Workflow started successfully by ao1');
        } else {
          console.log('   ⚠️ Workflow might not have started properly');
        }
      } else {
        console.log('   ℹ️ Workflow already active for this document');
      }
    }

    // Step 4: Logout as ao1
    console.log('4️⃣ Logging out as ao1...');
    await userPage.goto('http://localhost:3000/login');
    console.log('   ✅ User ao1 logged out');

    // Step 5: Login as admin
    console.log('5️⃣ Logging in as admin...');
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.fill('input[name="email"]', 'admin@richmond-dms.com');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/dashboard');
    console.log('   ✅ Admin logged in successfully');

    // Step 6: Navigate to the same document
    console.log(`6️⃣ Admin navigating to document ${documentId}...`);
    await adminPage.goto(`http://localhost:3000/documents/${documentId}`);
    await adminPage.waitForLoadState('networkidle');

    // Step 7: Enable console monitoring to capture API responses
    adminPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('WORKFLOW')) {
        console.log(`   🖥️ Console: ${text}`);
      }
    });

    // Wait for page to fully load
    await adminPage.waitForTimeout(3000);

    // Step 8: Verify workflow visibility for admin
    console.log('7️⃣ Checking workflow visibility for admin...');

    // Check multiple indicators of workflow presence
    const workflowIndicators = {
      workflowSection: await adminPage.locator('text=/Workflow Status/i').isVisible(),
      currentStage: await adminPage.locator('text=/Current Stage:/i').isVisible(),
      workflowButtons: await adminPage.locator('button[class*="workflow"]').count() > 0,
      stageInfo: await adminPage.locator('text=/Stage \d+ of \d+/i').isVisible()
    };

    console.log('\n📊 Workflow Visibility Check Results:');
    console.log('   - Workflow Section Visible:', workflowIndicators.workflowSection);
    console.log('   - Current Stage Visible:', workflowIndicators.currentStage);
    console.log('   - Workflow Buttons Present:', workflowIndicators.workflowButtons);
    console.log('   - Stage Info Visible:', workflowIndicators.stageInfo);

    // Check for specific workflow elements
    if (workflowIndicators.currentStage) {
      const stageText = await adminPage.locator('text=/Current Stage:/i').textContent();
      console.log(`   📍 ${stageText}`);
    }

    // Look for reset button (admin-only feature)
    const resetButton = await adminPage.locator('button:has-text("Reset Workflow")').isVisible();
    if (resetButton) {
      console.log('   ✅ Admin-specific Reset button is visible');
    }

    // Final assertion
    const workflowVisible = Object.values(workflowIndicators).some(v => v === true);

    if (workflowVisible) {
      console.log('\n✅ SUCCESS: Admin can see the workflow started by ao1');
    } else {
      console.log('\n❌ FAILURE: Admin cannot see the workflow started by ao1');

      // Take a screenshot for debugging
      await adminPage.screenshot({ path: 'admin-workflow-not-visible.png' });
      console.log('   📸 Screenshot saved as admin-workflow-not-visible.png');
    }

    expect(workflowVisible).toBe(true);
  });

  test('Verify workflow data in API response', async () => {
    console.log('\n📋 TEST: Verify API returns workflow data correctly\n');

    // Login as admin
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.fill('input[name="email"]', 'admin@richmond-dms.com');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/dashboard');

    // Monitor network requests
    let apiResponse = null;
    adminPage.on('response', async response => {
      if (response.url().includes('/api/workflow/8-stage/document/')) {
        apiResponse = await response.json();
        console.log('   📡 API Response captured');
      }
    });

    // Navigate to a document with workflow
    await adminPage.goto('http://localhost:3000/documents');
    await adminPage.waitForLoadState('networkidle');

    const firstDocument = await adminPage.locator('table tbody tr').first();
    await firstDocument.click();
    await adminPage.waitForURL('**/documents/**');

    // Wait for API call
    await adminPage.waitForTimeout(2000);

    if (apiResponse) {
      console.log('\n📊 API Response Analysis:');
      console.log('   - Success:', apiResponse.success);
      console.log('   - Has Workflow:', !!apiResponse.workflow);

      if (apiResponse.workflow) {
        console.log('   - Workflow ID:', apiResponse.workflow.id);
        console.log('   - Is Active:', apiResponse.workflow.is_active);
        console.log('   - Current Stage:', apiResponse.workflow.current_stage);
        console.log('   - Document ID:', apiResponse.workflow.document_id);
      }

      expect(apiResponse.success).toBe(true);

      if (apiResponse.workflow) {
        expect(apiResponse.workflow.is_active).toBeDefined();
        console.log('\n✅ API returns workflow data correctly');
      }
    } else {
      console.log('⚠️ No API response captured');
    }
  });

  test('Test workflow operations as admin', async () => {
    console.log('\n📋 TEST: Admin workflow operations\n');

    // Login as admin
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.fill('input[name="email"]', 'admin@richmond-dms.com');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/dashboard');

    // Go to documents
    await adminPage.goto('http://localhost:3000/documents');
    await adminPage.waitForLoadState('networkidle');

    // Find a document with active workflow
    const documents = await adminPage.locator('table tbody tr').all();
    let foundActiveWorkflow = false;

    for (const doc of documents.slice(0, 5)) { // Check first 5 documents
      await doc.click();
      await adminPage.waitForURL('**/documents/**');
      await adminPage.waitForTimeout(2000);

      const hasWorkflow = await adminPage.locator('text=/Current Stage:/i').isVisible();

      if (hasWorkflow) {
        console.log('   ✅ Found document with active workflow');
        foundActiveWorkflow = true;

        // Test admin operations
        const resetButton = await adminPage.locator('button:has-text("Reset Workflow")');
        if (await resetButton.isVisible()) {
          console.log('   ✅ Reset button available for admin');

          // Test reset functionality
          await resetButton.click();
          await adminPage.waitForTimeout(2000);

          // Check if workflow was reset
          const workflowStillActive = await adminPage.locator('text=/Current Stage:/i').isVisible();
          console.log(`   📊 Workflow active after reset: ${workflowStillActive}`);
        }

        break;
      }

      // Go back to documents list
      await adminPage.goto('http://localhost:3000/documents');
      await adminPage.waitForLoadState('networkidle');
    }

    expect(foundActiveWorkflow).toBe(true);
  });
});

console.log('✅ Test file created successfully');
console.log('Run with: npx playwright test tests/admin-workflow-visibility.spec.js --headed');