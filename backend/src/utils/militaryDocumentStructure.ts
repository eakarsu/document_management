/**
 * Military Document Structure Helper
 * Ensures all military documents follow proper structure with:
 * 1. Initial introduction paragraph
 * 2. SUMMARY OF CHANGES section
 * 3. Proper paragraph numbering
 */

export interface MilitaryDocumentConfig {
  documentType: string;
  title: string;
  organization: string;
  documentNumber: string;
  date: string;
  supersedes?: string;
  appliesTo?: string;
  purpose?: string;
}

/**
 * Generate the standard introduction paragraph for military documents
 * This appears before any numbered sections
 */
export function generateIntroductionParagraph(config: MilitaryDocumentConfig): string {
  const appliesTo = config.appliesTo || 'all Department of Defense personnel, including Active Duty, Reserve, and National Guard components';
  const purpose = config.purpose || `comprehensive policy and guidance for ${config.title.toLowerCase()}`;

  return `
    <!-- Introduction Paragraph (Required for all military documents) -->
    <div style="margin-bottom: 20px; padding: 15px; background-color: #fafafa;">
      <p data-paragraph="0.1" data-line="1" style="text-indent: 20px; line-height: 1.6;">
        This ${config.documentType} provides ${purpose}, serving as the primary authoritative source for all related operational requirements and procedural standards.
        It establishes comprehensive responsibilities and detailed procedures to ensure effective and consistent implementation across all applicable ${config.organization} organizations, commands, and subordinate units.
        The directive outlines specific accountability frameworks, reporting requirements, and performance metrics that enable proper oversight and continuous improvement of operational effectiveness.
        This publication applies to ${appliesTo}, and all personnel are expected to familiarize themselves with its contents and integrate its guidance into their daily operations and decision-making processes.
        ${config.supersedes ? `This document supersedes ${config.supersedes} and incorporates lessons learned, best practices, and updated regulatory requirements that have emerged since the previous publication.` : 'This document represents the current state of policy and procedure in this area and should be considered the definitive reference for all related activities.'}
        All affected organizations must ensure their local procedures and training materials align with the standards set forth herein.
        Compliance with this publication is mandatory, and any deviations must be approved through appropriate channels in accordance with established waiver procedures.
      </p>
    </div>
  `;
}

/**
 * Generate the SUMMARY OF CHANGES section
 * This appears after the introduction but before the main content
 */
export function generateSummaryOfChanges(isNewDocument: boolean = false, changes?: string[]): string {
  const defaultChangesParagraph = `This document has been substantially revised and requires complete review. Major changes include comprehensive updates to policy requirements to align with current Department of Defense regulations and emerging operational needs. The organizational structure and responsibility assignments have been revised to reflect recent force structure changes and to clarify command relationships at all echelons. Reporting procedures and timelines have been enhanced to improve data accuracy and ensure timely submission of critical information through appropriate channels. Compliance measures and enforcement actions have been clarified to provide commanders with better tools for maintaining standards and addressing non-compliance issues. New definitions and terminology have been added throughout the document to ensure consistency with joint doctrine and to eliminate ambiguity in interpretation. Additionally, this revision incorporates lessons learned from recent operations, updates references to current technical orders and manuals, and strengthens safety protocols based on mishap investigation findings. The document also includes improved implementation guidance with specific milestones and measurable objectives to facilitate proper execution at all organizational levels.`;

  const newDocumentParagraph = `This is a new publication establishing baseline policy and procedures in this functional area. As an initial publication, it consolidates previously fragmented guidance from multiple sources into a single authoritative document. This publication defines organizational responsibilities, establishes standard operating procedures, and provides implementation timelines for all affected units. It incorporates current best practices from across the enterprise and aligns with strategic objectives outlined in higher-level directives. All personnel within the scope of this publication are required to review its contents thoroughly and ensure their operations comply with the standards established herein. Future revisions will incorporate lessons learned during initial implementation and feedback from field units.`;

  return `
    <!-- SUMMARY OF CHANGES (Required for all military documents) -->
    <div style="margin-bottom: 30px; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #333;">
      <h3 style="margin-top: 0; color: #333; font-size: 14px; font-weight: bold;">SUMMARY OF CHANGES</h3>
      <p data-paragraph="0.2" data-line="1" style="margin-bottom: 10px; text-align: justify; line-height: 1.6;">
        ${isNewDocument ? newDocumentParagraph : (changes && changes.length > 0 ?
          `This document has been substantially revised and requires complete review. Major changes include ${changes.join('; ')}. These modifications reflect current operational requirements, incorporate lessons learned from recent experiences, and align with updated strategic guidance. All affected organizations should conduct a thorough review of this publication and update their local procedures accordingly.`
          : defaultChangesParagraph)}
      </p>
    </div>
  `;
}

