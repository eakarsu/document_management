const fetch = require('node-fetch');

async function testCoordinatorAPI() {
  try {
    // Login as coordinator1
    console.log('🔐 Logging in as coordinator1@airforce.mil...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coordinator1@airforce.mil',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const error = await loginResponse.text();
      console.error(error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Logged in successfully');
    console.log('  User:', loginData.user.email);
    console.log('  Role ID:', loginData.user.roleId);

    // Get workflow tasks
    console.log('\n📋 Fetching workflow tasks...');
    const tasksResponse = await fetch('http://localhost:4000/api/workflow/tasks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });

    if (!tasksResponse.ok) {
      console.error('❌ Failed to fetch tasks:', tasksResponse.status, tasksResponse.statusText);
      const error = await tasksResponse.text();
      console.error(error);
      return;
    }

    const tasksData = await tasksResponse.json();
    console.log('✅ Tasks fetched successfully');
    console.log('  Total tasks:', tasksData.totalTasks);

    if (tasksData.tasks && tasksData.tasks.length > 0) {
      console.log('\n📄 Tasks:');
      tasksData.tasks.forEach((task, index) => {
        console.log(`\n  Task ${index + 1}:`);
        console.log(`    Title: ${task.title}`);
        console.log(`    Description: ${task.description}`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Priority: ${task.priority || 'N/A'}`);
        console.log(`    Stage: ${task.stepNumber || 'N/A'}`);
        if (task.document) {
          console.log(`    Document: ${task.document.title}`);
        }
      });
    } else {
      console.log('\n⚠️  No tasks found for this coordinator');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCoordinatorAPI();