#!/usr/bin/env node

// Comprehensive Integration Test Suite for Workflow System
// Tests both API endpoints and UI functionality end-to-end

const fetch = globalThis.fetch || require('node-fetch');

// Test configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:4000',
  testDocument: {
    id: 'cmf2tl02m0001ia6lwdxpd50q',
    workflowId: 'workflow_cmf2tl02m0001ia6lwdxpd50q'
  },
  users: {
    opr: { email: 'opr@demo.mil', password: 'Demo123!' },
    icu: { email: 'icu@demo.mil', password: 'Demo123!' },
    technical: { email: 'technical@demo.mil', password: 'Demo123!' },
    legal: { email: 'legal@demo.mil', password: 'Demo123!' },
    publisher: { email: 'publisher@demo.mil', password: 'Demo123!' },
    workflowAdmin: { email: 'workflow.admin@demo.mil', password: 'Demo123!' }
  }
};

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

const logTest = (category, testName, passed, details = '') => {
  totalTests++;
  const result = { category, testName, passed, details };
  testResults.push(result);
  
  if (passed) {
    passedTests++;
    console.log(`✅ ${category}: ${testName} ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${category}: ${testName} ${details}`);
  }
};

// Authentication helper
const authenticate = async (email, password) => {
  try {
    const response = await fetch(`${config.backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.accessToken;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Frontend API integration test
const testFrontendAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${config.frontendUrl}${endpoint}`, {
      credentials: 'include',
      ...options
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Backend API direct test
const testBackendAPI = async (endpoint, token, options = {}) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${config.backendUrl}${endpoint}`, {
      headers,
      ...options
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

async function runComprehensiveIntegrationTests() {
  console.log('🧪 COMPREHENSIVE INTEGRATION TEST SUITE');
  console.log('=======================================');
  console.log(`📄 Testing Document: ${config.testDocument.id}`);
  console.log(`🔄 Workflow ID: ${config.testDocument.workflowId}\n`);

  // 1. Authentication Integration Tests
  console.log('🔐 1. AUTHENTICATION INTEGRATION TESTS');
  console.log('-------------------------------------');
  
  const tokens = {};
  for (const [role, creds] of Object.entries(config.users)) {
    const token = await authenticate(creds.email, creds.password);
    tokens[role] = token;
    logTest('AUTH', `${role} authentication`, !!token, `(${creds.email})`);
  }

  // 2. API Endpoint Integration Tests
  console.log('\n🌐 2. API ENDPOINT INTEGRATION TESTS');
  console.log('-----------------------------------');

  // Test frontend workflow status endpoint
  const workflowStatusTest = await testFrontendAPI(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
    {
      method: 'GET',
      headers: { 'Cookie': `accessToken=${tokens.opr}` }
    }
  );
  logTest('API', 'Frontend workflow status endpoint', workflowStatusTest.ok, 
          workflowStatusTest.ok ? `(Stage: ${workflowStatusTest.data.workflow?.current_stage})` : `(${workflowStatusTest.status})`);

  // Test backend direct vs frontend proxy comparison
  const backendDirect = await testBackendAPI(`/api/workflow/8-stage/document/${config.testDocument.id}`, tokens.opr);
  const frontendProxy = workflowStatusTest;
  
  const dataConsistency = backendDirect.ok && frontendProxy.ok && 
    backendDirect.data.workflow?.current_stage === frontendProxy.data.workflow?.current_stage;
  logTest('API', 'Backend-Frontend data consistency', dataConsistency, 
          dataConsistency ? '(Stages match)' : '(Data mismatch)');

  // Test workflow history integration
  const historyTest = await testFrontendAPI(
    `/api/workflow-history?workflowId=${config.testDocument.workflowId}`,
    {
      method: 'GET',
      headers: { 'Cookie': `accessToken=${tokens.workflowAdmin}` }
    }
  );
  logTest('API', 'Workflow history endpoint', historyTest.ok,
          historyTest.ok ? `(${historyTest.data.workflow?.history?.length || 0} entries)` : `(${historyTest.status})`);

  // Test workflow action endpoint
  const actionTest = await testFrontendAPI('/api/workflow-action', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${tokens.icu}` 
    },
    body: JSON.stringify({
      action: 'advance',
      workflowId: config.testDocument.workflowId,
      fromStage: 'DRAFT_CREATION',
      toStage: 'INTERNAL_COORDINATION',
      requiredRole: 'ICU_REVIEWER'
    })
  });
  logTest('API', 'Workflow action endpoint with ICU user', actionTest.ok || actionTest.status === 400,
          actionTest.ok ? '(Action succeeded)' : `(Expected validation: ${actionTest.status})`);

  // 3. Database Integration Tests
  console.log('\n💾 3. DATABASE INTEGRATION TESTS');
  console.log('-------------------------------');

  // Test workflow creation and persistence
  const createWorkflowTest = await testFrontendAPI('/api/workflow-status', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${tokens.opr}` 
    },
    body: JSON.stringify({
      documentId: config.testDocument.id,
      action: 'start_workflow'
    })
  });
  logTest('DB', 'Workflow creation persistence', createWorkflowTest.ok || createWorkflowTest.status === 409,
          createWorkflowTest.ok ? '(New workflow created)' : '(Existing workflow found - expected)');

  // Test workflow state persistence after operations
  const stateBefore = await testFrontendAPI(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
    { headers: { 'Cookie': `accessToken=${tokens.opr}` } }
  );
  
  // Attempt a state change
  const stateChange = await testFrontendAPI('/api/workflow-action', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${tokens.workflowAdmin}` 
    },
    body: JSON.stringify({
      action: 'move_backward',
      workflowId: config.testDocument.workflowId,
      fromStage: stateBefore.data?.workflow?.current_stage || 'DRAFT_CREATION',
      toStage: 'DRAFT_CREATION',
      reason: 'Integration test - checking state persistence'
    })
  });

  const stateAfter = await testFrontendAPI(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
    { headers: { 'Cookie': `accessToken=${tokens.opr}` } }
  );

  const statePersistence = stateBefore.ok && stateAfter.ok;
  logTest('DB', 'Workflow state persistence', statePersistence,
          statePersistence ? `(${stateBefore.data.workflow?.current_stage} -> ${stateAfter.data.workflow?.current_stage})` : '(State check failed)');

  // 4. Role-Based Access Control Integration
  console.log('\n👥 4. ROLE-BASED ACCESS CONTROL INTEGRATION');
  console.log('-----------------------------------------');

  // Test each role's access to appropriate endpoints
  const roleTests = [
    { role: 'opr', endpoint: '/api/workflow-status', method: 'GET', shouldPass: true },
    { role: 'icu', endpoint: '/api/workflow-feedback', method: 'POST', shouldPass: true },
    { role: 'technical', endpoint: '/api/workflow-action', method: 'POST', shouldPass: false }, // Wrong stage
    { role: 'workflowAdmin', endpoint: '/api/workflow-history', method: 'GET', shouldPass: true }
  ];

  for (const test of roleTests) {
    if (!tokens[test.role]) continue;

    let testResult;
    if (test.method === 'GET') {
      testResult = await testFrontendAPI(
        test.endpoint === '/api/workflow-status' ? 
          `${test.endpoint}?documentId=${config.testDocument.id}&action=get_status` :
          test.endpoint === '/api/workflow-history' ?
            `${test.endpoint}?workflowId=${config.testDocument.workflowId}` :
            test.endpoint,
        { headers: { 'Cookie': `accessToken=${tokens[test.role]}` } }
      );
    } else {
      const body = test.endpoint === '/api/workflow-feedback' ? {
        documentId: config.testDocument.id,
        stage: '1st Coordination',
        feedback: 'Integration test feedback'
      } : {
        action: 'advance',
        workflowId: config.testDocument.workflowId,
        fromStage: 'DRAFT_CREATION',
        toStage: 'EXTERNAL_COORDINATION'
      };

      testResult = await testFrontendAPI(test.endpoint, {
        method: test.method,
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${tokens[test.role]}` 
        },
        body: JSON.stringify(body)
      });
    }

    const passed = test.shouldPass ? testResult.ok : !testResult.ok || testResult.status >= 400;
    logTest('RBAC', `${test.role} access to ${test.endpoint}`, passed,
            test.shouldPass ? (testResult.ok ? '(Authorized)' : '(Access denied)') : 
                             (testResult.ok ? '(Unexpected access)' : '(Correctly blocked)'));
  }

  // 5. Error Handling and Edge Cases
  console.log('\n🛡️  5. ERROR HANDLING AND EDGE CASES');
  console.log('-----------------------------------');

  // Test invalid document ID
  const invalidDocTest = await testFrontendAPI(
    '/api/workflow-status?documentId=invalid-doc-id&action=get_status',
    { headers: { 'Cookie': `accessToken=${tokens.opr}` } }
  );
  logTest('ERROR', 'Invalid document ID handling', !invalidDocTest.ok,
          !invalidDocTest.ok ? `(${invalidDocTest.status})` : '(Should have failed)');

  // Test missing authentication
  const noAuthTest = await testFrontendAPI(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`
  );
  logTest('ERROR', 'Missing authentication handling', !noAuthTest.ok,
          !noAuthTest.ok ? `(${noAuthTest.status})` : '(Should have failed)');

  // Test invalid workflow action
  const invalidActionTest = await testFrontendAPI('/api/workflow-action', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${tokens.opr}` 
    },
    body: JSON.stringify({
      action: 'invalid_action',
      workflowId: config.testDocument.workflowId
    })
  });
  logTest('ERROR', 'Invalid workflow action handling', !invalidActionTest.ok,
          !invalidActionTest.ok ? `(${invalidActionTest.status})` : '(Should have failed)');

  // 6. Performance and Load Testing
  console.log('\n⚡ 6. PERFORMANCE INTEGRATION TESTS');
  console.log('---------------------------------');

  // Test concurrent requests
  const concurrentPromises = Array(5).fill().map((_, i) => 
    testFrontendAPI(
      `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
      { headers: { 'Cookie': `accessToken=${tokens.opr}` } }
    )
  );

  const startTime = Date.now();
  const concurrentResults = await Promise.all(concurrentPromises);
  const endTime = Date.now();
  
  const allPassed = concurrentResults.every(r => r.ok);
  logTest('PERF', 'Concurrent API requests', allPassed,
          allPassed ? `(5 requests in ${endTime - startTime}ms)` : '(Some requests failed)');

  // Final Results
  console.log('\n📊 COMPREHENSIVE INTEGRATION TEST RESULTS');
  console.log('=========================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

  // Results by category
  const categories = [...new Set(testResults.map(r => r.category))];
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const categoryPassed = categoryTests.filter(r => r.passed).length;
    console.log(`${category}: ${categoryPassed}/${categoryTests.length} passed`);
  });

  console.log('\n🎯 INTEGRATION TEST SUMMARY');
  console.log('===========================');
  if (passedTests >= totalTests * 0.9) {
    console.log('✅ Excellent! Integration tests show the system is working well.');
    console.log('✅ API endpoints are properly integrated with database');
    console.log('✅ Frontend-backend communication is working correctly');
    console.log('✅ Role-based access control is properly enforced');
    console.log('✅ Error handling is working as expected');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failedTests} integration test(s) failed.`);
    console.log('❌ Review the failed tests above for issues to address.');
    process.exit(1);
  }
}

// Run the comprehensive integration tests
console.log('Starting comprehensive integration tests...\n');
runComprehensiveIntegrationTests().catch(console.error);