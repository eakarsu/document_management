#!/usr/bin/env node

/**
 * Command-line runner for generic Playwright UI test
 * Usage: node run-ui-test.js <template> <size_kb> <feedbacks>
 * Example: node run-ui-test.js technical 30 5
 */

const { spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node run-ui-test.js <template> <size_kb> <feedbacks>');
  console.log('');
  console.log('Templates: technical, safety, operational, maintenance, training');
  console.log('');
  console.log('Examples:');
  console.log('  node run-ui-test.js technical 30 5      # 30KB technical doc with 5 feedbacks');
  console.log('  node run-ui-test.js safety 50 10        # 50KB safety doc with 10 feedbacks');
  console.log('  node run-ui-test.js operational 100 0   # 100KB operational doc with no feedbacks');
  process.exit(1);
}

const template = args[0];
const sizeKB = parseInt(args[1]);
const feedbacks = parseInt(args[2]);

// Validate inputs
const validTemplates = ['technical', 'safety', 'operational', 'maintenance', 'training'];
if (!validTemplates.includes(template)) {
  console.error(`Error: Invalid template "${template}"`);
  console.error(`Valid templates: ${validTemplates.join(', ')}`);
  process.exit(1);
}

if (isNaN(sizeKB) || sizeKB < 1 || sizeKB > 1000) {
  console.error('Error: Size must be between 1 and 1000 KB');
  process.exit(1);
}

if (isNaN(feedbacks) || feedbacks < 0 || feedbacks > 100) {
  console.error('Error: Feedbacks must be between 0 and 100');
  process.exit(1);
}

console.log('=== PLAYWRIGHT UI TEST RUNNER ===');
console.log(`Template: ${template}`);
console.log(`Size: ${sizeKB} KB`);
console.log(`Feedbacks: ${feedbacks}`);
console.log('');
console.log('Starting Playwright test...');
console.log('');

// Set environment variables
const env = {
  ...process.env,
  TEMPLATE: template,
  SIZE_KB: sizeKB.toString(),
  FEEDBACKS: feedbacks.toString()
};

// Run Playwright test
const playwright = spawn('npx', [
  'playwright',
  'test',
  'tests/generic-document-test.spec.js',
  '--reporter=list'
], {
  env,
  stdio: 'inherit'
});

playwright.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('Screenshot saved to: test-results/generic-' + template + '-' + sizeKB + 'kb.png');
  } else {
    console.log('');
    console.log('❌ Test failed with exit code:', code);
  }
  process.exit(code);
});

playwright.on('error', (err) => {
  console.error('Failed to start Playwright:', err);
  process.exit(1);
});