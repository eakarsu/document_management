// Test script to verify all templates are accessible
const { documentTemplates, getTemplateContent, getTemplateName } = require('./backend/dist/templates/documentTemplates.js');

console.log('=== TEMPLATE VERIFICATION ===\n');

// List all available templates
const templateIds = Object.keys(documentTemplates);
console.log(`Total templates available: ${templateIds.length}\n`);

// Categories
const criticalTemplates = [
  'comment-resolution-matrix',
  'af-form-673', 
  'supplement-template',
  'o6-gs15-coordination',
  '2-letter-coordination',
  'legal-coordination'
];

const highPriorityTemplates = [
  'dafpd-template',
  'dafman-template',
  'guidance-memorandum',
  'waiver-request'
];

const existingTemplates = [
  'air-force-manual',
  'operational-plan',
  'safety-bulletin',
  'meeting-minutes',
  'blank'
];

// Verify critical templates
console.log('CRITICAL TEMPLATES (Coordination & Workflow):');
criticalTemplates.forEach(id => {
  const name = getTemplateName(id);
  const hasContent = getTemplateContent(id) !== documentTemplates.blank.content;
  console.log(`  ✓ ${id}: ${name} - ${hasContent ? 'OK' : 'MISSING'}`);
});

console.log('\nHIGH PRIORITY TEMPLATES (Policy Documents):');
highPriorityTemplates.forEach(id => {
  const name = getTemplateName(id);
  const hasContent = getTemplateContent(id) !== documentTemplates.blank.content;
  console.log(`  ✓ ${id}: ${name} - ${hasContent ? 'OK' : 'MISSING'}`);
});

console.log('\nEXISTING TEMPLATES:');
existingTemplates.forEach(id => {
  const name = getTemplateName(id);
  const hasContent = getTemplateContent(id) !== documentTemplates.blank.content;
  console.log(`  ✓ ${id}: ${name} - ${hasContent ? 'OK' : 'MISSING'}`);
});

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Critical Templates: ${criticalTemplates.length}`);
console.log(`High Priority Templates: ${highPriorityTemplates.length}`);
console.log(`Existing Templates: ${existingTemplates.length}`);
console.log(`Total Templates: ${templateIds.length}`);

// Test template content snippet
console.log('\n=== SAMPLE TEMPLATE CONTENT ===');
console.log('DAFPD Template (first 200 chars):');
const dafpdContent = getTemplateContent('dafpd-template');
console.log(dafpdContent.substring(0, 200).replace(/\s+/g, ' ') + '...');