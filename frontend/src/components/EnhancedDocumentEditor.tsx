'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Stack,
  Alert,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  FormatListNumbered,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  AddCircleOutline,
  RemoveCircleOutline,
  ChangeCircleOutline,
  SwapHoriz,
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import SupplementToolbar from './supplements/SupplementToolbar';
import { api } from '../lib/api';

interface EnhancedDocumentEditorProps {
  documentId: string;
  content: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

interface Supplement {
  id: string;
  sectionNumber: string;
  originalContent: string;
  newContent: string;
  supplementType: 'ADD' | 'REPLACE' | 'DELETE' | 'MODIFY';
  supplementLevel: string;
  rationale: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

const EnhancedDocumentEditor: React.FC<EnhancedDocumentEditorProps> = ({
  documentId,
  content: initialContent,
  onContentChange,
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [selectedText, setSelectedText] = useState('');
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showSupplementToolbar, setShowSupplementToolbar] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSupplements, setShowSupplements] = useState(true);
  const [supplementsDrawerOpen, setSupplementsDrawerOpen] = useState(false);
  const [attachmentsDrawerOpen, setAttachmentsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load supplements on mount
  useEffect(() => {
    loadSupplements();
    loadAttachments();
  }, [documentId]);

  // Add styles for supplemented sections and document formatting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .supplemented-section {
        position: relative;
        background-color: rgba(255, 235, 59, 0.1);
        border-left: 4px solid #ffc107;
        padding-left: 8px;
        margin: 4px 0;
      }

      .supplemented-section[data-supplement-type="ADD"] {
        background-color: rgba(76, 175, 80, 0.1);
        border-left-color: #4caf50;
      }

      .supplemented-section[data-supplement-type="DELETE"] {
        background-color: rgba(244, 67, 54, 0.1);
        border-left-color: #f44336;
        text-decoration: line-through;
        opacity: 0.7;
      }

      .supplemented-section[data-supplement-type="REPLACE"] {
        background-color: rgba(255, 152, 0, 0.1);
        border-left-color: #ff9800;
      }

      .supplemented-section[data-supplement-type="MODIFY"] {
        background-color: rgba(33, 150, 243, 0.1);
        border-left-color: #2196f3;
      }

      .supplement-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        margin-left: 8px;
        font-weight: bold;
        vertical-align: super;
      }

      .document-editor-content {
        position: relative;
        padding: 20px;
        min-height: 600px;
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
      }

      .document-editor-content.selection-mode {
        user-select: text;
        cursor: text;
      }

      /* Header Section Formatting */
      .document-editor-content div[style*="text-align: center"] {
        text-align: center !important;
      }

      .document-editor-content div[style*="text-align: left"] {
        text-align: left !important;
      }

      .document-editor-content div[style*="font-weight: bold"] {
        font-weight: bold !important;
      }

      .document-editor-content div[style*="text-decoration: underline"] {
        text-decoration: underline !important;
      }

      .document-editor-content div[style*="font-size: 18px"] {
        font-size: 18px !important;
      }

      .document-editor-content div[style*="font-size: 20px"] {
        font-size: 20px !important;
      }

      .document-editor-content div[style*="border: 2px solid black"] {
        border: 2px solid black !important;
        padding: 10px !important;
        margin: 20px auto !important;
        width: 80% !important;
      }

      .document-editor-content div[style*="border-bottom: 2px solid black"] {
        border-bottom: 2px solid black !important;
        width: 60% !important;
        margin: 20px auto !important;
      }

      .document-editor-content div[style*="page-break-after: always"] {
        page-break-after: always !important;
        margin-bottom: 40px;
        border-bottom: 2px dashed #ccc;
        padding-bottom: 20px;
      }

      /* Table of Contents Formatting */
      .document-editor-content .toc-entry {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin: 8px 0;
        position: relative;
      }

      .document-editor-content .toc-title {
        flex: 1;
        padding-right: 10px;
      }

      .document-editor-content .toc-dots {
        flex: 1;
        border-bottom: 1px dotted #333;
        margin: 0 5px;
        min-width: 50px;
      }

      .document-editor-content .toc-page {
        white-space: nowrap;
        padding-left: 10px;
      }

      /* Preserve inline styles */
      .document-editor-content [style*="margin-left: 20px"] {
        margin-left: 20px !important;
      }

      .document-editor-content [style*="margin-left: 40px"] {
        margin-left: 40px !important;
      }

      .document-editor-content [style*="margin-left: 60px"] {
        margin-left: 60px !important;
      }

      .document-editor-content [style*="margin-left: 80px"] {
        margin-left: 80px !important;
      }

      .document-editor-content [style*="margin-left: 100px"] {
        margin-left: 100px !important;
      }

      /* Headers */
      .document-editor-content h1,
      .document-editor-content h2,
      .document-editor-content h3,
      .document-editor-content h4,
      .document-editor-content h5,
      .document-editor-content h6 {
        font-weight: bold;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }

      /* Paragraphs */
      .document-editor-content p {
        margin-bottom: 1em;
        line-height: 1.6;
      }

      /* Lists */
      .document-editor-content ul,
      .document-editor-content ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }

      .document-editor-content li {
        margin-bottom: 0.5em;
      }

      /* Tables */
      .document-editor-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1em;
      }

      .document-editor-content th,
      .document-editor-content td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      .document-editor-content th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadSupplements = async () => {
    try {
      const response = await api.get(`/editor/documents/${documentId}/supplement`);
      if (response.data?.supplements) {
        setSupplements(response.data.supplements);
        applySupplementHighlights(response.data.supplements);
      }
    } catch (err) {
      console.error('Error loading supplements:', err);
    }
  };

  const loadAttachments = async () => {
    try {
      const response = await api.get(`/editor/documents/${documentId}/attachments`);
      if (response.data?.attachments) {
        setAttachments(response.data.attachments);
      }
    } catch (err) {
      console.error('Error loading attachments:', err);
    }
  };

  const applySupplementHighlights = (supplementList: Supplement[]) => {
    if (!editorRef.current) return;

    // Clear existing highlights
    const existingHighlights = editorRef.current.querySelectorAll('.supplemented-section');
    existingHighlights.forEach(el => {
      el.classList.remove('supplemented-section');
      el.removeAttribute('data-supplement-type');
      el.removeAttribute('data-supplement-id');
    });

    // Apply new highlights
    supplementList.forEach(supplement => {
      const elements = editorRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
      elements?.forEach(el => {
        const elementText = el.textContent || '';
        if (elementText.includes(supplement.sectionNumber) ||
            elementText.includes(supplement.originalContent.substring(0, 50))) {
          el.classList.add('supplemented-section');
          el.setAttribute('data-supplement-type', supplement.supplementType);
          el.setAttribute('data-supplement-id', supplement.id);
        }
      });
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || readOnly) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length < 10) return;

    setSelectedText(selectedText);

    // Get the selected element
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === 3
      ? container.parentElement
      : container as HTMLElement;

    setSelectedElement(element);

    // Calculate toolbar position
    const rect = range.getBoundingClientRect();
    setToolbarPosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 60
    });

    setShowSupplementToolbar(true);
  };

  const handleSupplementSaved = () => {
    loadSupplements();
    setShowSupplementToolbar(false);
    setSelectedText('');
    setSelectedElement(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post(
        `/editor/documents/${documentId}/attachments/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data?.attachments) {
        setAttachments(prev => [...prev, ...response.data.attachments]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload attachments');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteSupplement = async (supplementId: string) => {
    try {
      await api.delete(`/editor/documents/${documentId}/supplement/${supplementId}`);
      loadSupplements();
    } catch (err) {
      console.error('Error deleting supplement:', err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/editor/documents/${documentId}/attachments/${attachmentId}`);
      loadAttachments();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon />;
    if (fileType.includes('image')) return <ImageIcon />;
    if (fileType.includes('document') || fileType.includes('word')) return <DocumentIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main Editor */}
      <Paper elevation={0} sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">Document Editor</Typography>

              <Divider orientation="vertical" flexItem />

              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="View Supplements">
                  <Button
                    startIcon={<FormatListNumbered />}
                    onClick={() => setSupplementsDrawerOpen(true)}
                  >
                    Supplements
                    {supplements.length > 0 && (
                      <Badge
                        badgeContent={supplements.length}
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Button>
                </Tooltip>

                <Tooltip title="View Attachments">
                  <Button
                    startIcon={<AttachFileIcon />}
                    onClick={() => setAttachmentsDrawerOpen(true)}
                  >
                    Attachments
                    {attachments.length > 0 && (
                      <Badge
                        badgeContent={attachments.length}
                        color="secondary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title={showSupplements ? 'Hide supplement highlights' : 'Show supplement highlights'}>
                <IconButton
                  size="small"
                  onClick={() => setShowSupplements(!showSupplements)}
                >
                  {showSupplements ? <ViewIcon /> : <HideIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Content Editor */}
        <Box
          ref={editorRef}
          className={`document-editor-content ${!readOnly ? 'selection-mode' : ''}`}
          contentEditable={!readOnly}
          dangerouslySetInnerHTML={{ __html: content }}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onInput={(e) => {
            const newContent = e.currentTarget.innerHTML;
            setContent(newContent);
            if (onContentChange) {
              onContentChange(newContent);
            }
          }}
          sx={{
            minHeight: 600,
            p: 3,
            '&:focus': {
              outline: 'none'
            }
          }}
        />
      </Paper>

      {/* Supplement Toolbar */}
      {showSupplementToolbar && selectedText && !readOnly && (
        <SupplementToolbar
          documentId={documentId}
          selectedText={selectedText}
          selectedElement={selectedElement || undefined}
          position={toolbarPosition}
          onClose={() => {
            setShowSupplementToolbar(false);
            setSelectedText('');
            setSelectedElement(null);
          }}
          onSupplementSaved={handleSupplementSaved}
        />
      )}

      {/* Supplements Drawer */}
      <Drawer
        anchor="right"
        open={supplementsDrawerOpen}
        onClose={() => setSupplementsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document Supplements ({supplements.length})
          </Typography>
          <Divider />

          {supplements.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No supplements have been added to this document yet.
            </Alert>
          ) : (
            <List>
              {supplements.map((supplement) => (
                <ListItem key={supplement.id} sx={{ mb: 1 }}>
                  <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Chip
                          size="small"
                          label={supplement.supplementType}
                          color={
                            supplement.supplementType === 'ADD' ? 'success' :
                            supplement.supplementType === 'DELETE' ? 'error' :
                            supplement.supplementType === 'REPLACE' ? 'warning' : 'info'
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          Section {supplement.sectionNumber}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {supplement.originalContent.substring(0, 100)}...
                      </Typography>

                      {supplement.newContent && (
                        <>
                          <Divider />
                          <Typography variant="body2" color="primary">
                            {supplement.newContent.substring(0, 100)}...
                          </Typography>
                        </>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        {supplement.rationale}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(supplement.createdAt).toLocaleDateString()}
                        </Typography>
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSupplement(supplement.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Attachments Drawer */}
      <Drawer
        anchor="right"
        open={attachmentsDrawerOpen}
        onClose={() => setAttachmentsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document Attachments ({attachments.length})
          </Typography>
          <Divider />

          {!readOnly && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                disabled={loading}
              >
                Upload Attachments
              </Button>
            </Box>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {attachments.length === 0 ? (
            <Alert severity="info">
              No attachments have been added to this document yet.
            </Alert>
          ) : (
            <List>
              {attachments.map((attachment) => (
                <ListItem key={attachment.id}>
                  <ListItemIcon>
                    {getFileIcon(attachment.fileType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={attachment.fileName}
                    secondary={`${formatFileSize(attachment.fileSize)} • ${new Date(attachment.uploadedAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    {!readOnly && (
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Floating Action Button for adding supplements */}
      {!readOnly && (
        <SpeedDial
          ariaLabel="Document Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<AddCircleOutline />}
            tooltipTitle="Add Supplement"
            onClick={() => {
              const selection = window.getSelection();
              if (selection && !selection.isCollapsed) {
                handleTextSelection();
              } else {
                alert('Please select text to mark as supplement');
              }
            }}
          />
          <SpeedDialAction
            icon={<AttachFileIcon />}
            tooltipTitle="Add Attachment"
            onClick={() => fileInputRef.current?.click()}
          />
        </SpeedDial>
      )}
    </Box>
  );
};

export default EnhancedDocumentEditor;