'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Chip, Typography, Paper } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface DAFPublicationEditorWithPageNumbersProps {
  documentId: string;
  initialContent: string;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export const DAFPublicationEditorWithPageNumbers: React.FC<DAFPublicationEditorWithPageNumbersProps> = ({
  documentId,
  initialContent,
  onSave,
  readOnly = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Constants for page calculation (US Letter: 8.5" x 11")
  const PAGE_HEIGHT_PX = 1056; // ~11 inches at 96 DPI
  const PAGE_MARGIN_TOP = 72; // ~0.75 inch
  const PAGE_MARGIN_BOTTOM = 72; // ~0.75 inch
  const CONTENT_HEIGHT_PER_PAGE = PAGE_HEIGHT_PX - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM;
  const LINE_HEIGHT = 24; // Approximate line height in pixels
  const LINES_PER_PAGE = Math.floor(CONTENT_HEIGHT_PER_PAGE / LINE_HEIGHT);

  const updateCurrentPage = useCallback(() => {
    if (!editorContainerRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Find the parent element
    let element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement;

    if (!element) return;

    // Find which page this element is on
    const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;

    const allElements = Array.from(editorElement.children) as HTMLElement[];
    const elementIndex = allElements.indexOf(element.closest('[data-page-start]') || element);
    
    let pageNum = 1;
    for (let i = 0; i <= elementIndex && i < allElements.length; i++) {
      if (allElements[i].hasAttribute('data-page-start')) {
        pageNum = parseInt(allElements[i].getAttribute('data-page-start') || '1');
      }
    }

    setCurrentPage(pageNum);
  }, []);

  const calculatePageBreaks = useCallback(() => {
    if (!editorContainerRef.current) return;

    const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;

    const allElements = Array.from(editorElement.children) as HTMLElement[];
    let currentHeight = 0;
    let currentPageNum = 1;
    const breaks: number[] = [];
    
    console.log('Calculating page breaks. Total elements:', allElements.length);
    console.log('Content height per page:', CONTENT_HEIGHT_PER_PAGE);

    allElements.forEach((element, index) => {
      const elementHeight = element.getBoundingClientRect().height || element.offsetHeight || 20;
      
      // Check if adding this element would exceed page height
      if (currentHeight + elementHeight > CONTENT_HEIGHT_PER_PAGE && currentHeight > 0) {
        // Add page break before this element
        breaks.push(index);
        currentPageNum++;
        console.log(`Page break at element ${index}, starting page ${currentPageNum}, current height was ${currentHeight}px`);
        currentHeight = elementHeight;
        
        // Add visual page number indicator
        element.setAttribute('data-page-start', currentPageNum.toString());
      } else {
        currentHeight += elementHeight;
        element.removeAttribute('data-page-start');
      }
    });

    console.log(`Total pages calculated: ${currentPageNum}, breaks at:`, breaks);
    setPageBreaks(breaks);
    setTotalPages(currentPageNum);

    // Update current page based on cursor position
    updateCurrentPage();
  }, [updateCurrentPage]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Recalculate page breaks on content change
      setTimeout(() => {
        calculatePageBreaks();
      }, 100);
    },
    onSelectionUpdate: ({ editor }) => {
      updateCurrentPage();
    }
  });

  // Initial calculation and whenever content changes
  useEffect(() => {
    if (editor) {
      // Initial calculation
      setTimeout(() => {
        console.log('Initial page calculation triggered');
        calculatePageBreaks();
      }, 500);
      
      // Also calculate when content is set
      const content = editor.getHTML();
      if (content && content.length > 100) {
        setTimeout(() => {
          console.log('Content-based page calculation triggered');
          calculatePageBreaks();
        }, 1000);
      }
    }
  }, [editor, calculatePageBreaks]);
  
  // Recalculate when initial content loads
  useEffect(() => {
    if (editor && initialContent) {
      console.log('Setting initial content, length:', initialContent.length);
      editor.commands.setContent(initialContent);
      setTimeout(() => {
        console.log('Post-content page calculation');
        calculatePageBreaks();
      }, 300);
    }
  }, [initialContent, editor, calculatePageBreaks]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      calculatePageBreaks();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePageBreaks]);

  if (!editor) {
    return <Box sx={{ p: 3 }}>Loading editor...</Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar with page indicator and formatting buttons */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`Page ${currentPage} of ${totalPages}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="caption" color="text.secondary">
            Estimated pages based on US Letter format (8.5" × 11")
          </Typography>
        </Box>
        
        {/* Document Formatting Tools */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <button
            onClick={() => {
              // Generate Table of Contents
              const html = editor.getHTML();
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');
              
              let toc = '<div class="table-of-contents"><h2>Table of Contents</h2><ul>';
              headers.forEach((header) => {
                const level = parseInt(header.tagName.charAt(1));
                const text = header.textContent || '';
                const indent = '&nbsp;&nbsp;'.repeat((level - 1) * 2);
                toc += `<li>${indent}${text}</li>`;
              });
              toc += '</ul></div><br/>';
              
              // Insert at beginning
              editor.commands.setContent(toc + html);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Generate Table of Contents"
          >
            Generate TOC
          </button>
          
          <button
            onClick={() => {
              // Auto-number chapters and sections
              let html = editor.getHTML();
              let chapterNum = 0;
              let sectionNum = 0;
              let currentChapter = 0;
              
              // Process H1s for chapters
              html = html.replace(/<h1>(?!Chapter \d+:)(.*?)<\/h1>/gi, (match, title) => {
                chapterNum++;
                return `<h1>Chapter ${chapterNum}: ${title}</h1>`;
              });
              
              // Process H2s for sections
              html = html.replace(/<h([1-2])>(.*?)<\/h\1>/gi, (match, level, title) => {
                if (level === '1') {
                  currentChapter++;
                  sectionNum = 0;
                  return match;
                } else if (level === '2' && !title.match(/^\d+\.\d+/)) {
                  sectionNum++;
                  return `<h2>${currentChapter}.${sectionNum} ${title}</h2>`;
                }
                return match;
              });
              
              editor.commands.setContent(html);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Number Chapters & Sections"
          >
            Number Chapters
          </button>
          
          <button
            onClick={() => {
              // Add standard document structure
              const template = `<h1>Executive Summary</h1>
<p>Provide a brief overview of the document's purpose and key findings.</p>

<h1>Chapter 1: Introduction</h1>
<p>Introduction to the document topic.</p>

<h2>1.1 Background</h2>
<p>Background information and context.</p>

<h2>1.2 Objectives</h2>
<p>Document objectives and goals.</p>

<h2>1.3 Scope</h2>
<p>Scope and limitations of the document.</p>

<h1>Chapter 2: Main Content</h1>
<p>Main content goes here.</p>

<h2>2.1 Section One</h2>
<p>First main section content.</p>

<h2>2.2 Section Two</h2>
<p>Second main section content.</p>

<h1>Chapter 3: Conclusion</h1>
<p>Conclusions and recommendations.</p>

<h1>References</h1>
<p>List of references and citations.</p>

<h1>Appendices</h1>
<p>Additional supporting materials.</p>`;
              
              if (confirm('Replace current content with document template?')) {
                editor.commands.setContent(template);
              }
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Insert Document Template"
          >
            Document Template
          </button>
        </Box>
      </Box>

      {/* Editor with page breaks */}
      <Box 
        ref={editorContainerRef}
        sx={{ 
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          bgcolor: '#f8f8f8',
          p: 2
        }}
      >
        <Paper 
          elevation={3}
          sx={{ 
            maxWidth: '8.5in',
            margin: '0 auto',
            bgcolor: 'white',
            minHeight: '11in',
            position: 'relative',
            '& .ProseMirror': {
              padding: '1in',
              minHeight: '9in',
              outline: 'none',
              fontSize: '12pt',
              fontFamily: 'Times New Roman, serif',
              lineHeight: 1.5,
              
              // Style for page break indicators
              '& [data-page-start]::before': {
                content: 'attr(data-page-start)',
                position: 'absolute',
                left: '0.5in',
                marginTop: '-30px',
                fontSize: '10px',
                color: '#2196f3',
                backgroundColor: 'white',
                padding: '2px 6px',
                border: '1px solid #2196f3',
                borderRadius: '3px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                zIndex: 10
              },
              
              '& [data-page-start]': {
                paddingTop: '40px',
                borderTop: '2px dashed #2196f3',
                marginTop: '20px',
                position: 'relative',
                
                '&::after': {
                  content: '"Page " attr(data-page-start)',
                  position: 'absolute',
                  right: '0.5in',
                  top: '5px',
                  fontSize: '10px',
                  color: '#666',
                  fontFamily: 'Arial, sans-serif'
                }
              },
              
              // First element should not have page break
              '& > :first-child[data-page-start]': {
                paddingTop: '0',
                borderTop: 'none',
                marginTop: '0',
                '&::before, &::after': {
                  display: 'none'
                }
              },
              
              '& h1': { 
                fontSize: '14pt', 
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '12pt',
                marginBottom: '12pt',
                pageBreakInside: 'avoid'
              },
              '& h2': { 
                fontSize: '13pt', 
                fontWeight: 'bold',
                marginTop: '12pt',
                marginBottom: '6pt',
                pageBreakInside: 'avoid'
              },
              '& h3': { 
                fontSize: '12pt', 
                fontWeight: 'bold',
                marginTop: '6pt',
                marginBottom: '6pt',
                pageBreakInside: 'avoid'
              },
              '& p': {
                marginBottom: '6pt',
                textAlign: 'justify',
                pageBreakInside: 'auto'
              },
              '& ul, & ol': {
                marginLeft: '0.5in',
                marginBottom: '6pt',
                pageBreakInside: 'auto'
              },
              '& li': {
                marginBottom: '3pt',
                pageBreakInside: 'avoid'
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '12pt',
                pageBreakInside: 'auto',
                '& th, & td': {
                  border: '1px solid black',
                  padding: '4pt 8pt',
                  textAlign: 'left',
                  pageBreakInside: 'avoid'
                },
                '& th': {
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold'
                }
              },
              '& blockquote': {
                borderLeft: '3px solid #ccc',
                marginLeft: '0.5in',
                paddingLeft: '0.25in',
                fontStyle: 'italic',
                color: '#555'
              }
            }
          }}
        >
          <EditorContent editor={editor} />
        </Paper>

        {/* Hidden measuring element for accurate height calculations */}
        <div 
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            width: '6.5in',
            fontSize: '12pt',
            fontFamily: 'Times New Roman, serif',
            lineHeight: 1.5
          }}
        />
      </Box>
    </Box>
  );
};

export default DAFPublicationEditorWithPageNumbers;