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
  Comment as CommentIcon,
  FindReplace,
  Print,
  Download,
  Upload,
  EmojiEmotions,
  Functions,
  FormatListNumbered,
  PostAdd,
  Layers,
  AddCircleOutline,
  AutoAwesome
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { EditorContent } from '@tiptap/react';
import { authTokenService } from '@/lib/authTokenService';
import { useDocumentEditor } from '@/components/document-editor/editorConfig';
import { useDocumentData } from '@/components/document-editor/useDocumentData';
import { DocumentDetails, EditorState, EditorUI, SupplementConfig, ViewMode, UserInfo } from '@/components/document-editor/types';

// Import existing editor components
import SupplementSectionManager from '@/components/editor/SupplementSectionManager';
import SupplementableSectionMarker from '@/components/editor/SupplementableSectionMarker';
import DocumentStructureToolbar from '@/components/editor/DocumentStructureToolbar';
import AppendixFormatter from '@/components/editor/AppendixFormatter';
import CommentsPanel from '@/components/editor/CommentsPanel';
import AdvancedSearchReplace from '@/components/editor/AdvancedSearchReplace';
import AirForceHeader from '@/components/editor/AirForceHeader';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { AdvancedToolbar } from '@/components/editor/AdvancedToolbar';
import '@/styles/supplement-marks.css';
import '@/styles/editor-document.css';

const DocumentEditor: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  // Use the document data hook
  const {
    documentData,
    setDocumentData,
    editorState,
    setEditorState,
    loadDocument,
    saveDocument,
    updateWordCount,
    updatePageInfo,
    setError,
    setTrackChanges,
    setShowChanges,
  } = useDocumentData(documentId);

  // UI state
  const [editorUI, setEditorUI] = useState<EditorUI>({
    fontSize: '16px',
    fontFamily: 'serif',
    findReplaceOpen: false,
    searchTerm: '',
    replaceTerm: '',
    commentsDrawerOpen: false,
    comments: [],
    appendixDrawerOpen: false,
    showHeader: true,
    footnotes: [],
    footnotesOpen: false,
    previewMode: false,
    historyOpen: false,
    spellCheck: true,
    versionsOpen: false,
    findOpen: false,
    formulaOpen: false,
    tableOpen: false,
    smartComplete: true,
  });

  // Supplement configuration
  const [supplementConfig, setSupplementConfig] = useState<SupplementConfig>({
    dialogOpen: false,
    type: 'MAJCOM',
    level: 2,
    organization: '',
  });

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'base' });
  const [hasSupplements, setHasSupplements] = useState(false);
  const [isSupplementDocument, setIsSupplementDocument] = useState(false);
  const [documentOrganization, setDocumentOrganization] = useState('');

  // User state
  const [user, setUser] = useState<UserInfo | null>(null);

  // Page calculation refs
  const calculatePageFromCursorRef = useRef<(() => void) | null>(null);
  const calculatePageFromScrollRef = useRef<(() => void) | null>(null);

  // Track if content is being updated by user to prevent cursor jumps
  const isUserEditingRef = useRef(false);

  // Get actual content to use - comprehensive content loading with full document content including TOC
  const getActualContent = () => {
    if (!documentData) return '';

    console.log('Loading document content:', {
      hasCustomFields: !!documentData.customFields,
      customFieldsKeys: documentData.customFields ? Object.keys(documentData.customFields as any) : [],
      hasContent: !!(documentData.customFields as any)?.content,
      contentLength: (documentData.customFields as any)?.content?.length || 0
    });

    const customFields = documentData.customFields as any;

    // Priority order for content loading
    let content = '';

    console.log('🔍 getActualContent - Checking all content fields:', {
      hasEditableContent: !!customFields?.editableContent,
      editableContentHasTable: customFields?.editableContent?.includes('<table'),
      hasHtmlContent: !!customFields?.htmlContent,
      htmlContentHasTable: customFields?.htmlContent?.includes('<table'),
      hasCustomFieldsContent: !!customFields?.content,
      customFieldsContentHasTable: customFields?.content?.includes('<table'),
      hasDocumentContent: !!documentData.content,
      documentContentHasTable: documentData.content?.includes('<table')
    });

    // Priority: content (most recent edits) > editableContent > htmlContent > document.content
    // Changed priority to use 'content' first since that's where table edits are saved
    if (customFields?.content) {
      content = customFields.content;
      console.log('✅ Using customFields.content (latest edits)', { length: content.length, hasTable: content.includes('<table'), preview: content.substring(0, 200) });
    } else if (customFields?.editableContent) {
      // Use editableContent which already has the header removed
      content = customFields.editableContent;
      console.log('✅ Using customFields.editableContent (without header)', { length: content.length, hasTable: content.includes('<table') });
    } else if (customFields?.htmlContent) {
      content = customFields.htmlContent;
      console.log('✅ Using customFields.htmlContent', { length: content.length, hasTable: content.includes('<table'), preview: content.substring(0, 200) });
    } else if (documentData.content) {
      content = documentData.content;
      console.log('✅ Using documentData.content', { length: content.length, hasTable: content.includes('<table'), preview: content.substring(0, 200) });
    } else if (documentData.description) {
      content = `<p>${documentData.description}</p>`;
      console.log('✅ Using documentData.description as fallback');
    }

    // Log if we found table of contents in the content
    const hasTOC = /table\s+of\s+contents/i.test(content) ||
                  content.includes('table-of-contents') ||
                  /<h[1-6][^>]*>\s*(table\s+of\s+contents|contents|toc)\s*<\/h[1-6]>/i.test(content);

    console.log('📊 Final content analysis:', {
      hasTableOfContents: hasTOC,
      hasTable: content.includes('<table'),
      totalLength: content.length,
      hasHeadings: /<h[1-6]/i.test(content)
    });

    return content;
  };

  // Memoize actualContent so it doesn't recalculate on every render
  const actualContent = React.useMemo(() => {
    return getActualContent();
  }, [documentData?.id]); // Only recalculate when document ID changes

  // Check if content already has a header
  const contentHasHeader = () => {
    // If we have headerHtml in customFields, the content shouldn't have the header
    // So we can always show the formatted header from headerHtml
    const customFields = documentData?.customFields as any;
    if (customFields?.headerHtml) {
      return false; // Always show the header from headerHtml
    }

    const content = getActualContent();
    // Check for Air Force header elements
    return content.includes('BY ORDER OF THE') ||
           content.includes('DEPARTMENT OF THE AIR FORCE') ||
           content.includes('air-force-document-header') ||
           content.includes('classification-header') ||
           content.includes('UNCLASSIFIED');
  };

  // Initialize TipTap editor
  const editor = useDocumentEditor({
    content: actualContent,
    trackChanges: editorState.trackChanges,
    userId: user?.id || 'anonymous',
    userName: user?.name || 'Anonymous User',
    onUpdate: (content: string) => {
      isUserEditingRef.current = true;
      console.log('📝 Editor content updated, length:', content.length, 'Has table:', content.includes('<table'));
      if (documentData) {
        // Create a new object reference so React detects the change
        const updatedData = {
          ...documentData,
          content,
          customFields: {
            ...documentData.customFields,
            content, // Update content in customFields too
            lastEditedAt: new Date().toISOString()
          }
        };
        setDocumentData(updatedData);
        updateWordCount(content);
      }
      // Reset flag after a short delay
      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 100);
    },
    onSelectionUpdate: () => {
      if (calculatePageFromCursorRef.current) {
        calculatePageFromCursorRef.current();
      }
    },
    onTransaction: () => {
      // Handle changes tracking here
    },
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authTokenService.authenticatedFetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  // Ensure editor is editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(true);
      console.log('Editor set to editable:', editor.isEditable);
    }
  }, [editor]);

  // Auto-save functionality - save 3 seconds after user stops typing
  useEffect(() => {
    if (!editor || !editorState.hasUnsavedChanges || editorState.saving) {
      return;
    }

    console.log('⏳ Auto-save scheduled in 3 seconds...');
    const autoSaveTimer = setTimeout(() => {
      console.log('💾 Auto-saving document...');
      handleSave(false); // Use handleSave which gets content from editor
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [editor, editorState.hasUnsavedChanges, editorState.saving]);

  // Load initial content when editor is first created (ONLY ONCE)
  // DO NOT reload content after initial load to preserve user edits (like tables)
  const hasLoadedInitialContent = useRef(false);
  useEffect(() => {
    if (editor && documentData && !hasLoadedInitialContent.current) {
      const content = getActualContent();
      console.log('🔄 Setting editor content - length:', content.length, 'hasTable:', content.includes('<table'));
      editor.commands.setContent(content);
      hasLoadedInitialContent.current = true;
      console.log('✅ Initial content loaded ONCE - Content will NOT reload automatically');

      // Verify the content was actually set
      setTimeout(() => {
        const editorContent = editor.getHTML();
        console.log('✔️ Verified editor content after set - length:', editorContent.length, 'hasTable:', editorContent.includes('<table'));
      }, 100);
    }
  }, [editor, documentData]); // Depend on documentData so it loads when data is available

  // Page calculation functions
  const calculatePageFromCursor = useCallback(() => {
    if (!editor) return;

    try {
      const { from } = editor.state.selection;
      const contentBefore = editor.state.doc.textBetween(0, from);
      const linesBefore = contentBefore.split('\n').length;
      const linesPerPage = 30; // Approximate
      const calculatedPage = Math.max(1, Math.ceil(linesBefore / linesPerPage));

      updatePageInfo(calculatedPage, Math.max(1, Math.ceil(editor.state.doc.textContent.split('\n').length / linesPerPage)));
    } catch (error) {
      console.error('Error calculating page from cursor:', error);
    }
  }, [editor, updatePageInfo]);

  const calculatePageFromScroll = useCallback(() => {
    try {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollHeight = Math.max(
        (document.documentElement && document.documentElement.scrollHeight) || 0,
        (document.body && document.body.scrollHeight) || 0,
        1
      );
      const clientHeight = window.innerHeight || 0;

      if (scrollHeight <= clientHeight || editorState.totalPages === 0) {
        if (calculatePageFromCursorRef.current) {
          calculatePageFromCursorRef.current();
        }
        return;
      }

      const maxScroll = scrollHeight - clientHeight;
      const scrollPercentage = Math.min(1, Math.max(0, scrollTop / maxScroll));
      const calculatedPage = Math.max(1, Math.min(editorState.totalPages,
        Math.floor(scrollPercentage * (editorState.totalPages - 1)) + 1
      ));

      updatePageInfo(calculatedPage, editorState.totalPages);
    } catch (error) {
      console.error('Error calculating page from scroll:', error);
      if (calculatePageFromCursorRef.current) {
        calculatePageFromCursorRef.current();
      }
    }
  }, [editorState.totalPages, updatePageInfo]);

  // Store refs
  useEffect(() => {
    calculatePageFromCursorRef.current = calculatePageFromCursor;
  }, [calculatePageFromCursor]);

  useEffect(() => {
    calculatePageFromScrollRef.current = calculatePageFromScroll;
  }, [calculatePageFromScroll]);

  // Scroll event listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (calculatePageFromScrollRef.current) {
          calculatePageFromScrollRef.current();
        }
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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

  // Handler functions
  const handleSave = async (showNotification = true) => {
    if (!documentData || !editor) return;

    const content = editor.getHTML();
    console.log('💾 Saving document with content length:', content.length);
    console.log('💾 Content includes table:', content.includes('<table'));
    await saveDocument(content, showNotification);
  };

  const handleUndo = () => {
    if (editor?.can().undo()) {
      editor.chain().focus().undo().run();
    }
  };

  const handleRedo = () => {
    if (editor?.can().redo()) {
      editor.chain().focus().redo().run();
    }
  };

  const handleExport = async () => {
    if (!documentData || !editor) return;

    try {
      const content = editor.getHTML();
      const response = await authTokenService.authenticatedFetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          format: 'pdf',
          filename: `${documentData.title}.pdf`,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Export failed');
    }
  };

  // Additional toolbar handler functions
  const removeAllColors = (htmlContent: string): string => {
    return htmlContent
      .replace(/style="[^"]*color:[^"]*"/g, '')
      .replace(/style=""/g, '')
      .replace(/style="([^"]*?)"/g, (match, style) => {
        const cleanedStyle = style.replace(/color:[^;]*;?/g, '').trim();
        return cleanedStyle ? `style="${cleanedStyle}"` : '';
      });
  };

  const handleHasUnsavedChanges = () => {
    if (!editorState.hasUnsavedChanges) {
      setEditorState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  };

  // Loading state
  if (editorState.loading || !documentData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (editorState.error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {editorState.error}
        </Alert>
        <Button onClick={loadDocument} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Professional Header */}
      <AppBar position="static" color="default" elevation={2} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ minHeight: '64px !important', px: 3 }}>
          {/* Left section - Navigation and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              onClick={() => router.push('/dashboard')}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 40,
                height: 40
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.2 }}>
                {documentData?.title || 'Document Editor'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Document ID: {documentId}
              </Typography>
            </Box>
          </Box>

          {/* Right section - Status and Actions */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Status indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Page {editorState.currentPage}/{editorState.totalPages}
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {editorState.wordCount} words
                </Typography>
              </Box>

              {editorState.hasUnsavedChanges ? (
                <Chip
                  size="small"
                  label="Unsaved Changes"
                  color="warning"
                  variant="filled"
                  icon={editorState.saving ? <CircularProgress size={12} /> : undefined}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              ) : (
                <Chip
                  size="small"
                  label="All Changes Saved"
                  color="success"
                  variant="outlined"
                  icon={<Check fontSize="small" />}
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ height: 30 }} />

            {/* Primary action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ButtonGroup variant="contained" size="small" sx={{ boxShadow: 1 }}>
                <Button
                  onClick={handleUndo}
                  disabled={!editor?.can().undo()}
                  title="Undo (Ctrl+Z)"
                  sx={{ minWidth: 'auto', px: 1.5 }}
                >
                  <Undo fontSize="small" />
                </Button>
                <Button
                  onClick={handleRedo}
                  disabled={!editor?.can().redo()}
                  title="Redo (Ctrl+Y)"
                  sx={{ minWidth: 'auto', px: 1.5 }}
                >
                  <Redo fontSize="small" />
                </Button>
              </ButtonGroup>

              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSave(true)}
                disabled={editorState.saving || !editorState.hasUnsavedChanges}
                startIcon={editorState.saving ? <CircularProgress size={16} /> : <SaveIcon />}
                sx={{
                  fontWeight: 600,
                  minWidth: 100,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 3 }
                }}
              >
                {editorState.saving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleExport}
                startIcon={<Download />}
                title="Export Document"
                sx={{
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 2
                }}
              >
                Export
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Editor Toolbar */}
      <EditorToolbar
        editor={editor}
        saving={editorState.saving}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
        trackChanges={editorState.trackChanges}
        changes={[]} // You can implement change tracking later
        comments={editorUI.comments}
        hasSupplements={hasSupplements}
        viewMode={viewMode.mode}
        currentPage={editorState.currentPage}
        totalPages={editorState.totalPages}
        wordCount={editorState.wordCount}
        charCount={editorState.charCount}
        fontSize={editorUI.fontSize}
        fontFamily={editorUI.fontFamily}
        documentId={documentId}
        onSave={() => handleSave(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTrackChangesToggle={setTrackChanges}
        onChangesDrawerOpen={() => setShowChanges(true)}
        onCommentsOpen={() => setEditorUI(prev => ({ ...prev, commentsDrawerOpen: true }))}
        onAdvancedSearchOpen={() => setEditorUI(prev => ({ ...prev, findReplaceOpen: true }))}
        onExportDialogOpen={handleExport}
        onViewModeChange={(mode) => setViewMode({ mode })}
        onFontSizeChange={(size) => setEditorUI(prev => ({ ...prev, fontSize: size }))}
        onFontFamilyChange={(family) => setEditorUI(prev => ({ ...prev, fontFamily: family }))}
      />

      {/* Advanced Toolbar */}
      <Paper sx={{ px: 2, py: 1 }}>
        <AdvancedToolbar
          editor={editor}
          onHasUnsavedChanges={handleHasUnsavedChanges}
          removeAllColors={removeAllColors}
        />
      </Paper>

      {/* Document Structure Toolbar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <DocumentStructureToolbar editor={editor} />
      </Box>

      {/* Main editor area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Paper sx={{ p: 3, minHeight: '100%' }}>
          {/* Display formatted header if available from customFields */}
          {editorUI.showHeader && (documentData?.customFields as any)?.headerHtml && !contentHasHeader() && (
            <>
              {/* Extract and apply styles from headerHtml */}
              {(() => {
                const styleMatch = ((documentData.customFields as any).headerHtml as string).match(/<style>([\s\S]*?)<\/style>/);
                if (styleMatch) {
                  return <style dangerouslySetInnerHTML={{ __html: styleMatch[1] }} />;
                }
                return null;
              })()}

              {/* Display the header */}
              <Box
                sx={{
                  mb: 3,
                  backgroundColor: 'white',
                  padding: '20px',
                  '& .header-table': {
                    width: '100%',
                    marginBottom: '20px'
                  },
                  '& .header-table td': {
                    verticalAlign: 'top',
                    padding: '10px'
                  },
                  '& .left-column': {
                    width: '35%',
                    textAlign: 'center'
                  },
                  '& .right-column': {
                    width: '65%',
                    textAlign: 'right'
                  },
                  '& .seal-container img': {
                    width: '100px',
                    height: '100px',
                    display: 'block',
                    margin: '0 auto'
                  },
                  '& .compliance-section': {
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    margin: '30px 0',
                    padding: '10px 0',
                    borderTop: '2px solid #000',
                    borderBottom: '2px solid #000'
                  },
                  '& .info-table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px'
                  },
                  '& .info-table td': {
                    padding: '8px',
                    borderTop: '1px solid #000',
                    fontSize: '10pt',
                    verticalAlign: 'top'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: (documentData.customFields as any).headerHtml as string }}
              />
            </>
          )}

          {/* Fallback to AirForceHeader component if no headerHtml in customFields */}
          {editorUI.showHeader && documentData && !(documentData?.customFields as any)?.headerHtml && !contentHasHeader() && (
            <AirForceHeader
              title={documentData.title}
              organization={documentOrganization}
              classification="UNCLASSIFIED"
            />
          )}

          <EditorContent
            editor={editor}
            style={{
              minHeight: '500px',
              fontSize: editorUI.fontSize,
              fontFamily: editorUI.fontFamily,
            }}
          />
        </Paper>
      </Box>

        {/* Comments sidebar - DISABLED to show only editor */}
        {/* <Box sx={{ width: 300, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
          <CommentsPanel
            editor={editor}
            comments={editorUI.comments}
            onCommentAdd={(comment) => {
              setEditorUI(prev => ({
                ...prev,
                comments: [...prev.comments, comment]
              }));
            }}
          />
        </Box> */}

      {/* Supplement dialog */}
      <SupplementSectionManager
        isOpen={supplementConfig.dialogOpen}
        onClose={() => setSupplementConfig(prev => ({ ...prev, dialogOpen: false }))}
        editor={editor}
        documentId={documentId}
        supplementType={supplementConfig.type}
        supplementLevel={supplementConfig.level}
        organization={supplementConfig.organization}
      />

      {/* Search/Replace dialog */}
      <AdvancedSearchReplace
        isOpen={editorUI.findReplaceOpen}
        onClose={() => setEditorUI(prev => ({ ...prev, findReplaceOpen: false }))}
        editor={editor}
      />

      {/* Appendix formatter */}
      <AppendixFormatter
        isOpen={editorUI.appendixDrawerOpen}
        onClose={() => setEditorUI(prev => ({ ...prev, appendixDrawerOpen: false }))}
        editor={editor}
      />
    </Box>
  );
};

export default DocumentEditor;