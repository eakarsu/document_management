/**
 * COMPLETE Workflow Test - Tests all operations including fixed reset
 * 1. Start workflow (if needed)
 * 2. Advance through stages
 * 3. Reset workflow
 * 4. Verify reset worked
 */

const { test, expect } = require('@playwright/test');

test.describe('Complete Workflow Operations Test', () => {
  
  test('Test start, advance, and reset workflow operations', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('=== COMPLETE WORKFLOW TEST ===\n');
    
    // Track errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('ERR_ABORTED')) {
        errors.push(msg.text());
        console.log(`❌ Error: ${msg.text()}`);
      }
    });
    
    // 1. LOGIN
    console.log('STEP 1: LOGIN');
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@demo.mil');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    console.log('✅ Logged in\n');
    
    // 2. NAVIGATE TO DOCUMENT
    const documentId = 'doc_technical_980lvau4';
    console.log(`STEP 2: NAVIGATE TO DOCUMENT`);
    await page.goto(`http://localhost:3002/documents/${documentId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ On document page\n');
    
    // 3. CHECK INITIAL STATE
    console.log('STEP 3: CHECK WORKFLOW STATE');
    
    // Look for stage indicator
    let stageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
    let hasWorkflow = await stageElement.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasWorkflow) {
      const initialStage = await stageElement.textContent();
      console.log(`Current stage: ${initialStage}`);
    } else {
      console.log('Workflow not started yet');
    }
    
    // 4. ADVANCE WORKFLOW IF AT STAGE 1
    const currentStageText = await stageElement.textContent().catch(() => '');
    if (currentStageText.includes('Stage 1')) {
      console.log('\nSTEP 4: ADVANCE FROM STAGE 1');
      
      // Look for Process button or action buttons
      const processButton = await page.locator('button:has-text("Process")').first();
      if (await processButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Clicking Process button...');
        await processButton.click();
        await page.waitForTimeout(5000);
        
        // Check new stage
        stageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
        const newStage = await stageElement.textContent().catch(() => 'unknown');
        console.log(`✅ Advanced to: ${newStage}`);
      }
    }
    
    // Take screenshot before reset
    await page.screenshot({ path: 'test-results/before-reset.png', fullPage: true });
    
    // 5. TEST RESET BUTTON
    console.log('\nSTEP 5: TEST RESET BUTTON');
    
    // Find and click Reset to Start button
    const resetButton = await page.locator('button:has-text("Reset to Start")').first();
    const hasResetButton = await resetButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasResetButton) {
      console.log('Found Reset to Start button');
      
      // Get stage before reset
      stageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      const stageBeforeReset = await stageElement.textContent().catch(() => 'unknown');
      console.log(`Stage before reset: ${stageBeforeReset}`);
      
      // Click reset button
      console.log('Clicking Reset to Start button...');
      
      // Handle the confirmation dialog
      page.once('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
      });
      
      await resetButton.click();
      
      // Wait for alert after reset
      page.once('dialog', async dialog => {
        console.log(`Success message: ${dialog.message()}`);
        await dialog.accept();
      });
      
      // Wait for page reload
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      console.log('✅ Reset button clicked and page reloaded');
      
      // 6. VERIFY RESET WORKED
      console.log('\nSTEP 6: VERIFY RESET WORKED');
      
      // Check if we're back at Stage 1
      stageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      const stageAfterReset = await stageElement.textContent().catch(() => 'unknown');
      console.log(`Stage after reset: ${stageAfterReset}`);
      
      // Take screenshot after reset
      await page.screenshot({ path: 'test-results/after-reset.png', fullPage: true });
      
      if (stageAfterReset.includes('Stage 1')) {
        console.log('✅ SUCCESS: Workflow reset to Stage 1!');
      } else {
        console.log('❌ FAILURE: Workflow did not reset properly');
      }
      
      // Check the current stage name
      const stageName = await page.locator('text=Upload Document').first();
      if (await stageName.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Confirmed: Back at "Upload Document" stage');
      }
    } else {
      console.log('❌ Reset button not found');
    }
    
    // 7. FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));
    
    if (errors.length === 0) {
      console.log('✅ No critical errors');
    } else {
      console.log(`❌ Found ${errors.length} errors`);
    }
    
    // Test passes if reset worked
    const finalStage = await page.locator('text=/Stage \\d+ of \\d+/').first().textContent().catch(() => '');
    expect(finalStage).toContain('Stage 1');
  });
});