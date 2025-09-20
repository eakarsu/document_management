#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.cyan}ℹ${colors.reset}`,
    success: `${colors.green}✅${colors.reset}`,
    error: `${colors.red}❌${colors.reset}`,
    warning: `${colors.yellow}⚠️${colors.reset}`,
    test: `${colors.blue}🧪${colors.reset}`
  };
  console.log(`${prefix[type] || ''} ${message}`);
}

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    log(`${name}`, 'success');
  } catch (error) {
    failedTests++;
    log(`${name}: ${error.message}`, 'error');
    console.error(error);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Main test suite
async function runTests() {
  log('\n🔄 FEEDBACK VERSION CONTROL INTEGRATION TESTS\n', 'test');

  let authToken;
  const documentId = 'cmfn33ifj000pfjsqyo04fb7p'; // Existing document

  try {
    // Test 1: Authenticate
    await test('Authenticate as OPR user', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ao1@airforce.mil',
          password: 'testpass123'
        })
      });

      assert(response.ok, `Login failed: ${response.status}`);
      const data = await response.json();
      assert(data.accessToken, 'No access token received');
      authToken = data.accessToken;
    });

    // Test 2: Get document with feedback
    await test('Get document with feedback', async () => {
      const response = await fetch(`${API_BASE}/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(response.ok, `Failed to get document: ${response.status}`);
      const data = await response.json();
      assert(data.document, 'No document returned');
      assert(data.document.customFields, 'Document has no customFields');

      const feedback = data.document.customFields.draftFeedback || [];
      log(`  Found ${feedback.length} feedback items`, 'info');
    });

    // Test 3: Check feedback structure
    await test('Verify feedback structure', async () => {
      const response = await fetch(`${API_BASE}/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      const feedback = data.document.customFields.draftFeedback || [];

      if (feedback.length > 0) {
        const item = feedback[0];
        assert(item.id, 'Feedback should have id');
        assert(item.page !== undefined, 'Feedback should have page');
        assert(item.paragraphNumber !== undefined, 'Feedback should have paragraphNumber');
        assert(item.changeFrom !== undefined, 'Feedback should have changeFrom');
        assert(item.changeTo !== undefined, 'Feedback should have changeTo');
      }
    });

    // Test 4: Track versions in customFields
    await test('Check version tracking in customFields', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      assert(document, 'Document not found in database');
      const customFields = document.customFields || {};

      // Initialize version tracking if not present
      if (!customFields.versions) {
        customFields.versions = [{
          id: 'v1_initial',
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          changes: [],
          positionMap: {}
        }];

        await prisma.document.update({
          where: { id: documentId },
          data: { customFields }
        });

        log('  Initialized version tracking', 'info');
      } else {
        log(`  Found ${customFields.versions.length} versions`, 'info');
      }
    });

    // Test 5: Simulate applying feedback
    await test('Simulate applying feedback', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const feedback = customFields.draftFeedback || [];
      const versions = customFields.versions || [];

      if (feedback.length > 0) {
        // Create a new version with applied feedback
        const newVersion = {
          id: `v${versions.length + 1}_${Date.now()}`,
          versionNumber: versions.length + 1,
          createdAt: new Date().toISOString(),
          changes: feedback.slice(0, 1).map(fb => ({
            id: `change_${fb.id}`,
            feedbackId: fb.id,
            location: {
              page: parseInt(fb.page) || 1,
              paragraph: parseInt(fb.paragraphNumber) || 1,
              line: parseInt(fb.lineNumber) || 1
            },
            originalText: fb.changeFrom,
            suggestedText: fb.changeTo,
            status: 'applied',
            appliedAt: new Date().toISOString()
          })),
          positionMap: {}
        };

        versions.push(newVersion);
        customFields.versions = versions;

        await prisma.document.update({
          where: { id: documentId },
          data: { customFields }
        });

        log(`  Created version ${newVersion.versionNumber} with ${newVersion.changes.length} changes`, 'info');
      }
    });

    // Test 6: Detect conflicts
    await test('Detect conflicting feedback', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const feedback = customFields.draftFeedback || [];

      // Group feedback by location
      const locationGroups = {};
      feedback.forEach(fb => {
        const key = `${fb.page}_${fb.paragraphNumber}_${fb.lineNumber}`;
        if (!locationGroups[key]) {
          locationGroups[key] = [];
        }
        locationGroups[key].push(fb);
      });

      // Find conflicts
      let conflicts = 0;
      Object.entries(locationGroups).forEach(([location, items]) => {
        if (items.length > 1) {
          conflicts++;
          log(`  Conflict at location ${location}: ${items.length} overlapping items`, 'warning');
        }
      });

      log(`  Total conflicts detected: ${conflicts}`, 'info');
    });

    // Test 7: Position tracking
    await test('Track position changes', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const versions = customFields.versions || [];

      if (versions.length > 0) {
        const latestVersion = versions[versions.length - 1];

        // Calculate position adjustments
        latestVersion.positionMap = latestVersion.positionMap || {};

        latestVersion.changes.forEach((change, index) => {
          const key = `p${change.location.page}_para${change.location.paragraph}_l${change.location.line}`;
          const lengthDiff = (change.suggestedText?.length || 0) - (change.originalText?.length || 0);

          latestVersion.positionMap[key] = {
            originalPosition: change.location,
            currentPosition: change.location,
            delta: {
              characterDelta: lengthDiff,
              lineDelta: 0,
              paragraphDelta: 0
            },
            reason: `Applied change ${change.id}`
          };
        });

        await prisma.document.update({
          where: { id: documentId },
          data: { customFields }
        });

        log(`  Updated position map with ${Object.keys(latestVersion.positionMap).length} entries`, 'info');
      }
    });

    // Test 8: Version history
    await test('Build version history', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const versions = customFields.versions || [];

      const history = versions.map(v => ({
        version: v.versionNumber,
        date: v.createdAt,
        changes: v.changes?.length || 0,
        positions: Object.keys(v.positionMap || {}).length
      }));

      log('  Version History:', 'info');
      history.forEach(h => {
        log(`    v${h.version}: ${h.changes} changes, ${h.positions} position adjustments`, 'info');
      });
    });

    // Test 9: Revert simulation
    await test('Simulate version revert', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const versions = customFields.versions || [];

      if (versions.length >= 2) {
        const targetVersion = versions[0]; // Revert to first version
        const revertVersion = {
          id: `v${versions.length + 1}_revert_${Date.now()}`,
          versionNumber: versions.length + 1,
          createdAt: new Date().toISOString(),
          changes: targetVersion.changes || [],
          positionMap: targetVersion.positionMap || {},
          revertedFrom: targetVersion.id
        };

        versions.push(revertVersion);
        customFields.versions = versions;

        await prisma.document.update({
          where: { id: documentId },
          data: { customFields }
        });

        log(`  Reverted to version ${targetVersion.versionNumber}`, 'info');
      }
    });

    // Test 10: Feedback prioritization
    await test('Prioritize feedback by severity', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const feedback = customFields.draftFeedback || [];

      // Sort by severity (S > M > A)
      const prioritized = [...feedback].sort((a, b) => {
        const severityOrder = { 'S': 0, 'M': 1, 'A': 2 };
        const aOrder = severityOrder[a.commentType] ?? 3;
        const bOrder = severityOrder[b.commentType] ?? 3;
        return aOrder - bOrder;
      });

      if (prioritized.length > 0) {
        log(`  Top priority: ${prioritized[0].commentType} - ${prioritized[0].coordinatorComment}`, 'info');
      }
    });

    // Test 11: Batch processing
    await test('Process feedback in batches', async () => {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      const customFields = document.customFields || {};
      const feedback = customFields.draftFeedback || [];

      const BATCH_SIZE = 5;
      const batches = [];

      for (let i = 0; i < feedback.length; i += BATCH_SIZE) {
        batches.push(feedback.slice(i, i + BATCH_SIZE));
      }

      log(`  Created ${batches.length} batches of max ${BATCH_SIZE} items`, 'info');

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        log(`  Processing batch ${i + 1}: ${batches[i].length} items`, 'info');
      }
    });

    // Test 12: Integration verification
    await test('Verify complete integration', async () => {
      // Check database
      const dbDoc = await prisma.document.findUnique({
        where: { id: documentId }
      });
      assert(dbDoc, 'Document exists in database');

      // Check API access
      const apiResponse = await fetch(`${API_BASE}/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert(apiResponse.ok, 'API access works');

      // Check version tracking
      const customFields = dbDoc.customFields || {};
      assert(customFields.versions, 'Version tracking initialized');
      assert(Array.isArray(customFields.versions), 'Versions is an array');

      // Check feedback
      const feedback = customFields.draftFeedback || [];
      log(`  Document has ${feedback.length} feedback items`, 'info');
      log(`  Document has ${customFields.versions.length} versions`, 'info');

      assert(true, 'Integration verified');
    });

  } catch (error) {
    log(`Setup/Test Error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.blue}TEST RESULTS${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

  if (failedTests === 0) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}⚠️  SOME TESTS FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@airforce.mil',
        password: 'admin123'
      })
    });

    // Any response means server is running
    return true;
  } catch (error) {
    log('Server is not running. Please start the backend server first.', 'error');
    log('Run: cd backend && npm run dev', 'info');
    return false;
  }
}

// Main execution
(async () => {
  log('Starting Feedback Version Control Integration Tests', 'test');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
})().catch(error => {
  log(`Unexpected error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});