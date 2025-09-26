import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import DocumentNumbering from '@/components/DocumentNumbering';

interface OPRDocumentEditorProps {
  documentData: any;
  editableContent: string;
  setEditableContent: (content: string) => void;
  isEditingDocument: boolean;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  showPageNumbers: boolean;
  setShowPageNumbers: (show: boolean) => void;
  loading: boolean;
}

const OPRDocumentEditor: React.FC<OPRDocumentEditorProps> = ({
  documentData,
  editableContent,
  setEditableContent,
  isEditingDocument,
  showLineNumbers,
  setShowLineNumbers,
  showPageNumbers,
  setShowPageNumbers,
  loading
}) => {
  const generateTableOfContents = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editableContent;
    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');

    let toc = '<div class="table-of-contents">\n<h2>Table of Contents</h2>\n<ul>\n';
    headers.forEach((header) => {
      const level = parseInt(header.tagName.charAt(1));
      const text = header.textContent || '';
      const indent = '  '.repeat(level - 1);
      toc += `${indent}<li>${text}</li>\n`;
    });
    toc += '</ul>\n</div>\n\n';

    setEditableContent(toc + editableContent);
  };

  const numberChapters = () => {
    let content = editableContent;

    // Add chapter numbers to H1
    let chapterNum = 0;
    content = content.replace(/<h1>(?!Chapter \d+:)(.*?)<\/h1>/gi, (match, title) => {
      chapterNum++;
      return `<h1>Chapter ${chapterNum}: ${title}</h1>`;
    });

    // Add section numbers to H2
    let sectionNum = 0;
    let currentChapter = 0;
    content = content.replace(/<h([1-2])>(.*?)<\/h\1>/gi, (match, level, title) => {
      if (level === '1') {
        currentChapter++;
        sectionNum = 0;
        return match; // Already processed H1s
      } else if (level === '2' && !title.match(/^\d+\.\d+/)) {
        sectionNum++;
        return `<h2>${currentChapter}.${sectionNum} ${title}</h2>`;
      }
      return match;
    });

    setEditableContent(content);
  };

  const applyDocumentTemplate = () => {
    const structure = `<h1>Executive Summary</h1>
<p>[Provide a brief overview of the document]</p>

<h1>Chapter 1: Introduction</h1>
<p>[Introduction content]</p>

<h2>1.1 Background</h2>
<p>[Background information]</p>

<h2>1.2 Objectives</h2>
<p>[Document objectives]</p>

<h2>1.3 Scope</h2>
<p>[Scope of the document]</p>

<h1>Chapter 2: Main Content</h1>
<p>[Main content goes here]</p>

<h2>2.1 Section One</h2>
<p>[Section content]</p>

<h2>2.2 Section Two</h2>
<p>[Section content]</p>

<h1>Chapter 3: Conclusion</h1>
<p>[Conclusions and recommendations]</p>

<h1>References</h1>
<p>[List of references]</p>

<h1>Appendices</h1>
<p>[Additional materials]</p>`;

    // Ask user if they want to replace or append
    if (editableContent.trim() && !confirm('This will replace the current content with a standard document template. Continue?')) {
      return;
    }
    setEditableContent(structure);
  };

  const addPageBreaks = () => {
    let content = editableContent;
    // Add page break before each H1 (except the first)
    let isFirst = true;
    content = content.replace(/<h1>/gi, (match) => {
      if (isFirst) {
        isFirst = false;
        return match;
      }
      return '<div style="page-break-before: always;"></div>' + match;
    });
    setEditableContent(content);
  };

  if (loading || !documentData) {
    return (
      <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Paper sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)' }}>
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Loading document...</Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Paper sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)' }}>
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
          <>
            {/* Document Tools for Edit Mode */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={generateTableOfContents}
              >
                Generate TOC
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={numberChapters}
              >
                Number Chapters
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={applyDocumentTemplate}
              >
                Document Template
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={addPageBreaks}
              >
                Add Page Breaks
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </>
        ) : (
          <>
            {/* Display Air Force header if it exists */}
            {documentData?.customFields?.headerHtml && (
              <Box
                sx={{ mb: 3 }}
                dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
              />
            )}

            <DocumentNumbering
              content={editableContent}
              enableLineNumbers={showLineNumbers}
              enablePageNumbers={showPageNumbers}
              linesPerPage={50}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default OPRDocumentEditor;