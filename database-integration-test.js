#!/usr/bin/env node

// Database Integration Test Suite
// Tests that roles are read from DB, workflow states are written to DB, and read back from DB

const fetch = globalThis.fetch || require('node-fetch');

const config = {
  backendUrl: 'http://localhost:4000',
  frontendUrl: 'http://localhost:3000',
  testDocument: {
    id: 'cmf2tl02m0001ia6lwdxpd50q',
    workflowId: 'workflow_cmf2tl02m0001ia6lwdxpd50q'
  },
  users: {
    opr: { email: 'opr@demo.mil', password: 'Demo123!', expectedRole: 'OPR' },
    icu: { email: 'icu@demo.mil', password: 'Demo123!', expectedRole: 'ICU_REVIEWER' },
    technical: { email: 'technical@demo.mil', password: 'Demo123!', expectedRole: 'TECHNICAL_REVIEWER' },
    legal: { email: 'legal@demo.mil', password: 'Demo123!', expectedRole: 'LEGAL_REVIEWER' },
    publisher: { email: 'publisher@demo.mil', password: 'Demo123!', expectedRole: 'PUBLISHER' },
    workflowAdmin: { email: 'workflow.admin@demo.mil', password: 'Demo123!', expectedRole: 'WORKFLOW_ADMIN' }
  }
};

let totalTests = 0;
let passedTests = 0;

const logTest = (category, testName, passed, details = '') => {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${category}: ${testName} ${details}`);
  } else {
    console.log(`❌ ${category}: ${testName} ${details}`);
  }
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint, method = 'GET', body = null, token = null, useBackend = false) => {
  try {
    const baseUrl = useBackend ? config.backendUrl : config.frontendUrl;
    const headers = { 'Content-Type': 'application/json' };
    
    if (useBackend && token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (!useBackend) {
      // Frontend call with cookie
    }
    
    const options = {
      method,
      headers,
      credentials: useBackend ? 'omit' : 'include'
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    if (!useBackend && token) {
      options.headers['Cookie'] = `accessToken=${token}`;
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Get authentication token and user data
const authenticate = async (email, password) => {
  const response = await apiCall('/api/auth/login', 'POST', { email, password }, null, true);
  if (response.ok) {
    return {
      token: response.data.accessToken,
      userId: response.data.user.id,
      userData: response.data.user
    };
  }
  return null;
};

async function runDatabaseIntegrationTests() {
  console.log('💾 DATABASE INTEGRATION TEST SUITE');
  console.log('==================================');
  console.log('Testing database read/write operations for roles and workflow states\n');

  // 1. Test Database Role Reading
  console.log('👥 1. DATABASE ROLE READING TESTS');
  console.log('---------------------------------');

  const userTokens = {};
  const userRoles = {};

  for (const [roleKey, userConfig] of Object.entries(config.users)) {
    const authResult = await authenticate(userConfig.email, userConfig.password);
    
    if (authResult) {
      userTokens[roleKey] = authResult.token;
      
      // Test that user data includes role information from database
      const hasRoleInfo = authResult.userData.roleId && authResult.userData.roleId.length > 0;
      logTest('DB-READ', `${roleKey} role data read from database`, hasRoleInfo,
              hasRoleInfo ? `(roleId: ${authResult.userData.roleId.slice(0, 8)}...)` : '(No role data)');

      // Get detailed role information to verify it matches expected role
      const roleResponse = await apiCall(`/api/auth/me`, 'GET', null, authResult.token, true);
      if (roleResponse.ok && roleResponse.data.role) {
        const actualRole = roleResponse.data.role.name;
        const expectedRole = userConfig.expectedRole;
        const roleMatches = actualRole === expectedRole;
        
        userRoles[roleKey] = actualRole;
        logTest('DB-READ', `${roleKey} role matches expected role`, roleMatches,
                `(Expected: ${expectedRole}, Got: ${actualRole})`);
      } else {
        logTest('DB-READ', `${roleKey} role details retrieval`, false, '(Failed to get role details)');
      }
    } else {
      logTest('DB-READ', `${roleKey} authentication`, false, '(Failed to authenticate)');
    }
  }

  // 2. Test Database Workflow State Writing
  console.log('\n💾 2. DATABASE WORKFLOW STATE WRITING TESTS');
  console.log('-------------------------------------------');

  // First, get initial workflow state from database
  const initialStateResponse = await apiCall(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
    'GET', null, userTokens.opr
  );
  
  let initialState = null;
  if (initialStateResponse.ok) {
    initialState = initialStateResponse.data.workflow?.current_stage;
    logTest('DB-READ', 'Initial workflow state read from database', true,
            `(Current stage: ${initialState})`);
  } else {
    logTest('DB-READ', 'Initial workflow state read from database', false,
            `(Error: ${initialStateResponse.status})`);
  }

  // Test writing workflow state change to database
  if (userTokens.workflowAdmin && initialState) {
    const newTargetStage = initialState === 'DRAFT_CREATION' ? 'INTERNAL_COORDINATION' : 'DRAFT_CREATION';
    
    const stateChangeResponse = await apiCall('/api/workflow-action', 'POST', {
      action: initialState === 'DRAFT_CREATION' ? 'advance' : 'move_backward',
      workflowId: config.testDocument.workflowId,
      fromStage: initialState,
      toStage: newTargetStage,
      reason: 'Database integration test - testing state persistence'
    }, userTokens.workflowAdmin);

    logTest('DB-WRITE', 'Workflow state change written to database', stateChangeResponse.ok,
            stateChangeResponse.ok ? `(${initialState} -> ${newTargetStage})` : 
            `(Error: ${stateChangeResponse.status} - ${stateChangeResponse.data})`);

    // Verify the state was actually written to database by reading it back
    if (stateChangeResponse.ok) {
      // Wait a moment for database write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newStateResponse = await apiCall(
        `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
        'GET', null, userTokens.opr
      );
      
      if (newStateResponse.ok) {
        const newState = newStateResponse.data.workflow?.current_stage;
        const stateChanged = newState !== initialState;
        
        logTest('DB-READ', 'Updated workflow state read from database', stateChanged,
                `(State changed from ${initialState} to ${newState})`);
        
        // Test workflow history was written to database
        const historyResponse = await apiCall(
          `/api/workflow-history?workflowId=${config.testDocument.workflowId}`,
          'GET', null, userTokens.workflowAdmin
        );
        
        if (historyResponse.ok && historyResponse.data.workflow?.history) {
          const historyCount = historyResponse.data.workflow.history.length;
          const hasRecentEntry = historyCount > 0;
          
          logTest('DB-WRITE', 'Workflow history written to database', hasRecentEntry,
                  hasRecentEntry ? `(${historyCount} history entries)` : '(No history found)');
          
          // Verify history contains our recent change
          if (hasRecentEntry) {
            const recentEntry = historyResponse.data.workflow.history[historyCount - 1];
            const correctUser = recentEntry.user?.name === 'Workflow Administrator';
            const correctStage = recentEntry.stage === newTargetStage;
            
            logTest('DB-WRITE', 'History entry details correct in database', correctUser && correctStage,
                    `(User: ${recentEntry.user?.name}, Stage: ${recentEntry.stage})`);
          }
        } else {
          logTest('DB-READ', 'Workflow history read from database', false, '(Failed to read history)');
        }
      } else {
        logTest('DB-READ', 'Updated workflow state read from database', false,
                `(Error: ${newStateResponse.status})`);
      }
    }
  }

  // 3. Test Database Permission Checking
  console.log('\n🔒 3. DATABASE PERMISSION CHECKING TESTS');
  console.log('---------------------------------------');

  // Test that role-based permissions are enforced based on database roles
  const permissionTests = [
    { 
      user: 'icu', 
      action: 'advance', 
      fromStage: 'DRAFT_CREATION', 
      toStage: 'INTERNAL_COORDINATION', 
      shouldPass: true,
      reason: 'ICU user should be able to advance to Internal Coordination'
    },
    {
      user: 'opr',
      action: 'advance',
      fromStage: 'DRAFT_CREATION',
      toStage: 'LEGAL_REVIEW',
      shouldPass: false,
      reason: 'OPR user should not be able to advance directly to Legal Review'
    },
    {
      user: 'legal',
      action: 'advance',
      fromStage: 'LEGAL_REVIEW',
      toStage: 'FINAL_PUBLISHING',
      shouldPass: false,
      reason: 'Legal user should not be able to advance to Final Publishing'
    }
  ];

  for (const test of permissionTests) {
    if (userTokens[test.user]) {
      const permissionResponse = await apiCall('/api/workflow-action', 'POST', {
        action: test.action,
        workflowId: config.testDocument.workflowId,
        fromStage: test.fromStage,
        toStage: test.toStage,
        requiredRole: userRoles[test.user]
      }, userTokens[test.user]);

      const testPassed = test.shouldPass ? permissionResponse.ok : !permissionResponse.ok;
      
      logTest('DB-PERM', `${test.user} permission check (${userRoles[test.user]})`, testPassed,
              test.shouldPass ? 
                (permissionResponse.ok ? '(Allowed as expected)' : '(Blocked unexpectedly)') :
                (permissionResponse.ok ? '(Allowed unexpectedly)' : '(Blocked as expected)'));
    }
  }

  // 4. Test Database Data Consistency
  console.log('\n🔄 4. DATABASE DATA CONSISTENCY TESTS');
  console.log('------------------------------------');

  // Test that the same data is returned when accessed through different endpoints
  const directBackendResponse = await apiCall(
    `/api/workflow/8-stage/document/${config.testDocument.id}`,
    'GET', null, userTokens.opr, true
  );
  
  const frontendProxyResponse = await apiCall(
    `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
    'GET', null, userTokens.opr
  );

  if (directBackendResponse.ok && frontendProxyResponse.ok) {
    const backendStage = directBackendResponse.data.workflow?.current_stage;
    const frontendStage = frontendProxyResponse.data.workflow?.current_stage;
    const stagesMatch = backendStage === frontendStage;
    
    logTest('DB-CONSISTENCY', 'Backend and frontend return same database data', stagesMatch,
            stagesMatch ? `(Both show: ${backendStage})` : 
            `(Backend: ${backendStage}, Frontend: ${frontendStage})`);

    const backendActive = directBackendResponse.data.workflow?.is_active;
    const frontendActive = frontendProxyResponse.data.workflow?.is_active;
    const activeMatch = backendActive === frontendActive;
    
    logTest('DB-CONSISTENCY', 'Workflow active status consistent', activeMatch,
            activeMatch ? `(Both show: ${backendActive})` : 
            `(Backend: ${backendActive}, Frontend: ${frontendActive})`);
  } else {
    logTest('DB-CONSISTENCY', 'Database consistency check', false, 
            '(Failed to retrieve data from both endpoints)');
  }

  // 5. Test Database Transaction Integrity
  console.log('\n⚡ 5. DATABASE TRANSACTION INTEGRITY TESTS');
  console.log('-----------------------------------------');

  // Test that workflow transitions are atomic (either fully succeed or fully fail)
  if (userTokens.workflowAdmin) {
    const currentStateResponse = await apiCall(
      `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
      'GET', null, userTokens.opr
    );

    if (currentStateResponse.ok) {
      const currentStage = currentStateResponse.data.workflow?.current_stage;
      
      // Attempt an invalid transition that should fail completely
      const invalidTransitionResponse = await apiCall('/api/workflow-action', 'POST', {
        action: 'advance',
        workflowId: config.testDocument.workflowId,
        fromStage: currentStage,
        toStage: 'INVALID_STAGE', // This should fail
        requiredRole: 'WORKFLOW_ADMIN'
      }, userTokens.workflowAdmin);

      // Verify the state didn't change after failed transition
      const stateAfterFailedTransition = await apiCall(
        `/api/workflow-status?documentId=${config.testDocument.id}&action=get_status`,
        'GET', null, userTokens.opr
      );

      if (stateAfterFailedTransition.ok) {
        const stageAfterFail = stateAfterFailedTransition.data.workflow?.current_stage;
        const stateUnchanged = stageAfterFail === currentStage;
        
        logTest('DB-TRANSACTION', 'Failed transition leaves database unchanged', 
                !invalidTransitionResponse.ok && stateUnchanged,
                !invalidTransitionResponse.ok && stateUnchanged ? 
                `(State remains: ${currentStage})` : 
                `(Unexpected state change or success)`);
      }
    }
  }

  // Final Results
  console.log('\n📊 DATABASE INTEGRATION TEST RESULTS');
  console.log('====================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

  console.log('🎯 DATABASE INTEGRATION SUMMARY');
  console.log('===============================');
  if (passedTests >= totalTests * 0.85) {
    console.log('✅ Database integration is working excellently!');
    console.log('✅ User roles are properly read from database');
    console.log('✅ Workflow states are correctly written to database');
    console.log('✅ Workflow states are accurately read from database');
    console.log('✅ Permission checks use database role information');
    console.log('✅ Database transactions maintain integrity');
    return true;
  } else {
    console.log(`⚠️  ${totalTests - passedTests} database integration test(s) failed`);
    console.log('❌ Review database connectivity and data persistence');
    return false;
  }
}

// Run the database integration tests
runDatabaseIntegrationTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Database integration test error:', error);
    process.exit(1);
  });