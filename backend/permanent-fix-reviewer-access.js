#!/usr/bin/env node

/**
 * PERMANENT FIX FOR REVIEWER ACCESS
 * This script permanently fixes reviewer access to tasks and documents
 *
 * Run this script to ensure:
 * 1. Reviewers have proper SUB_REVIEWER role
 * 2. Reviewers have document permissions
 * 3. Reviewers have valid tasks
 * 4. Reviewers can login and see their tasks
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function permanentFixReviewerAccess() {
  console.log('=== PERMANENT REVIEWER ACCESS FIX ===\n');

  try {
    // Step 1: Ensure SUB_REVIEWER role exists with proper organization
    console.log('1. Ensuring SUB_REVIEWER role exists...');

    // Get or create Operations organization
    let opsOrg = await prisma.organization.findFirst({
      where: { name: 'Operations' }
    });

    if (!opsOrg) {
      opsOrg = await prisma.organization.create({
        data: {
          name: 'Operations',
          domain: 'ops.airforce.mil'
        }
      });
      console.log('✅ Created Operations organization');
    }

    // Get or create SUB_REVIEWER role
    let subReviewerRole = await prisma.role.findFirst({
      where: { name: 'SUB_REVIEWER' }
    });

    if (!subReviewerRole) {
      subReviewerRole = await prisma.role.create({
        data: {
          name: 'SUB_REVIEWER',
          description: 'Sub-reviewer for distributed document reviews',
          organizationId: opsOrg.id,
          permissions: ['READ', 'COMMENT', 'REVIEW']
        }
      });
      console.log('✅ Created SUB_REVIEWER role');
    } else {
      console.log('✅ SUB_REVIEWER role exists');
    }

    // Step 2: Fix ops.reviewer1@airforce.mil user
    console.log('\n2. Fixing ops.reviewer1@airforce.mil user...');

    let reviewer = await prisma.user.findUnique({
      where: { email: 'ops.reviewer1@airforce.mil' }
    });

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    if (!reviewer) {
      reviewer = await prisma.user.create({
        data: {
          email: 'ops.reviewer1@airforce.mil',
          firstName: 'James',
          lastName: 'Wilson',
          passwordHash: hashedPassword,
          roleId: subReviewerRole.id,
          organizationId: opsOrg.id,
          isActive: true
        }
      });
      console.log('✅ Created reviewer user');
    } else {
      // Update existing reviewer
      reviewer = await prisma.user.update({
        where: { id: reviewer.id },
        data: {
          passwordHash: hashedPassword,
          roleId: subReviewerRole.id,
          organizationId: opsOrg.id,
          isActive: true
        }
      });
      console.log('✅ Updated reviewer user');
    }

    // Step 3: Grant document permissions for all documents with tasks
    console.log('\n3. Granting document permissions...');

    const tasks = await prisma.workflowTask.findMany({
      where: { assignedToId: reviewer.id }
    });

    console.log(`Found ${tasks.length} tasks for reviewer`);

    for (const task of tasks) {
      const formData = task.formData;
      if (formData?.documentId) {
        // Check if permission exists
        const existingPerm = await prisma.documentPermission.findFirst({
          where: {
            documentId: formData.documentId,
            userId: reviewer.id
          }
        });

        if (!existingPerm) {
          await prisma.documentPermission.create({
            data: {
              documentId: formData.documentId,
              userId: reviewer.id,
              permission: 'READ'
            }
          });
          console.log(`✅ Granted READ permission for document ${formData.documentId}`);
        }
      }
    }

    // Step 4: Verify the document exists
    console.log('\n4. Verifying documents...');
    const targetDocId = 'cmfn33ifj000pfjsqyo04fb7p';

    const document = await prisma.document.findUnique({
      where: { id: targetDocId }
    });

    if (document) {
      console.log(`✅ Document found: ${document.title}`);

      // Ensure reviewer has permission
      const perm = await prisma.documentPermission.findFirst({
        where: {
          documentId: targetDocId,
          userId: reviewer.id
        }
      });

      if (!perm) {
        await prisma.documentPermission.create({
          data: {
            documentId: targetDocId,
            userId: reviewer.id,
            permission: 'READ'
          }
        });
        console.log('✅ Granted permission to target document');
      } else {
        console.log('✅ Permission already exists for target document');
      }
    } else {
      console.log('⚠️ Target document not found');
    }

    // Step 5: Display access credentials
    console.log('\n=== REVIEWER ACCESS CREDENTIALS ===');
    console.log('Email: ops.reviewer1@airforce.mil');
    console.log('Password: testpass123');
    console.log('Role: SUB_REVIEWER');
    console.log(`Tasks: ${tasks.length}`);

    // Step 6: Test login
    console.log('\n5. Testing login...');
    const fetch = require('node-fetch');

    try {
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ops.reviewer1@airforce.mil',
          password: 'testpass123'
        })
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('Token received:', data.accessToken ? 'Yes' : 'No');

        // Test tasks endpoint
        if (data.accessToken) {
          const tasksResponse = await fetch('http://localhost:4000/api/tasks', {
            headers: {
              'Authorization': `Bearer ${data.accessToken}`
            }
          });

          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            console.log(`✅ Tasks API working! Found ${tasksData.length} tasks`);
          } else {
            console.log('⚠️ Tasks API failed:', tasksResponse.status);
          }
        }
      } else {
        console.log('⚠️ Login failed:', loginResponse.status);
        console.log('Make sure backend is running on port 4000');
      }
    } catch (error) {
      console.log('⚠️ Could not test login (backend may not be running)');
    }

    console.log('\n=== FIX COMPLETED ===');
    console.log('Reviewer should now be able to:');
    console.log('1. Login with ops.reviewer1@airforce.mil / testpass123');
    console.log('2. See their tasks on the dashboard');
    console.log('3. Access documents they need to review');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the permanent fix
permanentFixReviewerAccess().catch(console.error);