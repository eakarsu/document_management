#!/usr/bin/env node

/**
 * Direct HTML Air Force Document Generator
 */

require('dotenv').config();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

// Call OpenRouter API
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

// Get Air Force seal as base64
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
  
  // Fallback SVG
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

// Generate comprehensive Air Force document
async function generateAirForceDocument() {
  console.log('🦅 Generating comprehensive 10-page Air Force Instruction...\n');
  
  const documentInfo = {
    instructionTitle: "AIR FORCE INSTRUCTION 90-201",
    date: "September 11, 2025",
    subject: "The Air Force Inspection System",
    responsibilities: "INSPECTOR GENERAL"
  };
  
  const prompt = `Generate a comprehensive 10-page Air Force Instruction document in HTML format.

Document Details:
- Title: ${documentInfo.instructionTitle}
- Subject: ${documentInfo.subject}
- Date: ${documentInfo.date}

CRITICAL REQUIREMENTS:

1. Generate EXACTLY 12,000+ words of detailed, professional Air Force content
2. Use hierarchical decimal numbering: 1. → 1.1. → 1.1.1. → 1.1.1.1.
3. Apply proper CSS indentation classes:
   - class="level-1" for major sections (1., 2., 3.)
   - class="level-2" for subsections (1.1., 1.2.)
   - class="level-3" for sub-subsections (1.1.1., 1.1.2.)
   - class="level-4" for further nesting (1.1.1.1., 1.1.1.2.)

4. Each paragraph must be 200-400 words with extensive detail
5. Include these major sections with deep subsections:
   - 1. OVERVIEW (with 1.1, 1.2, 1.3 subsections)
   - 2. RESPONSIBILITIES (with 2.1-2.4 covering different organizational levels)
   - 3. PROCEDURES (with 3.1-3.6 covering detailed processes)
   - 4. IMPLEMENTATION (with 4.1-4.3 covering rollout and compliance)
   - 5. TRAINING REQUIREMENTS (with 5.1-5.3)
   - 6. QUALITY ASSURANCE (with 6.1-6.4)
   - 7. REFERENCES AND ATTACHMENTS

6. Use authentic Air Force terminology and regulations
7. Include specific examples, scenarios, and implementation guidance
8. Write in formal military language with complete explanations

EXAMPLE STRUCTURE:
<h1>1. OVERVIEW</h1>
<p class="level-1">1.1. This Air Force Instruction (AFI) establishes comprehensive policies, procedures, and responsibilities for the Air Force Inspection System (AFIS). The AFIS serves as the primary means for evaluating unit effectiveness, ensuring compliance with applicable directives, and identifying areas requiring improvement or corrective action. This instruction applies to all Regular Air Force, Air Force Reserve, and Air National Guard units, personnel, and activities. The inspection system is designed to provide commanders at all levels with objective assessments of their organization's ability to accomplish assigned missions while maintaining the highest standards of safety, security, and operational effectiveness. Through systematic evaluation processes, the AFIS enables proactive identification and resolution of deficiencies before they impact mission capability or compromise safety standards.</p>

<p class="level-1">1.2. The Air Force Inspection System represents a fundamental shift from traditional compliance-focused inspections to a comprehensive assessment methodology that emphasizes continuous improvement and mission readiness. This transformation aligns with Air Force priorities of developing agile, adaptive, and resilient organizational capabilities that can respond effectively to dynamic operational environments. The AFIS incorporates risk-based assessment methodologies, leveraging both internal and external evaluation mechanisms to provide commanders with actionable intelligence regarding organizational strengths and improvement opportunities. By integrating inspection activities with daily operations, the system promotes a culture of self-assessment and continuous learning that enhances overall organizational effectiveness while reducing the administrative burden associated with traditional inspection processes.</p>

Generate comprehensive, detailed content for ALL sections with extensive subsections and proper CSS class formatting.`;

  const messages = [
    {
      role: 'system',
      content: `You are a senior Air Force technical writer creating comprehensive official military documentation. Generate authentic, extensively detailed content following Air Force publication standards. Use proper hierarchical numbering, extensive detail in each paragraph, and authentic military terminology. CRITICAL: Use proper CSS classes for indentation (level-1, level-2, level-3, level-4) and ensure each paragraph is 200-400 words with comprehensive coverage of Air Force inspection procedures, responsibilities, and implementation guidance.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const aiContent = await callOpenRouter(messages);
  
  // Generate complete HTML
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
    }
    
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 20px 0 10px 20px;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: bold;
      font-style: italic;
      margin: 15px 0 8px 40px;
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
    ${aiContent}
  </div>
</body>
</html>`;

  // Save to file
  const fs = require('fs');
  const filename = `AIR_FORCE_INSTRUCTION_90-201_${Date.now()}.html`;
  fs.writeFileSync(filename, completeHTML);
  
  console.log(`✅ Comprehensive Air Force Document Generated!`);
  console.log(`📁 File: ${filename}`);
  console.log(`📊 Size: ${(Buffer.byteLength(completeHTML, 'utf8') / 1024).toFixed(2)} KB`);
  console.log(`📄 Content Length: ~${aiContent.split(' ').length} words\n`);
}

// Run the generator
generateAirForceDocument().catch(console.error);