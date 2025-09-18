#!/usr/bin/env node

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeTest() {
  console.log('=== COMPREHENSIVE REVIEWER TEST ===\n');

  try {
    // 1. Check database directly first
    console.log('1. CHECKING DATABASE DIRECTLY:');
    console.log('-'.repeat(40));

    const reviewer = await prisma.user.findUnique({
      where: { email: 'ops.reviewer1@airforce.mil' },
      include: {
        role: true,
        organization: true
      }
    });

    if (!reviewer) {
      console.log('❌ Reviewer user does NOT exist in database');
      return;
    }

    console.log('✅ Reviewer exists in database:');
    console.log(`   Email: ${reviewer.email}`);
    console.log(`   Name: ${reviewer.firstName} ${reviewer.lastName}`);
    console.log(`   Role: ${reviewer.role?.name}`);
    console.log(`   Organization: ${reviewer.organization?.name}`);
    console.log(`   Has Password: ${!!reviewer.passwordHash}`);

    // Check tasks in database
    const tasks = await prisma.workflowTask.findMany({
      where: { assignedToId: reviewer.id },
      include: { workflow: true }
    });

    console.log(`\n   Database shows ${tasks.length} tasks assigned to reviewer`);

    // 2. Test API Login
    console.log('\n2. TESTING API LOGIN:');
    console.log('-'.repeat(40));

    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ops.reviewer1@airforce.mil',
        password: 'testpass123'
      })
    });

    console.log(`   Login Response Status: ${loginResponse.status}`);

    if (loginResponse.status !== 200) {
      console.log('❌ Login FAILED');
      const errorText = await loginResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken || loginData.token;

    console.log('✅ Login SUCCESSFUL');
    console.log(`   Token received: ${token ? 'YES' : 'NO'}`);
    console.log(`   Token length: ${token ? token.length : 0} characters`);

    // 3. Test Tasks API
    console.log('\n3. TESTING TASKS API:');
    console.log('-'.repeat(40));

    const tasksResponse = await fetch('http://localhost:4000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Tasks Response Status: ${tasksResponse.status}`);

    if (tasksResponse.status !== 200) {
      console.log('❌ Tasks API FAILED');
      const errorText = await tasksResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    const apiTasks = await tasksResponse.json();
    console.log('✅ Tasks API SUCCESSFUL');
    console.log(`   API returned ${apiTasks.length} tasks`);

    // 4. Compare database vs API
    console.log('\n4. VERIFICATION:');
    console.log('-'.repeat(40));

    if (tasks.length === apiTasks.length) {
      console.log('✅ Database and API task counts MATCH');
    } else {
      console.log(`⚠️  Database has ${tasks.length} tasks, API returns ${apiTasks.length}`);
    }

    // 5. Show task details
    console.log('\n5. TASK DETAILS FROM API:');
    console.log('-'.repeat(40));

    apiTasks.forEach((task, i) => {
      console.log(`\nTask ${i + 1}:`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Title: ${task.title || 'No title'}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.createdAt}`);

      if (task.formData?.documentId) {
        console.log(`   Document ID: ${task.formData.documentId}`);
      }
      if (task.document?.title) {
        console.log(`   Document Title: ${task.document.title}`);
      }
    });

    // 6. Check document permissions
    console.log('\n6. DOCUMENT PERMISSIONS:');
    console.log('-'.repeat(40));

    const targetDocId = 'cmfn33ifj000pfjsqyo04fb7p';
    const permission = await prisma.documentPermission.findFirst({
      where: {
        documentId: targetDocId,
        userId: reviewer.id
      }
    });

    if (permission) {
      console.log('✅ Reviewer has permission for target document');
      console.log(`   Permission type: ${permission.permission}`);
    } else {
      console.log('❌ No permission found for target document');
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('FINAL TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ User exists: YES`);
    console.log(`✅ Login works: ${loginResponse.status === 200 ? 'YES' : 'NO'}`);
    console.log(`✅ Tasks API works: ${tasksResponse.status === 200 ? 'YES' : 'NO'}`);
    console.log(`✅ Tasks returned: ${apiTasks.length}`);
    console.log(`✅ Has document permission: ${permission ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

completeTest();