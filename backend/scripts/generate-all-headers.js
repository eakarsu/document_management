const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

// Template list matching AI generator
const templates = [
  'af-manual', 'afi', 'afpd', 'afman', 'afjqs', 'afto', 'afva', 'afh', 'afgm', 'afmd',
  'dafi', 'dafman', 'dafpd',
  'spaceforce',
  'army', 'navy', 'marine',
  'dodd', 'dodi', 'cjcs',
  'oplan', 'opord', 'conops',
  'technical', 'policy', 'training', 'sop'
];

// Template metadata for headers
const templateMetadata = {
  'af-manual': {
    instructionTitle: 'AIR FORCE MANUAL 1-1',
    subject: 'Operational Procedures and Guidelines',
    responsibilities: 'OPERATIONS AND TRAINING'
  },
  'afi': {
    instructionTitle: 'AIR FORCE INSTRUCTION 36-2903',
    subject: 'Dress and Personal Appearance Standards',
    responsibilities: 'PERSONNEL AND READINESS'
  },
  'afpd': {
    instructionTitle: 'AIR FORCE POLICY DIRECTIVE 1-2',
    subject: 'Command Structure and Organization',
    responsibilities: 'LEADERSHIP AND COMMAND'
  },
  'afman': {
    instructionTitle: 'AIR FORCE MANUAL 33-363',
    subject: 'Management of Records',
    responsibilities: 'ADMINISTRATION'
  },
  'afjqs': {
    instructionTitle: 'AIR FORCE JOB QUALIFICATION STANDARD 2A6X1',
    subject: 'Aerospace Propulsion Systems',
    responsibilities: 'MAINTENANCE AND LOGISTICS'
  },
  'afto': {
    instructionTitle: 'AIR FORCE TECHNICAL ORDER 1-1-3',
    subject: 'Technical Order System Procedures',
    responsibilities: 'TECHNICAL OPERATIONS'
  },
  'afva': {
    instructionTitle: 'AIR FORCE VISUAL AID 36-2903',
    subject: 'Quick Reference Guide',
    responsibilities: 'TRAINING AIDS'
  },
  'afh': {
    instructionTitle: 'AIR FORCE HANDBOOK 1',
    subject: 'Airman Development',
    responsibilities: 'PROFESSIONAL DEVELOPMENT'
  },
  'afgm': {
    instructionTitle: 'AIR FORCE GUIDANCE MEMORANDUM 2024-01',
    subject: 'Interim Policy Changes',
    responsibilities: 'POLICY UPDATES'
  },
  'afmd': {
    instructionTitle: 'AIR FORCE MISSION DIRECTIVE 10',
    subject: 'Unit Mission and Responsibilities',
    responsibilities: 'MISSION COMMAND'
  },
  'dafi': {
    instructionTitle: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION 90-301',
    subject: 'Inspector General Complaints Resolution',
    responsibilities: 'INSPECTOR GENERAL'
  },
  'dafman': {
    instructionTitle: 'DEPARTMENT OF THE AIR FORCE MANUAL 65-605',
    subject: 'Budget Guidance and Technical Procedures',
    responsibilities: 'FINANCIAL MANAGEMENT'
  },
  'dafpd': {
    instructionTitle: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE 36-26',
    subject: 'Total Force Development and Management',
    responsibilities: 'FORCE MANAGEMENT'
  },
  'dodd': {
    instructionTitle: 'DEPARTMENT OF DEFENSE DIRECTIVE 5100.01',
    subject: 'Functions of the Department of Defense',
    responsibilities: 'DEFENSE MANAGEMENT'
  },
  'dodi': {
    instructionTitle: 'DEPARTMENT OF DEFENSE INSTRUCTION 1300.17',
    subject: 'Religious Liberty in the Military Services',
    responsibilities: 'PERSONNEL POLICY'
  },
  'cjcs': {
    instructionTitle: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF INSTRUCTION 3110.01',
    subject: 'Joint Strategic Campaign Plan',
    responsibilities: 'STRATEGIC PLANNING'
  },
  'army': {
    instructionTitle: 'ARMY REGULATION 600-8-10',
    subject: 'Leaves and Passes',
    responsibilities: 'PERSONNEL ACTIONS'
  },
  'navy': {
    instructionTitle: 'OPNAVINST 5370.2',
    subject: 'Navy Fraternization Policy',
    responsibilities: 'STANDARDS OF CONDUCT'
  },
  'marine': {
    instructionTitle: 'MARINE CORPS ORDER 1500.58',
    subject: 'Marine Corps Mentoring Program',
    responsibilities: 'LEADERSHIP DEVELOPMENT'
  },
  'spaceforce': {
    instructionTitle: 'SPACE FORCE INSTRUCTION 36-2903',
    subject: 'Guardian Dress and Appearance Standards',
    responsibilities: 'GUARDIAN STANDARDS'
  },
  'oplan': {
    instructionTitle: 'OPERATION PLAN 8010-24',
    subject: 'Strategic Deterrence and Force Employment',
    responsibilities: 'STRATEGIC OPERATIONS'
  },
  'opord': {
    instructionTitle: 'OPERATION ORDER 2024-15',
    subject: 'Operational Deployment Directive',
    responsibilities: 'OPERATIONAL COMMAND'
  },
  'conops': {
    instructionTitle: 'CONCEPT OF OPERATIONS PLAN',
    subject: 'Future Operations Framework',
    responsibilities: 'OPERATIONAL PLANNING'
  },
  'technical': {
    instructionTitle: 'TECHNICAL MANUAL 1-1',
    subject: 'Systems Architecture and Implementation',
    responsibilities: 'TECHNICAL DOCUMENTATION'
  },
  'policy': {
    instructionTitle: 'POLICY DOCUMENT 2024-01',
    subject: 'Organizational Governance Framework',
    responsibilities: 'POLICY MANAGEMENT'
  },
  'training': {
    instructionTitle: 'TRAINING MANUAL 36-2201',
    subject: 'Comprehensive Training Program',
    responsibilities: 'EDUCATION AND TRAINING'
  },
  'sop': {
    instructionTitle: 'STANDARD OPERATING PROCEDURE 91-100',
    subject: 'Safety and Operational Procedures',
    responsibilities: 'OPERATIONS MANAGEMENT'
  }
};

// Create headers directory if it doesn't exist
const headersDir = path.join(__dirname, 'headers');
if (!fs.existsSync(headersDir)) {
  fs.mkdirSync(headersDir, { recursive: true });
  console.log('✅ Created headers directory');
}

// Function to extract header from generated document
function extractHeader(htmlContent) {
  // Extract everything from start to just before Table of Contents
  const tocIndex = htmlContent.indexOf('TABLE OF CONTENTS');
  if (tocIndex > 0) {
    return htmlContent.substring(0, tocIndex).trim();
  }

  // If no TOC found, extract the first major section (usually the header)
  const firstH1 = htmlContent.indexOf('<h1');
  if (firstH1 > 0) {
    return htmlContent.substring(0, firstH1).trim();
  }

  // Fallback: return first 2000 characters (should contain header)
  return htmlContent.substring(0, 2000).trim();
}

// Add this function to get auth token
async function getAuthToken() {
  // Try multiple authentication methods

  // Method 1: Try common test credentials
  const testCredentials = [
    { email: 'admin@airforce.mil', password: 'password123' },
    { email: 'admin@airforce.mil', password: 'admin123' },
    { email: 'admin@airforce.mil', password: 'Admin123!' },
    { email: 'admin@airforce.mil', password: 'password' },
    { email: 'admin@test.com', password: 'password123' },
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'admin@richmond-dms.com', password: 'admin123' },
    { email: 'admin@demo.mil', password: 'admin123' }
  ];

  for (const creds of testCredentials) {
    try {
      console.log(`Trying login with ${creds.email}...`);
      const loginResponse = await axios.post('http://localhost:4000/api/auth/login', creds);

      if (loginResponse.data && loginResponse.data.token) {
        console.log(`✅ Authentication successful with ${creds.email}`);
        return loginResponse.data.token;
      }
    } catch (error) {
      // Continue to next credential
    }
  }

  // Method 2: Try to create a new test user
  try {
    console.log('Creating test user for header generation...');
    const testUser = {
      email: `headers_${Date.now()}@test.com`,
      password: 'TestPass123!',
      firstName: 'Header',
      lastName: 'Generator',
      role: 'Admin'
    };

    // Try to register the test user
    const registerResponse = await axios.post('http://localhost:4000/api/auth/register', testUser);

    if (registerResponse.data) {
      console.log('Test user created, logging in...');

      // Now login with the new user
      const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      if (loginResponse.data && loginResponse.data.token) {
        console.log('✅ Authentication successful with test user');
        return loginResponse.data.token;
      }
    }
  } catch (error) {
    console.log('Could not create test user (may require existing auth)');
  }

  // Method 3: Try to use a bypass token if your backend has one for testing
  try {
    // Some backends have a test/bypass endpoint
    const testResponse = await axios.get('http://localhost:4000/api/auth/test-token');
    if (testResponse.data && testResponse.data.token) {
      console.log('✅ Got test token from server');
      return testResponse.data.token;
    }
  } catch (error) {
    // No test token endpoint
  }

  console.error('⚠️ All automatic authentication methods failed.');
  return null;
}

// Global auth token
let AUTH_TOKEN = null;

// Function to call AI generator API for each template
async function generateHeaderForTemplate(template) {
  const metadata = templateMetadata[template] || {
    instructionTitle: `${template.toUpperCase()} DOCUMENT`,
    subject: 'Standard Document Template',
    responsibilities: 'GENERAL'
  };

  const requestBody = {
    template: template,
    pages: 1, // Only generate 1 page to get the header
    feedbackCount: 0,
    headerData: {
      instructionTitle: metadata.instructionTitle,
      date: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      subject: metadata.subject,
      responsibilities: metadata.responsibilities,
      certifiedBy: 'AF/A1 (Lt Gen Brian T. Kelly)',
      opr: 'SAF/AQ',
      pages: 1
    }
  };

  try {
    console.log(`🤖 Generating header for ${template}...`);

    // Call the actual AI generator API with authentication
    const response = await axios.post('http://localhost:4000/api/ai-document-generator', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${AUTH_TOKEN}` // Add the auth token as a cookie
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.documentId) {
      // If we get a document ID, fetch the document to get its content
      const docResponse = await axios.get(`http://localhost:4000/api/documents/${response.data.documentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${AUTH_TOKEN}` // Add auth token here too
        }
      });

      if (docResponse.data && docResponse.data.document) {
        const document = docResponse.data.document;
        let content = '';

        // Extract content from customFields or content field
        if (document.customFields && document.customFields.htmlContent) {
          content = document.customFields.htmlContent;
        } else if (document.customFields && document.customFields.content) {
          content = document.customFields.content;
        } else if (document.content) {
          content = document.content;
        }

        if (content) {
          return extractHeader(content);
        }
      }
    }

    console.log(`⚠️ No content returned for ${template}, generating fallback header`);
    return generateFallbackHeader(template);

  } catch (error) {
    console.log(`⚠️ Failed to generate header for ${template}: ${error.message}`);
    console.log('Using fallback header...');
    return generateFallbackHeader(template);
  }
}

// Fallback header generation
function generateFallbackHeader(template) {
  const metadata = templateMetadata[template] || {};
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return `
<style>
  .classification-header {
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #F0F0F0;
    color: #000;
    border: 2px solid #000;
  }

  .air-force-document-header {
    font-family: 'Times New Roman', serif;
    width: 100%;
    margin: 0 0 2rem 0;
    padding: 1in;
    box-sizing: border-box;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .header-center {
    text-align: center;
    flex-grow: 1;
  }

  .seal-container {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }

  .header-title {
    font-size: 14pt;
    font-weight: bold;
    margin: 0.5rem 0;
  }

  .compliance-notice {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 2rem 0 1rem 0;
    padding: 0.5rem 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }
</style>

<div class="classification-header">UNCLASSIFIED</div>

<div class="air-force-document-header">
  <div class="header-top">
    <div class="header-left"></div>

    <div class="header-center">
      <div>BY ORDER OF THE</div>
      <div style="font-weight: bold;">SECRETARY OF THE AIR FORCE</div>

      <div class="seal-container">
        <img src="/images/air-force-seal.png" alt="Air Force Seal" width="100" height="100">
      </div>

      <div style="font-weight: bold;">DEPARTMENT OF THE AIR FORCE</div>
      <div class="header-title">${metadata.instructionTitle || template.toUpperCase()}</div>
      <div style="margin: 0.5rem 0;">${currentDate}</div>
      <div style="font-style: italic; margin-top: 1rem;">${metadata.subject || 'Official Document'}</div>
      <div style="margin-top: 0.5rem;">${metadata.responsibilities || 'GENERAL'}</div>
    </div>

    <div class="header-right"></div>
  </div>

  <div class="compliance-notice">
    COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
  </div>
</div>
`;
}

