'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Select
} from '@mui/material';
import {
  ArrowBack,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon
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

const CRMFeedbackPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [comments, setComments] = useState<CRMComment[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [userRole, setUserRole] = useState('coordinator');
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
    // Fetch document details
    fetch(`/api/documents/${documentId}`)
      .then(res => res.json())
      .then(data => {
        setDocumentTitle(data.title || 'Document');
      })
      .catch(err => console.error('Error fetching document:', err));
  }, [documentId]);

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
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to submit feedback');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/documents/${documentId}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comments,
          userRole,
          documentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`CRM Feedback submitted successfully! ${data.hasCritical ? '⚠️ Critical comments detected - requires attention' : ''}`);
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
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push(`/documents/${documentId}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CRM Feedback Form - {documentTitle}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Add Comment Form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Add CRM Comment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in all 7 columns of the Air Force Comment Resolution Matrix
          </Typography>

          <Grid container spacing={3}>
            {/* Column 1: Component and POC */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Column 1: Component and POC Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Component *"
                value={currentComment.component}
                onChange={(e) => setCurrentComment({ ...currentComment, component: e.target.value })}
                placeholder="AF/A1 Personnel"
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="POC Name"
                value={currentComment.pocName}
                onChange={(e) => setCurrentComment({ ...currentComment, pocName: e.target.value })}
                placeholder="Col Smith"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="POC Phone"
                value={currentComment.pocPhone}
                onChange={(e) => setCurrentComment({ ...currentComment, pocPhone: e.target.value })}
                placeholder="555-0100"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="POC Email"
                value={currentComment.pocEmail}
                onChange={(e) => setCurrentComment({ ...currentComment, pocEmail: e.target.value })}
                placeholder="smith@af.mil"
              />
            </Grid>

            {/* Column 2: Comment Type */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Column 2: Comment Type
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Comment Type *</InputLabel>
                <Select
                  value={currentComment.commentType}
                  onChange={(e) => setCurrentComment({ ...currentComment, commentType: e.target.value })}
                  label="Comment Type *"
                >
                  <MenuItem value="C">
                    <Chip label="Critical" color="error" size="small" sx={{ mr: 1 }} />
                    Non-concur if not addressed
                  </MenuItem>
                  <MenuItem value="M">
                    <Chip label="Major" color="warning" size="small" sx={{ mr: 1 }} />
                    Significant issue
                  </MenuItem>
                  <MenuItem value="S">
                    <Chip label="Substantive" color="info" size="small" sx={{ mr: 1 }} />
                    Important suggestion
                  </MenuItem>
                  <MenuItem value="A">
                    <Chip label="Administrative" color="success" size="small" sx={{ mr: 1 }} />
                    Minor correction
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Columns 3-5: Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Columns 3-5: Document Location
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Page Number (Column 3)"
                value={currentComment.page}
                onChange={(e) => setCurrentComment({ ...currentComment, page: e.target.value })}
                placeholder="12"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Paragraph Number (Column 4)"
                value={currentComment.paragraphNumber}
                onChange={(e) => setCurrentComment({ ...currentComment, paragraphNumber: e.target.value })}
                placeholder="3.2.1"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Line Number (Column 5)"
                value={currentComment.lineNumber}
                onChange={(e) => setCurrentComment({ ...currentComment, lineNumber: e.target.value })}
                placeholder="15-18"
              />
            </Grid>

            {/* Column 6: Comments and Justification */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Column 6: Comments and Justification
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comment/Issue Description"
                value={currentComment.coordinatorComment}
                onChange={(e) => setCurrentComment({ ...currentComment, coordinatorComment: e.target.value })}
                placeholder="Describe the issue or concern in detail"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Change From (Current Text)"
                value={currentComment.changeFrom}
                onChange={(e) => setCurrentComment({ ...currentComment, changeFrom: e.target.value })}
                placeholder="Quote the current text that needs changing"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Change To (Suggested Text)"
                value={currentComment.changeTo}
                onChange={(e) => setCurrentComment({ ...currentComment, changeTo: e.target.value })}
                placeholder="Provide the suggested replacement text"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Coordinator Justification"
                value={currentComment.coordinatorJustification}
                onChange={(e) => setCurrentComment({ ...currentComment, coordinatorJustification: e.target.value })}
                placeholder="Explain why this change is necessary (cite regulations, policies, etc.)"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddComment}
                fullWidth
              >
                Add Comment to Matrix
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Comments Table */}
        {comments.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              CRM Comments ({comments.length})
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Col 1: Component/POC</TableCell>
                    <TableCell>Col 2: Type</TableCell>
                    <TableCell>Col 3-5: Location</TableCell>
                    <TableCell>Col 6: Comment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {comment.component}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {comment.pocName}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {comment.pocPhone}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {comment.pocEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getCommentTypeLabel(comment.commentType)}
                          color={getCommentTypeColor(comment.commentType) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          Page: {comment.page || '-'}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Para: {comment.paragraphNumber || '-'}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Line: {comment.lineNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" gutterBottom>
                          {comment.coordinatorComment}
                        </Typography>
                        {comment.changeFrom && (
                          <Typography variant="caption" display="block" color="error">
                            From: {comment.changeFrom}
                          </Typography>
                        )}
                        {comment.changeTo && (
                          <Typography variant="caption" display="block" color="success">
                            To: {comment.changeTo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteComment(comment.id!)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.push(`/documents/${documentId}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
              >
                Submit CRM Feedback
              </Button>
            </Box>
          </Paper>
        )}

        {/* Warning for Critical Comments */}
        {comments.some(c => c.commentType === 'C') && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ Critical Comment(s) Detected
            </Typography>
            <Typography variant="body2">
              This document contains one or more CRITICAL comments. Per Air Force guidelines, 
              critical comments that are not resolved will result in automatic NON-CONCUR status.
            </Typography>
          </Alert>
        )}
      </Container>
    </>
  );
};

export default CRMFeedbackPage;