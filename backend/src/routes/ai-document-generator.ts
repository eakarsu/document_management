import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');

const router = Router();
const prisma = new PrismaClient();

// Helper function to get template defaults
function getTemplateDefaults(template: string) {
  const templateMap: Record<string, any> = {
    'af-manual': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE INSTRUCTION 36-2903',
      subject: 'DRESS AND APPEARANCE STANDARDS',
      category: 'PERSONNEL'
    },
    'afi': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE INSTRUCTION',
      subject: 'OPERATIONAL PROCEDURES',
      category: 'OPERATIONS'
    },
    'afpd': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE POLICY DIRECTIVE',
      subject: 'POLICY IMPLEMENTATION',
      category: 'POLICY'
    },
    'afman': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE MANUAL',
      subject: 'PROCEDURES AND GUIDELINES',
      category: 'OPERATIONS'
    },
    'dafi': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION',
      subject: 'DEPARTMENTAL PROCEDURES',
      category: 'ADMINISTRATION'
    },
    'army': { 
      organization: 'DEPARTMENT OF THE ARMY',
      secretary: 'SECRETARY OF THE ARMY',
      documentType: 'ARMY REGULATION 670-1',
      subject: 'WEAR AND APPEARANCE OF ARMY UNIFORMS',
      category: 'PERSONNEL'
    },
    'navy': { 
      organization: 'DEPARTMENT OF THE NAVY',
      secretary: 'SECRETARY OF THE NAVY',
      documentType: 'OPNAVINST 3500.39',
      subject: 'OPERATIONAL RISK MANAGEMENT',
      category: 'OPERATIONS'
    },
    'marine': { 
      organization: 'UNITED STATES MARINE CORPS',
      secretary: 'COMMANDANT OF THE MARINE CORPS',
      documentType: 'MARINE CORPS ORDER 1020.34',
      subject: 'MARINE CORPS UNIFORM REGULATIONS',
      category: 'PERSONNEL'
    },
    'spaceforce': { 
      organization: 'UNITED STATES SPACE FORCE',
      secretary: 'CHIEF OF SPACE OPERATIONS',
      documentType: 'SPACE FORCE INSTRUCTION 36-2903',
      subject: 'SPACE OPERATIONS AND PROCEDURES',
      category: 'SPACE OPERATIONS'
    },
    'dodd': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'DOD DIRECTIVE 5000.01',
      subject: 'THE DEFENSE ACQUISITION SYSTEM',
      category: 'ACQUISITION'
    },
    'dodi': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'DOD INSTRUCTION 5000.02',
      subject: 'OPERATION OF THE DEFENSE ACQUISITION SYSTEM',
      category: 'ACQUISITION'
    },
    'cjcs': { 
      organization: 'JOINT CHIEFS OF STAFF',
      secretary: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF',
      documentType: 'CJCS INSTRUCTION 3170.01',
      subject: 'JOINT CAPABILITIES INTEGRATION',
      category: 'JOINT OPERATIONS'
    },
    'technical': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'TECHNICAL MANUAL',
      subject: 'System Architecture & Implementation',
      category: 'TECHNICAL DOCUMENTATION'
    },
    'policy': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'POLICY DIRECTIVE 13-6',
      subject: 'Nuclear, Space, Missile, Command and Control Operations',
      category: 'SPACE POLICY'
    },
    'training': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'TRAINING GUIDE',
      subject: 'Personnel Development',
      category: 'TRAINING AND EDUCATION'
    },
    'sop': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'STANDARD OPERATING PROCEDURE',
      subject: 'Operational Guidelines',
      category: 'OPERATIONS'
    },
    'oplan': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'OPERATION PLAN',
      subject: 'Strategic Operations Planning',
      category: 'STRATEGIC PLANNING'
    },
    'opord': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'OPERATION ORDER',
      subject: 'Tactical Operations',
      category: 'TACTICAL OPERATIONS'
    },
    'conops': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'CONCEPT OF OPERATIONS',
      subject: 'Operational Concepts',
      category: 'STRATEGIC PLANNING'
    },
    'ttp': { 
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'TACTICS, TECHNIQUES, AND PROCEDURES',
      subject: 'Tactical Employment',
      category: 'TACTICAL OPERATIONS'
    },
    'afjqs': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE JOB QUALIFICATION STANDARD',
      subject: 'Job Qualification Requirements',
      category: 'TRAINING'
    },
    'afto': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE TECHNICAL ORDER',
      subject: 'Technical Procedures',
      category: 'TECHNICAL'
    },
    'afva': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE VISUAL AID',
      subject: 'Visual Training Materials',
      category: 'TRAINING'
    },
    'afh': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE HANDBOOK',
      subject: 'Reference Materials',
      category: 'REFERENCE'
    },
    'afgm': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE GUIDANCE MEMORANDUM',
      subject: 'Interim Guidance',
      category: 'POLICY'
    },
    'afmd': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE MISSION DIRECTIVE',
      subject: 'Mission Requirements',
      category: 'OPERATIONS'
    },
    'dafman': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE MANUAL',
      subject: 'Departmental Procedures',
      category: 'ADMINISTRATION'
    },
    'dafpd': { 
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE',
      subject: 'Departmental Policy',
      category: 'POLICY'
    }
  };
  
  return templateMap[template] || templateMap['technical'];
}

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
  // Adjusted for more accurate Air Force document format
  const LINES_PER_PAGE = 45; // Slightly less to account for margins/headers
  const CHARS_PER_LINE = 75; // Slightly less to account for formatting
  
  // Parse the HTML to extract structured content - works with ANY numbering scheme
  const sectionRegex = /<h[2-6][^>]*>([^<]+)<\/h[2-6]>/gi;
  const paragraphRegex = /<p[^>]*>([^<]+)<\/p>/gi;
  
  // Account for header and TOC pages
  // Header typically takes page 1, TOC takes page 2 (sometimes more)
  // Actual content starts on page 3 or later
  let currentPage = 3; // Start at page 3 (after header and TOC)
  let globalLineCounter = 1; // Start at line 1 for the actual content
  let linesOnCurrentPage = 0;

  // The header and TOC are displayed before the actual content
  // So the first paragraph of actual content is on page 3 or later
  
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
    // For Air Force documents, typical formatting is ~12-15 words per line
    const WORDS_PER_LINE = 12;
    const lineOffset = Math.floor(startWord / WORDS_PER_LINE);
    // The item.line is where the paragraph starts, add the offset for phrase position
    const actualLineNumber = item.line + lineOffset;
    
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

