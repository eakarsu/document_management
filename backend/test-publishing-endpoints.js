const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:4000';
const TEST_USER = {
  email: 'admin@admin.com',
  password: 'password123'
};

class PublishingEndpointTester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.testUser = null;
    this.testDocument = null;
    this.testWorkflow = null;
  }

  async login() {
    try {
      console.log('🔐 Logging in...');
      const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
      
      if (response.data.success) {
        this.authToken = response.data.accessToken;
        this.testUser = response.data.user;
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed:', response.data.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async setupTestData() {
    try {
      console.log('🏗️ Setting up test data...');
      
      // Use the test document ID from create-test-user.js output
      this.testDocument = {
        id: 'cmeecipvj0006qfao8on8gfdy',
        title: 'Test Document for Publishing'
      };
      
      console.log('✅ Using test document:', this.testDocument.id);
      return true;
    } catch (error) {
      console.log('❌ Test data setup failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
    const testName = `${method.toUpperCase()} ${endpoint}`;
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        config.data = data;
      }
      
      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        console.log(`✅ ${testName} - Status: ${response.status}`);
        this.testResults.push({ test: testName, status: 'PASSED', response: response.data });
        return response.data;
      } else {
        console.log(`❌ ${testName} - Expected ${expectedStatus}, got ${response.status}`);
        this.testResults.push({ test: testName, status: 'FAILED', error: `Wrong status code` });
        return null;
      }
    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';
      const errorMsg = error.response?.data?.error || error.message;
      
      if (status === expectedStatus) {
        console.log(`✅ ${testName} - Expected error status: ${status}`);
        this.testResults.push({ test: testName, status: 'PASSED', note: 'Expected error' });
        return null;
      } else {
        console.log(`❌ ${testName} - Status: ${status}, Error: ${errorMsg}`);
        this.testResults.push({ test: testName, status: 'FAILED', error: errorMsg });
        return null;
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Publishing API Tests\n');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // Setup test data
    const setupSuccess = await this.setupTestData();
    if (!setupSuccess) {
      console.log('❌ Cannot proceed without test data');
      return;
    }

    console.log('\n📋 Testing Publishing Workflow Endpoints...');
    
    // Test 1: Create Publishing Workflow
    const workflowData = {
      name: 'Test Publishing Workflow',
      description: 'Automated test workflow',
      workflowType: 'DOCUMENT_APPROVAL',
      autoApprove: false,
      requiredApprovers: 1,
      allowParallel: false,
      timeoutHours: 72,
      approvalSteps: [
        {
          stepNumber: 1,
          stepName: 'Initial Review',
          description: 'First level approval',
          isRequired: true,
          timeoutHours: 24,
          minApprovals: 1,
          allowDelegation: true,
          requiredUsers: [this.testUser.id]
        }
      ]
    };
    
    const workflowResult = await this.testEndpoint('POST', '/api/publishing/workflows', workflowData);
    if (workflowResult && workflowResult.success) {
      this.testWorkflow = workflowResult.workflow;
    }

    // Test 2: Get Publishing Dashboard
    await this.testEndpoint('GET', '/api/publishing/dashboard');

    // Test 3: Submit Document for Publishing
    if (this.testWorkflow && this.testDocument) {
      const submitData = {
        documentId: this.testDocument.id,
        workflowId: this.testWorkflow.id,
        urgencyLevel: 'NORMAL',
        publishingNotes: 'Test submission for automated testing',
        destinations: [
          {
            destinationType: 'WEB_PORTAL',
            destinationName: 'Test Portal',
            destinationConfig: { testMode: true }
          }
        ]
      };
      
      await this.testEndpoint('POST', '/api/publishing/submit', submitData);
    }

    console.log('\n📝 Testing Template Endpoints...');
    
    // Test 4: Create Publishing Template
    const templateData = {
      name: 'Test Template',
      description: 'Automated test template',
      templateType: 'STANDARD',
      formatting: {
        fontFamily: 'Helvetica',
        fontSize: 12,
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        colors: {
          primary: '#000000',
          secondary: '#666666',
          text: '#333333',
          background: '#FFFFFF'
        }
      },
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        columns: 1
      },
      metadata: {
        version: '1.0',
        author: 'Test System'
      },
      includeQRCode: true,
      includeWatermark: false
    };
    
    const templateResult = await this.testEndpoint('POST', '/api/publishing/templates', templateData);

    // Test 5: Get Templates
    await this.testEndpoint('GET', '/api/publishing/templates');

    // Test 6: Apply Template (if template was created)
    if (templateResult && templateResult.success && this.testDocument) {
      const applyData = {
        documentId: this.testDocument.id,
        templateId: templateResult.template.id,
        customMetadata: {
          testMode: true,
          createdBy: 'Automated Test'
        }
      };
      
      await this.testEndpoint('POST', '/api/publishing/templates/apply', applyData);
    }

    console.log('\n🤝 Testing Collaborative Workflow Endpoints...');
    
    // Test 7: Create Collaborative Review
    if (this.testDocument) {
      const collaborativeData = {
        documentId: this.testDocument.id,
        reviewType: 'PARALLEL',
        reviewers: [
          {
            userId: this.testUser.id,
            role: 'Primary Reviewer',
            requiredAction: 'APPROVE',
            priority: 1
          }
        ],
        allowSimultaneousEditing: true,
        requireConsensus: false,
        minimumApprovals: 1
      };
      
      await this.testEndpoint('POST', '/api/publishing/collaborative/review', collaborativeData);
    }

    // Test 8: Create Editing Session
    if (this.testDocument) {
      const sessionData = {
        documentId: this.testDocument.id,
        participantIds: [this.testUser.id]
      };
      
      await this.testEndpoint('POST', '/api/publishing/collaborative/editing-session', sessionData);
    }

    console.log('\n📨 Testing Notification Endpoints...');
    
    // Test 9: Get User Notifications
    await this.testEndpoint('GET', '/api/publishing/notifications');
    
    // Test 10: Get Notifications with filters
    await this.testEndpoint('GET', '/api/publishing/notifications?unreadOnly=true&limit=10');

    console.log('\n📊 Testing Distribution Endpoints...');
    
    // Test 11: Get Distribution Analytics
    await this.testEndpoint('GET', '/api/publishing/distribution/analytics');

    console.log('\n❌ Testing Error Handling...');
    
    // Test 12: Test unauthorized access
    const originalToken = this.authToken;
    this.authToken = 'invalid-token';
    await this.testEndpoint('GET', '/api/publishing/dashboard', null, 401);
    this.authToken = originalToken;

    // Test 13: Test missing required fields
    await this.testEndpoint('POST', '/api/publishing/workflows', { name: '' }, 500);

    // Test 14: Test non-existent resource
    await this.testEndpoint('GET', '/api/publishing/collaborative/non-existent-id/status', null, 404);

    this.printTestSummary();
  }

  printTestSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    console.log('\n📁 Saving detailed results...');
    fs.writeFileSync(
      'publishing-test-results.json', 
      JSON.stringify(this.testResults, null, 2)
    );
    console.log('✅ Results saved to publishing-test-results.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PublishingEndpointTester();
  tester.runAllTests().catch(console.error);
}

module.exports = PublishingEndpointTester;