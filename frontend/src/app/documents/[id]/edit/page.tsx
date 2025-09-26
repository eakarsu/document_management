'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Cancel,
  Business,
  Edit as EditIcon,  
  Description as DocumentIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Launch as LaunchIcon,
  Warning as WarningIcon,
  Preview as PreviewIcon,
  FormatListNumbered
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { DAFPublicationEditor } from '../../../../components/editor/DAFPublicationEditor';
import { DAFPublicationEditorWithPageNumbers } from '../../../../components/editor/DAFPublicationEditorWithPageNumbers';
import DocumentNumbering from '../../../../components/DocumentNumbering';

interface Document {
  id: string;
  title: string;
  mimeType: string;
  category: string;
  fileSize?: number;
  uploadedAt: string;
  versions: any[];
  currentVersion?: number;
  content?: string;
}

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;
  
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [documentContent, setDocumentContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showParagraphNumbers, setShowParagraphNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Calculate pages whenever content changes
  useEffect(() => {
    if (documentContent) {
      const pages = Math.max(1, Math.ceil(documentContent.length / 3000));
      console.log('Page calculation:', {
        contentLength: documentContent.length,
        calculatedPages: pages,
        currentPage,
        totalPages
      });
      setTotalPages(pages);
      // Simple current page estimate - could be enhanced with cursor position
      setCurrentPage(Math.min(currentPage, pages));
    }
  }, [documentContent]);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      console.log('🔴🔴🔴 EDIT PAGE LOADING - Document ID:', documentId);
      try {
        const response = await api.get(`/api/documents/${documentId}`);
        
        if (response.ok) {
          const data = await response.json();
          setDocumentData(data);
          setTitle(data.title);
          setCategory(data.category);
          
          // Load document content - check all possible content fields
          console.log('🔴🔴🔴 EDIT PAGE - Loading document content:', {
            hasHtmlContent: !!data.customFields?.htmlContent,
            hasEditableContent: !!data.customFields?.editableContent,
            hasContent: !!data.customFields?.content,
            hasRootContent: !!data.content,
            htmlContentLength: data.customFields?.htmlContent?.length,
            editableContentLength: data.customFields?.editableContent?.length,
            contentLength: data.customFields?.content?.length,
            rootContentLength: data.content?.length,
            allCustomFields: Object.keys(data.customFields || {}),
            htmlContentHasIntro: data.customFields?.htmlContent?.includes('INTRODUCTION') || data.customFields?.htmlContent?.includes('data-paragraph="0.1"'),
            editableContentHasIntro: data.customFields?.editableContent?.includes('INTRODUCTION') || data.customFields?.editableContent?.includes('data-paragraph="0.1"')
          });

          // Try to load content from various possible locations
          let loadedContent = null;

          if (data.customFields?.htmlContent) {
            // Use full HTML content (includes intro, summary, and main content)
            loadedContent = data.customFields.htmlContent;
            console.log('🔴 Using htmlContent');
          } else if (data.customFields?.editableContent) {
            // Fallback to editable content if no htmlContent
            loadedContent = data.customFields.editableContent;
            console.log('🔴 Using editableContent');
          } else if (data.customFields?.content) {
            // Fallback to plain text content (no styles)
            loadedContent = data.customFields.content;
            console.log('🔴 Using customFields.content');
          } else if (data.content) {
            loadedContent = data.content;
            console.log('🔴 Using root content');
          }

          if (loadedContent) {
            console.log('🔴🔴🔴 Content loaded successfully, length:', loadedContent.length);
            setDocumentContent(loadedContent);
          } else if (data.mimeType === 'text/html' || data.mimeType === 'text/plain') {
            // Try to convert document to HTML for rich text editing
            try {
              const contentResponse = await api.get(`/api/documents/${documentId}/download`);
              if (contentResponse.ok) {
                const contentBlob = await contentResponse.blob();
                const text = await contentBlob.text();
                setDocumentContent(text);
              }
            } catch (e) {
              console.log('Could not load content for rich text editing:', e);
            }
          }
        } else {
          setError('Failed to load document');
        }
      } catch (err) {
        setError('Error loading document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleSave = async () => {
    if (!documentData) return;
    
    setSaving(true);
    try {
      const response = await api.put(`/api/documents/${documentId}`, {
        title: title?.trim() || '',
        category: category?.trim() || ''
      });

      if (response.ok) {
        // Navigate back to document detail page
        router.push(`/documents/${documentId}`);
      } else {
        setError('Failed to save changes');
      }
    } catch (err) {
      setError('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/documents/${documentId}`);
  };

  const getProperFileExtension = (mimeType: string, originalTitle: string): string => {
    // Handle undefined or null title
    if (!originalTitle) {
      originalTitle = 'document';
    }
    
    console.log('Getting extension for:', { mimeType, originalTitle });
    
    // If title already has proper extension, keep it
    const hasExtension = originalTitle.match(/\.[a-zA-Z0-9]+$/);
    if (hasExtension) {
      console.log('Title already has extension:', originalTitle);
      return originalTitle;
    }

    // Add appropriate extension based on MIME type
    const extensionMap: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'text/html': '.html',
      'text/csv': '.csv',
      'application/rtf': '.rtf',
      'application/vnd.oasis.opendocument.text': '.odt',
      'application/vnd.oasis.opendocument.spreadsheet': '.ods',
      'application/vnd.oasis.opendocument.presentation': '.odp'
    };

    const extension = extensionMap[mimeType] || '.txt';
    const finalFilename = originalTitle + extension;
    console.log('Final filename:', { originalTitle, mimeType, extension, finalFilename });
    return finalFilename;
  };

  const handleDownloadForEdit = async () => {
    console.log('Download clicked. DocumentData:', documentData, 'DocumentId:', documentId);
    
    if (!documentData) {
      setError('Document data not loaded yet. Please wait...');
      return;
    }
    
    const docId = documentData.id || documentId;
    if (!docId) {
      setError('Document ID not available');
      return;
    }
    
    console.log('Using document ID:', docId);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Making API call to:', `/api/documents/${docId}/download`);
      const response = await api.get(`/api/documents/${docId}/download`);
      console.log('Response received:', response.status, response.ok);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Get filename from Content-Disposition header or use original name
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'document';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        } else if (documentData.title) {
          // Fallback to document title if no Content-Disposition header
          filename = documentData.title;
        }
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        setDownloadUrl(url);

        // Show instructions for opening with correct application
        const appName = getRecommendedApplication(documentData.mimeType || 'application/octet-stream').split(',')[0];
        setTimeout(() => {
          alert(`File downloaded as "${filename}"\n\nTo edit:\n1. Find the file in your Downloads folder\n2. Right-click and "Open with" → ${appName}\n3. Or double-click if ${appName} is set as default for this file type`);
        }, 1000);
        
      } else {
        console.error('Download failed with status:', response.status);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Error response:', errorText);
        setError(`Failed to download document (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError(`Download error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !documentData) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || documentData.title);
      formData.append('description', `Updated via edit mode - ${new Date().toLocaleDateString()}`);
      formData.append('changeNotes', `Document updated via edit interface`);
      formData.append('changeType', 'MINOR');

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        // Reload document data to show new version
        window.location.reload();
      } else {
        setError('Failed to upload new version');
      }
    } catch (err) {
      setError('Upload error occurred');
    } finally {
      setUploading(false);
    }
  };

  const getRecommendedApplication = (mimeType: string): string => {
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'LibreOffice Writer, Microsoft Word, or Google Docs';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'LibreOffice Calc, Microsoft Excel, or Google Sheets';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return 'LibreOffice Impress, Microsoft PowerPoint, or Google Slides';
    } else if (mimeType === 'application/pdf') {
      return 'LibreOffice Draw, Adobe Acrobat, or PDF editor';
    } else if (mimeType.startsWith('text/')) {
      return 'Any text editor (VS Code, Notepad++, etc.)';
    }
    return 'Application that supports this file type';
  };

  const handleRichTextSave = async (newContent: string, metadata: any) => {
    if (!documentData) return;
    
    setSaving(true);
    try {
      await api.put(`/api/documents/${documentId}`, {
        title: title?.trim() || '',
        category: category?.trim() || '',
        content: newContent,
        metadata
      });

      // Track changes if document has versions
      if (documentData?.currentVersion) {
        await api.post(`/api/editor/documents/${documentId}/track-changes`, {
          versionId: documentData.currentVersion,
          oldContent: documentContent,
          newContent
        });
      }
      
      setDocumentContent(newContent);
      setError(null);
      alert('Document saved successfully!');
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document changes');
    } finally {
      setSaving(false);
    }
  };

  const handleRichTextExport = async (format: 'pdf' | 'docx' | 'html') => {
    if (!documentData) return;
    
    try {
      const referencesResponse = await api.get(`/api/editor/documents/${documentId}/references`);
      const references = referencesResponse.ok ? await referencesResponse.json() : { data: [] };
      
      const changeSummaryResponse = documentData?.currentVersion ? 
        await api.get(`/api/editor/documents/${documentId}/change-summary/${documentData.currentVersion}`) : 
        null;
      const changeSummary = changeSummaryResponse?.ok ? await changeSummaryResponse.json() : null;
      
      const response = await api.post(`/api/editor/documents/${documentId}/export`, {
        format,
        content: documentContent,
        metadata: {
          title: documentData?.title,
          author: 'Document Author', // You might want to get this from user context
          documentId,
          version: documentData?.currentVersion?.toString()
        },
        references: references.data || [],
        changeSummary: changeSummary?.data?.summary || ''
      });
      
      if (response.ok) {
        const exportData = await response.json();
        if (exportData.success) {
          // Download the exported file
          const downloadResponse = await api.get(exportData.path);
          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${documentData?.title || 'document'}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            alert(`Document exported as ${format.toUpperCase()}`);
          }
        }
      }
    } catch (error) {
      console.error('Error exporting document:', error);
      setError(`Failed to export as ${format}`);
    }
  };

  const canUseRichTextEditor = (mimeType: string) => {
    return mimeType === 'text/html' || 
           mimeType === 'text/plain' || 
           mimeType.includes('text/') ||
           mimeType.includes('word') ||
           mimeType.includes('document') ||
           mimeType === 'application/octet-stream'; // For uploaded files without proper MIME detection
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => router.push(`/documents/${documentId}`)}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Business sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Edit Document - Richmond DMS
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  if (error || !documentData) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Business sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Edit Document - Richmond DMS
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">
            {error || 'Document not found'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Edit Document - Richmond DMS
          </Typography>
          <Button
            color="inherit"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || !title?.trim()}
            sx={{ mr: 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            color="inherit"
            startIcon={<Cancel />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Always visible floating page indicator */}
        {documentContent && (
          <Box
            sx={{ 
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 10000,
              padding: '10px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold'
            }}
          >
            📄 Page {Math.ceil((documentContent?.length || 0) / 3000) || 1} of {Math.max(1, Math.ceil((documentContent?.length || 0) / 3000))}
          </Box>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12}>
            {/* Content Editing Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ flexGrow: 1 }}
                >
                  <Tab label="Rich Text Editor" disabled={!canUseRichTextEditor(documentData?.mimeType || '')} />
                  <Tab label="External Editor" />
                  <Tab label="Metadata" />
                </Tabs>
                {tabValue === 0 && canUseRichTextEditor(documentData?.mimeType || '') && (
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    startIcon={showPreview ? <EditIcon /> : <PreviewIcon />}
                    sx={{ mr: 2 }}
                  >
                    {showPreview ? 'Edit' : 'Preview with Numbers'}
                  </Button>
                )}
              </Box>
            </Paper>

            {tabValue === 0 && canUseRichTextEditor(documentData?.mimeType || '') && (
              <>
                {showPreview ? (
                  <Paper sx={{ p: 3, minHeight: 'calc(100vh - 300px)' }}>
                    {/* Numbering Controls */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Document Numbering Options:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
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
                              checked={showParagraphNumbers}
                              onChange={(e) => setShowParagraphNumbers(e.target.checked)}
                              size="small"
                            />
                          }
                          label="Paragraph Numbers"
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
                      </Box>
                    </Box>
                    
                    {/* Air Force Header if exists */}
                    {(documentData as any)?.customFields?.headerHtml && (
                      <Box 
                        sx={{ mb: 3 }}
                        dangerouslySetInnerHTML={{ __html: (documentData as any).customFields.headerHtml }}
                      />
                    )}
                    
                    {/* Document Preview with Numbering */}
                    <DocumentNumbering
                      content={documentContent || `
                        <h1>${documentData.title || 'Document'}</h1>
                        <p>Start editing your document content here...</p>
                      `}
                      enableLineNumbers={showLineNumbers}
                      enablePageNumbers={showPageNumbers}
                      linesPerPage={50}
                    />
                  </Paper>
                ) : (
                  <>
                    {/* Floating page indicator - always visible in edit mode */}
                    <Box
                      sx={{ 
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 9999,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        borderRadius: '25px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      <FormatListNumbered />
                      <span>Page {currentPage} of {totalPages}</span>
                    </Box>
                    
                    <Paper sx={{ p: 0, height: 'calc(100vh - 300px)' }}>
                      <DAFPublicationEditorWithPageNumbers
                        documentId={documentId}
                        initialContent={documentContent || `
                          <h1>${documentData.title || 'Document'}</h1>
                          <p>Start editing your document content here...</p>
                        `}
                        customFields={(documentData as any)?.customFields}
                        onSave={async (content) => {
                          await handleRichTextSave(content, {
                            title: documentData.title || 'Untitled',
                            publicationType: 'DAFMAN',
                            publicationNumber: '',
                            opr: ''
                          });
                          setDocumentContent(content); // Update content for preview
                        }}
                        readOnly={false}
                      />
                    </Paper>
                  </>
                )}
              </>
            )}

            {tabValue === 1 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LaunchIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5">
                    Edit with External Application
                  </Typography>
                </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Recommended for {documentData?.title}:</strong><br />
                  {getRecommendedApplication(documentData?.mimeType || '')}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadForEdit}
                  disabled={loading || !documentData}
                  size="large"
                >
                  Download with Correct Extension
                </Button>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  size="large"
                >
                  {uploading ? 'Uploading...' : 'Upload Edited Version'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept={documentData?.mimeType}
                  />
                </Button>
              </Box>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <WarningIcon sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Content Editing Workflow:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                      1. Click "Download with Correct Extension" - saves file with proper extension (e.g., resume.docx)<br />
                      2. Find the file in your Downloads folder<br />
                      3. Double-click the file - it will open with the correct application ({getRecommendedApplication(documentData?.mimeType || '').split(',')[0]})<br />
                      4. Make your changes and save the file<br />
                      5. Use "Upload Edited Version" to upload your modified file<br />
                      6. The new version will be saved with version history
                    </Typography>
                  </Box>
                </Box>
              </Alert>
              </Paper>
            )}

            {tabValue === 2 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <EditIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="h5">
                        Edit Document Metadata
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      label="Document Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      sx={{ mb: 3 }}
                      helperText="Enter a descriptive title for this document"
                    />

                    <TextField
                      fullWidth
                      label="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      sx={{ mb: 3 }}
                      helperText="Categorize this document for better organization"
                    />

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving || !title?.trim()}
                      >
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <DocumentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" noWrap>
                          {documentData.title}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip label={documentData.category} color="primary" size="small" />
                        <Chip label={documentData.mimeType} variant="outlined" size="small" />
                        {documentData.fileSize && (
                          <Chip 
                            label={`${(documentData.fileSize / 1024 / 1024).toFixed(2)} MB`} 
                            variant="outlined" 
                            size="small" 
                          />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        <strong>Uploaded:</strong><br />
                        {new Date(documentData.uploadedAt).toLocaleDateString()}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Versions:</strong> {documentData.versions?.length || 1}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> You can edit document metadata and content depending on the document type.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}