// Generate Table of Contents from document content
function generateTableOfContents(content: string): string {
  const sections: Array<{title: string, number: string, page: number}> = [];

  // Extract headers from content
  const headerRegex = /<h[2-6][^>]*>([^<]+)<\/h[2-6]>/gi;
  let match;

  // Start at page 3 since header is page 1, TOC is page 2
  // Content sections begin on page 3
  let pageNum = 3;
  let lastPosition = 0;

  while ((match = headerRegex.exec(content)) !== null) {
    const headerText = match[1].trim();
    // Extract section number if present
    const numberMatch = headerText.match(/^([\d.]+)\s+(.+)/);
    if (numberMatch) {
      // Estimate page based on position in content
      // More accurate: ~2500 characters per page for Air Force documents
      const pageIncrement = Math.floor((match.index - lastPosition) / 2500);
      pageNum += pageIncrement;
      lastPosition = match.index;

      sections.push({
        number: numberMatch[1],
        title: numberMatch[2],
        page: pageNum
      });
    }
  }

  let tocHtml = `
  <div class="toc-section">
    <h2 class="toc-title">TABLE OF CONTENTS</h2>
    <div style="margin: 2rem 0;">`;

  sections.forEach(section => {
    const indent = (section.number.split('.').length - 1) * 20;
    tocHtml += `
      <div class="toc-entry" style="margin-left: ${indent}px;">
        <span>${section.number} ${section.title}</span>
        <span class="toc-dots"></span>
        <span>${section.page}</span>
      </div>`;
  });

  tocHtml += `
    </div>
  </div>
  <div style="page-break-after: always;"></div>`;

  return tocHtml;
}

// Generate References Section
function generateReferencesSection(template: string): string {
  const references = [
    'DoD Directive 5000.01, "The Defense Acquisition System," September 9, 2020',
    'DoD Instruction 5000.02, "Operation of the Adaptive Acquisition Framework," January 23, 2020',
    'AFI 33-360, "Publications and Forms Management," December 7, 2018',
    'AFMAN 33-363, "Management of Records," March 1, 2008',
    'DAFI 90-160, "Publications and Forms Management," April 14, 2022',
    'Federal Records Act, 44 U.S.C. Chapters 29, 31, and 33',
    'Privacy Act of 1974, 5 U.S.C. 552a',
    'Freedom of Information Act (FOIA), 5 U.S.C. 552'
  ];

  let referencesHtml = `
  <div style="page-break-before: always; margin-top: 2rem;">
    <h2>REFERENCES</h2>
    <ol style="margin-left: 20px;">`;

  references.forEach(ref => {
    referencesHtml += `<li style="margin-bottom: 0.5rem;">${ref}</li>`;
  });

  referencesHtml += `</ol></div>`;
  return referencesHtml;
}