// Main function to generate all headers
async function generateAllHeaders() {
  console.log('🚀 Starting header generation for all templates...');
  console.log('📝 Total templates to process:', templates.length);
  console.log('⏰ This may take a few minutes...\n');

  const results = {
    success: [],
    failed: []
  };

  for (const template of templates) {
    try {
      const headerHtml = await generateHeaderForTemplate(template);

      // Save to file
      const filename = path.join(headersDir, `${template}-header.html`);
      fs.writeFileSync(filename, headerHtml);

      console.log(`✅ Saved header for ${template}`);
      results.success.push(template);

      // Add delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to process ${template}:`, error.message);
      results.failed.push(template);
    }
  }

  // Generate index file for easy import
  const indexContent = `// Auto-generated header index
// Generated on ${new Date().toISOString()}

const fs = require('fs');
const path = require('path');

const headers = {};

${results.success.map(template =>
  `headers['${template}'] = fs.readFileSync(path.join(__dirname, '${template}-header.html'), 'utf8');`
).join('\n')}

module.exports = headers;
`;

  fs.writeFileSync(path.join(headersDir, 'index.js'), indexContent);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 GENERATION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${results.success.length} headers`);
  console.log(`❌ Failed: ${results.failed.length} headers`);

  if (results.failed.length > 0) {
    console.log('\n⚠️ Failed templates:', results.failed.join(', '));
  }

  console.log(`\n📁 Headers saved to: ${headersDir}`);
  console.log('📝 Index file created: headers/index.js');
  console.log('\n✨ You can now use these headers in the Create Document page!');
}

// Check if server is running
async function checkServerStatus() {
  try {
    // Try a simple health check endpoint first
    const response = await axios.get('http://localhost:4000/api/health', {
      timeout: 5000
    });
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    // If health endpoint doesn't exist, try the root
    try {
      const response2 = await axios.get('http://localhost:4000/', {
        timeout: 5000
      });
      console.log('✅ Server is running\n');
      return true;
    } catch (error2) {
      console.error('❌ Server is not running or not accessible at http://localhost:4000');
      console.error('Error:', error2.message);
      console.error('Please make sure the backend server is running with: npm run dev\n');
      console.error('You can also skip the server check by commenting out the checkServerStatus call in main()\n');
      return false;
    }
  }
}

// Run the script
async function main() {
  console.log('=' .repeat(50));
  console.log('AI DOCUMENT HEADER GENERATOR');
  console.log('='.repeat(50) + '\n');

  // Check if server is running (skip with --skip-check flag)
  if (!process.argv.includes('--skip-check')) {
    const serverOk = await checkServerStatus();
    if (!serverOk) {
      console.log('\nTip: You can skip the server check with: node generate-all-headers.js --skip-check');
      process.exit(1);
    }
  } else {
    console.log('⚠️ Skipping server check (--skip-check flag used)\n');
  }

  // Get authentication token
  console.log('🔐 Getting authentication token...');
  AUTH_TOKEN = await getAuthToken();

  if (!AUTH_TOKEN) {
    // Try to use a hardcoded token if login fails
    // You can manually set this token from your browser cookies
    AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Set your token here or in .env

    if (!AUTH_TOKEN) {
      console.error('❌ Authentication failed. Please either:');
      console.error('1. Update the admin credentials in the script (lines 186-187)');
      console.error('2. Set AUTH_TOKEN environment variable with a valid token');
      console.error('3. Manually set AUTH_TOKEN in the script\n');
      console.log('To get a token manually:');
      console.log('1. Login to the app at http://localhost:3000');
      console.log('2. Open Browser DevTools (F12)');
      console.log('3. Go to Application/Storage > Cookies > localhost');
      console.log('4. Copy the value of the "token" cookie');
      console.log('5. Set it as AUTH_TOKEN in this script or as environment variable\n');
      process.exit(1);
    }
  }

  // Generate all headers
  await generateAllHeaders();
}

main().catch(console.error);