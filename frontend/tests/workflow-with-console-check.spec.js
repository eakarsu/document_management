/**
 * Workflow Tests with Console Error Checking
 * This test clicks workflow buttons AND monitors for console errors
 */

const { test, expect } = require('@playwright/test');

test.describe('Workflow Tests with Console Error Monitoring', () => {
  
  test('Click workflow buttons and check for console errors', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('=== WORKFLOW TEST WITH CONSOLE ERROR MONITORING ===\n');
    
    // Collect all console messages and errors
    const consoleMessages = [];
    const consoleErrors = [];
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        consoleMessages.push(`WARNING: ${text}`);
        console.log(`⚠️ CONSOLE WARNING: ${text}`);
      } else if (text.includes('Error') || text.includes('Failed')) {
        consoleErrors.push(text);
        console.log(`❌ ERROR MESSAGE: ${text}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      consoleErrors.push(`Request failed: ${request.url()} - ${failure?.errorText}`);
      console.log(`❌ REQUEST FAILED: ${request.url()} - ${failure?.errorText}`);
    });
    
    // 1. LOGIN
    console.log('1. Logging in...');
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@demo.mil');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log(`Console errors after login: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors found after login:', consoleErrors);
    }
    
    // 2. NAVIGATE TO DOCUMENT
    const documentId = 'doc_technical_980lvau4';
    console.log(`\n2. Navigating to document: ${documentId}`);
    await page.goto(`http://localhost:3002/documents/${documentId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log(`Console errors after navigation: ${consoleErrors.length}`);
    
    // 3. START WORKFLOW
    console.log('\n3. Starting workflow...');
    const workflowSection = await page.locator('text=Workflow Management').first();
    const hasWorkflowSection = await workflowSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasWorkflowSection) {
      console.log('✅ Found Workflow Management section');
      
      // Click Start Workflow button
      const startButton = await page.locator('button:has-text("Start Document Review Workflow")').first();
      const hasStartButton = await startButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasStartButton) {
        const errorCountBefore = consoleErrors.length;
        console.log('Clicking Start Workflow button...');
        
        await startButton.click();
        await page.waitForTimeout(5000);
        
        const errorCountAfter = consoleErrors.length;
        console.log(`✅ Clicked Start Workflow button`);
        console.log(`New errors after clicking Start: ${errorCountAfter - errorCountBefore}`);
        
        if (errorCountAfter > errorCountBefore) {
          console.log('NEW ERRORS after Start Workflow:');
          consoleErrors.slice(errorCountBefore).forEach(err => console.log(`  - ${err}`));
        }
        
        // Check if workflow started
        const stageText = await page.locator('text=/Stage \\d+ of \\d+/').first();
        const hasStage = await stageText.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasStage) {
          const stage = await stageText.textContent();
          console.log(`✅ Workflow started: ${stage}`);
        }
      }
      
      // 4. TRY TO ADVANCE WORKFLOW
      console.log('\n4. Looking for action buttons...');
      const actionButtons = await page.locator('button').filter({ 
        hasText: /Approve|Next|Continue|Classify/ 
      });
      const buttonCount = await actionButtons.count();
      
      if (buttonCount > 0) {
        const button = actionButtons.first();
        const buttonText = await button.textContent();
        const errorCountBefore = consoleErrors.length;
        
        console.log(`Clicking action button: "${buttonText}"`);
        await button.click();
        await page.waitForTimeout(5000);
        
        const errorCountAfter = consoleErrors.length;
        console.log(`✅ Clicked "${buttonText}"`);
        console.log(`New errors after clicking action: ${errorCountAfter - errorCountBefore}`);
        
        if (errorCountAfter > errorCountBefore) {
          console.log('NEW ERRORS after action button:');
          consoleErrors.slice(errorCountBefore).forEach(err => console.log(`  - ${err}`));
        }
      }
      
      // 5. RESET WORKFLOW
      console.log('\n5. Looking for Reset button...');
      const resetButton = await page.locator('button').filter({ hasText: /Reset/ }).first();
      const hasResetButton = await resetButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasResetButton) {
        const resetText = await resetButton.textContent();
        const errorCountBefore = consoleErrors.length;
        
        console.log(`Clicking Reset button: "${resetText}"`);
        await resetButton.click();
        await page.waitForTimeout(5000);
        
        const errorCountAfter = consoleErrors.length;
        console.log(`✅ Clicked Reset button`);
        console.log(`New errors after clicking Reset: ${errorCountAfter - errorCountBefore}`);
        
        if (errorCountAfter > errorCountBefore) {
          console.log('NEW ERRORS after Reset:');
          consoleErrors.slice(errorCountBefore).forEach(err => console.log(`  - ${err}`));
        }
        
        // Check if reset worked
        const stage1 = await page.locator('text=/Stage 1/').first();
        const isStage1 = await stage1.isVisible({ timeout: 3000 }).catch(() => false);
        if (isStage1) {
          console.log('✅ Workflow reset to Stage 1');
        }
      }
    }
    
    // FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('FINAL CONSOLE ERROR REPORT');
    console.log('='.repeat(60));
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nAll Console Errors:');
      consoleErrors.forEach((err, index) => {
        console.log(`${index + 1}. ${err}`);
      });
      
      // Check for specific error types
      const apiErrors = consoleErrors.filter(e => e.includes('api') || e.includes('fetch') || e.includes('500') || e.includes('404'));
      const resetErrors = consoleErrors.filter(e => e.includes('reset') || e.includes('Reset'));
      const workflowErrors = consoleErrors.filter(e => e.includes('workflow') || e.includes('Workflow'));
      
      if (apiErrors.length > 0) {
        console.log(`\n❌ API Errors Found: ${apiErrors.length}`);
        apiErrors.forEach(e => console.log(`  - ${e}`));
      }
      
      if (resetErrors.length > 0) {
        console.log(`\n❌ Reset-related Errors Found: ${resetErrors.length}`);
        resetErrors.forEach(e => console.log(`  - ${e}`));
      }
      
      if (workflowErrors.length > 0) {
        console.log(`\n❌ Workflow-related Errors Found: ${workflowErrors.length}`);
        workflowErrors.forEach(e => console.log(`  - ${e}`));
      }
    } else {
      console.log('\n✅ NO CONSOLE ERRORS FOUND! All operations completed without errors.');
    }
    
    // Test should fail if there are console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ TEST COMPLETED WITH ERRORS - Check console output above');
    }
    
    expect(consoleErrors.length).toBe(0);
  });
});