// Generate Glossary/Acronyms Section
function generateGlossarySection(template: string): string {
  const glossary = [
    { term: 'AFI', definition: 'Air Force Instruction' },
    { term: 'AFMAN', definition: 'Air Force Manual' },
    { term: 'AFPD', definition: 'Air Force Policy Directive' },
    { term: 'DAFI', definition: 'Department of the Air Force Instruction' },
    { term: 'DoD', definition: 'Department of Defense' },
    { term: 'DSN', definition: 'Defense Switched Network' },
    { term: 'IAW', definition: 'In Accordance With' },
    { term: 'OPR', definition: 'Office of Primary Responsibility' },
    { term: 'OCR', definition: 'Office of Collateral Responsibility' },
    { term: 'POC', definition: 'Point of Contact' },
    { term: 'RDS', definition: 'Records Disposition Schedule' },
    { term: 'SECAF', definition: 'Secretary of the Air Force' }
  ];

  let glossaryHtml = `
  <div style="page-break-before: always; margin-top: 2rem;">
    <h2>GLOSSARY OF TERMS AND ACRONYMS</h2>
    <dl style="margin-left: 20px;">`;

  glossary.forEach(item => {
    glossaryHtml += `
      <dt style="font-weight: bold; margin-top: 0.5rem;">${item.term}</dt>
      <dd style="margin-left: 20px; margin-bottom: 0.5rem;">${item.definition}</dd>`;
  });

  glossaryHtml += `</dl></div>`;
  return glossaryHtml;
}

// Generate Attachments/Enclosures Section
function generateAttachmentsSection(): string {
  return `
  <div style="page-break-before: always; margin-top: 2rem;">
    <h2>ATTACHMENTS</h2>
    <ol style="margin-left: 20px;">
      <li>Attachment 1: Implementation Timeline</li>
      <li>Attachment 2: Compliance Checklist</li>
      <li>Attachment 3: Process Flow Diagram</li>
      <li>Attachment 4: Roles and Responsibilities Matrix</li>
    </ol>
  </div>`;
}

// Generate Distribution List
function generateDistributionList(template: string): string {
  return `
  <div style="page-break-before: always; margin-top: 2rem;">
    <h2>DISTRIBUTION LIST</h2>
    <div style="margin-left: 20px;">
      <h3>ACTION ADDRESSEES:</h3>
      <ul>
        <li>All Major Commands (MAJCOM)</li>
        <li>All Field Commands</li>
        <li>All Direct Reporting Units (DRU)</li>
      </ul>

      <h3>INFORMATION ADDRESSEES:</h3>
      <ul>
        <li>Air National Guard (ANG)</li>
        <li>Air Force Reserve Command (AFRC)</li>
        <li>Air Force Space Command (AFSPC)</li>
      </ul>

      <h3>COPIES FURNISHED TO:</h3>
      <ul>
        <li>Office of the Secretary of Defense</li>
        <li>Joint Chiefs of Staff</li>
        <li>Department of the Army</li>
        <li>Department of the Navy</li>
      </ul>
    </div>
  </div>`;
}

