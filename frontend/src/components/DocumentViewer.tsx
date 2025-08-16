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
  };
  onDownload?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentId, 
  document, 
  onDownload 
}) => {
  const [viewMode, setViewMode] = useState<'info' | 'inline' | 'popup'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string>('');

  // Generate authenticated view URL when needed
  React.useEffect(() => {
    if (viewMode === 'inline' && canViewInline(document.mimeType)) {
      const loadViewUrl = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch the document content through our API
          const response = await api.get(`/api/documents/${documentId}/view`);
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setViewUrl(url);
          } else {
            setError('Failed to load document for preview');
          }
        } catch (err) {
          setError('Failed to load document for preview');
        } finally {
          setLoading(false);
        }
      };
      loadViewUrl();
    }
    
    // Cleanup blob URL when component unmounts or URL changes
    return () => {
      if (viewUrl && viewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(viewUrl);
      }
    };
  }, [viewMode, documentId, document.mimeType]);

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
    setViewMode('inline');
    setError(null);
  };

  const handleViewInNewTab = async () => {
    if (shouldAutoDownload(document.mimeType)) {
      // For Office documents and other files that need external applications,
      // trigger a download instead of trying to view in browser
      handleDownload();
    } else {
      setLoading(true);
      try {
        const viewUrl = await getAuthenticatedUrl(`/api/documents/${documentId}/view`);
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
        link.download = document.title;
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
    if (!canViewInline(document.mimeType)) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          This file type cannot be previewed inline. Use "Open in New Tab" to view in your browser or download the file.
        </Alert>
      );
    }

    if (!viewUrl && viewMode === 'inline') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: 1 }}>
        {document.mimeType.startsWith('image/') ? (
          <img 
            src={viewUrl}
            alt={document.title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              background: '#f5f5f5'
            }}
            onError={() => setError('Failed to load image')}
          />
        ) : (
          <iframe
            src={viewUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: 4 }}
            title={document.title}
            onError={() => setError('Failed to load document')}
          />
        )}
      </Box>
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Document Info Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {document.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Chip label={document.category} color="primary" size="small" />
          <Chip label={document.mimeType} variant="outlined" size="small" />
          {document.fileSize && (
            <Chip label={formatFileSize(document.fileSize)} variant="outlined" size="small" />
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {canViewInline(document.mimeType) && (
          <Button
            variant={viewMode === 'inline' ? 'contained' : 'outlined'}
            startIcon={<ViewIcon />}
            onClick={handleViewInline}
            disabled={loading}
          >
            Preview Here
          </Button>
        )}
        
        <Button
          variant="outlined"
          startIcon={shouldAutoDownload(document.mimeType) ? <DownloadIcon /> : <OpenIcon />}
          onClick={handleViewInNewTab}
          disabled={loading}
        >
          {shouldAutoDownload(document.mimeType) ? 'Download & Open' : 'Open in New Tab'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading}
        >
          Download
        </Button>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Document Viewer */}
      {viewMode === 'inline' && !loading && !error && renderInlineViewer()}

      {/* Default Info View */}
      {viewMode === 'info' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {canViewInline(document.mimeType) ? (
            <Typography color="text.secondary" gutterBottom>
              Click "Preview Here" to view this document inline, or "Open in New Tab" to view in your browser.
            </Typography>
          ) : shouldAutoDownload(document.mimeType) ? (
            <Typography color="text.secondary" gutterBottom>
              This {document.mimeType.includes('excel') || document.mimeType.includes('spreadsheet') ? 'Excel' : 
                     document.mimeType.includes('word') || document.mimeType.includes('wordprocessing') ? 'Word' :
                     document.mimeType.includes('powerpoint') || document.mimeType.includes('presentation') ? 'PowerPoint' : 'Office'} 
              {' '}document will be downloaded to your computer. You can then double-click it to open with the appropriate application.
            </Typography>
          ) : (
            <Typography color="text.secondary" gutterBottom>
              This file type cannot be previewed in the browser. Click "Download" to save it locally.
            </Typography>
          )}
          
          {shouldAutoDownload(document.mimeType) && (
            <Typography variant="body2" color="primary" sx={{ mt: 2, fontStyle: 'italic' }}>
              💡 Click "Download & Open" to save the file to your downloads folder. Then double-click the downloaded file to open it with
              {document.mimeType.includes('excel') || document.mimeType.includes('spreadsheet') ? ' Excel' : 
               document.mimeType.includes('word') || document.mimeType.includes('wordprocessing') ? ' Word' :
               document.mimeType.includes('powerpoint') || document.mimeType.includes('presentation') ? ' PowerPoint' : ' the appropriate application'}.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default DocumentViewer;