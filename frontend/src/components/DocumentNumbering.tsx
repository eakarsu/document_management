import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DocumentNumberingProps {
  content: string;
  enableLineNumbers?: boolean;
  enableParagraphNumbers?: boolean;
  enablePageNumbers?: boolean;
  linesPerPage?: number;
}

const DocumentNumbering: React.FC<DocumentNumberingProps> = ({
  content,
  enableLineNumbers = true,
  enableParagraphNumbers = true,
  enablePageNumbers = true,
  linesPerPage = 50
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const processDocument = () => {
      const container = containerRef.current!;
      
      // First, set the raw HTML content
      container.innerHTML = content;
      
      // Mark all tables with a special class to prevent any numbering
      const tables = container.querySelectorAll('table');
      tables.forEach(table => {
        table.classList.add('no-numbering-zone');
        // Also mark all child elements
        const allChildren = table.querySelectorAll('*');
        allChildren.forEach(child => {
          child.classList.add('inside-table');
        });
      });
      
      // Add section and paragraph numbering
      if (enableParagraphNumbers) {
        let sectionCounter = 0;
        let subsectionCounter = 0;
        let subsubsectionCounter = 0;
        let currentSection = 0;
        let currentSubsection = 0;
        let currentSubsubsection = 0;
        let paragraphCounter = 0;
        
        // Track what level we're currently at
        let currentLevel = 0;
        
        // Track what numbers we've seen at each level to detect duplicates
        const seenNumbers: {[key: string]: number} = {};
        
        // First, process all headers to establish section structure
        const headers = container.querySelectorAll('h1, h2, h3, h4');
        headers.forEach((header) => {
          const level = parseInt(header.tagName.charAt(1));
          
          // Check if heading already has a number at the start
          const existingNumber = header.textContent?.match(/^([\d]+\.[\d]+\.?[\d]*|[\d]+\.?)\s+/);
          
          if (level === 1) {
            // If header already has a number, extract it
            if (existingNumber) {
              const num = existingNumber[1];
              const mainNum = parseInt(num.split('.')[0]);
              currentSection = mainNum;
              sectionCounter = Math.max(sectionCounter, mainNum);
            } else {
              sectionCounter++;
              currentSection = sectionCounter;
              header.innerHTML = `${sectionCounter}. ${header.innerHTML}`;
            }
            
            currentSubsection = 0;
            currentSubsubsection = 0;
            subsectionCounter = 0;
            subsubsectionCounter = 0;
            paragraphCounter = 0;
            currentLevel = 1;
            
            header.classList.add('section-heading', 'no-paragraph-number');
            header.setAttribute('data-section', `${currentSection}`);
            header.setAttribute('data-level', '1');
            
          } else if (level === 2) {
            // If header already has a number like "1.1" or "2.3", extract it
            if (existingNumber) {
              const numStr = existingNumber[1];
              const parts = numStr.split('.');
              
              // Check if this exact number was already used at this level
              const numberKey = `h2-${numStr}`;
              
              if (parts.length >= 2) {
                // It's a number like "1.1"
                const sectionNum = parseInt(parts[0]) || currentSection;
                const subsectionNum = parseInt(parts[1]);
                
                // If we've seen this exact number before at H2 level, it's actually a sub-subsection
                if (seenNumbers[numberKey]) {
                  // This is a duplicate, treat as next subsection
                  subsectionCounter++;
                  currentSubsection = subsectionCounter;
                  // Replace the duplicate number with the correct one
                  header.innerHTML = header.innerHTML.replace(existingNumber[0], `${currentSection}.${subsectionCounter} `);
                  header.setAttribute('data-section', `${currentSection}.${currentSubsection}`);
                } else {
                  // First time seeing this number
                  currentSection = sectionNum;
                  currentSubsection = subsectionNum;
                  subsectionCounter = Math.max(subsectionCounter, currentSubsection);
                  sectionCounter = Math.max(sectionCounter, currentSection);
                  seenNumbers[numberKey] = 1;
                  header.setAttribute('data-section', `${currentSection}.${currentSubsection}`);
                }
              } else if (parts.length === 1) {
                // Just a single number like "1" - treat as new subsection
                subsectionCounter++;
                currentSubsection = subsectionCounter;
                header.innerHTML = `${currentSection}.${subsectionCounter} ${header.textContent?.replace(existingNumber[0], '')}`;
                header.setAttribute('data-section', `${currentSection}.${currentSubsection}`);
              }
            } else {
              subsectionCounter++;
              currentSubsection = subsectionCounter;
              const sectionNum = `${currentSection}.${subsectionCounter}`;
              header.innerHTML = `${sectionNum} ${header.innerHTML}`;
              header.setAttribute('data-section', `${currentSection}.${currentSubsection}`);
            }
            
            currentSubsubsection = 0;
            subsubsectionCounter = 0;
            paragraphCounter = 0;
            currentLevel = 2;
            
            header.classList.add('subsection-heading', 'no-paragraph-number');
            header.setAttribute('data-level', '2');
            
          } else if (level === 3) {
            // If header already has a number like "1.1.1" or "1.2", extract it
            if (existingNumber) {
              const numStr = existingNumber[1];
              const parts = numStr.split('.');
              
              // Check if this exact number was already used
              const numberKey = `h3-${numStr}`;
              
              if (parts.length >= 3) {
                // It's a number like "1.1.1"
                const subsubNum = parseInt(parts[2]);
                subsubsectionCounter++;
                currentSubsubsection = subsubsectionCounter;
                header.setAttribute('data-section', `${currentSection}.${currentSubsection}.${currentSubsubsection}`);
              } else if (parts.length === 2) {
                // It's a number like "1.2" at H3 level - this is likely a misplaced subsection
                // Check if we've seen this number before
                if (seenNumbers[numberKey]) {
                  // Duplicate at H3, increment subsubsection
                  subsubsectionCounter++;
                  currentSubsubsection = subsubsectionCounter;
                  header.innerHTML = header.innerHTML.replace(existingNumber[0], `${currentSection}.${currentSubsection}.${subsubsectionCounter} `);
                } else {
                  // Treat as subsubsection
                  subsubsectionCounter++;
                  currentSubsubsection = subsubsectionCounter;
                  header.innerHTML = header.innerHTML.replace(existingNumber[0], `${currentSection}.${currentSubsection}.${subsubsectionCounter} `);
                }
                seenNumbers[numberKey] = 1;
                header.setAttribute('data-section', `${currentSection}.${currentSubsection}.${currentSubsubsection}`);
              }
            } else {
              subsubsectionCounter++;
              currentSubsubsection = subsubsectionCounter;
              const sectionNum = `${currentSection}.${currentSubsection}.${subsubsectionCounter}`;
              header.innerHTML = `${sectionNum} ${header.innerHTML}`;
              header.setAttribute('data-section', `${currentSection}.${currentSubsection}.${currentSubsubsection}`);
            }
            
            paragraphCounter = 0;
            currentLevel = 3;
            
            header.classList.add('subsubsection-heading', 'no-paragraph-number');
            header.setAttribute('data-level', '3');
          }
        });
        
        // Now process all elements in order to assign paragraph numbers
        const allElements = container.querySelectorAll('p, h1, h2, h3, h4');
        
        allElements.forEach((elem) => {
          if (elem.tagName.match(/^H[1-4]$/)) {
            // This is a header - update current section context
            const level = parseInt(elem.tagName.charAt(1));
            const dataSection = elem.getAttribute('data-section');
            
            if (level === 1) {
              currentSection = parseInt(dataSection || '0');
              currentSubsection = 0;
              currentSubsubsection = 0;
              paragraphCounter = 0;
              currentLevel = 1;
            } else if (level === 2) {
              const parts = (dataSection || '').split('.');
              currentSection = parseInt(parts[0] || '0') || currentSection;
              currentSubsection = parseInt(parts[1] || '0');
              // Make sure we have valid section context
              if (currentSection === 0 && currentSubsection > 0) {
                currentSection = 1; // Default to section 1 if missing
              }
              currentSubsubsection = 0;
              paragraphCounter = 0;
              currentLevel = 2;
            } else if (level === 3) {
              const parts = (dataSection || '').split('.');
              currentSection = parseInt(parts[0] || '0') || currentSection;
              currentSubsection = parseInt(parts[1] || '0') || currentSubsection;
              currentSubsubsection = parseInt(parts[2] || '0');
              paragraphCounter = 0;
              currentLevel = 3;
            }
          } else if (elem.tagName === 'P') {
            // This is a paragraph - give it a paragraph number
            // BUT skip paragraphs that are:
            // - Inside lists (ul, ol)
            // - Inside tables
            // - Inside blockquotes
            // - Special classes
            if (!elem.classList.contains('no-number') && 
                !elem.classList.contains('no-paragraph-number') &&
                !elem.closest('ul') &&
                !elem.closest('ol') &&
                !elem.closest('li') &&
                !elem.closest('table') &&
                !elem.closest('blockquote') &&
                !elem.closest('.crm-matrix') && 
                !elem.closest('.header-info') &&
                !elem.classList.contains('page-number') &&
                !elem.classList.contains('page-marker')) {
              
              // Always increment paragraph counter for each paragraph
              paragraphCounter++;
              
              let paraNum = '';
              
              // Build paragraph number based on current section level
              if (currentLevel === 3 && currentSubsubsection > 0) {
                // We're in a subsubsection
                paraNum = `${currentSection}.${currentSubsection}.${currentSubsubsection}.${paragraphCounter}`;
              } else if (currentLevel >= 2 && currentSubsection > 0) {
                // We're in a subsection - add paragraph as third level
                paraNum = `${currentSection}.${currentSubsection}.${paragraphCounter}`;
              } else if (currentLevel >= 1 && currentSection > 0) {
                // We're in a main section but no subsection yet
                paraNum = `${currentSection}.${paragraphCounter}`;
              } else {
                // Before any section or no sections
                paraNum = `0.${paragraphCounter}`;
              }
              
              elem.setAttribute('data-paragraph', paraNum);
              elem.classList.add('numbered-paragraph');
            }
          }
        });
      }
      
      // Add line numbers
      if (enableLineNumbers) {
        let globalLineCounter = 1;
        let pageLineCounter = 1;
        
        // Only add line numbers to paragraphs that are NOT inside tables, lists, etc.
        const allTextElements = container.querySelectorAll('p:not(.inside-table)');
        allTextElements.forEach((elem) => {
          // Skip paragraphs inside tables, lists, or special containers
          if (elem.classList.contains('inside-table') ||
              elem.closest('.no-numbering-zone') ||
              elem.closest('table') ||
              elem.classList.contains('page-number') ||
              elem.classList.contains('page-marker')) {
            return;
          }
          
          const text = elem.textContent || '';
          const lines = Math.max(1, Math.ceil(text.length / 80));
          
          elem.setAttribute('data-line-start', globalLineCounter.toString());
          elem.setAttribute('data-line-end', (globalLineCounter + lines - 1).toString());
          elem.classList.add('numbered-line');
          
          globalLineCounter += lines;
          pageLineCounter += lines;
          
          // Reset page line counter if we've exceeded lines per page
          if (pageLineCounter > linesPerPage) {
            pageLineCounter = 1;
          }
        });
      }
      
      // Add page numbers
      if (enablePageNumbers) {
        let currentPage = 1;
        let linesOnCurrentPage = 0;
        
        const allElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        
        allElements.forEach((elem, index) => {
          // Skip elements inside tables
          if (elem.closest('table') || elem.classList.contains('inside-table')) {
            return;
          }
          
          const estimatedLines = elem.tagName.startsWith('H') ? 2 : 
                                Math.max(1, Math.ceil((elem.textContent?.length || 0) / 80));
          
          // Check if we need a new page
          if (linesOnCurrentPage + estimatedLines > linesPerPage && linesOnCurrentPage > 0) {
            // Insert page marker before this element
            const pageMarker = document.createElement('div');
            pageMarker.className = 'page-marker';
            pageMarker.innerHTML = `<hr style="margin: 20px 0; border-top: 2px dashed #ccc;" />`;
            elem.parentNode?.insertBefore(pageMarker, elem);
            
            currentPage++;
            linesOnCurrentPage = 0;
          }
          
          elem.setAttribute('data-page', currentPage.toString());
          linesOnCurrentPage += estimatedLines;
        });
        
        // Add page number display at the bottom
        const pageDisplay = document.createElement('div');
        pageDisplay.className = 'page-number';
        pageDisplay.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border: 1px solid #ccc; border-radius: 3px;';
        pageDisplay.textContent = `Page ${currentPage}`;
      }
    };
    
    processDocument();
  }, [content, enableLineNumbers, enableParagraphNumbers, enablePageNumbers, linesPerPage]);

  // CSS for displaying the numbers
  const styles = `
    .numbered-paragraph {
      position: relative;
      ${enableParagraphNumbers && enableLineNumbers ? 'margin-left: 140px;' : enableParagraphNumbers ? 'margin-left: 80px;' : enableLineNumbers ? 'margin-left: 60px;' : ''}
    }
    
    .numbered-paragraph::before {
      ${enableParagraphNumbers ? `
        content: attr(data-paragraph);
        position: absolute;
        left: ${enableLineNumbers ? '-75px' : '-75px'};
        top: 0;
        color: #666;
        font-size: 0.9em;
        font-weight: bold;
        width: 70px;
        text-align: right;
        padding-right: 10px;
      ` : ''}
    }
    
    .numbered-line {
      ${enableLineNumbers ? 'position: relative;' : ''}
    }
    
    .numbered-line::after {
      ${enableLineNumbers ? `
        content: attr(data-line-start);
        position: absolute;
        left: ${enableParagraphNumbers ? '-135px' : '-55px'};
        top: 0;
        color: #999;
        font-size: 0.8em;
        width: 45px;
        text-align: right;
        padding-right: 10px;
      ` : ''}
    }
    
    .section-heading, .subsection-heading, .subsubsection-heading {
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    
    .no-numbering-zone, .no-numbering-zone * {
      padding-left: 0 !important;
    }
    
    .no-numbering-zone .numbered-paragraph::before {
      display: none !important;
    }
    
    .crm-matrix {
      margin-left: 0 !important;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Box ref={containerRef} sx={{ position: 'relative' }} />
    </>
  );
};

export default DocumentNumbering;