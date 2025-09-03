'use client';

import React, { useState } from 'react';
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
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { api } from '../lib/api';

interface DocumentViewerProps {
  documentId: string;
  document: {
    title: string;
    mimeType: string;
    category: string;
    fileSize?: number;
    content?: string;
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

  // Use content directly from props if available
  const htmlContent = document?.content || '';
  
  // Add visible debug info
  if (typeof window !== 'undefined') {
    console.log('🔵 DocumentViewer mounted with props:', { 
      documentId, 
      hasDocument: !!document,
      documentTitle: document?.title,
      contentLength: htmlContent?.length || 0,
      contentPreview: htmlContent?.substring(0, 200),
      contentType: typeof htmlContent
    });
  }

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

    if (!htmlContent) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No content available for this document
          </Typography>
        </Box>
      );
    }

    // Parse HTML to extract just the content
    const extractContent = (html: string) => {
      // Extract content between body tags or use full HTML
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
      return html;
    };

    // Render the HTML content directly in the component
    return (
      <Box 
        sx={{ 
          width: '100%', 
          minHeight: '600px', 
          border: '1px solid #ddd', 
          borderRadius: 1,
          p: 3,
          backgroundColor: '#fff',
          overflowY: 'auto',
          maxHeight: '800px',
          '& h1': { fontSize: '2rem', fontWeight: 'bold', mb: 2, color: '#1976d2' },
          '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mt: 2, mb: 1, color: '#1565c0' },
          '& h3': { fontSize: '1.2rem', fontWeight: 'bold', mt: 1.5, mb: 1 },
          '& p': { mb: 1.5, lineHeight: 1.6 },
          '& ul, & ol': { ml: 3, mb: 1.5 },
          '& li': { mb: 0.5 },
          '& hr': { my: 2 }
        }}
        dangerouslySetInnerHTML={{ __html: extractContent(htmlContent) }}
      />
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
      {/* Debug Info - TEMPORARY */}
      <Box sx={{ p: 2, mb: 2, bgcolor: '#ffecb3', borderRadius: 1, border: '2px solid #ffa726' }}>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
          🔍 DEBUG: Content available = {htmlContent ? `YES (${htmlContent.length} chars)` : 'NO'}
          {'\n'}First 100 chars: {htmlContent?.substring(0, 100) || 'EMPTY'}
        </Typography>
      </Box>
      
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

      {/* Document Viewer - Always show inline */}
      {renderInlineViewer()}
    </Paper>
  );
};

export default DocumentViewer;