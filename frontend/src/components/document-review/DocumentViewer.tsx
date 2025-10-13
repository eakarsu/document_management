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
  onTextSelected?: (selectedText: string, location: string, pageNumber?: string, paragraphNumber?: string, lineNumber?: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentData,
  documentContent,
  showLineNumbers,
  showPageNumbers,
  onToggleLineNumbers,
  onTogglePageNumbers,
  onTextSelected
}) => {
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && onTextSelected) {
      // Try to find line/page/paragraph context
      let location = '';
      let pageNumber = '';
      let paragraphNumber = '';
      let lineNumber = '';

      if (showLineNumbers || showPageNumbers) {
        // Get the selected range
        const range = selection?.getRangeAt(0);
        const container = range?.commonAncestorContainer;

        // Try to find parent element with line/page/paragraph number
        let element = container?.nodeType === 3 ? container.parentElement : container as HTMLElement;

        while (element && element.tagName !== 'BODY') {
          const lineNum = element.getAttribute('data-line-number');
          const pageNum = element.getAttribute('data-page-number');
          const paraNum = element.getAttribute('data-paragraph-number');

          if (lineNum || pageNum || paraNum) {
            if (showLineNumbers && lineNum) {
              location = `Line ${lineNum}`;
              lineNumber = lineNum;
            }
            if (showPageNumbers && pageNum) {
              location = location ? `${location}, Page ${pageNum}` : `Page ${pageNum}`;
              pageNumber = pageNum;
            }
            if (paraNum) {
              paragraphNumber = paraNum;
            }
            break;
          }
          element = element.parentElement as HTMLElement;
        }
      }

      // If page number not found from attributes, try to estimate from content
      if (!pageNumber && documentContent) {
        // Estimate page based on content length (rough estimate: 3000 chars per page)
        const textBeforeSelection = documentContent.substring(0, documentContent.indexOf(selectedText));
        const estimatedPage = Math.floor(textBeforeSelection.length / 3000) + 1;
        pageNumber = estimatedPage.toString();
      }

      // If line number not found from attributes, estimate from newlines
      if (!lineNumber && documentContent && selectedText) {
        const textBeforeSelection = documentContent.substring(0, documentContent.indexOf(selectedText));
        const estimatedLine = (textBeforeSelection.match(/\n/g) || []).length + 1;
        lineNumber = estimatedLine.toString();
      }

      // Try to find paragraph number from the selected text context
      if (!paragraphNumber) {
        // Look for common paragraph numbering patterns (e.g., "1.", "1.1", "1.1.1", etc.)
        const textBefore = documentContent?.substring(0, documentContent.indexOf(selectedText)) || '';
        const paragraphMatch = textBefore.match(/(\d+(?:\.\d+)*\.?)\s*[^\d\n]*$/);
        if (paragraphMatch) {
          paragraphNumber = paragraphMatch[1].replace(/\.$/, ''); // Remove trailing dot
        }
      }

      if (!location) {
        location = pageNumber ? `Page ${pageNumber}` : 'See selected text in document';
        if (lineNumber) {
          location = `Line ${lineNumber}${pageNumber ? ', Page ' + pageNumber : ''}`;
        }
      }

      onTextSelected(selectedText, location, pageNumber, paragraphNumber, lineNumber);
    }
  };

  return (
    <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Paper
        sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)', userSelect: 'text' }}
        onMouseUp={handleTextSelection}
      >
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