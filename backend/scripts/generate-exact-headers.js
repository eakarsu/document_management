const fs = require('fs');
const path = require('path');

// Template configurations matching AI generator service
const templates = [
  { id: 'af-manual', name: 'AIR FORCE MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE INSTRUCTION 36-2903', subject: 'DRESS AND PERSONAL APPEARANCE OF AIR FORCE PERSONNEL', category: 'PERSONNEL' },
  { id: 'afi', name: 'AIR FORCE INSTRUCTION', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE INSTRUCTION', subject: 'Official Guidance and Procedures', category: 'ADMINISTRATION' },
  { id: 'afpd', name: 'AIR FORCE POLICY DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE POLICY DIRECTIVE', subject: 'Policy and Strategic Direction', category: 'POLICY' },
  { id: 'afman', name: 'AIR FORCE MANUAL (AFMAN)', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE MANUAL', subject: 'Procedures and Guidelines', category: 'PROCEDURES' },
  { id: 'afjqs', name: 'AIR FORCE JOB QUALIFICATION STANDARD', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE JOB QUALIFICATION STANDARD', subject: 'Training and Qualification Requirements', category: 'TRAINING' },
  { id: 'afto', name: 'AIR FORCE TECHNICAL ORDER', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE TECHNICAL ORDER', subject: 'Technical Instructions and Specifications', category: 'TECHNICAL' },
  { id: 'afva', name: 'AIR FORCE VISUAL AID', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE VISUAL AID', subject: 'Visual Training Materials', category: 'TRAINING AIDS' },
  { id: 'afh', name: 'AIR FORCE HANDBOOK', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE HANDBOOK', subject: 'Reference Guide and Procedures', category: 'REFERENCE' },
  { id: 'afgm', name: 'AIR FORCE GUIDANCE MEMORANDUM', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE GUIDANCE MEMORANDUM', subject: 'Interim Guidance and Policy Updates', category: 'GUIDANCE' },
  { id: 'afmd', name: 'AIR FORCE MISSION DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'AIR FORCE MISSION DIRECTIVE', subject: 'Mission Requirements and Objectives', category: 'MISSION' },
  { id: 'dafi', name: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION', subject: 'Department-Wide Guidance', category: 'INSTRUCTION' },
  { id: 'dafman', name: 'DEPARTMENT OF THE AIR FORCE MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'DEPARTMENT OF THE AIR FORCE MANUAL', subject: 'Department Procedures', category: 'MANUAL' },
  { id: 'dafpd', name: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE', subject: 'Department Policy', category: 'POLICY' },
  { id: 'dodd', name: 'DEPARTMENT OF DEFENSE DIRECTIVE', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', documentType: 'DEPARTMENT OF DEFENSE DIRECTIVE', subject: 'Defense Policy and Procedures', category: 'DIRECTIVE' },
  { id: 'dodi', name: 'DEPARTMENT OF DEFENSE INSTRUCTION', org: 'DEPARTMENT OF DEFENSE', secretary: 'SECRETARY OF DEFENSE', documentType: 'DEPARTMENT OF DEFENSE INSTRUCTION', subject: 'Defense Implementation Guidance', category: 'INSTRUCTION' },
  { id: 'cjcs', name: 'CHAIRMAN JOINT CHIEFS OF STAFF INSTRUCTION', org: 'JOINT CHIEFS OF STAFF', secretary: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF', documentType: 'CJCS INSTRUCTION', subject: 'Joint Operations Guidance', category: 'JOINT OPS' },
  { id: 'army', name: 'ARMY REGULATION', org: 'DEPARTMENT OF THE ARMY', secretary: 'SECRETARY OF THE ARMY', documentType: 'ARMY REGULATION', subject: 'Army Policy and Procedures', category: 'REGULATION' },
  { id: 'navy', name: 'NAVY INSTRUCTION (OPNAVINST)', org: 'DEPARTMENT OF THE NAVY', secretary: 'SECRETARY OF THE NAVY', documentType: 'OPNAVINST', subject: 'Navy Operations and Administration', category: 'INSTRUCTION' },
  { id: 'marine', name: 'MARINE CORPS ORDER', org: 'UNITED STATES MARINE CORPS', secretary: 'COMMANDANT OF THE MARINE CORPS', documentType: 'MARINE CORPS ORDER', subject: 'Marine Corps Policy', category: 'ORDER' },
  { id: 'spaceforce', name: 'SPACE FORCE INSTRUCTION', org: 'UNITED STATES SPACE FORCE', secretary: 'CHIEF OF SPACE OPERATIONS', documentType: 'SPACE FORCE INSTRUCTION', subject: 'Space Operations Guidance', category: 'SPACE OPS' },
  { id: 'oplan', name: 'OPERATION PLAN', org: 'DEPARTMENT OF DEFENSE', secretary: 'COMBATANT COMMANDER', documentType: 'OPERATION PLAN', subject: 'Operational Planning', category: 'OPERATIONS' },
  { id: 'opord', name: 'OPERATION ORDER', org: 'DEPARTMENT OF DEFENSE', secretary: 'COMBATANT COMMANDER', documentType: 'OPERATION ORDER', subject: 'Operational Execution', category: 'OPERATIONS' },
  { id: 'conops', name: 'CONCEPT OF OPERATIONS', org: 'DEPARTMENT OF DEFENSE', secretary: 'OPERATIONAL COMMANDER', documentType: 'CONCEPT OF OPERATIONS', subject: 'Operational Concept Development', category: 'PLANNING' },
  { id: 'technical', name: 'TECHNICAL MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'TECHNICAL MANUAL', subject: 'Technical Documentation', category: 'TECHNICAL' },
  { id: 'policy', name: 'POLICY DOCUMENT', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'POLICY DOCUMENT', subject: 'Organizational Policy', category: 'POLICY' },
  { id: 'training', name: 'TRAINING MANUAL', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'SECRETARY OF THE AIR FORCE', documentType: 'TRAINING MANUAL', subject: 'Training and Education', category: 'TRAINING' },
  { id: 'sop', name: 'STANDARD OPERATING PROCEDURE', org: 'DEPARTMENT OF THE AIR FORCE', secretary: 'UNIT COMMANDER', documentType: 'STANDARD OPERATING PROCEDURE', subject: 'Standard Operating Procedures', category: 'PROCEDURES' }
];

// Create headers directory
const headersDir = path.join(__dirname, 'headers');
if (!fs.existsSync(headersDir)) {
  fs.mkdirSync(headersDir, { recursive: true });
  console.log('✅ Created headers directory');
}

// Function to get seal image path based on template
function getSealImage(template) {
  const sealMap = {
    'dodd': 'dod',
    'dodi': 'dod',
    'oplan': 'dod',
    'opord': 'dod',
    'conops': 'dod',
    'cjcs': 'joint-chiefs',
    'army': 'army',
    'navy': 'navy',
    'marine': 'marine-corps',
    'spaceforce': 'space-force'
  };

  return sealMap[template.id] || 'air-force';
}

// Function to generate header HTML matching AI generator service format
function generateHeader(template) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  const effectiveDate = currentDate;
  const reviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  const classification = 'UNCLASSIFIED';
  const sealType = getSealImage(template);

  // Generate HTML exactly as the AI generator service does
  return `<style>
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

  .classification-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    padding: 0.25rem;
    background-color: white;
    border-top: 1px solid #000;
  }

  .page-footer {
    position: fixed;
    bottom: 30px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 1in;
    font-size: 10pt;
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
    margin-bottom: 3rem;
  }

  .header-left {
    flex: 0 0 45%;
    text-align: center;
  }

  .header-right {
    flex: 0 0 50%;
    text-align: right;
  }

  .by-order {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .secretary {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .seal {
    width: 120px;
    height: 120px;
    margin: 0.5rem auto;
    display: block;
    border-radius: 50%;
  }

  .organization {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-bottom: 0.25rem;
  }

  .document-type {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .date {
    font-size: 10pt;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .subject {
    font-size: 10pt;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .category {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    text-transform: uppercase;
  }

  .compliance {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    text-transform: uppercase;
    margin: 2rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #000;
  }

  .info-section {
    display: flex;
    margin: 0.75rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #000;
    font-size: 10pt;
  }

  .section-label {
    font-weight: bold;
    margin-right: 2rem;
    min-width: 130px;
  }

  .section-content {
    flex: 1;
  }

  .footer-section {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #000;
    font-size: 10pt;
  }

  .opr {
    flex: 0 0 30%;
  }

  .certified {
    flex: 0 0 65%;
    text-align: right;
  }

  .supersedes-section {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 10pt;
  }

  .pages-only {
    text-align: right;
    margin-top: 0.5rem;
    font-size: 10pt;
  }

  .pages {
    float: right;
  }

  @page {
    size: 8.5in 11in;
    margin: 0;
  }

  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin: 2rem 0 1rem 0;
    text-transform: uppercase;
  }

  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  h4 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 0.8rem;
    margin-bottom: 0.4rem;
  }

  h5, h6 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 0.6rem;
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 11pt;
    margin-bottom: 10px;
    text-align: justify;
  }
</style>

<!-- Classification Header -->
<div class="classification-header">
  ${classification}
</div>

<div class="air-force-document-header">
  <div class="header-top">
    <div class="header-left">
      <div class="by-order">BY ORDER OF THE</div>
      <div class="secretary">${template.secretary}</div>
      <img src="/images/${sealType}-seal.png" alt="Official Seal" class="seal" />
    </div>
    <div class="header-right">
      <div class="organization">${template.org}</div>
      <div class="document-type">${template.documentType}</div>
      <div class="date">${currentDate}</div>
      <div class="subject">${template.subject}</div>
      <div class="category">${template.category}</div>
      <div style="font-size: 10pt;">Version 1.0</div>
    </div>
  </div>

  <div class="compliance">
    COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
  </div>

  <div class="info-section">
    <span class="section-label">DISTRIBUTION:</span>
    <span class="section-content">DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited</span>
  </div>

  <div class="info-section">
    <span class="section-label">ACCESSIBILITY:</span>
    <span class="section-content">Publications and forms are available on the e-Publishing website at <a href="http://www.e-publishing.af.mil" style="color: #0066CC;">http://www.e-publishing.af.mil</a>.</span>
  </div>

  <div class="info-section">
    <span class="section-label">RELEASABILITY:</span>
    <span class="section-content">There are no releasability restrictions on this publication.</span>
  </div>

  <div class="info-section">
    <span class="section-label">EFFECTIVE DATE:</span>
    <span class="section-content">${effectiveDate}</span>
    <span style="margin-left: 2rem;"><strong>REVIEW DATE:</strong> ${reviewDate}</span>
  </div>

  <div class="info-section">
    <span class="section-label">POC:</span>
    <span class="section-content">
      Lt Col Smith, John A.<br />
      DSN: 555-1234 | Commercial: (555) 555-1234<br />
      Email: john.a.smith@us.af.mil
    </span>
  </div>

  <div class="footer-section">
    <div class="opr">
      <span class="section-label">OPR:</span> SF/S5S
    </div>
    <div class="certified">
      Certified by: SF/S5/8<br />
      (Lt Gen Philip Garrant)
    </div>
  </div>

  <div class="pages-only">
    <span class="pages">Pages: 1</span>
  </div>
</div>

<!-- Page Footer Template -->
<div class="page-footer" style="display: none;">
  <span>${template.documentType}</span>
  <span>${effectiveDate}</span>
  <span>Page <span class="page-number">1</span> of 1</span>
</div>

<!-- Classification Footer -->
<div class="classification-footer">
  ${classification}
</div>`;
}

// Generate all headers
console.log('='.repeat(50));
console.log('EXACT HEADER GENERATOR');
console.log('='.repeat(50) + '\n');

console.log('🚀 Generating headers with exact AI generator format...\n');

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

// Generate metadata file for the headers
const metadata = {
  generated: new Date().toISOString(),
  templates: templates.map(t => ({
    id: t.id,
    name: t.name,
    organization: t.org,
    documentType: t.documentType,
    category: t.category
  }))
};

fs.writeFileSync(path.join(headersDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('\n' + '='.repeat(50));
console.log('📊 GENERATION COMPLETE!');
console.log('='.repeat(50));
console.log(`✅ Success: ${successCount} headers`);
console.log(`❌ Failed: ${failedCount} headers`);
console.log(`\n📁 Headers saved to: ${headersDir}`);
console.log('📝 Metadata file created: headers/metadata.json');
console.log('\n✨ Headers match exact AI generator format!');