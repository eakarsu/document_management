import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');

const router = Router();
const prisma = new PrismaClient();

// Get OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Extract paragraphs and structure from content
function extractParagraphsWithNumbers(content: string, pages: number = 5): any[] {
  // Strip HTML tags for plain text analysis
  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into lines for processing
  const lines = plainText
    .replace(/&nbsp;/g, ' ')
    .replace(/&[^;]+;/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Find where actual content starts (after header)
  let contentStartIndex = lines.findIndex((line: string) => 
    line.includes('COMPLIANCE WITH THIS PUBLICATION IS MANDATORY')
  );
  if (contentStartIndex === -1) contentStartIndex = 0;
  
  // Match editor's page/line calculation
  const LINES_PER_PAGE = 50; // Same as editor
  const CHARS_PER_LINE = 80; // Same as editor
  
  // Parse the HTML to extract structured content - works with ANY numbering scheme
  const sectionRegex = /<h[2-6][^>]*>([^<]+)<\/h[2-6]>/gi;
  const paragraphRegex = /<p[^>]*>([^<]+)<\/p>/gi;
  
  let currentPage = 1; // Start at page 1
  let globalLineCounter = 1; // Start at line 1 (header is displayed separately, not counted)
  let linesOnCurrentPage = 0;
  
  // DO NOT count header lines - the header is displayed separately above the DocumentNumbering component
  // The line numbers in DocumentNumbering start at 1 for the actual content (after header)
  
  // First pass: extract all sections - parse ANY format
  const sections: any[] = [];
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(content)) !== null) {
    const fullText = sectionMatch[1].trim();
    // Extract number if present (supports any numbering format)
    const numberMatch = fullText.match(/^([\d.]+)\s+(.+)$/);
    
    if (numberMatch) {
      sections.push({
        number: numberMatch[1].replace(/\.$/, ''),
        title: numberMatch[2].trim(),
        position: sectionMatch.index
      });
    } else {
      // No number, just title
      sections.push({
        number: '',
        title: fullText,
        position: sectionMatch.index
      });
    }
  }
  
  // Match DocumentNumbering.tsx logic exactly
  let currentSection = 0;
  let currentSubsection = 0;
  let currentSubsubsection = 0;
  let paragraphCounter = 0;
  let currentLevel = 0;
  let currentFullSection = '';
  
  // Second pass: extract paragraphs with proper numbering
  let paragraphMatch;
  const documentStructure: any[] = [];
  
  while ((paragraphMatch = paragraphRegex.exec(content)) !== null) {
    const paragraphText = paragraphMatch[1].trim();
    
    // Skip short paragraphs or header content
    if (paragraphText.length < 30) continue;
    if (paragraphMatch.index < contentStartIndex) continue;
    
    // Find which section this paragraph belongs to
    let currentSectionIndex = -1;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].position < paragraphMatch.index) {
        currentSectionIndex = i;
        break;
      }
    }
    
    if (currentSectionIndex >= 0) {
      const section = sections[currentSectionIndex];
      const parts = section.number.split('.');
      
      // Update section tracking based on the header depth
      // IMPORTANT: Compare the FULL section number, not just parts
      // This ensures we reset counter when moving from 1.1.1 to 1.1.1.1
      if (section.number !== currentFullSection) {
        // We've moved to a new section, reset paragraph counter
        paragraphCounter = 0;
        currentFullSection = section.number;
        
        // Update the parsed components for backward compatibility
        currentSection = parseInt(parts[0]) || 0;
        currentSubsection = parseInt(parts[1]) || 0;
        currentSubsubsection = parseInt(parts[2]) || 0;
        
        // Determine current level based on section parts
        if (parts.length >= 4) {
          currentLevel = 4;
        } else if (parts.length === 3) {
          currentLevel = 3;
        } else if (parts.length === 2) {
          currentLevel = 2;
        } else {
          currentLevel = 1;
        }
      }
      
      // Increment paragraph counter
      paragraphCounter++;
    } else {
      // Before any section
      currentSection = 0;
      paragraphCounter++;
      currentLevel = 0;
    }
    
    // Build paragraph number matching DocumentNumbering.tsx logic
    let paragraphNumber = '';
    if (currentFullSection && currentFullSection.split('.').length >= 4) {
      // We're in a deep section (e.g., 1.1.1.1 or deeper)
      // Always use the full section number for deep nesting
      paragraphNumber = `${currentFullSection}.${paragraphCounter}`;
    } else if (currentLevel >= 4 && currentFullSection) {
      // Backup check for deep sections
      paragraphNumber = `${currentFullSection}.${paragraphCounter}`;
    } else if (currentLevel === 3 && currentSubsubsection > 0) {
      // We're in a subsubsection
      paragraphNumber = `${currentSection}.${currentSubsection}.${currentSubsubsection}.${paragraphCounter}`;
    } else if (currentLevel >= 2 && currentSubsection > 0) {
      // We're in a subsection - add paragraph as third level
      paragraphNumber = `${currentSection}.${currentSubsection}.${paragraphCounter}`;
    } else if (currentLevel >= 1 && currentSection > 0) {
      // We're in a main section but no subsection yet
      paragraphNumber = `${currentSection}.${paragraphCounter}`;
    } else {
      // Before any section or no sections
      paragraphNumber = `0.${paragraphCounter}`;
    }
    
    // Calculate lines this paragraph will take (same as editor)
    const estimatedLines = Math.max(1, Math.ceil(paragraphText.length / CHARS_PER_LINE));
    
    // Check if we need a new page (same logic as editor)
    if (linesOnCurrentPage + estimatedLines > LINES_PER_PAGE && linesOnCurrentPage > 0) {
      currentPage++;
      linesOnCurrentPage = 0;
      // DO NOT reset globalLineCounter - it should be continuous throughout the document
      // globalLineCounter continues counting from where it left off
    }
    
    // Store the paragraph with correct page and line info
    documentStructure.push({
      text: paragraphText,
      paragraphNumber: paragraphNumber,
      page: currentPage,
      line: globalLineCounter, // Line number where paragraph starts
      index: documentStructure.length
    });
    
    // Update counters for next iteration
    linesOnCurrentPage += estimatedLines;
    globalLineCounter += estimatedLines;
  }
  
  return documentStructure;
}

