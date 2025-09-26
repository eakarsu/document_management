import React from 'react';
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
import { DocumentData } from './types';
import { handleDocumentDownload } from './utils';

interface DocumentViewerProps {
  documentData: DocumentData | null;
  documentContent: string;
  showLineNumbers: boolean;
  showPageNumbers: boolean;
  onToggleLineNumbers: (checked: boolean) => void;
  onTogglePageNumbers: (checked: boolean) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentData,
  documentContent,
  showLineNumbers,
  showPageNumbers,
  onToggleLineNumbers,
  onTogglePageNumbers
}) => {
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

            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Document Numbering for Feedback Reference:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLineNumbers}
                      onChange={(e) => onToggleLineNumbers(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Line Numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPageNumbers}
                      onChange={(e) => onTogglePageNumbers(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Page Numbers"
                />
              </FormGroup>
            </Box>

            {documentData?.customFields?.headerHtml && (
              <Box
                sx={{ mb: 3 }}
                dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
              />
            )}

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
                  onClick={() => handleDocumentDownload(documentData.id, documentData)}
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