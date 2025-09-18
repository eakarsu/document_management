'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '../../../../lib/authTokenService';
import DocumentNumbering from '../../../../components/DocumentNumbering';
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
  Drawer,
  FormGroup,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
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
  ExpandLess as CollapseIcon,
  FormatListNumbered
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
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [mergeResult, setMergeResult] = useState<string>('');
  const [selectedComment, setSelectedComment] = useState<CRMComment | null>(null);
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
          
          // Try multiple places for content - use editableContent to avoid header
          let content = '';
          if (doc.customFields?.editableContent) {
            // Use editable content (has styles but no header)
            content = doc.customFields.editableContent;
          } else if (doc.customFields?.htmlContent) {
            // Fallback to full HTML if no editableContent
            content = doc.customFields.htmlContent;
          } else if (doc.customFields?.content) {
            // Fallback to plain text content (no styles)
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
          
          // Load draft feedback from database only
          if (doc.customFields && typeof doc.customFields === 'object') {
            const customFields = doc.customFields as any;
            if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              setComments(customFields.draftFeedback);
              console.log('Loaded', customFields.draftFeedback.length, 'draft comments from database');
            } else {
              console.log('No draft feedback found in database');
            }
          }
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

  const handleEditComment = (comment: CRMComment) => {
    setCurrentComment(comment);
    setSelectedComment(comment);
    setShowAddForm(true);
  };

  // Merge mode functionality removed - no longer needed for Review & CRM page

  // handleMergeFeedback function removed - merge functionality no longer needed in Review & CRM page


  const handleAddComment = async () => {
    if (!currentComment.component || !currentComment.commentType) {
      alert('Please fill in required fields: Component and Comment Type');
      return;
    }
    
    // Add new comment
    const newComment = { ...currentComment, id: Date.now().toString() };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    
    // Save directly to database only (no localStorage)
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            draftFeedback: updatedComments,
            lastDraftUpdate: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('Draft feedback saved to database');
      } else {
        console.error('Failed to save feedback to database');
        alert('Failed to save feedback to database');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Error saving feedback to database');
    }
    
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

  const handleSubmitFeedbackToOPR = async () => {
    if (comments.length === 0) {
      alert('Please add at least one comment before submitting');
      return;
    }

    try {
      // First, save the feedback to the comment matrix
      const patchResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            commentMatrix: comments,
            lastCommentUpdate: new Date().toISOString()
          }
        })
      });

      if (!patchResponse.ok) {
        alert('Failed to save feedback');
        return;
      }

      // Find active workflow task for this user
      const taskResponse = await authTokenService.authenticatedFetch(`/api/workflow-instances/${documentId}`);
      if (taskResponse.ok) {
        const workflowData = await taskResponse.json();

        // Find the active task for the current user
        const activeTask = workflowData.activeTasks?.find((task: any) =>
          task.status === 'active' || task.status === 'pending'
        );

        if (activeTask) {
          // Complete the task
          const completeResponse = await authTokenService.authenticatedFetch(
            `/api/workflow-instances/${documentId}/tasks/${activeTask.id}/complete`,
            {
              method: 'POST',
              body: JSON.stringify({
                decision: 'approved',
                comments: `Submitted ${comments.length} feedback item(s) for OPR review`
              })
            }
          );

          if (completeResponse.ok) {
            alert('Feedback successfully submitted to OPR!');
            router.push('/dashboard');
          } else {
            alert('Feedback saved but could not complete workflow task');
            router.push('/dashboard');
          }
        } else {
          alert('Feedback saved successfully!');
          router.push('/dashboard');
        }
      } else {
        alert('Feedback saved successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback to OPR');
    }
  };

  const handleDeleteComment = async (id: string) => {
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);
    
    // Update database only (no localStorage)
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            draftFeedback: updatedComments,
            lastDraftUpdate: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        console.log('Comment deleted from database');
      } else {
        console.error('Failed to delete comment from database');
        alert('Failed to delete comment from database');
      }
    } catch (error) {
      console.error('Error updating database:', error);
      alert('Error deleting comment');
    }
  };

  // Removed handleSubmit - using handleSubmitFeedbackToOPR instead

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
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
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
            onClick={handleSubmitFeedbackToOPR}
            disabled={comments.length === 0}
            startIcon={<SendIcon />}
          >
            Submit Feedback to OPR
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
          <Paper sx={{ p: 2, mb: 2, border: selectedComment ? 2 : 1, borderColor: selectedComment ? 'primary.main' : 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1, color: selectedComment ? 'primary.main' : 'text.primary' }}>
                {selectedComment ? 'Selected Feedback Details' : 'Add CRM Comment'}
              </Typography>
              <IconButton onClick={() => setShowAddForm(!showAddForm)} size="small">
                {showAddForm ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Box>
            
            {showAddForm && (
              <Grid container spacing={2}>
                {/* Show selected feedback details if any */}
                {selectedComment && (
                  <>
                    <Grid item xs={12}>
                      <Box sx={{ p: 1.5, bgcolor: 'blue.50', borderRadius: 1, border: 1, borderColor: 'blue.200', mb: 2 }}>
                        <Typography variant="caption" color="primary" fontWeight="bold">Current Selection:</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {selectedComment.component} - {selectedComment.coordinatorComment}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
                
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
          <Paper sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Comment Matrix ({comments.length})
            </Typography>
            
            {comments.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No comments added yet. Add your first comment above.
              </Box>
            ) : (
              <List sx={{ pt: 0 }}>
                {comments.map((comment, index) => (
                    <ListItem
                      key={comment.id}
                      sx={{ 
                        mb: 1, 
                        border: 1, 
                        borderColor: comment.commentType === 'C' ? 'error.main' : 'divider',
                        borderRadius: 1,
                        display: 'block',
                        p: 0,
                        bgcolor: comment.commentType === 'C' ? 'error.50' : 'background.paper',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                    >
                      {/* Header - Always Visible */}
                      <Box 
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'grey.50'
                          }
                        }}
                        onClick={() => handleEditComment(comment)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold', ml: 2 }}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComment(comment.id!);
                            }}
                            title="Delete Comment"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        {/* Summary Line - Always Visible */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, ml: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            📍 Page {comment.page || '-'}, Para {comment.paragraphNumber || '-'}, Line {comment.lineNumber || '-'}
                          </Typography>
                          {comment.coordinatorComment && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                flexGrow: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'text.secondary',
                                fontStyle: 'italic'
                              }}
                            >
                              {comment.coordinatorComment}
                            </Typography>
                          )}
                        </Box>
                      </Box>
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

      {/* Merge Result Dialog removed - merge functionality no longer needed */}
    </>
  );
};

export default DocumentReviewPage;