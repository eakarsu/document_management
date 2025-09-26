const { getTemplateContent } = require('./src/templates/documentTemplates');

// Test what content is returned for dafman-template
const content = getTemplateContent('dafman-template');

console.log('DAFMAN Template Content (first 500 chars):');
console.log(content.substring(0, 500));
console.log('\n---\n');

// Check if it has DEPARTMENT OF THE AIR FORCE
if (content.includes('DEPARTMENT OF THE AIR FORCE')) {
  console.log('✓ Contains DEPARTMENT OF THE AIR FORCE');
} else {
  console.log('✗ Missing DEPARTMENT OF THE AIR FORCE');
}

// Check if it has the seal image
if (content.includes('air-force-seal.png') || content.includes('/af-seal.png')) {
  console.log('✓ Contains seal image');
} else {
  console.log('✗ Missing seal image');
}