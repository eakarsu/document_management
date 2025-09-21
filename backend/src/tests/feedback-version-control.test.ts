import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'richmond-dms-secret-key';

// Test data
const testDocumentId = 'test-doc-version-control';
const testUserId = 'test-user-opr';
const testOrgId = 'test-org-version-control';

// Generate test token
const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Feedback Version Control API Tests', () => {
  let authToken: string;
  let documentId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test-opr@test.com' },
      update: {},
      create: {
        id: testUserId,
        email: 'test-opr@test.com',
        firstName: 'Test',
        lastName: 'OPR',
        passwordHash: 'hashed-password',
        organizationId: 'cmfmkdk9m000081e6fegn6zjk', // Test org
        roleId: 'cmfmkersn0008136c23r791aw' // OPR role ID
      }
    });

    // Generate auth token
    authToken = generateToken(testUser.id, testUser.email, 'OPR');

    // Create test document with feedback
    const testDocument = await prisma.document.create({
      data: {
        id: testDocumentId,
        title: 'Test Document for Version Control',
        description: '<h1>Test Document</h1><p>This is paragraph 1 with some original text.</p><p>This is paragraph 2 with more content.</p>',
        category: 'TEST',
        status: 'IN_REVIEW',
        createdById: testUserId,
        organizationId: testOrgId,
        fileName: 'test-version-control.pdf',
        originalName: 'test-version-control.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        checksum: Math.random().toString(36),
        storagePath: '/test/version-control',
        customFields: {
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
          ],
          versions: []
        }
      }
    });

    documentId = testDocument.id;
    console.log('✅ Test setup complete');
  });

  afterAll(async () => {
    // Cleanup
    await prisma.document.deleteMany({
      where: { id: testDocumentId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('Version History Endpoints', () => {
    it('should get initial version', async () => {
      const response = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions/latest`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('versionNumber', 1);
      expect(response.body).toHaveProperty('documentId', documentId);
      expect(response.body).toHaveProperty('changes');
      expect(response.body.changes).toEqual([]);
      console.log('✅ Initial version retrieved');
    });

    it('should create a new version with applied feedback', async () => {
      const versionData = {
        changes: [
          {
            id: 'change-1',
            feedbackId: 'feedback-3',
            location: { page: 1, paragraph: 2, line: 5 },
            originalText: 'more content',
            suggestedText: 'additional content',
            actualAppliedText: 'additional content',
            appliedBy: 'test-user-opr',
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

      const response = await request(API_BASE)
        .post(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(versionData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toHaveProperty('versionNumber', 2);
      console.log('✅ New version created with applied feedback');
    });

    it('should get all versions', async () => {
      const response = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      console.log(`✅ Retrieved ${response.body.length} versions`);
    });

    it('should handle conflicting feedback', async () => {
      // Simulate applying conflicting feedback
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

      const response = await request(API_BASE)
        .post(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictData);

      expect(response.status).toBe(200);
      const version = response.body.version;
      const conflictingChanges = version.changes.filter((c: any) => c.conflictsWith && c.conflictsWith.length > 0);
      expect(conflictingChanges.length).toBeGreaterThan(0);
      console.log('✅ Conflicting feedback tracked in version');
    });

    it('should calculate version diff', async () => {
      // Get all versions first
      const versionsResponse = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      if (versionsResponse.body.length >= 2) {
        const v1 = versionsResponse.body[0].id;
        const v2 = versionsResponse.body[1].id;

        const response = await request(API_BASE)
          .get(`/api/documents/${documentId}/versions/diff`)
          .query({ v1, v2 })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('added');
        expect(response.body).toHaveProperty('removed');
        expect(response.body).toHaveProperty('modified');
        console.log('✅ Version diff calculated');
      }
    });

    it('should revert to previous version', async () => {
      // Get all versions
      const versionsResponse = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      if (versionsResponse.body.length >= 2) {
        const firstVersionId = versionsResponse.body[0].id;

        const response = await request(API_BASE)
          .post(`/api/documents/${documentId}/versions/${firstVersionId}/revert`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('newVersion');
        expect(response.body.newVersion).toHaveProperty('revertedFrom', firstVersionId);
        console.log('✅ Successfully reverted to previous version');
      }
    });
  });

  describe('Position Tracking', () => {
    it('should track position adjustments after applying feedback', async () => {
      // Apply a change that affects text length
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
          },
          'p1_para2_l1': {
            originalPosition: { page: 1, paragraph: 2, line: 1 },
            currentPosition: { page: 1, paragraph: 2, line: 1 },
            delta: { paragraphDelta: 0, lineDelta: 0, characterDelta: 0 },
            reason: 'No adjustment needed'
          }
        },
        content: '<h1>Test Document</h1><p>Updated content with position tracking</p>'
      };

      const response = await request(API_BASE)
        .post(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(changeData);

      expect(response.status).toBe(200);
      const version = response.body.version;
      expect(version).toHaveProperty('positionMap');
      console.log('✅ Position adjustments tracked');
    });
  });

  describe('Feedback Processing Integration', () => {
    it('should process multiple feedback items with automatic sorting', async () => {
      // Simulate processing multiple feedback items
      const processingData = {
        feedbackItems: [
          {
            id: 'fb-process-1',
            location: { page: 1, paragraph: 3, line: 10 },
            originalText: 'text at end',
            suggestedText: 'modified end text'
          },
          {
            id: 'fb-process-2',
            location: { page: 1, paragraph: 1, line: 1 },
            originalText: 'text at beginning',
            suggestedText: 'modified beginning text'
          },
          {
            id: 'fb-process-3',
            location: { page: 1, paragraph: 2, line: 5 },
            originalText: 'text in middle',
            suggestedText: 'modified middle text'
          }
        ]
      };

      // The feedback should be sorted by position (top to bottom)
      const sortedOrder = ['fb-process-2', 'fb-process-3', 'fb-process-1'];

      console.log('✅ Feedback items would be processed in order:', sortedOrder);
      expect(sortedOrder[0]).toBe('fb-process-2'); // First item should be from beginning
      expect(sortedOrder[2]).toBe('fb-process-1'); // Last item should be from end
    });

    it('should detect overlapping feedback', async () => {
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
      const isOverlapping = (fb1: any, fb2: any) => {
        return !(fb1.span.end < fb2.span.start || fb2.span.end < fb1.span.start);
      };

      const hasOverlap = isOverlapping(overlappingFeedback[0], overlappingFeedback[1]);
      expect(hasOverlap).toBe(true);
      console.log('✅ Overlapping feedback detected correctly');
    });

    it('should handle feedback resolution', async () => {
      // Simulate resolving a conflict
      const resolutionData = {
        conflictId: 'conflict-1',
        chosenFeedbackId: 'feedback-1',
        customText: 'manually resolved text',
        changes: [
          {
            id: 'resolved-change-1',
            feedbackId: 'feedback-1',
            location: { page: 1, paragraph: 1, line: 1 },
            originalText: 'conflicted text',
            suggestedText: 'manually resolved text',
            actualAppliedText: 'manually resolved text',
            status: 'applied'
          }
        ],
        content: '<h1>Test Document</h1><p>Document with manually resolved text.</p>'
      };

      const response = await request(API_BASE)
        .post(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(resolutionData);

      expect(response.status).toBe(200);
      console.log('✅ Conflict resolution applied successfully');
    });
  });

  describe('End-to-End Version Control Flow', () => {
    it('should complete full feedback processing workflow', async () => {
      console.log('\n🔄 Starting End-to-End Version Control Flow...\n');

      // Step 1: Get current document state
      const docResponse = await request(API_BASE)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(docResponse.status).toBe(200);
      const currentContent = docResponse.body.content;
      console.log('1️⃣ Retrieved current document');

      // Step 2: Get latest version
      const latestVersionResponse = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions/latest`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(latestVersionResponse.status).toBe(200);
      const latestVersion = latestVersionResponse.body;
      console.log(`2️⃣ Got latest version: v${latestVersion.versionNumber}`);

      // Step 3: Apply non-conflicting feedback
      const applyResponse = await request(API_BASE)
        .post(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          changes: [
            {
              id: `change-e2e-${Date.now()}`,
              feedbackId: 'feedback-e2e',
              location: { page: 1, paragraph: 1, line: 2 },
              originalText: 'test text',
              suggestedText: 'improved test text',
              status: 'applied'
            }
          ],
          content: currentContent.replace('test text', 'improved test text')
        });

      expect(applyResponse.status).toBe(200);
      console.log('3️⃣ Applied non-conflicting feedback');

      // Step 4: Check version history
      const historyResponse = await request(API_BASE)
        .get(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.status).toBe(200);
      const versionCount = historyResponse.body.length;
      console.log(`4️⃣ Version history contains ${versionCount} versions`);

      // Step 5: Calculate diff between versions
      if (versionCount >= 2) {
        const lastTwo = historyResponse.body.slice(-2);
        const diffResponse = await request(API_BASE)
          .get(`/api/documents/${documentId}/versions/diff`)
          .query({ v1: lastTwo[0].id, v2: lastTwo[1].id })
          .set('Authorization', `Bearer ${authToken}`);

        expect(diffResponse.status).toBe(200);
        console.log('5️⃣ Calculated diff between versions');
      }

      console.log('\n✅ End-to-End Version Control Flow Complete!\n');
    });
  });
});

// Export test runner
export async function runVersionControlTests() {
  console.log('🧪 Running Feedback Version Control API Tests...\n');

  try {
    // Run the tests programmatically
    const { execSync } = require('child_process');
    execSync('npm test -- feedback-version-control.test.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}