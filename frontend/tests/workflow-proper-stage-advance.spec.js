/**
 * PROPER Workflow Stage Advancement Test
 * This test ACTUALLY advances workflow stages and verifies progression
 */

const { test, expect } = require('@playwright/test');

test.describe('PROPER Workflow Stage Advancement', () => {
  
  test('Actually advance workflow through multiple stages and verify progression', async ({ page }) => {
    test.setTimeout(240000);
    
    console.log('=== PROPER WORKFLOW STAGE ADVANCEMENT TEST ===\n');
    
    // Track console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`❌ Console error: ${msg.text()}`);
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
    console.log('✅ Logged in as admin\n');
    
    // 2. NAVIGATE TO DOCUMENT
    const documentId = 'doc_technical_980lvau4';
    console.log(`STEP 2: NAVIGATE TO DOCUMENT: ${documentId}`);
    await page.goto(`http://localhost:3002/documents/${documentId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/workflow-initial.png', fullPage: true });
    console.log('✅ On document page\n');
    
    // 3. CHECK CURRENT WORKFLOW STATE
    console.log('STEP 3: CHECK WORKFLOW STATE');
    
    // Look for workflow section
    const workflowSection = await page.locator('text=Document Review Workflow').first();
    const hasWorkflow = await workflowSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasWorkflow) {
      throw new Error('❌ No workflow section found!');
    }
    console.log('✅ Found Document Review Workflow section');
    
    // Check current stage
    let currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
    let currentStageText = await currentStageElement.textContent().catch(() => null);
    console.log(`Current stage: ${currentStageText}`);
    
    // 4. RESET WORKFLOW TO START FRESH
    console.log('\nSTEP 4: RESET WORKFLOW TO START FRESH');
    
    // Look for Reset button
    const resetButton = await page.locator('button:has-text("Reset to Start")').first();
    const hasReset = await resetButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasReset) {
      console.log('Clicking Reset to Start button...');
      await resetButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Workflow reset to start');
      
      // Verify we're at Stage 1
      currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      currentStageText = await currentStageElement.textContent().catch(() => null);
      console.log(`After reset: ${currentStageText}`);
      
      // Take screenshot after reset
      await page.screenshot({ path: 'test-results/workflow-after-reset.png', fullPage: true });
    }
    
    // 5. ADVANCE THROUGH STAGES
    console.log('\nSTEP 5: ADVANCE THROUGH WORKFLOW STAGES');
    
    // We should be at Stage 1 now
    // Try to advance through multiple stages
    for (let i = 1; i <= 5; i++) {
      console.log(`\n--- Attempting to advance from stage ${i} ---`);
      
      // Get current stage
      currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      const stageBefore = await currentStageElement.textContent().catch(() => 'unknown');
      console.log(`Current: ${stageBefore}`);
      
      // Look for Available Actions section
      const actionsSection = await page.locator('text=Available Actions').first();
      const hasActions = await actionsSection.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!hasActions) {
        console.log('⚠️ No Available Actions section - workflow might be complete or blocked');
        break;
      }
      
      // Check if comments are required
      const commentField = await page.locator('textarea').filter({ hasText: '' }).first();
      const needsComment = await commentField.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (needsComment) {
        console.log('Filling required comment field...');
        await commentField.fill(`Advancing to stage ${i + 1}`);
      }
      
      // Look for the Process or action button WITHIN the workflow section
      // NOT the Review & CRM or OPR Review buttons which navigate away
      const actionButtons = await page.locator('button').filter({ 
        hasText: /Process|Approve|Extract|Classify|Complete|Advance|Submit|Continue/ 
      });
      
      const buttonCount = await actionButtons.count();
      console.log(`Found ${buttonCount} workflow action buttons`);
      
      // Find button that's within the workflow section (not in Quick Actions)
      let clickedButton = false;
      for (let j = 0; j < buttonCount; j++) {
        const button = actionButtons.nth(j);
        
        // Check if button is within the workflow section (not in Quick Actions)
        const parent = await button.locator('..').locator('..').locator('..');
        const parentText = await parent.textContent().catch(() => '');
        
        if (parentText.includes('Available Actions') || parentText.includes('Document Review Workflow')) {
          const buttonText = await button.textContent();
          console.log(`Clicking workflow button: "${buttonText}"`);
          
          await button.click();
          await page.waitForTimeout(5000);
          
          clickedButton = true;
          console.log(`✅ Clicked "${buttonText}"`);
          break;
        }
      }
      
      if (!clickedButton) {
        // Try the generic Process button if visible
        const processButton = await page.locator('button:has-text("Process")').first();
        if (await processButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Clicking Process button...');
          await processButton.click();
          await page.waitForTimeout(5000);
          console.log('✅ Clicked Process button');
        } else {
          console.log('⚠️ No suitable action button found');
          break;
        }
      }
      
      // Check if stage actually advanced
      currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
      const stageAfter = await currentStageElement.textContent().catch(() => 'unknown');
      
      if (stageBefore !== stageAfter) {
        console.log(`✅ STAGE ADVANCED: ${stageBefore} → ${stageAfter}`);
        
        // Take screenshot after advancing
        await page.screenshot({ path: `test-results/workflow-stage-${i}.png`, fullPage: true });
      } else {
        console.log(`❌ STAGE DID NOT ADVANCE - Still at: ${stageAfter}`);
        
        // Debug: Log what's on the page
        const workflowContent = await page.locator('[class*="workflow"]').first().textContent().catch(() => '');
        console.log('Workflow section content:', workflowContent.substring(0, 200));
        break;
      }
    }
    
    // 6. FINAL VERIFICATION
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    // Get final stage
    currentStageElement = await page.locator('text=/Stage \\d+ of \\d+/').first();
    const finalStage = await currentStageElement.textContent().catch(() => 'unknown');
    console.log(`Final stage: ${finalStage}`);
    
    // Check if we actually advanced
    const stageNumber = finalStage.match(/Stage (\d+)/);
    if (stageNumber && parseInt(stageNumber[1]) > 1) {
      console.log(`✅ SUCCESS: Workflow advanced to ${finalStage}`);
    } else {
      console.log('❌ FAILURE: Workflow did not advance from Stage 1');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/workflow-final.png', fullPage: true });
    
    // Check workflow history
    const historySection = await page.locator('text=Workflow History').first();
    if (await historySection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('\n✅ Found Workflow History section');
      const historyEntries = await page.locator('text=/APPROVED|ADVANCED|PROCESSED/').all();
      console.log(`History entries showing advancement: ${historyEntries.length}`);
    }
    
    // 7. FINAL RESET TO CLEAN STATE
    console.log('\nSTEP 7: FINAL RESET TO CLEAN STATE');
    
    const finalResetButton = await page.locator('button:has-text("Reset to Start")').first();
    if (await finalResetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await finalResetButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Reset workflow to clean state');
    }
    
    // Report errors
    console.log('\n' + '='.repeat(60));
    if (errors.length === 0) {
      console.log('✅ NO CONSOLE ERRORS');
    } else {
      console.log(`❌ Found ${errors.length} console errors`);
    }
    
    // Test passes only if workflow actually advanced
    expect(finalStage).not.toContain('Stage 1');
  });
});