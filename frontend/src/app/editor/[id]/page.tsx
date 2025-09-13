'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  ButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Drawer,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  ArrowBack,
  Save as SaveIcon,
  Undo,
  Redo,
  Preview as PreviewIcon,
  History as HistoryIcon,
  TrackChanges,
  Check,
  Close,
  Comment,
  FindReplace,
  Print,
  Download,
  Upload,
  EmojiEmotions,
  Functions,
  FormatListNumbered,
  PostAdd,
  Layers,
  AddCircleOutline
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import TypographyExtension from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Extension } from '@tiptap/core';
import { api } from '../../../lib/api';
import { authTokenService } from '../../../lib/authTokenService';
import { ChangeTracking, type Change } from '../../../lib/tiptap-change-tracking';

interface DocumentDetails {
  id: string;
  title: string;
  content?: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const DocumentEditor: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [documentData, setDocumentData] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [trackChanges, setTrackChanges] = useState(true);
  const [showChanges, setShowChanges] = useState(true);
  const [changes, setChanges] = useState<Change[]>([]);
  const [changesDrawerOpen, setChangesDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  
  // Supplement states
  const [supplementDialogOpen, setSupplementDialogOpen] = useState(false);
  const [supplementType, setSupplementType] = useState('MAJCOM');
  const [supplementLevel, setSupplementLevel] = useState(2);
  const [supplementOrganization, setSupplementOrganization] = useState('');
  const [viewMode, setViewMode] = useState<'base' | 'integrated' | 'supplement'>('base');
  const [hasSupplements, setHasSupplements] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('serif');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [airForceHeader, setAirForceHeader] = useState<{
    hasHeader: boolean;
    headerHtml?: string;
    documentStyles?: string;
    editableContent?: string;
  }>({ hasHeader: false });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf' | 'docx' | 'txt'>('html');

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // We'll define these after the editor is created
  const calculatePageFromCursorRef = useRef<(() => void) | null>(null);
  const calculatePageFromScrollRef = useRef<(() => void) | null>(null);

  // Calculate page based on scroll position
  const calculatePageFromScroll = useCallback(() => {
    // Check if document is ready
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    try {
      // Get scroll position - handle SSR and early renders
      const scrollTop = window.pageYOffset || 
                       (document.documentElement && document.documentElement.scrollTop) || 
                       (document.body && document.body.scrollTop) || 
                       0;
      const scrollHeight = Math.max(
        (document.documentElement && document.documentElement.scrollHeight) || 0,
        (document.body && document.body.scrollHeight) || 0,
        1
      );
      const clientHeight = window.innerHeight || 
                          (document.documentElement && document.documentElement.clientHeight) || 
                          (document.body && document.body.clientHeight) || 
                          0;
      
      // Avoid division by zero
      if (scrollHeight <= clientHeight || totalPages === 0) {
        // Document fits in window, use cursor position instead
        if (calculatePageFromCursorRef.current) {
          calculatePageFromCursorRef.current();
        }
        return;
      }
      
      // Calculate what percentage of the document we've scrolled through
      const maxScroll = scrollHeight - clientHeight;
      const scrollPercentage = Math.min(1, Math.max(0, scrollTop / maxScroll));
      
      // Calculate current page based on scroll position
      // Use floor and add 1 to start from page 1
      const calculatedPage = Math.max(1, Math.min(totalPages, 
        Math.floor(scrollPercentage * (totalPages - 1)) + 1
      ));
      
      // Scroll calculation (debug logging removed)
      
      setCurrentPage(calculatedPage);
    } catch (error) {
      console.error('Error calculating page from scroll:', error);
      if (calculatePageFromCursorRef.current) {
        calculatePageFromCursorRef.current();
      }
    }
  }, [totalPages]);

  // Store the function in ref to avoid dependency issues
  useEffect(() => {
    calculatePageFromScrollRef.current = calculatePageFromScroll;
  }, [calculatePageFromScroll]);

  // Track scroll events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (calculatePageFromScrollRef.current) {
          calculatePageFromScrollRef.current();
        }
      }, 50);
    };

    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Calculate initial page position
    setTimeout(() => {
      if (calculatePageFromScrollRef.current) {
        calculatePageFromScrollRef.current();
      }
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const lowlight = createLowlight(common);

  // Custom extension to preserve inline styles
  const PreserveStyles = Extension.create({
    name: 'preserveStyles',
    
    addGlobalAttributes() {
      return [
        {
          types: ['heading', 'paragraph', 'listItem', 'blockquote'],
          attributes: {
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
          },
        },
      ];
    },
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      PreserveStyles, // Add custom extension to preserve inline styles
      StarterKit.configure({
        history: {
          depth: 100,
        },
        codeBlock: false, // We'll use CodeBlockLowlight instead
        heading: {
          HTMLAttributes: {
            // Allow style attribute on headings
            style: null,
          },
        },
        paragraph: {
          HTMLAttributes: {
            // Allow style attribute on paragraphs
            style: null,
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        validate: href => /^(https?:\/\/|#)/.test(href),
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-fixed',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'relative',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color,
      TextStyle.configure({
        HTMLAttributes: {
          // Preserve inline styles
          style: true,
        },
      }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TypographyExtension,
      CharacterCount.configure({
        limit: null,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-md p-4 my-2 overflow-x-auto',
        },
      }),
      ChangeTracking.configure({
        userId: user?.id || 'unknown',
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        trackChanges: trackChanges,
        showChanges: showChanges,
        changes: changes,
        onChangeAdded: (change: Change) => {
          setChanges(prev => [...prev, change]);
        },
      }),
    ],
    content: '', // Start with empty content, will be loaded via useEffect
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
      // Update word and character count
      const chars = editor.storage.characterCount.characters();
      const words = editor.storage.characterCount.words();
      setCharCount(chars);
      setWordCount(words);
      
      // Calculate total pages based on content
      // More accurate estimation: ~250 words per page for Air Force documents
      // Or count paragraphs/blocks for better accuracy
      const doc = editor.state.doc;
      let blockCount = 0;
      doc.descendants((node) => {
        if (node.isBlock) {
          blockCount++;
        }
      });
      
      const wordsPerPage = 250; // More conservative for formatted documents
      const charsPerPage = 1500; // More conservative for formatted documents
      const blocksPerPage = 25; // Approximate blocks per page
      
      // Use multiple calculations for better accuracy
      const pagesByWords = Math.ceil(words / wordsPerPage);
      const pagesByChars = Math.ceil(chars / charsPerPage);
      const pagesByBlocks = Math.ceil(blockCount / blocksPerPage);
      const estimatedPages = Math.max(1, Math.max(pagesByWords, pagesByChars, pagesByBlocks));
      
      // Page calculation in onUpdate
      
      // Count actual page divs first
      const html = editor.getHTML();
      const pageMatches = html.match(/data-page="/g);
      const pageCount = pageMatches ? pageMatches.length : 0;
      
      if (pageCount > 0) {
        setTotalPages(pageCount);
      } else {
        setTotalPages(estimatedPages);
      }
      
      // Don't update current page here - let scroll handle it
      // Just recalculate based on scroll after content changes
      setTimeout(() => {
        if (calculatePageFromScrollRef.current) {
          calculatePageFromScrollRef.current();
        }
      }, 100);
    },
    onSelectionUpdate: ({ editor }) => {
      // Don't update page on selection, let scroll handle it
      // This prevents jumping when just moving cursor
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-6 text-gray-900',
        spellcheck: 'true',
      },
    },
  });

  // Define the cursor-based page calculation function now that editor exists
  const calculatePageFromCursor = useCallback(() => {
    if (!editor || totalPages <= 1) return;
    
    try {
      // Get the current selection/cursor position
      const { from } = editor.state.selection;
      const totalSize = editor.state.doc.content.size;
      
      if (totalSize === 0) {
        setCurrentPage(1);
        return;
      }
      
      // Calculate percentage through document
      const percentage = from / totalSize;
      
      // Calculate page based on position
      const calculatedPage = Math.max(1, Math.min(totalPages, Math.ceil(percentage * totalPages)));
      
      // Cursor-based page calculation
      
      setCurrentPage(calculatedPage);
    } catch (error) {
      console.error('Error calculating page from cursor:', error);
    }
  }, [editor, totalPages]);

  // Update the ref with the cursor calculation function
  useEffect(() => {
    calculatePageFromCursorRef.current = calculatePageFromCursor;
  }, [calculatePageFromCursor]);

  // Listen to editor selection changes
  useEffect(() => {
    if (!editor) return;
    
    const updatePageFromSelection = () => {
      if (calculatePageFromCursorRef.current) {
        calculatePageFromCursorRef.current();
      }
    };
    
    editor.on('selectionUpdate', updatePageFromSelection);
    
    return () => {
      editor.off('selectionUpdate', updatePageFromSelection);
    };
  }, [editor]);

  // Load document content
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        
        // Wait a bit for editor to be ready
        if (!editor) {
          setTimeout(() => loadDocument(), 100);
          return;
        }
        
        // First get basic document info
        const docResponse = await api.get(`/api/documents/${documentId}`);
        
        if (docResponse.ok) {
          const docData = await docResponse.json();
          setDocumentData(docData.document);
          
          // Then get the editable content
          const contentResponse = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/content`, {
            method: 'GET'
          });
          
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            
            if (contentData.success && contentData.document.content) {
              // Load actual document content
              let content = contentData.document.content;
              
              // Check if document has Air Force header
              const customFields = contentData.document.customFields || {};
              if (customFields.hasCustomHeader && customFields.headerHtml) {
                setAirForceHeader({
                  hasHeader: true,
                  headerHtml: customFields.headerHtml,
                  documentStyles: customFields.documentStyles,
                  editableContent: customFields.editableContent
                });
                // Use editable content if available
                content = customFields.editableContent || content;
              }
              
              // If content is plain text, wrap it in paragraph tags
              if (!content.includes('<') && !content.includes('>')) {
                content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
              }
              
              editor.commands.setContent(content);
              
              // Trigger page calculation after content is set
              setTimeout(() => {
                const chars = editor.storage.characterCount.characters();
                const words = editor.storage.characterCount.words();
                const doc = editor.state.doc;
                let blockCount = 0;
                doc.descendants((node) => {
                  if (node.isBlock) {
                    blockCount++;
                  }
                });
                
                // Count actual page divs first
                const html = editor.getHTML();
                const pageMatches = html.match(/data-page="/g);
                const pageCount = pageMatches ? pageMatches.length : 0;
                
                console.log('Page calculation:', {
                  foundPageDivs: pageCount,
                  htmlLength: html.length,
                  words: words,
                  chars: chars,
                  blocks: blockCount
                });
                
                if (pageCount > 0) {
                  console.log('Using actual page divs:', pageCount);
                  setTotalPages(pageCount);
                } else {
                  // Fall back to estimation if no page divs
                  const pagesByWords = Math.ceil(words / 250);
                  const pagesByChars = Math.ceil(chars / 1500);
                  const pagesByBlocks = Math.ceil(blockCount / 25);
                  const pages = Math.max(1, Math.max(pagesByWords, pagesByChars, pagesByBlocks));
                  console.log('Using estimation:', pages);
                  setTotalPages(pages);
                }
                calculatePageFromScroll();
              }, 500);
            } else if (docData.document.content) {
              // Try to use content from basic document API
              let content = docData.document.content;
              
              // If content is plain text, wrap it in paragraph tags
              if (!content.includes('<') && !content.includes('>')) {
                content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
              }
              
              editor.commands.setContent(content);
              
              // Trigger page calculation after content is set
              setTimeout(() => {
                const chars = editor.storage.characterCount.characters();
                const words = editor.storage.characterCount.words();
                const doc = editor.state.doc;
                let blockCount = 0;
                doc.descendants((node) => {
                  if (node.isBlock) {
                    blockCount++;
                  }
                });
                
                // Count actual page divs first
                const html = editor.getHTML();
                const pageMatches = html.match(/data-page="/g);
                const pageCount = pageMatches ? pageMatches.length : 0;
                
                console.log('Page calculation:', {
                  foundPageDivs: pageCount,
                  htmlLength: html.length,
                  words: words,
                  chars: chars,
                  blocks: blockCount
                });
                
                if (pageCount > 0) {
                  console.log('Using actual page divs:', pageCount);
                  setTotalPages(pageCount);
                } else {
                  // Fall back to estimation if no page divs
                  const pagesByWords = Math.ceil(words / 250);
                  const pagesByChars = Math.ceil(chars / 1500);
                  const pagesByBlocks = Math.ceil(blockCount / 25);
                  const pages = Math.max(1, Math.max(pagesByWords, pagesByChars, pagesByBlocks));
                  console.log('Using estimation:', pages);
                  setTotalPages(pages);
                }
                calculatePageFromScroll();
              }, 500);
            } else {
              // Initialize with default content only if document has no content
              editor.commands.setContent(`
                <h1>${docData.document.title}</h1>
                <p>Start editing your document here...</p>
                <p>Use the toolbar to format text, add tables, images, and more.</p>
                <p><em>This is a comprehensive rich text editor with change tracking capabilities.</em></p>
              `);
            }
          } else {
            // Try to load from document data even if content endpoint fails
            if (docData.document.content) {
              let content = docData.document.content;
              
              // If content is plain text, wrap it in paragraph tags
              if (!content.includes('<') && !content.includes('>')) {
                content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
              }
              
              editor.commands.setContent(content);
              
              // Trigger page calculation
              setTimeout(() => {
                const chars = editor.storage.characterCount.characters();
                const words = editor.storage.characterCount.words();
                const doc = editor.state.doc;
                let blockCount = 0;
                doc.descendants((node) => {
                  if (node.isBlock) {
                    blockCount++;
                  }
                });
                
                // Count actual page divs first
                const html = editor.getHTML();
                const pageMatches = html.match(/data-page="/g);
                const pageCount = pageMatches ? pageMatches.length : 0;
                
                console.log('Page calculation:', {
                  foundPageDivs: pageCount,
                  htmlLength: html.length,
                  words: words,
                  chars: chars,
                  blocks: blockCount
                });
                
                if (pageCount > 0) {
                  console.log('Using actual page divs:', pageCount);
                  setTotalPages(pageCount);
                } else {
                  // Fall back to estimation if no page divs
                  const pagesByWords = Math.ceil(words / 250);
                  const pagesByChars = Math.ceil(chars / 1500);
                  const pagesByBlocks = Math.ceil(blockCount / 25);
                  const pages = Math.max(1, Math.max(pagesByWords, pagesByChars, pagesByBlocks));
                  console.log('Using estimation:', pages);
                  setTotalPages(pages);
                }
                calculatePageFromScroll();
              }, 500);
            } else {
              // Fallback to basic content
              editor.commands.setContent(`
                <h1>${docData.document.title}</h1>
                <p>Start editing your document here...</p>
                <p>Use the toolbar to format text, add tables, images, and more.</p>
              `);
            }
          }
        } else {
          setError('Failed to load document');
        }
      } catch (err) {
        setError('Failed to load document');
        console.error('Error loading document:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId && editor) {
      loadDocument();
    }
  }, [documentId, editor]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !editor || !documentData) return;

    const autoSave = setTimeout(() => {
      handleSave(false); // Silent save
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSave);
  }, [hasUnsavedChanges, editor, documentData]);

  const handleSave = async (showNotification = true) => {
    if (!editor || !documentData) return;

    try {
      setSaving(true);
      const content = editor.getHTML();
      
      const response = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/save`, {
        method: 'POST',
        body: JSON.stringify({ 
          content,
          title: documentData.title 
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        if (showNotification) {
          // Could add toast notification here
        }
      } else {
        throw new Error('Failed to save document');
      }
    } catch (err) {
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSupplement = async () => {
    if (!supplementOrganization) {
      setError('Please enter organization name');
      return;
    }
    
    try {
      const response = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/supplement`, {
        method: 'POST',
        body: JSON.stringify({
          supplementType,
          supplementLevel,
          organization: supplementOrganization
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSupplementDialogOpen(false);
        setHasSupplements(true);
        // Navigate to the new supplement document
        router.push(`/editor/${data.supplement.id}`);
      } else {
        setError('Failed to create supplement');
      }
    } catch (error) {
      console.error('Error creating supplement:', error);
      setError('Failed to create supplement');
    }
  };

  const handleUndo = () => {
    editor?.commands.undo();
  };

  const handleRedo = () => {
    editor?.commands.redo();
  };

  const handleExport = async () => {
    if (!editor || !documentData) return;
    
    const content = editor.getHTML();
    const title = documentData.title || 'document';
    
    switch (exportFormat) {
      case 'html':
        // Export as HTML with Air Force header if present
        let htmlContent = content;
        if (airForceHeader.hasHeader && airForceHeader.headerHtml) {
          htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${airForceHeader.documentStyles || ''}
</head>
<body>
  ${airForceHeader.headerHtml}
  <div style="margin-top: 20px;">
    ${content}
  </div>
</body>
</html>`;
        } else {
          htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  ${content}
</body>
</html>`;
        }
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const htmlLink = document.createElement('a');
        htmlLink.href = htmlUrl;
        htmlLink.download = `${title}.html`;
        htmlLink.click();
        URL.revokeObjectURL(htmlUrl);
        break;
        
      case 'txt':
        // Convert HTML to plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const txtBlob = new Blob([textContent], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);
        const txtLink = document.createElement('a');
        txtLink.href = txtUrl;
        txtLink.download = `${title}.txt`;
        txtLink.click();
        URL.revokeObjectURL(txtUrl);
        break;
        
      case 'pdf':
        // Generate PDF using export-pdf endpoint
        try {
          let fullHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; }
    h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    h2 { font-size: 12pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
    h3 { font-size: 12pt; font-weight: bold; font-style: italic; }
    p { margin-bottom: 12pt; text-align: justify; }
    .air-force-document-header { text-align: center; margin-bottom: 30px; }
    .by-order, .secretary { font-weight: bold; font-size: 14pt; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    table td, table th { border: 1px solid black; padding: 6pt; }
    table th { background-color: #f0f0f0; font-weight: bold; }
  </style>
  ${airForceHeader.documentStyles || ''}
</head>
<body>
  ${airForceHeader.hasHeader && airForceHeader.headerHtml ? airForceHeader.headerHtml : ''}
  <div style="margin-top: 20px;">
    ${content}
  </div>
</body>
</html>`;

          const response = await fetch('/api/export-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              content: fullHtmlContent,
              title: title
            })
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            const pdfLink = document.createElement('a');
            pdfLink.href = pdfUrl;
            pdfLink.download = `${title}.pdf`;
            pdfLink.click();
            URL.revokeObjectURL(pdfUrl);
          } else {
            alert('Failed to generate PDF. Please try again.');
          }
        } catch (error) {
          console.error('PDF export error:', error);
          alert('Failed to generate PDF. Please try again.');
        }
        break;
        
      case 'docx':
        // Generate DOCX using export-docx endpoint
        try {
          // Use the same full HTML as PDF for consistency
          let fullDocxContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; }
    h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    h2 { font-size: 12pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
    h3 { font-size: 12pt; font-weight: bold; font-style: italic; }
    p { margin-bottom: 12pt; text-align: justify; }
    .air-force-document-header { text-align: center; margin-bottom: 30px; }
    .by-order, .secretary { font-weight: bold; font-size: 14pt; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    table td, table th { border: 1px solid black; padding: 6pt; }
    table th { background-color: #f0f0f0; font-weight: bold; }
  </style>
  ${airForceHeader.documentStyles || ''}
</head>
<body>
  ${airForceHeader.hasHeader && airForceHeader.headerHtml ? airForceHeader.headerHtml : ''}
  <div style="margin-top: 20px;">
    ${content}
  </div>
</body>
</html>`;
          const response = await fetch('/api/export-docx', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              content: fullDocxContent,
              title: title
            })
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const docUrl = URL.createObjectURL(blob);
            const docLink = document.createElement('a');
            docLink.href = docUrl;
            docLink.download = `${title}.docx`;
            docLink.click();
            URL.revokeObjectURL(docUrl);
          } else {
            alert('Failed to generate Word document. Please try again.');
          }
        } catch (error) {
          console.error('DOCX export error:', error);
          alert('Failed to generate Word document. Please try again.');
        }
        break;
    }
    
    setExportDialogOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()}>
          Back to Document
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Editor Header */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              Editing: {documentData?.title}
            </Typography>
            <Typography variant="caption">
              {hasUnsavedChanges ? (
                <span style={{ color: '#ff9800' }}>Unsaved changes</span>
              ) : lastSaved ? (
                `Last saved: ${lastSaved.toLocaleTimeString()}`
              ) : (
                'Ready'
              )}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Document Info */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h5">{documentData?.title}</Typography>
            <Chip label={documentData?.category} size="small" />
            <Chip label={documentData?.status} variant="outlined" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created by {documentData?.createdBy?.firstName} {documentData?.createdBy?.lastName} on{' '}
            {documentData?.createdAt ? new Date(documentData.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>
        </Paper>

        {/* Advanced Editor Toolbar */}
        <Paper sx={{ p: 2, mb: 2 }}>
          {/* Control Row - Navigation, Save, Track Changes */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
            {/* Navigation */}
            <ButtonGroup size="small">
              <Button
                onClick={() => router.back()}
                startIcon={<ArrowBack />}
                title="Back to Document"
              >
                Back
              </Button>
              <Button
                onClick={() => router.push(`/documents/${documentId}`)}
                startIcon={<PreviewIcon />}
                title="Preview Document"
              >
                Preview
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Undo/Redo */}
            <ButtonGroup size="small">
              <Button
                onClick={handleUndo}
                disabled={!editor?.can().undo()}
                title="Undo (Ctrl+Z)"
              >
                <Undo />
              </Button>
              <Button
                onClick={handleRedo}
                disabled={!editor?.can().redo()}
                title="Redo (Ctrl+Y)"
              >
                <Redo />
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Track Changes */}
            <FormControlLabel
              control={
                <Switch
                  checked={trackChanges}
                  onChange={(e) => {
                    setTrackChanges(e.target.checked);
                    editor?.commands.toggleChangeTracking();
                  }}
                  size="small"
                />
              }
              label="Track Changes"
              sx={{ mr: 1 }}
            />
            
            <IconButton 
              size="small"
              onClick={() => setChangesDrawerOpen(true)}
              title="View Changes"
              sx={{ 
                border: changes.length > 0 ? '1px solid #1976d2' : '1px solid #ccc',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
            >
              <Badge badgeContent={changes.length} color="error">
                <Comment fontSize="small" />
              </Badge>
            </IconButton>

            <Divider orientation="vertical" flexItem />

            {/* Save */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={() => handleSave(true)}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            
            {/* Supplement Button */}
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<PostAdd />}
              onClick={() => setSupplementDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              Create Supplement
            </Button>
            
            {/* View Mode Toggle */}
            {hasSupplements && (
              <ButtonGroup size="small" sx={{ ml: 1 }}>
                <Button
                  variant={viewMode === 'base' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('base')}
                >
                  Base
                </Button>
                <Button
                  variant={viewMode === 'integrated' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('integrated')}
                >
                  Integrated
                </Button>
                <Button
                  variant={viewMode === 'supplement' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('supplement')}
                >
                  Supplements Only
                </Button>
              </ButtonGroup>
            )}

            <Divider orientation="vertical" flexItem />

            {/* Advanced Tools */}
            <ButtonGroup size="small">
              <Button
                onClick={() => {
                  const searchTerm = window.prompt('Find text:');
                  if (searchTerm) {
                    const replaceTerm = window.prompt('Replace with (leave empty to just find):');
                    if (replaceTerm) {
                      // Replace all occurrences
                      const content = editor?.getHTML() || '';
                      const newContent = content.replaceAll(searchTerm, replaceTerm);
                      editor?.commands.setContent(newContent);
                    } else {
                      // Just highlight search
                      editor?.chain().focus().setSearchTerm(searchTerm).run();
                    }
                  }
                }}
                title="Find & Replace"
                startIcon={<FindReplace />}
              >
                Find
              </Button>
              <Button
                onClick={() => window.print()}
                title="Print Document"
                startIcon={<Print />}
              >
                Print
              </Button>
              <Button
                onClick={() => setExportDialogOpen(true)}
                title="Export Document"
                startIcon={<Download />}
              >
                Export
              </Button>
            </ButtonGroup>

            {/* Status on the right */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`Page ${currentPage} of ${totalPages}`}
                size="small" 
                color="primary" 
                variant="outlined"
                icon={<FormatListNumbered />}
              />
              <Typography variant="caption" color="text.secondary">
                Words: {wordCount} | Characters: {charCount}
              </Typography>
              {hasUnsavedChanges && (
                <Chip label="Unsaved changes" size="small" color="warning" />
              )}
            </Box>
          </Box>

          {/* Second Row - Text Formatting */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
            {/* Font Family */}
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                editor?.chain().focus().setFontFamily(e.target.value).run();
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>

            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="28px">28</option>
              <option value="32px">32</option>
              <option value="36px">36</option>
            </select>

            <Divider orientation="vertical" flexItem />

            {/* Basic Formatting */}
            <ButtonGroup size="small">
              <Button
                variant={editor?.isActive('bold') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </Button>
              <Button
                variant={editor?.isActive('italic') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </Button>
              <Button
                variant={editor?.isActive('underline') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </Button>
              <Button
                variant={editor?.isActive('strike') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <s>S</s>
              </Button>
              <Button
                variant={editor?.isActive('subscript') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleSubscript().run()}
                title="Subscript"
              >
                X<sub>2</sub>
              </Button>
              <Button
                variant={editor?.isActive('superscript') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                title="Superscript"
              >
                X<sup>2</sup>
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Color Options */}
            <input
              type="color"
              onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
              title="Text Color"
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            <Button
              size="small"
              variant={editor?.isActive('highlight') ? 'contained' : 'outlined'}
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              title="Highlight"
            >
              🖍️
            </Button>

            <Divider orientation="vertical" flexItem />

            {/* Text Alignment */}
            <ButtonGroup size="small">
              <Button
                variant={editor?.isActive({ textAlign: 'left' }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                title="Align Left"
              >
                ⬅️
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'center' }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                title="Align Center"
              >
                ↔️
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'right' }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                title="Align Right"
              >
                ➡️
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'justify' }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                title="Justify"
              >
                ☰
              </Button>
            </ButtonGroup>
          </Box>

          {/* Second Row - Structure & Elements */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {/* Headings */}
            <ButtonGroup size="small">
              <Button 
                variant={editor?.isActive('heading', { level: 1 }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                H1
              </Button>
              <Button 
                variant={editor?.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                H2
              </Button>
              <Button 
                variant={editor?.isActive('heading', { level: 3 }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                H3
              </Button>
              <Button 
                variant={editor?.isActive('heading', { level: 4 }) ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
              >
                H4
              </Button>
              <Button 
                variant={editor?.isActive('paragraph') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().setParagraph().run()}
              >
                P
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Lists */}
            <ButtonGroup size="small">
              <Button 
                variant={editor?.isActive('bulletList') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                • List
              </Button>
              <Button 
                variant={editor?.isActive('orderedList') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                1. List
              </Button>
              <Button 
                variant={editor?.isActive('taskList') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
                title="Task List"
              >
                ☐ Tasks
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Special Elements */}
            <ButtonGroup size="small">
              <Button 
                variant={editor?.isActive('blockquote') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                title="Block Quote"
              >
                " Quote
              </Button>
              <Button 
                variant={editor?.isActive('codeBlock') ? 'contained' : 'outlined'}
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                title="Code Block"
              >
                {'</>'}
              </Button>
              <Button 
                onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
              >
                ―
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Table Operations */}
            <ButtonGroup size="small">
              <Button
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  }
                }}
                title="Insert Table (3x3)"
              >
                📊 Table
              </Button>
              <Button
                onClick={() => {
                  if (editor && editor.can().addColumnAfter()) {
                    editor.chain().focus().addColumnAfter().run();
                  }
                }}
                disabled={!editor || !editor.can().addColumnAfter()}
                title="Add Column After"
              >
                +Col
              </Button>
              <Button
                onClick={() => {
                  if (editor && editor.can().addRowAfter()) {
                    editor.chain().focus().addRowAfter().run();
                  }
                }}
                disabled={!editor || !editor.can().addRowAfter()}
                title="Add Row After"
              >
                +Row
              </Button>
              <Button
                onClick={() => {
                  if (editor && editor.can().deleteTable()) {
                    editor.chain().focus().deleteTable().run();
                  }
                }}
                disabled={!editor || !editor.can().deleteTable()}
                title="Delete Table"
              >
                ×Table
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Table Cell Dimensions - Note: Manual resizing via drag is preferred */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Cell Size:
              </Typography>
              <input
                type="number"
                placeholder="Width"
                min="50"
                max="500"
                style={{
                  width: '70px',
                  height: '28px',
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                title="Column Width (px)"
                id="cell-width-input"
              />
              <input
                type="number"
                placeholder="Height"
                min="30"
                max="300"
                style={{
                  width: '70px',
                  height: '28px',
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                title="Row Height (px)"
                id="cell-height-input"
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  if (!editor) return;
                  
                  const widthInput = document.getElementById('cell-width-input') as HTMLInputElement;
                  const heightInput = document.getElementById('cell-height-input') as HTMLInputElement;
                  const width = widthInput ? parseInt(widthInput.value) : 0;
                  const height = heightInput ? parseInt(heightInput.value) : 0;
                  
                  // Get current selection
                  const { selection } = editor.state;
                  const from = selection.from;
                  const to = selection.to;
                  
                  // Apply custom CSS to selected cells
                  if (width > 0 || height > 0) {
                    let html = editor.getHTML();
                    
                    // Add inline styles to the table
                    const styleTag = `<style>
                      ${width > 0 ? `.ProseMirror table td, .ProseMirror table th { width: ${width}px !important; min-width: ${width}px !important; }` : ''}
                      ${height > 0 ? `.ProseMirror table td, .ProseMirror table th { height: ${height}px !important; min-height: ${height}px !important; }` : ''}
                    </style>`;
                    
                    // Check if we already have custom styles
                    if (html.includes('<!-- custom-table-styles -->')) {
                      html = html.replace(/<!-- custom-table-styles -->.*?<!-- end-custom-table-styles -->/s, 
                        `<!-- custom-table-styles -->${styleTag}<!-- end-custom-table-styles -->`);
                    } else {
                      html = `<!-- custom-table-styles -->${styleTag}<!-- end-custom-table-styles -->${html}`;
                    }
                    
                    editor.commands.setContent(html);
                  }
                }}
                title="Apply Size"
                disabled={!editor || !editor.can().deleteTable()}
              >
                Apply
              </Button>
              <Typography variant="caption" color="text.secondary">
                or drag borders
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Media & Links */}
            <ButtonGroup size="small">
              <Button
                component="label"
                title="Upload Image"
                startIcon={<Upload />}
              >
                Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const src = event.target?.result as string;
                        editor?.chain().focus().setImage({ src }).run();
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </Button>
              <Button
                onClick={() => {
                  const url = window.prompt('Enter image URL:');
                  if (url) {
                    editor?.chain().focus().setImage({ src: url }).run();
                  }
                }}
                title="Insert Image from URL"
              >
                🖼️ URL
              </Button>
              <Button
                variant={editor?.isActive('link') ? 'contained' : 'outlined'}
                onClick={() => {
                  const url = window.prompt('Enter URL:');
                  if (url) {
                    editor?.chain().focus().setLink({ href: url }).run();
                  }
                }}
                title="Insert Link"
              >
                🔗 Link
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Special Characters & Emoji */}
            <ButtonGroup size="small">
              <Button
                onClick={() => {
                  const emojis = ['😀', '😎', '👍', '❤️', '✅', '⭐', '🔥', '💡', '📌', '⚠️', '❌', '➡️'];
                  const selected = window.prompt(`Enter emoji or select: ${emojis.join(' ')}`);
                  if (selected) {
                    editor?.chain().focus().insertContent(selected).run();
                  }
                }}
                title="Insert Emoji"
                startIcon={<EmojiEmotions />}
              >
                Emoji
              </Button>
              <Button
                onClick={() => {
                  const symbols = ['©', '®', '™', '°', '±', '×', '÷', '≠', '≤', '≥', '∞', '√', 'π', 'α', 'β', 'Δ', 'Σ', '§', '¶', '†', '‡', '•', '…', '€', '£', '¥', '¢'];
                  const selected = window.prompt(`Enter symbol or copy: ${symbols.join(' ')}`);
                  if (selected) {
                    editor?.chain().focus().insertContent(selected).run();
                  }
                }}
                title="Insert Special Character"
                startIcon={<Functions />}
              >
                Symbol
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Document Formatting Tools */}
            <ButtonGroup size="small">
              <Button
                onClick={() => {
                  // Generate Table of Contents
                  const html = editor?.getHTML();
                  if (!html) return;
                  
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');
                  
                  let toc = '<div class="table-of-contents" style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; background: #f9f9f9;"><h2>Table of Contents</h2><ul style="list-style: none; padding-left: 0;">';
                  headers.forEach((header) => {
                    const level = parseInt(header.tagName.charAt(1));
                    const text = header.textContent || '';
                    const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat((level - 1));
                    toc += `<li style="margin: 5px 0;">${indent}${text}</li>`;
                  });
                  toc += '</ul></div><br/>';
                  
                  // Insert at beginning
                  editor?.commands.setContent(toc + html);
                }}
                title="Generate Table of Contents"
                style={{ backgroundColor: '#4CAF50', color: 'white' }}
              >
                📑 TOC
              </Button>
              
              <Button
                onClick={() => {
                  // Auto-number chapters and sections
                  let html = editor?.getHTML();
                  if (!html) return;
                  
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
                  
                  editor?.commands.setContent(html);
                }}
                title="Number Chapters & Sections"
                style={{ backgroundColor: '#2196F3', color: 'white' }}
              >
                #️⃣ Number
              </Button>
              
              <Button
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
                    editor?.commands.setContent(template);
                  }
                }}
                title="Insert Document Template"
                style={{ backgroundColor: '#FF9800', color: 'white' }}
              >
                📋 Template
              </Button>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Page Break */}
            <Button
              size="small"
              onClick={() => {
                editor?.chain().focus().setHardBreak().run();
                editor?.chain().focus().insertContent('<div style="page-break-after: always; margin: 20px 0; border-top: 2px dashed #ccc; text-align: center; color: #999;">--- Page Break ---</div>').run();
              }}
              title="Insert Page Break"
            >
              📄 Break
            </Button>
          </Box>
        </Paper>

        {/* Editor Content */}
        <Paper sx={{ minHeight: 600 }} ref={editorContainerRef}>
          <style jsx global>{`
            .ProseMirror table {
              border-collapse: collapse;
              table-layout: fixed;
              width: 100%;
              margin: 16px 0;
              overflow: hidden;
            }
            .ProseMirror td,
            .ProseMirror th {
              border: 1px solid #ccc;
              padding: 8px 12px;
              position: relative;
              vertical-align: top;
              box-sizing: border-box;
              min-width: 100px;
            }
            .ProseMirror th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: left;
            }
            .ProseMirror .selectedCell:after {
              z-index: 2;
              position: absolute;
              content: "";
              left: 0; right: 0; top: 0; bottom: 0;
              background: rgba(200, 200, 255, 0.4);
              pointer-events: none;
            }
            
            /* Column resize handle */
            .ProseMirror .column-resize-handle {
              position: absolute;
              right: -2px;
              top: 0;
              bottom: -2px;
              width: 4px;
              background-color: #adf;
              pointer-events: none;
            }
            .ProseMirror.resize-cursor {
              cursor: col-resize;
            }
            
            /* Table resize handles */
            .ProseMirror .tableWrapper {
              overflow-x: auto;
            }
            .ProseMirror table .grip-column {
              position: absolute;
              top: -12px;
              left: -1px;
              right: -1px;
              height: 12px;
              background: #ced4da;
              cursor: pointer;
              z-index: 10;
            }
            .ProseMirror table .grip-column:hover,
            .ProseMirror table .grip-column.selected {
              background: #68b3f7;
            }
            .ProseMirror table .grip-row {
              position: absolute;
              left: -12px;
              top: -1px;
              bottom: -1px;
              width: 12px;
              background: #ced4da;
              cursor: pointer;
              z-index: 10;
            }
            .ProseMirror table .grip-row:hover,
            .ProseMirror table .grip-row.selected {
              background: #68b3f7;
            }
            .ProseMirror table .grip-table {
              position: absolute;
              top: -12px;
              left: -12px;
              width: 12px;
              height: 12px;
              background: #ced4da;
              border-radius: 50%;
              cursor: pointer;
              z-index: 11;
            }
            .ProseMirror table .grip-table:hover {
              background: #68b3f7;
            }
            
            /* Resizing cursor */
            .ProseMirror table td.resize-cursor-col,
            .ProseMirror table th.resize-cursor-col {
              cursor: col-resize !important;
            }
            .ProseMirror table td.resize-cursor-row,
            .ProseMirror table th.resize-cursor-row {
              cursor: row-resize !important;
            }
            
            /* Supplemental Document Styles */
            .supplement-add {
              background: #e8f5e9 !important;
              border-left: 4px solid #4caf50 !important;
              padding-left: 8px !important;
              margin: 8px 0 !important;
              position: relative !important;
            }
            
            .supplement-modify {
              background: #fff3e0 !important;
              border-left: 4px solid #ff9800 !important;
              padding-left: 8px !important;
              margin: 8px 0 !important;
              position: relative !important;
            }
            
            .supplement-replace {
              background: #e3f2fd !important;
              border-left: 4px solid #2196f3 !important;
              padding-left: 8px !important;
              margin: 8px 0 !important;
              position: relative !important;
            }
            
            .supplement-delete {
              background: #ffebee !important;
              border-left: 4px solid #f44336 !important;
              padding-left: 8px !important;
              margin: 8px 0 !important;
              text-decoration: line-through !important;
              opacity: 0.7 !important;
              position: relative !important;
            }
            
            .supplement-add::after,
            .supplement-modify::after,
            .supplement-replace::after,
            .supplement-delete::after {
              content: attr(data-supplement);
              position: absolute;
              top: -20px;
              right: 0;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
            }
            
            .supplement-add::after {
              background: #4caf50;
            }
            
            .supplement-modify::after {
              background: #ff9800;
            }
            
            .supplement-replace::after {
              background: #2196f3;
            }
            
            .supplement-delete::after {
              background: #f44336;
            }
          `}</style>
          
          {/* Render preserved Air Force header if present */}
          {airForceHeader.hasHeader && airForceHeader.headerHtml && (
            <>
              {airForceHeader.documentStyles && (
                <style dangerouslySetInnerHTML={{ __html: airForceHeader.documentStyles }} />
              )}
              <Box 
                sx={{ 
                  backgroundColor: 'white',
                  marginBottom: 3,
                  pointerEvents: 'none',
                  '& img': { maxWidth: '120px', height: 'auto' }
                }}
                dangerouslySetInnerHTML={{ __html: airForceHeader.headerHtml }}
              />
              <Divider sx={{ my: 2, borderColor: 'black', borderWidth: 2 }} />
            </>
          )}
          
          <EditorContent 
            editor={editor} 
            style={{ 
              minHeight: 500,
              padding: '16px',
            }}
          />
        </Paper>

      </Container>

      {/* Floating Page Indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 10000,
          backgroundColor: '#2196f3',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '24px',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 'bold',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 16px rgba(33, 150, 243, 0.5)',
          }
        }}
      >
        <Box component="span" sx={{ fontSize: '18px' }}>📄</Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
            Page {currentPage} of {totalPages}
          </Box>
          <Box component="span" sx={{ fontSize: '10px', opacity: 0.9 }}>
            {wordCount} words
          </Box>
        </Box>
      </Box>

      {/* Changes Drawer */}
      <Drawer
        anchor="right"
        open={changesDrawerOpen}
        onClose={() => setChangesDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            padding: 2,
          },
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Tracked Changes ({changes.length})
            </Typography>
            <IconButton onClick={() => setChangesDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<Check />}
              onClick={() => {
                editor?.commands.acceptAllChanges();
                setChanges([]);
              }}
              disabled={changes.length === 0}
            >
              Accept All
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<Close />}
              onClick={() => {
                editor?.commands.rejectAllChanges();
                setChanges([]);
              }}
              disabled={changes.length === 0}
            >
              Reject All
            </Button>
          </Box>
          
          <List>
            {changes.map((change) => (
              <ListItem key={change.id} sx={{ 
                bgcolor: change.type === 'insertion' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                mb: 1,
                borderRadius: 1,
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {change.type === 'insertion' ? '+ Added' : '- Deleted'}: "{change.content.substring(0, 50)}..."
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption">
                      by {change.author} at {new Date(change.timestamp).toLocaleString()}
                    </Typography>
                  }
                />
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => {
                      editor?.commands.acceptChange(change.id);
                      setChanges(prev => prev.filter(c => c.id !== change.id));
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Close />}
                    onClick={() => {
                      editor?.commands.rejectChange(change.id);
                      setChanges(prev => prev.filter(c => c.id !== change.id));
                    }}
                  >
                    Reject
                  </Button>
                </Box>
              </ListItem>
            ))}
            {changes.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No tracked changes"
                  secondary="Changes will appear here when track changes is enabled"
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Export Format Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Document</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <FormLabel component="legend">Select export format:</FormLabel>
            <RadioGroup
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'html' | 'pdf' | 'docx' | 'txt')}
            >
              <FormControlLabel 
                value="html" 
                control={<Radio />} 
                label="HTML - Web Page (preserves all formatting)" 
              />
              <FormControlLabel 
                value="pdf" 
                control={<Radio />} 
                label="PDF - Portable Document (best for printing)" 
              />
              <FormControlLabel 
                value="docx" 
                control={<Radio />} 
                label="Word Document - Microsoft Word (editable)" 
              />
              <FormControlLabel 
                value="txt" 
                control={<Radio />} 
                label="Plain Text - Simple text file (no formatting)" 
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained" color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplement Creation Dialog */}
      <Dialog 
        open={supplementDialogOpen} 
        onClose={() => setSupplementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Supplemental Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Supplement Type</InputLabel>
              <Select
                value={supplementType}
                onChange={(e) => setSupplementType(e.target.value)}
                label="Supplement Type"
              >
                <MenuItem value="MAJCOM">MAJCOM (Major Command)</MenuItem>
                <MenuItem value="BASE">Base/Wing</MenuItem>
                <MenuItem value="UNIT">Squadron/Unit</MenuItem>
                <MenuItem value="INTERIM_CHANGE">Interim Change</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Supplement Level</InputLabel>
              <Select
                value={supplementLevel}
                onChange={(e) => setSupplementLevel(Number(e.target.value))}
                label="Supplement Level"
              >
                <MenuItem value={1}>Level 1 - Service</MenuItem>
                <MenuItem value={2}>Level 2 - MAJCOM</MenuItem>
                <MenuItem value={3}>Level 3 - Wing/Base</MenuItem>
                <MenuItem value={4}>Level 4 - Squadron/Unit</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Organization"
              placeholder="e.g., PACAF, Kadena AB, 36th Wing"
              value={supplementOrganization}
              onChange={(e) => setSupplementOrganization(e.target.value)}
              helperText="Enter the organization creating this supplement"
            />
            
            <Alert severity="info">
              This will create a supplement document that can add to or modify the base document without changing the original.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupplementDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSupplement} 
            variant="contained" 
            color="primary"
            disabled={!supplementOrganization}
          >
            Create Supplement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentEditor;