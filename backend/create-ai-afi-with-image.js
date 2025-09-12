#!/usr/bin/env node

/**
 * AI-Enhanced Air Force Document Generator with Image Analysis
 * Sends the Air Force seal image to AI for complete HTML generation
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 AI Air Force Document Generator with Image Analysis

Usage: node create-ai-afi-with-image.js <document-info-json> [options]

Arguments:
  document-info-json - JSON string with document header information

Options:
  --template <type>     - Document template: af-manual, technical, policy (default: af-manual)
  --pages <num>         - Number of pages to generate (default: 3)
  --feedbacks <num>     - Number of AI feedback items (default: 5)

Example:
  node create-ai-afi-with-image.js '{"instructionTitle":"AIR FORCE INSTRUCTION 36-2903","date":"September 18, 2024","subject":"Dress and Personal Appearance","responsibilities":"APPEARANCE STANDARDS"}'
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
  pages: 3,
  feedbacks: 5
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
      options.pages = parseInt(value) || 3;
      break;
    case '--feedbacks':
      options.feedbacks = parseInt(value) || 5;
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

// Get Air Force seal as base64
function getAirForceSealBase64() {
  try {
    const imagePath = path.join(__dirname, '../frontend/public/images/air-force-seal.svg');
    
    if (fs.existsSync(imagePath)) {
      const svgContent = fs.readFileSync(imagePath, 'utf8');
      return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    }
  } catch (error) {
    console.warn('Could not load Air Force seal image:', error.message);
  }
  return null;
}

// Call OpenRouter API with image
async function callOpenRouterWithImage(messages, model = 'anthropic/claude-3-haiku') {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AF Document Generator with Image'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
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

// Generate complete Air Force HTML document with image analysis
async function generateAirForceDocumentWithImage(documentInfo, options) {
  console.log(`🖼️ Loading Air Force seal image for AI analysis...`);
  
  const sealBase64 = getAirForceSealBase64();
  if (!sealBase64) {
    throw new Error('Could not load Air Force seal image');
  }

  console.log(`🤖 Sending image and document info to AI for complete HTML generation...`);
  
  const prompt = `You are creating an official Air Force document. I'm providing you with the Air Force seal image and document information. You must follow the EXACT layout structure I provide.

Document Information:
- Title: ${documentInfo.instructionTitle || 'Air Force Document'}
- Date: ${documentInfo.date || new Date().toLocaleDateString()}
- Subject: ${documentInfo.subject || 'Military Operations'}
- Responsibilities: ${documentInfo.responsibilities || 'MILITARY RESPONSIBILITIES'}
- OPR: ${documentInfo.opr || 'SAF/IG'}
- Certified By: ${documentInfo.certifiedBy || 'AF/CV (General Larry O. Spencer)'}
- Template: ${options.template}
- Pages: ${options.pages}

REQUIRED LAYOUT STRUCTURE (follow this EXACTLY):

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>[INSTRUCTION TITLE]</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; margin: 0; padding: 20px; background: white; }
    .air-force-document-header { max-width: 8.5in; margin: 0 auto 40px auto; padding: 20px; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .left-section { flex: 1; text-align: center; }
    .right-section { flex: 1; text-align: right; font-style: italic; }
    .seal { width: 120px; height: 120px; margin: 10px auto; display: block; }
    .by-order, .secretary { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin-bottom: 5px; }
    .instruction-title { font-weight: bold; font-size: 14pt; margin-bottom: 5px; }
    .date { font-size: 12pt; margin-bottom: 10px; }
    .subject { font-size: 12pt; font-style: italic; margin-bottom: 5px; }
    .responsibilities { font-weight: bold; font-size: 12pt; text-transform: uppercase; }
    .compliance { text-align: center; font-weight: bold; font-size: 12pt; text-transform: uppercase; margin: 30px 0 20px 0; border-bottom: 2px solid black; padding-bottom: 10px; }
    .info-section { margin: 15px 0; font-size: 11pt; }
    .section-label { font-weight: bold; text-transform: uppercase; display: inline-block; width: 150px; }
    .section-content { display: inline; }
    .divider { border-bottom: 1px solid black; margin: 15px 0; }
    .footer-section { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11pt; }
    .opr { font-weight: bold; }
    .certified { text-align: right; }
    .link { color: blue; text-decoration: underline; }
    .document-content { max-width: 8.5in; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 25px 0 15px 0; border-bottom: 1px solid black; padding-bottom: 5px; }
    h2 { font-size: 12pt; font-weight: bold; margin: 20px 0 10px 20px; }
    h3 { font-size: 12pt; font-weight: bold; font-style: italic; margin: 15px 0 8px 40px; }
    p { margin: 12px 0; text-align: justify; text-indent: 0px; }
    ul, ol { margin: 12px 0 12px 40px; }
    li { margin: 8px 0; }
    .numbered-para { margin-left: 20px; }
  </style>
</head>
<body>
  <div class="air-force-document-header">
    <div class="header-section">
      <div class="left-section">
        <div class="by-order">BY ORDER OF THE</div>
        <div class="secretary">SECRETARY OF THE AIR FORCE</div>
        <img src="data:image/png;base64,[EMBED_BASE64_SEAL_HERE]" alt="Department of the Air Force Seal" class="seal" />
      </div>
      <div class="right-section">
        <div class="instruction-title">[INSTRUCTION_TITLE]</div>
        <div class="date">[DATE]</div>
        <div class="subject">[SUBJECT]</div>
        <div class="responsibilities">[RESPONSIBILITIES]</div>
      </div>
    </div>
    
    <div class="compliance">COMPLIANCE WITH THIS PUBLICATION IS MANDATORY</div>
    
    <div class="info-section">
      <span class="section-label">ACCESSIBILITY:</span>
      <span class="section-content">This publication is available for downloading from the e-Publishing website at <a href="https://www.e-publishing.af.mil" class="link">www.e-publishing.af.mil</a>.</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-section">
      <span class="section-label">RELEASABILITY:</span>
      <span class="section-content">There are no releasability restrictions on this publication.</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer-section">
      <div class="opr"><span class="section-label">OPR:</span> [OPR]</div>
      <div class="certified">Certified by: [CERTIFIED_BY]<br />Pages: [PAGES]</div>
    </div>
    
    <div class="divider"></div>
  </div>
  
  <div class="document-content">
    [MAIN_CONTENT_HERE]
  </div>
</body>
</html>

INSTRUCTIONS:
1. Replace [EMBED_BASE64_SEAL_HERE] with the base64 data of the Air Force seal image I'm providing
2. Replace all bracketed placeholders with actual data from the document information above
3. Generate ${options.pages * 400} words of professional ${options.template} content for [MAIN_CONTENT_HERE]
4. Use proper Air Force military terminology and document structure
5. Include sections like Overview, Responsibilities, Procedures, Implementation, References
6. Use numbered paragraphs (1.1, 1.2, etc.) in military format
7. Make the content realistic and appropriate for the subject matter

Generate the complete HTML document following this exact structure:`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${sealBase64}`
          }
        }
      ]
    }
  ];

  const htmlContent = await callOpenRouterWithImage(messages, 'anthropic/claude-3-haiku');
  
  return htmlContent;
}

// Generate AI feedback
async function generateAIFeedback(htmlContent, count, documentInfo) {
  console.log(`🔍 Analyzing HTML content to generate ${count} professional feedback items...`);
  
  // Extract text content from HTML for analysis
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, count * 2);
  
  const prompt = `Review this Air Force document content and provide ${count} professional military editorial feedback items.

Document: ${documentInfo.instructionTitle || 'Air Force Document'}
Subject: ${documentInfo.subject || 'Military Operations'}

Content to review:
${sentences.slice(0, 10).join('. ')}

Provide ${count} feedback items in JSON format focusing on:
- Military terminology precision  
- Compliance language clarity
- Technical accuracy
- Professional Air Force writing standards

JSON format:
[
  {
    "paragraphNumber": "1.1.1", 
    "originalPhrase": "exact text from content",
    "improvedPhrase": "complete professional rewrite",
    "justification": "military/technical reason for improvement"
  }
]`;

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

  const response = await callOpenRouterWithImage(messages);
  
  let feedbackItems = [];
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      feedbackItems = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn('Using fallback feedback generation');
    // Create simple fallback feedback
    feedbackItems = sentences.slice(0, count).map((sentence, i) => ({
      paragraphNumber: `${Math.floor(i / 3) + 1}.${(i % 3) + 1}.${i + 1}`,
      originalPhrase: sentence.substring(0, 100),
      improvedPhrase: sentence.substring(0, 100).replace(/utilizes/g, 'uses').replace(/in order to/g, 'to'),
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
    id: `fb_af_img_${Date.now()}_${i+1}`,
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

// Main function
async function createAIAirForceDocumentWithImage() {
  console.log('\n🦅 AI Air Force Document Generator with Image Analysis\n');
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

    // Generate complete HTML with image analysis
    const completeHTML = await generateAirForceDocumentWithImage(documentInfo, options);
    console.log(`✅ Generated complete HTML document with embedded Air Force seal`);
    
    // Generate AI feedback
    const feedbackItems = await generateAIFeedback(completeHTML, options.feedbacks, documentInfo);
    console.log(`✅ Generated ${feedbackItems.length} professional feedback items`);
    
    // Create document
    const documentId = `af_ai_img_${options.template}_${Math.random().toString(36).substring(2, 10)}`;
    const title = `${documentInfo.instructionTitle || 'Air Force Document'} - ${documentInfo.subject || 'AI Generated with Image Analysis'}`;
    const fileSize = Buffer.byteLength(completeHTML, 'utf8');
    const checksum = crypto.createHash('md5').update(completeHTML).digest('hex');
    
    // Add documentId to feedback items
    feedbackItems.forEach(item => {
      item.documentId = documentId;
    });
    
    console.log('💾 Saving AI-generated Air Force document to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: `${documentId}.html`,
        originalName: `air_force_${options.template}_with_image.html`,
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
          imageAnalyzed: true,
          createdVia: 'ai-air-force-image-generator',
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'ai-air-force-image-generator',
            model: 'anthropic/claude-3-haiku',
            totalFeedback: feedbackItems.length,
            documentType: 'Air Force Document with Image Analysis',
            hasEmbeddedSeal: true
          }
        }
      }
    });

    const sizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('\n✅ AI Air Force Document with Image Analysis Created Successfully!\n');
    console.log(`📄 Document Details:`);
    console.log(`  ID: ${documentId}`);
    console.log(`  Title: ${title}`);
    console.log(`  Size: ${sizeKB} KB`);
    console.log(`  Pages: ${options.pages}`);
    console.log(`  Feedback Items: ${feedbackItems.length}`);
    console.log(`  Template: ${options.template}`);
    console.log(`  🖼️ AI analyzed Air Force seal image`);
    console.log(`  📄 Complete HTML with embedded seal`);
    
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
  createAIAirForceDocumentWithImage();
} else {
  module.exports = createAIAirForceDocumentWithImage;
}