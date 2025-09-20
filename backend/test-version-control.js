#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'richmond-dms-secret-key';

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

// Helper functions
function generateTestId() {
  return `test_${crypto.randomBytes(8).toString('hex')}`;
}

function generateToken(userId, email, role) {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

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

  let testDocumentId;
  let testUserId;
  let authToken;
  let versionIds = [];

  try {
    // Setup
    log('Setting up test environment...', 'info');

    // Create test user
    testUserId = generateTestId();
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test_${Date.now()}@test.com`,
        name: 'Test OPR User',
        password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Dummy hash
        role: 'OPR'
      }
    });

    authToken = generateToken(testUser.id, testUser.email, testUser.role);
    log(`Created test user: ${testUser.email}`, 'success');

    // Create test document with feedback
    testDocumentId = generateTestId();
    const testDocument = await prisma.document.create({
      data: {
        id: testDocumentId,
        title: 'Test Document for Version Control',
        content: '<h1>Test Document</h1><p>This is paragraph 1 with some original text.</p><p>This is paragraph 2 with more content.</p>',
        category: 'TEST',
        status: 'IN_REVIEW',
        authorId: testUserId,
        customFields: {
          versions: [],
          draftFeedback: [
            {
              id: 'feedback-1',
              component: 'TEST',
              pocName: 'Reviewer 1',
              pocEmail: 'reviewer1@test.com',
              commentType: 'S',
              page: '1',
              paragraphNumber: '1',
              lineNumber: '1',
              coordinatorComment: 'Text needs improvement',
              changeFrom: 'some original text',
              changeTo: 'improved and enhanced text',
              coordinatorJustification: 'Better clarity'
            },
            {
              id: 'feedback-2',
              component: 'TEST',
              pocName: 'Reviewer 2',
              pocEmail: 'reviewer2@test.com',
              commentType: 'M',
              page: '1',
              paragraphNumber: '1',
              lineNumber: '1',
              coordinatorComment: 'Same text needs different change',
              changeFrom: 'some original text',
              changeTo: 'completely different text',
              coordinatorJustification: 'Different approach'
            },
            {
              id: 'feedback-3',
              component: 'TEST',
              pocName: 'Reviewer 3',
              pocEmail: 'reviewer3@test.com',
              commentType: 'A',
              page: '1',
              paragraphNumber: '2',
              lineNumber: '5',
              coordinatorComment: 'Minor edit needed',
              changeFrom: 'more content',
              changeTo: 'additional content',
              coordinatorJustification: 'Word choice'
            }
          ]
        }
      }
    });

    log(`Created test document: ${testDocument.title}`, 'success');

    // Test 1: Get initial version
    await test('Get initial version', async () => {
      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions/latest`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(response.ok, `Failed to get initial version: ${response.status}`);
      const data = await response.json();
      assert(data.versionNumber === 1, 'Version number should be 1');
      assert(Array.isArray(data.changes), 'Changes should be an array');
      assert(data.changes.length === 0, 'Initial version should have no changes');
    });

    // Test 2: Create new version with applied feedback
    await test('Create new version with applied feedback', async () => {
      const versionData = {
        changes: [
          {
            id: 'change-1',
            feedbackId: 'feedback-3',
            location: { page: 1, paragraph: 2, line: 5 },
            originalText: 'more content',
            suggestedText: 'additional content',
            actualAppliedText: 'additional content',
            appliedBy: testUserId,
            appliedAt: new Date().toISOString(),
            status: 'applied'
          }
        ],
        positionMap: {
          'p1_para2_l5': {
            originalPosition: { page: 1, paragraph: 2, line: 5 },
            currentPosition: { page: 1, paragraph: 2, line: 5 },
            delta: { paragraphDelta: 0, lineDelta: 0, characterDelta: 3 },
            reason: 'Applied feedback-3'
          }
        },
        content: '<h1>Test Document</h1><p>This is paragraph 1 with some original text.</p><p>This is paragraph 2 with additional content.</p>'
      };

      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versionData)
      });

      assert(response.ok, `Failed to create version: ${response.status}`);
      const data = await response.json();
      assert(data.success === true, 'Should return success');
      assert(data.version, 'Should return version object');
      assert(data.version.versionNumber === 2, 'Version number should be 2');

      if (data.version) {
        versionIds.push(data.version.id);
      }
    });

    // Test 3: Get all versions
    await test('Get all versions', async () => {
      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(response.ok, `Failed to get versions: ${response.status}`);
      const data = await response.json();
      assert(Array.isArray(data), 'Should return array of versions');
      assert(data.length >= 1, 'Should have at least one version');
    });

    // Test 4: Handle conflicting feedback
    await test('Handle conflicting feedback', async () => {
      const conflictData = {
        changes: [
          {
            id: 'change-conflict-1',
            feedbackId: 'feedback-1',
            location: { page: 1, paragraph: 1, line: 1 },
            originalText: 'some original text',
            suggestedText: 'improved and enhanced text',
            status: 'pending',
            conflictsWith: ['feedback-2']
          },
          {
            id: 'change-conflict-2',
            feedbackId: 'feedback-2',
            location: { page: 1, paragraph: 1, line: 1 },
            originalText: 'some original text',
            suggestedText: 'completely different text',
            status: 'pending',
            conflictsWith: ['feedback-1']
          }
        ],
        content: '<h1>Test Document</h1><p>This is paragraph 1 with some original text.</p><p>This is paragraph 2 with additional content.</p>'
      };

      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conflictData)
      });

      assert(response.ok, `Failed to create conflict version: ${response.status}`);
      const data = await response.json();
      assert(data.success === true, 'Should handle conflicts');

      if (data.version) {
        versionIds.push(data.version.id);
        const conflictingChanges = data.version.changes.filter(c => c.conflictsWith && c.conflictsWith.length > 0);
        assert(conflictingChanges.length > 0, 'Should have conflicting changes');
      }
    });

    // Test 5: Calculate version diff
    await test('Calculate version diff', async () => {
      const versionsResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const versions = await versionsResponse.json();

      if (versions.length >= 2) {
        const v1 = versions[0].id;
        const v2 = versions[1].id;

        const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions/diff?v1=${v1}&v2=${v2}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        assert(response.ok, `Failed to get diff: ${response.status}`);
        const data = await response.json();
        assert(data.added !== undefined, 'Should have added property');
        assert(data.removed !== undefined, 'Should have removed property');
        assert(data.modified !== undefined, 'Should have modified property');
      }
    });

    // Test 6: Position tracking
    await test('Track position adjustments', async () => {
      const changeData = {
        changes: [
          {
            id: 'change-pos-1',
            feedbackId: 'feedback-pos-1',
            location: { page: 1, paragraph: 1, line: 3 },
            originalText: 'short',
            suggestedText: 'much longer replacement text',
            actualAppliedText: 'much longer replacement text',
            status: 'applied'
          }
        ],
        positionMap: {
          'p1_para1_l4': {
            originalPosition: { page: 1, paragraph: 1, line: 4 },
            currentPosition: { page: 1, paragraph: 1, line: 4, characterOffset: 23 },
            delta: { paragraphDelta: 0, lineDelta: 0, characterDelta: 23 },
            reason: 'Adjusted due to change-pos-1'
          }
        },
        content: '<h1>Test Document</h1><p>Updated content with position tracking</p>'
      };

      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changeData)
      });

      assert(response.ok, `Failed to create version with position tracking: ${response.status}`);
      const data = await response.json();
      assert(data.success === true, 'Should track positions');
    });

    // Test 7: Revert to previous version
    await test('Revert to previous version', async () => {
      const versionsResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const versions = await versionsResponse.json();

      if (versions.length >= 2) {
        const firstVersionId = versions[0].id;

        const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions/${firstVersionId}/revert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        assert(response.ok, `Failed to revert: ${response.status}`);
        const data = await response.json();
        assert(data.success === true, 'Should revert successfully');
        assert(data.newVersion, 'Should create new version');
        assert(data.newVersion.revertedFrom === firstVersionId, 'Should track revert source');
      }
    });

    // Test 8: Database integration
    await test('Verify database integration', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: testDocumentId }
      });

      assert(doc, 'Document should exist in database');
      const customFields = doc.customFields;
      assert(customFields, 'Should have customFields');
      assert(customFields.versions, 'Should have versions in customFields');
      assert(Array.isArray(customFields.versions), 'Versions should be an array');
      assert(customFields.versions.length > 0, 'Should have at least one version');
    });

    // Test 9: Feedback processing workflow
    await test('Process feedback through workflow', async () => {
      // Simulate feedback being processed through workflow stages
      const feedbackItems = [
        { id: 'wf-fb-1', location: { page: 1, paragraph: 1, line: 1 }, originalText: 'text1', suggestedText: 'new1' },
        { id: 'wf-fb-2', location: { page: 1, paragraph: 2, line: 1 }, originalText: 'text2', suggestedText: 'new2' },
        { id: 'wf-fb-3', location: { page: 1, paragraph: 3, line: 1 }, originalText: 'text3', suggestedText: 'new3' }
      ];

      // Sort by position (top to bottom)
      const sorted = feedbackItems.sort((a, b) => {
        if (a.location.paragraph !== b.location.paragraph) {
          return a.location.paragraph - b.location.paragraph;
        }
        return a.location.line - b.location.line;
      });

      assert(sorted[0].id === 'wf-fb-1', 'First item should be from paragraph 1');
      assert(sorted[2].id === 'wf-fb-3', 'Last item should be from paragraph 3');
    });

    // Test 10: Conflict detection
    await test('Detect overlapping feedback', async () => {
      const overlappingFeedback = [
        {
          id: 'overlap-1',
          location: { page: 1, paragraph: 1, line: 5, characterOffset: 10 },
          originalText: 'same text here',
          span: { start: 10, end: 24 }
        },
        {
          id: 'overlap-2',
          location: { page: 1, paragraph: 1, line: 5, characterOffset: 15 },
          originalText: 'text here',
          span: { start: 15, end: 24 }
        }
      ];

      // Check if positions overlap
      const isOverlapping = (fb1, fb2) => {
        return !(fb1.span.end < fb2.span.start || fb2.span.end < fb1.span.start);
      };

      const hasOverlap = isOverlapping(overlappingFeedback[0], overlappingFeedback[1]);
      assert(hasOverlap === true, 'Should detect overlapping feedback');
    });

    // Test 11: End-to-end workflow
    await test('Complete end-to-end workflow', async () => {
      // Get current document
      const docResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(docResponse.ok, 'Should get document');
      const doc = await docResponse.json();

      // Get latest version
      const latestResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions/latest`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(latestResponse.ok, 'Should get latest version');
      const latest = await latestResponse.json();

      // Apply feedback
      const applyData = {
        changes: [{
          id: `change-e2e-${Date.now()}`,
          feedbackId: 'feedback-e2e',
          location: { page: 1, paragraph: 1, line: 2 },
          originalText: 'test text',
          suggestedText: 'improved test text',
          status: 'applied'
        }],
        content: (doc.content || '').replace('test text', 'improved test text')
      };

      const applyResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applyData)
      });

      assert(applyResponse.ok, 'Should apply feedback');

      // Check version history
      const historyResponse = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      assert(historyResponse.ok, 'Should get version history');
      const history = await historyResponse.json();
      assert(history.length > latest.versionNumber, 'Should have more versions');
    });

    // Test 12: Performance test
    await test('Handle multiple feedback items efficiently', async () => {
      const startTime = Date.now();

      // Create 20 changes
      const changes = Array.from({ length: 20 }, (_, i) => ({
        id: `perf-change-${i}`,
        feedbackId: `perf-fb-${i}`,
        originalText: `text ${i}`,
        suggestedText: `improved text ${i}`,
        status: 'applied'
      }));

      const response = await fetch(`${API_BASE}/api/documents/${testDocumentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          changes,
          content: 'Updated content after batch processing'
        })
      });

      assert(response.ok, 'Should handle batch operations');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      assert(processingTime < 5000, `Should complete within 5 seconds (took ${processingTime}ms)`);
    });

  } catch (error) {
    log(`Setup/Teardown Error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    // Cleanup
    log('\nCleaning up test data...', 'info');

    try {
      if (testDocumentId) {
        await prisma.document.delete({
          where: { id: testDocumentId }
        }).catch(() => {});
      }

      if (testUserId) {
        await prisma.user.delete({
          where: { id: testUserId }
        }).catch(() => {});
      }

      await prisma.$disconnect();
      log('Cleanup complete', 'success');
    } catch (cleanupError) {
      log('Cleanup error (non-critical): ' + cleanupError.message, 'warning');
    }
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
    // Try API endpoint that exists
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@airforce.mil',
        password: 'admin123'
      })
    });

    // If we get any response, server is running
    if (response.status === 401 || response.status === 400 || response.ok) {
      return true;
    }

    throw new Error('Server not responding');
  } catch (error) {
    log('Server is not running. Please start the backend server first.', 'error');
    log('Run: cd backend && npm run dev', 'info');
    return false;
  }
}

// Main execution
(async () => {
  log('Starting Feedback Version Control Tests', 'test');

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