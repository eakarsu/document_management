import { DocumentStructureItem, SectionInfo } from '../../types/ai-document';

/**
 * Extracts paragraphs and structure from document content
 * @param content - The HTML content to parse
 * @param pages - Number of pages for page calculation
 * @returns Array of document structure items
 */
export function extractParagraphsWithNumbers(content: string, pages: number = 5): DocumentStructureItem[] {
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
  const sections: SectionInfo[] = [];
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

  // Find sections to exclude from feedback
  const excludedSections = ['REFERENCES', 'GLOSSARY', 'ATTACHMENTS', 'DISTRIBUTION'];
  let excludeAfterPosition = content.length;

  for (const section of sections) {
    const upperTitle = section.title.toUpperCase();
    for (const excluded of excludedSections) {
      if (upperTitle.includes(excluded)) {
        excludeAfterPosition = Math.min(excludeAfterPosition, section.position);
        break;
      }
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
  const documentStructure: DocumentStructureItem[] = [];

  while ((paragraphMatch = paragraphRegex.exec(content)) !== null) {
    const paragraphText = paragraphMatch[1].trim();

    // Skip short paragraphs or header content
    if (paragraphText.length < 30) continue;
    if (paragraphMatch.index < contentStartIndex) continue;

    // Skip content in excluded sections (REFERENCES, GLOSSARY, etc.)
    if (paragraphMatch.index >= excludeAfterPosition) continue;

    // Skip if this paragraph is just a heading (numbered section title)
    const isHeading = /^\d+(\.\d+)*\s+[A-Z]/.test(paragraphText) && paragraphText.length < 100;
    if (isHeading) continue;

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