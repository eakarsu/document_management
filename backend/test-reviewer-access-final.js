#!/usr/bin/env node

const fetch = require('node-fetch');

async function testReviewerAccess() {
  console.log('=== TESTING REVIEWER ACCESS ===\n');

  try {
    // Step 1: Login as reviewer
    console.log('1. Testing login for ops.reviewer1@airforce.mil...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ops.reviewer1@airforce.mil',
        password: 'testpass123'
      })
    });

    console.log('Login response status:', loginResponse.status);

    if (!loginResponse.ok) {
      console.log('Login failed. Response:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('Token received:', loginData.accessToken ? 'Yes' : loginData.token ? 'Yes (token field)' : 'No');

    // Step 2: Test tasks endpoint
    const token = loginData.accessToken || loginData.token;
    if (!token) {
      console.log('No token received from login');
      return;
    }

    console.log('\n2. Testing /api/tasks endpoint...');
    const tasksResponse = await fetch('http://localhost:4000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Tasks response status:', tasksResponse.status);

    if (!tasksResponse.ok) {
      console.log('Tasks fetch failed. Response:', await tasksResponse.text());
      return;
    }

    const tasks = await tasksResponse.json();
    console.log('✅ Tasks fetched successfully!');
    console.log(`Found ${tasks.length} tasks\n`);

    // Display task details
    tasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log(`  ID: ${task.id}`);
      console.log(`  Title: ${task.title || 'N/A'}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Document: ${task.document?.title || task.formData?.documentId || 'N/A'}\n`);
    });

    console.log('=== TEST COMPLETE ===');
    console.log('Reviewer can successfully:');
    console.log('✅ Login with credentials');
    console.log('✅ Receive authentication token');
    console.log(`✅ Access ${tasks.length} pending tasks`);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testReviewerAccess();