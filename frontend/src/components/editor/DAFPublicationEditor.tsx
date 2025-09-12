'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, Button, Divider, Chip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Save, FileDownload, Print } from '@mui/icons-material';
import { api } from '../../lib/api';

// Import TipTap editor and extensions
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface DAFPublicationEditorProps {
  documentId: string;
  initialContent: string;
  initialMetadata?: {
    title: string;
    publicationType: string;
    publicationNumber: string;
    opr: string;
  };
  customFields?: any;  // Added to access custom fields
  mode?: 'edit' | 'create' | 'review';
  onSave?: (content: string, metadata: any, sections?: any[]) => Promise<void>;
  onExport?: (format: string) => void;
  readOnly?: boolean;
}

export const DAFPublicationEditor: React.FC<DAFPublicationEditorProps> = ({
  documentId,
  initialContent,
  initialMetadata,
  customFields,
  mode = 'edit',
  onSave,
  onExport,
  readOnly = false
}) => {
  const [metadata, setMetadata] = useState(initialMetadata || {
    title: '',
    publicationType: 'DAFMAN',
    publicationNumber: '',
    opr: ''
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const editorRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Check if document has Air Force header that needs preservation
  const hasAirForceHeader = customFields?.hasCustomHeader || 
    (initialContent && initialContent.includes('BY ORDER OF THE') && initialContent.includes('SECRETARY OF THE AIR FORCE'));
  const headerHtml = customFields?.headerHtml;
  const documentStyles = customFields?.documentStyles;
  const editableContent = customFields?.editableContent || initialContent;

  // Calculate estimated pages based on content height
  const calculatePages = useCallback(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const pageHeight = 1056; // ~11 inches at 96 DPI
      const estimatedPages = Math.ceil(contentHeight / pageHeight);
      setTotalPages(estimatedPages);
      
      // Calculate current page based on scroll position or cursor position
      if (editorRef.current) {
        const selection = editorRef.current.state.selection;
        const pos = selection.$anchor.pos;
        const resolvedPos = editorRef.current.state.doc.resolve(pos);
        
        // Try to estimate page based on position in document
        const totalSize = editorRef.current.state.doc.content.size;
        const relativePosition = pos / totalSize;
        const estimatedCurrentPage = Math.max(1, Math.ceil(relativePosition * estimatedPages));
        setCurrentPage(estimatedCurrentPage);
      }
    }
  }, []);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list'
          }
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'daf-table'
        }
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline,
      Color,
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'daf-link'
        }
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'daf-image'
        }
      })
    ],
    content: hasAirForceHeader ? editableContent : initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      calculatePages();
    },
    onSelectionUpdate: ({ editor }) => {
      calculatePages();
    }
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      calculatePages();
    }
  }, [editor, calculatePages]);

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
      calculatePages();
    }
  }, [initialContent, editor, calculatePages]);

  // Handle window resize to recalculate pages
  useEffect(() => {
    const handleResize = () => calculatePages();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePages]);

  const handleSave = async () => {
    if (!editor || !onSave) return;
    
    setSaving(true);
    try {
      const content = editor.getHTML();
      await onSave(content, metadata);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format);
    }
  };

  if (!editor) {
    return <Box sx={{ p: 3 }}>Loading editor...</Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#f5f5f5'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Page Indicator */}
          <Chip 
            label={`Page ${currentPage} of ${totalPages}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          
          {/* Format Buttons */}
          <Button
            size="small"
            variant={editor.isActive('bold') ? 'contained' : 'outlined'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            B
          </Button>
          <Button
            size="small"
            variant={editor.isActive('italic') ? 'contained' : 'outlined'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            I
          </Button>
          <Button
            size="small"
            variant={editor.isActive('underline') ? 'contained' : 'outlined'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            U
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          {/* List Buttons */}
          <Button
            size="small"
            variant={editor.isActive('bulletList') ? 'contained' : 'outlined'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </Button>
          <Button
            size="small"
            variant={editor.isActive('orderedList') ? 'contained' : 'outlined'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          {/* Document Formatting Tools */}
          <Button
            size="small"
            variant="outlined"
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
            title="Generate Table of Contents"
          >
            TOC
          </Button>
          
          <Button
            size="small"
            variant="outlined"
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
            title="Number Chapters & Sections"
          >
            #Ch
          </Button>
          
          <Button
            size="small"
            variant="outlined"
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
              
              if (editor.isEmpty || confirm('Replace current content with document template?')) {
                editor.commands.setContent(template);
              }
            }}
            title="Insert Document Template"
          >
            Template
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!readOnly && (
            <Button
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
              variant="contained"
              color="primary"
              size="small"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button
            startIcon={<FileDownload />}
            onClick={() => handleExport('pdf')}
            size="small"
          >
            Export
          </Button>
          <Button
            startIcon={<Print />}
            onClick={() => window.print()}
            size="small"
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Page breaks indicator */}
      <Box sx={{ position: 'relative', flex: 1, overflow: 'auto' }}>
        <Box 
          ref={contentRef}
          sx={{ 
            p: 3,
            minHeight: '100%',
            '& .ProseMirror': {
              minHeight: '100%',
              outline: 'none',
              fontSize: '11pt',
              fontFamily: 'Times New Roman, serif',
              lineHeight: 1.5,
              position: 'relative',
              
              // Add page break indicators every ~11 inches
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                height: '1px',
                borderTop: '2px dashed #ccc',
                pointerEvents: 'none'
              },
              
              '& h1': { 
                fontSize: '14pt', 
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '12pt',
                marginBottom: '12pt'
              },
              '& h2': { 
                fontSize: '12pt', 
                fontWeight: 'bold',
                marginTop: '12pt',
                marginBottom: '6pt'
              },
              '& h3': { 
                fontSize: '11pt', 
                fontWeight: 'bold',
                fontStyle: 'italic',
                marginTop: '6pt',
                marginBottom: '6pt'
              },
              '& p': {
                marginBottom: '6pt',
                textAlign: 'justify'
              },
              '& .bullet-list, & .ordered-list': {
                marginLeft: '0.5in',
                marginBottom: '6pt'
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '12pt',
                '& th, & td': {
                  border: '1px solid black',
                  padding: '4pt',
                  textAlign: 'left'
                },
                '& th': {
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold'
                }
              }
            }
          }}
        >
          {/* Render preserved Air Force header if present */}
          {hasAirForceHeader && headerHtml && (
            <>
              {documentStyles && (
                <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
              )}
              <Box 
                sx={{ 
                  backgroundColor: 'white',
                  marginBottom: 3,
                  pointerEvents: 'none',
                  '& img': { maxWidth: '120px', height: 'auto' }
                }}
                dangerouslySetInnerHTML={{ __html: headerHtml }}
              />
              <Divider sx={{ my: 2, borderColor: 'black', borderWidth: 2 }} />
            </>
          )}
          
          <EditorContent editor={editor} />
          
          {/* Page break indicators */}
          {Array.from({ length: totalPages - 1 }, (_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${(i + 1) * 1056}px`, // Page break every ~11 inches
                height: '0',
                borderTop: '2px dashed #2196f3',
                pointerEvents: 'none',
                '&::after': {
                  content: `"Page ${i + 2}"`,
                  position: 'absolute',
                  right: '10px',
                  top: '2px',
                  fontSize: '10px',
                  color: '#2196f3',
                  backgroundColor: 'white',
                  padding: '0 4px'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DAFPublicationEditor;