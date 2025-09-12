#!/usr/bin/env node

/**
 * Air Force Instruction (AFI) Document Generator
 * Creates documents in official Air Force format with seal and proper structure
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
📄 Air Force Instruction Document Generator

Usage: node create-afi-document.js <instruction-number> [options]

Arguments:
  instruction-number - AFI number (e.g., "1-2", "36-2903", "91-203")

Options:
  --date <date>          - Publication date (default: today)
  --title <title>        - Document title (default: "Air Force Culture")
  --subtitle <subtitle>  - Document subtitle (default: "COMMANDER'S RESPONSIBILITIES")
  --opr <opr>           - Office of Primary Responsibility (default: "SAF/IG")
  --certifier <name>    - Certifying official (default: "AF/CV (General Larry O. Spencer)")
  --pages <num>         - Number of pages (default: 6)
  --content <type>      - Content type: standard, technical, policy (default: standard)

Examples:
  node create-afi-document.js 1-2
  node create-afi-document.js 36-2903 --title "Dress and Personal Appearance" --pages 120
  node create-afi-document.js 91-203 --title "Air Force Safety Programs" --opr "AF/SE"
  `);
  process.exit(0);
}

// Parse arguments
const instructionNumber = args[0];
let options = {
  date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
  title: 'Air Force Culture',
  subtitle: "COMMANDER'S RESPONSIBILITIES",
  opr: 'SAF/IG',
  certifier: 'AF/CV (General Larry O. Spencer)',
  pages: 6,
  contentType: 'standard'
};

// Parse optional arguments
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  
  switch(flag) {
    case '--date':
      options.date = value;
      break;
    case '--title':
      options.title = value;
      break;
    case '--subtitle':
      options.subtitle = value;
      break;
    case '--opr':
      options.opr = value;
      break;
    case '--certifier':
      options.certifier = value;
      break;
    case '--pages':
      options.pages = parseInt(value) || 6;
      break;
    case '--content':
      options.contentType = value;
      break;
  }
}

// Air Force seal SVG (simplified representation)
const AF_SEAL_SVG = `<svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
  <circle cx="75" cy="75" r="70" fill="none" stroke="#000" stroke-width="2"/>
  <circle cx="75" cy="75" r="65" fill="none" stroke="#000" stroke-width="1"/>
  <text x="75" y="30" text-anchor="middle" font-size="10" font-weight="bold">DEPARTMENT OF THE AIR</text>
  <text x="75" y="130" text-anchor="middle" font-size="10" font-weight="bold">FORCE</text>
  <text x="75" y="120" text-anchor="middle" font-size="8">UNITED STATES OF AMERICA</text>
  <text x="75" y="20" text-anchor="middle" font-size="8">★ ★ ★ ★ ★</text>
  <text x="75" y="140" text-anchor="middle" font-size="8">★ ★ ★ ★ ★</text>
  <text x="75" y="75" text-anchor="middle" font-size="24" font-weight="bold">🦅</text>
  <text x="75" y="95" text-anchor="middle" font-size="8">MCMXLVII</text>
</svg>`;

// Generate AFI document content
function generateAFIContent(instructionNumber, options) {
  let content = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 1in;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .left-header {
      flex: 1;
    }
    .right-header {
      text-align: right;
      flex: 1;
    }
    .seal-container {
      text-align: center;
      margin: 20px 0;
    }
    .seal {
      width: 150px;
      height: 150px;
      display: inline-block;
    }
    .by-order {
      font-style: italic;
      font-weight: bold;
      font-size: 14pt;
    }
    .secretary-line {
      font-style: italic;
      font-weight: bold;
      font-size: 14pt;
    }
    .afi-number {
      font-weight: bold;
      font-size: 14pt;
    }
    .date {
      font-weight: bold;
      font-size: 12pt;
    }
    .title {
      font-style: italic;
      font-size: 14pt;
      margin: 10px 0;
    }
    .subtitle {
      font-weight: bold;
      font-size: 16pt;
      text-align: center;
      margin: 20px 0;
    }
    .compliance {
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
      font-size: 14pt;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .footer-info {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid black;
    }
    h1 {
      font-size: 14pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 15px 0 10px 20px;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      font-style: italic;
      margin: 10px 0 5px 40px;
    }
    p {
      margin: 10px 0;
      text-align: justify;
    }
    .numbered-para {
      margin-left: 20px;
    }
    ul, ol {
      margin: 10px 0 10px 40px;
    }
    li {
      margin: 5px 0;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="left-header">
        <div class="by-order">BY ORDER OF THE</div>
        <div class="secretary-line">SECRETARY OF THE AIR FORCE</div>
        <div class="seal-container">
          ${AF_SEAL_SVG}
        </div>
      </div>
      <div class="right-header">
        <div class="afi-number">AIR FORCE INSTRUCTION ${instructionNumber}</div>
        <div class="date">${options.date}</div>
        <div class="title">${options.title}</div>
      </div>
    </div>
    
    <div class="subtitle">${options.subtitle}</div>
    
    <div class="compliance">COMPLIANCE WITH THIS PUBLICATION IS MANDATORY</div>
    
    <hr style="border: 1px solid black; margin: 20px 0;">
    
    <div class="section">
      <div class="section-title">ACCESSIBILITY:</div>
      <p>This publication is available for downloading from the e-Publishing website at <a href="www.e-publishing.af.mil">www.e-publishing.af.mil</a>.</p>
    </div>
    
    <div class="section">
      <div class="section-title">RELEASABILITY:</div>
      <p>There are no releasability restrictions on this publication.</p>
    </div>
    
    <hr style="border: 1px solid black; margin: 20px 0;">
    
    <div class="footer-info">
      <div>OPR: ${options.opr}</div>
      <div>Certified by: ${options.certifier}</div>
    </div>
    <div style="text-align: right; margin-top: 10px;">Pages: ${options.pages}</div>
    
    <hr style="border: 1px solid black; margin: 20px 0;">
`;

  // Add main content based on content type
  content += generateMainContent(options.contentType, options);
  
  content += `
  </div>
</body>
</html>`;

  return content;
}

// Generate main content based on type
function generateMainContent(contentType, options) {
  let mainContent = '';
  
  if (contentType === 'technical') {
    mainContent = `
    <h1>1. OVERVIEW</h1>
    <p class="numbered-para">1.1. This instruction implements Air Force Policy Directive (AFPD) ${options.opr.split('/')[0]}-1, providing guidance and procedures for Air Force personnel. It establishes responsibilities, standards, and procedures to ensure consistent implementation across all Air Force organizations.</p>
    
    <p class="numbered-para">1.2. This instruction applies to all Air Force military and civilian personnel, including Air National Guard (ANG) and Air Force Reserve Command (AFRC) units and members.</p>
    
    <h1>2. RESPONSIBILITIES</h1>
    
    <h2>2.1. Secretary of the Air Force (SAF):</h2>
    <p class="numbered-para">2.1.1. Establishes policy and provides oversight for implementation of this instruction.</p>
    <p class="numbered-para">2.1.2. Ensures adequate resources are allocated to support program requirements.</p>
    
    <h2>2.2. Chief of Staff of the Air Force (CSAF):</h2>
    <p class="numbered-para">2.2.1. Implements Secretary of the Air Force policies and directives.</p>
    <p class="numbered-para">2.2.2. Ensures compliance with this instruction throughout the Air Force.</p>
    
    <h2>2.3. Major Command (MAJCOM) Commanders:</h2>
    <p class="numbered-para">2.3.1. Implement this instruction within their commands.</p>
    <p class="numbered-para">2.3.2. Establish supplemental guidance as necessary, consistent with this instruction.</p>
    <p class="numbered-para">2.3.3. Monitor compliance and report metrics as required.</p>
    
    <h1>3. PROCEDURES</h1>
    
    <h2>3.1. Implementation Requirements:</h2>
    <p class="numbered-para">3.1.1. Units will establish local operating instructions (LOIs) to implement the requirements of this instruction within 90 days of publication.</p>
    <p class="numbered-para">3.1.2. Training programs will be developed and implemented to ensure all personnel understand their responsibilities.</p>
    
    <h2>3.2. Compliance and Reporting:</h2>
    <p class="numbered-para">3.2.1. Compliance with this instruction is mandatory and will be evaluated during inspections.</p>
    <p class="numbered-para">3.2.2. Units will maintain records and documentation as specified in the Air Force Records Disposition Schedule.</p>
    `;
  } else if (contentType === 'policy') {
    mainContent = `
    <h1>1. PURPOSE</h1>
    <p>This instruction establishes Air Force policy regarding ${options.title.toLowerCase()}. It provides comprehensive guidance to ensure standardized implementation across all Air Force installations and organizations.</p>
    
    <h1>2. APPLICABILITY</h1>
    <p>This instruction applies to all Regular Air Force, Air National Guard, and Air Force Reserve personnel, including civilian employees and contractors when specified.</p>
    
    <h1>3. POLICY</h1>
    
    <h2>3.1. General Policy:</h2>
    <p class="numbered-para">3.1.1. The Air Force is committed to maintaining the highest standards of ${options.title.toLowerCase()}.</p>
    <p class="numbered-para">3.1.2. All personnel will comply with the requirements established in this instruction.</p>
    <p class="numbered-para">3.1.3. Commanders at all levels are responsible for enforcement and compliance.</p>
    
    <h2>3.2. Specific Requirements:</h2>
    <p class="numbered-para">3.2.1. Personnel will receive initial and recurring training on the policies contained in this instruction.</p>
    <p class="numbered-para">3.2.2. Documentation will be maintained in accordance with applicable records management directives.</p>
    
    <h1>4. ROLES AND RESPONSIBILITIES</h1>
    
    <h2>4.1. Installation Commanders:</h2>
    <ul>
      <li>Ensure implementation of this instruction at their installations</li>
      <li>Appoint qualified personnel to manage program requirements</li>
      <li>Conduct periodic reviews to ensure compliance</li>
    </ul>
    
    <h2>4.2. Unit Commanders:</h2>
    <ul>
      <li>Implement procedures within their units</li>
      <li>Ensure personnel are properly trained</li>
      <li>Maintain required documentation</li>
    </ul>
    `;
  } else {
    // Standard content
    mainContent = `
    <p>This instruction provides guidance on ${options.title.toLowerCase()} and ${options.subtitle.toLowerCase()}. It establishes the framework for ensuring effective leadership and maintaining Air Force standards of excellence.</p>
    
    <h1>1. COMMANDER'S INTENT</h1>
    <p>Commanders at all levels will foster a culture of dignity and respect, ensuring all Airmen are treated fairly and are able to serve in an environment free from harassment, discrimination, and retaliation. This culture enables the Air Force to recruit, develop, and retain a highly qualified and diverse force.</p>
    
    <h1>2. LEADERSHIP RESPONSIBILITIES</h1>
    
    <p class="numbered-para">2.1. <strong>Set the Example.</strong> Leaders at all levels must exemplify Air Force Core Values and standards. Personal conduct must be above reproach, serving as a model for others to emulate.</p>
    
    <p class="numbered-para">2.2. <strong>Establish Clear Standards.</strong> Commanders will establish and communicate clear standards of conduct and performance. These standards must align with Air Force instructions and core values.</p>
    
    <p class="numbered-para">2.3. <strong>Foster Open Communication.</strong> Create an environment where Airmen feel comfortable raising concerns without fear of reprisal. Maintain an open-door policy and actively engage with unit members.</p>
    
    <h1>3. CREATING A POSITIVE COMMAND CLIMATE</h1>
    
    <h2>3.1. Assessment and Feedback:</h2>
    <p>Commanders will regularly assess their command climate through surveys, sensing sessions, and direct engagement with unit members. Feedback mechanisms must be accessible and responsive.</p>
    
    <h2>3.2. Professional Development:</h2>
    <p>Invest in the professional development of all Airmen. Provide mentorship, training opportunities, and career guidance to help each individual reach their full potential.</p>
    
    <h2>3.3. Recognition and Accountability:</h2>
    <p>Recognize outstanding performance and contributions. Hold individuals accountable for substandard performance or misconduct in a fair and consistent manner.</p>
    
    <h1>4. IMPLEMENTATION</h1>
    
    <p>Units will develop local procedures to implement the requirements of this instruction. These procedures must be documented and communicated to all personnel within 60 days of publication.</p>
    `;
  }
  
  // Add attachment section
  mainContent += `
    <div class="page-break"></div>
    
    <h1>Attachment 1</h1>
    <h2>GLOSSARY OF REFERENCES AND SUPPORTING INFORMATION</h2>
    
    <h3>References</h3>
    <ul>
      <li>AFPD 1, Air Force Culture</li>
      <li>AFI 1-1, Air Force Standards</li>
      <li>AFI 36-2618, The Enlisted Force Structure</li>
      <li>AFI 36-2903, Dress and Personal Appearance of Air Force Personnel</li>
      <li>AFMAN 33-363, Management of Records</li>
    </ul>
    
    <h3>Abbreviations and Acronyms</h3>
    <ul>
      <li><strong>AF</strong>—Air Force</li>
      <li><strong>AFI</strong>—Air Force Instruction</li>
      <li><strong>AFPD</strong>—Air Force Policy Directive</li>
      <li><strong>AFRC</strong>—Air Force Reserve Command</li>
      <li><strong>ANG</strong>—Air National Guard</li>
      <li><strong>CSAF</strong>—Chief of Staff of the Air Force</li>
      <li><strong>MAJCOM</strong>—Major Command</li>
      <li><strong>OPR</strong>—Office of Primary Responsibility</li>
      <li><strong>SAF</strong>—Secretary of the Air Force</li>
    </ul>
    
    <h3>Terms</h3>
    <ul>
      <li><strong>Commander</strong>—An individual in a command position at any level.</li>
      <li><strong>Compliance</strong>—Conformity in fulfilling official requirements.</li>
      <li><strong>Publication</strong>—An officially produced, published, and distributed document.</li>
    </ul>
  `;
  
  return mainContent;
}

// Main function
async function createAFIDocument() {
  console.log('\n🦅 Air Force Instruction Document Generator\n');
  console.log(`Creating AFI ${instructionNumber}`);
  console.log(`Title: ${options.title}`);
  console.log(`Date: ${options.date}`);
  console.log(`OPR: ${options.opr}\n`);
  
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    // Generate document content
    console.log('📄 Generating AFI document...');
    const htmlContent = generateAFIContent(instructionNumber, options);
    
    // Create document ID
    const documentId = `afi_${instructionNumber.replace('-', '_')}_${Date.now()}`;
    const title = `AFI ${instructionNumber} - ${options.title}`;
    const fileName = `AFI_${instructionNumber}_${options.date.replace(/\s+/g, '_')}.html`;
    
    // Calculate file size and checksum
    const fileSize = Buffer.byteLength(htmlContent, 'utf8');
    const checksum = crypto.createHash('md5').update(htmlContent).digest('hex');
    
    // Save to database
    console.log('💾 Saving to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: fileName,
        originalName: fileName,
        mimeType: 'text/html',
        fileSize: fileSize,
        checksum: checksum,
        storagePath: `uploads/${documentId}.html`,
        category: 'Air Force Instruction',
        status: 'APPROVED',
        createdBy: {
          connect: { id: user.id }
        },
        organization: {
          connect: { id: user.organizationId }
        },
        customFields: {
          content: htmlContent,
          afiNumber: instructionNumber,
          publicationDate: options.date,
          opr: options.opr,
          certifier: options.certifier,
          subtitle: options.subtitle,
          pages: options.pages,
          documentType: 'AFI',
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'afi-document-generator',
            version: '1.0',
            classification: 'UNCLASSIFIED',
            distribution: 'UNLIMITED'
          }
        }
      }
    });
    
    const sizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('\n✅ AFI Document Created Successfully!\n');
    console.log(`📋 Document Details:`);
    console.log(`  AFI Number: ${instructionNumber}`);
    console.log(`  Title: ${title}`);
    console.log(`  ID: ${documentId}`);
    console.log(`  Size: ${sizeKB} KB`);
    console.log(`  Pages: ${options.pages}`);
    console.log(`  OPR: ${options.opr}`);
    console.log(`  Certified by: ${options.certifier}`);
    
    console.log('\n🔗 Access URLs:');
    console.log(`  View: http://localhost:3000/documents/${documentId}`);
    console.log(`  Edit: http://localhost:3000/editor/${documentId}`);
    console.log(`  Download: http://localhost:3000/api/documents/${documentId}/download\n`);
    
    await prisma.$disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAFIDocument();
} else {
  module.exports = createAFIDocument;
}