'use client';

console.log('DocumentViewer.tsx file loaded');

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  OpenInNew as OpenIcon,
  FormatListNumbered,
  Edit as EditIcon
} from '@mui/icons-material';
import { api } from '../lib/api';
import EnhancedDocumentEditor from './EnhancedDocumentEditor';

interface DocumentViewerProps {
  documentId: string;
  document: {
    title: string;
    mimeType: string;
    category: string;
    fileSize?: number;
    content?: string;
    customFields?: any;
  };
  onDownload?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  document,
  onDownload
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(document?.content || '');
  const [headerHtml, setHeaderHtml] = useState('');
  const [documentData, setDocumentData] = useState<any>(null);

  // Debug log
  console.log('DocumentViewer mounted:', {
    documentId,
    hasDocument: !!document,
    hasCustomFields: !!document?.customFields,
    headerHtmlInProps: document?.customFields?.headerHtml?.length || 0
  });

  // Load document data to get headerHtml
  useEffect(() => {
    // First check if headerHtml is already provided in props
    if (document?.customFields?.headerHtml) {
      console.log('DocumentViewer: headerHtml found in props:', document.customFields.headerHtml.length, 'chars');
      setHeaderHtml(document.customFields.headerHtml);
      const editableContent = document.customFields?.editableContent ||
                              document.customFields?.content ||
                              document?.content || '';
      setContent(editableContent);
      return;
    }

    const loadDocumentData = async () => {
      try {
        console.log('DocumentViewer: Fetching document data for:', documentId);
        const response = await api.get(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('DocumentViewer: Response data:', {
            hasDocument: !!data.document,
            hasCustomFields: !!data.document?.customFields || !!data.customFields,
            customFieldKeys: Object.keys(data.document?.customFields || data.customFields || {}),
            headerHtmlLength: data.document?.customFields?.headerHtml?.length || data.customFields?.headerHtml?.length || 0
          });

          setDocumentData(data.document || data);

          // Extract headerHtml and content from customFields
          if (data.customFields?.headerHtml) {
            console.log('DocumentViewer: Setting headerHtml from data.customFields');
            setHeaderHtml(data.customFields.headerHtml);
          } else if (data.document?.customFields?.headerHtml) {
            console.log('DocumentViewer: Setting headerHtml from data.document.customFields');
            setHeaderHtml(data.document.customFields.headerHtml);
          } else {
            console.log('DocumentViewer: No headerHtml found in response');
          }

          // Use editable content (without header) if available
          const editableContent = data.customFields?.editableContent ||
                                  data.document?.customFields?.editableContent ||
                                  data.customFields?.content ||
                                  data.document?.customFields?.content ||
                                  data.content ||
                                  document?.content || '';
          setContent(editableContent);
        }
      } catch (error) {
        console.error('Error loading document data:', error);
      }
    };

    if (documentId) {
      loadDocumentData();
    }
  }, [documentId, document?.customFields]);

  // Use content directly from state or props
  const htmlContent = content || document?.content || '';

  // Generate authenticated URLs for viewing - use frontend API proxy
  const getAuthenticatedUrl = async (endpoint: string): Promise<string> => {
    // The frontend API routes handle authentication via cookies automatically
    return endpoint;
  };

  // Check if document type can be displayed inline in browser
  const canViewInline = (mimeType: string): boolean => {
    const viewableTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'text/csv',
      'text/xml',
      'application/json',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ];
    return viewableTypes.includes(mimeType.toLowerCase());
  };

  // Check if document type should be auto-downloaded instead of viewed
  const shouldAutoDownload = (mimeType: string): boolean => {
    const downloadTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      'application/zip',
      'application/x-zip-compressed'
    ];
    return downloadTypes.includes(mimeType.toLowerCase());
  };

  const handleViewInline = () => {
    // No need for view mode, always show inline
    setError(null);
  };

  const handleViewInNewTab = async () => {
    if (!document?.mimeType || shouldAutoDownload(document.mimeType)) {
      // For Office documents and other files that need external applications,
      // trigger a download instead of trying to view in browser
      handleDownload();
    } else {
      setLoading(true);
      try {
        const viewUrl = await getAuthenticatedUrl(`/api/documents/${documentId}/preview`);
        window.open(viewUrl, '_blank');
      } catch (err) {
        setError('Failed to generate view URL');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    
    try {
      const response = await api.get(`/api/documents/${documentId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document?.title || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(link);
        
        if (onDownload) {
          onDownload();
        }
      } else {
        setError('Failed to download document');
      }
    } catch (err) {
      setError('Download error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderInlineViewer = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!htmlContent && !headerHtml) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No content available for this document
          </Typography>
        </Box>
      );
    }

    // Extract styles from headerHtml if present
    let headerStyles = '';
    let headerContent = headerHtml;

    if (headerHtml) {
      const styleMatch = headerHtml.match(/<style>([\s\S]*?)<\/style>/);
      if (styleMatch) {
        headerStyles = styleMatch[1];
        // Keep the full headerHtml including styles for proper rendering
      }
    }

    // Render the header and content separately for proper formatting
    return (
      <>
        {/* Apply header styles globally if available */}
        {headerStyles && (
          <style dangerouslySetInnerHTML={{ __html: headerStyles }} />
        )}

        {/* Display formatted header if available */}
        {headerHtml && (
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
            dangerouslySetInnerHTML={{ __html: headerHtml }}
          />
        )}

        {/* Display the document content */}
        {htmlContent && (
          <Box
            sx={{
            '& h1, & h2, & h3, & h4, & h5, & h6': {
            fontWeight: 'bold',
            marginTop: '1em',
            marginBottom: '0.5em'
          },
          '& p': {
            marginBottom: '1em',
            lineHeight: 1.6
          },
          // Respect inline margin-left styles from AI-generated documents
          '& [style*="margin-left: 20px"]': {
            marginLeft: '20px !important'
          },
          '& [style*="margin-left: 40px"]': {
            marginLeft: '40px !important'
          },
          '& [style*="margin-left: 60px"]': {
            marginLeft: '60px !important'
          },
          '& [style*="margin-left: 80px"]': {
            marginLeft: '80px !important'
          },
          '& [style*="margin-left: 100px"]': {
            marginLeft: '100px !important'
          },
          // Header formatting
          '& div[style*="text-align: center"]': {
            textAlign: 'center !important'
          },
          '& div[style*="font-weight: bold"]': {
            fontWeight: 'bold !important'
          },
          '& div[style*="text-decoration: underline"]': {
            textDecoration: 'underline !important'
          },
          '& div[style*="font-size: 18px"]': {
            fontSize: '18px !important'
          },
          '& div[style*="font-size: 20px"]': {
            fontSize: '20px !important'
          },
          '& div[style*="border: 2px solid black"]': {
            border: '2px solid black !important',
            padding: '10px !important',
            margin: '20px auto !important',
            width: '80% !important'
          },
          '& div[style*="border-bottom: 2px solid black"]': {
            borderBottom: '2px solid black !important',
            width: '60% !important',
            margin: '20px auto !important'
          },
          // Table of Contents formatting
          '& .toc-entry': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            margin: '8px 0'
          },
          '& .toc-title': {
            flex: 1,
            paddingRight: '10px'
          },
          '& .toc-dots': {
            flex: 1,
            borderBottom: '1px dotted #333',
            margin: '0 5px',
            minWidth: '50px'
          },
          '& .toc-page': {
            whiteSpace: 'nowrap',
            paddingLeft: '10px'
          }
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </>
  );
  };


  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  };

  // Show loading state if document is not yet available
  if (!document) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Loading document...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Document Info Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {document?.title || 'Loading...'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          {document?.category && <Chip label={document.category} color="primary" size="small" />}
          {document?.fileSize && (
            <Chip label={formatFileSize(document.fileSize)} variant="outlined" size="small" />
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Button
          variant={editMode ? "contained" : "outlined"}
          startIcon={<EditIcon />}
          onClick={() => setEditMode(!editMode)}
          color="primary"
        >
          {editMode ? 'View Mode' : 'Edit Mode'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<OpenIcon />}
          onClick={handleViewInNewTab}
        >
          Open in New Tab
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Document Viewer - Show editor or viewer based on mode */}
      {editMode ? (
        <EnhancedDocumentEditor
          documentId={documentId}
          content={htmlContent}
          onContentChange={(newContent) => setContent(newContent)}
          readOnly={false}
        />
      ) : (
        renderInlineViewer()
      )}
    </Paper>
  );
};

export default DocumentViewer;