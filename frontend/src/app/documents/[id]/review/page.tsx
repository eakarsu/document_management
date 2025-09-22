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
  CircularProgress,
  Checkbox
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
  FormatListNumbered,
  AutoAwesome as GenerateAIIcon,
  CheckBox as CheckboxIcon,
  Clear as ClearIcon
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
  selected?: boolean;
  status?: string;
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
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  const [isAIGeneratedDoc, setIsAIGeneratedDoc] = useState(false);
  const [aiFeedbackCount, setAiFeedbackCount] = useState<number>(10);
  const [workflowStage, setWorkflowStage] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  // Set role based on login
  useEffect(() => {
    // Check localStorage for user information
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('userEmail');

    console.log('🔵 REVIEW PAGE - Checking user:', { username, userEmail });

    // Set role based on login
    if (username === 'coordinator1' || userEmail === 'coordinator1@airforce.mil' ||
        (username && username.toLowerCase().includes('coordinator')) ||
        (userEmail && userEmail.toLowerCase().includes('coordinator'))) {
      setUserRole('Coordinator');
      console.log('🔵 REVIEW PAGE - Setting role as Coordinator');
    } else if (username === 'reviewer1' || username === 'reviewer2' ||
               userEmail === 'reviewer1@airforce.mil' || userEmail === 'reviewer2@airforce.mil' ||
               (username && username.toLowerCase().includes('reviewer')) ||
               (userEmail && userEmail.toLowerCase().includes('reviewer'))) {
      setUserRole('Reviewer');
      console.log('🔵 REVIEW PAGE - Setting role as Reviewer');
    } else if (username === 'ao1' || userEmail === 'ao1@airforce.mil' ||
               (username && username.toLowerCase().includes('action'))) {
      setUserRole('ACTION_OFFICER');
      console.log('🔵 REVIEW PAGE - Setting role as Action Officer');
    } else {
      // Default to reviewer for other users
      setUserRole('Reviewer');
      console.log('🔵 REVIEW PAGE - Setting default role as Reviewer');
    }
  }, []);
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
    // Fetch workflow information
    const fetchWorkflowInfo = async () => {
      try {
        const workflowResponse = await authTokenService.authenticatedFetch(`/api/workflow-instances/${documentId}`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          // Convert to string to ensure consistent comparison
          const stageId = String(workflowData.currentStageId || '');
          setWorkflowStage(stageId);
          console.log('🔵 REVIEW PAGE - Current workflow stage:', stageId, 'Type:', typeof stageId);
          console.log('🔵 REVIEW PAGE - Full workflow data:', workflowData);
          console.log('🔵 REVIEW PAGE - Stage Order:', workflowData.stageOrder);
          console.log('🔵 REVIEW PAGE - Current Stage Name:', workflowData.currentStageName);
        } else {
          console.error('Failed to fetch workflow instance');
        }

        // Get user role from localStorage or token
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
          console.log('🔵 REVIEW PAGE - User role from localStorage:', storedRole);
        }

        // Also check for user info in localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          try {
            const userData = JSON.parse(userInfo);
            if (userData.role) {
              setUserRole(userData.role);
              console.log('🔵 REVIEW PAGE - User role from userInfo:', userData.role);
            }
          } catch (e) {
            console.log('Could not parse userInfo');
          }
        }

        // Check if user is coordinator based on email/username
        const userEmail = localStorage.getItem('userEmail');
        const username = localStorage.getItem('username');

        // Determine role based on username/email
        if (userEmail && userEmail.includes('coordinator')) {
          setUserRole('Coordinator');
          console.log('🔵 REVIEW PAGE - Detected as Coordinator from email:', userEmail);
        } else if (username && username.toLowerCase().includes('coordinator')) {
          setUserRole('Coordinator');
          console.log('🔵 REVIEW PAGE - Detected as Coordinator from username:', username);
        } else if (username === 'coordinator1' || userEmail === 'coordinator1@airforce.mil') {
          // For coordinator1 login specifically
          setUserRole('Coordinator');
          console.log('🔵 REVIEW PAGE - Setting role as Coordinator for coordinator1 login');
        } else if (userEmail && userEmail.includes('reviewer')) {
          // Set role as Reviewer for reviewer emails
          setUserRole('Reviewer');
          console.log('🔵 REVIEW PAGE - Detected as Reviewer from email:', userEmail);
        } else if (username && username.toLowerCase().includes('reviewer')) {
          // Set role as Reviewer for reviewer usernames
          setUserRole('Reviewer');
          console.log('🔵 REVIEW PAGE - Detected as Reviewer from username:', username);
        } else if (username === 'reviewer1' || username === 'reviewer2' ||
                   userEmail === 'reviewer1@airforce.mil' || userEmail === 'reviewer2@airforce.mil') {
          // For specific reviewer logins
          setUserRole('Reviewer');
          console.log('🔵 REVIEW PAGE - Setting role as Reviewer for reviewer login');
        } else {
          // Default to Reviewer if not coordinator
          setUserRole('Reviewer');
          console.log('🔵 REVIEW PAGE - Defaulting to Reviewer role');
        }
      } catch (error) {
        console.error('Error fetching workflow info:', error);
      }
    };

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
          console.log('🟢🟢🟢 REVIEW PAGE - Loading document content:', {
            hasHtmlContent: !!doc.customFields?.htmlContent,
            hasEditableContent: !!doc.customFields?.editableContent,
            htmlContentLength: doc.customFields?.htmlContent?.length,
            editableContentLength: doc.customFields?.editableContent?.length,
            htmlContentHasIntro: doc.customFields?.htmlContent?.includes('INTRODUCTION') || doc.customFields?.htmlContent?.includes('data-paragraph="0.1"'),
            editableContentHasIntro: doc.customFields?.editableContent?.includes('INTRODUCTION') || doc.customFields?.editableContent?.includes('data-paragraph="0.1"')
          });

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
          
          // Load feedback from database - prioritize AI-generated feedback for AI documents
          if (doc.customFields && typeof doc.customFields === 'object') {
            const customFields = doc.customFields as any;

            // Check if this is an AI-generated document
            if (customFields.aiGenerated || doc.category === 'AI_GENERATED') {
              setIsAIGeneratedDoc(true);
            }

            // Check for AI-generated feedback first (for AI-generated documents)
            if (customFields.crmFeedback && Array.isArray(customFields.crmFeedback)) {
              setComments(customFields.crmFeedback);
              console.log('Loaded', customFields.crmFeedback.length, 'AI-generated CRM feedback from database');
            }
            // Fallback to draft feedback
            else if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              setComments(customFields.draftFeedback);
              console.log('Loaded', customFields.draftFeedback.length, 'draft comments from database');
            } else {
              console.log('No feedback found in database');
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

    fetchWorkflowInfo();
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
    
    // Save to appropriate field based on document type
    try {
      const updateFields: any = {
        lastDraftUpdate: new Date().toISOString()
      };

      // For AI-generated documents, update crmFeedback; for others, update draftFeedback
      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = updatedComments;
        updateFields.draftFeedback = updatedComments; // Also save to draft for compatibility
      } else {
        updateFields.draftFeedback = updatedComments;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
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

  const handleSubmitForSecondCoordination = async () => {
    try {
      // Transition from Stage 4 to Stage 5
      const response = await fetch('/api/workflow-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'advance',
          workflowId: documentId,
          fromStage: '4',
          toStage: '5',
          requiredRole: 'ACTION_OFFICER'
        })
      });

      if (response.ok) {
        alert('Successfully submitted for second coordination!');
        router.push('/dashboard');
      } else {
        alert('Failed to submit for second coordination');
      }
    } catch (error) {
      console.error('Error submitting for second coordination:', error);
      alert('Error submitting for second coordination');
    }
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

    // Save to appropriate field based on document type
    try {
      const updateFields: any = {
        lastDraftUpdate: new Date().toISOString()
      };

      // For AI-generated documents, update crmFeedback; for others, update draftFeedback
      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = updatedComments;
        updateFields.draftFeedback = updatedComments;
      } else {
        updateFields.draftFeedback = updatedComments;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
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

  // Toggle individual comment selection
  const handleToggleSelect = (id: string) => {
    setComments(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Generate AI feedback
  const generateAIFeedback = async () => {
    if (aiFeedbackCount < 1 || aiFeedbackCount > 50) {
      window.alert('Please enter a number between 1 and 50 for feedback count');
      return;
    }

    setGeneratingAIFeedback(true);
    try {
      const response = await authTokenService.authenticatedFetch('/api/generate-ai-feedback', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          documentContent: documentContent,
          documentType: 'Review',
          feedbackCount: aiFeedbackCount
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Convert AI feedback to CRM format
        const aiFeedback = result.feedback.map((item: any, index: number) => ({
          id: `ai_${Date.now()}_${index}`,
          component: item.category || 'AI Generated',
          pocName: 'AI Assistant',
          pocPhone: '',
          pocEmail: '',
          commentType: item.severity === 'CRITICAL' ? 'C' :
                      item.severity === 'MAJOR' ? 'M' :
                      item.severity === 'SUBSTANTIVE' ? 'S' : 'A',
          page: item.page?.toString() || '1',
          paragraphNumber: item.paragraph?.toString() || '1',
          lineNumber: item.line?.toString() || '1',
          coordinatorComment: item.comment,
          changeFrom: item.originalText || '',
          changeTo: item.suggestedText || '',
          coordinatorJustification: `AI Analysis: ${item.category}`,
          selected: false
        }));

        setComments(prev => [...prev, ...aiFeedback]);

        // Save the AI feedback to database
        const allFeedback = [...comments, ...aiFeedback];
        console.log('Saving AI feedback to database:', {
          documentId,
          feedbackCount: allFeedback.length,
          newFeedbackCount: aiFeedback.length,
          isAIGeneratedDoc
        });

        // Prepare update fields based on document type
        const updateFields: any = {
          lastAIFeedbackGenerated: new Date().toISOString()
        };

        // For AI-generated documents, save to both crmFeedback and draftFeedback
        if (isAIGeneratedDoc) {
          updateFields.crmFeedback = allFeedback;
          updateFields.draftFeedback = allFeedback;
        } else {
          updateFields.draftFeedback = allFeedback;
        }

        const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            customFields: updateFields
          })
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('Failed to save feedback to database:', errorText);
          window.alert(`Generated ${aiFeedback.length} AI feedback items but failed to save to database`);
        } else {
          console.log('AI feedback saved successfully to database');
          window.alert(`Generated ${aiFeedback.length} AI feedback items and saved to database`);
        }
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      window.alert('Failed to generate AI feedback');
    } finally {
      setGeneratingAIFeedback(false);
    }
  };

  const handleClearSelectedFeedback = async () => {
    const selectedItems = comments.filter(item => item.selected);
    const selectedCount = selectedItems.length;

    if (selectedCount === 0) {
      window.alert('No feedback items selected.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCount} selected feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Delete Selected: Starting deletion for', selectedCount, 'items');

      // Remove selected items from local state immediately
      const remainingFeedback = comments.filter(item => !item.selected);
      setComments(remainingFeedback);

      // Clear selected feedback if it was selected
      if (selectedComment?.selected) {
        setSelectedComment(null);
      }

      // Save to database
      const updateFields: any = {
        lastModified: new Date().toISOString()
      };

      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = remainingFeedback;
        updateFields.draftFeedback = remainingFeedback;
      } else {
        updateFields.draftFeedback = remainingFeedback;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (response.ok) {
        window.alert(`${selectedCount} feedback items deleted successfully.`);
      } else {
        window.alert('Failed to update database.');
      }
    } catch (error) {
      console.error('Error deleting selected feedback:', error);
      window.alert('Error deleting feedback. Please try again.');
    }
  };

  const handleClearAllFeedback = async () => {
    if (!confirm(`Are you sure you want to clear all ${comments.length} feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Clear All: Starting clear operation');

      // Clear feedback from local state
      setComments([]);
      setSelectedComment(null);

      // Clear from database
      const updateFields: any = {
        lastClearedAt: new Date().toISOString()
      };

      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = [];
        updateFields.draftFeedback = [];
      } else {
        updateFields.draftFeedback = [];
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (response.ok) {
        window.alert('All feedback has been cleared successfully.');
      } else {
        window.alert('Failed to clear feedback from database.');
      }
    } catch (error) {
      console.error('Error clearing feedback:', error);
      window.alert('Error clearing feedback. Please try again.');
    }
  };

  // Handle selecting a comment to populate the form
  const handleSelectComment = (comment: CRMComment) => {
    setSelectedComment(comment);
    setCurrentComment({
      ...comment,
      id: undefined // Don't copy the ID for new comments
    });
    setShowAddForm(true); // Expand the form
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
          {/* Debug Info */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100', border: 1, borderColor: 'grey.400' }}>
            <Typography variant="caption" display="block">
              Debug: Stage = {workflowStage || 'Not loaded'} | Type = {typeof workflowStage} | Role = {userRole || 'Not loaded'}
            </Typography>
            <Typography variant="caption" display="block">
              Username: {localStorage.getItem('username') || 'none'} | Email: {localStorage.getItem('userEmail') || 'none'}
            </Typography>
            <Typography variant="caption" display="block">
              Stage 4 check: {workflowStage === '4' ? 'TRUE (string)' : workflowStage === 4 ? 'TRUE (number)' : 'FALSE'}
            </Typography>
            <Typography variant="caption" display="block">
              Stage 3.5 check: {workflowStage === '3.5' ? 'TRUE' : 'FALSE'} | Role is Reviewer: {userRole === 'Reviewer' ? 'YES' : 'NO'} | Role is Coordinator: {userRole === 'Coordinator' ? 'YES' : 'NO'}
            </Typography>
            <Typography variant="caption" display="block" color="primary">
              Checking stage '3.5': {String(workflowStage) === '3.5' ? 'TRUE' : 'FALSE'} |
              Checking stage '3': {String(workflowStage) === '3' ? 'TRUE' : 'FALSE'} |
              Not Coordinator: {(!userRole || userRole !== 'Coordinator') ? 'TRUE' : 'FALSE'}
            </Typography>
            <Typography variant="caption" display="block" color="error">
              Button will show: {((workflowStage === '3.5' || workflowStage === 3.5 || workflowStage === '3' || workflowStage === 3) && (!userRole || userRole !== 'Coordinator')) ? '✅ YES - Submit Review' : '❌ NO - Conditions not met'}
            </Typography>
          </Paper>

          {/* Stage-specific Action Buttons */}
          {workflowStage === '3.5' && userRole === 'Coordinator' && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.50', border: 2, borderColor: 'warning.main' }}>
              <Typography variant="h6" gutterBottom color="warning.main">
                Review Collection Phase - Coordinator Actions
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                All reviews have been collected. Process the feedback to advance the workflow.
              </Typography>
              <Button
                variant="contained"
                color="success"
                onClick={async () => {
                  console.log('🔴 CLICKING PROCESS FEEDBACK - Starting API call');
                  console.log('Document ID:', documentId);

                  try {
                    // First try the workflow-action API
                    const response = await fetch('/api/workflow-action', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authTokenService.getAccessToken()}`
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'advance',
                        workflowId: documentId,
                        fromStage: '3.5',
                        toStage: '4'
                      })
                    });

                    console.log('🔴 API Response status:', response.status);
                    const responseData = await response.json();
                    console.log('🔴 API Response data:', responseData);

                    if (response.ok && responseData.success) {
                      alert('Review collection phase complete! Advancing to Stage 4.');
                      // Add a delay before reloading to ensure backend has updated
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      alert(`Failed to advance workflow: ${responseData.error || responseData.message || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('🔴 Error calling API:', error);
                    alert('Error advancing workflow: ' + error.message);
                  }
                }}
                fullWidth
              >
                Process Feedback & Continue Workflow
              </Button>
            </Paper>
          )}

          {/* Reviewer Submit Button - ALWAYS SHOW */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: 2, borderColor: 'info.main' }}>
            <Typography variant="h6" gutterBottom color="info.main">
              Submit Your Review
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Add your feedback comments above and submit your review when ready.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitFeedbackToOPR}
              disabled={comments.length === 0}
              startIcon={<SendIcon />}
              fullWidth
            >
              Submit Review
            </Button>
          </Paper>

          {/* Always show Stage 4 buttons if in Stage 4, regardless of user */}
          {(workflowStage === '4' || workflowStage === 4 || workflowStage?.toString() === '4') ? (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: 2, borderColor: 'info.main' }}>
              <Typography variant="h6" gutterBottom color="info.main">
                Stage 4: OPR Feedback Incorporation
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Review the collected feedback below and incorporate necessary changes into the document.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    router.push(`/editor/${documentId}`);
                  }}
                  fullWidth
                >
                  Review & CRM
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    alert('Opening document editor to incorporate feedback...');
                    router.push(`/editor/${documentId}`);
                  }}
                  fullWidth
                >
                  Incorporate Feedback
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmitForSecondCoordination}
                  startIcon={<SendIcon />}
                  fullWidth
                >
                  Submit for Second Coordination
                </Button>
              </Box>
            </Paper>
          ) : null}

          {workflowStage === '5.5' && userRole?.toLowerCase().includes('coordinator') && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.50', border: 2, borderColor: 'warning.main' }}>
              <Typography variant="h6" gutterBottom color="warning.main">
                Second Review Collection Phase - Coordinator Actions
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                All draft reviews have been collected. Process the feedback to advance the workflow.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => {
                    alert('All draft reviews marked as complete');
                  }}
                  fullWidth
                >
                  All Draft Reviews Complete
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={async () => {
                    const response = await fetch('/api/workflow-action', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authTokenService.getAccessToken()}`
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'advance',
                        workflowId: documentId,
                        fromStage: '5.5',
                        toStage: '6',
                        requiredRole: 'Coordinator'
                      })
                    });
                    if (response.ok) {
                      alert('Second review collection phase complete! Advancing to Stage 6.');
                      window.location.reload();
                    } else {
                      alert('Failed to complete second review collection phase');
                    }
                  }}
                  fullWidth
                >
                  Process Feedback & Continue Workflow
                </Button>
              </Box>
            </Paper>
          )}

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

                {/* AI Feedback Management Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      AI FEEDBACK GENERATOR
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Number of Feedback Items"
                    value={aiFeedbackCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setAiFeedbackCount(Math.min(50, Math.max(1, value)));
                    }}
                    inputProps={{ min: 1, max: 50 }}
                    helperText="Enter 1-50"
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={generatingAIFeedback ? <CircularProgress size={16} /> : <GenerateAIIcon />}
                    onClick={generateAIFeedback}
                    disabled={generatingAIFeedback}
                    fullWidth
                  >
                    {generatingAIFeedback ? 'Generating AI Feedback...' : 'Generate AI Feedback'}
                  </Button>
                </Grid>

                {/* Feedback Management Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearSelectedFeedback}
                      disabled={!comments.some(c => c.selected)}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<ClearIcon />}
                      onClick={handleClearAllFeedback}
                      disabled={comments.length === 0}
                    >
                      Clear All
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Comments List */}
          <Paper sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Comment Matrix ({comments.length})
              </Typography>
              {isAIGeneratedDoc && comments.length > 0 && (
                <Chip
                  label="AI-Generated Feedback"
                  color="primary"
                  variant="outlined"
                  icon={<GenerateAIIcon />}
                  size="small"
                />
              )}
            </Box>
            
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
                        onClick={() => handleSelectComment(comment)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={comment.selected || false}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(comment.id!);
                            }}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, ml: 5 }}>
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