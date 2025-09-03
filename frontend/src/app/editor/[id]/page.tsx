'use client';

import React, { useState, useEffect } from 'react';
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
  FormControlLabel
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
  Functions
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
  
  const [document, setDocument] = useState<DocumentDetails | null>(null);
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
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('serif');

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const lowlight = createLowlight(common);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
        codeBlock: false, // We'll use CodeBlockLowlight instead
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
      TextStyle,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
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
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-6 text-gray-900',
        spellcheck: 'true',
      },
    },
  });

  // Load document content
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        
        // Wait a bit for editor to be ready
        if (!editor) {
          console.log('Editor not ready yet, waiting...');
          setTimeout(() => loadDocument(), 100);
          return;
        }
        
        // First get basic document info
        console.log('Loading document:', documentId, 'Editor ready:', !!editor);
        const docResponse = await api.get(`/api/documents/${documentId}`);
        
        if (docResponse.ok) {
          const docData = await docResponse.json();
          console.log('Document data:', docData);
          setDocument(docData.document);
          
          // Then get the editable content
          const contentResponse = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/content`, {
            method: 'GET'
          });
          
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            console.log('Content data:', contentData);
            
            if (contentData.success && contentData.document.content) {
              // Load actual document content
              let content = contentData.document.content;
              console.log('Loading content into editor:', content);
              
              // If content is plain text, wrap it in paragraph tags
              if (!content.includes('<') && !content.includes('>')) {
                content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
              }
              
              editor.commands.setContent(content);
              console.log('Content set in editor, editor has content:', editor.getHTML());
            } else if (docData.document.content) {
              // Try to use content from basic document API
              let content = docData.document.content;
              console.log('Using content from document API:', content);
              
              // If content is plain text, wrap it in paragraph tags
              if (!content.includes('<') && !content.includes('>')) {
                content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
              }
              
              editor.commands.setContent(content);
              console.log('Fallback content set in editor');
            } else {
              console.log('No content found, using default');
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
    if (!hasUnsavedChanges || !editor || !document) return;

    const autoSave = setTimeout(() => {
      handleSave(false); // Silent save
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSave);
  }, [hasUnsavedChanges, editor, document]);

  const handleSave = async (showNotification = true) => {
    if (!editor || !document) return;

    try {
      setSaving(true);
      const content = editor.getHTML();
      
      const response = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/save`, {
        method: 'POST',
        body: JSON.stringify({ 
          content,
          title: document.title 
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        if (showNotification) {
          // Could add toast notification here
          console.log('Document saved successfully');
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

  const handleUndo = () => {
    editor?.commands.undo();
  };

  const handleRedo = () => {
    editor?.commands.redo();
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
              Editing: {document?.title}
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
            <Typography variant="h5">{document?.title}</Typography>
            <Chip label={document?.category} size="small" />
            <Chip label={document?.status} variant="outlined" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created by {document?.createdBy?.firstName} {document?.createdBy?.lastName} on{' '}
            {document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
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
                onClick={() => {
                  const content = editor?.getHTML() || '';
                  const blob = new Blob([content], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${document?.title || 'document'}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                title="Export as HTML"
                startIcon={<Download />}
              >
                Export
              </Button>
            </ButtonGroup>

            {/* Status on the right */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
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
        <Paper sx={{ minHeight: 600 }}>
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
          `}</style>
          <EditorContent 
            editor={editor} 
            style={{ 
              minHeight: 500,
              padding: '16px',
            }}
          />
        </Paper>

      </Container>

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
    </Box>
  );
};

export default DocumentEditor;