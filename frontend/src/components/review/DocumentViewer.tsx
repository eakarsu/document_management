'use client';

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  FormGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Description as DocumentIcon } from '@mui/icons-material';
import DocumentNumbering from '../DocumentNumbering';
import { DocumentData } from '../../types/review';
import { authTokenService } from '../../lib/authTokenService';

interface DocumentViewerProps {
  documentData: DocumentData | null;
  documentContent: string;
  documentId: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentData,
  documentContent,
  documentId
}) => {
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  const handleDownloadDocument = async () => {
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentData?.fileName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading document');
    }
  };

  return (
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

            {/* Air Force Header if exists */}
            {documentData?.customFields?.headerHtml && (
              <Box
                sx={{ mb: 3 }}
                dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
              />
            )}

            {/* Document Content with Numbering */}
            {documentContent ? (
              <DocumentNumbering
                content={documentContent}
                enableLineNumbers={showLineNumbers}
                enablePageNumbers={showPageNumbers}
                linesPerPage={50}
              />
            ) : (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No content available for this document
                </Typography>
                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  onClick={handleDownloadDocument}
                >
                  Download Original File
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading document...</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentViewer;