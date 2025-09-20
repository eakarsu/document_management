'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '../../../../lib/authTokenService';
import OPRFeedbackProcessorV2 from '../../../../components/feedback/OPRFeedbackProcessorV2';
import DocumentNumbering from '../../../../components/DocumentNumbering';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  Description as DocumentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  Code as HtmlIcon
} from '@mui/icons-material';

const OPRReviewPageV2 = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;

  const [documentData, setDocumentData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDocument, setSavingDocument] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDocumentData();
  }, [documentId]);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);

      // Fetch document with content
      const docResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
      if (docResponse.ok) {
        const data = await docResponse.json();
        const doc = data.document || data;
        setDocumentData(doc);

        // Get content from various possible locations
        let content = '';
        if (doc.customFields?.editableContent) {
          content = doc.customFields.editableContent;
        } else if (doc.customFields?.htmlContent) {
          content = doc.customFields.htmlContent;
        } else if (doc.customFields?.content) {
          content = doc.customFields.content;
        } else if (doc.content) {
          content = doc.content;
        } else if (doc.description) {
          content = `<p>${doc.description}</p>`;
        }

        setDocumentContent(content);
        setEditableContent(content);

        console.log('📄 Document loaded:', {
          id: documentId,
          title: doc.title,
          contentLength: content.length,
          hasFeedback: !!(doc.customFields?.crmFeedback || doc.customFields?.draftFeedback)
        });
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setDocumentContent(newContent);
    setEditableContent(newContent);

    // Update document data as well
    if (documentData) {
      setDocumentData(prevData => ({
        ...prevData,
        content: newContent,
        customFields: {
          ...prevData.customFields,
          content: newContent,
          editableContent: newContent
        }
      }));
    }
  };

  const handleSaveDocument = async () => {
    setSavingDocument(true);

    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: editableContent,
          customFields: {
            content: editableContent,
            editableContent: editableContent,
            lastOPRUpdate: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setDocumentContent(editableContent);
        setIsEditingDocument(false);
        alert('Document updated successfully');

        // Refresh document data
        await fetchDocumentData();
      } else {
        alert('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setSavingDocument(false);
    }
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    setExportAnchorEl(null);

    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/export`, {
        method: 'POST',
        body: JSON.stringify({
          format,
          includeNumbering: false,
          content: documentContent // Send current content
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const filename = `${documentData?.title?.replace(/[^a-z0-9]/gi, '_') || 'document'}.${format}`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export document');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  const handleUpdate = () => {
    // Refresh the document data after feedback processing
    fetchDocumentData();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OPR Review (Version Control): {documentData?.title || 'Loading...'}
          </Typography>
          <Button
            color="inherit"
            variant={isEditingDocument ? "contained" : "outlined"}
            onClick={() => setIsEditingDocument(!isEditingDocument)}
            startIcon={<EditIcon />}
            sx={{ mr: 2 }}
          >
            {isEditingDocument ? 'View Mode' : 'Edit Document'}
          </Button>
          {isEditingDocument && (
            <Button
              color="inherit"
              variant="contained"
              onClick={handleSaveDocument}
              disabled={savingDocument}
              startIcon={savingDocument ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ mr: 2 }}
            >
              Save Document
            </Button>
          )}
          <Button
            color="inherit"
            variant="outlined"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PdfIcon sx={{ mr: 1 }} /> Export as PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('docx')}>
              <DocumentIcon sx={{ mr: 1 }} /> Export as Word
            </MenuItem>
            <MenuItem onClick={() => handleExport('txt')}>
              <TextIcon sx={{ mr: 1 }} /> Export as Text
            </MenuItem>
            <MenuItem onClick={() => handleExport('html')}>
              <HtmlIcon sx={{ mr: 1 }} /> Export as HTML
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Side: Document Viewer/Editor */}
        <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Paper sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)' }}>
            {documentData ? (
              <>
                <Typography variant="h4" gutterBottom color="primary">
                  {documentData.title}
                </Typography>
                <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Category:</Typography>
                      <Typography variant="body2">{documentData.category || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Version:</Typography>
                      <Typography variant="body2">{documentData.currentVersion || '1'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Status:</Typography>
                      <Typography variant="body2">{documentData.status}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Numbering Controls */}
                {!isEditingDocument && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Document Numbering for Feedback Reference:
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showLineNumbers}
                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Line Numbers"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showPageNumbers}
                            onChange={(e) => setShowPageNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Page Numbers"
                      />
                    </FormGroup>
                  </Box>
                )}

                {/* Document Content */}
                {isEditingDocument ? (
                  <TextField
                    fullWidth
                    multiline
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    variant="outlined"
                    sx={{
                      fontFamily: 'monospace',
                      '& .MuiInputBase-root': {
                        minHeight: '500px',
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                ) : (
                  <>
                    {/* Display Air Force header if it exists */}
                    {documentData?.customFields?.headerHtml && (
                      <Box
                        sx={{ mb: 3 }}
                        dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
                      />
                    )}

                    <Box data-document-content>
                      <DocumentNumbering
                        content={editableContent}
                        enableLineNumbers={showLineNumbers}
                        enablePageNumbers={showPageNumbers}
                        linesPerPage={50}
                      />
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>Loading document...</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right Side: Version Control Feedback Processor */}
        <Box sx={{ width: '700px', overflow: 'auto' }}>
          <OPRFeedbackProcessorV2
            documentId={documentId}
            documentTitle={documentData?.title || 'Document'}
            documentContent={documentContent}
            onUpdate={handleUpdate}
            onContentChange={handleContentChange}
          />
        </Box>
      </Box>
    </>
  );
};

export default OPRReviewPageV2;