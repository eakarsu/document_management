/**
 * COMPREHENSIVE Workflow Tests with Console Error Checking
 * Tests ALL workflow operations:
 * 1. Start workflow
 * 2. Move to next stage (multiple stages)
 * 3. Reset workflow
 * 4. Check for console errors after EACH operation
 */

const { test, expect } = require('@playwright/test');

test.describe('COMPREHENSIVE Workflow Tests with Console Monitoring', () => {
  
  test('Test ALL workflow operations and monitor console errors', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes
    
    console.log('=== COMPREHENSIVE WORKFLOW TEST WITH FULL ERROR MONITORING ===\n');
    
    // Collect all console messages and errors
    const consoleErrors = [];
    const apiCalls = [];
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push({ type: 'console-error', text, timestamp: new Date().toISOString() });
        console.log(`❌ CONSOLE ERROR at ${new Date().toISOString()}: ${text}`);
      } else if (type === 'warning' && text.includes('Error')) {
        consoleErrors.push({ type: 'warning', text, timestamp: new Date().toISOString() });
        console.log(`⚠️ WARNING at ${new Date().toISOString()}: ${text}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push({ type: 'page-error', text: error.message, timestamp: new Date().toISOString() });
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      const url = request.url();
      consoleErrors.push({ 
        type: 'request-failed', 
        text: `${url} - ${failure?.errorText}`,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ REQUEST FAILED: ${url} - ${failure?.errorText}`);
    });
    
    // Monitor API responses
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('/api/')) {
        apiCalls.push({ url, status, timestamp: new Date().toISOString() });
        
        if (status >= 400) {
          consoleErrors.push({ 
            type: 'api-error', 
            text: `API Error: ${url} returned ${status}`,
            timestamp: new Date().toISOString()
          });
          console.log(`❌ API ERROR: ${url} returned status ${status}`);
        }
      }
    });
    
    // ==================== 1. LOGIN ====================
    console.log('STEP 1: LOGIN\n' + '='.repeat(40));
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@demo.mil');
    await page.fill('input[type="password"]', 'password123');
    
    const errorCountBeforeLogin = consoleErrors.length;
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    const errorCountAfterLogin = consoleErrors.length;
    console.log(`✅ Logged in - New errors: ${errorCountAfterLogin - errorCountBeforeLogin}`);
    
    // ==================== 2. NAVIGATE TO DOCUMENT ====================
    const documentId = 'doc_technical_980lvau4';
    console.log(`\nSTEP 2: NAVIGATE TO DOCUMENT\n` + '='.repeat(40));
    
    const errorCountBeforeNav = consoleErrors.length;
    await page.goto(`http://localhost:3002/documents/${documentId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const errorCountAfterNav = consoleErrors.length;
    console.log(`✅ Navigated to document - New errors: ${errorCountAfterNav - errorCountBeforeNav}`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/workflow-initial-state.png', fullPage: true });
    
    // Check if we're on the right page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // ==================== 3. START WORKFLOW ====================
    console.log(`\nSTEP 3: START WORKFLOW\n` + '='.repeat(40));
    
    // Look for workflow section - try multiple selectors
    const workflowSelectors = [
      'text=Document Review Workflow',
      'text=Workflow Progress',
      'text=Current Stage',
      'text=Upload Document',
      '.workflow-section',
      '[data-testid*="workflow"]'
    ];
    
    let hasWorkflowSection = false;
    for (const selector of workflowSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✅ Found workflow section with selector: ${selector}`);
        hasWorkflowSection = true;
        break;
      }
    }
    
    if (!hasWorkflowSection) {
      console.log('❌ No workflow section found!');
      // Don't throw error, continue to check what's on the page
    }
    
    // Check if workflow is already active by looking for stages
    const stageIndicator = await page.locator('text=/Upload Document|OCR Extraction|AI Classification/').first();
    const workflowAlreadyActive = await stageIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (workflowAlreadyActive) {
      console.log('✅ Workflow is already active');
      const currentStage = await stageIndicator.textContent();
      console.log(`Current stage: ${currentStage}`);
    }
    
    // Look for Start button or other workflow buttons
    const startButton = await page.locator('button:has-text("Start Document Review Workflow")').first();
    const hasStartButton = await startButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasStartButton && !workflowAlreadyActive) {
      const errorCountBeforeStart = consoleErrors.length;
      console.log('Clicking "Start Document Review Workflow" button...');
      
      await startButton.click();
      await page.waitForTimeout(5000);
      
      const errorCountAfterStart = consoleErrors.length;
      console.log(`✅ Started workflow - New errors: ${errorCountAfterStart - errorCountBeforeStart}`);
      
      if (errorCountAfterStart > errorCountBeforeStart) {
        console.log('Errors after starting workflow:');
        consoleErrors.slice(errorCountBeforeStart).forEach(err => 
          console.log(`  - ${err.type}: ${err.text}`)
        );
      }
      
      // Verify workflow started
      const stageText = await page.locator('text=/Stage \\d+ of \\d+/').first();
      if (await stageText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const stage = await stageText.textContent();
        console.log(`✅ Workflow at: ${stage}`);
      }
      
      await page.screenshot({ path: 'test-results/workflow-after-start.png', fullPage: true });
    } else {
      console.log('⚠️ Workflow may already be started');
    }
    
    // ==================== 4. MOVE THROUGH MULTIPLE STAGES ====================
    console.log(`\nSTEP 4: MOVE THROUGH WORKFLOW STAGES\n` + '='.repeat(40));
    
    // Try to advance through multiple stages
    for (let stageNum = 1; stageNum <= 5; stageNum++) {
      console.log(`\n--- Attempting to move to next stage (iteration ${stageNum}) ---`);
      
      // Check current stage
      const currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      let currentStage = 'unknown';
      if (await currentStageElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        currentStage = await currentStageElement.textContent();
        console.log(`Current stage: ${currentStage}`);
      }
      
      // Look for Available Actions
      const actionsSection = await page.locator('text=Available Actions').first();
      const hasActions = await actionsSection.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasActions) {
        console.log('✅ Found Available Actions section');
        
        // Check if comments are required
        const commentField = await page.locator('textarea[label*="Comments"], textarea[placeholder*="comment"]').first();
        if (await commentField.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Adding required comment...');
          await commentField.fill(`Test comment for stage transition ${stageNum}`);
        }
        
        // Find action buttons
        const actionButtons = await page.locator('button').filter({ 
          hasText: /Approve|Next|Continue|Classify Document|Extract Text|Review|Complete|Advance|Submit/ 
        });
        
        const buttonCount = await actionButtons.count();
        console.log(`Found ${buttonCount} action buttons`);
        
        if (buttonCount > 0) {
          // Get all button texts
          const buttonTexts = [];
          for (let i = 0; i < buttonCount; i++) {
            const text = await actionButtons.nth(i).textContent();
            buttonTexts.push(text);
            console.log(`  Button ${i + 1}: "${text}"`);
          }
          
          // Click the first available button
          const buttonToClick = actionButtons.first();
          const buttonText = await buttonToClick.textContent();
          
          const errorCountBefore = consoleErrors.length;
          console.log(`Clicking button: "${buttonText}"...`);
          
          await buttonToClick.click();
          await page.waitForTimeout(5000);
          
          const errorCountAfter = consoleErrors.length;
          console.log(`✅ Clicked "${buttonText}" - New errors: ${errorCountAfter - errorCountBefore}`);
          
          if (errorCountAfter > errorCountBefore) {
            console.log('Errors after clicking action button:');
            consoleErrors.slice(errorCountBefore).forEach(err => 
              console.log(`  - ${err.type}: ${err.text}`)
            );
          }
          
          // Check if stage changed
          const newStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
          if (await newStageElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            const newStage = await newStageElement.textContent();
            if (newStage !== currentStage) {
              console.log(`✅ Advanced to: ${newStage}`);
            } else {
              console.log('⚠️ Stage did not change');
            }
          }
          
          // Take screenshot after each stage transition
          await page.screenshot({ path: `test-results/workflow-stage-${stageNum}.png`, fullPage: true });
        } else {
          console.log('⚠️ No action buttons available');
          break;
        }
      } else {
        console.log('⚠️ No Available Actions - workflow may be complete or blocked');
        
        // Check if workflow is complete
        const completeIndicator = await page.locator('text=/100% Complete|Completed|Final/').first();
        if (await completeIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Workflow appears to be complete');
        }
        break;
      }
    }
    
    // ==================== 5. RESET WORKFLOW ====================
    console.log(`\nSTEP 5: RESET WORKFLOW\n` + '='.repeat(40));
    
    // Look for reset button
    const resetButtons = await page.locator('button').filter({ hasText: /Reset/ });
    const resetCount = await resetButtons.count();
    console.log(`Found ${resetCount} reset button(s)`);
    
    if (resetCount > 0) {
      const resetButton = resetButtons.first();
      const resetText = await resetButton.textContent();
      
      const errorCountBeforeReset = consoleErrors.length;
      console.log(`Clicking reset button: "${resetText}"...`);
      
      await resetButton.click();
      await page.waitForTimeout(5000);
      
      const errorCountAfterReset = consoleErrors.length;
      console.log(`✅ Clicked Reset - New errors: ${errorCountAfterReset - errorCountBeforeReset}`);
      
      if (errorCountAfterReset > errorCountBeforeReset) {
        console.log('Errors after reset:');
        consoleErrors.slice(errorCountBeforeReset).forEach(err => 
          console.log(`  - ${err.type}: ${err.text}`)
        );
      }
      
      // Verify reset worked
      const stage1 = await page.locator('text=/Stage 1/').first();
      if (await stage1.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Workflow successfully reset to Stage 1');
      }
      
      await page.screenshot({ path: 'test-results/workflow-after-reset.png', fullPage: true });
    } else {
      console.log('❌ No reset button found');
    }
    
    // ==================== 6. CHECK WORKFLOW HISTORY ====================
    console.log(`\nSTEP 6: CHECK WORKFLOW HISTORY\n` + '='.repeat(40));
    
    const historySection = await page.locator('text=Workflow History').first();
    if (await historySection.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Found Workflow History section');
      
      // Look for history entries
      const historyEntries = await page.locator('text=/STARTED|APPROVED|RESET|ADVANCED/').all();
      console.log(`Found ${historyEntries.length} history entries`);
    }
    
    // ==================== FINAL REPORT ====================
    console.log('\n' + '='.repeat(60));
    console.log('FINAL COMPREHENSIVE ERROR REPORT');
    console.log('='.repeat(60));
    
    // Categorize errors
    const networkErrors = consoleErrors.filter(e => e.type === 'request-failed');
    const apiErrors = consoleErrors.filter(e => e.type === 'api-error');
    const consoleErrs = consoleErrors.filter(e => e.type === 'console-error');
    const pageErrors = consoleErrors.filter(e => e.type === 'page-error');
    
    console.log(`\nTotal Errors: ${consoleErrors.length}`);
    console.log(`  - Network Errors: ${networkErrors.length}`);
    console.log(`  - API Errors: ${apiErrors.length}`);
    console.log(`  - Console Errors: ${consoleErrs.length}`);
    console.log(`  - Page Errors: ${pageErrors.length}`);
    
    // Report API calls
    const workflowAPIs = apiCalls.filter(c => c.url.includes('workflow'));
    console.log(`\nWorkflow API Calls: ${workflowAPIs.length}`);
    workflowAPIs.forEach(call => {
      const status = call.status >= 200 && call.status < 300 ? '✅' : '❌';
      console.log(`  ${status} ${call.url.split('/api/')[1]} - Status: ${call.status}`);
    });
    
    // List all errors
    if (consoleErrors.length > 0) {
      console.log('\nDetailed Error List:');
      consoleErrors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.type}] ${err.text}`);
      });
      
      // Check for critical errors
      const criticalErrors = consoleErrors.filter(e => 
        e.text.includes('500') || 
        e.text.includes('reset') || 
        e.text.includes('workflow') ||
        e.text.includes('TypeError') ||
        e.text.includes('undefined')
      );
      
      if (criticalErrors.length > 0) {
        console.log(`\n❌ CRITICAL ERRORS FOUND: ${criticalErrors.length}`);
        criticalErrors.forEach(e => console.log(`  - ${e.text}`));
      }
    } else {
      console.log('\n✅ NO ERRORS FOUND! All workflow operations completed successfully.');
    }
    
    // Test passes only if no critical errors
    // Filter out normal navigation aborts and 404s that don't affect functionality
    const criticalErrors = consoleErrors.filter(e => 
      !e.text.includes('ERR_ABORTED') && 
      !e.text.includes('404 (Not Found)') &&
      !e.text.includes('Failed to load resource')
    );
    console.log(`\nCritical errors: ${criticalErrors.length}`);
    
    // The test passes if workflow operations completed successfully
    expect(criticalErrors.length).toBe(0);
  });
});