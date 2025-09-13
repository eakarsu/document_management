import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DocumentNumberingProps {
  content: string;
  enableLineNumbers?: boolean;
  enablePageNumbers?: boolean;
  linesPerPage?: number;
}

const DocumentNumbering: React.FC<DocumentNumberingProps> = ({
  content,
  enableLineNumbers = true,
  enablePageNumbers = true,
  linesPerPage = 50
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const processDocument = () => {
      const container = containerRef.current!;
      
      // Debug: Log the content to see if it has styles
      console.log('📊 DOCUMENT NUMBERING - Received content:', {
        contentLength: content.length,
        hasStyles: content.includes('style='),
        firstStyleFound: content.indexOf('style=') > -1 ? content.substring(content.indexOf('style='), content.indexOf('style=') + 100) : 'No styles found',
        first500Chars: content.substring(0, 500)
      });
      
      // First, set the raw HTML content (preserves inline styles)
      container.innerHTML = content;
      
      // Debug: Check if styles are preserved after setting innerHTML
      const firstH3 = container.querySelector('h3');
      const firstP = container.querySelector('p');
      console.log('📊 DOCUMENT NUMBERING - After setting innerHTML:', {
        h3Found: !!firstH3,
        h3Style: firstH3?.getAttribute('style'),
        h3ComputedMarginLeft: firstH3 ? window.getComputedStyle(firstH3).marginLeft : 'N/A',
        pFound: !!firstP,
        pStyle: firstP?.getAttribute('style'),
        pComputedMarginLeft: firstP ? window.getComputedStyle(firstP).marginLeft : 'N/A'
      });
      
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
      
      // Skip paragraph numbering - numbers are now embedded in content
      if (false) { // Paragraph numbering disabled - numbers are embedded
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
        const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach((header) => {
          const level = parseInt(header.tagName.charAt(1));
          
          // Check if heading already has a number at the start
          const existingNumber = header.textContent?.match(/^([\d]+(?:\.\d+)*)\s+/);
          
          if (level === 1) {
            // H1 headers - main title, usually no number
            if (existingNumber) {
              const num = existingNumber[1];
              const mainNum = parseInt(num.split('.')[0]);
              currentSection = mainNum;
              sectionCounter = Math.max(sectionCounter, mainNum);
            }
            
            currentSubsection = 0;
            currentSubsubsection = 0;
            subsectionCounter = 0;
            subsubsectionCounter = 0;
            paragraphCounter = 0;
            currentLevel = 1;
            
            // Don't modify the header, just mark it
            header.classList.add('section-heading', 'no-paragraph-number', 'no-number');
            header.setAttribute('data-section', `${currentSection}`);
            header.setAttribute('data-level', '1');
            
          } else if (level === 2) {
            // H2 headers like "1. Section" or just section titles
            console.log('Processing H2:', header.textContent, 'Existing number:', existingNumber);
            if (existingNumber) {
              const numStr = existingNumber[1];
              const parts = numStr.split('.');
              
              if (parts.length >= 1) {
                currentSection = parseInt(parts[0]) || 1;
                sectionCounter = Math.max(sectionCounter, currentSection);
                console.log('H2 has number, setting section to:', currentSection);
              }
            } else {
              // No number found, but this is still a section - increment counter
              sectionCounter++;
              currentSection = sectionCounter;
              console.log('H2 no number, incrementing to section:', currentSection);
            }
            
            currentSubsection = 0;
            currentSubsubsection = 0;
            subsectionCounter = 0;
            paragraphCounter = 0;
            currentLevel = 2;
            
            header.classList.add('subsection-heading', 'no-paragraph-number', 'no-number');
            header.setAttribute('data-section', `${currentSection}`);
            header.setAttribute('data-level', '2');
            
          } else if (level === 3) {
            // H3 headers like "1.1 Subsection"
            if (existingNumber) {
              const numStr = existingNumber[1];
              const parts = numStr.split('.');
              
              if (parts.length >= 2) {
                currentSection = parseInt(parts[0]) || currentSection;
                currentSubsection = parseInt(parts[1]) || 0;
                subsectionCounter = Math.max(subsectionCounter, currentSubsection);
              }
            }
            
            paragraphCounter = 0;
            currentLevel = 3;
            
            header.classList.add('subsubsection-heading', 'no-paragraph-number', 'no-number');
            header.setAttribute('data-section', `${currentSection}.${currentSubsection}`);
            header.setAttribute('data-level', '3');
          } else if (level >= 4) {
            // H4, H5, H6 headers - deeper subsections like "1.1.1 Authentication Module"
            if (existingNumber) {
              const numStr = existingNumber[1];
              const parts = numStr.split('.');
              
              // Parse the full section number (e.g., "1.1.1" or "1.1.1.1")
              if (parts.length >= 1) currentSection = parseInt(parts[0]) || currentSection;
              if (parts.length >= 2) currentSubsection = parseInt(parts[1]) || currentSubsection;
              if (parts.length >= 3) currentSubsubsection = parseInt(parts[2]) || 0;
              
              // Store the full section number for this header
              header.setAttribute('data-full-section', numStr);
            }
            
            paragraphCounter = 0;
            currentLevel = level;
            
            header.classList.add('deep-heading', 'no-paragraph-number', 'no-number');
            header.setAttribute('data-section', existingNumber ? existingNumber[1] : `${currentSection}.${currentSubsection}.${currentSubsubsection}`);
            header.setAttribute('data-level', level.toString());
          }
        });
        
        // Now process all elements in order to assign paragraph numbers
        const allElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        
        // Track the current full section number for deep nesting
        let currentFullSection = '';
        
        allElements.forEach((elem) => {
          if (elem.tagName.match(/^H[1-6]$/)) {
            // This is a header - update current section context
            const level = parseInt(elem.tagName.charAt(1));
            const dataSection = elem.getAttribute('data-section');
            
            if (level === 1) {
              currentSection = parseInt(dataSection || '0');
              currentSubsection = 0;
              currentSubsubsection = 0;
              paragraphCounter = 0;
              currentLevel = 1;
              currentFullSection = dataSection || '';
            } else if (level === 2) {
              const parts = (dataSection || '').split('.');
              currentSection = parseInt(parts[0] || '0') || 1; // Default to 1 if no section
              currentSubsection = parseInt(parts[1] || '0');
              currentSubsubsection = 0;
              paragraphCounter = 0;
              currentLevel = 2;
              currentFullSection = `${currentSection}`; // Ensure we have the section number
            } else if (level === 3) {
              const parts = (dataSection || '').split('.');
              currentSection = parseInt(parts[0] || '0') || currentSection;
              currentSubsection = parseInt(parts[1] || '0') || currentSubsection;
              currentSubsubsection = parseInt(parts[2] || '0');
              paragraphCounter = 0;
              currentLevel = 3;
              currentFullSection = dataSection || '';
            } else if (level >= 4) {
              // For h4, h5, h6 - use the full section number
              currentFullSection = dataSection || '';
              paragraphCounter = 0;
              currentLevel = level;
              
              // Parse the section parts for context
              const parts = currentFullSection.split('.');
              if (parts.length >= 1) currentSection = parseInt(parts[0]) || currentSection;
              if (parts.length >= 2) currentSubsection = parseInt(parts[1]) || currentSubsection;
              if (parts.length >= 3) currentSubsubsection = parseInt(parts[2]) || currentSubsubsection;
            }
          } else if (elem.tagName === 'P') {
            // This is a paragraph - give it a paragraph number
            // BUT skip paragraphs that are:
            // - Inside lists (ul, ol)
            // - Inside tables
            // - Inside blockquotes
            // - Special classes
            // - Immediately after a header (might be subtitle or description)
            const prevElem = elem.previousElementSibling;
            const isSubtitle = prevElem && prevElem.tagName && prevElem.tagName.match(/^H[1-4]$/);
            
            if (!elem.classList.contains('no-number') && 
                !elem.classList.contains('no-paragraph-number') &&
                !elem.classList.contains('subtitle') &&
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
              
              // Build paragraph number based on current full section
              if (currentFullSection && currentFullSection !== '') {
                // Use the full section number and append the paragraph counter
                paraNum = `${currentFullSection}.${paragraphCounter}`;
              } else if (currentLevel === 3 && currentSubsubsection > 0) {
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
  }, [content, enableLineNumbers, enablePageNumbers, linesPerPage]);

  // CSS for displaying the numbers
  const styles = `
    /* Preserve ALL inline styles from the original HTML */
    [style*="margin-left"] {
      /* Keep the original margin-left value */
    }
    
    /* Force headers to respect their inline margin-left styles */
    h2[style*="margin-left: 20px"] { margin-left: 20px !important; }
    h3[style*="margin-left: 20px"] { margin-left: 20px !important; }
    h3[style*="margin-left: 40px"] { margin-left: 40px !important; }
    h4[style*="margin-left: 40px"] { margin-left: 40px !important; }
    h4[style*="margin-left: 60px"] { margin-left: 60px !important; }
    h5[style*="margin-left: 60px"] { margin-left: 60px !important; }
    h5[style*="margin-left: 80px"] { margin-left: 80px !important; }
    h6[style*="margin-left: 80px"] { margin-left: 80px !important; }
    h6[style*="margin-left: 100px"] { margin-left: 100px !important; }
    
    /* Force paragraphs to respect their inline margin-left styles */
    p[style*="margin-left: 20px"] { margin-left: 20px !important; }
    p[style*="margin-left: 40px"] { margin-left: 40px !important; }
    p[style*="margin-left: 60px"] { margin-left: 60px !important; }
    p[style*="margin-left: 80px"] { margin-left: 80px !important; }
    p[style*="margin-left: 100px"] { margin-left: 100px !important; }
    
    [style*="margin-bottom"] {
      /* Preserve margin-bottom */
    }
    
    /* Ensure line-height and margin-bottom from inline styles are preserved */
    p[style*="line-height: 1.8"] {
      line-height: 1.8 !important;
    }
    
    p[style*="margin-bottom: 1.5em"] {
      margin-bottom: 1.5em !important;
    }
    
    /* Ensure headers are not numbered */
    h1, h2, h3, h4, h5, h6 {
      position: relative;
    }
    
    h1.no-number::before,
    h2.no-number::before,
    h3.no-number::before,
    h4.no-number::before {
      content: none !important;
    }
    
    /* Ensure proper spacing for headings - but preserve inline styles */
    h1:not([style]), h2:not([style]), h3:not([style]), h4:not([style]) {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      clear: both;
    }
    
    /* Preserve heading indentation from inline styles */
    h3[style*="margin-left: 20px"] {
      margin-left: 20px !important;
    }
    
    h4[style*="margin-left: 40px"] {
      margin-left: 40px !important;
    }
    
    h5[style*="margin-left: 60px"] {
      margin-left: 60px !important;
    }
    
    h6[style*="margin-left: 80px"] {
      margin-left: 80px !important;
    }
    
    /* Only add line number offset to paragraphs */
    p.numbered-paragraph {
      position: relative;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }
    
    /* Adjust margin for line numbers while preserving inline styles */
    ${enableLineNumbers ? `
      p.numbered-paragraph:not([style*="margin-left"]) {
        margin-left: 60px;
      }
      p.numbered-paragraph[style*="margin-left: 20px"] {
        margin-left: 80px !important;
      }
      p.numbered-paragraph[style*="margin-left: 40px"] {
        margin-left: 100px !important;
      }
      p.numbered-paragraph[style*="margin-left: 60px"] {
        margin-left: 120px !important;
      }
      p.numbered-paragraph[style*="margin-left: 80px"] {
        margin-left: 140px !important;
      }
      p.numbered-paragraph[style*="margin-left: 100px"] {
        margin-left: 160px !important;
      }
    ` : ''}
    
    p.numbered-paragraph::before {
      ${false ? `
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
        display: block;
      ` : ''}
    }
    
    .numbered-line {
      ${enableLineNumbers ? 'position: relative;' : ''}
    }
    
    .numbered-line::after {
      ${enableLineNumbers ? `
        content: attr(data-line-start);
        position: absolute;
        left: -55px;
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
      <Box ref={containerRef} sx={{ position: 'relative' }} data-document-content="true" />
    </>
  );
};

export default DocumentNumbering;