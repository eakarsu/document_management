#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWorkflowDemoDocument() {
  console.log('📄 CREATING WORKFLOW DEMO DOCUMENT');
  console.log('===================================');

  try {
    // Get default organization
    const defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      throw new Error('No organization found. Please run setup first.');
    }

    // Get OPR user
    const oprUser = await prisma.user.findUnique({
      where: { email: 'opr@demo.mil' },
      include: { role: true }
    });

    if (!oprUser) {
      console.log('❌ OPR user not found. Please run setup-workflow-demo-accounts.js first');
      process.exit(1);
    }

    console.log(`📊 Using organization: ${defaultOrg.name}`);
    console.log(`👤 Creating document for: ${oprUser.firstName} ${oprUser.lastName} (${oprUser.role.name})`);

    // Create demo document with workflow content
    const demoContent = `# Bidirectional Workflow Test Document

**Publication Number:** BIDIR-WORKFLOW-DEMO-001
**OPR:** AF/TEST
**Date:** ${new Date().toLocaleDateString()}

## Document Purpose
This document is specifically created to demonstrate and test the bidirectional workflow system with role-based access control.

## Workflow Stages to Test
1. **OPR Creates** - Document creation and initial draft
2. **1st Coordination** - Internal coordination review (ICU)
3. **OPR Revisions** - OPR addresses feedback and makes revisions
4. **2nd Coordination** - External coordination (Technical Review)
5. **OPR Final** - Final OPR review and preparation
6. **Legal Review** - Legal and compliance review
7. **OPR Legal** - OPR addresses legal feedback
8. **AFDPO Publish** - Final publishing authority approval

## Test Scenarios
- ✅ Forward progression through all stages
- ✅ Backward movement with proper authorization
- ✅ Role-based access control validation
- ✅ Feedback and comment tracking
- ✅ Workflow history and audit trail

## Roles Involved
- **OPR (opr@demo.mil)** - Document owner, can revise and coordinate
- **AUTHOR (author@demo.mil)** - Can create and edit documents
- **TECHNICAL_REVIEWER (technical@demo.mil)** - Technical subject matter expert
- **LEGAL_REVIEWER (legal@demo.mil)** - Legal and policy compliance
- **PUBLISHER (publisher@demo.mil)** - Final publishing authority
- **ICU_REVIEWER (icu@demo.mil)** - Initial coordination unit
- **WORKFLOW_ADMIN (workflow.admin@demo.mil)** - Can manage workflow bidirectionally

## Expected Behavior
1. Each role should only be able to advance workflow in their authorized stage
2. WORKFLOW_ADMIN should be able to move workflow backward with reason
3. All transitions should be logged in workflow history
4. Feedback should be preserved across transitions
5. UI should display current stage and available actions based on user role

This document serves as a test case for validating the complete bidirectional workflow implementation.`;

    // Create the document
    const document = await prisma.document.create({
      data: {
        title: 'Bidirectional Workflow Test Document',
        description: 'Demo document for testing role-based bidirectional workflow system',
        fileName: 'bidirectional-workflow-demo.txt',
        originalName: 'bidirectional-workflow-demo.txt',
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(demoContent, 'utf8'),
        checksum: require('crypto').createHash('sha256').update(demoContent).digest('hex'),
        storagePath: `/demo/bidirectional-workflow-demo-${Date.now()}.txt`,
        storageProvider: 'minio',
        status: 'DRAFT',
        category: 'Manual',
        tags: ['workflow', 'demo', 'bidirectional', 'test'],
        customFields: {
          content: demoContent,
          workflow: {
            stage: 'DRAFT_CREATION',
            status: 'active',
            oprUserId: oprUser.id,
            createdAt: new Date().toISOString(),
            stageHistory: [
              {
                stage: 'DRAFT_CREATION',
                enteredAt: new Date().toISOString(),
                userId: oprUser.id,
                transitionType: 'INITIAL',
                transitionData: {
                  initialCreation: true,
                  demoDocument: true
                }
              }
            ],
            feedback: {}
          }
        },
        documentNumber: `BIDIR-DEMO-${Date.now()}`,
        qrCode: 'demo-qr-code',
        createdById: oprUser.id,
        organizationId: defaultOrg.id,
        currentVersion: 1
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Created demo document: ${document.title}`);
    console.log(`📄 Document ID: ${document.id}`);
    console.log(`🔢 Document Number: ${document.documentNumber}`);
    console.log(`👤 Created by: ${document.createdBy.firstName} ${document.createdBy.lastName}`);
    console.log(`🎭 Creator role: ${document.createdBy.role.name}`);
    console.log(`📋 Current workflow stage: ${document.customFields.workflow.stage}`);

    console.log('\\n🔗 Test URLs:');
    console.log(`Document Details: http://localhost:3000/documents/${document.id}`);
    console.log(`Backend API: http://localhost:4000/api/workflow/8-stage/document/${document.id}`);

    console.log('\\n🧪 Testing Instructions:');
    console.log('1. Login with different demo.mil accounts to test role-based access');
    console.log('2. Navigate to the document details page to see workflow status');
    console.log('3. Try advancing workflow with appropriate roles');
    console.log('4. Login as workflow.admin@demo.mil to test backward movements');
    console.log('5. Check workflow history to see all transitions');

    console.log('\\n📧 Demo Account Credentials:');
    console.log('OPR: opr@demo.mil / Demo123!');
    console.log('Author: author@demo.mil / Demo123!');
    console.log('Technical: technical@demo.mil / Demo123!');
    console.log('Legal: legal@demo.mil / Demo123!');
    console.log('Publisher: publisher@demo.mil / Demo123!');
    console.log('ICU: icu@demo.mil / Demo123!');
    console.log('Workflow Admin: workflow.admin@demo.mil / Demo123!');

    return {
      documentId: document.id,
      workflowId: `workflow_${document.id}`,
      documentNumber: document.documentNumber
    };

  } catch (error) {
    console.error('❌ Error creating demo document:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createWorkflowDemoDocument()
    .then((result) => {
      console.log('\\n✅ Demo document created successfully!');
      console.log('🚀 Ready for bidirectional workflow testing!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create demo document:', error);
      process.exit(1);
    });
}

module.exports = { createWorkflowDemoDocument };