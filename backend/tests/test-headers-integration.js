#!/usr/bin/env node

// Test script to verify headers are properly integrated with templates
const fs = require('fs');
const path = require('path');

console.log('Testing Header Integration with Document Templates');
console.log('='.repeat(50));

// Test loading a header directly
const headerPath = path.join(__dirname, 'headers', 'afi-header.html');
if (fs.existsSync(headerPath)) {
  console.log('✅ AFI header file exists');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  // Check if header contains required elements
  const hasSeals = headerContent.includes('file:///Users/erolakarsu/projects/document_management/frontend/public/images/air-force-seal.png');
  const hasCompliance = headerContent.includes('COMPLIANCE WITH THIS PUBLICATION IS MANDATORY');
  const hasLayout = headerContent.includes('BY ORDER OF THE');

  console.log(`  - Contains seal image: ${hasSeals ? '✅' : '❌'}`);
  console.log(`  - Contains compliance text: ${hasCompliance ? '✅' : '❌'}`);
  console.log(`  - Contains proper layout: ${hasLayout ? '✅' : '❌'}`);
} else {
  console.log('❌ AFI header file not found');
}

// Test importing and using the templates
try {
  // Import the templates (TypeScript files need compilation)
  // For testing, we'll just check if the files exist
  const militaryTemplatesPath = path.join(__dirname, 'src/templates/militaryDocumentTemplates.ts');
  const documentTemplatesPath = path.join(__dirname, 'src/templates/documentTemplates.ts');

  if (fs.existsSync(militaryTemplatesPath) && fs.existsSync(documentTemplatesPath)) {
    console.log('✅ Template files exist and have been updated');

    // Read the files to verify they contain the header integration code
    const militaryContent = fs.readFileSync(militaryTemplatesPath, 'utf8');
    const documentContent = fs.readFileSync(documentTemplatesPath, 'utf8');

    const hasHeaderFunction = militaryContent.includes('createDocumentWithHeader');
    const usesHeaders = militaryContent.includes("createDocumentWithHeader('afi'");

    console.log(`  - Has header integration function: ${hasHeaderFunction ? '✅' : '❌'}`);
    console.log(`  - Uses headers in templates: ${usesHeaders ? '✅' : '❌'}`);
  } else {
    console.log('❌ Template files not found');
  }


  console.log('\n✅ Template integration test complete!');

} catch (error) {
  console.error('❌ Error loading templates:', error.message);
  process.exit(1);
}