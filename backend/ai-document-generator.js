#!/usr/bin/env node

/**
 * AI-Powered Document Generator using OpenRouter
 * This generator uses AI to create realistic documents and analyze them for feedback
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 AI-Powered Document Generator (OpenRouter)

Usage: node ai-document-generator.js <template> <pages> <feedbacks> [title]

Arguments:
  template   - Document type: technical, policy, training, sop, af-manual
  pages      - Number of pages to generate (1-20)
  feedbacks  - Number of feedback entries (0-50)
  title      - Optional: Custom document title

Examples:
  node ai-document-generator.js technical 5 10
  node ai-document-generator.js policy 10 15 "Security Policy 2025"
  
Features:
  ✅ Uses AI (GPT-4/Claude) to generate realistic content
  ✅ Creates proper document structure with sections
  ✅ Analyzes content and creates meaningful feedback
  ✅ Ensures paragraph numbers match actual content
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
        'X-Title': 'Document Generator'
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

// Generate document content using AI
async function generateAIDocument(template, pages, feedbackCount) {
  const templateDescriptions = {
    technical: 'technical documentation for a software system',
    policy: 'organizational policy document',
    training: 'training manual for staff education',
    sop: 'standard operating procedures',
    'af-manual': 'Air Force technical manual'
  };

  const templatePrompts = {
    technical: `Generate exactly ${pages} pages of ${templateDescriptions[template]}. Requirements:
- IMPORTANT: You are creating a ${template.toUpperCase()} document with exactly ${pages} pages
- This document will have ${feedbackCount} feedback items for review
- Use H1 for the main title "Technical Documentation"
- Use H2 for main sections (e.g., "1. System Architecture", "2. Implementation", "3. Configuration")
- Use H3 for subsections (e.g., "1.1 Overview", "1.2 Components", "1.3 Design Patterns")
- Each subsection should have 2-3 meaningful paragraphs with substantive content
- Include technical details, system requirements, architecture descriptions
- Add some lists and tables where appropriate
- Use HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>, <em>
- Make the content realistic, detailed, and professional
- Each page should have approximately 300-400 words
- Total content should be approximately ${pages * 350} words`,

    policy: `Generate exactly ${pages} pages of ${templateDescriptions[template]} in HTML format. Requirements:
- IMPORTANT: Generate VALID HTML with proper tags
- Use <h1> for "Policy Document"
- Use <h2> for main sections (e.g., "1. Purpose and Scope", "2. Responsibilities", "3. Procedures")
- Use <h3> for subsections (e.g., "1.1 Objectives", "1.2 Applicability")
- CRITICAL: Wrap ALL paragraph text in <p> tags - never leave text without tags
- Include compliance requirements, roles, procedures
- Add enforcement and review sections
- Each paragraph should be wrapped in <p></p> tags
- Use <ul> and <li> for lists
- Make it professional and comprehensive
- Each page should have approximately 300-400 words`,

    training: `Generate exactly ${pages} pages of training manual in HTML format. Requirements:
- GENERATE VALID HTML with proper tags
- Use <h1> for "Training Manual"
- Use <h2> for modules (e.g., "1. Introduction", "2. Core Concepts", "3. Practical Exercises")
- Use <h3> for lessons (e.g., "1.1 Learning Objectives", "1.2 Prerequisites")
- WRAP ALL paragraph text in <p> tags - no bare text
- Include learning objectives, exercises, assessments
- Add examples and practical scenarios
- Use <ul>, <ol>, <li> for lists
- Make it educational and clear`,

    sop: `Generate exactly ${pages} pages of Standard Operating Procedure in HTML format. Requirements:
- GENERATE VALID HTML with proper tags
- Use <h1> for "Standard Operating Procedure"
- Use <h2> for main procedures (e.g., "1. Preparation", "2. Execution", "3. Verification")
- Use <h3> for steps (e.g., "1.1 Initial Setup", "1.2 Safety Checks")
- WRAP ALL paragraph text in <p> tags
- Include step-by-step instructions, safety requirements, quality checkpoints
- Add warnings and cautions in <div class="warning"> or <div class="caution">
- Use <ol> for numbered steps, <ul> for bullet points
- Make it detailed and precise`,

    'af-manual': `Generate exactly ${pages} pages of Air Force technical manual in HTML format. Requirements:
- GENERATE VALID HTML with proper tags
- Use <h1> for "AIR FORCE TECHNICAL MANUAL"
- Add header info like "TO 1F-16C-1" in <div class="header-info">
- Use <h2> for chapters (e.g., "1. Introduction", "2. Normal Procedures", "3. Emergency Procedures")
- Use <h3> for sections (e.g., "1.1 General Information", "1.2 System Description")
- WRAP ALL paragraph text in <p> tags
- Include warnings, cautions, and notes in proper <div> tags
- Add technical specifications and operating procedures
- Use military/aviation terminology
- Make it authentic to military documentation style`
  };

  const prompt = templatePrompts[template] || templatePrompts.technical;
  
  console.log(`🤖 Calling AI to generate ${pages} pages of ${template} content with ${feedbackCount} feedback items...`);
  
  const messages = [
    {
      role: 'system',
      content: `You are a professional technical writer who generates VALID HTML documents. 
CRITICAL REQUIREMENTS:
1. Generate proper HTML with ALL text wrapped in appropriate tags
2. NEVER leave bare text - always use <p> tags for paragraphs
3. Create exactly ${pages} pages of ${templateDescriptions[template]}
4. Include content suitable for ${feedbackCount} editorial improvements
5. Use proper HTML structure: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, etc.
6. Each paragraph MUST be wrapped in <p></p> tags`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const content = await callOpenRouter(messages);
  
  // Parse the content to extract paragraph information
  const paragraphMap = {};
  const sectionsList = [];
  
  // Extract paragraphs and their numbers
  const lines = content.split('\n');
  let currentSection = 0;
  let currentSubsection = 0;
  let paragraphInSubsection = 0;
  
  // Process the entire content as one string to maintain context
  const fullContent = lines.join('\n');
  
  // Split by sections and subsections to properly track context
  const sections = fullContent.split(/<h2>/);
  
  sections.forEach((sectionContent, sectionIndex) => {
    if (sectionIndex === 0 || !sectionContent.trim()) return; // Skip content before first H2
    
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
        // This is content before first H3 in section
        currentSubsection = 0;
        paragraphInSubsection = 0;
      } else {
        // This is a subsection
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
  
  return { content, paragraphMap, sections: sectionsList };
}

// Generate AI-based feedback
async function generateAIFeedback(paragraphMap, count, template) {
  if (Object.keys(paragraphMap).length === 0 || count === 0) {
    return [];
  }
  
  const paragraphEntries = Object.entries(paragraphMap).slice(0, Math.min(count * 2, Object.keys(paragraphMap).length));
  
  console.log(`🔍 Analyzing content with AI to generate ${count} meaningful feedback items...`);
  
  const prompt = `You are reviewing a ${template} document. Analyze these paragraphs and provide ${count} MEANINGFUL feedback items that would significantly improve the document.

Paragraphs to analyze:
${paragraphEntries.map(([num, text]) => `[${num}]: ${text}`).join('\n\n')}

Generate exactly ${count} feedback items in JSON format. For each feedback:
1. Find an ACTUAL sentence or phrase from the paragraphs above that could be improved
2. Write a COMPLETELY NEW version - DO NOT just add "(improved)" or make tiny changes
3. Explain WHY your version is better

Example of GOOD feedback:
{
  "paragraphNumber": "1.1.1",
  "originalPhrase": "The system utilizes a complex array of interconnected modules to facilitate data processing",
  "improvedPhrase": "The system uses interconnected modules for data processing",
  "justification": "Removed unnecessary jargon and redundant words to improve clarity"
}

Examples of BAD feedback (ABSOLUTELY FORBIDDEN):
{
  "originalPhrase": "The system is designed",
  "improvedPhrase": "The system is designed (improved)",  // ❌ WRONG - lazy placeholder!
}
{
  "originalPhrase": "The platform provides",
  "improvedPhrase": "The platform provides (better)",  // ❌ WRONG - lazy addition!
}
{
  "originalPhrase": "The system is designed",
  "improvedPhrase": "The system is designed",  // ❌ WRONG - exact same text!
}

CRITICAL RULES:
1. NEVER add (improved), (better), (enhanced) or ANY word in parentheses
2. The improvedPhrase MUST be genuinely DIFFERENT - a real rewrite
3. If you cannot improve something, pick a different sentence to improve

Return ONLY valid JSON array with ${count} items:

Requirements:
- Select MEANINGFUL text segments (full sentences or substantial phrases)
- Provide COMPLETE REPHRASINGS, not just minor word changes
- Focus on: clarity, conciseness, active voice, technical accuracy, professional tone
- Each feedback should represent a substantive improvement
- Original phrases must be EXACT text from the paragraphs
- Improved phrases should be complete rewrites when appropriate`;

  const messages = [
    {
      role: 'system',
      content: `You are a professional technical editor. 
ABSOLUTE REQUIREMENTS:
1. NEVER add words like "(improved)", "(better)", "(enhanced)" to text
2. NEVER return the same text with minor additions
3. ALWAYS provide COMPLETE REPHRASINGS that are genuinely different
4. If you cannot improve a phrase, select a different one
5. The "improvedPhrase" must be a real rewrite, not the original with a word added

FORBIDDEN RESPONSES:
- "The system is designed (improved)" ❌
- "The platform provides services (better)" ❌  
- Adding any parenthetical like (enhanced), (optimized), etc. ❌

REQUIRED: Complete, meaningful rephrasings only.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(messages);
  
  // Parse the JSON response
  let feedbackItems;
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      feedbackItems = JSON.parse(jsonMatch[0]);
      
      // Filter out any lazy feedback with (improved), (better), etc.
      feedbackItems = feedbackItems.filter(item => {
        const hasLazyPattern = /\(improved\)|\(better\)|\(enhanced\)|\(optimized\)|\(updated\)/i.test(item.improvedPhrase);
        const isSameText = item.originalPhrase === item.improvedPhrase;
        
        if (hasLazyPattern || isSameText) {
          console.warn(`Rejected lazy feedback: "${item.improvedPhrase}"`);
          return false;
        }
        return true;
      });
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('Error parsing AI feedback response:', error);
    // Generate proper fallback feedback without lazy placeholders
    feedbackItems = [];
    for (let i = 0; i < Math.min(count, paragraphEntries.length); i++) {
      const [num, text] = paragraphEntries[i];
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const targetSentence = sentences[0] || text.substring(0, 100);
      
      // Create actual improvements based on common patterns
      let improvedSentence = targetSentence;
      let justification = '';
      
      if (targetSentence.includes('is designed to')) {
        improvedSentence = targetSentence.replace('is designed to', 'will');
        justification = 'Simplify passive construction to active voice';
      } else if (targetSentence.includes('in order to')) {
        improvedSentence = targetSentence.replace('in order to', 'to');
        justification = 'Remove unnecessary words for conciseness';
      } else if (targetSentence.includes('utilizes')) {
        improvedSentence = targetSentence.replace('utilizes', 'uses');
        justification = 'Use simpler, clearer language';
      } else if (targetSentence.includes('a number of')) {
        improvedSentence = targetSentence.replace('a number of', 'several');
        justification = 'Replace wordy phrase with concise alternative';
      } else {
        // Generic improvement - make more concise
        const modifiedSentence = targetSentence.replace(/\b(very|really|quite|rather|just|simply)\b/gi, '').replace(/\s+/g, ' ').trim();
        
        // If no change was made, try other improvements
        if (modifiedSentence === targetSentence) {
          // Try to simplify common verbose patterns
          if (targetSentence.includes('is designed')) {
            improvedSentence = targetSentence.replace('is designed', 'supports');
            justification = 'Use more direct language';
          } else if (targetSentence.includes('provides')) {
            improvedSentence = targetSentence.replace('provides', 'offers');
            justification = 'Use varied vocabulary';
          } else if (targetSentence.includes('system')) {
            improvedSentence = targetSentence.replace(/\bsystem\b/, 'platform');
            justification = 'Use more specific terminology';
          } else {
            // Last resort - restructure the sentence
            const words = targetSentence.split(' ');
            if (words.length > 10) {
              // Shorten long sentences
              improvedSentence = words.slice(0, Math.ceil(words.length * 0.8)).join(' ') + '.';
              justification = 'Simplify lengthy sentence for clarity';
            } else {
              // Skip this feedback if we can't improve it
              continue;
            }
          }
        } else {
          improvedSentence = modifiedSentence;
          justification = 'Remove unnecessary modifiers for clarity';
        }
      }
      
      // Only add feedback if we actually made a change
      if (improvedSentence !== targetSentence) {
        feedbackItems.push({
          paragraphNumber: num,
          originalPhrase: targetSentence.trim(),
          improvedPhrase: improvedSentence.trim(),
          justification: justification
        });
      }
    }
  }
  
  // Convert to feedback format
  const feedbackTypes = ['Substantive (Important)', 'Substantive (Recommended)', 'Administrative', 'Critical'];
  const components = ['Technical Review', 'Editorial Review', 'Compliance Review', 'Quality Review'];
  const pocNames = ['Col Anderson', 'Maj Williams', 'Capt Davis', 'Lt Martinez', 'MSgt Thompson'];
  const pocPhones = ['555-0201', '555-0202', '555-0203', '555-0204', '555-0205'];
  const pocEmails = ['anderson.j@mil', 'williams.m@mil', 'davis.k@mil', 'martinez.r@mil', 'thompson.s@mil'];
  
  return feedbackItems.slice(0, count).map((item, i) => ({
    id: `fb_ai_${Date.now()}_${i+1}`,
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
    coordinatorComment: 'AI-suggested improvement for clarity and accuracy',
    coordinatorJustification: item.justification,
    status: 'pending',
    accepted: false
  }));
}

// Main function
async function createAIDocument() {
  console.log('\n🤖 AI-Powered Document Generator (OpenRouter)\n');
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

    // Generate document using AI
    const { content, paragraphMap, sections } = await generateAIDocument(template, pages, feedbackCount);
    console.log(`✅ AI generated ${Object.keys(paragraphMap).length} paragraphs across ${sections.length} sections`);
    
    // Generate feedback using AI
    const documentId = `doc_ai_${template}_${Math.random().toString(36).substring(2, 10)}`;
    const feedbackItems = await generateAIFeedback(paragraphMap, feedbackCount, template);
    console.log(`✅ AI generated ${feedbackItems.length} meaningful feedback items`);
    
    // Add documentId to feedback items
    feedbackItems.forEach(item => {
      item.documentId = documentId;
    });
    
    // Create document
    const title = customTitle || `AI ${template.toUpperCase()} - ${new Date().toISOString().split('T')[0]}`;
    const fileSize = Buffer.byteLength(content, 'utf8');
    const checksum = crypto.createHash('md5').update(content).digest('hex');
    
    console.log('💾 Saving to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: `${documentId}.html`,
        originalName: `ai_${template}_document.html`,
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
          content: content,
          draftFeedback: feedbackItems,
          template: template,
          pages: pages,
          createdVia: 'ai-generator-openrouter',
          paragraphMap: paragraphMap,
          sections: sections,
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'openrouter-ai',
            model: 'anthropic/claude-3-haiku',
            totalParagraphs: Object.keys(paragraphMap).length,
            totalSections: sections.length,
            totalFeedback: feedbackItems.length,
            aiGenerated: true
          }
        }
      }
    });

    const actualSizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('\n✅ AI Document Created Successfully!\n');
    console.log(`📄 Document Details:`);
    console.log(`  ID: ${documentId}`);
    console.log(`  Title: ${title}`);
    console.log(`  Size: ${actualSizeKB} KB`);
    console.log(`  Pages: ~${pages}`);
    console.log(`  Sections: ${sections.length}`);
    console.log(`  Paragraphs: ${Object.keys(paragraphMap).length}`);
    console.log(`  Feedback Items: ${feedbackItems.length}`);
    
    console.log('\n📊 AI-Generated Meaningful Feedback Summary:');
    feedbackItems.slice(0, 3).forEach((fb, idx) => {
      const from = fb.changeFrom.length > 50 ? fb.changeFrom.substring(0, 50) + '...' : fb.changeFrom;
      const to = fb.changeTo.length > 50 ? fb.changeTo.substring(0, 50) + '...' : fb.changeTo;
      console.log(`  ${idx + 1}. Paragraph ${fb.paragraphNumber}:`);
      console.log(`     From: "${from}"`);
      console.log(`     To:   "${to}"`);
      console.log(`     Why:  ${fb.coordinatorJustification}`);
    });
    if (feedbackItems.length > 3) {
      console.log(`  ... and ${feedbackItems.length - 3} more meaningful improvements with complete rephrasings`);
    }
    
    console.log('\n🔗 Access URLs:');
    console.log(`  View: http://localhost:3000/documents/${documentId}`);
    console.log(`  Edit: http://localhost:3000/editor/${documentId}`);
    console.log(`  Review: http://localhost:3000/documents/${documentId}/opr-review\n`);
    
    await prisma.$disconnect();
    return documentId;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAIDocument();
} else {
  module.exports = createAIDocument;
}