// Generate OPR feedback with ACCURATE text locations
function generateAIFeedback(content: string, feedbackCount: number = 10, pages: number = 5): any[] {
  const documentStructure = extractParagraphsWithNumbers(content, pages);
  
  // If we don't have enough content, return empty
  if (documentStructure.length === 0) {
    return [];
  }
  
  // Select random paragraphs for feedback, ensuring good distribution
  const selectedItems: any[] = [];
  const totalParagraphs = documentStructure.length;
  const step = Math.max(1, Math.floor(totalParagraphs / feedbackCount));
  
  for (let i = 0; i < Math.min(feedbackCount, totalParagraphs); i++) {
    const index = Math.min(i * step, totalParagraphs - 1);
    selectedItems.push(documentStructure[index]);
  }
  
  // Generate realistic feedback
  const feedbackTypes = ['A', 'S', 'C'];
  const components = ['Technical Review', 'Legal Review', 'Editorial Review', 'OPR Review', 'Safety Review'];
  const pocData = [
    { name: 'Col Anderson', phone: '555-0201', email: 'anderson.j@af.mil' },
    { name: 'Maj Williams', phone: '555-0202', email: 'williams.m@af.mil' },
    { name: 'Capt Davis', phone: '555-0203', email: 'davis.k@af.mil' },
    { name: 'Lt Johnson', phone: '555-0204', email: 'johnson.l@af.mil' },
    { name: 'MSgt Brown', phone: '555-0205', email: 'brown.r@af.mil' }
  ];
  
  const feedback = selectedItems.map((item, i) => {
    // Determine feedback type
    const rand = Math.random();
    const type = rand < 0.2 ? 'C' : rand < 0.6 ? 'S' : 'A';
    const poc = pocData[i % pocData.length];
    
    // Extract actual phrase from the selected paragraph
    const words = item.text.split(' ');
    const startWord = Math.floor(Math.random() * Math.max(1, words.length - 10));
    const originalPhrase = words.slice(startWord, startWord + 8).join(' ');
    
    // Calculate which line within the paragraph this phrase appears on
    // Estimate based on word position (assuming ~10-12 words per line)
    const WORDS_PER_LINE = 12;
    const lineOffset = Math.floor(startWord / WORDS_PER_LINE);
    // Subtract 1 to match editor's 0-based internal counting that displays as 1-based
    const actualLineNumber = Math.max(1, item.line + lineOffset - 1);
    
    // Generate improved version based on type
    let improvedPhrase = originalPhrase;
    let comment = 'Professional Air Force editorial improvement';
    let justification = '';
    
    if (type === 'A') {
      // Administrative - spelling, grammar, and terminology fixes
      const adminChanges = [
        { from: /personnel/g, to: 'members' },
        { from: /members/g, to: 'personnel' },
        { from: /will/g, to: 'shall' },
        { from: /should/g, to: 'must' },
        { from: /must/g, to: 'shall' },
        { from: /ensure/g, to: 'verify' },
        { from: /verify/g, to: 'ensure' },
        { from: /utilize/g, to: 'use' },
        { from: /implement/g, to: 'execute' },
        { from: /execute/g, to: 'implement' },
        { from: /provides/g, to: 'furnishes' },
        { from: /comprehensive/g, to: 'complete' },
        { from: /complete/g, to: 'comprehensive' },
        { from: /requirements/g, to: 'criteria' },
        { from: /criteria/g, to: 'requirements' }
      ];
      
      improvedPhrase = originalPhrase;
      // Apply 2-3 random changes to make it different
      const selectedChanges = adminChanges.sort(() => 0.5 - Math.random()).slice(0, 3);
      let changesMade = false;
      
      for (const change of selectedChanges) {
        if (originalPhrase.match(change.from)) {
          improvedPhrase = improvedPhrase.replace(change.from, change.to);
          changesMade = true;
        }
      }
      
      // If no changes were made, rephrase the entire thing
      if (!changesMade || improvedPhrase === originalPhrase) {
        const wordCount = originalPhrase.split(' ').length;
        if (wordCount > 5) {
          // Rephrase by rearranging or substituting
          improvedPhrase = originalPhrase
            .replace(/^The /, 'This ')
            .replace(/^This /, 'The ')
            .replace(/ is /g, ' remains ')
            .replace(/ are /g, ' remain ')
            .replace(/ has /g, ' maintains ')
            .replace(/ have /g, ' maintain ');
          
          // If still the same, add "shall" or "must" at the beginning
          if (improvedPhrase === originalPhrase) {
            improvedPhrase = 'Personnel shall ' + originalPhrase.charAt(0).toLowerCase() + originalPhrase.slice(1);
          }
        }
      }
      
      comment = 'Standardize terminology and correct administrative errors';
      justification = 'Administrative correction for consistency with AFI style guide';
      
    } else if (type === 'S') {
      // Substantive - significant rephrasing for clarity
      const words = originalPhrase.split(' ');
      
      if (words.length > 6) {
        // Rephrase longer sentences more substantially
        const rephrasings = [
          () => {
            // Active to passive voice or vice versa
            if (originalPhrase.includes(' provides ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) provides/, 'provision is made by $1 for');
            } else if (originalPhrase.includes(' implements ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) implements/, 'implementation is conducted by $1 for');
            } else if (originalPhrase.includes(' ensures ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) ensures/, 'assurance is provided by $1 that');
            } else {
              // Generic rephrasing
              improvedPhrase = `To ${originalPhrase.toLowerCase().replace(/^the |^this |^a /, '')}`;
            }
          },
          () => {
            // Restructure sentence
            const midPoint = Math.floor(words.length / 2);
            const firstHalf = words.slice(0, midPoint).join(' ');
            const secondHalf = words.slice(midPoint).join(' ');
            improvedPhrase = `${secondHalf}, thereby ${firstHalf}`;
          },
          () => {
            // Add clarifying language
            improvedPhrase = `Specifically, ${originalPhrase.toLowerCase()}, which enhances operational effectiveness`;
          },
          () => {
            // Simplify complex phrases
            improvedPhrase = originalPhrase
              .replace(/in accordance with/g, 'per')
              .replace(/in order to/g, 'to')
              .replace(/at this time/g, 'now')
              .replace(/due to the fact that/g, 'because')
              .replace(/in the event that/g, 'if')
              .replace(/is able to/g, 'can')
              .replace(/is required to/g, 'must');
          }
        ];
        
        // Pick a random rephrasing strategy
        const strategy = rephrasings[Math.floor(Math.random() * rephrasings.length)];
        strategy();
        
        // Ensure we actually changed something
        if (improvedPhrase === originalPhrase) {
          improvedPhrase = `For clarity, ${originalPhrase.toLowerCase()}`;
        }
      } else {
        // For shorter phrases, make word substitutions
        improvedPhrase = originalPhrase
          .replace(/manages/g, 'oversees')
          .replace(/oversees/g, 'supervises')
          .replace(/provides/g, 'delivers')
          .replace(/ensures/g, 'guarantees')
          .replace(/system/g, 'framework')
          .replace(/framework/g, 'system');
      }
      
      comment = 'Improve clarity and directness of language';
      justification = 'Substantive improvement to enhance readability and comprehension';
      
    } else {
      // Critical - add missing required elements
      const criticalAdditions = [
        'in accordance with DoD Directive 5000.01',
        'per AFI 33-360 requirements',
        'as mandated by AFPD 10-6',
        'following NIST 800-53 controls',
        'compliant with FISMA standards'
      ];
      
      const addition = criticalAdditions[Math.floor(Math.random() * criticalAdditions.length)];
      improvedPhrase = `${originalPhrase} ${addition}`;
      comment = 'Add required compliance reference';
      justification = 'Critical: Missing mandatory regulatory citation required for publication';
    }
    
    return {
      id: `opr_${Date.now()}_${i}`,
      component: components[i % components.length],
      pocName: poc.name,
      pocPhone: poc.phone,
      pocEmail: poc.email,
      commentType: type,
      page: String(item.page),  // ACTUAL page where text appears
      paragraphNumber: item.paragraphNumber,  // ACTUAL paragraph number
      lineNumber: String(actualLineNumber),  // ACTUAL line number where the phrase appears
      coordinatorComment: comment,
      changeFrom: originalPhrase,
      changeTo: improvedPhrase,
      coordinatorJustification: justification,
      resolution: '',
      originatorJustification: '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  });
  
  return feedback;
}

// Generate document content with deep nesting
async function generateAIDocument(template: string, pages: number, feedbackCount: number, customSealImage?: string, customHeaderData?: any): Promise<{
  content: string;
  feedback: any[];
  title: string;
}> {
  const templateDescriptions: Record<string, string> = {
    technical: 'technical documentation with deep hierarchical structure',
    policy: 'organizational policy document with detailed subsections',
    training: 'training manual with nested modules and lessons',
    sop: 'standard operating procedures with detailed steps',
    'af-manual': 'Air Force technical manual with military-standard numbering'
  };

  const deepStructurePrompt = `
CRITICAL: Create a document with DEEP HIERARCHICAL STRUCTURE using the following numbering system WITH PROPER INDENTATION:
- Level 1: <h2>1. Main Section</h2> (no indent)
- Level 2: <h3 style="margin-left: 20px;">1.1 Subsection</h3> (20px indent)
- Level 3: <h4 style="margin-left: 40px;">1.1.1 Sub-subsection</h4> (40px indent)
- Level 4: <h5 style="margin-left: 60px;">1.1.1.1 Detail Level</h5> (60px indent)
- Level 5: <h6 style="margin-left: 80px;">1.1.1.1.1 Fine Detail</h6> (80px indent)

PARAGRAPH NUMBERING REQUIREMENTS:
- EACH SECTION (including subsections like "1.1.1.2 Session Handling") MUST have 2-3 numbered paragraphs
- For a section numbered 1.1.1.2, the paragraphs should be:
  - 1.1.1.2.1. First paragraph (80-120 words)
  - 1.1.1.2.2. Second paragraph (80-120 words)  
  - 1.1.1.2.3. Third paragraph (80-120 words)
- Format: <p style="margin-left: XXpx;">1.1.1.2.1. [Paragraph content here...]</p>
- The paragraph number should be at the START of the paragraph text
- Include a period and space after the paragraph number
- CRITICAL: Each paragraph MUST be at least 80 words (4-6 sentences)

INDENTATION REQUIREMENTS:
- Each deeper level MUST be indented 20px more than its parent
- Paragraphs following each heading must have the SAME indentation as their heading
- Use inline style="margin-left: XXpx;" for indentation

STRUCTURE REQUIREMENTS:
1. Each main section (1, 2, 3) must have at least 2-3 subsections (1.1, 1.2, 1.3)
2. Each subsection must have at least 2 sub-subsections (1.1.1, 1.1.2)
3. Include some sections that go to level 4 (1.1.1.1, 1.1.1.2) and level 5 (1.1.1.1.1, 1.1.1.1.2)
4. CRITICAL: Numbers must INCREMENT properly:
   - After 1.1.1.1 comes 1.1.1.2 (NOT another 1.1.1.1)
   - After 1.1.1.1.1 comes 1.1.1.1.2 (NOT another 1.1.1.1.1)
   - NEVER repeat the same section number
5. Use proper HTML heading tags (h2 through h6) for hierarchy
6. Each level should have meaningful content in <p> tags WITH SAME INDENTATION and PARAGRAPH NUMBERS

PARAGRAPH CONTENT REQUIREMENTS:
- IMPORTANT: Each paragraph MUST be 4-6 sentences long (approximately 80-120 words)
- Provide comprehensive details, explanations, and context
- Include specific examples, requirements, or procedures
- Use complete, detailed sentences that fully explain the topic
- Do NOT use short, single-sentence paragraphs
- Each paragraph starts with its number (e.g., "1.1.1.1. ")`;

  const templatePrompts: Record<string, string> = {
    'af-manual': `Generate exactly ${pages} pages of Air Force technical manual with DEEP HIERARCHICAL STRUCTURE. 

${deepStructurePrompt}

SPECIFIC REQUIREMENTS FOR AIR FORCE MANUAL:
- DO NOT include the header (BY ORDER OF..., AFI title, etc.) - this will be added automatically
- Start directly with the main content sections
- Use hierarchical numbering with appropriate depth (1, 1.1, 1.1.1, 1.1.1.1, etc.)
- Maximum depth should be 4 levels (e.g., 1.1.1.1) for standard Air Force documents
- Let the AI determine appropriate section titles and structure based on the topic

- Use military terminology and formal language
- Include compliance statements and regulatory references
- Add "Table" references where appropriate
- Include "Note:", "WARNING:", and "CAUTION:" statements
- Each paragraph MUST be 4-6 sentences (80-120 words)
- CRITICAL: EVERY <p> tag MUST include style="margin-bottom: 1.5em; line-height: 1.8;"
- CRITICAL: Indented <p> tags need style="margin-left: XXpx; margin-bottom: 1.5em; line-height: 1.8;"
- Write comprehensive, detailed paragraphs that fully explain each topic
- Include specific procedures, requirements, and examples in each paragraph
- Each page should have approximately 600-700 words
- Total content: ${pages * 650} words`,

    technical: `Generate exactly ${pages} pages of technical documentation with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Focus on software/system architecture
- Include implementation details at deeper levels
- Add configuration examples at level 4-5
- Use technical terminology
- Include code snippets in <pre><code> blocks at deeper levels
- Each paragraph MUST be 4-6 sentences (80-120 words)
- CRITICAL: EVERY <p> tag MUST include style="margin-bottom: 1.5em; line-height: 1.8;"
- CRITICAL: Indented <p> tags need style="margin-left: XXpx; margin-bottom: 1.5em; line-height: 1.8;"
- Provide detailed technical explanations with examples`,

    policy: `Generate exactly ${pages} pages of organizational policy with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Include compliance requirements at deeper levels
- Add specific procedures at levels 3-4
- Include enforcement details at level 5
- Use formal policy language`,

    training: `Generate exactly ${pages} pages of training manual with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Learning objectives at level 2
- Detailed lessons at level 3
- Exercises at level 4
- Assessment criteria at level 5`,

    sop: `Generate exactly ${pages} pages of SOP with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Main procedures at level 1
- Detailed steps at level 2-3
- Specific actions at level 4
- Quality checks at level 5`
  };

  const prompt = templatePrompts[template] || templatePrompts.technical;

  try {
    // Use OpenRouter API - same as the working script
    const messages = [
      {
        role: 'system',
        content: 'You are an expert technical writer for the US Air Force. Generate well-structured technical documentation with deep hierarchical numbering following military standards. CRITICAL: Every paragraph MUST start with its paragraph number (e.g., "1.1.1.2.1. ") and each section must have 2-3 numbered paragraphs of at least 80 words each.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Document Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // Same model as working script
        messages: messages,
        temperature: 0.7,
        max_tokens: 8000  // Increased for deeper structure
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    let content = data.choices[0]?.message?.content || '';
    
    // Clean up the content
    let cleanedContent = content
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Generate title
    const titles: Record<string, string> = {
      'af-manual': 'AIR FORCE INSTRUCTION 36-2903',
      'technical': 'Technical Documentation',
      'policy': 'Organizational Policy',
      'training': 'Training Manual',
      'sop': 'Standard Operating Procedures'
    };
    
    const title = titles[template] || 'Document';
    
    // Ensure proper HTML structure
    if (!cleanedContent.includes('<h1>')) {
      cleanedContent = `<h1>${title}</h1>\n${cleanedContent}`;
    }
    
    // Generate Air Force header for ALL templates
    let afHeader = '';
    
    // Load seal image - use custom if provided, otherwise load default
    let sealBase64;
    if (customSealImage) {
      // Use the custom seal image provided in the request
      sealBase64 = customSealImage;
    } else {
      // Load the default Air Force seal image (now with color)
      try {
        const sealPath = path.join(__dirname, '../../../frontend/public/images/air-force-seal.png');
        if (fs.existsSync(sealPath)) {
          const sealBuffer = fs.readFileSync(sealPath);
          sealBase64 = `data:image/png;base64,${sealBuffer.toString('base64')}`;
          console.log('Loaded color Air Force seal, size:', sealBuffer.length, 'bytes');
        } else {
          console.error('Air Force seal image not found at:', sealPath);
          // Fallback blue seal with gold border
          sealBase64 = 'data:image/svg+xml;base64,' + Buffer.from(`
            <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="58" fill="#FFD700" stroke="#FFD700" stroke-width="4"/>
              <circle cx="60" cy="60" r="54" fill="#002F6C"/>
              <text x="60" y="65" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">USAF</text>
            </svg>
          `).toString('base64');
        }
      } catch (err) {
        console.error('Failed to load Air Force seal image:', err);
        // Fallback blue seal with gold border
        sealBase64 = 'data:image/svg+xml;base64,' + Buffer.from(`
          <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="58" fill="#FFD700" stroke="#FFD700" stroke-width="4"/>
            <circle cx="60" cy="60" r="54" fill="#002F6C"/>
            <text x="60" y="65" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">USAF</text>
          </svg>
        `).toString('base64');
      }
    }
    
    // Extract header data with defaults
    console.log('Custom header data received:', customHeaderData);
    const headerConfig = {
      byOrderOf: customHeaderData?.byOrderOf || 'BY ORDER OF THE',
      secretary: customHeaderData?.secretary || 'SECRETARY OF THE AIR FORCE',
      organization: customHeaderData?.organization || 'DEPARTMENT OF THE AIR FORCE',
      documentType: customHeaderData?.documentType || (template === 'af-manual' ? 'AIR FORCE INSTRUCTION 36-2903' : template === 'policy' ? 'POLICY DIRECTIVE 13-6' : template === 'technical' ? 'TECHNICAL MANUAL' : template === 'training' ? 'TRAINING GUIDE' : 'STANDARD OPERATING PROCEDURE'),
      documentDate: customHeaderData?.documentDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      subject: customHeaderData?.subject || (template === 'af-manual' ? 'DRESS AND APPEARANCE STANDARDS' : template === 'technical' ? 'System Architecture & Implementation' : template === 'policy' ? 'Nuclear, Space, Missile, Command and Control Operations' : template === 'training' ? 'Personnel Development' : 'Operational Guidelines'),
      category: customHeaderData?.category || (template === 'policy' ? 'SPACE POLICY' : template === 'technical' ? 'TECHNICAL DOCUMENTATION' : template === 'training' ? 'TRAINING AND EDUCATION' : 'OPERATIONS'),
      compliance: customHeaderData?.compliance || 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
      accessibility: customHeaderData?.accessibility || 'Publications and forms are available on the e-Publishing website at',
      accessibilityUrl: customHeaderData?.accessibilityUrl || 'http://www.e-publishing.af.mil',
      releasability: customHeaderData?.releasability || 'There are no releasability restrictions on this publication.',
      opr: customHeaderData?.opr || 'SF/S5S',
      certifiedBy: customHeaderData?.certifiedBy || 'SF/S5/8',
      certifiedByName: customHeaderData?.certifiedByName || '(Lt Gen Philip Garrant)',
      supersedes: customHeaderData?.supersedes || '',
      pages: customHeaderData?.totalPages || pages
    };
    
    // Add styles and header HTML - matching official Air Force document layout
    afHeader = `<style>
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
  
  /* Page layout */
  @page {
    size: 8.5in 11in;
    margin: 0;
  }
  
  /* Content styles */
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
<div class="air-force-document-header">
  <div class="header-top">
    <div class="header-left">
      <div class="by-order">${headerConfig.byOrderOf}</div>
      <div class="secretary">${headerConfig.secretary}</div>
      <img src="${sealBase64}" alt="Air Force Seal" class="seal" />
    </div>
    <div class="header-right">
      <div class="organization">${headerConfig.organization}</div>
      <div class="document-type">${headerConfig.documentType}</div>
      <div class="date">${headerConfig.documentDate}</div>
      <div class="subject">${headerConfig.subject}</div>
      <div class="category">${headerConfig.category}</div>
    </div>
  </div>
  
  <div class="compliance">
    ${headerConfig.compliance}
  </div>
  
  <div class="info-section">
    <span class="section-label">ACCESSIBILITY:</span>
    <span class="section-content">${headerConfig.accessibility} <a href="${headerConfig.accessibilityUrl}" style="color: #0066CC;">${headerConfig.accessibilityUrl}</a>.</span>
  </div>
  
  <div class="info-section">
    <span class="section-label">RELEASABILITY:</span>
    <span class="section-content">${headerConfig.releasability}</span>
  </div>
  
  <div class="footer-section">
    <div class="opr">
      <span class="section-label">OPR:</span> ${headerConfig.opr}
    </div>
    <div class="certified">
      Certified by: ${headerConfig.certifiedBy}<br />
      ${headerConfig.certifiedByName}
    </div>
  </div>
  ${headerConfig.supersedes ? `
  <div class="supersedes-section">
    <span class="section-label">Supersedes:</span> ${headerConfig.supersedes}
    <span class="pages">Pages: ${headerConfig.pages}</span>
  </div>` : `
  <div class="pages-only">
    <span class="pages">Pages: ${headerConfig.pages}</span>
  </div>`}
</div>
`;
    cleanedContent = afHeader + cleanedContent;
    
    // Generate AI-based OPR feedback using actual document content
    const oprFeedback = generateAIFeedback(cleanedContent, feedbackCount, pages);
    
    return {
      content: cleanedContent,
      feedback: oprFeedback,
      title: title
    };
  } catch (error) {
    console.error('Error generating AI document:', error);
    throw error;
  }
}

// POST /api/ai-document-generator
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      template = 'technical', 
      pages = 5, 
      feedbackCount = 10,
      sealImage,
      headerData 
    } = req.body;
    
    // Validate inputs
    if (!['technical', 'policy', 'training', 'sop', 'af-manual'].includes(template)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }
    
    if (pages < 1 || pages > 20) {
      return res.status(400).json({ error: 'Pages must be between 1 and 20' });
    }
    
    if (feedbackCount < 0 || feedbackCount > 50) {
      return res.status(400).json({ error: 'Feedback count must be between 0 and 50' });
    }
    
    console.log(`🚀 Generating AI document: template=${template}, pages=${pages}, feedback=${feedbackCount}`);
    
    // Generate the document
    const { content, feedback, title } = await generateAIDocument(template, pages, feedbackCount, sealImage, headerData);
    
    // Find any existing user
    let user = await prisma.user.findFirst();
    
    if (!user) {
      return res.status(400).json({ error: 'No users found in database. Please create a user first.' });
    }
    
    // Create the document in the database
    const document = await prisma.document.create({
      data: {
        title: `${title} - ${new Date().toLocaleDateString()}`,
        description: `AI-generated ${template} document with deep hierarchical structure`,
        category: 'AI_GENERATED',
        status: 'DRAFT',
        mimeType: 'text/html',
        fileName: `${template}_${Date.now()}.html`,
        originalName: `${template}_${Date.now()}.html`,
        fileSize: content.length,
        checksum: `${Date.now()}`,
        storagePath: `/ai-generated/${template}_${Date.now()}.html`,
        customFields: {
          template: template,
          aiGenerated: true,
          generatedBy: 'AI',
          deepNesting: true,
          maxNestingLevel: 5,
          classification: 'UNCLASSIFIED',
          htmlContent: content,
          editableContent: content.includes('air-force-document-header') ? 
            content.substring(content.indexOf('</div>\n<h1')) : content, // Remove header for editor if exists
          content: content.replace(/<[^>]*>/g, ''), // Plain text version
          headerHtml: content.includes('air-force-document-header') ? 
            content.substring(0, content.indexOf('</div>\n<h1')) : '',
          hasCustomHeader: content.includes('air-force-document-header'),
          documentStyles: `
            <style>
              h2 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
              h3 { font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 8px; margin-left: 20px; }
              h4 { font-size: 12pt; font-weight: bold; margin-top: 12px; margin-bottom: 6px; margin-left: 40px; }
              h5 { font-size: 11pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; margin-left: 60px; }
              h6 { font-size: 11pt; font-weight: bold; font-style: italic; margin-top: 8px; margin-bottom: 4px; margin-left: 80px; }
              p { font-size: 11pt; margin-bottom: 10px; text-align: justify; }
            </style>
          `,
          crmFeedback: feedback,
          totalComments: feedback.length,
          hasCriticalComments: feedback.some((f: any) => f.commentType === 'C'),
          lastFeedbackAt: feedback.length > 0 ? new Date().toISOString() : null
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });
    
    console.log(`✅ Document saved to database with ID: ${document.id}`);
    
    res.json({
      success: true,
      documentId: document.id,
      title: document.title,
      feedbackCount: feedback.length,
      message: `Document generated successfully with ${pages} pages and ${feedback.length} feedback items`
    });
    
  } catch (error) {
    console.error('Error in AI document generator endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;