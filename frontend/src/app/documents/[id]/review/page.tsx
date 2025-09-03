'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '../../../../lib/authTokenService';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
  Drawer
} from '@mui/material';
import {
  ArrowBack,
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Description as DocumentIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';

interface CRMComment {
  id?: string;
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  commentType: string;
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution?: string;
  originatorJustification?: string;
}

const DocumentReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [comments, setComments] = useState<CRMComment[]>([]);
  const [documentData, setDocumentData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(true);
  const [token, setToken] = useState<string>('');
  const [currentComment, setCurrentComment] = useState<CRMComment>({
    component: '',
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    commentType: 'S',
    page: '',
    paragraphNumber: '',
    lineNumber: '',
    coordinatorComment: '',
    changeFrom: '',
    changeTo: '',
    coordinatorJustification: ''
  });

  useEffect(() => {
    // Fetch document using authenticated service
    const fetchDocument = async () => {
      try {
        const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Extract the actual document from the response
          const doc = data.document || data;
          setDocumentData(doc);
          
          // Try multiple places for content
          let content = '';
          if (doc.customFields?.content) {
            content = doc.customFields.content;
          } else if (doc.content) {
            content = doc.content;
          } else if (doc.description) {
            // Use description as fallback
            content = `<p>${doc.description}</p>`;
          }
          
          // If still no content, create some default content
          if (!content && doc.title) {
            content = `
              <h1>${doc.title}</h1>
              <p>Document ID: ${doc.id}</p>
              <p>Category: ${doc.category || 'Not specified'}</p>
              <p>Status: ${doc.status}</p>
              <p>Created: ${new Date(doc.createdAt).toLocaleDateString()}</p>
              <hr/>
              <p><em>This document does not have any content stored in the database.</em></p>
            `;
          }
          
          setDocumentContent(content);
        } else {
          console.error('Failed to fetch document');
          if (response.status === 401) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };
    
    fetchDocument();
  }, [documentId, router]);

  const handleAddComment = () => {
    if (!currentComment.component || !currentComment.commentType) {
      alert('Please fill in required fields: Component and Comment Type');
      return;
    }
    
    setComments([...comments, { ...currentComment, id: Date.now().toString() }]);
    
    // Reset form
    setCurrentComment({
      component: '',
      pocName: '',
      pocPhone: '',
      pocEmail: '',
      commentType: 'S',
      page: '',
      paragraphNumber: '',
      lineNumber: '',
      coordinatorComment: '',
      changeFrom: '',
      changeTo: '',
      coordinatorJustification: ''
    });
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };

  const handleSubmit = async () => {
    if (comments.length === 0) {
      alert('Please add at least one comment before submitting');
      return;
    }

    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          comments,
          userRole: 'coordinator',
          documentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`CRM Feedback submitted successfully! ${data.hasCritical ? '⚠️ Critical comments detected' : ''}`);
        router.push(`/documents/${documentId}`);
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch(type) {
      case 'C': return 'error';
      case 'M': return 'warning';
      case 'S': return 'info';
      case 'A': return 'success';
      default: return 'default';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch(type) {
      case 'C': return 'Critical';
      case 'M': return 'Major';
      case 'S': return 'Substantive';
      case 'A': return 'Administrative';
      default: return type;
    }
  };

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push(`/documents/${documentId}`)}>
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Review: {documentData?.title || 'Loading...'}
          </Typography>
          <Badge badgeContent={comments.length} color="error" sx={{ mr: 2 }}>
            <CommentIcon />
          </Badge>
          <Button 
            color="inherit" 
            variant="outlined"
            onClick={handleSubmit}
            disabled={comments.length === 0}
            startIcon={<SendIcon />}
          >
            Submit {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Side: Document Viewer */}
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
                
                {/* Document Content */}
                {documentContent ? (
                  <Box 
                    dangerouslySetInnerHTML={{ __html: documentContent }}
                    sx={{
                      '& h1': { fontSize: '2rem', fontWeight: 'bold', mb: 2, mt: 3, color: 'primary.main' },
                      '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mb: 1.5, mt: 2.5 },
                      '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mb: 1, mt: 2 },
                      '& p': { mb: 1.5, lineHeight: 1.7 },
                      '& ul, & ol': { mb: 1.5, pl: 3 },
                      '& li': { mb: 0.5 },
                      '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
                      '& th, & td': { border: '1px solid #ddd', padding: '8px' },
                      '& th': { bgcolor: 'grey.100', fontWeight: 'bold' }
                    }}
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
                      onClick={async () => {
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
                      }}
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

        {/* Right Side: CRM Feedback Form */}
        <Box sx={{ width: '600px', overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
          {/* Add Comment Form */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Add CRM Comment
              </Typography>
              <IconButton onClick={() => setShowAddForm(!showAddForm)} size="small">
                {showAddForm ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Box>
            
            {showAddForm && (
              <Grid container spacing={2}>
                {/* Column 1: Component and POC */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="primary">
                    COLUMN 1: Component & POC
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Component *"
                    value={currentComment.component}
                    onChange={(e) => setCurrentComment({ ...currentComment, component: e.target.value })}
                    placeholder="AF/A1"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="POC Name"
                    value={currentComment.pocName}
                    onChange={(e) => setCurrentComment({ ...currentComment, pocName: e.target.value })}
                    placeholder="Col Smith"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="POC Phone"
                    value={currentComment.pocPhone}
                    onChange={(e) => setCurrentComment({ ...currentComment, pocPhone: e.target.value })}
                    placeholder="555-0100"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="POC Email"
                    value={currentComment.pocEmail}
                    onChange={(e) => setCurrentComment({ ...currentComment, pocEmail: e.target.value })}
                    placeholder="smith@af.mil"
                  />
                </Grid>

                {/* Column 2: Comment Type */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="primary">
                    COLUMN 2: Comment Type
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Type *</InputLabel>
                    <Select
                      value={currentComment.commentType}
                      onChange={(e) => setCurrentComment({ ...currentComment, commentType: e.target.value })}
                      label="Type *"
                    >
                      <MenuItem value="C">🔴 Critical (Non-concur if not resolved)</MenuItem>
                      <MenuItem value="M">🟠 Major (Significant issue)</MenuItem>
                      <MenuItem value="S">🔵 Substantive (Important)</MenuItem>
                      <MenuItem value="A">🟢 Administrative (Minor)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Columns 3-5: Location */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="primary">
                    COLUMNS 3-5: Location in Document
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Page"
                    value={currentComment.page}
                    onChange={(e) => setCurrentComment({ ...currentComment, page: e.target.value })}
                    placeholder="12"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Paragraph"
                    value={currentComment.paragraphNumber}
                    onChange={(e) => setCurrentComment({ ...currentComment, paragraphNumber: e.target.value })}
                    placeholder="3.2.1"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Line"
                    value={currentComment.lineNumber}
                    onChange={(e) => setCurrentComment({ ...currentComment, lineNumber: e.target.value })}
                    placeholder="15-18"
                  />
                </Grid>

                {/* Column 6: Comments */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="primary">
                    COLUMN 6: Comments & Justification
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Comment/Issue"
                    value={currentComment.coordinatorComment}
                    onChange={(e) => setCurrentComment({ ...currentComment, coordinatorComment: e.target.value })}
                    placeholder="Describe the issue..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Change From"
                    value={currentComment.changeFrom}
                    onChange={(e) => setCurrentComment({ ...currentComment, changeFrom: e.target.value })}
                    placeholder="Current text..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Change To"
                    value={currentComment.changeTo}
                    onChange={(e) => setCurrentComment({ ...currentComment, changeTo: e.target.value })}
                    placeholder="Suggested text..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Justification"
                    value={currentComment.coordinatorJustification}
                    onChange={(e) => setCurrentComment({ ...currentComment, coordinatorJustification: e.target.value })}
                    placeholder="Why this change is needed..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={handleAddComment}
                  >
                    Add to Comment Matrix
                  </Button>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Comments List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Comment Matrix ({comments.length})
            </Typography>
            
            {comments.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No comments added yet. Add your first comment above.
              </Box>
            ) : (
              <List>
                {comments.map((comment, index) => (
                  <ListItem
                    key={comment.id}
                    sx={{ 
                      mb: 1, 
                      border: 1, 
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'block',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        #{index + 1} - {comment.component}
                      </Typography>
                      <Chip 
                        label={getCommentTypeLabel(comment.commentType)}
                        color={getCommentTypeColor(comment.commentType) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteComment(comment.id!)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" gutterBottom>
                      📍 Page {comment.page || '-'}, Para {comment.paragraphNumber || '-'}, Line {comment.lineNumber || '-'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {comment.coordinatorComment}
                    </Typography>
                    
                    {comment.changeFrom && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="caption">From: {comment.changeFrom}</Typography>
                      </Box>
                    )}
                    
                    {comment.changeTo && (
                      <Box sx={{ mt: 0.5, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="caption">To: {comment.changeTo}</Typography>
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            )}

            {/* Critical Warning */}
            {comments.some(c => c.commentType === 'C') && (
              <Alert severity="error" sx={{ mt: 2 }}>
                ⚠️ Critical comments will result in NON-CONCUR if not resolved
              </Alert>
            )}
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default DocumentReviewPage;