/**
 * Inject military document structure into any document HTML
 * This ensures ALL military documents have proper structure
 */
export function injectMilitaryDocumentStructure(
  documentHTML: string,
  config: MilitaryDocumentConfig,
  isNewDocument: boolean = false,
  changes?: string[]
): string {
  // Find where to inject (after header/title but before main content)
  // Look for common patterns that indicate start of main content
  const patterns = [
    '<!-- Policy Content -->',
    '<!-- Main Content -->',
    '<div class="policy-content">',
    '<div class="main-content">',
    '<h3 data-paragraph="1">',
    '<h2>Chapter 1</h2>',
    '<p data-paragraph="1"',
    '1. OVERVIEW',
    '1. PURPOSE',
    '1.1'
  ];

  let injectionPoint = -1;
  let patternFound = '';

  for (const pattern of patterns) {
    injectionPoint = documentHTML.indexOf(pattern);
    if (injectionPoint !== -1) {
      patternFound = pattern;
      break;
    }
  }

  // Generate the required sections
  const introSection = generateIntroductionParagraph(config);
  const changesSection = generateSummaryOfChanges(isNewDocument, changes);
  const militaryStructure = introSection + changesSection;

  if (injectionPoint !== -1) {
    // Insert before the main content
    return documentHTML.slice(0, injectionPoint) +
           militaryStructure +
           documentHTML.slice(injectionPoint);
  } else {
    // If no pattern found, look for the compliance statement and add after it
    const complianceIndex = documentHTML.indexOf('COMPLIANCE WITH THIS PUBLICATION IS MANDATORY');
    if (complianceIndex !== -1) {
      // Find the end of the compliance div
      const complianceEndIndex = documentHTML.indexOf('</div>', complianceIndex) + 6;
      return documentHTML.slice(0, complianceEndIndex) +
             militaryStructure +
             documentHTML.slice(complianceEndIndex);
    }

    // Fallback: append to end of document
    console.warn('Could not find proper injection point for military document structure');
    return documentHTML + militaryStructure;
  }
}

/**
 * Check if a document already has the required military structure
 */
export function hasMilitaryStructure(documentHTML: string): {
  hasIntroduction: boolean;
  hasSummaryOfChanges: boolean;
} {
  const hasIntroduction = documentHTML.includes('data-paragraph="0.1"') ||
                          documentHTML.includes('Introduction Paragraph');
  const hasSummaryOfChanges = documentHTML.includes('SUMMARY OF CHANGES');

  return {
    hasIntroduction,
    hasSummaryOfChanges
  };
}

/**
 * Update paragraph numbering to account for introduction sections
 * Introduction = 0.1, Summary of Changes = 0.2, then main content starts at 1
 */
export function updateParagraphNumbering(documentHTML: string): string {
  // This ensures that the introduction and summary don't affect
  // the main content paragraph numbering which should start at 1

  // Find all paragraph numbers and ensure proper sequencing
  let updatedHTML = documentHTML;

  // Ensure introduction is 0.1
  updatedHTML = updatedHTML.replace(
    /data-paragraph="intro"/gi,
    'data-paragraph="0.1"'
  );

  // Ensure summary is 0.2
  updatedHTML = updatedHTML.replace(
    /data-paragraph="summary"/gi,
    'data-paragraph="0.2"'
  );

  return updatedHTML;
}

/**
 * Apply military document structure to all document types
 */
export function applyMilitaryDocumentStructure(
  documentHTML: string,
  documentType: string,
  documentTitle: string,
  organization: string = 'DEPARTMENT OF THE AIR FORCE'
): string {
  // Check if structure already exists
  const structureCheck = hasMilitaryStructure(documentHTML);

  // Skip if already has both required sections
  if (structureCheck.hasIntroduction && structureCheck.hasSummaryOfChanges) {
    return documentHTML;
  }

  // Extract document number from HTML if present
  const docNumberMatch = documentHTML.match(/(?:DIRECTIVE|INSTRUCTION|MANUAL|ORDER)\s+([\d-]+)/i);
  const documentNumber = docNumberMatch ? docNumberMatch[1] : '[##-##]';

  // Extract date from HTML if present
  const dateMatch = documentHTML.match(/\d{1,2}\s+\w+\s+\d{4}/);
  const date = dateMatch ? dateMatch[0] : new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Create configuration
  const config: MilitaryDocumentConfig = {
    documentType,
    title: documentTitle,
    organization,
    documentNumber,
    date
  };

  // Inject the military structure
  return injectMilitaryDocumentStructure(documentHTML, config);
}

export default {
  generateIntroductionParagraph,
  generateSummaryOfChanges,
  injectMilitaryDocumentStructure,
  hasMilitaryStructure,
  updateParagraphNumbering,
  applyMilitaryDocumentStructure
};