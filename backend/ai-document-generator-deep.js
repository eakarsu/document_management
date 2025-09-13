#!/usr/bin/env node

/**
 * AI-Powered Document Generator with Deep Paragraph Nesting
 * Supports hierarchical numbering: 1, 1.1, 1.1.1, 1.1.1.1, 1.1.1.1.1
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_management'
    }
  }
});

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 AI-Powered Document Generator with Deep Nesting (OpenRouter)

Usage: node ai-document-generator-deep.js <template> <pages> <feedbacks> [title]

Arguments:
  template   - Document type: technical, policy, training, sop, af-manual
  pages      - Number of pages to generate (1-20)
  feedbacks  - Number of feedback entries (0-50)
  title      - Optional: Custom document title

Features:
  ✅ Deep paragraph nesting (1.1.1.1.1 levels)
  ✅ Uses AI (GPT-4/Claude) to generate realistic content
  ✅ Creates proper hierarchical document structure
  ✅ Air Force manual format with proper numbering
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
        max_tokens: 8000  // Increased for deeper structure
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    // Debug: Log what AI returned
    console.log('\n=== AI Response (first 1000 chars) ===');
    console.log(aiContent.substring(0, 1000));
    console.log('\n=== AI Response contains newlines:', aiContent.includes('\n'));
    console.log('=== AI Response contains <p> tags:', aiContent.includes('<p>'));
    console.log('=== AI Response contains <h tags:', aiContent.includes('<h'));
    
    return aiContent;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

// Generate OPR feedback with ACCURATE text locations
// Fix duplicate section numbers in generated content
function fixDuplicateNumbers(content) {
  // Track seen numbers at each level
  const seenNumbers = {};
  
  // Process each heading level
  for (let level = 2; level <= 6; level++) {
    const regex = new RegExp(`<h${level}[^>]*>(\\d+(?:\\.\\d+)*)\\s+([^<]+)<\\/h${level}>`, 'gi');
    const matches = [...content.matchAll(regex)];
    
    matches.forEach((match) => {
      const originalNumber = match[1];
      const title = match[2];
      
      // If we've seen this number before, increment it
      if (seenNumbers[originalNumber]) {
        // Get the parent and increment the last digit
        const parts = originalNumber.split('.');
        let lastPart = parseInt(parts[parts.length - 1]);
        
        // Find next available number
        let newNumber;
        do {
          lastPart++;
          parts[parts.length - 1] = lastPart.toString();
          newNumber = parts.join('.');
        } while (seenNumbers[newNumber]);
        
        // Replace in content
        const oldHeading = match[0];
        const newHeading = oldHeading.replace(originalNumber, newNumber);
        content = content.replace(oldHeading, newHeading);
        
        seenNumbers[newNumber] = true;
      } else {
        seenNumbers[originalNumber] = true;
      }
    });
  }
  
  return content;
}

async function generateAIFeedback(content, feedbackCount, pages) {
  if (feedbackCount === 0) return [];
  
  // Parse the document to extract actual visible text and track locations
  const documentStructure = [];
  
  // Remove all HTML tags to get plain text for accurate line counting
  const plainText = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[^;]+;/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Find where actual content starts (after header)
  let contentStartIndex = plainText.findIndex(line => 
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
  const sections = [];
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
  
  // If we don't have enough content, return empty
  if (documentStructure.length === 0) {
    return [];
  }
  
  // Select random paragraphs for feedback, ensuring good distribution
  const selectedItems = [];
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
    { name: 'Lt Martinez', phone: '555-0204', email: 'martinez.r@af.mil' },
    { name: 'MSgt Johnson', phone: '555-0205', email: 'johnson.t@af.mil' }
  ];
  
  // Generate feedback with ACTUAL locations where text appears
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
async function generateAIDocument(template, pages, feedbackCount) {
  const templateDescriptions = {
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
- Each paragraph starts with its number (e.g., "1.1.1.1. ")

EXAMPLE STRUCTURE WITH PROPER INDENTATION AND NUMBERED PARAGRAPHS:
<h2>1. System Architecture</h2>
<p>1.1. The system architecture provides a comprehensive framework for managing all Air Force personnel and operational requirements across multiple domains. This architecture encompasses both hardware and software components designed to ensure maximum reliability, security, and scalability. The framework has been developed in accordance with Department of Defense guidelines and incorporates industry best practices for military information systems. All components are designed to operate in both connected and disconnected environments, ensuring continuous operational capability.</p>
<p>1.2. Additional architectural considerations include redundancy, failover mechanisms, and disaster recovery protocols. The system maintains multiple backup pathways for critical operations and automatically switches to secondary systems in case of primary system failure. Load balancing across distributed servers ensures optimal performance during peak usage periods. Regular system health checks and automated diagnostics help identify potential issues before they impact operational readiness.</p>

<h3 style="margin-left: 20px;">1.1 Core Components</h3>
<p style="margin-left: 20px;">1.1.1. The core components of the system consist of multiple integrated modules that work together to provide comprehensive functionality. Each component has been carefully designed to handle specific aspects of the operational requirements while maintaining seamless integration with other system elements. The modular architecture allows for independent updates and maintenance without affecting overall system availability. Security considerations have been embedded at every level of the component design to ensure data protection and system integrity.</p>
<p style="margin-left: 20px;">1.1.2. Component interoperability follows established military standards and protocols to ensure compatibility with existing Air Force systems. All interfaces are standardized using common data formats and communication protocols. Real-time synchronization between components ensures data consistency across the entire system. Performance monitoring tools track component health and automatically alert administrators to potential issues.</p>

<h4 style="margin-left: 40px;">1.1.1 Authentication Module</h4>
<p style="margin-left: 40px;">1.1.1.1. The authentication module provides robust identity verification and access control mechanisms for all system users. This module implements multi-factor authentication protocols including Common Access Card (CAC) integration, biometric verification, and traditional username/password combinations. The system maintains detailed audit logs of all authentication attempts and automatically locks accounts after multiple failed login attempts. Integration with Active Directory and other enterprise identity management systems ensures consistent user access across all Air Force systems.</p>
<p style="margin-left: 40px;">1.1.1.2. Advanced security features include real-time threat detection and response capabilities. The module continuously monitors authentication patterns to identify suspicious activities and potential security breaches. Machine learning algorithms analyze user behavior to establish baseline patterns and flag anomalies for investigation. Automated response protocols can temporarily disable accounts or require additional verification steps when suspicious activities are detected.</p>

<h5 style="margin-left: 60px;">1.1.1.2 Session Handling</h5>
<p style="margin-left: 60px;">1.1.1.2.1. Session management encompasses the complete lifecycle of user sessions from initial authentication through logout or timeout. The system generates cryptographically secure session tokens with configurable expiration times based on user roles and security requirements. All session data is encrypted both at rest and in transit using military-grade encryption standards. The session handler implements automatic timeout mechanisms that require re-authentication after periods of inactivity to prevent unauthorized access from unattended terminals.</p>
<p style="margin-left: 60px;">1.1.1.2.2. Advanced session features include concurrent session detection and management across multiple devices and locations. The system can enforce policies limiting the number of simultaneous sessions per user and automatically terminate older sessions when new ones are initiated. Geographic and temporal access controls can restrict session creation based on location and time parameters. Session replay protection mechanisms prevent captured session data from being used to gain unauthorized access.</p>
<p style="margin-left: 60px;">1.1.1.2.3. Session monitoring and analytics provide real-time visibility into active sessions across the entire system. Administrators can view detailed session information including user identity, originating IP address, session duration, and accessed resources. Suspicious session activities trigger automated alerts and can initiate defensive actions such as forced logout or account lockdown. Historical session data is retained for audit purposes and forensic analysis in accordance with Air Force data retention policies.</p>

<h5 style="margin-left: 60px;">1.1.1.1 Token Management</h5>
<p style="margin-left: 60px;">Token management encompasses the complete lifecycle of security tokens used for session management and API authentication. The system generates cryptographically secure tokens with configurable expiration times based on user roles and security requirements. All tokens are encrypted at rest and in transit, with automatic rotation policies to minimize security risks. The token management system includes mechanisms for immediate revocation in case of security incidents or user deauthorization.</p>

<h6 style="margin-left: 80px;">1.1.1.1.1 JWT Implementation</h6>
<p style="margin-left: 80px;">The JSON Web Token (JWT) implementation follows RFC 7519 standards with additional security enhancements specific to military applications. Each token contains encrypted claims including user identity, role assignments, security clearance level, and authorized resource access. The system uses RS256 algorithm for token signing with regularly rotated keys stored in a hardware security module. Token validation occurs at multiple checkpoints throughout the request lifecycle to ensure continuous security verification.</p>

<h6 style="margin-left: 80px;">1.1.1.1.2 Token Refresh Strategy</h6>
<p style="margin-left: 80px;">Refresh mechanism details...</p>

<h5 style="margin-left: 60px;">1.1.1.2 Session Handling</h5>
<p style="margin-left: 60px;">Session management details...</p>

<h4 style="margin-left: 40px;">1.1.2 Database Layer</h4>
<p style="margin-left: 40px;">Database architecture...</p>

<h3 style="margin-left: 20px;">1.2 Security Framework</h3>
<p style="margin-left: 20px;">Security overview...</p>
`;

  const templatePrompts = {
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
  
  console.log(`🤖 Generating ${pages} pages of ${template} with deep paragraph nesting...`);
  
  const messages = [
    {
      role: 'system',
      content: `You are a professional technical writer. Generate WELL-FORMATTED HTML documents with NUMBERED PARAGRAPHS.

CRITICAL HTML REQUIREMENTS:
1. EVERY <p> tag MUST have style="margin-bottom: 1.5em; line-height: 1.8;"
2. EVERY paragraph text MUST START with its paragraph number like "1.1.1.2.1. " at the beginning
3. Each section MUST have 2-3 numbered paragraphs (minimum 80 words each)
4. Use <h2> through <h6> for hierarchy with proper indentation
3. For indented paragraphs, use style="margin-left: XXpx; margin-bottom: 1.5em; line-height: 1.8;"
4. Level 1 (h2): no indent
5. Level 2 (h3): margin-left: 20px
6. Level 3 (h4): margin-left: 40px  
7. Level 4 (h5): margin-left: 60px
8. Level 5 (h6): margin-left: 80px
9. NO introductory text - start with <h2>
10. Each paragraph MUST be visually separated with proper spacing`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  let content = await callOpenRouter(messages);
  
  // Fix any duplicate section numbers the AI might have generated
  content = fixDuplicateNumbers(content);
  
  // Remove intro text but preserve formatting
  content = content
    .replace(/^[^<]*(?=<h)/s, '') // Remove any text before first heading
    .trim();
  
  return content;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting AI Document Generation with Deep Nesting...\n');
    
    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Generate the document
    const htmlContent = await generateAIDocument(template, pages, feedbackCount);
    
    // Clean and validate the HTML
    let cleanedContent = htmlContent;
    
    // Remove any remaining intro text
    cleanedContent = cleanedContent
      .replace(/^[^<]*(?=<h)/s, '') // Remove text before first heading
      .trim();
    
    // Ensure proper HTML structure
    if (!cleanedContent.includes('<h1>')) {
      const titles = {
        'af-manual': 'AIR FORCE INSTRUCTION 36-2903',
        'technical': 'Technical Documentation',
        'policy': 'Organizational Policy',
        'training': 'Training Manual',
        'sop': 'Standard Operating Procedures'
      };
      cleanedContent = `<h1>${customTitle || titles[template]}</h1>\n${cleanedContent}`;
    }
    
    // Clean up duplicate headers and add proper Air Force header for ALL templates
    let afHeader = ''; // Declare afHeader outside the if block
    // Generate header for ALL templates, not just af-manual
    {
      // Remove any existing Air Force headers from the AI-generated content
      cleanedContent = cleanedContent.replace(/<div class="air-force-document-header"[^>]*>[\s\S]*?<\/div>\s*<hr\/>/g, '');
      cleanedContent = cleanedContent.replace(/BY ORDER OF THE SECRETARY OF THE AIR FORCE/g, '');
      cleanedContent = cleanedContent.replace(/<h1>AIR FORCE INSTRUCTION.*?<\/h1>/g, '');
      
      // Load the actual Air Force seal image
      let sealBase64;
      try {
        const fs = require('fs');
        const path = require('path');
        const sealPath = path.join(__dirname, '../frontend/public/images/air-force-seal.png');
        if (fs.existsSync(sealPath)) {
          const sealBuffer = fs.readFileSync(sealPath);
          sealBase64 = `data:image/png;base64,${sealBuffer.toString('base64')}`;
          console.log('✅ Air Force seal loaded successfully');
        } else {
          console.warn('⚠️ Air Force seal not found at:', sealPath);
          // Use a placeholder if seal not found
          sealBase64 = '';
        }
      } catch (error) {
        console.error('❌ Error loading seal:', error.message);
        sealBase64 = '';
      }
      
      // Add the properly formatted Air Force header matching the working frontend version
      afHeader = `
<style>
  .air-force-document-header {
    font-family: 'Times New Roman', Times, serif;
    line-height: 1.4;
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
    background: white;
  }
  
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
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
    margin: 0 auto 1rem auto;
    display: block;
  }
  
  .by-order {
    font-weight: bold;
    font-size: 14pt;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }
  
  .secretary {
    font-weight: bold;
    font-size: 14pt;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }
  
  .instruction-title {
    font-weight: bold;
    font-size: 14pt;
    margin-bottom: 0.5rem;
  }
  
  .date {
    font-size: 12pt;
    margin-bottom: 1rem;
  }
  
  .subject {
    font-size: 12pt;
    font-style: italic;
    margin-bottom: 0.5rem;
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
    margin: 2rem 0 1rem 0;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
  }
  
  .info-section {
    margin: 1rem 0;
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
    margin: 1rem 0;
  }
  
  .footer-section {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    margin-bottom: 2rem;
    font-size: 11pt;
  }
  
  .opr {
    font-weight: bold;
  }
  
  .certified {
    text-align: right;
  }
  
  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 8px;
  }
  
  h4 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 12px;
    margin-bottom: 6px;
  }
  
  h5 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 5px;
  }
  
  h6 {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-top: 8px;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 11pt;
    margin-bottom: 10px;
    text-align: justify;
  }
</style>
<div class="air-force-document-header">
  <div class="header-section">
    <div class="left-section">
      <div class="by-order">BY ORDER OF THE</div>
      <div class="secretary">SECRETARY OF THE AIR FORCE</div>
      <img src="${sealBase64}" alt="Air Force Seal" class="seal" />
    </div>
    <div class="right-section">
      <div class="instruction-title">${template === 'af-manual' ? 'AIR FORCE INSTRUCTION 36-2903' : template === 'technical' ? 'TECHNICAL DOCUMENTATION' : template === 'policy' ? 'POLICY DOCUMENT' : template === 'training' ? 'TRAINING MANUAL' : 'STANDARD OPERATING PROCEDURES'}</div>
      <div class="date">${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
      <div class="subject">${template === 'af-manual' ? 'DRESS AND APPEARANCE STANDARDS' : template === 'technical' ? 'SYSTEM ARCHITECTURE & IMPLEMENTATION' : template === 'policy' ? 'GOVERNANCE AND COMPLIANCE' : template === 'training' ? 'PERSONNEL DEVELOPMENT' : 'OPERATIONAL GUIDELINES'}</div>
      <div class="responsibilities">${template === 'af-manual' ? 'AIRMAN AND FAMILY READINESS' : 'DEPARTMENT OF DEFENSE'}</div>
    </div>
  </div>
  
  <div class="compliance">
    COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
  </div>
  
  <div class="info-section">
    <span class="section-label">ACCESSIBILITY:</span>
    <span class="section-content">
      This publication is available for downloading from the e-Publishing website at www.e-publishing.af.mil.
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
      Certified by: AF/CV (General Larry O. Spencer)<br />
      Pages: ${pages}
    </div>
  </div>
</div>
`;
      cleanedContent = afHeader + cleanedContent;
    }
    
    // Save to file
    const fs = require('fs');
    const filename = `deep_nested_${template}_${Date.now()}.html`;
    fs.writeFileSync(filename, cleanedContent);
    
    console.log(`✅ Document generated successfully!`);
    console.log(`📄 Saved to: ${filename}`);
    console.log(`📊 Template: ${template}`);
    console.log(`📄 Pages: ${pages}`);
    console.log(`💬 Feedback items: ${feedbackCount}`);
    console.log(`🔢 Deep nesting: Up to 5 levels (1.1.1.1.1)`);
    
    // Show structure preview
    console.log('\n📋 Document Structure Preview:');
    const headings = cleanedContent.match(/<h[2-6]>([^<]+)<\/h[2-6]>/g);
    if (headings) {
      headings.slice(0, 10).forEach(h => {
        const level = h.match(/<h(\d)>/)[1];
        const text = h.replace(/<[^>]+>/g, '');
        const indent = '  '.repeat(level - 2);
        console.log(`${indent}${text}`);
      });
      if (headings.length > 10) {
        console.log('  ... and more');
      }
    }
    
    // Store in database for editor access
    console.log('\n💾 Storing document in database...');
    
    try {
      // Find any existing user
      let user = await prisma.user.findFirst();
      
      if (!user) {
        console.error('❌ No users found in database. Please create a user first.');
        console.log('💾 Document still saved to file:', filename);
        return;
      }
      
      console.log(`✅ Using user: ${user.email}`);
      
      // Generate AI-based OPR feedback using actual document content
      const oprFeedback = await generateAIFeedback(cleanedContent, feedbackCount, pages);
      if (oprFeedback.length > 0) {
        console.log(`💬 Generated ${oprFeedback.length} OPR feedback items with actual text references`);
      }
      
      // Create the document - store feedback in customFields
      const document = await prisma.document.create({
        data: {
          title: customTitle || `${template.toUpperCase()} Document - Deep Nested`,
          description: `AI generated ${template} document with deep hierarchical nesting up to level 5`,
          fileName: filename,
          originalName: filename,
          mimeType: 'text/html',
          fileSize: Buffer.byteLength(cleanedContent, 'utf8'),
          checksum: crypto.createHash('md5').update(cleanedContent).digest('hex') + '_' + Date.now(),
          storagePath: `/uploads/${filename}`,
          storageProvider: 'local',
          status: 'DRAFT',
          category: template === 'af-manual' ? 'PUBLICATION' : 'GENERAL',
          tags: [template, 'ai-generated', 'deep-nesting'],
          customFields: {
            template: template,
            pages: pages,
            generatedBy: 'AI',
            deepNesting: true,
            maxNestingLevel: 5,
            classification: 'UNCLASSIFIED',
            htmlContent: cleanedContent,
            editableContent: afHeader ? cleanedContent.replace(afHeader, '') : cleanedContent, // Remove header for editor if exists
            content: cleanedContent, // Store full HTML content for viewer
            plainText: cleanedContent.replace(/<[^>]*>/g, ''), // Plain text version
            headerHtml: afHeader,
            hasCustomHeader: !!afHeader, // Only true if header exists
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
            crmFeedback: oprFeedback,
            totalComments: oprFeedback.length,
            hasCriticalComments: oprFeedback.some(f => f.commentType === 'C'),
            lastFeedbackAt: oprFeedback.length > 0 ? new Date().toISOString() : null
          },
          createdById: user.id,
          organizationId: user.organizationId,
          currentVersion: 1
        }
      });
      
      console.log(`✅ Document saved to database!`);
      console.log(`🔗 Document ID: ${document.id}`);
      console.log(`📝 Edit in browser: http://localhost:3000/editor/${document.id}`);
      console.log(`👁️ View document: http://localhost:3000/documents/${document.id}`);
      
      // If it's an Air Force manual, add workflow
      if (template === 'af-manual') {
        // Get default organization
        const defaultOrg = await prisma.organization.findFirst({
          where: { name: 'Default Organization' }
        });
        
        if (defaultOrg) {
          const workflow = await prisma.documentPublishing.create({
            data: {
              document: {
                connect: { id: document.id }
              },
              organizations: {
                connect: { id: defaultOrg.id }
              },
              status: 'DRAFT',
              workflowId: `workflow_${Date.now()}`
            }
          });
          console.log(`🔄 Workflow created: ${workflow.id}`);
        }
      }
      
    } catch (dbError) {
      console.error('⚠️ Database storage failed:', dbError.message);
      console.log('💾 Document still saved to file:', filename);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
main();