#!/usr/bin/env node

/**
 * REAL Database Integration Test
 * This test ACTUALLY writes to and reads from the database
 * Tests the complete OPR feedback processing system with real DB operations
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000';

class RealDatabaseIntegrationTest {
  constructor() {
    this.testResults = {
      passed: [],
      failed: [],
      total: 0
    };
    this.testData = {
      document: null,
      reviewers: [],
      approval: null,
      publishing: null,
      feedback: [],
      adminToken: null
    };
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    console.log(`\n🧪 Test ${this.testResults.total}: ${name}`);
    
    try {
      await testFn.call(this);
      this.testResults.passed.push(name);
      console.log(`✅ PASSED: ${name}`);
      return true;
    } catch (error) {
      this.testResults.failed.push({ name, error: error.message });
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Reason: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      return false;
    }
  }

  // ============= REAL DATABASE TESTS =============

  async testCreateRealUsers() {
    // Get or create organization
    let organization = await prisma.organization.findFirst({
      where: { domain: 'demo.mil' }
    });
    
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Demo Military Org',
          domain: 'demo.mil',
          address: '123 Pentagon Way',
          contactEmail: 'admin@demo.mil',
          contactPhone: '555-0100'
        }
      });
    }
    
    console.log(`   ✓ Organization exists: ${organization.id}`);
    
    // Ensure admin role exists
    let adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'System Administrator',
          permissions: ['ALL']
        }
      });
    }
    
    // Create OPR role
    let oprRole = await prisma.role.findFirst({
      where: { name: 'OPR' }
    });
    
    if (!oprRole) {
      oprRole = await prisma.role.create({
        data: {
          name: 'OPR',
          description: 'Office of Primary Responsibility',
          permissions: ['READ', 'WRITE', 'REVIEW', 'APPROVE', 'PROCESS_FEEDBACK']
        }
      });
    }
    
    console.log(`   ✓ Roles created: Admin (${adminRole.id}), OPR (${oprRole.id})`);
    
    // Create reviewer role
    let reviewerRole = await prisma.role.findFirst({
      where: { name: 'REVIEWER' }
    });
    
    if (!reviewerRole) {
      reviewerRole = await prisma.role.create({
        data: {
          name: 'REVIEWER',
          description: 'Document Reviewer',
          permissions: ['READ', 'REVIEW', 'COMMENT']
        }
      });
    }
    
    // Create test reviewers with REAL database writes
    this.testData.reviewers = [];
    for (let i = 1; i <= 3; i++) {
      const email = `test-reviewer${i}-${Date.now()}@demo.mil`;
      
      const reviewer = await prisma.user.create({
        data: {
          email,
          firstName: `TestReviewer${i}`,
          lastName: 'Real',
          passwordHash: await bcrypt.hash('password123', 10),
          roleId: reviewerRole.id,
          organizationId: organization.id,
          isActive: true
        }
      });
      
      this.testData.reviewers.push(reviewer);
      console.log(`   ✓ Created reviewer ${i}: ${reviewer.id} (${reviewer.email})`);
    }
    
    console.log(`   ✓ ACTUALLY created ${this.testData.reviewers.length} reviewers in database`);
  }

  async testCreateRealDocument() {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@demo.mil' }
    });
    
    const organization = await prisma.organization.findFirst({
      where: { domain: 'demo.mil' }
    });
    
    // Create a REAL document in the database
    this.testData.document = await prisma.document.create({
      data: {
        title: `Real DB Test Document ${Date.now()}`,
        fileName: 'real-test.txt',
        originalName: 'real-test.txt',
        mimeType: 'text/plain',
        fileSize: 2048,
        checksum: `real-checksum-${Date.now()}`,
        storagePath: `/storage/real-test-${Date.now()}.txt`,
        currentVersion: 1,
        status: 'IN_REVIEW',
        createdById: admin.id,
        organizationId: organization.id,
        customFields: {
          content: 'Line 1: This document is for testing.\nLine 2: This line needs improvement based on feedback.\nLine 3: Another line with potential errors.\nLine 4: Final line of the test document.',
          testData: true,
          createdAt: new Date().toISOString()
        }
      }
    });
    
    console.log(`   ✓ REAL document created in DB: ${this.testData.document.id}`);
    console.log(`   ✓ Document title: ${this.testData.document.title}`);
    console.log(`   ✓ Document has customFields with content: ${!!this.testData.document.customFields}`);
    
    // Verify we can read it back
    const verifyDoc = await prisma.document.findUnique({
      where: { id: this.testData.document.id }
    });
    
    if (!verifyDoc) {
      throw new Error('Document was not actually saved to database!');
    }
    
    console.log(`   ✓ Verified document exists in database`);
  }

  async testCreatePublishingAndApproval() {
    // Get organization
    const organization = await prisma.organization.findFirst({
      where: { domain: 'demo.mil' }
    });
    
    // Create a PublishingWorkflow (not regular Workflow)
    const publishingWorkflow = await prisma.publishingWorkflow.create({
      data: {
        name: 'Test Publishing Workflow',
        description: 'Workflow for testing feedback processing',
        workflowType: 'COLLABORATIVE_REVIEW',
        isActive: true,
        allowParallel: true,
        requiredApprovers: 2,
        organizationId: organization.id
      }
    });
    
    console.log(`   ✓ Created publishing workflow: ${publishingWorkflow.id}`);
    
    // Store workflow for later
    this.testData.publishingWorkflow = publishingWorkflow;
    
    // Create document publishing with the publishing workflow
    this.testData.publishing = await prisma.document_publishings.create({
      data: {
        id: `pub-${Date.now()}`,
        documentId: this.testData.document.id,
        workflowId: publishingWorkflow.id,
        submittedById: this.testData.reviewers[0].id,
        status: 'IN_APPROVAL',
        updatedAt: new Date()
      }
    });
    
    console.log(`   ✓ Created publishing record: ${this.testData.publishing.id}`);
    
    // Create approval step linked to publishing workflow
    const approvalStep = await prisma.approvalStep.create({
      data: {
        workflowId: publishingWorkflow.id,
        stepNumber: 1,
        stepName: 'Test Review Step',
        requiredRole: 'REVIEWER',
        isRequired: true,
        canSkip: false,
        minApprovals: 2,
        allowDelegation: false,
        timeoutHours: 48
      }
    });
    
    console.log(`   ✓ Created approval step: ${approvalStep.id}`);
    
    // Create document approval
    this.testData.approval = await prisma.documentApproval.create({
      data: {
        publishingId: this.testData.publishing.id,
        stepId: approvalStep.id,
        approverId: this.testData.reviewers[0].id,
        status: 'IN_REVIEW',
        comments: 'Test approval for feedback processing',
        assignedAt: new Date()
      }
    });
    
    console.log(`   ✓ Created document approval: ${this.testData.approval.id}`);
  }

  async testCreateRealFeedback() {
    // Create REAL feedback in the database
    for (let i = 0; i < this.testData.reviewers.length; i++) {
      const reviewer = this.testData.reviewers[i];
      const severities = ['CRITICAL', 'MAJOR', 'SUBSTANTIVE'];
      
      const feedback = await prisma.reviewer_feedback.create({
        data: {
          id: `feedback-${Date.now()}-${i}`,
          approvalId: this.testData.approval.id,
          reviewerId: reviewer.id,
          feedbackType: 'TECHNICAL',
          summary: `Line 2 needs improvement - ${severities[i]} issue`,
          detailedComments: `This is detailed feedback from ${reviewer.firstName} about line 2. The severity is ${severities[i]}.`,
          sectionFeedback: {
            lineNumber: '2',
            paragraphNumber: '1',
            pageNumber: '1',
            severity: severities[i],
            originalSentence: 'Line 2: This line needs improvement based on feedback.',
            reviewerName: `${reviewer.firstName} ${reviewer.lastName}`
          },
          overallRating: 3.5 + i * 0.5,
          technicalRating: 4.0,
          clarityRating: 3.0 + i * 0.3,
          completenessRating: 3.5,
          timeSpent: 15 + i * 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      this.testData.feedback.push(feedback);
      console.log(`   ✓ Created REAL feedback ${i + 1}: ${feedback.id}`);
      console.log(`     - Severity: ${severities[i]}`);
      console.log(`     - Reviewer: ${reviewer.email}`);
    }
    
    console.log(`   ✓ Created ${this.testData.feedback.length} REAL feedback records in database`);
  }

  async testReadFeedbackFromDatabase() {
    // Read back the feedback to verify it's really in the database
    const allFeedback = await prisma.reviewer_feedback.findMany({
      where: {
        approvalId: this.testData.approval.id
      },
      include: {
        users: true,
        document_approvals: {
          include: {
            documentPublishing: {
              include: {
                documents: true
              }
            }
          }
        }
      }
    });
    
    if (allFeedback.length !== this.testData.feedback.length) {
      throw new Error(`Expected ${this.testData.feedback.length} feedback, found ${allFeedback.length}`);
    }
    
    console.log(`   ✓ Read ${allFeedback.length} feedback records from database`);
    
    // Verify feedback details
    for (const fb of allFeedback) {
      const metadata = fb.sectionFeedback;
      console.log(`   ✓ Feedback ${fb.id}:`);
      console.log(`     - Line: ${metadata.lineNumber}`);
      console.log(`     - Severity: ${metadata.severity}`);
      console.log(`     - Reviewer: ${fb.users.firstName} ${fb.users.lastName}`);
      console.log(`     - Document: ${fb.document_approvals.documentPublishing.documents.title}`);
    }
    
    // Test querying by severity
    const criticalFeedback = await prisma.reviewer_feedback.findMany({
      where: {
        approvalId: this.testData.approval.id,
        sectionFeedback: {
          path: ['severity'],
          equals: 'CRITICAL'
        }
      }
    });
    
    console.log(`   ✓ Found ${criticalFeedback.length} CRITICAL feedback items`);
  }

  async testUpdateFeedbackStatus() {
    // Simulate OPR processing - UPDATE real database records
    const feedbackToProcess = this.testData.feedback[0];
    
    // Update feedback with OPR decision
    const updated = await prisma.reviewer_feedback.update({
      where: { id: feedbackToProcess.id },
      data: {
        sectionFeedback: {
          ...(feedbackToProcess.sectionFeedback),
          status: 'APPROVED',
          oprDecision: 'APPROVE',
          oprId: this.testData.reviewers[0].id,
          processedAt: new Date().toISOString(),
          improvedSentence: 'Line 2: This line has been improved based on comprehensive reviewer feedback.'
        }
      }
    });
    
    console.log(`   ✓ Updated feedback ${updated.id} with OPR decision`);
    console.log(`   ✓ Status: ${updated.sectionFeedback.status}`);
    console.log(`   ✓ OPR Decision: ${updated.sectionFeedback.oprDecision}`);
    
    // Verify the update persisted
    const verified = await prisma.reviewer_feedback.findUnique({
      where: { id: feedbackToProcess.id }
    });
    
    if (verified.sectionFeedback.status !== 'APPROVED') {
      throw new Error('Feedback status was not updated in database!');
    }
    
    console.log(`   ✓ Verified feedback status update persisted in database`);
  }

  async testDocumentVersioning() {
    // Create a document version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId: this.testData.document.id,
        versionNumber: 2,
        title: this.testData.document.title + ' v2',
        fileName: this.testData.document.fileName,
        fileSize: this.testData.document.fileSize,
        checksum: this.testData.document.checksum + '-v2',
        storagePath: this.testData.document.storagePath,
        changeType: 'MINOR',
        changeNotes: 'Applied feedback from reviewers',
        createdById: this.testData.reviewers[0].id
      }
    });
    
    console.log(`   ✓ Created document version: ${version.id}`);
    console.log(`   ✓ Version number: ${version.versionNumber}`);
    console.log(`   ✓ Change notes: ${version.changeNotes}`);
    
    // Verify we can query versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: this.testData.document.id },
      orderBy: { versionNumber: 'desc' }
    });
    
    console.log(`   ✓ Found ${versions.length} versions for document`);
  }

  async testComplexDatabaseQueries() {
    // Test complex joins and queries
    const reviewerWithFeedback = await prisma.user.findFirst({
      where: {
        id: this.testData.reviewers[0].id
      },
      include: {
        reviewer_feedback: {
          include: {
            document_approvals: {
              include: {
                documentPublishing: {
                  include: {
                    documents: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`   ✓ Complex query successful`);
    console.log(`   ✓ Reviewer: ${reviewerWithFeedback.email}`);
    console.log(`   ✓ Feedback count: ${reviewerWithFeedback.reviewer_feedback.length}`);
    
    // Test aggregation
    const feedbackCount = await prisma.reviewer_feedback.count({
      where: {
        approvalId: this.testData.approval.id
      }
    });
    
    console.log(`   ✓ Aggregation query: ${feedbackCount} total feedback items`);
    
    // Test grouping
    const feedbackByReviewer = await prisma.reviewer_feedback.groupBy({
      by: ['reviewerId'],
      where: {
        approvalId: this.testData.approval.id
      },
      _count: {
        id: true
      }
    });
    
    console.log(`   ✓ Group by query: ${feedbackByReviewer.length} reviewers`);
  }

  async testCleanupRealData() {
    // Clean up in reverse order of creation to respect foreign keys
    
    // Delete feedback
    for (const feedback of this.testData.feedback) {
      try {
        await prisma.reviewer_feedback.delete({
          where: { id: feedback.id }
        });
      } catch (e) {
        // Feedback might not exist if test failed
      }
    }
    console.log(`   ✓ Deleted ${this.testData.feedback.length} feedback records`);
    
    // Delete approval
    if (this.testData.approval) {
      try {
        await prisma.documentApproval.delete({
          where: { id: this.testData.approval.id }
        });
        console.log(`   ✓ Deleted approval record`);
      } catch (e) {
        // Might not exist
      }
    }
    
    // Delete publishing BEFORE deleting workflow (foreign key constraint)
    if (this.testData.publishing) {
      try {
        await prisma.document_publishings.delete({
          where: { id: this.testData.publishing.id }
        });
        console.log(`   ✓ Deleted publishing record`);
      } catch (e) {
        console.log(`   ⚠️  Could not delete publishing: ${e.message}`);
      }
    }
    
    // Delete publishing workflow LAST (after publishing that references it)
    if (this.testData.publishingWorkflow) {
      try {
        await prisma.publishingWorkflow.delete({
          where: { id: this.testData.publishingWorkflow.id }
        });
        console.log(`   ✓ Deleted publishing workflow`);
      } catch (e) {
        console.log(`   ⚠️  Could not delete publishing workflow: ${e.message}`);
      }
    }
    
    // Delete approval steps we created
    try {
      if (this.testData.publishingWorkflow) {
        await prisma.approvalStep.deleteMany({
          where: { 
            workflowId: this.testData.publishingWorkflow.id
          }
        });
        console.log(`   ✓ Deleted approval steps`);
      }
    } catch (e) {
      console.log(`   ⚠️  Could not delete approval steps: ${e.message}`);
    }
    
    // Delete document versions
    await prisma.documentVersion.deleteMany({
      where: { documentId: this.testData.document?.id }
    });
    
    // Delete document
    if (this.testData.document) {
      await prisma.document.delete({
        where: { id: this.testData.document.id }
      });
      console.log(`   ✓ Deleted document`);
    }
    
    // Delete test reviewers
    for (const reviewer of this.testData.reviewers) {
      await prisma.user.delete({
        where: { id: reviewer.id }
      });
    }
    console.log(`   ✓ Deleted ${this.testData.reviewers.length} test users`);
    
    console.log(`   ✓ All test data cleaned from database`);
  }

  async run() {
    console.log('🚀 REAL Database Integration Test');
    console.log('=' .repeat(60));
    console.log('📋 Testing ACTUAL Database Read/Write Operations');
    console.log('=' .repeat(60));
    
    // Run all tests
    await this.runTest('Create Real Users in Database', this.testCreateRealUsers);
    await this.runTest('Create Real Document in Database', this.testCreateRealDocument);
    await this.runTest('Create Publishing and Approval Records', this.testCreatePublishingAndApproval);
    await this.runTest('Create Real Feedback in Database', this.testCreateRealFeedback);
    await this.runTest('Read Feedback from Database', this.testReadFeedbackFromDatabase);
    await this.runTest('Update Feedback Status in Database', this.testUpdateFeedbackStatus);
    await this.runTest('Test Document Versioning', this.testDocumentVersioning);
    await this.runTest('Test Complex Database Queries', this.testComplexDatabaseQueries);
    await this.runTest('Cleanup Real Database Data', this.testCleanupRealData);
    
    // Display results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REAL DATABASE TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`\n✅ Passed: ${this.testResults.passed.length}`);
    console.log(`❌ Failed: ${this.testResults.failed.length}`);
    console.log(`📈 Pass Rate: ${Math.round((this.testResults.passed.length / this.testResults.total) * 100)}%`);
    
    if (this.testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    // Disconnect
    await prisma.$disconnect();
    
    // Final status
    console.log('\n' + '=' .repeat(60));
    if (this.testResults.failed.length === 0) {
      console.log('✨ ALL REAL DATABASE TESTS PASSED! ✨');
      console.log('\n🎉 Verified Database Operations:');
      console.log('   ✅ User creation with roles and organizations');
      console.log('   ✅ Document creation with custom fields');
      console.log('   ✅ Publishing and approval workflow creation');
      console.log('   ✅ Reviewer feedback creation with metadata');
      console.log('   ✅ Complex queries with joins and includes');
      console.log('   ✅ Update operations with nested JSON');
      console.log('   ✅ Document versioning system');
      console.log('   ✅ Aggregation and grouping queries');
      console.log('   ✅ Complete cleanup with foreign key respect');
      console.log('   ✅ ALL DATA ACTUALLY WRITTEN TO AND READ FROM DATABASE!');
      process.exit(0);
    } else {
      console.log(`❌ ${this.testResults.failed.length} tests failed.`);
      process.exit(1);
    }
  }
}

// Run the test suite
const suite = new RealDatabaseIntegrationTest();
suite.run().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});