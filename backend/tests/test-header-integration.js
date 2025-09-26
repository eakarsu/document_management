#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Test that headers exist and can be served
async function testHeaderIntegration() {
  console.log('='.repeat(50));
  console.log('TESTING HEADER INTEGRATION');
  console.log('='.repeat(50) + '\n');

  const headersDir = path.join(__dirname, 'headers');

  // 1. Check headers directory exists
  if (!fs.existsSync(headersDir)) {
    console.error('❌ Headers directory not found!');
    return;
  }
  console.log('✅ Headers directory exists');

  // 2. Check all header files exist
  const expectedHeaders = [
    'af-manual', 'afi', 'afpd', 'afman', 'afjqs', 'afto', 'afva', 'afh',
    'afgm', 'afmd', 'dafi', 'dafman', 'dafpd', 'dodd', 'dodi', 'cjcs',
    'army', 'navy', 'marine', 'spaceforce', 'oplan', 'opord', 'conops',
    'technical', 'policy', 'training', 'sop'
  ];

  let missingHeaders = [];
  let validHeaders = [];

  for (const templateId of expectedHeaders) {
    const headerFile = path.join(headersDir, `${templateId}-header.html`);
    if (!fs.existsSync(headerFile)) {
      missingHeaders.push(templateId);
    } else {
      const content = fs.readFileSync(headerFile, 'utf8');
      if (content && content.includes('<!DOCTYPE html>')) {
        validHeaders.push(templateId);
      } else {
        missingHeaders.push(templateId);
      }
    }
  }

  console.log(`✅ Valid headers: ${validHeaders.length}/${expectedHeaders.length}`);
  if (missingHeaders.length > 0) {
    console.log(`❌ Missing or invalid headers: ${missingHeaders.join(', ')}`);
  }

  // 3. Check index.js exists
  const indexFile = path.join(headersDir, 'index.js');
  if (!fs.existsSync(indexFile)) {
    console.error('❌ Index file not found!');
  } else {
    console.log('✅ Index file exists');
  }

  // 4. Test loading a sample header
  console.log('\n📝 Testing sample header content...');
  const sampleHeaderFile = path.join(headersDir, 'afi-header.html');
  if (fs.existsSync(sampleHeaderFile)) {
    const content = fs.readFileSync(sampleHeaderFile, 'utf8');
    const hasClassification = content.includes('UNCLASSIFIED');
    const hasCompliance = content.includes('COMPLIANCE WITH THIS PUBLICATION IS MANDATORY');
    const hasDistribution = content.includes('DISTRIBUTION STATEMENT');

    console.log(`  Classification header: ${hasClassification ? '✅' : '❌'}`);
    console.log(`  Compliance notice: ${hasCompliance ? '✅' : '❌'}`);
    console.log(`  Distribution statement: ${hasDistribution ? '✅' : '❌'}`);
  }

  // 5. Test API endpoint (if server is running)
  console.log('\n🌐 Testing API endpoint...');
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:4000/api/headers/afi');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.headerContent) {
        console.log('✅ API endpoint is working');
      } else {
        console.log('⚠️ API returned unexpected response');
      }
    } else {
      console.log(`⚠️ API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️ Could not test API endpoint (server might not be running)');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Header integration test complete!');
  console.log('='.repeat(50));
}

// Run the test
testHeaderIntegration().catch(console.error);