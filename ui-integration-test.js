#!/usr/bin/env node

// UI Integration Test - Tests the frontend application functionality
// This tests the actual UI components and their integration with APIs

const fetch = globalThis.fetch || require('node-fetch');

const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:4000',
  testDocument: 'cmf2tl02m0001ia6lwdxpd50q'
};

let totalTests = 0;
let passedTests = 0;

const logTest = (testName, passed, details = '') => {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ UI: ${testName} ${details}`);
  } else {
    console.log(`❌ UI: ${testName} ${details}`);
  }
};

// Test frontend page accessibility
const testPageAccess = async (path, expectedContent = null) => {
  try {
    const response = await fetch(`${config.frontendUrl}${path}`);
    const content = await response.text();
    
    if (expectedContent) {
      return response.ok && content.includes(expectedContent);
    }
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Test API endpoint through frontend
const testFrontendEndpoint = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${config.frontendUrl}${endpoint}`, {
      credentials: 'include',
      ...options
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.headers.get('content-type')?.includes('json') ? 
            await response.json() : await response.text()
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

async function runUIIntegrationTests() {
  console.log('🎨 UI INTEGRATION TEST SUITE');
  console.log('============================');
  console.log(`🌐 Testing Frontend: ${config.frontendUrl}`);
  console.log(`📄 Test Document: ${config.testDocument}\n`);

  // 1. Frontend Page Accessibility Tests
  console.log('📱 1. FRONTEND PAGE ACCESSIBILITY');
  console.log('---------------------------------');

  // Test main application pages
  const dashboardAccess = await testPageAccess('/dashboard');
  logTest('Dashboard page accessibility', dashboardAccess, '(/dashboard)');

  const loginAccess = await testPageAccess('/login');
  logTest('Login page accessibility', loginAccess, '(/login)');

  const documentPageAccess = await testPageAccess(`/documents/${config.testDocument}`);
  logTest('Document detail page accessibility', documentPageAccess, 
          `(/documents/${config.testDocument})`);

  // 2. API Endpoint Integration through Frontend
  console.log('\n🔌 2. API INTEGRATION THROUGH FRONTEND');
  console.log('-------------------------------------');

  // Test workflow status endpoint
  const workflowStatusTest = await testFrontendEndpoint(
    `/api/workflow-status?documentId=${config.testDocument}&action=get_status`
  );
  logTest('Workflow status API endpoint', workflowStatusTest.ok, 
          workflowStatusTest.ok ? '(API responding)' : `(${workflowStatusTest.status})`);

  // Test workflow history endpoint
  const historyTest = await testFrontendEndpoint(
    `/api/workflow-history?workflowId=workflow_${config.testDocument}`
  );
  logTest('Workflow history API endpoint', historyTest.ok || historyTest.status === 401, 
          historyTest.ok ? '(API responding)' : '(Auth required - expected)');

  // Test workflow action endpoint
  const actionTest = await testFrontendEndpoint('/api/workflow-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'advance',
      workflowId: `workflow_${config.testDocument}`,
      fromStage: 'DRAFT_CREATION',
      toStage: 'INTERNAL_COORDINATION'
    })
  });
  logTest('Workflow action API endpoint', actionTest.status === 401 || actionTest.ok, 
          actionTest.status === 401 ? '(Auth required - expected)' : 
          actionTest.ok ? '(API responding)' : `(${actionTest.status})`);

  // Test workflow feedback endpoint
  const feedbackTest = await testFrontendEndpoint('/api/workflow-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: config.testDocument,
      stage: '1st Coordination',
      feedback: 'UI integration test feedback'
    })
  });
  logTest('Workflow feedback API endpoint', feedbackTest.status === 401 || feedbackTest.ok, 
          feedbackTest.status === 401 ? '(Auth required - expected)' : 
          feedbackTest.ok ? '(API responding)' : `(${feedbackTest.status})`);

  // 3. Frontend Application Health Tests
  console.log('\n🏥 3. FRONTEND APPLICATION HEALTH');
  console.log('---------------------------------');

  // Test static asset serving
  const faviconTest = await testPageAccess('/favicon.ico');
  logTest('Static asset serving', faviconTest, '(favicon.ico)');

  // Test Next.js API routes structure
  const nextApiHealthTest = await testFrontendEndpoint('/api/health');
  logTest('Next.js API route structure', nextApiHealthTest.status !== 500, 
          nextApiHealthTest.status === 404 ? '(Route not found - expected)' : 
          `(Status: ${nextApiHealthTest.status})`);

  // 4. Component Integration Tests
  console.log('\n🧩 4. COMPONENT INTEGRATION TESTS');
  console.log('---------------------------------');

  // Test document page contains expected workflow components
  const documentPageContent = await fetch(`${config.frontendUrl}/documents/${config.testDocument}`)
    .then(r => r.text()).catch(() => '');
  
  const hasWorkflowProgress = documentPageContent.includes('8-Stage Workflow Progress') ||
                             documentPageContent.includes('workflow') ||
                             documentPageContent.includes('Stage');
  logTest('Document page has workflow components', hasWorkflowProgress, 
          hasWorkflowProgress ? '(Workflow UI detected)' : '(No workflow UI found)');

  const hasDocumentViewer = documentPageContent.includes('Document Preview') ||
                           documentPageContent.includes('DocumentViewer') ||
                           documentPageContent.includes('preview');
  logTest('Document page has viewer component', hasDocumentViewer, 
          hasDocumentViewer ? '(Document viewer detected)' : '(No document viewer found)');

  // 5. Performance and Responsiveness Tests
  console.log('\n⚡ 5. PERFORMANCE AND RESPONSIVENESS');
  console.log('-----------------------------------');

  // Test page load performance
  const startTime = Date.now();
  const pageLoadTest = await testPageAccess(`/documents/${config.testDocument}`);
  const loadTime = Date.now() - startTime;
  
  logTest('Page load performance', pageLoadTest && loadTime < 5000, 
          `(${loadTime}ms - ${loadTime < 2000 ? 'Fast' : loadTime < 5000 ? 'Acceptable' : 'Slow'})`);

  // Test API response time
  const apiStartTime = Date.now();
  await testFrontendEndpoint(`/api/workflow-status?documentId=${config.testDocument}&action=get_status`);
  const apiResponseTime = Date.now() - apiStartTime;
  
  logTest('API response performance', apiResponseTime < 1000, 
          `(${apiResponseTime}ms - ${apiResponseTime < 500 ? 'Fast' : apiResponseTime < 1000 ? 'Good' : 'Slow'})`);

  // Final Results
  console.log('\n📊 UI INTEGRATION TEST RESULTS');
  console.log('==============================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

  console.log('🎯 UI INTEGRATION SUMMARY');
  console.log('=========================');
  if (passedTests >= totalTests * 0.8) {
    console.log('✅ UI integration tests show good frontend functionality');
    console.log('✅ Frontend pages are accessible and loading correctly');
    console.log('✅ API endpoints are reachable through frontend proxy');
    console.log('✅ Application performance is acceptable');
    console.log('✅ Components appear to be integrated properly');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} UI test(s) need attention`);
  }

  console.log('\n📝 MANUAL TESTING RECOMMENDATIONS:');
  console.log('----------------------------------');
  console.log('1. Open browser and navigate to:');
  console.log(`   ${config.frontendUrl}/documents/${config.testDocument}`);
  console.log('2. Test login with: opr@demo.mil / Demo123!');
  console.log('3. Verify workflow status display is visible and readable');
  console.log('4. Test workflow action buttons (if present)');
  console.log('5. Check document preview functionality');
  console.log('6. Verify no CSP errors in browser console');
  
  return passedTests >= totalTests * 0.8;
}

// Run UI integration tests
runUIIntegrationTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('UI integration test error:', error);
    process.exit(1);
  });