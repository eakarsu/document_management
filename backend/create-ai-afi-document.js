#!/usr/bin/env node

/**
 * AI-Enhanced Air Force Document Generator with Custom Headers
 * Generates Air Force documents with AI content and user-provided header information
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 AI-Enhanced Air Force Document Generator

Usage: node create-ai-afi-document.js <document-info-json> [options]

Arguments:
  document-info-json - JSON string with document header information

Options:
  --template <type>     - Document template: af-manual, technical, policy (default: af-manual)
  --pages <num>         - Number of pages to generate (default: 5)
  --feedbacks <num>     - Number of AI feedback items (default: 10)

Example:
  node create-ai-afi-document.js '{"instructionTitle":"AIR FORCE INSTRUCTION 36-2618","date":"March 15, 2024","subject":"The Enlisted Force Structure","responsibilities":"AIRMAN AND FAMILY READINESS","sealImagePath":"/uploads/seals/custom-seal.png"}'
  `);
  process.exit(0);
}

// Parse arguments
let documentInfo;
try {
  documentInfo = JSON.parse(args[0]);
} catch (error) {
  console.error('❌ Invalid JSON for document info');
  process.exit(1);
}

let options = {
  template: 'af-manual',
  pages: 5,
  feedbacks: 10
};

// Parse optional arguments
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  
  switch(flag) {
    case '--template':
      options.template = value;
      break;
    case '--pages':
      options.pages = parseInt(value) || 5;
      break;
    case '--feedbacks':
      options.feedbacks = parseInt(value) || 10;
      break;
  }
}

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

// Call OpenRouter API with proper token limits
async function callOpenRouter(messages, model = 'google/gemini-2.5-flash', maxTokens = 8000) {
  try {
    // Use Google Gemini 2.5 Flash for longer outputs with good quality
    // Gemini 2.5 Flash has excellent token limits for long documents
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
        max_tokens: maxTokens
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

// Get Air Force seal as base64 for embedding
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
  
  // Fallback SVG if image not available
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

// Generate Air Force header HTML
function generateAirForceHeader(documentInfo) {
  const {
    byOrderText = "BY ORDER OF THE",
    secretaryText = "SECRETARY OF THE AIR FORCE",
    sealImagePath = "",
    instructionTitle = "AIR FORCE INSTRUCTION",
    date = new Date().toLocaleDateString(),
    subject = "Document Subject",
    responsibilities = "RESPONSIBILITIES",
    complianceText = "COMPLIANCE WITH THIS PUBLICATION IS MANDATORY",
    opr = "SAF/IG",
    certifiedBy = "AF/CV (General Larry O. Spencer)",
    pages = 6
  } = documentInfo;

  // Use custom seal if provided, otherwise use embedded base64 image
  let sealHTML;
  if (sealImagePath && sealImagePath !== "/images/air-force-seal.png") {
    sealHTML = `<img src="${sealImagePath}" alt="Department of the Air Force Seal" class="seal" />`;
  } else {
    const base64Seal = getAirForceSealBase64();
    sealHTML = `<img src="${base64Seal}" alt="Department of the Air Force Seal" class="seal" />`;
  }

  return `
    <div class="air-force-document-header">
      <div class="header-section">
        <div class="left-section">
          <div class="by-order">${byOrderText}</div>
          <div class="secretary">${secretaryText}</div>
          ${sealHTML}
        </div>
        <div class="right-section">
          <div class="instruction-title">${instructionTitle}</div>
          <div class="date">${date}</div>
          <div class="subject">${subject}</div>
          <div class="responsibilities">${responsibilities}</div>
        </div>
      </div>
      
      <div class="compliance">${complianceText}</div>
      
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
          <span class="section-label">OPR:</span> ${opr}
        </div>
        <div class="certified">
          Certified by: ${certifiedBy}<br />
          Pages: ${pages}
        </div>
      </div>
      
      <div class="divider"></div>
    </div>
  `;
}

// Generate Air Force document with AI content
async function generateAIAirForceDocument(documentInfo, options) {
  console.log(`🤖 Generating ${options.pages} pages of Air Force ${options.template} content...`);
  
  // More realistic content targets
  // AI models can reliably generate 2000-3000 words per request
  // For 10 pages, we'll aim for quality over exact length
  const targetWords = Math.min(options.pages * 300, 3000); // Cap at 3000 words
  const paragraphsNeeded = Math.min(options.pages * 5, 30); // Cap at 30 paragraphs
  
  const prompt = `Generate exactly ${options.pages} pages of official Air Force ${options.template} document content in HTML format.

Document Context:
- Title: ${documentInfo.instructionTitle || 'Air Force Document'}
- Subject: ${documentInfo.subject || 'Military Operations'}
- Type: ${options.template}

CRITICAL LENGTH REQUIREMENTS:
- Total word count: ${targetWords} words (EXCLUDING HTML tags)
- Number of paragraphs: ${paragraphsNeeded} paragraphs
- Each paragraph: 100-150 words of detailed content
- This should result in approximately ${options.pages} standard pages when rendered

STRUCTURE REQUIREMENTS:
1. Create VALID HTML with proper military formatting
2. Use proper Air Force terminology and structure
3. Include realistic technical/procedural content appropriate for military use
4. Use <h1> for major sections, <h2> for subsections, <h3> for sub-subsections
5. WRAP ALL paragraph text in <p> tags
6. Use HIERARCHICAL DECIMAL NUMBERING: Major sections as "1.", subsections as "1.1.", sub-subsections as "1.1.1.", etc.
7. Follow official Air Force numbering schema: 1. → 1.1. → 1.1.1. → 1.1.1.1. (unlimited nesting)
8. Add realistic references, abbreviations, and terms sections
9. Include sections like: Overview, Responsibilities, Procedures, Implementation, Compliance, Training, Resources, References
10. Each paragraph MUST be substantive with extensive detail, examples, and explanations
11. Use CSS classes for proper indentation: class="level-1" for 1., class="level-2" for 1.1., class="level-3" for 1.1.1., etc.

CONTENT DENSITY:
- Every paragraph must contain specific procedures, requirements, or technical details
- Include specific examples, scenarios, and implementation guidance
- Add comprehensive lists, tables, and detailed explanations
- Expand on each point with military context and operational details
- DO NOT use filler content - every sentence must add value

Generate comprehensive, realistic Air Force documentation with the EXACT length specified above.`;

  const messages = [
    {
      role: 'system',
      content: `You are a professional Air Force technical writer creating official military documentation. 
      Generate authentic, detailed content that follows Air Force publication standards.
      Use proper military terminology, structure, and formatting.
      All content must be wrapped in proper HTML tags with <p> tags for all paragraphs.
      
      CRITICAL LENGTH REQUIREMENT: You MUST generate the EXACT amount of content requested.
      - This is a LONG-FORM document that requires extensive detail
      - Each paragraph MUST be 200-300 words minimum
      - DO NOT stop generating until you've created the full requested length
      - Include comprehensive details, examples, procedures, and explanations
      
      CRITICAL: Use hierarchical decimal numbering system:
      - Major sections: 1., 2., 3.
      - Subsections: 1.1., 1.2., 2.1., 2.2.
      - Sub-subsections: 1.1.1., 1.1.2., 1.2.1., 1.2.2.
      - Further nesting: 1.1.1.1., 1.1.1.2., etc.
      
      Example structure with proper indentation:
      <h1>1. OVERVIEW</h1>
      <p class="level-1">1.1. This Air Force Instruction establishes comprehensive policies and procedures for the management, implementation, and oversight of [subject matter]. The instruction provides detailed guidance for all personnel involved in these operations, ensuring standardization across all Air Force installations and units. This comprehensive framework addresses the full spectrum of activities, from initial planning and resource allocation through execution and continuous improvement. The policies outlined herein are designed to enhance operational effectiveness while maintaining the highest standards of safety, security, and compliance with all applicable regulations. All Air Force personnel, regardless of rank or position, must understand and adhere to these requirements to ensure mission success and maintain the integrity of our operations. This instruction supersedes all previous guidance and establishes new standards that reflect current best practices and lessons learned from recent operational experiences. The implementation of these policies requires coordinated effort across multiple organizational levels and functional areas, necessitating clear communication channels and well-defined responsibilities for all stakeholders involved in the process.</p>
      
      <h1>2. RESPONSIBILITIES</h1>
      <h2>2.1. Commanders</h2>
      <p class="level-2">2.1.1. Commanders at all levels are responsible for the complete implementation and enforcement of this instruction within their respective organizations. This includes establishing local procedures that align with the overarching framework while addressing unique mission requirements and operational constraints. Commanders must ensure that all personnel under their command receive appropriate training and have access to necessary resources for compliance. They are required to conduct regular assessments of their units' adherence to these policies and take corrective action when deficiencies are identified. Additionally, commanders must maintain comprehensive documentation of all activities related to this instruction, including training records, compliance assessments, and corrective action plans. They shall establish clear lines of authority and accountability, designating specific personnel to oversee various aspects of implementation. Commanders are also responsible for fostering a culture of continuous improvement, encouraging feedback from all levels of the organization, and implementing best practices identified through operational experience. Regular reporting to higher headquarters on the status of implementation and any challenges encountered is mandatory, with detailed metrics and analysis provided to support decision-making at all command levels.</p>
      
      CONTENT REQUIREMENTS:
      - Each paragraph must be 200-300+ words with extensive operational detail
      - Include specific procedures, requirements, timelines, and metrics
      - Reference specific Air Force regulations, forms, and processes
      - Provide detailed examples and scenarios
      - Include comprehensive lists and tables where appropriate
      - Write in formal military language with complete explanations
      - Create realistic implementation guidance with step-by-step procedures
      - Add extensive coverage of all aspects of the topic`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Single API call - realistic generation
  console.log(`📄 Generating document with ${paragraphsNeeded} paragraphs (${targetWords} words)...`);
  
  const singlePrompt = `Create an Air Force ${options.template} document with the following specifications:

Title: ${documentInfo.instructionTitle || 'Air Force Document'}
Subject: ${documentInfo.subject || 'Military Operations'}

Generate ${paragraphsNeeded} substantive paragraphs organized into these sections:

1. OVERVIEW (${Math.floor(paragraphsNeeded * 0.2)} paragraphs)
2. RESPONSIBILITIES (${Math.floor(paragraphsNeeded * 0.2)} paragraphs)
3. PROCEDURES (${Math.floor(paragraphsNeeded * 0.3)} paragraphs)
4. IMPLEMENTATION (${Math.floor(paragraphsNeeded * 0.2)} paragraphs)
5. COMPLIANCE AND REFERENCES (${Math.floor(paragraphsNeeded * 0.1)} paragraphs)

Requirements:
- Each paragraph should be 100-150 words of detailed military content
- Use proper HTML tags: <h1> for sections, <h2> for subsections, <p> for paragraphs
- Include hierarchical numbering (1., 1.1., 1.1.1.)
- Add CSS classes for indentation: class="level-1", class="level-2", etc.
- Use formal Air Force terminology and structure
- Include specific procedures, regulations, and requirements
- Write actual substantive content - no placeholders or "content continues" messages

Generate the complete document now:`;
  
  const singleMessages = [
    {
      role: 'system',
      content: 'You are an Air Force technical writer. Generate complete, detailed military documentation. Write all content - do not use placeholders or ask for confirmation.'
    },
    {
      role: 'user',
      content: singlePrompt
    }
  ];
  
  // Use Claude 3.5 Sonnet for better quality
  const model = 'anthropic/claude-3.5-sonnet';
  const maxTokens = 8000; // Reasonable limit
  
  console.log(`🚀 Making single API call to ${model}...`);
  const content = await callOpenRouter(singleMessages, model, maxTokens);
  
  // Parse content for feedback generation
  const paragraphMap = {};
  const lines = content.split('\n');
  let paragraphCount = 0;
  
  lines.forEach(line => {
    // Match paragraphs with or without classes
    const pMatch = line.match(/<p[^>]*>([^<]+)<\/p>/);
    if (pMatch) {
      paragraphCount++;
      const paragraphNum = `${Math.floor(paragraphCount / 5) + 1}.${((paragraphCount - 1) % 5) + 1}.${paragraphCount}`;
      paragraphMap[paragraphNum] = pMatch[1].trim();
    }
  });
  
  return { content, paragraphMap };
}

// Generate AI feedback for Air Force documents
async function generateAirForceFeedback(paragraphMap, count, documentInfo) {
  if (Object.keys(paragraphMap).length === 0 || count === 0) {
    return [];
  }
  
  const paragraphEntries = Object.entries(paragraphMap).slice(0, count);
  
  console.log(`🔍 Generating ${count} professional Air Force document feedback items...`);
  
  const prompt = `Review this Air Force document content and provide ${count} professional military editorial feedback items.

Document: ${documentInfo.instructionTitle || 'Air Force Document'}
Subject: ${documentInfo.subject || 'Military Operations'}

Content to review:
${paragraphEntries.map(([num, text]) => `[${num}]: ${text}`).join('\n\n')}

Provide ${count} feedback items in JSON format. For each item:
1. Find specific text that could be improved for military clarity/precision
2. Provide a complete rewrite (not just additions)
3. Focus on: military terminology, clarity, compliance, precision, professional tone

JSON format:
[
  {
    "paragraphNumber": "1.1.1",
    "originalPhrase": "exact text from content above",
    "improvedPhrase": "complete professional rewrite",
    "justification": "military/technical reason for improvement"
  }
]

Focus on improvements for:
- Military terminology precision
- Compliance language clarity
- Technical accuracy
- Professional Air Force writing standards`;

  const messages = [
    {
      role: 'system',
      content: 'You are a senior Air Force editor reviewing official publications for accuracy, clarity, and compliance with military writing standards.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(messages);
  
  let feedbackItems = [];
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      feedbackItems = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn('Using fallback feedback generation');
    // Fallback feedback
    feedbackItems = paragraphEntries.slice(0, count).map(([num, text], i) => ({
      paragraphNumber: num,
      originalPhrase: text.substring(0, 100),
      improvedPhrase: text.substring(0, 100).replace(/is designed to/g, 'will').replace(/utilizes/g, 'uses'),
      justification: 'Improve clarity and conciseness per Air Force writing standards'
    }));
  }
  
  // Format for database
  const feedbackTypes = ['Substantive (Important)', 'Administrative', 'Technical', 'Compliance'];
  const components = ['Technical Review', 'Legal Review', 'Editorial Review', 'OPR Review'];
  const pocNames = ['Col Anderson', 'Maj Williams', 'Capt Davis', 'Lt Martinez'];
  const pocPhones = ['555-0201', '555-0202', '555-0203', '555-0204'];
  const pocEmails = ['anderson.j@af.mil', 'williams.m@af.mil', 'davis.k@af.mil', 'martinez.r@af.mil'];
  
  return feedbackItems.slice(0, count).map((item, i) => ({
    id: `fb_af_${Date.now()}_${i+1}`,
    type: feedbackTypes[i % feedbackTypes.length],
    component: components[i % components.length],
    pocName: pocNames[i % pocNames.length],
    pocPhone: pocPhones[i % pocPhones.length],
    pocEmail: pocEmails[i % pocEmails.length],
    page: Math.floor(i / 3) + 1,
    paragraphNumber: item.paragraphNumber,
    lineNumber: 10 + (i * 5),
    changeFrom: item.originalPhrase,
    changeTo: item.improvedPhrase,
    coordinatorComment: 'Professional Air Force editorial improvement',
    coordinatorJustification: item.justification,
    status: 'pending',
    accepted: false
  }));
}

// Generate complete Air Force document HTML
function generateCompleteAirForceHTML(documentInfo, aiContent, options) {
  const headerHTML = generateAirForceHeader(documentInfo);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentInfo.instructionTitle || 'Air Force Document'}</title>
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
    
    ul, ol {
      margin: 12px 0 12px 40px;
    }
    
    li {
      margin: 8px 0;
    }
    
    .numbered-para {
      margin-left: 20px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    
    .warning {
      background-color: #fff3cd;
      border: 2px solid #856404;
      padding: 10px;
      margin: 15px 0;
      font-weight: bold;
    }
    
    .caution {
      background-color: #f8d7da;
      border: 2px solid #721c24;
      padding: 10px;
      margin: 15px 0;
      font-weight: bold;
    }
    
    @media print {
      body { background: white; }
      .air-force-document-header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  ${headerHTML}
  
  <div class="document-content">
    ${aiContent}
  </div>
</body>
</html>
  `;
}

// Main function
async function createAIAirForceDocument() {
  console.log('\n🦅 AI-Enhanced Air Force Document Generator\n');
  console.log(`Document: ${documentInfo.instructionTitle || 'Air Force Document'}`);
  console.log(`Subject: ${documentInfo.subject || 'Subject'}`);
  console.log(`Template: ${options.template}`);
  console.log(`Pages: ${options.pages}`);
  console.log(`AI Feedback Items: ${options.feedbacks}\n`);
  
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    // Generate AI content
    const { content: aiContent, paragraphMap } = await generateAIAirForceDocument(documentInfo, options);
    console.log(`✅ Generated ${Object.keys(paragraphMap).length} paragraphs of content`);
    
    // Generate AI feedback
    const feedbackItems = await generateAirForceFeedback(paragraphMap, options.feedbacks, documentInfo);
    console.log(`✅ Generated ${feedbackItems.length} professional feedback items`);
    
    // Generate complete HTML
    const completeHTML = generateCompleteAirForceHTML(documentInfo, aiContent, options);
    
    // Create document
    const documentId = `af_ai_${options.template}_${Math.random().toString(36).substring(2, 10)}`;
    const title = `${documentInfo.instructionTitle || 'Air Force Document'} - ${documentInfo.subject || 'AI Generated'}`;
    const fileSize = Buffer.byteLength(completeHTML, 'utf8');
    const checksum = crypto.createHash('md5').update(completeHTML).digest('hex');
    
    // Add documentId to feedback items
    feedbackItems.forEach(item => {
      item.documentId = documentId;
    });
    
    console.log('💾 Saving Air Force document to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: `${documentId}.html`,
        originalName: `air_force_${options.template}_document.html`,
        mimeType: 'text/html',
        fileSize: fileSize,
        checksum: checksum,
        storagePath: `uploads/${documentId}.html`,
        category: 'Air Force Document',
        status: 'DRAFT',
        createdBy: {
          connect: { id: user.id }
        },
        organization: {
          connect: { id: user.organizationId }
        },
        customFields: {
          content: completeHTML,
          draftFeedback: feedbackItems,
          template: options.template,
          pages: options.pages,
          documentInfo: documentInfo,
          aiGenerated: true,
          createdVia: 'ai-air-force-generator',
          paragraphMap: paragraphMap,
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'ai-air-force-generator',
            model: 'anthropic/claude-3-haiku',
            totalParagraphs: Object.keys(paragraphMap).length,
            totalFeedback: feedbackItems.length,
            documentType: 'Air Force Document'
          }
        }
      }
    });

    const sizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('\n✅ AI Air Force Document Created Successfully!\n');
    console.log(`📄 Document Details:`);
    console.log(`  ID: ${documentId}`);
    console.log(`  Title: ${title}`);
    console.log(`  Size: ${sizeKB} KB`);
    console.log(`  Pages: ${options.pages}`);
    console.log(`  Paragraphs: ${Object.keys(paragraphMap).length}`);
    console.log(`  Feedback Items: ${feedbackItems.length}`);
    console.log(`  Template: ${options.template}`);
    
    console.log('\n🔗 Access URLs:');
    console.log(`  View: http://localhost:3000/documents/${documentId}`);
    console.log(`  Edit: http://localhost:3000/editor/${documentId}`);
    console.log(`  Review: http://localhost:3000/documents/${documentId}/opr-review\n`);
    
    await prisma.$disconnect();
    return { id: documentId, title, pages: options.pages, feedbackCount: feedbackItems.length };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAIAirForceDocument();
} else {
  module.exports = createAIAirForceDocument;
}