import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DocumentNumbering from '../DocumentNumbering';
import { DocumentData } from './types';

interface DocumentViewerProps {
  documentData: DocumentData | null;
  isEditingDocument: boolean;
  editableContent: string;
  documentContent: string;
  showLineNumbers: boolean;
  showPageNumbers: boolean;
  onContentChange: (content: string) => void;
  onLineNumbersToggle: (show: boolean) => void;
  onPageNumbersToggle: (show: boolean) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentData,
  isEditingDocument,
  editableContent,
  documentContent,
  showLineNumbers,
  showPageNumbers,
  onContentChange,
  onLineNumbersToggle,
  onPageNumbersToggle,
}) => {
  const generateTOC = () => {
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

    onContentChange(toc + editableContent);
  };

  const numberChapters = () => {
    let content = editableContent;

    let chapterNum = 0;
    content = content.replace(/<h1>(?!Chapter \d+:)(.*?)<\/h1>/gi, (match, title) => {
      chapterNum++;
      return `<h1>Chapter ${chapterNum}: ${title}</h1>`;
    });

    let sectionNum = 0;
    let currentChapter = 0;
    content = content.replace(/<h([1-2])>(.*?)<\/h\1>/gi, (match, level, title) => {
      if (level === '1') {
        currentChapter++;
        sectionNum = 0;
        return match;
      } else if (level === '2' && !title.match(/^\d+\.\d+/)) {
        sectionNum++;
        return `<h2>${currentChapter}.${sectionNum} ${title}</h2>`;
      }
      return match;
    });

    onContentChange(content);
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

    if (editableContent.trim() && !confirm('This will replace the current content with a standard document template. Continue?')) {
      return;
    }
    onContentChange(structure);
  };

  const addPageBreaks = () => {
    let content = editableContent;
    let isFirst = true;
    content = content.replace(/<h1>/gi, (match) => {
      if (isFirst) {
        isFirst = false;
        return match;
      }
      return '<div style="page-break-before: always;"></div>' + match;
    });
    onContentChange(content);
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
                  <Typography variant="body2">{(documentData as any).category || 'Not specified'}</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="caption" color="text.secondary">Version:</Typography>
                  <Typography variant="body2">{(documentData as any).currentVersion || '1'}</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="caption" color="text.secondary">Status:</Typography>
                  <Typography variant="body2">{(documentData as any).status}</Typography>
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
                        onChange={(e) => onLineNumbersToggle(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Line Numbers"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showPageNumbers}
                        onChange={(e) => onPageNumbersToggle(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Page Numbers"
                  />
                </FormGroup>
              </Box>
            )}

            {/* Render formatted header if exists */}
            {!isEditingDocument && documentData?.customFields?.headerHtml && (
              <Box
                sx={{ mb: 3 }}
                dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
              />
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
                    onClick={generateTOC}
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
                  onChange={(e) => onContentChange(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      '& textarea': {
                        minHeight: '500px',
                      },
                    },
                  }}
                />
              </>
            ) : (
              <>
                {/* Display formatted header if available */}
                {documentData?.customFields?.headerHtml && (
                  <>
                    {/* Extract and apply styles from headerHtml */}
                    {(() => {
                      const styleMatch = documentData.customFields.headerHtml.match(/<style>([\s\S]*?)<\/style>/);
                      if (styleMatch) {
                        return <style dangerouslySetInnerHTML={{ __html: styleMatch[1] }} />;
                      }
                      return null;
                    })()}

                    {/* Display the header */}
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
                      dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
                    />
                  </>
                )}

                {/* Display document content with line/page numbers */}
                <DocumentNumbering
                  content={documentContent || editableContent}
                  enableLineNumbers={showLineNumbers}
                  enablePageNumbers={showPageNumbers}
                />
              </>
            )}
          </>
        ) : (
          <Typography color="text.secondary">Loading document...</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentViewer;