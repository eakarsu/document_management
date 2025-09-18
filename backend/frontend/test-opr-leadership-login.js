const puppeteer = require('puppeteer');

async function testOPRLeadershipLogin() {
  console.log('🔍 TESTING OPR LEADERSHIP LOGIN\n');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.text().includes('DEBUG')) {
      console.log('PAGE CONSOLE:', msg.text());
    }
  });
  
  try {
    // Login as OPR Leadership
    console.log('\n1. Logging in as OPR LEADERSHIP...');
    await page.goto('http://localhost:3000/login');
    await page.type('input[name="email"]', 'opr.leadership@airforce.mil');
    await page.type('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    console.log('✅ OPR Leadership logged in');
    console.log('Current URL:', page.url());
    
    // Navigate to the document with active workflow
    const targetDocId = 'cmfn33ifj000pfjsqyo04fb7p';
    console.log('\n2. Navigating to document:', targetDocId);
    await page.goto(`http://localhost:3000/documents/${targetDocId}`);
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's displayed on the page
    console.log('\n3. Checking document status display...');
    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      // Look for specific status indicators
      const indicators = {
        hasPublishedText: bodyText.includes('Document Published') || bodyText.includes('Published'),
        hasWorkflowText: bodyText.includes('Workflow') || bodyText.includes('workflow'),
        hasStageText: bodyText.includes('Stage') || bodyText.includes('stage'),
        hasFeedbackText: bodyText.includes('Feedback') || bodyText.includes('feedback'),
        hasSecondOPRText: bodyText.includes('Second OPR') || bodyText.includes('second OPR')
      };
      
      // Get workflow-related elements
      const workflowElements = Array.from(document.querySelectorAll('[class*="workflow"]')).map(el => ({
        className: el.className,
        text: el.textContent?.substring(0, 100)
      }));
      
      // Get any alerts or status messages
      const alerts = Array.from(document.querySelectorAll('[role="alert"], .MuiAlert-root')).map(el => 
        el.textContent
      );
      
      // Get button text
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent);
      
      return {
        indicators,
        workflowElements,
        alerts,
        buttons,
        pageTitle: document.title
      };
    });
    
    console.log('\nPAGE INDICATORS:');
    Object.entries(pageContent.indicators).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (pageContent.alerts.length > 0) {
      console.log('\nALERTS FOUND:');
      pageContent.alerts.forEach(alert => console.log(`  - ${alert}`));
    }
    
    console.log('\nBUTTONS FOUND:');
    pageContent.buttons.forEach(btn => {
      if (btn && btn.trim()) {
        console.log(`  - ${btn}`);
      }
    });
    
    // Take screenshot
    await page.screenshot({ path: 'opr-leadership-view.png', fullPage: true });
    console.log('\n📸 Screenshot saved as opr-leadership-view.png');
    
    // Check console output for debug messages
    console.log('\nWaiting 5 seconds to capture any console output...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\nTest complete. Closing browser...');
    await browser.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    await browser.close();
  }
}

testOPRLeadershipLogin().catch(console.error);
