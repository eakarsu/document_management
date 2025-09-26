import { TOCEntry, GlossaryItem, ClassificationLevel } from '../../types/ai-document';

/**
 * Generates Table of Contents from document content
 * @param content - The document content
 * @returns HTML string for table of contents
 */
export function generateTableOfContents(content: string): string {
  const sections: TOCEntry[] = [];

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

/**
 * Generates References Section
 * @param template - The document template type
 * @returns HTML string for references section
 */
export function generateReferencesSection(template: string): string {
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

/**
 * Generates Glossary/Acronyms Section
 * @param template - The document template type
 * @returns HTML string for glossary section
 */
export function generateGlossarySection(template: string): string {
  const glossary: GlossaryItem[] = [
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

/**
 * Generates Attachments/Enclosures Section
 * @returns HTML string for attachments section
 */
export function generateAttachmentsSection(): string {
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

/**
 * Generates Distribution List
 * @param template - The document template type
 * @returns HTML string for distribution list
 */
export function generateDistributionList(template: string): string {
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

/**
 * Adds portion markings to paragraphs based on classification
 * @param content - The content to mark
 * @param classification - The classification level
 * @returns Content with portion markings
 */
export function addPortionMarkings(content: string, classification: ClassificationLevel): string {
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