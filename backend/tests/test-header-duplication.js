#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'http://localhost:4000/api';
const FRONTEND_BASE = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@airforce.mil',
  password: 'testpass123'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
};

// Wait for servers to be ready
async function waitForServers() {
  log.info('Waiting for servers to be ready...');

  for (let i = 0; i < 30; i++) {
    try {
      const [backendResponse, frontendResponse] = await Promise.all([
        fetch(`http://localhost:4000/health`).catch(() => null),
        fetch(`${FRONTEND_BASE}`).catch(() => null)
      ]);

      if (backendResponse?.ok && frontendResponse?.ok) {
        log.success('Both servers are ready!');
        return true;
      }
    } catch (e) {
      // Servers not ready yet
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Servers did not start in time');
}

// Login and get token
async function login() {
  log.info('Logging in as admin...');

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  log.success('Logged in successfully');
  return data.accessToken || data.token;
}

// Create a document with a military template
async function createDocumentWithTemplate(token, templateId) {
  log.info(`Creating document with template: ${templateId}`);

  const response = await fetch(`${API_BASE}/documents/create-with-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: `Test ${templateId} - ${new Date().toISOString()}`,
      templateId: templateId,
      category: 'POLICY',
      description: 'Test document for header duplication check'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create document: ${response.status} - ${error}`);
  }

  const data = await response.json();
  log.success(`Created document: ${data.document.id}`);
  return data.document;
}

// Get document content
async function getDocumentContent(token, documentId) {
  log.info(`Fetching document content: ${documentId}`);

  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.status}`);
  }

  const data = await response.json();
  return data.document || data;
}

// Check for duplicate headers in content
function checkForDuplicateHeaders(content) {
  log.test('Checking for duplicate headers...');

  // Common header patterns - but exclude when it's part of a longer phrase
  const headerPatterns = [
    /BY ORDER OF THE/g,
    /SECRETARY OF THE AIR FORCE/g,
    /COMPLIANCE WITH THIS PUBLICATION IS MANDATORY/g,
    /UNCLASSIFIED/g
  ];

  const issues = [];

  for (const pattern of headerPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 1) {
      issues.push({
        pattern: pattern.source,
        count: matches.length,
        text: matches[0]
      });
    }
  }

  // Check for multiple header divs
  const headerDivPatterns = [
    /<div[^>]*class="[^"]*air-force-document-header[^"]*"[^>]*>/g,
    /<div[^>]*class="[^"]*classification-header[^"]*"[^>]*>/g
  ];

  for (const pattern of headerDivPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 1) {
      issues.push({
        pattern: 'Header div element',
        count: matches.length,
        text: pattern.source
      });
    }
  }

  return issues;
}

// Test a specific template
async function testTemplate(token, templateId) {
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  log.test(`Testing template: ${templateId}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Create document
    const document = await createDocumentWithTemplate(token, templateId);

    // Get full document data
    const fullDocument = await getDocumentContent(token, document.id);

    // Get content from customFields
    const customFields = fullDocument.customFields || {};
    const content = customFields.htmlContent || customFields.content || fullDocument.content || '';

    if (!content) {
      log.error('No content found in document');
      return false;
    }

    log.info(`Content length: ${content.length} characters`);

    // Check for duplicate headers
    const duplicates = checkForDuplicateHeaders(content);

    if (duplicates.length === 0) {
      log.success('No duplicate headers found!');
      return true;
    } else {
      log.error(`Found ${duplicates.length} duplicate header issues:`);
      duplicates.forEach(issue => {
        log.error(`  - "${issue.text}" appears ${issue.count} times`);
      });

      // Save problematic content for debugging
      const debugFile = path.join(__dirname, `debug-${templateId}-${Date.now()}.html`);
      fs.writeFileSync(debugFile, content);
      log.info(`Saved debug content to: ${debugFile}`);

      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}   Header Duplication Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Wait for servers
    await waitForServers();

    // Login
    const token = await login();

    // Test military templates that commonly have headers
    const templates = [
      'af-instruction',
      'af-manual',
      'af-policy-directive',
      'dafpd-template',
      'dafman-template'
    ];

    const results = [];

    for (const templateId of templates) {
      const passed = await testTemplate(token, templateId);
      results.push({ templateId, passed });

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}   Test Summary${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(r => {
      if (r.passed) {
        log.success(`${r.templateId}: PASSED`);
      } else {
        log.error(`${r.templateId}: FAILED`);
      }
    });

    console.log(`\n${colors.blue}Total: ${passed} passed, ${failed} failed${colors.reset}\n`);

    if (failed > 0) {
      log.error('Some tests failed - duplicate headers still exist');
      process.exit(1);
    } else {
      log.success('All tests passed - no duplicate headers found!');
      process.exit(0);
    }

  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests();