const fs = require('fs');
const path = require('path');

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

// Function to generate header HTML
function generateHeader(template) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return `<!DOCTYPE html>
<html>
<head>
<style>
  @page {
    margin: 1in;
  }

  body {
    font-family: 'Times New Roman', serif;
    margin: 0;
    padding: 0;
  }

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

  .document-header {
    text-align: center;
    margin: 2rem 0;
  }

  .header-top {
    margin-bottom: 1rem;
    font-size: 11pt;
  }

  .header-seal {
    margin: 1.5rem 0;
  }

  .header-seal img {
    width: 120px;
    height: 120px;
  }

  .header-org {
    font-weight: bold;
    font-size: 14pt;
    margin: 1rem 0;
  }

  .header-title {
    font-weight: bold;
    font-size: 16pt;
    margin: 1rem 0;
  }

  .header-number {
    font-size: 14pt;
    margin: 0.5rem 0;
  }

  .header-date {
    font-size: 12pt;
    margin: 1rem 0;
  }

  .header-subject {
    font-style: italic;
    font-size: 14pt;
    margin: 1.5rem 0;
  }

  .header-category {
    font-size: 12pt;
    margin: 0.5rem 0;
  }

  .compliance-notice {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 2rem 0;
    padding: 0.5rem 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }

  .distribution-statement {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid #000;
    font-size: 10pt;
  }

  .header-info-table {
    width: 100%;
    margin-top: 2rem;
    border-collapse: collapse;
  }

  .header-info-table td {
    padding: 0.25rem 0;
    font-size: 10pt;
  }

  .header-info-table td:first-child {
    font-weight: bold;
    width: 150px;
  }
</style>
</head>
<body>

<div class="classification-header">UNCLASSIFIED</div>

<div class="document-header">
  <div class="header-top">
    <div>BY ORDER OF THE</div>
    <div style="font-weight: bold;">${template.secretary}</div>
  </div>

  <div class="header-seal">
    <img src="/images/${template.seal}-seal.png" alt="Official Seal">
  </div>

  <div class="header-org">${template.org}</div>

  <div class="header-title">${template.name}</div>

  <div class="header-number">${template.id.toUpperCase()}-2024-01</div>

  <div class="header-date">${currentDate}</div>

  <div class="header-subject">Official Guidance and Procedures</div>

  <div class="header-category">Version 1.0</div>
</div>

<div class="compliance-notice">
  COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
</div>

<div class="distribution-statement">
  <strong>DISTRIBUTION STATEMENT A:</strong> Approved for public release; distribution unlimited.
</div>

<table class="header-info-table">
  <tr>
    <td>ACCESSIBILITY:</td>
    <td>Publications and forms are available on the e-Publishing website at https://www.e-publishing.af.mil</td>
  </tr>
  <tr>
    <td>RELEASABILITY:</td>
    <td>There are no releasability restrictions on this publication.</td>
  </tr>
  <tr>
    <td>OPR:</td>
    <td>SAF/IG</td>
  </tr>
  <tr>
    <td>Certified by:</td>
    <td>AF/CV</td>
  </tr>
  <tr>
    <td>Pages:</td>
    <td>1</td>
  </tr>
</table>

</body>
</html>`;
}

// Generate all headers
console.log('='.repeat(50));
console.log('DIRECT HEADER GENERATOR');
console.log('='.repeat(50) + '\n');

console.log('🚀 Generating headers for all templates...\n');

let successCount = 0;
let failedCount = 0;

templates.forEach(template => {
  try {
    const headerHtml = generateHeader(template);
    const filename = path.join(headersDir, `${template.id}-header.html`);
    fs.writeFileSync(filename, headerHtml);
    console.log(`✅ Generated header for ${template.id}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to generate header for ${template.id}:`, error.message);
    failedCount++;
  }
});

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