#!/usr/bin/env node

/**
 * Test reviewer tasks endpoint
 * This script tests if reviewers can see their tasks
 */

const fetch = require('node-fetch');

async function testReviewerTasks() {
  try {
    console.log('=== TESTING REVIEWER TASKS API ===\n');

    // Step 1: Login as reviewer
    console.log('1. Logging in as reviewer (ops.reviewer1@airforce.mil)...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ops.reviewer1@airforce.mil',
        password: 'testpass123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('Login failed:', loginResponse.status, error);

      // Try to create the reviewer if login fails
      console.log('\n2. Reviewer might not exist, checking database...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const reviewer = await prisma.user.findUnique({
        where: { email: 'ops.reviewer1@airforce.mil' },
        include: { role: true, organization: true }
      });

      if (!reviewer) {
        console.log('Reviewer does not exist! Creating...');

        // Get or create SUB_REVIEWER role
        let role = await prisma.role.findFirst({ where: { name: 'SUB_REVIEWER' } });
        if (!role) {
          const org = await prisma.organization.findFirst() ||
            await prisma.organization.create({
              data: { name: 'Operations', domain: 'ops.airforce.mil' }
            });

          role = await prisma.role.create({
            data: {
              name: 'SUB_REVIEWER',
              description: 'Sub-reviewer for distributed reviews',
              organizationId: org.id
            }
          });
        }

        // Create reviewer user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('testpass123', 10);

        const newReviewer = await prisma.user.create({
          data: {
            email: 'ops.reviewer1@airforce.mil',
            firstName: 'James',
            lastName: 'Wilson',
            passwordHash: hashedPassword,
            roleId: role.id,
            organizationId: role.organizationId
          }
        });

        console.log('Created reviewer:', newReviewer.email);

        // Try login again
        const retryLogin = await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'ops.reviewer1@airforce.mil',
            password: 'testpass123'
          })
        });

        if (!retryLogin.ok) {
          console.error('Login still failed after creating user:', await retryLogin.text());
          await prisma.$disconnect();
          return;
        }

        const retryData = await retryLogin.json();
        console.log('✅ Login successful after creating user');

        // Test tasks endpoint
        await testTasks(retryData.token, prisma);

        await prisma.$disconnect();
      } else {
        console.log('Reviewer exists:', {
          email: reviewer.email,
          role: reviewer.role?.name,
          org: reviewer.organization?.name,
          hasPassword: !!reviewer.passwordHash
        });

        await prisma.$disconnect();
        return;
      }
    } else {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('Token:', loginData.token?.substring(0, 20) + '...');

      // Test tasks endpoint
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await testTasks(loginData.token, prisma);
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testTasks(token, prisma) {
  console.log('\n3. Testing /api/tasks endpoint...');

  // Call the tasks endpoint
  const tasksResponse = await fetch('http://localhost:4000/api/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Tasks response status:', tasksResponse.status);

  if (!tasksResponse.ok) {
    const errorText = await tasksResponse.text();
    console.error('Tasks fetch failed:', errorText);

    // Check database directly
    console.log('\n4. Checking database directly for tasks...');

    const reviewer = await prisma.user.findUnique({
      where: { email: 'ops.reviewer1@airforce.mil' }
    });

    if (reviewer) {
      const tasks = await prisma.workflowTask.findMany({
        where: { assignedToId: reviewer.id },
        include: { workflow: true }
      });

      console.log(`Found ${tasks.length} tasks in database for reviewer`);
      tasks.forEach(task => {
        console.log(`- Task: ${task.title || task.id} (Status: ${task.status})`);
      });

      // Check if there are any tasks at all
      const allTasks = await prisma.workflowTask.findMany({
        include: { assignedTo: true }
      });
      console.log(`\nTotal tasks in system: ${allTasks.length}`);
      allTasks.forEach(task => {
        console.log(`- ${task.assignedTo?.email}: ${task.title || task.id}`);
      });
    }
  } else {
    const tasks = await tasksResponse.json();
    console.log('✅ Tasks fetched successfully');
    console.log(`Found ${tasks.length} tasks`);

    tasks.forEach(task => {
      console.log(`\nTask ID: ${task.id}`);
      console.log(`Title: ${task.title}`);
      console.log(`Status: ${task.status}`);
      console.log(`Document: ${task.document?.title || 'N/A'}`);
    });
  }
}

// Run the test
testReviewerTasks().catch(console.error);