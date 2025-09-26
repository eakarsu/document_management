'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  ButtonGroup,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField
} from '@mui/material';
import {
  Business,
  ArrowBack,
  Download as DownloadIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  RateReview as ReviewIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  CheckCircle as ApprovedIcon,
  CheckCircle,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  Article as DraftIcon,
  PlayArrow as StartWorkflowIcon,
  Send as SubmitIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DocumentViewer from '../../../components/DocumentViewer';
import DocumentVersions from '../../../components/DocumentVersions';
import { api } from '@/lib/api';
import { authTokenService } from '@/lib/authTokenService';

interface DocumentDetails {
  id: string;
  title: string;
  category: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdById: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  filePath?: string;
}

const DocumentViewPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [documentData, setDocumentData] = useState<DocumentDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [workflowActive, setWorkflowActive] = useState(false);
  const [workflowButtonClicked, setWorkflowButtonClicked] = useState(false);
  const [workflowClickCount, setWorkflowClickCount] = useState(0);
  const [workflowStage, setWorkflowStage] = useState<string>('');
  const [buttonRenderKey, setButtonRenderKey] = useState(0);
  const [isDocumentPublished, setIsDocumentPublished] = useState(false);
  const [coordinatorFeedbackInput, setCoordinatorFeedbackInput] = useState('');
  const [legalFeedbackInput, setLegalFeedbackInput] = useState('');
  const [actualCoordinatorFeedback, setActualCoordinatorFeedback] = useState<string | null>(null);
  const [actualLegalFeedback, setActualLegalFeedback] = useState<string | null>(null);
  const [documentContentInput, setDocumentContentInput] = useState('');
  const [savedDocumentContent, setSavedDocumentContent] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<{
    role: string;
    roleType: string;
  } | null>(null);

  // Define the 8-stage workflow steps
  const workflowSteps = [
    'OPR Creates',
    '1st Coordination', 
    'OPR Revisions',
    '2nd Coordination',
    'OPR Final',
    'Legal Review',
    'OPR Legal',
    'AFDPO Publish'
  ];

  const getStageNumber = (stage: string): number => {
    const stageIndex = workflowSteps.findIndex(step => step === stage);
    return stageIndex >= 0 ? stageIndex + 1 : 1;
  };

  // Role-based access control function
  const canUserAdvanceFromStage = (stageNumber: number): boolean => {
    if (!userRole) return false;

    const roleRequirements = {
      1: ['ADMIN', 'OPR', 'AUTHOR'],           // OPR Creates
      2: ['ADMIN', 'TECHNICAL_REVIEWER'],     // 1st Coordination  
      3: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Revisions
      4: ['ADMIN', 'TECHNICAL_REVIEWER'],     // 2nd Coordination
      5: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Final
      6: ['ADMIN', 'LEGAL_REVIEWER'],         // Legal Review
      7: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Legal
      8: ['ADMIN', 'PUBLISHER']               // AFDPO Publish
    };

    const requiredRoles = roleRequirements[stageNumber as keyof typeof roleRequirements] || [];
    const userRoleType = userRole.roleType || userRole.role;
    
    return requiredRoles.includes(userRoleType);
  };

  const getStageRequirementMessage = (stageNumber: number): string => {
    const roleRequirements = {
      1: 'OPR/Author',
      2: 'Technical Reviewer',
      3: 'OPR/Author', 
      4: 'Technical Reviewer',
      5: 'OPR/Author',
      6: 'Legal Reviewer',
      7: 'OPR/Author',
      8: 'Publisher'
    };

    const stageNames = {
      1: 'OPR Creates',
      2: '1st Coordination',
      3: 'OPR Revisions',
      4: '2nd Coordination', 
      5: 'OPR Final',
      6: 'Legal Review',
      7: 'OPR Legal',
      8: 'AFDPO Publish'
    };

    return `${stageNames[stageNumber]} stage requires ${roleRequirements[stageNumber as keyof typeof roleRequirements] || 'authorized personnel'}. Your role: ${userRole?.role || 'Unknown'}`;
  };

  // Enhanced function to fetch workflow feedback using the new token service
  const fetchWorkflowFeedback = async () => {
    try {
      console.log('📝 FEEDBACK: Fetching feedback from backend database for document:', documentId);
      
      const response = await authTokenService.authenticatedFetch(
        `http://localhost:4000/api/workflow/8-stage/document/${documentId}`
      );
      
      console.log('📝 FEEDBACK: Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📝 FEEDBACK: Backend workflow data:', data);
        
        if (data.success && data.workflow) {
          const workflow = data.workflow;
          
          // Extract ICU feedback
          if (workflow.internal_coordinating_users && workflow.internal_coordinating_users.length > 0) {
            const icuFeedback = workflow.internal_coordinating_users.find((icu: any) => icu.feedback);
            if (icuFeedback) {
              console.log('📝 FEEDBACK: Found ICU feedback:', icuFeedback.feedback);
              setActualCoordinatorFeedback(icuFeedback.feedback);
            }
          }
          
          // Extract legal feedback (from stage transitions or other fields)
          if (workflow.stage_transitions) {
            const legalTransition = workflow.stage_transitions.find((st: any) => 
              st.transition_data && st.transition_data.legalFeedback
            );
            if (legalTransition) {
              console.log('📝 FEEDBACK: Found legal feedback:', legalTransition.transition_data.legalFeedback);
              setActualLegalFeedback(legalTransition.transition_data.legalFeedback);
            }
          }
          
          // Update workflow stage based on backend data
          const backendStage = workflow.current_stage;
          const stageMapping = {
            'DRAFT_CREATION': 'OPR Creates',
            'INTERNAL_COORDINATION': '1st Coordination', 
            'OPR_REVISIONS': 'OPR Revisions',
            'EXTERNAL_COORDINATION': '2nd Coordination',
            'OPR_FINAL': 'OPR Final',
            'LEGAL_REVIEW': 'Legal Review',
            'OPR_LEGAL': 'OPR Legal',
            'FINAL_PUBLISHING': 'AFDPO Publish'
          };
          
          const frontendStage = stageMapping[backendStage as keyof typeof stageMapping] || 'OPR Creates';
          setWorkflowStage(frontendStage);
          setWorkflowActive(true);
          
          return workflow;
        } else {
          console.log('📝 FEEDBACK: No workflow found in backend response');
          return null;
        }
      } else if (response.status === 401) {
        console.error('📝 FEEDBACK: Authentication failed - redirecting to login');
        router.push('/login');
        return null;
      } else {
        console.error('📝 FEEDBACK: Backend request failed:', response.status);
        return null;
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('📝 FEEDBACK: Authentication error:', error.message);
        alert(error.message);
        router.push('/login');
      } else {
        console.error('📝 FEEDBACK: Error fetching feedback:', error);
      }
      return null;
    }
  };

  // Enhanced function to save workflow feedback to backend database
  const saveWorkflowFeedback = async (stage: string, feedback: string) => {
    try {
      console.log('📝 FEEDBACK: Saving to backend database:', { stage, feedback });
      
      if (stage === '1st Coordination') {
        const response = await authTokenService.authenticatedFetch(
          `http://localhost:4000/api/workflow/8-stage/icu/${documentId}/feedback`,
          {
            method: 'POST',
            body: JSON.stringify({
              feedback,
              comments: feedback,
              reviewCompletionDate: new Date().toISOString()
            })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📝 COORDINATOR-FEEDBACK: Saved successfully:', data);
          setActualCoordinatorFeedback(feedback);
        } else {
          throw new Error(`Failed to save coordinator feedback: ${response.status}`);
        }
      } else if (stage === 'Legal Review') {
        // For legal feedback, we would call a different endpoint
        console.log('📝 LEGAL-FEEDBACK: Legal feedback endpoint not implemented yet');
        setActualLegalFeedback(feedback);
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('📝 FEEDBACK: Authentication error:', error.message);
        alert(error.message);
        router.push('/login');
      } else {
        console.error('📝 FEEDBACK: Error saving feedback:', error);
        alert('Failed to save feedback. Please try again.');
      }
    }
  };

  // Enhanced workflow management functions
  const startWorkflow = async () => {
    try {
      console.log('🚀 WORKFLOW: Starting 8-stage workflow for document:', documentId);

      const response = await authTokenService.authenticatedFetch('/api/workflow-status', {
        method: 'POST',
        body: JSON.stringify({
          documentId: documentId,
          action: 'start_workflow'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🚀 WORKFLOW: Started successfully:', data);
        
        setWorkflowActive(true);
        setWorkflowStage('OPR Creates');
        
        // Fetch the actual backend workflow state
        await fetchWorkflowFeedback();
        
        alert('8-stage workflow started successfully!');
      } else {
        throw new Error('Failed to start workflow');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        alert(error.message);
        router.push('/login');
      } else {
        console.error('🚀 WORKFLOW: Error starting workflow:', error);
        alert('Failed to start workflow. Please try again.');
      }
    }
  };

  const handleWorkflowAdvancement = async (nextStage: string, currentStep: number) => {
    try {
      console.log('🔄 WORKFLOW: Advancing to stage:', nextStage);

      // Save document content first if provided
      if (documentContentInput.trim()) {
        const contentResponse = await fetch('/api/workflow-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            documentId: documentId,
            documentContent: documentContentInput
          })
        });

        if (contentResponse.ok) {
          setSavedDocumentContent(documentContentInput);
        }
      }

      // Update workflow state
      const response = await fetch('/api/workflow-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: documentId,
          currentStep: currentStep,
          stage: nextStage,
          action: 'advanced_to_stage'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔄 WORKFLOW: Advanced successfully:', data);
        
        setWorkflowStage(nextStage);
        setButtonRenderKey(prev => prev + 1);
        
        // Refresh workflow state from backend
        await fetchWorkflowFeedback();
        
        alert(`Document moved to ${nextStage} stage`);
      } else {
        throw new Error('Failed to advance workflow');
      }
    } catch (error) {
      console.error('🔄 WORKFLOW: Error advancing workflow:', error);
      alert('Failed to advance workflow. Please try again.');
    }
  };

  // User info fetching
  const fetchUserInfo = async () => {
    try {
      const response = await authTokenService.authenticatedFetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 USER-ROLE: User role loaded:', data.user);
        
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email);
        setUserRole({
          role: data.user.role?.name || 'Unknown',
          roleType: data.user.role?.roleType || data.user.role?.name || 'Unknown'
        });
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('🔐 USER-ROLE: Authentication error:', error.message);
        router.push('/login');
      } else {
        console.error('🔐 USER-ROLE: Error fetching user info:', error);
      }
    }
  };

  // Document info fetching
  const fetchDocumentData = async () => {
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocumentData(data.document);
        setIsDocumentPublished(data.document.status === 'PUBLISHED');
      } else {
        throw new Error('Failed to fetch document data');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        router.push('/login');
      } else {
        console.error('📄 DOCUMENT: Error fetching document data:', error);
        setError('Failed to load document data');
      }
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Check if we have valid authentication
        const tokenInfo = authTokenService.getTokenInfo();
        if (!tokenInfo.accessToken || !tokenInfo.isValid) {
          console.log('🔐 AUTH: No valid token found, redirecting to login');
          router.push('/login');
          return;
        }

        await Promise.all([
          fetchUserInfo(),
          fetchDocumentData(),
          fetchWorkflowFeedback()
        ]);
      } catch (error) {
        console.error('📄 INIT: Error loading initial data:', error);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadData();
    }
  }, [documentId]);

  // Render workflow progress indicator
  const renderWorkflowProgress = () => {
    if (!workflowActive) return null;

    const currentStepIndex = workflowSteps.findIndex(step => step === workflowStage);
    const progress = ((currentStepIndex + 1) / workflowSteps.length) * 100;

    return (
      <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔄 8-Stage Workflow Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.3)', 
                borderRadius: 1, 
                height: 8,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  bgcolor: 'success.main', 
                  height: '100%', 
                  width: `${progress}%`,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ minWidth: 50 }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <Typography variant="body1">
            Current Stage: <strong>{workflowStage}</strong> (Step {currentStepIndex + 1} of {workflowSteps.length})
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Render workflow action buttons with role-based access
  const renderWorkflowButtons = () => {
    if (!userRole) return null;

    const currentStepNumber = getStageNumber(workflowStage);
    const canAdvance = canUserAdvanceFromStage(currentStepNumber);

    if (!workflowActive) {
      return (
        <Button
          key={`start-workflow-${buttonRenderKey}`}
          variant="contained"
          color="primary"
          onClick={startWorkflow}
          startIcon={<StartWorkflowIcon />}
          sx={{ mb: 2 }}
        >
          🚀 Start 8-Stage Workflow
        </Button>
      );
    }

    // Stage-specific action buttons
    const renderStageButtons = () => {
      switch (workflowStage) {
        case 'OPR Creates':
          return canAdvance ? (
            <div>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Document Content"
                value={documentContentInput}
                onChange={(e) => setDocumentContentInput(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter the document content..."
              />
              <Button
                key={`send-coordination-${buttonRenderKey}`}
                variant="contained"
                color="primary"
                onClick={() => {
                  if (!documentContentInput.trim()) {
                    alert('Please enter document content before sending to coordination');
                    return;
                  }
                  handleWorkflowAdvancement('1st Coordination', 2);
                }}
                startIcon={<SubmitIcon />}
                sx={{ mr: 1 }}
              >
                📤 Send to 1st Coordination
              </Button>
            </div>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(1)}
            </Alert>
          );

        case '1st Coordination':
          return canAdvance ? (
            <div>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Coordinator Feedback"
                value={coordinatorFeedbackInput}
                onChange={(e) => setCoordinatorFeedbackInput(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter your coordination feedback..."
              />
              <ButtonGroup>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    if (coordinatorFeedbackInput.trim()) {
                      saveWorkflowFeedback('1st Coordination', coordinatorFeedbackInput);
                    }
                    handleWorkflowAdvancement('OPR Revisions', 3);
                  }}
                >
                  ✅ Send to OPR
                </Button>
              </ButtonGroup>
            </div>
          ) : (
            <Alert severity="info">
              Waiting for Technical Reviewer feedback. {getStageRequirementMessage(2)}
            </Alert>
          );

        case 'OPR Revisions':
          return canAdvance ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleWorkflowAdvancement('2nd Coordination', 4)}
            >
              📤 Send to 2nd Coordination
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(3)}
            </Alert>
          );

        case '2nd Coordination':
          return canAdvance ? (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleWorkflowAdvancement('OPR Final', 5)}
            >
              ✅ Send to OPR Final
            </Button>
          ) : (
            <Alert severity="info">
              Waiting for Technical Reviewer feedback. {getStageRequirementMessage(4)}
            </Alert>
          );

        case 'OPR Final':
          return canAdvance ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleWorkflowAdvancement('Legal Review', 6)}
            >
              📤 Send to Legal Review
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(5)}
            </Alert>
          );

        case 'Legal Review':
          return canAdvance ? (
            <div>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Legal Review Comments"
                value={legalFeedbackInput}
                onChange={(e) => setLegalFeedbackInput(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter legal review comments..."
              />
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  if (legalFeedbackInput.trim()) {
                    saveWorkflowFeedback('Legal Review', legalFeedbackInput);
                  }
                  handleWorkflowAdvancement('OPR Legal', 7);
                }}
              >
                ⚖️ Send to OPR Legal
              </Button>
            </div>
          ) : (
            <Alert severity="info">
              Waiting for Legal Reviewer. {getStageRequirementMessage(6)}
            </Alert>
          );

        case 'OPR Legal':
          return canAdvance ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleWorkflowAdvancement('AFDPO Publish', 8)}
            >
              📤 Send to AFDPO
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(7)}
            </Alert>
          );

        case 'AFDPO Publish':
          return canAdvance ? (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setIsDocumentPublished(true);
                alert('Document published successfully!');
              }}
            >
              🎉 Publish Document
            </Button>
          ) : (
            <Alert severity="info">
              Waiting for Publisher approval. {getStageRequirementMessage(8)}
            </Alert>
          );

        default:
          return null;
      }
    };

    return (
      <Box sx={{ mb: 2 }}>
        {renderStageButtons()}
      </Box>
    );
  };

  // Render feedback display
  const renderFeedbackDisplay = () => {
    if (!actualCoordinatorFeedback && !actualLegalFeedback) return null;

    return (
      <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Workflow Feedback
          </Typography>
          {actualCoordinatorFeedback && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Coordinator Feedback:
              </Typography>
              <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {actualCoordinatorFeedback}
              </Typography>
            </Box>
          )}
          {actualLegalFeedback && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Legal Review Feedback:
              </Typography>
              <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {actualLegalFeedback}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading document...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!documentData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Document not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {documentData.title}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            👤 {userRole?.role || 'Loading...'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    {documentData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip 
                      label={documentData.status} 
                      color={
                        documentData.status === 'PUBLISHED' ? 'success' :
                        documentData.status === 'IN_REVIEW' ? 'warning' :
                        documentData.status === 'DRAFT' ? 'info' : 'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    {workflowActive && (
                      <Chip 
                        label={`Workflow: ${workflowStage}`} 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Created by {documentData.createdBy.firstName} {documentData.createdBy.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {new Date(documentData.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Workflow Progress */}
              {renderWorkflowProgress()}

              {/* Workflow Action Buttons */}
              {renderWorkflowButtons()}

              {/* Feedback Display */}
              {renderFeedbackDisplay()}

              {/* Document Content Display */}
              {savedDocumentContent && (
                <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📄 Saved Document Content
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      bgcolor: 'background.paper', 
                      p: 2, 
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {savedDocumentContent}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Paper>

            {/* Document Viewer */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Document Preview
              </Typography>
              <DocumentViewer
                documentId={documentId}
                document={{
                  title: documentData.title,
                  mimeType: documentData.mimeType || '',
                  category: documentData.category || '',
                  fileSize: documentData.fileSize,
                  content: (documentData as any).content
                }}
              />
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Document Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {documentData.category || 'Uncategorized'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  File Size
                </Typography>
                <Typography variant="body1">
                  {documentData.fileSize ? `${(documentData.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {documentData.mimeType || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body1">
                  {documentData.currentVersion || 1}
                </Typography>
              </Box>
            </Paper>

            {/* Document Versions */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Version History
              </Typography>
              <DocumentVersions documentId={documentId} currentUserId={''} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DocumentViewPage;