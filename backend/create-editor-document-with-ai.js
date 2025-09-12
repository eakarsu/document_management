#!/usr/bin/env node

/**
 * Editor-Based Document Generator with AI Content
 * This generator uses AI to create content, then uses Playwright to write it into the editor
 * to simulate TipTap editor behavior with proper formatting
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('playwright');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
  console.log(`
📝 Editor-Based Document Generator with AI Content

Usage: node create-editor-document-with-ai.js <template> <pages> <feedbacks> [title]

Arguments:
  template   - Template type: technical, policy, training, sop, af-manual
  pages      - Number of pages to generate (1-20)
  feedbacks  - Number of feedback entries to create (0-50)
  title      - Optional: Custom document title

Examples:
  node create-editor-document-with-ai.js technical 3 10
  node create-editor-document-with-ai.js policy 5 15 "Security Policy 2025"
  
Features:
  ✅ Uses AI to generate realistic content
  ✅ Writes content through TipTap editor for proper formatting
  ✅ Creates feedback based on actual document content
  ✅ Uses same numbering schema as AI generator
  `);
  process.exit(0);
}

const template = args[0];
const pages = parseInt(args[1]);
const feedbackCount = parseInt(args[2]);
const customTitle = args[3] || null;

// Validate inputs
if (!['technical', 'policy', 'training', 'sop', 'af-manual'].includes(template)) {
  console.error('❌ Invalid template. Choose: technical, policy, training, sop, af-manual');
  process.exit(1);
}

if (isNaN(pages) || pages < 1 || pages > 20) {
  console.error('❌ Pages must be between 1 and 20');
  process.exit(1);
}

if (isNaN(feedbackCount) || feedbackCount < 0 || feedbackCount > 50) {
  console.error('❌ Feedbacks must be between 0 and 50');
  process.exit(1);
}

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

// Call OpenRouter API
async function callOpenRouter(messages, model = 'anthropic/claude-3-haiku') {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Editor Document Generator'
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

// Generate document structure using AI
async function generateAIStructure(template, pages) {
  const templateDescriptions = {
    technical: 'technical documentation',
    policy: 'policy document',
    training: 'training manual',
    sop: 'standard operating procedures',
    'af-manual': 'Air Force technical manual'
  };

  const prompt = `Generate a structured outline for a ${pages}-page ${templateDescriptions[template]}. 
  
Format the response as JSON with this structure:
{
  "title": "Document Title",
  "sections": [
    {
      "number": "1",
      "title": "Section Title",
      "subsections": [
        {
          "number": "1.1",
          "title": "Subsection Title",
          "paragraphs": [
            "First paragraph content...",
            "Second paragraph content..."
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create ${Math.ceil(pages)} main sections
- Each section should have 2-3 subsections
- Each subsection should have 2-3 paragraphs
- Paragraphs should be substantial (100-150 words each)
- Content should be professional and realistic
- Total content should fill approximately ${pages} pages`;

  const messages = [
    {
      role: 'system',
      content: `You are a professional technical writer. Generate structured document content in JSON format.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(messages, 'anthropic/claude-3.5-sonnet');
  
  // Parse JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Clean up the JSON string
      let jsonStr = jsonMatch[0];
      // Remove any trailing commas before closing brackets/braces
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      // Fix any unescaped quotes in strings
      jsonStr = jsonStr.replace(/([^\\])"([^":\[\]\{\},]+)"([^:,\]}])/g, '$1\"$2\"$3');
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.error('Error parsing AI response, using fallback:', error.message);
  }
  
  // Fallback structure if parsing fails
  return {
    title: `${template.toUpperCase()} Document`,
    sections: [
      {
        number: "1",
        title: "Introduction",
        subsections: [
          {
            number: "1.1",
            title: "Overview",
            paragraphs: [
              "This document provides comprehensive information about the system.",
              "The content covers all essential aspects and requirements."
            ]
          }
        ]
      }
    ]
  };
}

// Write content to editor using Playwright
async function writeToEditor(structure) {
  console.log('🌐 Launching browser to write content in editor...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to documents page first
    console.log('📝 Opening documents page...');
    const ports = [3000, 3001, 3002];
    let baseUrl = null;
    
    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}/documents`, { waitUntil: 'domcontentloaded', timeout: 5000 });
        baseUrl = `http://localhost:${port}`;
        console.log(`✅ Frontend found at port ${port}`);
        break;
      } catch (e) {
        console.log(`❌ Port ${port} not available, trying next...`);
      }
    }
    
    if (!baseUrl) {
      throw new Error('Could not find frontend on any port');
    }
    
    // Click the "Create with Editor" button
    console.log('🖱️ Clicking Create with Editor button...');
    await page.waitForSelector('button:has-text("Create with Editor")', { timeout: 5000 });
    await page.click('button:has-text("Create with Editor")');
    
    // Wait for editor to be ready - try different selectors
    console.log('⏳ Waiting for editor to load...');
    try {
      await page.waitForSelector('[data-testid="editor"]', { timeout: 5000 });
    } catch {
      try {
        await page.waitForSelector('.ProseMirror', { timeout: 5000 });
      } catch {
        await page.waitForSelector('[contenteditable="true"]', { timeout: 5000 });
      }
    }
    
    await page.waitForTimeout(2000); // Let editor fully initialize
    
    console.log('✍️ Writing AI content to editor...');
    
    // Find and click the editor
    const editorSelector = await page.evaluate(() => {
      if (document.querySelector('.tiptap.ProseMirror')) return '.tiptap.ProseMirror';
      if (document.querySelector('.ProseMirror')) return '.ProseMirror';
      if (document.querySelector('[contenteditable="true"]')) return '[contenteditable="true"]';
      if (document.querySelector('[data-testid="editor"]')) return '[data-testid="editor"]';
      return null;
    });
    
    if (!editorSelector) {
      throw new Error('Could not find editor element on page');
    }
    
    await page.click(editorSelector);
    
    // Write title as H1
    await page.keyboard.type(structure.title);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Write sections
    for (const section of structure.sections) {
      // Apply H2 formatting for section heading
      await page.keyboard.down('Control');
      await page.keyboard.down('Alt');
      await page.keyboard.press('2');
      await page.keyboard.up('Alt');
      await page.keyboard.up('Control');
      
      await page.keyboard.type(`${section.number}. ${section.title}`);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      // Write subsections
      for (const subsection of section.subsections) {
        // Apply H3 formatting for subsection heading
        await page.keyboard.down('Control');
        await page.keyboard.down('Alt');
        await page.keyboard.press('3');
        await page.keyboard.up('Alt');
        await page.keyboard.up('Control');
        
        await page.keyboard.type(`${subsection.number} ${subsection.title}`);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        
        // Write paragraphs
        for (const paragraph of subsection.paragraphs) {
          // Type the paragraph
          await page.keyboard.type(paragraph);
          
          // Add some formatting to important words
          const importantWords = ['critical', 'important', 'essential', 'required', 'must'];
          for (const word of importantWords) {
            if (paragraph.toLowerCase().includes(word)) {
              // Select and bold random important words (simplified for speed)
              if (Math.random() > 0.7) {
                // Just continue typing, formatting would be too slow
                break;
              }
            }
          }
          
          await page.keyboard.press('Enter');
          await page.keyboard.press('Enter');
        }
      }
    }
    
    // Get the final HTML content from the editor
    const htmlContent = await page.evaluate(() => {
      const editor = document.querySelector('.tiptap.ProseMirror');
      return editor ? editor.innerHTML : '';
    });
    
    console.log('✅ Content written to editor');
    await browser.close();
    
    return htmlContent;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Extract paragraph map using same logic as AI generator
function extractParagraphMap(htmlContent) {
  const paragraphMap = {};
  const sectionsList = [];
  
  let currentSection = 0;
  let currentSubsection = 0;
  let paragraphInSubsection = 0;
  
  // Split by sections and subsections to properly track context
  const sections = htmlContent.split(/<h2>/);
  
  sections.forEach((sectionContent, sectionIndex) => {
    if (sectionIndex === 0 || !sectionContent.trim()) return;
    
    // Extract section number and title
    const sectionMatch = sectionContent.match(/^(\d+)\.\s*([^<]+)</);
    if (!sectionMatch) return;
    
    currentSection = parseInt(sectionMatch[1]);
    const sectionTitle = sectionMatch[2];
    sectionsList.push({ num: currentSection, title: sectionTitle });
    
    // Split this section by H3 subsections
    const subsections = sectionContent.split(/<h3>/);
    
    subsections.forEach((subsectionContent, subsectionIndex) => {
      if (subsectionIndex === 0) {
        currentSubsection = 0;
        paragraphInSubsection = 0;
      } else {
        const subsectionMatch = subsectionContent.match(/^(\d+)\.(\d+)\s*([^<]+)</);
        if (subsectionMatch) {
          currentSection = parseInt(subsectionMatch[1]) || currentSection;
          currentSubsection = parseInt(subsectionMatch[2]);
          paragraphInSubsection = 0;
        }
      }
      
      // Extract all paragraphs in this subsection
      const paragraphs = subsectionContent.match(/<p>([^<]+(?:<[^>]+>[^<]+)*[^<]+)<\/p>/g);
      if (paragraphs) {
        paragraphs.forEach(p => {
          paragraphInSubsection++;
          
          const paragraphNumber = currentSubsection > 0 
            ? `${currentSection}.${currentSubsection}.${paragraphInSubsection}`
            : `${currentSection}.0.${paragraphInSubsection}`;
          
          // Extract text from paragraph
          const textMatch = p.match(/<p>([^<]+(?:<[^>]+>[^<]+)*[^<]+)<\/p>/);
          if (textMatch) {
            const cleanText = textMatch[1].replace(/<[^>]+>/g, '');
            paragraphMap[paragraphNumber] = cleanText;
          }
        });
      }
    });
  });
  
  return { paragraphMap, sections: sectionsList };
}

// Generate feedback based on paragraph map
async function generateFeedback(paragraphMap, count) {
  if (Object.keys(paragraphMap).length === 0 || count === 0) {
    return [];
  }
  
  const paragraphEntries = Object.entries(paragraphMap).slice(0, Math.min(count * 2, Object.keys(paragraphMap).length));
  
  const prompt = `Analyze these paragraphs and provide ${count} feedback items for improvement.

Paragraphs:
${paragraphEntries.map(([num, text]) => `[${num}]: ${text}`).join('\n\n')}

Generate exactly ${count} feedback items in JSON format:
[
  {
    "paragraphNumber": "1.1.1",
    "originalPhrase": "exact phrase from the paragraph (10-20 words)",
    "improvedPhrase": "completely rewritten version",
    "justification": "reason for the change"
  }
]

Requirements:
- Select meaningful phrases to improve
- Provide complete rephrasings, not minor changes
- Never add "(improved)" or similar placeholders
- Each improvement must be genuinely different`;

  const messages = [
    {
      role: 'system',
      content: 'You are a technical editor providing substantive improvements to documents.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(messages, 'anthropic/claude-3.5-sonnet');
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      // Clean up the JSON string
      let jsonStr = jsonMatch[0];
      // Remove any trailing commas before closing brackets
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      const feedbackItems = JSON.parse(jsonStr);
      
      // Convert to database format
      const feedbackTypes = ['Substantive (Important)', 'Substantive (Recommended)', 'Administrative', 'Critical'];
      const components = ['Technical Review', 'Editorial Review', 'Compliance Review', 'Quality Review'];
      const pocNames = ['Col Anderson', 'Maj Williams', 'Capt Davis', 'Lt Martinez', 'MSgt Thompson'];
      const pocPhones = ['555-0201', '555-0202', '555-0203', '555-0204', '555-0205'];
      const pocEmails = ['anderson.j@mil', 'williams.m@mil', 'davis.k@mil', 'martinez.r@mil', 'thompson.s@mil'];
      
      return feedbackItems.map((item, i) => ({
        id: `fb_editor_ai_${Date.now()}_${i+1}`,
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
        coordinatorComment: 'Editor-based AI improvement suggestion',
        coordinatorJustification: item.justification,
        status: 'pending',
        accepted: false
      }));
    }
  } catch (error) {
    console.error('Error parsing feedback:', error);
  }
  
  return [];
}

// Main function
async function createEditorDocumentWithAI() {
  console.log('\n🤖 Editor-Based Document Generator with AI Content\n');
  console.log(`Template: ${template}`);
  console.log(`Pages: ${pages}`);
  console.log(`Feedback Items: ${feedbackCount}`);
  console.log(`Title: ${customTitle || 'Auto-generated'}\n`);
  
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    // Generate document structure using AI
    console.log('🤖 Generating document structure with AI...');
    const structure = await generateAIStructure(template, pages);
    console.log(`✅ AI generated structure with ${structure.sections.length} sections`);
    
    // Write content to editor using Playwright
    console.log('📝 Writing content to editor with Playwright...');
    const htmlContent = await writeToEditor(structure);
    console.log('✅ Content written through real editor');
    
    // Extract paragraph map
    const { paragraphMap, sections } = extractParagraphMap(htmlContent);
    console.log(`✅ Extracted ${Object.keys(paragraphMap).length} paragraphs`);
    
    // Generate feedback
    console.log('🔍 Generating feedback based on content...');
    const documentId = `doc_editor_ai_${template}_${Math.random().toString(36).substring(2, 10)}`;
    const feedbackItems = await generateFeedback(paragraphMap, feedbackCount);
    
    // Add documentId to feedback
    feedbackItems.forEach(item => {
      item.documentId = documentId;
    });
    
    console.log(`✅ Generated ${feedbackItems.length} feedback items`);
    
    // Save to database
    const title = customTitle || `Editor-AI ${template.toUpperCase()} - ${new Date().toISOString().split('T')[0]}`;
    const fileSize = Buffer.byteLength(htmlContent, 'utf8');
    const checksum = crypto.createHash('md5').update(htmlContent).digest('hex');
    
    console.log('💾 Saving to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: `${documentId}.html`,
        originalName: `editor_ai_${template}_document.html`,
        mimeType: 'text/html',
        fileSize: fileSize,
        checksum: checksum,
        storagePath: `uploads/${documentId}.html`,
        category: 'Technical Manual',
        status: 'DRAFT',
        createdBy: {
          connect: { id: user.id }
        },
        organization: {
          connect: { id: user.organizationId }
        },
        customFields: {
          content: htmlContent,
          draftFeedback: feedbackItems,
          template: template,
          pages: pages,
          createdVia: 'editor-ai-playwright',
          paragraphMap: paragraphMap,
          sections: sections,
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'editor-ai',
            editorUsed: 'tiptap-playwright',
            totalParagraphs: Object.keys(paragraphMap).length,
            totalSections: sections.length,
            totalFeedback: feedbackItems.length,
            aiGenerated: true,
            editorFormatted: true
          }
        }
      }
    });
    
    const actualSizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('\n✅ Editor-AI Document Created Successfully!\n');
    console.log(`📄 Document Details:`);
    console.log(`  ID: ${documentId}`);
    console.log(`  Title: ${title}`);
    console.log(`  Size: ${actualSizeKB} KB`);
    console.log(`  Pages: ~${pages}`);
    console.log(`  Sections: ${sections.length}`);
    console.log(`  Paragraphs: ${Object.keys(paragraphMap).length}`);
    console.log(`  Feedback Items: ${feedbackItems.length}`);
    
    console.log('\n📊 Feedback Summary:');
    feedbackItems.slice(0, 3).forEach((fb, idx) => {
      const from = fb.changeFrom.length > 50 ? fb.changeFrom.substring(0, 50) + '...' : fb.changeFrom;
      const to = fb.changeTo.length > 50 ? fb.changeTo.substring(0, 50) + '...' : fb.changeTo;
      console.log(`  ${idx + 1}. Paragraph ${fb.paragraphNumber}:`);
      console.log(`     From: "${from}"`);
      console.log(`     To:   "${to}"`);
    });
    
    console.log('\n🔗 Access URLs:');
    console.log(`  View: http://localhost:3000/documents/${documentId}`);
    console.log(`  Edit: http://localhost:3000/editor/${documentId}`);
    console.log(`  Review: http://localhost:3000/documents/${documentId}/opr-review\n`);
    
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
  createEditorDocumentWithAI();
} else {
  module.exports = createEditorDocumentWithAI;
}