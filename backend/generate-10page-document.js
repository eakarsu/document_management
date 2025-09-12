#!/usr/bin/env node

/**
 * Optimized 10-Page Document Generator
 * Generates full 10-page documents with a single API call
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help')) {
  console.log(`
📄 10-Page Document Generator

Usage: node generate-10page-document.js <document-info-json>

Example:
  node generate-10page-document.js '{"instructionTitle":"AFI 36-2903","subject":"DRESS STANDARDS"}'
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

async function generateFullDocument() {
  console.log('🚀 Generating 10-page document...');
  
  // Use Claude 3.5 Sonnet for quality
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are an Air Force technical writer. IMPORTANT: Generate COMPLETE documents without asking for confirmation. Never stop midway or use placeholders.'
        },
        {
          role: 'user',
          content: `Generate a complete 10-page Air Force document.

Title: ${documentInfo.instructionTitle}
Subject: ${documentInfo.subject}

REQUIREMENTS:
- Generate EXACTLY 50 paragraphs of content
- Each paragraph: 100-150 words
- Total: ~5000-7500 words
- Use HTML formatting

STRUCTURE (with exact paragraph counts):
1. OVERVIEW - 5 paragraphs
2. RESPONSIBILITIES - 10 paragraphs  
3. PROCEDURES - 15 paragraphs
4. IMPLEMENTATION - 10 paragraphs
5. COMPLIANCE - 5 paragraphs
6. REFERENCES - 5 paragraphs

FORMAT:
<h1>1. OVERVIEW</h1>
<p>Paragraph 1.1 content (100-150 words)...</p>
<p>Paragraph 1.2 content (100-150 words)...</p>
[Continue for all 50 paragraphs]

CRITICAL: Generate ALL 50 paragraphs. Do NOT stop early or ask for confirmation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 15000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function saveDocument(content) {
  const user = await prisma.user.findFirst();
  const documentId = `doc_10page_${Date.now()}`;
  
  // Count actual paragraphs
  const paragraphs = (content.match(/<p[^>]*>/g) || []).length;
  const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w).length;
  
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${documentInfo.instructionTitle}</title>
  <style>
    body { font-family: 'Times New Roman'; font-size: 12pt; line-height: 1.5; margin: 40px; }
    h1 { font-size: 14pt; font-weight: bold; margin: 20px 0; }
    p { text-align: justify; margin: 12px 0; }
  </style>
</head>
<body>
  <h1>${documentInfo.instructionTitle}</h1>
  <h2>${documentInfo.subject}</h2>
  <hr>
  ${content}
</body>
</html>`;

  await prisma.document.create({
    data: {
      id: documentId,
      title: `${documentInfo.instructionTitle} - ${documentInfo.subject}`,
      fileName: `${documentId}.html`,
      originalName: '10page_document.html',
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
        words: words
      }
    }
  });

  console.log(`✅ Document created: ${documentId}`);
  console.log(`📊 Stats: ${paragraphs} paragraphs, ${words} words`);
  console.log(`🔗 View: http://localhost:3000/documents/${documentId}`);
  
  // Save to file for inspection
  require('fs').writeFileSync('generated_10page.html', fullHTML);
  console.log(`💾 Saved to: generated_10page.html`);
}

// Main execution
generateFullDocument()
  .then(content => saveDocument(content))
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });