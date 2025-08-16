const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// We'll import the app after setting up the environment
let app;
let prisma;
let authToken;
let testUser;
let testOrganization;
let testDocument;

describe('Publishing System Integration Tests', () => {
  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/dms_test"
        }
      }
    });

    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Publishing Org',
        domain: 'testpub.com',
        isActive: true,
        settings: {}
      }
    });

    // Create test role
    const testRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Administrator role for testing',
        permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN'],
        isSystem: true,
        organizationId: testOrganization.id
      }
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'testpub@test.com',
        firstName: 'Test',
        lastName: 'Publisher',
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        organizationId: testOrganization.id,
        roleId: testRole.id
      }
    });

    // Create test document
    testDocument = await prisma.document.create({
      data: {
        title: 'Test Document for Publishing Integration',
        description: 'Integration test document',
        fileName: 'test-integration.pdf',
        originalName: 'test-integration.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        checksum: 'integration-test-checksum',
        storagePath: '/test/integration/path',
        status: 'APPROVED',
        category: 'Integration',
        tags: ['test', 'integration', 'publishing'],
        customFields: {},
        createdById: testUser.id,
        organizationId: testOrganization.id,
        currentVersion: 1
      }
    });

    // Import app after database setup
    const createApp = require('../src/server');
    app = createApp;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testpub@test.com',
        password: 'testpassword'
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.document.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.user.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.role.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.organization.delete({ where: { id: testOrganization.id } });
    await prisma.$disconnect();
  });

  describe('Publishing Workflow Full Lifecycle', () => {
    let workflowId;
    let publishingId;
    let approvalId;

    test('1. Create a publishing workflow', async () => {
      const workflowData = {
        name: 'Integration Test Workflow',
        description: 'End-to-end integration test workflow',
        workflowType: 'DOCUMENT_APPROVAL',
        autoApprove: false,
        requiredApprovers: 1,
        allowParallel: false,
        timeoutHours: 48,
        approvalSteps: [
          {
            stepNumber: 1,
            stepName: 'Integration Review',
            description: 'Integration test approval step',
            isRequired: true,
            timeoutHours: 24,
            minApprovals: 1,
            allowDelegation: true,
            requiredUsers: [testUser.id]
          }
        ]
      };

      const response = await request(app)
        .post('/api/publishing/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toBeDefined();
      expect(response.body.workflow.name).toBe(workflowData.name);
      expect(response.body.workflow.approvalSteps).toHaveLength(1);
      
      workflowId = response.body.workflow.id;
    });

    test('2. Submit document for publishing', async () => {
      const submitData = {
        documentId: testDocument.id,
        workflowId: workflowId,
        urgencyLevel: 'NORMAL',
        publishingNotes: 'Integration test submission',
        destinations: [
          {
            destinationType: 'WEB_PORTAL',
            destinationName: 'Integration Test Portal',
            destinationConfig: { testMode: true }
          }
        ]
      };

      const response = await request(app)
        .post('/api/publishing/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(submitData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publishing).toBeDefined();
      expect(response.body.publishing.publishingStatus).toBe('PENDING_APPROVAL');
      expect(response.body.publishing.currentStep).toBe(1);
      
      publishingId = response.body.publishing.id;
    });

    test('3. Check dashboard shows pending approval', async () => {
      const response = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard.pendingApprovals).toBeGreaterThan(0);
      expect(response.body.dashboard.myApprovals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            publishingId: publishingId,
            status: 'PENDING'
          })
        ])
      );
    });

    test('4. Process approval', async () => {
      // First get the approval step ID from the dashboard
      const dashboardResponse = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      const approval = dashboardResponse.body.dashboard.myApprovals.find(
        a => a.publishingId === publishingId
      );
      
      expect(approval).toBeDefined();
      const stepId = approval.stepId;

      const approvalData = {
        publishingId: publishingId,
        stepId: stepId,
        decision: 'APPROVE',
        comments: 'Integration test approval - looks good!'
      };

      const response = await request(app)
        .post('/api/publishing/approvals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approval).toBeDefined();
      expect(response.body.approval.decision).toBe('APPROVE');
      
      approvalId = response.body.approval.id;
    });

    test('5. Verify publishing status updated to approved', async () => {
      // Wait a moment for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // The publishing should now be approved and potentially published
      const publishingRecord = await prisma.documentPublishing.findUnique({
        where: { id: publishingId }
      });

      expect(publishingRecord.publishingStatus).toBe('APPROVED');
    });

    test('6. Check notifications were created', async () => {
      const response = await request(app)
        .get('/api/publishing/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            publishingId: publishingId,
            notificationType: 'APPROVAL_REQUEST'
          })
        ])
      );
    });
  });

  describe('Template Management Integration', () => {
    let templateId;

    test('Create publishing template', async () => {
      const templateData = {
        name: 'Integration Test Template',
        description: 'Template for integration testing',
        templateType: 'STANDARD',
        formatting: {
          fontFamily: 'Arial',
          fontSize: 11,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          colors: {
            primary: '#000000',
            secondary: '#555555'
          }
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          columns: 1
        },
        metadata: {
          version: '1.0',
          author: 'Integration Test'
        },
        includeQRCode: true,
        includeWatermark: false
      };

      const response = await request(app)
        .post('/api/publishing/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.template).toBeDefined();
      expect(response.body.template.name).toBe(templateData.name);
      
      templateId = response.body.template.id;
    });

    test('Retrieve templates', async () => {
      const response = await request(app)
        .get('/api/publishing/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: templateId,
            name: 'Integration Test Template'
          })
        ])
      );
    });
  });

  describe('Collaborative Workflow Integration', () => {
    test('Create collaborative review', async () => {
      const collaborativeData = {
        documentId: testDocument.id,
        reviewType: 'PARALLEL',
        reviewers: [
          {
            userId: testUser.id,
            role: 'Integration Reviewer',
            requiredAction: 'APPROVE',
            priority: 1
          }
        ],
        allowSimultaneousEditing: false,
        requireConsensus: false,
        minimumApprovals: 1
      };

      const response = await request(app)
        .post('/api/publishing/collaborative/review')
        .set('Authorization', `Bearer ${authToken}`)
        .send(collaborativeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publishing).toBeDefined();
      expect(response.body.publishing.publishingStatus).toBe('PENDING_APPROVAL');
    });

    test('Create editing session', async () => {
      const sessionData = {
        documentId: testDocument.id,
        participantIds: [testUser.id]
      };

      const response = await request(app)
        .post('/api/publishing/collaborative/editing-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
      expect(response.body.session.participants).toContain(testUser.id);
    });
  });

  describe('Distribution Analytics Integration', () => {
    test('Get distribution analytics', async () => {
      const response = await request(app)
        .get('/api/publishing/distribution/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics).toHaveProperty('totalDistributions');
      expect(response.body.analytics).toHaveProperty('distributionsByMethod');
      expect(response.body.analytics).toHaveProperty('averageDeliveryRate');
    });
  });

  describe('Error Handling Integration', () => {
    test('Handle invalid workflow submission', async () => {
      const invalidData = {
        // Missing required fields
        description: 'Invalid workflow'
      };

      const response = await request(app)
        .post('/api/publishing/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('Handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('Handle non-existent document publishing', async () => {
      const nonExistentData = {
        documentId: 'non-existent-id',
        workflowId: 'also-non-existent',
        urgencyLevel: 'NORMAL'
      };

      const response = await request(app)
        .post('/api/publishing/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nonExistentData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance and Scalability Tests', () => {
    test('Handle multiple concurrent approvals', async () => {
      const promises = [];
      
      // Create multiple workflows and submissions
      for (let i = 0; i < 5; i++) {
        const workflowPromise = request(app)
          .post('/api/publishing/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Concurrent Workflow ${i}`,
            description: `Concurrent test workflow ${i}`,
            workflowType: 'DOCUMENT_APPROVAL',
            autoApprove: false,
            requiredApprovers: 1,
            approvalSteps: [{
              stepNumber: 1,
              stepName: `Concurrent Step ${i}`,
              isRequired: true,
              minApprovals: 1,
              requiredUsers: [testUser.id]
            }]
          });
        
        promises.push(workflowPromise);
      }

      const responses = await Promise.all(promises);
      
      // All workflows should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(responses.length).toBe(5);
    });

    test('Dashboard loads efficiently with multiple items', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });
});