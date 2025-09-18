const fs = require('fs');

// Read the test file
const testFile = './tests/workflow-complete-e2e.spec.js';
let content = fs.readFileSync(testFile, 'utf8');

// Find all the cheating patterns and replace them
const replacements = [
  {
    // Stage 2: PCM Review - Replace database update with proper failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No approve button found, updating workflow directly'\);[\s\S]*?data: \{[\s\S]*?\}\s*\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No approve button found in UI - workflow buttons not rendering');`
  },
  {
    // Stage 3: Distribution - Replace simulation with proper failure
    pattern: /if \(!buttonFound\) \{\s*console\.log\('  ⚠️ No distribute button found, simulating distribution'\);[\s\S]*?console\.log\('  ✅ Document distributed to 3 department sub-reviewers'\);/g,
    replacement: `if (!buttonFound) {
      throw new Error('❌ FAILED: No distribute button found in UI - cannot distribute to reviewers');`
  },
  {
    // Stage 3.1-3.3: Sub-reviewer submissions - Replace simulations with failures
    pattern: /if \(!submitButtonFound\) \{\s*console\.log\('  ⚠️ No submit button found, simulating review completion'\);[\s\S]*?\}\);/g,
    replacement: `if (!submitButtonFound) {
      throw new Error('❌ FAILED: No submit button found in UI - cannot complete review');`
  },
  {
    // Stage 4: OPR Consolidation - Replace database update with failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No consolidate button found, updating workflow directly'\);[\s\S]*?stageOrder: 5[\s\S]*?\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No consolidate button found in UI - cannot consolidate feedback');`
  },
  {
    // Stage 5: Front Office Review - Replace database update with failure
    pattern: /if \(!submitButtonFound\) \{\s*console\.log\('  ⚠️ No submit button found, updating workflow directly'\);[\s\S]*?stageOrder: 6[\s\S]*?\}\);/g,
    replacement: `if (!submitButtonFound) {
      throw new Error('❌ FAILED: No submit button found in UI - cannot complete front office review');`
  },
  {
    // Stage 6: OPR Final Consolidation - Replace with failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No consolidate button found, updating workflow directly'\);[\s\S]*?stageOrder: 7[\s\S]*?\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No consolidate button found in UI - cannot finalize document');`
  },
  {
    // Stage 6.5: OPR Submit to Legal - Replace with failure
    pattern: /if \(!submitButtonFound\) \{\s*console\.log\('  ⚠️ No submit button found, updating workflow directly'\);[\s\S]*?currentStageId: 'stage-7'[\s\S]*?\}\);/g,
    replacement: `if (!submitButtonFound) {
      throw new Error('❌ FAILED: No submit button found in UI - cannot submit to legal review');`
  },
  {
    // Stage 7: Legal Review - Replace with failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No approve button found, updating workflow directly'\);[\s\S]*?stageOrder: 8[\s\S]*?\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No approve button found in UI - cannot complete legal review');`
  },
  {
    // Stage 8: AFDPO Preparation - Replace with failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No prepare button found, updating workflow directly'\);[\s\S]*?stageOrder: 9[\s\S]*?\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No prepare button found in UI - cannot prepare for leadership');`
  },
  {
    // Stage 9: Leadership Sign-off - Replace with failure
    pattern: /if \(!signButtonFound\) \{\s*console\.log\('  ⚠️ No sign button found, updating workflow directly'\);[\s\S]*?currentStageId: 'stage-9-1'[\s\S]*?\}\);/g,
    replacement: `if (!signButtonFound) {
      throw new Error('❌ FAILED: No sign button found in UI - cannot complete leadership sign-off');`
  },
  {
    // Stage 9.5: Forward to AFDPO - Replace with failure
    pattern: /if \(!buttonClicked\) \{\s*console\.log\('  ⚠️ No publish button found, updating workflow directly'\);[\s\S]*?currentStageId: 'stage-10'[\s\S]*?\}\);/g,
    replacement: `if (!buttonClicked) {
      throw new Error('❌ FAILED: No publish button found in UI - cannot forward to AFDPO');`
  },
  {
    // Stage 10: AFDPO Publication - Replace with failure
    pattern: /if \(!publishButtonFound\) \{\s*console\.log\('  ⚠️ No publish button found, completing workflow directly'\);[\s\S]*?active: false[\s\S]*?\}\);/g,
    replacement: `if (!publishButtonFound) {
      throw new Error('❌ FAILED: No publish button found in UI - cannot publish document');`
  }
];

// Apply all replacements
replacements.forEach(({ pattern, replacement }) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Found ${matches.length} instance(s) of cheating code to replace`);
    content = content.replace(pattern, replacement + '\n    }');
  }
});

// Write the updated content back
fs.writeFileSync(testFile, content);

console.log('✅ Test file updated - removed all database fallback cheating');
console.log('Tests will now properly fail when UI buttons are not found');