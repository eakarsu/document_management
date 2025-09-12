#!/usr/bin/env node

/**
 * Long Document Generator with Continuation Strategy
 * Uses multiple API calls to generate complete 10-page documents
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help')) {
  console.log(`
📚 Long Document Generator with Continuation

Usage: node generate-long-document-with-continuation.js <document-info-json>

Example:
  node generate-long-document-with-continuation.js '{"instructionTitle":"AFI 36-2903","subject":"DRESS STANDARDS","pages":10}'
  `);
  process.exit(0);
}

let documentInfo;
try {
  documentInfo = JSON.parse(args[0]);
} catch (error) {
  console.error('❌ Invalid JSON');
  process.exit(1);
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Call OpenRouter API
async function callAPI(messages, model = 'anthropic/claude-3.5-sonnet') {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Long Document Generator'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000 // Optimal for getting substantial content
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Check if content indicates continuation is available
function needsContinuation(content) {
  const continuationPhrases = [
    'continue with',
    'would you like me to continue',
    'I can continue',
    'remaining sections',
    '[Note:',
    'I\'ll pause here',
    'Let me know if you',
    '...'
  ];
  
  const lastPart = content.slice(-500).toLowerCase();
  return continuationPhrases.some(phrase => lastPart.includes(phrase.toLowerCase()));
}

// Extract the actual content (remove continuation prompts)
function cleanContent(content) {
  // Remove common continuation phrases at the end
  const patterns = [
    /\[Note:.*?\]$/s,
    /\[I can continue.*?\]$/s,
    /Would you like me to continue.*?$/s,
    /I'll pause here.*?$/s,
    /Let me know if.*?$/s,
    /\.\.\.\s*$/
  ];
  
  let cleaned = content;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim();
}

// Generate document with continuation strategy
async function generateLongDocument() {
  console.log('🚀 Starting document generation with continuation strategy...');
  
  const sections = [
    { name: '1. OVERVIEW', paragraphs: 6 },
    { name: '2. RESPONSIBILITIES', paragraphs: 12 },
    { name: '3. PROCEDURES', paragraphs: 15 },
    { name: '4. IMPLEMENTATION', paragraphs: 10 },
    { name: '5. COMPLIANCE AND ENFORCEMENT', paragraphs: 8 },
    { name: '6. TRAINING REQUIREMENTS', paragraphs: 6 },
    { name: '7. REFERENCES AND RESOURCES', paragraphs: 5 }
  ];
  
  let fullContent = '';
  let totalParagraphs = 0;
  let apiCalls = 0;
  
  for (const section of sections) {
    console.log(`\n📝 Generating section: ${section.name}`);
    
    // Initial request for this section
    const initialPrompt = `Generate the "${section.name}" section for an Air Force document.

Title: ${documentInfo.instructionTitle}
Subject: ${documentInfo.subject}

Requirements for this section:
- Generate EXACTLY ${section.paragraphs} detailed paragraphs
- Each paragraph should be 120-180 words
- Use proper HTML formatting with <h1> for section title and <p> for paragraphs
- Include specific procedures, requirements, and military terminology
- Number paragraphs appropriately (e.g., 1.1, 1.2, etc.)

Begin generating the section now:`;

    let sectionContent = await callAPI([
      {
        role: 'system',
        content: 'You are an Air Force technical writer. Generate detailed, comprehensive content for military documents.'
      },
      {
        role: 'user',
        content: initialPrompt
      }
    ]);
    
    apiCalls++;
    console.log(`  ✓ API call ${apiCalls} completed`);
    
    // Check if continuation is needed
    while (needsContinuation(sectionContent)) {
      console.log(`  📋 Continuation detected, requesting more content...`);
      
      const continuationPrompt = `Continue generating the remaining paragraphs for the "${section.name}" section. 
      
Do not repeat what was already written. Continue from where you left off and complete all ${section.paragraphs} paragraphs.
Generate the remaining content now:`;

      const continuation = await callAPI([
        {
          role: 'system',
          content: 'Continue generating the document content. Do not repeat previous content.'
        },
        {
          role: 'assistant',
          content: sectionContent
        },
        {
          role: 'user',
          content: continuationPrompt
        }
      ]);
      
      apiCalls++;
      console.log(`  ✓ API call ${apiCalls} completed (continuation)`);
      
      // Append continuation to section content
      sectionContent += '\n\n' + continuation;
      
      // Safety check to prevent infinite loops
      if (apiCalls > 20) {
        console.log('  ⚠️ Maximum API calls reached, moving to next section');
        break;
      }
    }
    
    // Clean and add to full content
    const cleanedSection = cleanContent(sectionContent);
    fullContent += cleanedSection + '\n\n';
    
    // Count paragraphs in this section
    const paragraphCount = (cleanedSection.match(/<p[^>]*>/g) || []).length;
    totalParagraphs += paragraphCount;
    console.log(`  ✅ Section complete: ${paragraphCount} paragraphs generated`);
    
    // Small delay between sections to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Generation complete:`);
  console.log(`  - Total API calls: ${apiCalls}`);
  console.log(`  - Total paragraphs: ${totalParagraphs}`);
  
  return fullContent;
}

// Save the generated document
async function saveDocument(content) {
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in database');
  }
  
  const documentId = `long_doc_${Date.now()}`;
  
  // Get real Air Force seal PNG as base64
  let sealBase64;
  try {
    const fs = require('fs');
    const path = require('path');
    const sealPath = path.join(__dirname, '../frontend/public/images/air-force-seal.png');
    
    if (fs.existsSync(sealPath)) {
      const sealBuffer = fs.readFileSync(sealPath);
      sealBase64 = `data:image/png;base64,${sealBuffer.toString('base64')}`;
      console.log('  ✓ Using real Air Force seal PNG');
    } else {
      // Fallback to SVG if PNG not found
      sealBase64 = `data:image/svg+xml;base64,${Buffer.from(`
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
      console.log('  ⚠️ Using fallback SVG seal');
    }
  } catch (error) {
    console.log('  ⚠️ Error loading seal, using fallback SVG');
    // Fallback SVG
    sealBase64 = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="58" fill="none" stroke="#000" stroke-width="2"/>
        <text x="60" y="60" text-anchor="middle" font-size="24" fill="#000">SEAL</text>
      </svg>
    `).toString('base64')}`;
  }

  // Create full HTML document with proper Air Force header
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentInfo.instructionTitle} - ${documentInfo.subject}</title>
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
    
    p {
      margin: 12px 0;
      text-align: justify;
      text-indent: 0.5in;
    }
    
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
        <div class="instruction-title">${documentInfo.instructionTitle || 'AIR FORCE INSTRUCTION'}</div>
        <div class="date">${documentInfo.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="subject">${documentInfo.subject || 'Subject'}</div>
        <div class="responsibilities">${documentInfo.responsibilities || 'RESPONSIBILITIES'}</div>
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
        <span class="section-label">OPR:</span> ${documentInfo.opr || 'SAF/IG'}
      </div>
      <div class="certified">
        Certified by: ${documentInfo.certifiedBy || 'AF/CV (General Larry O. Spencer)'}<br />
        Pages: ${documentInfo.pages || '10'}
      </div>
    </div>
    
    <div class="divider"></div>
  </div>
  
  <div class="document-content">
    ${content}
</body>
</html>`;

  // Calculate statistics
  const paragraphs = (content.match(/<p[^>]*>/g) || []).length;
  const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w).length;
  const pages = Math.ceil(words / 500); // Approximate pages
  
  // Save to database
  await prisma.document.create({
    data: {
      id: documentId,
      title: `${documentInfo.instructionTitle} - ${documentInfo.subject}`,
      fileName: `${documentId}.html`,
      originalName: 'long_document.html',
      mimeType: 'text/html',
      fileSize: Buffer.byteLength(fullHTML, 'utf8'),
      checksum: crypto.createHash('md5').update(fullHTML).digest('hex'),
      storagePath: `uploads/${documentId}.html`,
      category: 'Air Force Document',
      status: 'DRAFT',
      createdBy: { connect: { id: user.id } },
      organization: { connect: { id: user.organizationId } },
      customFields: {
        content: fullHTML,
        paragraphs: paragraphs,
        words: words,
        estimatedPages: pages,
        generationMethod: 'continuation-strategy'
      }
    }
  });

  // Save to file for inspection
  require('fs').writeFileSync('long_document_output.html', fullHTML);
  
  console.log(`\n✅ Document saved successfully!`);
  console.log(`📄 Document ID: ${documentId}`);
  console.log(`📊 Statistics:`);
  console.log(`  - Paragraphs: ${paragraphs}`);
  console.log(`  - Words: ${words}`);
  console.log(`  - Estimated pages: ${pages}`);
  console.log(`📁 File saved to: long_document_output.html`);
  console.log(`🔗 View at: http://localhost:3000/documents/${documentId}`);
  
  return documentId;
}

// Main execution
async function main() {
  try {
    const content = await generateLongDocument();
    await saveDocument(content);
    await prisma.$disconnect();
    console.log('\n🎉 Document generation complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();