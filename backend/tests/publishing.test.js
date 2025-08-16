const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock the services
jest.mock('../src/services/PublishingService');
jest.mock('../src/services/TemplateService');
jest.mock('../src/services/CollaborativeWorkflowService');
jest.mock('../src/services/DistributionService');
jest.mock('../src/services/NotificationService');

const { publishingRouter } = require('../src/routes/publishing');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    organizationId: 'test-org-id'
  };
  next();
});

app.use('/api/publishing', publishingRouter);

const prisma = new PrismaClient();

describe('Publishing API Endpoints', () => {
  let authToken;
  let testUser;
  let testOrganization;
  let testDocument;

  beforeAll(async () => {
    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.com',
        isActive: true
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed_password',
        organizationId: testOrganization.id,
        role: {
          create: {
            name: 'Admin',
            description: 'Administrator role',
            permissions: ['READ', 'WRITE', 'DELETE'],
            organizationId: testOrganization.id,
            isSystem: true
          }
        }
      }
    });

    // Create test document
    testDocument = await prisma.document.create({
      data: {
        title: 'Test Document',
        description: 'Test document for publishing',
        fileName: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        checksum: 'test-checksum',
        storagePath: '/test/path',
        status: 'APPROVED',
        createdById: testUser.id,
        organizationId: testOrganization.id
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.document.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.user.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.role.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.organization.delete({ where: { id: testOrganization.id } });
    await prisma.$disconnect();
  });

  describe('Publishing Workflows', () => {
    test('POST /api/publishing/workflows - Create workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test workflow description',
        workflowType: 'DOCUMENT_APPROVAL',
        autoApprove: false,
        requiredApprovers: 1,
        allowParallel: false,
        timeoutHours: 72,
        approvalSteps: [
          {
            stepNumber: 1,
            stepName: 'Initial Review',
            description: 'First level approval',
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
    });

    test('POST /api/publishing/submit - Submit for publishing', async () => {
      // First create a workflow
      const workflow = await prisma.publishingWorkflow.create({
        data: {
          name: 'Test Workflow',
          workflowType: 'DOCUMENT_APPROVAL',
          organizationId: testOrganization.id
        }
      });

      const publishData = {
        documentId: testDocument.id,
        workflowId: workflow.id,
        urgencyLevel: 'NORMAL',
        destinations: [
          {
            destinationType: 'WEB_PORTAL',
            destinationName: 'Internal Portal',
            destinationConfig: {}
          }
        ]
      };

      const response = await request(app)
        .post('/api/publishing/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(publishData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publishing).toBeDefined();
    });

    test('POST /api/publishing/approvals - Process approval', async () => {
      const approvalData = {
        publishingId: 'test-publishing-id',
        stepId: 'test-step-id',
        decision: 'APPROVE',
        comments: 'Looks good to me'
      };

      const response = await request(app)
        .post('/api/publishing/approvals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approval).toBeDefined();
    });

    test('GET /api/publishing/dashboard - Get dashboard data', async () => {
      const response = await request(app)
        .get('/api/publishing/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard).toHaveProperty('pendingApprovals');
      expect(response.body.dashboard).toHaveProperty('scheduledPublications');
    });
  });

  describe('Publishing Templates', () => {
    test('POST /api/publishing/templates - Create template', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'Test template description',
        templateType: 'STANDARD',
        formatting: {
          fontFamily: 'Helvetica',
          fontSize: 12,
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait'
        },
        metadata: {
          version: '1.0'
        }
      };

      const response = await request(app)
        .post('/api/publishing/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.template).toBeDefined();
      expect(response.body.template.name).toBe(templateData.name);
    });

    test('GET /api/publishing/templates - Get templates', async () => {
      const response = await request(app)
        .get('/api/publishing/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    test('POST /api/publishing/templates/apply - Apply template', async () => {
      const applyData = {
        documentId: testDocument.id,
        templateId: 'test-template-id',
        customMetadata: {
          author: 'Test Author'
        }
      };

      const response = await request(app)
        .post('/api/publishing/templates/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
    });
  });

  describe('Collaborative Workflows', () => {
    test('POST /api/publishing/collaborative/review - Create collaborative review', async () => {
      const reviewData = {
        documentId: testDocument.id,
        reviewType: 'PARALLEL',
        reviewers: [
          {
            userId: testUser.id,
            role: 'Reviewer',
            requiredAction: 'APPROVE',
            priority: 1
          }
        ],
        allowSimultaneousEditing: true,
        requireConsensus: false,
        minimumApprovals: 1
      };

      const response = await request(app)
        .post('/api/publishing/collaborative/review')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publishing).toBeDefined();
    });

    test('POST /api/publishing/collaborative/editing-session - Create editing session', async () => {
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
    });

    test('POST /api/publishing/collaborative/changes - Record change', async () => {
      const changeData = {
        sessionId: 'test-session-id',
        changeType: 'CONTENT',
        description: 'Updated paragraph 1',
        data: { action: 'edit', content: 'new content' }
      };

      const response = await request(app)
        .post('/api/publishing/collaborative/changes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /api/publishing/collaborative/lock - Acquire lock', async () => {
      const lockData = {
        sessionId: 'test-session-id',
        lockDurationMinutes: 30
      };

      const response = await request(app)
        .post('/api/publishing/collaborative/lock')
        .set('Authorization', `Bearer ${authToken}`)
        .send(lockData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Document Distribution', () => {
    test('POST /api/publishing/distribution - Create distribution', async () => {
      const distributionData = {
        publishingId: 'test-publishing-id',
        distributionMethod: 'EMAIL',
        recipientType: 'INDIVIDUAL_USERS',
        recipientList: [
          {
            email: 'recipient@test.com',
            name: 'Test Recipient'
          }
        ],
        distributionFormat: 'PDF',
        includeAttachments: true,
        personalizedMessage: 'Please find the attached document.'
      };

      const response = await request(app)
        .post('/api/publishing/distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .send(distributionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.distribution).toBeDefined();
    });

    test('GET /api/publishing/distribution/analytics - Get analytics', async () => {
      const response = await request(app)
        .get('/api/publishing/distribution/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics).toHaveProperty('totalDistributions');
      expect(response.body.analytics).toHaveProperty('distributionsByMethod');
    });
  });

  describe('Notifications', () => {
    test('GET /api/publishing/notifications - Get notifications', async () => {
      const response = await request(app)
        .get('/api/publishing/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unreadCount');
    });

    test('PUT /api/publishing/notifications/:id/read - Mark as read', async () => {
      const notificationId = 'test-notification-id';
      
      const response = await request(app)
        .put(`/api/publishing/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('PUT /api/publishing/notifications/read-all - Mark all as read', async () => {
      const response = await request(app)
        .put('/api/publishing/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('Error Handling', () => {
    test('Should handle missing authentication', async () => {
      const response = await request(app)
        .get('/api/publishing/dashboard')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('Should handle invalid workflow data', async () => {
      const invalidWorkflowData = {
        // Missing required fields
        description: 'Invalid workflow'
      };

      const response = await request(app)
        .post('/api/publishing/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWorkflowData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('Should handle non-existent document publishing', async () => {
      const response = await request(app)
        .post('/non-existent-id/publish')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

// Integration tests
describe('Publishing Integration Tests', () => {
  test('Full publishing workflow', async () => {
    // 1. Create workflow
    const workflowResponse = await request(app)
      .post('/api/publishing/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Test Workflow',
        workflowType: 'DOCUMENT_APPROVAL',
        approvalSteps: [{
          stepNumber: 1,
          stepName: 'Review',
          isRequired: true,
          minApprovals: 1,
          requiredUsers: [testUser.id]
        }]
      });

    expect(workflowResponse.status).toBe(200);
    const workflowId = workflowResponse.body.workflow.id;

    // 2. Submit document for publishing
    const submitResponse = await request(app)
      .post('/api/publishing/submit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentId: testDocument.id,
        workflowId: workflowId,
        destinations: [{
          destinationType: 'WEB_PORTAL',
          destinationName: 'Test Portal',
          destinationConfig: {}
        }]
      });

    expect(submitResponse.status).toBe(200);
    const publishingId = submitResponse.body.publishing.id;

    // 3. Process approval
    const approvalResponse = await request(app)
      .post('/api/publishing/approvals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        publishingId: publishingId,
        stepId: 'step-id',
        decision: 'APPROVE'
      });

    expect(approvalResponse.status).toBe(200);

    // 4. Publish document
    const publishResponse = await request(app)
      .post(`/api/publishing/${publishingId}/publish`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(publishResponse.status).toBe(200);
  });
});

module.exports = {
  testSuite: describe
};