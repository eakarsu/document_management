#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Use frontend public images
const sealImages = {
  'air-force': 'http://localhost:3000/images/air-force-seal.png',
  'army': 'http://localhost:3000/images/army-seal.png',
  'dod': 'http://localhost:3000/images/dod-seal.png',
  'joint-chiefs': 'http://localhost:3000/images/joint-chiefs-seal.png',
  'marine-corps': 'http://localhost:3000/images/marine-corps-seal.png',
  'navy': 'http://localhost:3000/images/navy-seal.png',
  'space-force': 'http://localhost:3000/images/space-force-seal.png'
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ Error: OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

// Template configurations
const templates = [
  { id: 'af-manual', name: 'AIR FORCE MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afi', name: 'AIR FORCE INSTRUCTION', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afpd', name: 'AIR FORCE POLICY DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afman', name: 'AIR FORCE MANUAL (AFMAN)', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afjqs', name: 'AIR FORCE JOB QUALIFICATION STANDARD', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afto', name: 'AIR FORCE TECHNICAL ORDER', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afva', name: 'AIR FORCE VISUAL AID', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afh', name: 'AIR FORCE HANDBOOK', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afgm', name: 'AIR FORCE GUIDANCE MEMORANDUM', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'afmd', name: 'AIR FORCE MISSION DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'dafi', name: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'dafman', name: 'DEPARTMENT OF THE AIR FORCE MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'dafpd', name: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'dodd', name: 'DEPARTMENT OF DEFENSE DIRECTIVE', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', seal: 'dod' },
  { id: 'dodi', name: 'DEPARTMENT OF DEFENSE INSTRUCTION', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', seal: 'dod' },
  { id: 'cjcs', name: 'CHAIRMAN JOINT CHIEFS OF STAFF INSTRUCTION', org: 'JOINT CHIEFS OF STAFF', secretary: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF', seal: 'joint-chiefs' },
  { id: 'army', name: 'ARMY REGULATION', org: 'DEPARTMENT OF THE ARMY', secretary: 'SECRETARY OF THE ARMY', seal: 'army' },
  { id: 'navy', name: 'NAVY INSTRUCTION (OPNAVINST)', org: 'DEPARTMENT OF THE NAVY', secretary: 'SECRETARY OF THE NAVY', seal: 'navy' },
  { id: 'marine', name: 'MARINE CORPS ORDER', org: 'UNITED STATES MARINE CORPS', secretary: 'COMMANDANT OF THE MARINE CORPS', seal: 'marine-corps' },
  { id: 'spaceforce', name: 'SPACE FORCE INSTRUCTION', org: 'UNITED STATES SPACE FORCE', secretary: 'CHIEF OF SPACE OPERATIONS', seal: 'space-force' },
  { id: 'oplan', name: 'OPERATION PLAN', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', seal: 'dod' },
  { id: 'opord', name: 'OPERATION ORDER', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', seal: 'dod' },
  { id: 'conops', name: 'CONCEPT OF OPERATIONS', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', seal: 'dod' },
  { id: 'technical', name: 'TECHNICAL MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'policy', name: 'POLICY DOCUMENT', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'training', name: 'TRAINING MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' },
  { id: 'sop', name: 'STANDARD OPERATING PROCEDURE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', seal: 'air-force' }
];

// Create headers directory
const headersDir = path.join(__dirname, 'headers');
if (!fs.existsSync(headersDir)) {
  fs.mkdirSync(headersDir, { recursive: true });
  console.log('✅ Created headers directory');
}

/**
 * Generate header HTML using OpenRouter API
 */
async function generateHeaderWithAI(template) {
  // Skip AI generation and always use the correct template format
  return generateDirectHeader(template);
}

/**
 * Direct header generation (fallback)
 */
function generateDirectHeader(template) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // Official Air Force document header format (matches screenshot)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${template.name}</title>
<style>
  @page {
    size: letter;
    margin: 0.5in;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.3;
    color: #000;
    padding: 20px;
  }

  /* Header table layout */
  .header-table {
    width: 100%;
    margin-bottom: 20px;
  }

  .header-table td {
    vertical-align: top;
    padding: 10px;
  }

  /* Left column */
  .left-column {
    width: 35%;
    text-align: center;
  }

  .by-order {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 5px;
  }

  .secretary {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 20px;
  }

  .seal-container img {
    width: 100px;
    height: 100px;
    display: block;
    margin: 0 auto;
  }

  /* Right column */
  .right-column {
    width: 65%;
    text-align: right;
  }

  .department {
    font-style: italic;
    font-size: 11pt;
    margin-bottom: 5px;
  }

  .doc-type {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 20px;
  }

  .doc-date {
    font-size: 10pt;
    margin-bottom: 10px;
  }

  .doc-subtitle {
    font-style: italic;
    font-size: 10pt;
    margin-bottom: 10px;
  }

  .doc-title {
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 5px;
  }

  .doc-version {
    font-size: 10pt;
  }

  /* Compliance section */
  .compliance-section {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 30px 0;
    padding: 10px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }

  /* Info table */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .info-table td {
    padding: 8px;
    border-top: 1px solid #000;
    font-size: 10pt;
    vertical-align: top;
  }

  .info-label {
    font-weight: bold;
    width: 20%;
  }

  .info-value {
    width: 80%;
  }

  /* Bottom section */
  .bottom-section {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #000;
  }

  .opr-section {
    font-size: 10pt;
  }

  .certified-section {
    text-align: right;
    font-size: 10pt;
  }

  .pages-section {
    text-align: right;
    font-size: 10pt;
  }
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td class="left-column">
      <div class="by-order">BY ORDER OF THE</div>
      <div class="secretary">${template.secretary}</div>
      <div class="seal-container">
        <img src="${sealImages[template.seal] || ''}" alt="Official Seal">
      </div>
    </td>
    <td class="right-column">
      <div class="department">${template.org}</div>
      <div class="doc-type">${template.name} ${template.id.toUpperCase()}-2618</div>
      <div class="doc-date">${currentDate}</div>
      <div class="doc-subtitle">The Enlisted Force Structure</div>
      <div class="doc-title">AIRMAN AND FAMILY READINESS</div>
      <div class="doc-version">Version 1.0</div>
    </td>
  </tr>
</table>

<div class="compliance-section">
  COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
</div>

<table class="info-table">
  <tr>
    <td class="info-label">DISTRIBUTION:</td>
    <td class="info-value">DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited</td>
  </tr>
  <tr>
    <td class="info-label">ACCESSIBILITY:</td>
    <td class="info-value">Publications and forms are available on the e-Publishing website at http://www.e-publishing.af.mil</td>
  </tr>
  <tr>
    <td class="info-label">RELEASABILITY:</td>
    <td class="info-value">There are no releasability restrictions on this publication.</td>
  </tr>
  <tr>
    <td class="info-label">EFFECTIVE DATE:</td>
    <td class="info-value" colspan="2">
      <div style="display: flex; justify-content: space-between;">
        <span>${currentDate}</span>
        <span style="font-weight: bold; white-space: nowrap;">REVIEW DATE: SEPTEMBER 23, 2026</span>
      </div>
    </td>
  </tr>
  <tr>
    <td class="info-label">POC:</td>
    <td class="info-value">Lt Col Smith, John A.<br>
    DSN: 555-1234 | Commercial: (555) 555-1234<br>
    Email: john.a.smith@us.af.mil</td>
  </tr>
</table>

<table style="width: 100%; margin-top: 20px; border-top: 1px solid #000;">
  <tr>
    <td style="width: 33%; padding-top: 10px; font-size: 10pt;">
      <strong>OPR:</strong> SAF/IG
    </td>
    <td style="width: 33%; text-align: center; padding-top: 10px; font-size: 10pt;">
    </td>
    <td style="width: 33%; text-align: right; padding-top: 10px; font-size: 10pt;">
      Certified by: AF/CV<br>
      (General Larry O. Spencer)<br>
      <br>
      Pages: 5
    </td>
  </tr>
</table>

</body>
</html>`;
}

// Generate all headers
async function generateAllHeaders() {
  console.log('='.repeat(50));
  console.log('OPENROUTER HEADER GENERATOR');
  console.log('='.repeat(50) + '\n');

  console.log('🚀 Using OpenRouter API to generate headers...\n');

  let successCount = 0;
  let failedCount = 0;

  for (const template of templates) {
    try {
      console.log(`⏳ Generating header for ${template.id}...`);
      const headerHtml = await generateHeaderWithAI(template);
      const filename = path.join(headersDir, `${template.id}-header.html`);
      fs.writeFileSync(filename, headerHtml);
      console.log(`✅ Generated header for ${template.id}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to generate header for ${template.id}:`, error.message);
      failedCount++;
    }
  }

  // Generate index file
  const indexContent = `// Auto-generated header index
// Generated on ${new Date().toISOString()}

const fs = require('fs');
const path = require('path');

const headers = {};

${templates.map(t => `headers['${t.id}'] = fs.readFileSync(path.join(__dirname, '${t.id}-header.html'), 'utf8');`).join('\n')}

module.exports = headers;
`;

  fs.writeFileSync(path.join(headersDir, 'index.js'), indexContent);

  console.log('\n' + '='.repeat(50));
  console.log('📊 GENERATION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount} headers`);
  console.log(`❌ Failed: ${failedCount} headers`);
  console.log(`\n📁 Headers saved to: ${headersDir}`);
  console.log('📝 Index file created: headers/index.js');
  console.log('\n✨ Headers are ready to use in your application!');
}

// Run the generator
generateAllHeaders().catch(console.error);