// Add portion markings to paragraphs based on classification
function addPortionMarkings(content: string, classification: string): string {
  if (classification === 'UNCLASSIFIED') {
    return content;
  }

  const marking = classification === 'SECRET' ? '(S)' :
                  classification === 'TOP SECRET' ? '(TS)' :
                  classification === 'CONFIDENTIAL' ? '(C)' : '(U)';

  // Add marking to each paragraph
  content = content.replace(/<p([^>]*)>(\d+\.[\d.]*\s*)/g, (match, attrs, numbering) => {
    // Randomly assign some paragraphs different classification levels
    const randomMarking = Math.random() > 0.8 ? '(U)' : marking;
    return `<p${attrs}><span class="portion-marking">${randomMarking}</span> ${numbering}`;
  });

  return content;
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
IMPORTANT: DO NOT include any document headers, table of contents, or title pages - these will be added automatically by the system.
Start your response directly with the first section (e.g., <h2>1. First Section</h2>).

CRITICAL: Create a document with DEEP HIERARCHICAL STRUCTURE using the following numbering system WITH PROPER INDENTATION:
- Level 1: <h2>1. Main Section</h2> (no indent)
- Level 2: <h3 style="margin-left: 20px;">1.1 Subsection</h3> (20px indent)
- Level 3: <h4 style="margin-left: 40px;">1.1.1 Sub-subsection</h4> (40px indent)
- Level 4: <h5 style="margin-left: 60px;">1.1.1.1 Detail Level</h5> (60px indent)
- Level 5: <h6 style="margin-left: 80px;">1.1.1.1.1 Fine Detail</h6> (80px indent)

LENGTH REQUIREMENTS - CRITICAL:
- MINIMUM TOTAL CONTENT: ${pages * 650} words (NOT characters)
- Each page MUST contain 600-700 words of content
- Document MUST be ${pages} full pages long
- If generating 10 pages, you MUST produce at least 6,500 words
- Continue adding sections and content until you reach the required word count

PARAGRAPH NUMBERING AND HTML STRUCTURE:
- EACH SECTION (including subsections) MUST have 2-3 numbered paragraphs
- CRITICAL: Paragraphs must be indented 20px MORE than their parent heading

EXAMPLE HTML STRUCTURE:
For section 1 "Main Section" (Level 1):
<h2>1. Main Section Title</h2>
<p style="margin-left: 20px;">1.1. First paragraph content here (80-120 words)...</p>
<p style="margin-left: 20px;">1.2. Second paragraph content here (80-120 words)...</p>

For section 1.1 "Subsection" (Level 2):
<h3 style="margin-left: 20px;">1.1 Subsection Title</h3>
<p style="margin-left: 40px;">1.1.1. First paragraph content here (80-120 words)...</p>
<p style="margin-left: 40px;">1.1.2. Second paragraph content here (80-120 words)...</p>

For section 1.1.1 "Sub-subsection" (Level 3):
<h4 style="margin-left: 40px;">1.1.1 Sub-subsection Title</h4>
<p style="margin-left: 60px;">1.1.1.1. First paragraph content here (80-120 words)...</p>
<p style="margin-left: 60px;">1.1.1.2. Second paragraph content here (80-120 words)...</p>

For section 1.1.1.1 "Detail Level" (Level 4):
<h5 style="margin-left: 60px;">1.1.1.1 Detail Level Title</h5>
<p style="margin-left: 80px;">1.1.1.1.1. First paragraph content here (80-120 words)...</p>
<p style="margin-left: 80px;">1.1.1.1.2. Second paragraph content here (80-120 words)...</p>

For section 1.1.1.1.1 "Fine Detail" (Level 5):
<h6 style="margin-left: 80px;">1.1.1.1.1 Fine Detail Title</h6>
<p style="margin-left: 100px;">1.1.1.1.1.1. First paragraph content here (80-120 words)...</p>
<p style="margin-left: 100px;">1.1.1.1.1.2. Second paragraph content here (80-120 words)...</p>

- The paragraph number should be at the START of the paragraph text
- Include a period and space after the paragraph number
- CRITICAL: Each paragraph MUST be at least 80 words (4-6 sentences)

INDENTATION REQUIREMENTS:
- Each deeper level MUST be indented 20px more than its parent
- CRITICAL: Paragraphs following each heading must be indented 20px MORE than their heading
- Example: If heading 1.1.1 has margin-left: 40px, its paragraphs (1.1.1.1, 1.1.1.2) must have margin-left: 60px
- Use inline style="margin-left: XXpx;" for both headings and paragraphs
- Indentation formula:
  - Level 1 heading (1.): margin-left: 0px
  - Level 1 paragraphs (1.1., 1.2.): margin-left: 20px
  - Level 2 heading (1.1): margin-left: 20px
  - Level 2 paragraphs (1.1.1., 1.1.2.): margin-left: 40px
  - Level 3 heading (1.1.1): margin-left: 40px
  - Level 3 paragraphs (1.1.1.1., 1.1.1.2.): margin-left: 60px
  - Level 4 heading (1.1.1.1): margin-left: 60px
  - Level 4 paragraphs (1.1.1.1.1., 1.1.1.1.2.): margin-left: 80px
  - Level 5 heading (1.1.1.1.1): margin-left: 80px
  - Level 5 paragraphs (1.1.1.1.1.1., 1.1.1.1.1.2.): margin-left: 100px

STRUCTURE REQUIREMENTS:
1. Each main section (1, 2, 3) must have at least 2-3 subsections (1.1, 1.2, 1.3)
2. Each subsection must have at least 2 sub-subsections (1.1.1, 1.1.2)
3. ALL sections MUST go to level 5 depth (1.1.1.1.1) - MANDATORY for every branch
   - Every main section (1, 2, 3) MUST have subsections down to level 5
   - Example: 1 → 1.1 → 1.1.1 → 1.1.1.1 → 1.1.1.1.1 (ALL 5 LEVELS REQUIRED)
   - DO NOT stop at level 3 or 4 - ALWAYS go to level 5
4. CRITICAL: Numbers must INCREMENT properly:
   - After 1.1.1.1 comes 1.1.1.2 (NOT another 1.1.1.1)
   - After 1.1.1.1.1 comes 1.1.1.1.2 (NOT another 1.1.1.1.1)
   - NEVER repeat the same section number
5. Use proper HTML heading tags (h2 through h6) for hierarchy
6. Each level should have meaningful content in <p> tags WITH SAME INDENTATION and PARAGRAPH NUMBERS
7. Add MORE main sections (4, 5, 6, 7, 8, 9, 10+) as needed to reach ${pages} pages

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
- DO NOT include the Air Force header - it will be added automatically
- DO NOT include a TABLE OF CONTENTS section - it will be generated automatically
- Start directly with the main content sections (1. Section Title, etc.)
- The header and TOC will be added by the system and counted in page numbering
- Use hierarchical numbering with appropriate depth (1, 1.1, 1.1.1, 1.1.1.1, etc.)
- Maximum depth should be 5 levels (e.g., 1.1.1.1.1) for standard Air Force documents
- Let the AI determine appropriate section titles and structure based on the topic

- Use military terminology and formal language
- Include compliance statements and regulatory references
- Add "Table" references where appropriate
- Include "Note:", "WARNING:", and "CAUTION:" statements
- Each paragraph MUST be 4-6 sentences (80-120 words)
- CRITICAL: EVERY <p> tag MUST include style="margin-bottom: 1.5em; line-height: 1.8;"
- CRITICAL: Paragraph <p> tags must be indented 20px MORE than their heading
- Example: If <h4 style="margin-left: 40px;">1.1.1 Title</h4>, then <p style="margin-left: 60px; margin-bottom: 1.5em; line-height: 1.8;">1.1.1.1. Content...</p>
- Write comprehensive, detailed paragraphs that fully explain each topic
- Include specific procedures, requirements, and examples in each paragraph
- Each page should have approximately 600-700 words
- Total content: ${pages * 650} words`,

    technical: `Generate exactly ${pages} pages of technical documentation with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Focus on software/system architecture
- Include implementation details at deeper levels
- Add configuration examples at level 5 (mandatory)
- Use technical terminology
- Include code snippets in <pre><code> blocks at deeper levels
- Each paragraph MUST be 4-6 sentences (80-120 words)
- CRITICAL: EVERY <p> tag MUST include style="margin-bottom: 1.5em; line-height: 1.8;"
- CRITICAL: Paragraph <p> tags must be indented 20px MORE than their heading
- Example: If <h4 style="margin-left: 40px;">1.1.1 Title</h4>, then <p style="margin-left: 60px; margin-bottom: 1.5em; line-height: 1.8;">1.1.1.1. Content...</p>
- Provide detailed technical explanations with examples`,

    policy: `Generate exactly ${pages} pages of organizational policy with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Include compliance requirements at deeper levels
- Add specific procedures at levels 3-4
- Include enforcement details at level 5 (mandatory for all branches)
- Use formal policy language`,

    training: `Generate exactly ${pages} pages of training manual with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Learning objectives at level 2
- Detailed lessons at level 3
- Exercises at level 4
- Assessment criteria at level 5 (mandatory for all branches)`,

    sop: `Generate exactly ${pages} pages of SOP with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Main procedures at level 1
- Detailed steps at level 2-3
- Specific actions at level 4
- Quality checks at level 5 (mandatory for all branches)`,

    // Additional Military Document Templates
    afi: `Generate exactly ${pages} pages of Air Force Instruction (AFI) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Regulatory guidance and mandatory procedures
- Compliance requirements and standards
- Implementation instructions
- Responsibilities and authorities
- Use formal military language and terminology`,

    afpd: `Generate exactly ${pages} pages of Air Force Policy Directive (AFPD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- High-level policy statements
- Strategic objectives and goals
- Organizational responsibilities
- Policy implementation framework
- Executive-level guidance`,

    afman: `Generate exactly ${pages} pages of Air Force Manual (AFMAN) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Detailed procedural guidance
- Step-by-step instructions
- Technical specifications
- Implementation procedures
- Operational guidelines`,

    afjqs: `Generate exactly ${pages} pages of Air Force Job Qualification Standard (AFJQS) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Job performance requirements
- Task qualification criteria
- Training objectives
- Evaluation standards
- Proficiency levels`,

    afto: `Generate exactly ${pages} pages of Air Force Technical Order (AFTO) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Technical maintenance procedures
- Equipment specifications
- Safety warnings and cautions
- Troubleshooting guides
- Parts identification`,

    afva: `Generate exactly ${pages} pages of Air Force Visual Aid (AFVA) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Visual training materials description
- Diagram explanations
- Process flow documentation
- Reference materials
- Quick reference guides`,

    afh: `Generate exactly ${pages} pages of Air Force Handbook (AFH) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Comprehensive reference material
- Best practices and procedures
- Educational content
- Examples and case studies
- Practical applications`,

    afgm: `Generate exactly ${pages} pages of Air Force Guidance Memorandum (AFGM) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Interim guidance and updates
- Policy clarifications
- Temporary procedures
- Implementation timelines
- Transition instructions`,

    afmd: `Generate exactly ${pages} pages of Air Force Mission Directive (AFMD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Mission statements and objectives
- Organizational structure
- Command relationships
- Functional responsibilities
- Authority delegations`,

    dafi: `Generate exactly ${pages} pages of Department of the Air Force Instruction (DAFI) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Department-wide instructions
- Cross-functional procedures
- Integration requirements
- Compliance standards
- Implementation guidance`,

    dafman: `Generate exactly ${pages} pages of Department of the Air Force Manual (DAFMAN) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Department-level procedures
- Detailed implementation guides
- Technical specifications
- Operational procedures
- Administrative requirements`,

    dafpd: `Generate exactly ${pages} pages of Department of the Air Force Policy Directive (DAFPD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Department-level policy
- Strategic direction
- Organizational priorities
- Resource allocation guidance
- Leadership directives`,

    oplan: `Generate exactly ${pages} pages of Operation Plan (OPLAN) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Mission analysis and objectives
- Force deployment schedules
- Logistics requirements
- Command and control structures
- Contingency procedures`,

    opord: `Generate exactly ${pages} pages of Operation Order (OPORD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Situation assessment
- Mission statement
- Execution instructions
- Service support requirements
- Command and signal procedures`,

    conops: `Generate exactly ${pages} pages of Concept of Operations (CONOPS) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Operational concept overview
- System capabilities
- Operational scenarios
- User interactions
- Performance requirements`,

    ttp: `Generate exactly ${pages} pages of Tactics, Techniques, and Procedures (TTP) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Tactical employment methods
- Technical procedures
- Best practices
- Lessons learned
- Combat procedures`,

    cjcs: `Generate exactly ${pages} pages of Chairman Joint Chiefs of Staff Instruction with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Joint force guidance
- Inter-service coordination
- Strategic directives
- Unified command procedures
- Joint operational requirements`,

    dodd: `Generate exactly ${pages} pages of Department of Defense Directive (DODD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- DoD-wide policy
- Regulatory framework
- Compliance requirements
- Implementation responsibilities
- Oversight procedures`,

    dodi: `Generate exactly ${pages} pages of Department of Defense Instruction (DODI) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- DoD procedural guidance
- Implementation instructions
- Technical standards
- Reporting requirements
- Quality assurance procedures`
  };

  const prompt = templatePrompts[template] || templatePrompts.technical;

  try {
    // Use OpenRouter API - same as the working script
    const messages = [
      {
        role: 'system',
        content: `You are an expert technical writer for the US Air Force. Generate well-structured technical documentation with deep hierarchical numbering following military standards.

CRITICAL LENGTH REQUIREMENT: You MUST generate exactly ${pages} pages of content. Each page needs 600-700 words. Total minimum: ${pages * 650} words (not characters). DO NOT include any header or table of contents - these will be added automatically by the system. 

For a 10-page document, you MUST produce at least 6,500 words.
For a 5-page document, you MUST produce at least 3,250 words.

Continue adding sections and detailed paragraphs until you reach the required word count.

CRITICAL PARAGRAPH NUMBERING RULE:
- Paragraph numbers are ONE LEVEL DEEPER than their heading
- If heading is 1.1.1.1.1 (5 levels), paragraphs are 1.1.1.1.1.1, 1.1.1.1.1.2 (6 levels)
- If heading is 1.1.1.1 (4 levels), paragraphs are 1.1.1.1.1, 1.1.1.1.2 (5 levels)
- NEVER use the same depth for paragraph numbers as the heading number
- Each section must have 2-3 numbered paragraphs of at least 80-120 words each.`
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
        model: 'openai/gpt-4o', // Use GPT-4o (ChatGPT 5) for best performance
        messages: messages,
        temperature: 0.7,
        max_tokens: Math.min(16000, pages * 2000)  // Dynamic based on pages, up to 16k tokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    let content = data.choices[0]?.message?.content || '';
    
    // Log the AI response for debugging
    console.log('=== AI RESPONSE DEBUG ===');
    console.log('Response length:', content.length);
    console.log('Has level 5 pattern (X.X.X.X.X):', /\d+\.\d+\.\d+\.\d+\.\d+/.test(content));
    console.log('Has h6 tags:', content.includes('<h6'));
    console.log('Has margin-left styles:', content.includes('margin-left:'));
    console.log('First 500 chars:', content.substring(0, 500));
    
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
    
    // Don't add H1 title - let AI's content be used as-is
    
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
      secretary: customHeaderData?.secretary || getTemplateDefaults(template).secretary,
      organization: customHeaderData?.organization || getTemplateDefaults(template).organization,
      documentType: customHeaderData?.documentType || getTemplateDefaults(template).documentType,
      documentDate: customHeaderData?.documentDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      subject: customHeaderData?.subject || getTemplateDefaults(template).subject,
      category: customHeaderData?.category || getTemplateDefaults(template).category,
      compliance: customHeaderData?.compliance || 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
      accessibility: customHeaderData?.accessibility || 'Publications and forms are available on the e-Publishing website at',
      accessibilityUrl: customHeaderData?.accessibilityUrl || 'http://www.e-publishing.af.mil',
      releasability: customHeaderData?.releasability || 'There are no releasability restrictions on this publication.',
      opr: customHeaderData?.opr || 'SF/S5S',
      certifiedBy: customHeaderData?.certifiedBy || 'SF/S5/8',
      certifiedByName: customHeaderData?.certifiedByName || '(Lt Gen Philip Garrant)',
      supersedes: customHeaderData?.supersedes || '',
      pages: customHeaderData?.totalPages || pages,
      // New metadata elements
      classification: customHeaderData?.classification || 'UNCLASSIFIED',
      distributionStatement: customHeaderData?.distributionStatement || 'DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited',
      changeNumber: customHeaderData?.changeNumber || '',
      versionNumber: customHeaderData?.versionNumber || '1.0',
      effectiveDate: customHeaderData?.effectiveDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      reviewDate: customHeaderData?.reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      pocName: customHeaderData?.pocName || 'Lt Col Smith, John A.',
      pocDSN: customHeaderData?.pocDSN || '555-1234',
      pocCommercial: customHeaderData?.pocCommercial || '(555) 555-1234',
      pocEmail: customHeaderData?.pocEmail || 'john.a.smith@us.af.mil'
    };
    
    // Add styles and header HTML - matching official Air Force document layout
    afHeader = `<style>
  .classification-header {
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: ${headerConfig.classification === 'SECRET' ? '#FFD700' :
                        headerConfig.classification === 'TOP SECRET' ? '#FF6B6B' :
                        headerConfig.classification === 'CONFIDENTIAL' ? '#87CEEB' : '#F0F0F0'};
    color: ${headerConfig.classification === 'UNCLASSIFIED' ? '#000' : '#000'};
    border: 2px solid #000;
  }

  .classification-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    padding: 0.25rem;
    background-color: white;
    border-top: 1px solid #000;
  }

  .page-footer {
    position: fixed;
    bottom: 30px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 1in;
    font-size: 10pt;
  }

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

  .toc-section {
    page-break-after: always;
    margin-bottom: 2rem;
  }

  .toc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1rem;
  }

  .toc-entry {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #000;
    margin: 0 0.5rem;
  }

  .change-bar {
    border-left: 3px solid #FF0000;
    padding-left: 10px;
    margin-left: -13px;
  }

  .portion-marking {
    font-weight: bold;
    color: #0066CC;
  }
</style>

<!-- Classification Header -->
<div class="classification-header">
  ${headerConfig.classification}
</div>

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
      ${headerConfig.changeNumber ? `<div style="font-size: 10pt; color: red;">CHANGE ${headerConfig.changeNumber}</div>` : ''}
      ${headerConfig.versionNumber ? `<div style="font-size: 10pt;">Version ${headerConfig.versionNumber}</div>` : ''}
    </div>
  </div>

  <div class="compliance">
    ${headerConfig.compliance}
  </div>

  <div class="info-section">
    <span class="section-label">DISTRIBUTION:</span>
    <span class="section-content">${headerConfig.distributionStatement}</span>
  </div>

  <div class="info-section">
    <span class="section-label">ACCESSIBILITY:</span>
    <span class="section-content">${headerConfig.accessibility} <a href="${headerConfig.accessibilityUrl}" style="color: #0066CC;">${headerConfig.accessibilityUrl}</a>.</span>
  </div>

  <div class="info-section">
    <span class="section-label">RELEASABILITY:</span>
    <span class="section-content">${headerConfig.releasability}</span>
  </div>

  <div class="info-section">
    <span class="section-label">EFFECTIVE DATE:</span>
    <span class="section-content">${headerConfig.effectiveDate}</span>
    <span style="margin-left: 2rem;"><strong>REVIEW DATE:</strong> ${headerConfig.reviewDate}</span>
  </div>
  
  <div class="info-section">
    <span class="section-label">POC:</span>
    <span class="section-content">
      ${headerConfig.pocName}<br />
      DSN: ${headerConfig.pocDSN} | Commercial: ${headerConfig.pocCommercial}<br />
      Email: ${headerConfig.pocEmail}
    </span>
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

<!-- Page Footer Template -->
<div class="page-footer" style="display: none;">
  <span>${headerConfig.documentType}</span>
  <span>${headerConfig.effectiveDate}</span>
  <span>Page <span class="page-number">1</span> of ${headerConfig.pages}</span>
</div>

<!-- Classification Footer -->
<div class="classification-footer">
  ${headerConfig.classification}
</div>
`;
    // Generate Table of Contents
    const tocHtml = generateTableOfContents(cleanedContent);

    // Generate References Section
    const referencesHtml = generateReferencesSection(template);

    // Generate Glossary/Acronyms
    const glossaryHtml = generateGlossarySection(template);

    // Generate Attachments/Enclosures
    const attachmentsHtml = generateAttachmentsSection();

    // Generate Distribution List
    const distributionHtml = generateDistributionList(template);

    // Add portion markings to paragraphs
    cleanedContent = addPortionMarkings(cleanedContent, headerConfig.classification);

    // Assemble final document
    cleanedContent = afHeader + tocHtml + cleanedContent + referencesHtml + glossaryHtml + attachmentsHtml + distributionHtml;
    
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
    
    // Validate inputs - include all military templates
    const validTemplates = [
      'technical', 'policy', 'training', 'sop', 
      'af-manual', 'afi', 'afpd', 'afman', 'afjqs', 'afto', 'afva', 'afh', 'afgm', 'afmd',
      'dafi', 'dafman', 'dafpd',
      'army', 'navy', 'marine', 'spaceforce',
      'dodd', 'dodi', 'cjcs',
      'oplan', 'opord', 'conops', 'ttp'
    ];
    
    if (!validTemplates.includes(template)) {
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
          content: content,
          htmlContent: content,
          editableContent: (() => {
            // Find where the actual document content starts (after header and TOC)
            if (content.includes('air-force-document-header')) {
              // Look for the end of TOC section (page-break-after div)
              const tocEndMatch = content.match(/<div style="page-break-after: always;"><\/div>/);
              if (tocEndMatch && tocEndMatch.index !== undefined) {
                return content.substring(tocEndMatch.index + tocEndMatch[0].length);
              }
              // Fallback: find first h2 tag (main content section)
              const firstH2 = content.indexOf('<h2');
              if (firstH2 !== -1) {
                return content.substring(firstH2);
              }
            }
            return content;
          })(),
          plainText: content.replace(/<[^>]*>/g, ''), // Plain text version
          headerHtml: (() => {
            if (content.includes('air-force-document-header')) {
              // Extract everything up to the end of TOC
              const tocEndMatch = content.match(/<div style="page-break-after: always;"><\/div>/);
              if (tocEndMatch && tocEndMatch.index !== undefined) {
                return content.substring(0, tocEndMatch.index + tocEndMatch[0].length);
              }
              // Fallback: extract up to first h2
              const firstH2 = content.indexOf('<h2');
              if (firstH2 !== -1) {
                return content.substring(0, firstH2);
              }
            }
            return '';
          })(),
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