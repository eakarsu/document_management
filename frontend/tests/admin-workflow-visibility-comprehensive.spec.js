// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin Workflow Visibility - Comprehensive Test', () => {
  let documentId;
  const baseUrl = 'http://localhost:3000';

  test('Complete workflow visibility test: AO1 starts workflow, Admin sees it', async ({ page, context }) => {
    console.log('Starting comprehensive workflow visibility test...');

    // Step 1: Login as AO1 and create a new document
    console.log('\n1. LOGGING IN AS AO1...');
    await page.goto(baseUrl + '/login');
    await page.fill('input[name="email"]', 'ao1@airforce.mil');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents');
    console.log('✓ AO1 logged in successfully');

    // Step 2: Create a new document as AO1
    console.log('\n2. CREATING NEW DOCUMENT AS AO1...');
    await page.click('text="Create Document"');
    await page.waitForTimeout(1000);

    // Fill in document details
    const timestamp = new Date().getTime();
    const docTitle = `Test Document ${timestamp}`;
    await page.fill('input[name="title"]', docTitle);
    await page.fill('textarea[name="content"]', 'Test content for workflow visibility test');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);

    // Get the document ID from URL
    await page.waitForURL(/\/documents\/[a-z0-9]+/);
    const url = page.url();
    documentId = url.split('/documents/')[1].split('?')[0];
    console.log(`✓ Document created with ID: ${documentId}`);

    // Step 3: Start workflow as AO1
    console.log('\n3. STARTING WORKFLOW AS AO1...');
    await page.goto(`${baseUrl}/documents/${documentId}`);
    await page.waitForTimeout(2000);

    // Look for workflow controls
    const startWorkflowButton = page.locator('button:has-text("Start Workflow"), button:has-text("Start Selected Workflow")').first();

    if (await startWorkflowButton.isVisible()) {
      console.log('Found start workflow button');

      // Check if there's a workflow selector
      const workflowSelector = page.locator('select, [role="combobox"]').first();
      if (await workflowSelector.isVisible()) {
        console.log('Selecting hierarchical workflow...');
        await workflowSelector.click();
        await page.click('text="Hierarchical Distributed Review Workflow"');
      }

      await startWorkflowButton.click();
      console.log('Clicked start workflow button');
      await page.waitForTimeout(3000);

      // Verify workflow started
      const workflowStatus = page.locator('text=/Stage|Current Stage|Workflow Status/i').first();
      if (await workflowStatus.isVisible()) {
        console.log('✓ Workflow started successfully as AO1');
      }
    } else {
      console.log('⚠ No Start Workflow button found - checking if workflow already exists');
    }

    // Step 4: Logout AO1
    console.log('\n4. LOGGING OUT AO1...');
    await page.click('button:has-text("Logout"), [aria-label="Logout"]');
    await page.waitForURL('**/login');
    console.log('✓ AO1 logged out');

    // Step 5: Login as Admin
    console.log('\n5. LOGGING IN AS ADMIN...');
    await page.goto(baseUrl + '/login');
    await page.fill('input[name="email"]', 'admin@airforce.mil');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents');
    console.log('✓ Admin logged in successfully');

    // Step 6: Navigate to the SAME document
    console.log(`\n6. NAVIGATING TO DOCUMENT ${documentId} AS ADMIN...`);
    await page.goto(`${baseUrl}/documents/${documentId}`);
    await page.waitForTimeout(3000);

    // Step 7: Check workflow visibility for Admin
    console.log('\n7. CHECKING WORKFLOW VISIBILITY FOR ADMIN...');

    // Take screenshot for debugging
    await page.screenshot({ path: 'admin-workflow-view.png', fullPage: true });

    // Check multiple possible workflow indicators
    const workflowIndicators = [
      page.locator('text=/Stage.*1|Current Stage|Initial Draft/i'),
      page.locator('text=/Workflow.*Active|Active Workflow/i'),
      page.locator('text=/Hierarchical.*Workflow/i'),
      page.locator('[data-testid="workflow-status"]'),
      page.locator('.workflow-status'),
      page.locator('text="Initial Draft Preparation"')
    ];

    let workflowVisible = false;
    for (const indicator of workflowIndicators) {
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        workflowVisible = true;
        const text = await indicator.textContent();
        console.log(`✓ Found workflow indicator: ${text}`);
        break;
      }
    }

    // Check console logs
    await page.evaluate(() => {
      console.log('PAGE STATE CHECK:', {
        url: window.location.href,
        title: document.title,
        workflowElements: document.querySelectorAll('[class*="workflow"]').length
      });
    });

    // Final assertion
    expect(workflowVisible).toBeTruthy();
    console.log('\n✅ TEST PASSED: Admin can see the workflow started by AO1');
  });

  test('Direct API test for workflow visibility', async ({ request }) => {
    console.log('\n\nDIRECT API TEST...');

    // Login as AO1
    const ao1Login = await request.post('http://localhost:4000/api/auth/login', {
      data: {
        email: 'ao1@airforce.mil',
        password: 'testpass123'
      }
    });
    const ao1Data = await ao1Login.json();
    const ao1Token = ao1Data.accessToken;
    console.log('✓ AO1 logged in via API');

    // Create document as AO1
    const createDoc = await request.post('http://localhost:4000/api/documents', {
      headers: {
        'Authorization': `Bearer ${ao1Token}`
      },
      data: {
        title: 'API Test Document',
        content: 'Test content',
        type: 'AFI'
      }
    });
    const doc = await createDoc.json();
    const docId = doc.id;
    console.log(`✓ Document created: ${docId}`);

    // Start workflow as AO1
    const startWorkflow = await request.post(`http://localhost:4000/api/workflow-instances/${docId}/start`, {
      headers: {
        'Authorization': `Bearer ${ao1Token}`
      },
      data: {
        workflowId: 'hierarchical-distributed-workflow'
      }
    });
    console.log('✓ Workflow started by AO1');

    // Login as Admin
    const adminLogin = await request.post('http://localhost:4000/api/auth/login', {
      data: {
        email: 'admin@airforce.mil',
        password: 'testpass123'
      }
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.accessToken;
    console.log('✓ Admin logged in via API');

    // Check workflow visibility as Admin
    const checkWorkflow = await request.get(`http://localhost:4000/api/workflow-instances/${docId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const workflowData = await checkWorkflow.json();

    console.log('\nWORKFLOW DATA SEEN BY ADMIN:');
    console.log('  Active:', workflowData.active);
    console.log('  Is Active:', workflowData.isActive);
    console.log('  Workflow ID:', workflowData.workflowId);
    console.log('  Current Stage:', workflowData.currentStageName);

    expect(workflowData.active).toBeTruthy();
    expect(workflowData.isActive).toBeTruthy();
    console.log('✅ API TEST PASSED: Admin can see workflow via API');
  });
});

test.describe('Debug Current State', () => {
  test('Check all documents and workflows', async ({ request }) => {
    console.log('\n\nDEBUGGING CURRENT STATE...\n');

    // Login as Admin
    const adminLogin = await request.post('http://localhost:4000/api/auth/login', {
      data: {
        email: 'admin@airforce.mil',
        password: 'testpass123'
      }
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.accessToken;

    // Get all documents
    const docsResponse = await request.get('http://localhost:4000/api/documents', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const documents = await docsResponse.json();

    console.log(`Found ${documents.length} documents\n`);

    // Check workflow for each document
    for (const doc of documents.slice(0, 5)) {
      const workflowResponse = await request.get(`http://localhost:4000/api/workflow-instances/${doc.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const workflow = await workflowResponse.json();

      console.log(`Document: ${doc.title}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Workflow Active: ${workflow.active}`);
      if (workflow.active) {
        console.log(`  Workflow Type: ${workflow.workflowId}`);
        console.log(`  Current Stage: ${workflow.currentStageName}`);
      }
      console.log('');
    }
  });
});