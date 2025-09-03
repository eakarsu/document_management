#!/usr/bin/env node

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWorkflowDemoAccounts() {
  console.log('🚀 Creating Workflow Demo Accounts');
  console.log('==================================');

  try {
    // Get the default organization
    const defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      throw new Error('No organization found. Please run setup first.');
    }

    console.log(`📊 Using organization: ${defaultOrg.name}`);

    // Create or find roles for workflow steps
    const workflowRoles = [
      {
        name: 'OPR',
        description: 'Office of Primary Responsibility - Document owner and initiator',
        permissions: ['CREATE_DOCUMENT', 'EDIT_DOCUMENT', 'SUBMIT_FOR_REVIEW']
      },
      {
        name: 'AUTHOR',
        description: 'Document Author - Can create and edit documents',
        permissions: ['CREATE_DOCUMENT', 'EDIT_DOCUMENT']
      },
      {
        name: 'TECHNICAL_REVIEWER',
        description: 'Technical Subject Matter Expert - Reviews technical content',
        permissions: ['REVIEW_DOCUMENT', 'APPROVE_TECHNICAL', 'ADD_COMMENTS']
      },
      {
        name: 'LEGAL_REVIEWER',
        description: 'Legal Review - Reviews legal and policy compliance',
        permissions: ['REVIEW_DOCUMENT', 'APPROVE_LEGAL', 'ADD_COMMENTS', 'REJECT_DOCUMENT']
      },
      {
        name: 'PUBLISHER',
        description: 'Publishing Authority - Final approval and publication',
        permissions: ['REVIEW_DOCUMENT', 'PUBLISH_DOCUMENT', 'FINAL_APPROVAL', 'SCHEDULE_PUBLICATION']
      },
      {
        name: 'ICU_REVIEWER',
        description: 'Initial Coordination Unit - First level review',
        permissions: ['REVIEW_DOCUMENT', 'INITIAL_APPROVAL', 'ADD_COMMENTS']
      },
      {
        name: 'WORKFLOW_ADMIN',
        description: 'Workflow Administrator - Can move documents backward/forward',
        permissions: ['MANAGE_WORKFLOW', 'MOVE_BACKWARD', 'REASSIGN_TASKS', 'VIEW_ALL_DOCUMENTS']
      }
    ];

    // Create roles
    console.log('📋 Creating workflow roles...');
    for (const roleData of workflowRoles) {
      const existingRole = await prisma.role.findFirst({
        where: { name: roleData.name, organizationId: defaultOrg.id }
      });

      if (!existingRole) {
        await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions: roleData.permissions,
            organizationId: defaultOrg.id,
            isSystem: false
          }
        });
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleData.name}`);
      }
    }

    // Create demo accounts for each workflow step
    const demoAccounts = [
      {
        firstName: 'Office',
        lastName: 'Primary Responsibility',
        email: 'opr@demo.mil',
        password: 'Demo123!',
        roleName: 'OPR',
        title: 'Office of Primary Responsibility',
        department: 'AF/A1'
      },
      {
        firstName: 'Document',
        lastName: 'Author',
        email: 'author@demo.mil',
        password: 'Demo123!',
        roleName: 'AUTHOR',
        title: 'Technical Writer',
        department: 'AF/A1'
      },
      {
        firstName: 'Technical',
        lastName: 'Reviewer',
        email: 'technical@demo.mil',
        password: 'Demo123!',
        roleName: 'TECHNICAL_REVIEWER',
        title: 'Subject Matter Expert',
        department: 'AF/A2'
      },
      {
        firstName: 'Legal',
        lastName: 'Reviewer',
        email: 'legal@demo.mil',
        password: 'Demo123!',
        roleName: 'LEGAL_REVIEWER',
        title: 'Legal Counsel',
        department: 'AF/JA'
      },
      {
        firstName: 'Publishing',
        lastName: 'Authority',
        email: 'publisher@demo.mil',
        password: 'Demo123!',
        roleName: 'PUBLISHER',
        title: 'Publishing Manager',
        department: 'AF/A3'
      },
      {
        firstName: 'ICU',
        lastName: 'Reviewer',
        email: 'icu@demo.mil',
        password: 'Demo123!',
        roleName: 'ICU_REVIEWER',
        title: 'Initial Coordination Unit',
        department: 'AF/A4'
      },
      {
        firstName: 'Workflow',
        lastName: 'Administrator',
        email: 'workflow.admin@demo.mil',
        password: 'Demo123!',
        roleName: 'WORKFLOW_ADMIN',
        title: 'Workflow Manager',
        department: 'AF/A6'
      }
    ];

    console.log('\n👥 Creating demo user accounts...');
    const hashedPassword = await bcrypt.hash('Demo123!', 10);

    for (const accountData of demoAccounts) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: accountData.email }
      });

      if (!existingUser) {
        // Find the role
        const role = await prisma.role.findFirst({
          where: { name: accountData.roleName, organizationId: defaultOrg.id }
        });

        if (!role) {
          console.log(`❌ Role not found: ${accountData.roleName}`);
          continue;
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            firstName: accountData.firstName,
            lastName: accountData.lastName,
            email: accountData.email,
            passwordHash: hashedPassword,
            emailVerified: true,
            isActive: true,
            organizationId: defaultOrg.id,
            roleId: role.id,
            department: accountData.department
          },
          include: {
            role: true
          }
        });

        console.log(`✅ Created user: ${user.email} (${user.role.name})`);
      } else {
        console.log(`ℹ️  User already exists: ${accountData.email}`);
      }
    }

    // Create a sample publishing workflow
    console.log('\n🔄 Creating sample bidirectional workflow...');
    
    const existingWorkflow = await prisma.publishingWorkflow.findFirst({
      where: { name: 'Air Force Publication Review' }
    });

    if (!existingWorkflow) {
      const workflow = await prisma.publishingWorkflow.create({
        data: {
          name: 'Air Force Publication Review',
          description: 'Standard Air Force publication review and approval process with bidirectional transitions',
          workflowType: 'DOCUMENT_APPROVAL',
          isActive: true,
          autoApprove: false,
          requiredApprovers: 3,
          allowParallel: false,
          timeoutHours: 168, // 1 week
          organizationId: defaultOrg.id,
          steps: {
            create: [
              {
                stepNumber: 1,
                stepName: 'Initial Draft',
                description: 'Document creation and initial draft',
                isRequired: true,
                timeoutHours: 48,
                requiredRole: 'AUTHOR',
                minApprovals: 1,
                allowDelegation: true
              },
              {
                stepNumber: 2,
                stepName: 'OPR Review',
                description: 'Office of Primary Responsibility review',
                isRequired: true,
                timeoutHours: 72,
                requiredRole: 'OPR',
                minApprovals: 1,
                allowDelegation: true
              },
              {
                stepNumber: 3,
                stepName: 'Technical Review',
                description: 'Subject matter expert technical review',
                isRequired: true,
                timeoutHours: 120,
                requiredRole: 'TECHNICAL_REVIEWER',
                minApprovals: 1,
                allowDelegation: false
              },
              {
                stepNumber: 4,
                stepName: 'Legal Review',
                description: 'Legal and policy compliance review',
                isRequired: true,
                timeoutHours: 96,
                requiredRole: 'LEGAL_REVIEWER',
                minApprovals: 1,
                allowDelegation: false
              },
              {
                stepNumber: 5,
                stepName: 'ICU Review',
                description: 'Initial Coordination Unit review',
                isRequired: false,
                timeoutHours: 48,
                requiredRole: 'ICU_REVIEWER',
                minApprovals: 1,
                allowDelegation: true
              },
              {
                stepNumber: 6,
                stepName: 'Final Approval',
                description: 'Publishing authority final approval',
                isRequired: true,
                timeoutHours: 72,
                requiredRole: 'PUBLISHER',
                minApprovals: 1,
                allowDelegation: false
              }
            ]
          }
        },
        include: {
          steps: true
        }
      });

      console.log(`✅ Created workflow: ${workflow.name} with ${workflow.steps.length} steps`);
    } else {
      console.log('ℹ️  Workflow already exists: Air Force Publication Review');
    }

    console.log('\n📊 Demo Account Summary');
    console.log('======================');
    console.log('Login credentials for testing:');
    
    for (const account of demoAccounts) {
      console.log(`${account.roleName.padEnd(20)} | ${account.email.padEnd(25)} | Demo123!`);
    }

    console.log('\n🔐 Workflow Permissions:');
    console.log('OPR: Can initiate documents, submit for review');
    console.log('AUTHOR: Can create and edit documents');
    console.log('TECHNICAL_REVIEWER: Can review technical content');
    console.log('LEGAL_REVIEWER: Can review legal compliance');
    console.log('PUBLISHER: Can publish and final approve');
    console.log('ICU_REVIEWER: Can do initial coordination review');
    console.log('WORKFLOW_ADMIN: Can move workflows backward/forward');

  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createWorkflowDemoAccounts()
    .then(() => {
      console.log('\n✅ Demo accounts created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create demo accounts:', error);
      process.exit(1);
    });
}

module.exports = { createWorkflowDemoAccounts };