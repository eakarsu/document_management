const fs = require('fs');

// Read the test file
const testFile = './tests/workflow-complete-e2e.spec.js';
let content = fs.readFileSync(testFile, 'utf8');

// Replace all cheating console.log statements with throw statements
const replacements = [
  // Replace all "No X button found" warnings with actual failures
  {
    from: "console.log('  ⚠️ No approve button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No approve button found - UI buttons not rendering');"
  },
  {
    from: "console.log('  ⚠️ No distribute button found, simulating distribution');",
    to: "throw new Error('❌ TEST FAILED: No distribute button found - cannot distribute to reviewers');"
  },
  {
    from: "console.log('  ⚠️ No submit button found, simulating review completion');",
    to: "throw new Error('❌ TEST FAILED: No submit button found - cannot complete review');"
  },
  {
    from: "console.log('  ⚠️ No consolidate button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No consolidate button found - cannot consolidate feedback');"
  },
  {
    from: "console.log('  ⚠️ No submit button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No submit button found - cannot submit for review');"
  },
  {
    from: "console.log('  ⚠️ No prepare button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No prepare button found - cannot prepare for leadership');"
  },
  {
    from: "console.log('  ⚠️ No sign button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No sign button found - cannot complete sign-off');"
  },
  {
    from: "console.log('  ⚠️ No publish button found, updating workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No publish button found - cannot forward to AFDPO');"
  },
  {
    from: "console.log('  ⚠️ No publish button found, completing workflow directly');",
    to: "throw new Error('❌ TEST FAILED: No publish button found - cannot publish document');"
  }
];

// Apply replacements
replacements.forEach(({ from, to }) => {
  const count = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    console.log(`Replacing ${count} instance(s) of: ${from.substring(0, 50)}...`);
    content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
  }
});

// Remove database update code that follows the console.log statements
// This is more complex, so we'll do it with a regex that matches the pattern

// Pattern 1: Remove prisma.jsonWorkflowInstance.update blocks after our throw statements
const updatePatterns = [
  /throw new Error.*\n\s*\/\/ Update workflow.*\n\s*await prisma\.jsonWorkflowInstance\.update\(\{[\s\S]*?\}\);/g,
  /throw new Error.*\n\s*\/\/ Would update.*\n/g,
  /throw new Error.*\n\s*\/\/ Simulate task creation[\s\S]*?Document distributed to 3 department sub-reviewers'\);/g
];

updatePatterns.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Removing ${matches.length} database update block(s)`);
    content = content.replace(pattern, (match) => {
      // Keep only the throw statement
      return match.split('\n')[0];
    });
  }
});

// Write the updated content back
fs.writeFileSync(testFile, content);

console.log('\n✅ Test file updated successfully!');
console.log('- Replaced all warning messages with proper test failures');
console.log('- Tests will now fail immediately when UI buttons are not found');
console.log('- No more database fallbacks or simulated actions');