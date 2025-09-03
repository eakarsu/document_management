#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:4000',
  testUser: {
    email: 'admin@admin.com',
    password: 'password123'
  },
  timeout: 30000,
  slowMo: 100 // Slow down for debugging
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Utility functions
const logTest = (testName, passed, error = null) => {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
    testResults.push({ test: testName, status: 'PASS' });
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${testName}${error ? ` - ${error}` : ''}`);
    testResults.push({ test: testName, status: 'FAIL', error });
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test runner
async function runComprehensiveUITests() {
  console.log('🚀 COMPREHENSIVE UI TESTING SYSTEM');
  console.log('===================================');
  
  let browser, page;
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: 'new',
      slowMo: config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set longer timeout
    page.setDefaultTimeout(config.timeout);
    page.setDefaultNavigationTimeout(config.timeout);
    
    console.log('\n📋 Test 1: Frontend Accessibility');
    console.log('----------------------------------');
    
    // Test 1: Homepage loads
    try {
      await page.goto(config.frontendUrl);
      await page.waitForSelector('body', { timeout: 10000 });
      logTest('Homepage loads', true);
    } catch (error) {
      logTest('Homepage loads', false, error.message);
    }
    
    // Test 2: Login page accessible
    try {
      await page.goto(`${config.frontendUrl}/login`);
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]');
      logTest('Login page accessible', true);
    } catch (error) {
      logTest('Login page accessible', false, error.message);
    }
    
    console.log('\n🔐 Test 2: Authentication Flow');
    console.log('------------------------------');
    
    // Test 3: User login
    try {
      await page.type('input[type="email"]', config.testUser.email);
      await page.type('input[type="password"]', config.testUser.password);
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 10000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        logTest('User login successful', true);
      } else {
        logTest('User login successful', false, `Redirected to ${currentUrl} instead of dashboard`);
      }
    } catch (error) {
      logTest('User login successful', false, error.message);
    }
    
    console.log('\n📊 Test 3: Dashboard Functionality');
    console.log('-----------------------------------');
    
    // Test 4: Dashboard loads with data
    try {
      await page.waitForSelector('h4', { timeout: 10000 });
      const title = await page.$eval('h4', el => el.textContent);
      if (title.includes('Richmond DMS') || title.includes('Welcome')) {
        logTest('Dashboard loads with content', true);
      } else {
        logTest('Dashboard loads with content', false, `Unexpected title: ${title}`);
      }
    } catch (error) {
      logTest('Dashboard loads with content', false, error.message);
    }
    
    // Test 5: Create Document button exists
    try {
      const createButton = await page.waitForSelector('button:has-text("Create Document")', { timeout: 5000 });
      if (createButton) {
        logTest('Create Document button visible', true);
      } else {
        logTest('Create Document button visible', false, 'Button not found');
      }
    } catch (error) {
      // Try alternative selector
      try {
        const createButtonAlt = await page.$('button[aria-label*="Create"], button:contains("Create")');
        if (createButtonAlt) {
          logTest('Create Document button visible', true);
        } else {
          logTest('Create Document button visible', false, 'No create button found');
        }
      } catch (err) {
        logTest('Create Document button visible', false, error.message);
      }
    }
    
    console.log('\n📝 Test 4: Document Creation Flow');
    console.log('----------------------------------');
    
    // Test 6: Navigate to document creation
    try {
      await page.goto(`${config.frontendUrl}/documents/create`);
      await page.waitForSelector('h4', { timeout: 10000 });
      
      const pageTitle = await page.$eval('h4', el => el.textContent);
      if (pageTitle.includes('Create') || pageTitle.includes('Document')) {
        logTest('Document creation page loads', true);
      } else {
        logTest('Document creation page loads', false, `Wrong page title: ${pageTitle}`);
      }
    } catch (error) {
      logTest('Document creation page loads', false, error.message);
    }
    
    // Test 7: Template selection works
    try {
      await page.waitForSelector('[data-testid="template-card"], .MuiCard-root', { timeout: 5000 });
      const templateCards = await page.$$('[data-testid="template-card"], .MuiCard-root');
      
      if (templateCards.length >= 4) {
        logTest('Template cards displayed (≥4 templates)', true);
        
        // Test 8: Biography templates are marked
        const biographyChips = await page.$$eval('[data-testid="biography-chip"], .MuiChip-root', 
          chips => chips.filter(chip => chip.textContent.toLowerCase().includes('biography')));
        
        if (biographyChips.length >= 3) {
          logTest('Biography templates identified (≥3 templates)', true);
        } else {
          logTest('Biography templates identified (≥3 templates)', false, `Only found ${biographyChips.length} biography templates`);
        }
      } else {
        logTest('Template cards displayed (≥4 templates)', false, `Only ${templateCards.length} templates found`);
        logTest('Biography templates identified (≥3 templates)', false, 'Not enough templates');
      }
    } catch (error) {
      logTest('Template cards displayed (≥4 templates)', false, error.message);
      logTest('Biography templates identified (≥3 templates)', false, 'Template test failed');
    }
    
    // Test 9: Template selection and form progression
    try {
      // Click first template
      await page.click('[data-testid="template-card"], .MuiCard-root');
      await sleep(500);
      
      // Click Next button
      await page.click('button:has-text("Next"), button[aria-label*="next"]');
      await sleep(1000);
      
      // Check if we're on step 2 (form fields)
      const titleField = await page.$('input[label*="Title"], input[placeholder*="title"]');
      if (titleField) {
        logTest('Template selection and form progression', true);
        
        // Test 10: Fill out document details
        await page.type('input[label*="Title"], input[placeholder*="title"]', 'Test Document with Biography Section');
        await page.type('input[label*="Publication"], input[placeholder*="publication"]', 'TEST-2025-001');
        await page.type('input[label*="OPR"], input[placeholder*="opr"]', 'AF/TEST');
        
        logTest('Document form can be filled', true);
      } else {
        logTest('Template selection and form progression', false, 'Form fields not found');
        logTest('Document form can be filled', false, 'Cannot proceed to form');
      }
    } catch (error) {
      logTest('Template selection and form progression', false, error.message);
      logTest('Document form can be filled', false, error.message);
    }
    
    console.log('\n🗂️ Test 5: Document Management');
    console.log('-------------------------------');
    
    // Test 11: Documents page accessible
    try {
      await page.goto(`${config.frontendUrl}/documents`);
      await page.waitForSelector('h4', { timeout: 10000 });
      logTest('Documents page accessible', true);
    } catch (error) {
      logTest('Documents page accessible', false, error.message);
    }
    
    // Test 12: Search functionality
    try {
      const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
      if (searchInput) {
        await page.type('input[placeholder*="Search"], input[type="search"]', 'test');
        await sleep(1000);
        logTest('Document search functionality', true);
      } else {
        logTest('Document search functionality', false, 'Search input not found');
      }
    } catch (error) {
      logTest('Document search functionality', false, error.message);
    }
    
    console.log('\n📊 Test 6: Publishing Features');
    console.log('-------------------------------');
    
    // Test 13: Publishing page accessible
    try {
      await page.goto(`${config.frontendUrl}/publishing`);
      await page.waitForSelector('body', { timeout: 10000 });
      logTest('Publishing page accessible', true);
    } catch (error) {
      logTest('Publishing page accessible', false, error.message);
    }
    
    // Test 14: AI Workflow features
    try {
      await page.goto(`${config.frontendUrl}/ai-workflow`);
      await page.waitForSelector('body', { timeout: 10000 });
      logTest('AI Workflow page accessible', true);
    } catch (error) {
      logTest('AI Workflow page accessible', false, error.message);
    }
    
    console.log('\n🔄 Test 7: Backend API Integration');
    console.log('-----------------------------------');
    
    // Test 15: Backend API calls work from frontend
    try {
      const response = await page.evaluate(async (backendUrl) => {
        const res = await fetch('/api/dashboard/stats', {
          credentials: 'include'
        });
        return res.ok;
      }, config.backendUrl);
      
      logTest('Frontend-Backend API integration', response);
    } catch (error) {
      logTest('Frontend-Backend API integration', false, error.message);
    }
    
  } catch (error) {
    console.error('Critical test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate test report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    },
    results: testResults
  };
  
  fs.writeFileSync('ui-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: ui-test-results.json');
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL UI TESTS PASSED! System is fully functional.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review the results above.`);
    process.exit(1);
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  runComprehensiveUITests();
} catch (error) {
  console.log('Installing puppeteer for UI testing...');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install puppeteer', { stdio: 'inherit' });
    console.log('Puppeteer installed. Restarting test...');
    runComprehensiveUITests();
  } catch (installError) {
    console.error('Failed to install puppeteer:', installError);
    console.log('Running basic backend tests instead...');
    
    // Fallback to basic tests
    const { spawn } = require('child_process');
    const test = spawn('./test-complete-system.sh', [], { stdio: 'inherit' });
    test.on('close', (code) => process.exit(code));
  }
}