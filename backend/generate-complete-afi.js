#!/usr/bin/env node

/**
 * Complete 10-Page Air Force Document Generator
 */

require('dotenv').config();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

// Call OpenRouter API with longer content
async function callOpenRouter(messages, model = 'anthropic/claude-3.5-sonnet') {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AF Document Generator'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

// Generate section by section
async function generateSection(sectionNumber, sectionTitle, requirements) {
  console.log(`📝 Generating Section ${sectionNumber}: ${sectionTitle}...`);
  
  const prompt = `Generate ONLY Section ${sectionNumber} of an Air Force Instruction document.

Section: ${sectionNumber}. ${sectionTitle}

Requirements:
${requirements}

CRITICAL FORMATTING:
- Start with: <h1>${sectionNumber}. ${sectionTitle.toUpperCase()}</h1>
- Use hierarchical numbering: ${sectionNumber}.1., ${sectionNumber}.1.1., ${sectionNumber}.1.1.1., etc.
- Apply CSS classes: class="level-1", class="level-2", class="level-3", class="level-4"
- Each paragraph must be 200-400 words
- Use authentic Air Force terminology
- Generate 4-6 major subsections with detailed sub-subsections

EXAMPLE FORMAT:
<h1>${sectionNumber}. ${sectionTitle.toUpperCase()}</h1>
<p class="level-1">${sectionNumber}.1. [Detailed 200-400 word paragraph...]</p>
<p class="level-1">${sectionNumber}.2. [Detailed 200-400 word paragraph...]</p>
<h2>${sectionNumber}.3. Subsection Title</h2>
<p class="level-2">${sectionNumber}.3.1. [Detailed 200-400 word paragraph...]</p>
<p class="level-2">${sectionNumber}.3.2. [Detailed 200-400 word paragraph...]</p>

Generate comprehensive, detailed content for this section only.`;

  const messages = [
    {
      role: 'system',
      content: `You are a senior Air Force technical writer. Generate only the requested section with extensive detail, proper numbering, and CSS classes. Each paragraph must be 200-400 words with comprehensive Air Force content.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  return await callOpenRouter(messages);
}

// Get Air Force seal
function getAirForceSealBase64() {
  try {
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, '../frontend/public/images/air-force-seal.png');
    
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.warn('Could not load Air Force seal image:', error.message);
  }
  
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="60" cy="60" r="52" fill="none" stroke="#000" stroke-width="1"/>
      <text x="60" y="30" text-anchor="middle" font-size="8" font-weight="bold">DEPARTMENT</text>
      <text x="60" y="40" text-anchor="middle" font-size="8" font-weight="bold">OF THE AIR FORCE</text>
      <text x="60" y="68" text-anchor="middle" font-size="28" fill="#000">🦅</text>
      <text x="60" y="85" text-anchor="middle" font-size="8" font-weight="bold">UNITED STATES</text>
      <text x="60" y="95" text-anchor="middle" font-size="8" font-weight="bold">OF AMERICA</text>
      <text x="60" y="25" text-anchor="middle" font-size="8" fill="#000">★ ★ ★</text>
      <text x="60" y="105" text-anchor="middle" font-size="8" fill="#000">★ ★ ★</text>
    </svg>
  `).toString('base64')}`;
}

// Generate complete document
async function generateCompleteDocument() {
  console.log('🦅 Generating Complete 10-Page Air Force Instruction...\n');
  
  const sections = [
    {
      number: 1,
      title: "OVERVIEW",
      requirements: "Establish the purpose, scope, and applicability of the Air Force Inspection System. Cover the authority, mission, and foundational principles. Include background, evolution, and strategic alignment with Air Force priorities."
    },
    {
      number: 2,
      title: "RESPONSIBILITIES",
      requirements: "Detail responsibilities for Secretary of the Air Force, Chief of Staff, Major Commands, Wings, Groups, Squadrons, and individual personnel. Cover oversight, implementation, compliance, and reporting requirements at each level."
    },
    {
      number: 3,
      title: "INSPECTION PROCEDURES",
      requirements: "Comprehensive procedures for planning, conducting, and reporting inspections. Cover preparation, execution, evaluation criteria, documentation, and follow-up actions. Include different types of inspections and assessment methodologies."
    },
    {
      number: 4,
      title: "TRAINING AND CERTIFICATION",
      requirements: "Training requirements for inspectors, unit personnel, and leadership. Cover certification processes, continuing education, qualification standards, and professional development requirements."
    },
    {
      number: 5,
      title: "QUALITY ASSURANCE AND IMPROVEMENT",
      requirements: "Quality assurance processes, metrics, continuous improvement, lessons learned integration, and best practices sharing. Cover feedback mechanisms and process refinement."
    },
    {
      number: 6,
      title: "COMPLIANCE AND CORRECTIVE ACTIONS",
      requirements: "Compliance monitoring, deficiency identification, corrective action processes, timeline requirements, verification procedures, and escalation protocols."
    },
    {
      number: 7,
      title: "REFERENCES AND ATTACHMENTS",
      requirements: "Comprehensive list of applicable regulations, directives, instructions, and supporting documentation. Include abbreviations, acronyms, and definitions of terms used throughout the instruction."
    }
  ];

  let allContent = '';
  
  // Generate each section
  for (const section of sections) {
    const sectionContent = await generateSection(section.number, section.title, section.requirements);
    allContent += sectionContent + '\n\n';
    
    // Add a small delay to avoid API limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const documentInfo = {
    instructionTitle: "AIR FORCE INSTRUCTION 90-201",
    date: "September 11, 2025",
    subject: "The Air Force Inspection System",
    responsibilities: "INSPECTOR GENERAL"
  };
  
  const sealBase64 = getAirForceSealBase64();
  
  const completeHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentInfo.instructionTitle}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
      background: white;
    }
    
    .air-force-document-header {
      max-width: 8.5in;
      margin: 0 auto 40px auto;
      padding: 20px;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    
    .left-section {
      flex: 1;
      text-align: center;
    }
    
    .right-section {
      flex: 1;
      text-align: right;
      font-style: italic;
    }
    
    .seal {
      width: 120px;
      height: 120px;
      margin: 10px auto;
      display: block;
    }
    
    .by-order, .secretary {
      font-weight: bold;
      font-size: 14pt;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .instruction-title {
      font-weight: bold;
      font-size: 14pt;
      margin-bottom: 5px;
    }
    
    .date {
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .subject {
      font-size: 12pt;
      font-style: italic;
      margin-bottom: 5px;
    }
    
    .responsibilities {
      font-weight: bold;
      font-size: 12pt;
      text-transform: uppercase;
    }
    
    .compliance {
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
      text-transform: uppercase;
      margin: 30px 0 20px 0;
      border-bottom: 2px solid black;
      padding-bottom: 10px;
    }
    
    .info-section {
      margin: 15px 0;
      font-size: 11pt;
    }
    
    .section-label {
      font-weight: bold;
      text-transform: uppercase;
      display: inline-block;
      width: 150px;
    }
    
    .section-content {
      display: inline;
    }
    
    .divider {
      border-bottom: 1px solid black;
      margin: 15px 0;
    }
    
    .footer-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 11pt;
    }
    
    .opr {
      font-weight: bold;
    }
    
    .certified {
      text-align: right;
    }
    
    .link {
      color: blue;
      text-decoration: underline;
    }
    
    .document-content {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 25px 0 15px 0;
      border-bottom: 1px solid black;
      padding-bottom: 5px;
      page-break-before: auto;
    }
    
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: bold;
      font-style: italic;
      margin: 15px 0 8px 0;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
      text-indent: 0px;
    }
    
    /* Air Force specific indentation levels */
    .level-1 { margin-left: 0px; }      /* 1. Major sections */
    .level-2 { margin-left: 20px; }     /* 1.1. Subsections */
    .level-3 { margin-left: 40px; }     /* 1.1.1. Sub-subsections */
    .level-4 { margin-left: 60px; }     /* 1.1.1.1. Sub-sub-subsections */
    .level-5 { margin-left: 80px; }     /* 1.1.1.1.1. Further nesting */
    
    @media print {
      body { background: white; }
      .air-force-document-header { page-break-after: avoid; }
      h1 { page-break-before: auto; }
    }
  </style>
</head>
<body>
  <div class="air-force-document-header">
    <div class="header-section">
      <div class="left-section">
        <div class="by-order">BY ORDER OF THE</div>
        <div class="secretary">SECRETARY OF THE AIR FORCE</div>
        <img src="${sealBase64}" alt="Department of the Air Force Seal" class="seal" />
      </div>
      <div class="right-section">
        <div class="instruction-title">${documentInfo.instructionTitle}</div>
        <div class="date">${documentInfo.date}</div>
        <div class="subject">${documentInfo.subject}</div>
        <div class="responsibilities">${documentInfo.responsibilities}</div>
      </div>
    </div>
    
    <div class="compliance">COMPLIANCE WITH THIS PUBLICATION IS MANDATORY</div>
    
    <div class="info-section">
      <span class="section-label">ACCESSIBILITY:</span>
      <span class="section-content">
        This publication is available for downloading from the e-Publishing website at 
        <a href="https://www.e-publishing.af.mil" class="link">www.e-publishing.af.mil</a>.
      </span>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-section">
      <span class="section-label">RELEASABILITY:</span>
      <span class="section-content">There are no releasability restrictions on this publication.</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer-section">
      <div class="opr">
        <span class="section-label">OPR:</span> SAF/IG
      </div>
      <div class="certified">
        Certified by: AF/CV (General David W. Allvin)<br />
        Pages: 10
      </div>
    </div>
    
    <div class="divider"></div>
  </div>
  
  <div class="document-content">
    ${allContent}
  </div>
</body>
</html>`;

  // Save to file
  const fs = require('fs');
  const filename = `COMPLETE_AIR_FORCE_INSTRUCTION_90-201_${Date.now()}.html`;
  fs.writeFileSync(filename, completeHTML);
  
  const wordCount = allContent.split(' ').length;
  
  console.log(`\n✅ COMPLETE 10-Page Air Force Document Generated!`);
  console.log(`📁 File: ${filename}`);
  console.log(`📊 Size: ${(Buffer.byteLength(completeHTML, 'utf8') / 1024).toFixed(2)} KB`);
  console.log(`📄 Content Length: ~${wordCount} words`);
  console.log(`📑 Sections: ${sections.length} major sections with detailed subsections\n`);
}

// Run the generator
generateCompleteDocument().catch(console.error);