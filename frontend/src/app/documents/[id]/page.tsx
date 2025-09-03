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
import WorkflowTasks from '../../../components/WorkflowTasks';
import { api } from '../../../lib/api';
import { authTokenService } from '../../../lib/authTokenService';
import CRMFeedbackForm from '../../../components/feedback/CRMFeedbackForm';

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
  content?: string;
  customFields?: any;
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
  const [workflowProcessing, setWorkflowProcessing] = useState(false);
  const [isDocumentPublished, setIsDocumentPublished] = useState(false);
  const [coordinatorFeedbackInput, setCoordinatorFeedbackInput] = useState('');
  const [legalFeedbackInput, setLegalFeedbackInput] = useState('');
  const [actualCoordinatorFeedback, setActualCoordinatorFeedback] = useState<string | null>(null);
  const [actualLegalFeedback, setActualLegalFeedback] = useState<string | null>(null);
  const [documentContentInput, setDocumentContentInput] = useState('');
  const [savedDocumentContent, setSavedDocumentContent] = useState<string | null>(null);

  // Helper function to map frontend stage names to backend stage names
  const getBackendStage = (frontendStage: string): string => {
    const stageMap: { [key: string]: string } = {
      '1st Coordination': 'INTERNAL_COORDINATION',
      'OPR Revisions': 'OPR_REVISIONS',
      '2nd Coordination': 'EXTERNAL_COORDINATION',
      'OPR Final': 'OPR_FINAL',
      'Legal Review': 'LEGAL_REVIEW',
      'OPR Legal': 'OPR_LEGAL',
      'AFDPO Publish': 'FINAL_PUBLISHING',
      'Published': 'PUBLISHED'
    };
    return stageMap[frontendStage] || frontendStage;
  };
  const [userRole, setUserRole] = useState<{
    role: string;
    roleType: string;
    email?: string;
  } | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [canMoveBackward, setCanMoveBackward] = useState(false);
  const [workflowId, setWorkflowId] = useState<string>('');

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

  // Helper function to check if current stage allows OPR coordination submission
  const canSubmitForCoordination = () => {
    // console.log('🔍 Checking canSubmitForCoordination:', { workflowStage, workflowActive });
    return workflowStage === 'OPR Creates' || 
           workflowStage === 'DRAFT_CREATION' || 
           workflowStage === 'OPR Revisions' || 
           workflowStage === 'OPR_REVISIONS' ||
           workflowStage === 'OPR Final' ||
           workflowStage === 'OPR_FINAL' ||
           workflowStage === 'OPR Legal' ||
           workflowStage === 'OPR_LEGAL';
  };

  // Helper function to check if workflow is in initial state
  const isWorkflowNotStarted = () => {
    // console.log('🔍 Checking isWorkflowNotStarted:', { workflowActive, workflowStage });
    return !workflowActive || 
           workflowStage === 'Not Started' || 
           workflowStage === '' || 
           !workflowStage;
  };

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
      // console.log('📝 FEEDBACK: Fetching feedback from backend database for document:', documentId);
      
      const response = await fetch(
        `/api/workflow-status?documentId=${documentId}&action=get_status`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );
      
      // console.log('📝 FEEDBACK: Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log('📝 FEEDBACK: Backend workflow data:', data);
        
        if (data.success && data.workflow) {
          const workflow = data.workflow;
          
          // Extract ICU feedback
          if (workflow.internal_coordinating_users && workflow.internal_coordinating_users.length > 0) {
            const icuFeedback = workflow.internal_coordinating_users.find((icu: any) => icu.feedback);
            if (icuFeedback) {
              // console.log('📝 FEEDBACK: Found ICU feedback:', icuFeedback.feedback);
              setActualCoordinatorFeedback(icuFeedback.feedback);
            }
          }
          
          // Extract legal feedback (from stage transitions or other fields)
          if (workflow.stage_transitions) {
            const legalTransition = workflow.stage_transitions.find((st: any) => 
              st.transition_data && st.transition_data.legalFeedback
            );
            if (legalTransition) {
              // console.log('📝 FEEDBACK: Found legal feedback:', legalTransition.transition_data.legalFeedback);
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
          // console.log('📝 FEEDBACK: No workflow found in backend response');
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

  // Fetch workflow history
  const fetchWorkflowHistory = async () => {
    try {
      const token = authTokenService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/workflow-history?workflowId=workflow_${documentId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.workflow) {
          setWorkflowHistory(data.workflow.history || []);
          setCurrentWorkflow(data.workflow);
        }
      }
    } catch (error) {
      console.error('Error fetching workflow history:', error);
    }
  };

  // Handle workflow stage changes (bidirectional)
  const handleWorkflowStageChange = async (
    direction: 'forward' | 'backward', 
    fromStage: string, 
    toStage: string,
    reason?: string
  ) => {
    try {
      const token = authTokenService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      let action = '';
      let body: any = { fromStage, toStage, workflowId: `workflow_${documentId}` };

      if (direction === 'backward') {
        action = 'move_backward';
        body.reason = reason || 'Manual backward transition';
      } else {
        action = 'advance';
        
        // Map role to required role for validation
        const roleMapping: Record<string, string> = {
          'AUTHOR': 'AUTHOR',
          'OPR': 'OPR', 
          'TECHNICAL_REVIEWER': 'TECHNICAL_REVIEWER',
          'LEGAL_REVIEWER': 'LEGAL_REVIEWER',
          'PUBLISHER': 'PUBLISHER',
          'ICU_REVIEWER': 'ICU_REVIEWER',
          'WORKFLOW_ADMIN': 'WORKFLOW_ADMIN'
        };
        
        body.requiredRole = roleMapping[userRole?.role || ''] || userRole?.role;
      }

      const response = await fetch('/api/workflow-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, ...body }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setWorkflowStage(toStage);
          await fetchWorkflowHistory();
          await fetchWorkflowFeedback(); // Refresh workflow data
          // console.log(`Workflow ${direction} transition successful: ${fromStage} -> ${toStage}`);
        } else {
          throw new Error(data.message || `Failed to ${direction} workflow`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${direction} workflow`);
      }
    } catch (error) {
      console.error(`Error in workflow ${direction} transition:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${direction} workflow`);
      throw error;
    }
  };

  // Check if user can move workflow backward
  const checkBackwardPermission = () => {
    const adminRoles = ['WORKFLOW_ADMIN', 'ADMIN'];
    setCanMoveBackward(adminRoles.includes(userRole?.role || ''));
  };

  // Refresh workflow data
  const refreshWorkflowData = async () => {
    await fetchWorkflowFeedback();
    await fetchWorkflowHistory();
  };

  // Enhanced function to save workflow feedback to backend database
  const saveWorkflowFeedback = async (stage: string, feedback: string) => {
    try {
      // console.log('📝 FEEDBACK: Saving to backend database:', { stage, feedback });
      
      if (stage === '1st Coordination') {
        const response = await fetch('/api/workflow-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            documentId,
            stage,
            feedback,
            comments: feedback,
            reviewCompletionDate: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // console.log('📝 COORDINATOR-FEEDBACK: Saved successfully:', data);
          setActualCoordinatorFeedback(feedback);
        } else {
          throw new Error(`Failed to save coordinator feedback: ${response.status}`);
        }
      } else if (stage === 'Legal Review') {
        // For legal feedback, we would call a different endpoint
        // console.log('📝 LEGAL-FEEDBACK: Legal feedback endpoint not implemented yet');
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
      // console.log('🚀 WORKFLOW: Starting 8-stage workflow for document:', documentId);

      const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/start/${documentId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('🚀 WORKFLOW: Started successfully:', data);
        
        setWorkflowActive(true);
        setWorkflowStage('OPR Creates');
        
        // Fetch the actual backend workflow state
        await fetchWorkflowStatus();
        
        alert('8-stage workflow started successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start workflow');
      }
    } catch (error) {
      console.error('🚀 WORKFLOW: Error starting workflow:', error);
      alert('Failed to start workflow. Please try again.');
    }
  };

  // Fetch current workflow status
  const fetchWorkflowStatus = async () => {
    try {
      // console.log('🔍 WORKFLOW: Fetching status for document:', documentId);
      
      // Add timestamp to prevent caching issues
      const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/document/${documentId}?t=${Date.now()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('🔍 WORKFLOW: Status response:', data);
        
        if (data.success && data.workflow) {
          setWorkflowActive(data.workflow.is_active);
          setWorkflowStage(data.workflow.current_stage);
          setWorkflowId(data.workflow.id);
          // console.log('🔍 WORKFLOW: State updated:', {
          //   active: data.workflow.is_active,
          //   stage: data.workflow.current_stage,
          //   id: data.workflow.id
          // });
        }
      } else {
        // console.log('🔍 WORKFLOW: Status response not OK:', response.status);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('🔐 WORKFLOW: Authentication error, redirecting to login');
        router.push('/login');
      } else {
        console.error('🔍 WORKFLOW: Error fetching workflow status:', error);
      }
    }
  };

  const handleWorkflowAdvancement = async (nextStage: string, currentStep: number) => {
    try {
      setWorkflowProcessing(true);
      // console.log('🔄 WORKFLOW: Advancing to stage:', nextStage);

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
      const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
        method: 'POST',
        body: JSON.stringify({
          fromStage: workflowStage,
          toStage: getBackendStage(nextStage),
          transitionData: {
            step: currentStep,
            advancedBy: currentUserEmail,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('🔄 WORKFLOW: Advanced successfully:', data);
        
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
    } finally {
      setWorkflowProcessing(false);
    }
  };

  // User info fetching
  const fetchUserInfo = async () => {
    try {
      const response = await authTokenService.authenticatedFetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        // console.log('🔐 USER-ROLE: User role loaded:', data.user);
        
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email);
        const roleName = data.user.role?.name || 'Unknown';
        // console.log('🔐 USER-ROLE: Setting role name:', roleName);
        setUserRole({
          role: roleName,
          roleType: data.user.role?.roleType || data.user.role?.name || 'Unknown',
          email: data.user.email || ''
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
          // console.log('🔐 AUTH: No valid token found, redirecting to login');
          router.push('/login');
          return;
        }

        await Promise.all([
          fetchUserInfo(),
          fetchDocumentData(),
          fetchWorkflowFeedback(),
          fetchWorkflowStatus()
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

  // Refresh workflow status when window gains focus (e.g., after switching users)
  useEffect(() => {
    const handleFocus = async () => {
      // console.log('🔄 Window focused - refreshing workflow and user status');
      try {
        await Promise.all([
          fetchWorkflowStatus(),
          fetchUserInfo()
        ]);
      } catch (error) {
        console.error('🔄 Error refreshing on focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [documentId]);

  // Render workflow progress indicator
  const renderWorkflowProgress = () => {
    if (!workflowActive) return null;

    // Map backend stages to frontend step names
    const stageToStepMap: Record<string, string> = {
      'DRAFT_CREATION': 'OPR Creates',
      'INTERNAL_COORDINATION': '1st Coordination',
      'OPR_REVISIONS': 'OPR Revisions',
      'EXTERNAL_COORDINATION': '2nd Coordination',
      'OPR_FINAL': 'OPR Final',
      'LEGAL_REVIEW': 'Legal Review',
      'OPR_LEGAL': 'OPR Legal',
      'FINAL_PUBLISHING': 'AFDPO Publish',
      'PUBLISHED': 'AFDPO Publish'
    };
    
    // Get the correct step name whether we have backend or frontend format
    const currentStepName = stageToStepMap[workflowStage] || workflowStage;
    const currentStepIndex = workflowSteps.findIndex(step => step === currentStepName);
    
    // Role-based stage responsibility mapping
    const stageRoles: Record<number, string[]> = {
      1: ['ADMIN', 'OPR', 'AUTHOR'],           // OPR Creates
      2: ['ADMIN', 'TECHNICAL_REVIEWER'],     // 1st Coordination  
      3: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Revisions
      4: ['ADMIN', 'TECHNICAL_REVIEWER'],     // 2nd Coordination
      5: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Final
      6: ['ADMIN', 'LEGAL_REVIEWER'],         // Legal Review
      7: ['ADMIN', 'OPR', 'AUTHOR'],          // OPR Legal
      8: ['ADMIN', 'PUBLISHER']               // AFDPO Publish
    };

    return (
      <Card sx={{ 
        mb: 2, 
        bgcolor: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #cce7ff 100%)',
        boxShadow: 3,
        border: '2px solid #2196f3'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: '#1565c0', 
            fontWeight: 'bold' 
          }}>
            🔄 8-Stage Workflow Progress
            <Chip 
              label={`Your Role: ${userRole?.role || 'Loading...'}`} 
              size="small" 
              sx={{ 
                ml: 2, 
                bgcolor: '#2196f3', 
                color: 'white',
                fontWeight: 'bold'
              }} 
            />
          </Typography>
          
          {/* Visual Stage Indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            {workflowSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUserResponsible = userRole && stageRoles[index + 1]?.includes(userRole.role);
              
              return (
                <Box key={step} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  minWidth: '110px',
                  opacity: isCompleted || isCurrent ? 1 : 0.6
                }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isCompleted ? '#4caf50' : 
                            isCurrent ? '#ff9800' : 
                            '#e3f2fd',
                    color: isCompleted || isCurrent ? 'white' : '#1565c0',
                    border: isUserResponsible ? '3px solid #ff6f00' : '2px solid #2196f3',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: isCompleted || isCurrent ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    {isCompleted ? '✓' : index + 1}
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textAlign: 'center', 
                      mt: 0.5,
                      fontWeight: isCurrent ? 'bold' : 'medium',
                      color: isCurrent ? '#ff9800' : '#1565c0',
                      fontSize: '11px',
                      textShadow: 'none'
                    }}
                  >
                    {step}
                  </Typography>
                  {isUserResponsible && (
                    <Typography variant="caption" sx={{ 
                      color: '#ff6f00', 
                      fontWeight: 'bold',
                      fontSize: '10px',
                      textShadow: 'none',
                      backgroundColor: 'rgba(255, 111, 0, 0.1)',
                      px: 0.5,
                      py: 0.2,
                      borderRadius: 1,
                      mt: 0.5
                    }}>
                      YOUR STAGE
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Progress Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 2 }}>
              <Box sx={{ 
                bgcolor: '#bbdefb', 
                borderRadius: 2, 
                height: 10,
                overflow: 'hidden',
                border: '1px solid #2196f3'
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)', 
                  height: '100%', 
                  width: `${((currentStepIndex + 1) / workflowSteps.length) * 100}%`,
                  transition: 'width 0.5s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ 
              minWidth: 50, 
              color: '#1565c0',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {Math.round(((currentStepIndex + 1) / workflowSteps.length) * 100)}%
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ 
            textAlign: 'center', 
            color: '#1565c0',
            fontWeight: 'medium',
            fontSize: '16px'
          }}>
            Current Stage: <strong style={{ color: '#ff6f00' }}>{workflowStage}</strong> (Step {currentStepIndex + 1} of {workflowSteps.length})
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
        case 'DRAFT_CREATION':
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
              <Typography variant="body2" color="text.secondary">
                Use the "Submit for Coordination" button in Quick Actions to advance the workflow.
              </Typography>
            </div>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(1)}
            </Alert>
          );

        case '1st Coordination':
        case 'INTERNAL_COORDINATION':
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
            </div>
          ) : (
            <Alert severity="info">
              Waiting for Technical Reviewer feedback. {getStageRequirementMessage(2)}
            </Alert>
          );

        case 'OPR Revisions':
        case 'OPR_REVISIONS':
          return canAdvance ? (
            <Button
              variant="contained"
              color="primary"
              disabled={workflowProcessing}
              onClick={() => handleWorkflowAdvancement('2nd Coordination', 4)}
              startIcon={workflowProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {workflowProcessing ? '⏳ Processing...' : '📤 Send to 2nd Coordination'}
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(3)}
            </Alert>
          );

        case '2nd Coordination':
        case 'EXTERNAL_COORDINATION':
          return canAdvance ? (
            <Alert severity="success">
              Ready for OPR Final review. Use the workflow actions to advance.
            </Alert>
          ) : (
            <Alert severity="info">
              Waiting for Technical Reviewer feedback. {getStageRequirementMessage(4)}
            </Alert>
          );

        case 'OPR Final':
        case 'OPR_FINAL':
          return canAdvance ? (
            <Button
              variant="contained"
              color="primary"
              disabled={workflowProcessing}
              onClick={() => handleWorkflowAdvancement('Legal Review', 6)}
              startIcon={workflowProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {workflowProcessing ? '⏳ Processing...' : '📤 Send to Legal Review'}
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(5)}
            </Alert>
          );

        case 'Legal Review':
        case 'LEGAL_REVIEW':
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
            </div>
          ) : (
            <Alert severity="info">
              Waiting for Legal Reviewer. {getStageRequirementMessage(6)}
            </Alert>
          );

        case 'OPR Legal':
        case 'OPR_LEGAL':
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
        case 'FINAL_PUBLISHING':
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
            Document Details
          </Typography>
          <Chip 
            label={userRole?.role || 'Loading...'} 
            sx={{ bgcolor: 'white', color: 'primary.main' }}
            icon={<PersonIcon />}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Title and Quick Actions */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                📄 {documentData.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  label={documentData.status} 
                  sx={{ 
                    bgcolor: documentData.status === 'PUBLISHED' ? 'success.light' : 
                            documentData.status === 'IN_REVIEW' ? 'warning.light' : 'info.light',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={`Version ${documentData.currentVersion || 1}`} 
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  icon={<HistoryIcon />}
                />
                <Chip 
                  label={documentData.category || 'Uncategorized'} 
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  icon={<CategoryIcon />}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions Bar */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', border: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
            🚀 Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {/* Primary Actions */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Edit Document */}
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/editor/${documentId}`)}
                  sx={{ minWidth: 150 }}
                >
                  Edit Document
                </Button>

                {/* Review & Feedback */}
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<ReviewIcon />}
                  onClick={() => router.push(`/documents/${documentId}/review`)}
                  sx={{ minWidth: 150 }}
                >
                  Review & CRM
                </Button>

                {/* Start/Continue Workflow */}
                {isWorkflowNotStarted() ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<StartWorkflowIcon />}
                    onClick={startWorkflow}
                    sx={{ minWidth: 150 }}
                  >
                    Start Workflow
                  </Button>
                ) : workflowActive && (canSubmitForCoordination() || userRole?.role === 'ADMIN' || userRole?.role === 'Admin' || userRole?.role === 'WORKFLOW_ADMIN') ? (
                  <Button
                    variant="contained"
                    color="warning"
                    size="large"
                    disabled={workflowProcessing}
                    startIcon={workflowProcessing ? <CircularProgress size={16} color="inherit" /> : <SubmitIcon />}
                    onClick={async () => {
                      if (!canSubmitForCoordination()) return;
                      try {
                        setWorkflowProcessing(true);
                        let targetStage = '';
                        let targetStep = 0;
                        const currentBackendStage = getBackendStage(workflowStage);
                        
                        switch(currentBackendStage) {
                          case 'DRAFT_CREATION':
                          case 'OPR Creates':
                            targetStage = '1st Coordination';
                            targetStep = 2;
                            break;
                          case 'OPR_REVISIONS':
                          case 'OPR Revisions':
                            targetStage = '2nd Coordination';
                            targetStep = 4;
                            break;
                          case 'OPR_FINAL':
                          case 'OPR Final':
                            targetStage = 'Legal Review';
                            targetStep = 6;
                            break;
                          case 'OPR_LEGAL':
                          case 'OPR Legal':
                            targetStage = 'AFDPO Publish';
                            targetStep = 8;
                            break;
                          default:
                            console.error('Unknown stage for coordination:', currentBackendStage);
                            alert('Cannot submit from this stage');
                            setWorkflowProcessing(false);
                            return;
                        }
                        
                        await handleWorkflowAdvancement(targetStage, targetStep);
                      } catch (error) {
                        console.error('Quick Actions advancement failed:', error);
                        alert('Failed to advance workflow. Please try again.');
                        setWorkflowProcessing(false);
                      }
                    }}
                    sx={{ minWidth: 150 }}
                  >
                    Submit to Next
                  </Button>
                ) : null}

                {/* Version History */}
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<HistoryIcon />}
                  onClick={() => {
                    const element = document.getElementById('version-history');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ minWidth: 150 }}
                >
                  Versions
                </Button>
              </Box>
            </Grid>
            
            {/* Document Actions */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    const element = document.getElementById('document-preview');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={async () => {
                    const response = await api.get(`/api/documents/${documentId}/download`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = documentData?.title || 'document';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Download
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

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
            <Paper id="document-preview" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📄 Document Preview
              </Typography>
              <DocumentViewer 
                documentId={documentId} 
                document={{
                  title: documentData.title,
                  mimeType: documentData.mimeType || 'text/html',
                  category: documentData.category,
                  fileSize: documentData.fileSize,
                  content: documentData.content || documentData.customFields?.content || ''
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

            {/* Streamlined Workflow Controls */}
            <Paper sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'primary.light' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🎯 Workflow Controls
              </Typography>
              
              {/* Role & Stage Status Display */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={userRole?.role || 'Unknown'} 
                    color="primary" 
                    size="small"
                    icon={<PersonIcon />}
                  />
                  {workflowActive && (
                    <Chip 
                      label={workflowStage || 'Not Started'} 
                      color="warning" 
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              {/* OPR ROLE ACTIONS */}
              {userRole?.role === 'OPR' && (
                <Box>
                  {/* Start Workflow */}
                  {isWorkflowNotStarted() && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<StartWorkflowIcon />}
                        onClick={startWorkflow}
                        sx={{ mb: 1 }}
                      >
                        📝 Start 8-Stage Workflow
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Begin Air Force publication workflow (DRAFT_CREATION)
                      </Typography>
                    </Box>
                  )}

                  {/* Submit for Coordination */}
                  <Box sx={{ mb: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color={canSubmitForCoordination() ? "success" : "inherit"}
                      disabled={workflowProcessing || !canSubmitForCoordination()}
                      startIcon={workflowProcessing ? <CircularProgress size={16} color="inherit" /> : <SubmitIcon />}
                      onClick={async () => {
                        if (!canSubmitForCoordination()) return;
                        try {
                          setWorkflowProcessing(true);
                          // console.log('🔄 WORKFLOW: Quick Actions - Submitting for coordination');
                          
                          // Determine which stage to go to based on current stage
                          let targetStage = '';
                          let targetStep = 0;
                          const currentBackendStage = getBackendStage(workflowStage);
                          
                          switch(currentBackendStage) {
                            case 'DRAFT_CREATION':
                            case 'OPR Creates':
                              targetStage = '1st Coordination';
                              targetStep = 2;
                              break;
                            case 'OPR_REVISIONS':
                            case 'OPR Revisions':
                              targetStage = '2nd Coordination';
                              targetStep = 4;
                              break;
                            case 'OPR_FINAL':
                            case 'OPR Final':
                              targetStage = 'Legal Review';
                              targetStep = 6;
                              break;
                            case 'OPR_LEGAL':
                            case 'OPR Legal':
                              targetStage = 'AFDPO Publish';
                              targetStep = 8;
                              break;
                            default:
                              console.error('Unknown stage for coordination:', currentBackendStage);
                              alert('Cannot submit from this stage');
                              setWorkflowProcessing(false);
                              return;
                          }
                          
                          // console.log('🔄 Advancing from', currentBackendStage, 'to', targetStage);
                          await handleWorkflowAdvancement(targetStage, targetStep);
                          
                        } catch (error) {
                          console.error('❌ WORKFLOW: Quick Actions advancement failed:', error);
                          alert('Failed to advance workflow. Please try again.');
                          setWorkflowProcessing(false);
                        }
                      }}
                      sx={{ mb: 1 }}
                    >
                      {workflowProcessing ? '⏳ Processing...' : 
                       canSubmitForCoordination() ? '🔄 Submit to Next Stage' : 
                       '✅ Waiting for Review'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {(() => {
                        if (!canSubmitForCoordination()) return 'Document is under review';
                        const currentBackendStage = getBackendStage(workflowStage);
                        switch(currentBackendStage) {
                          case 'DRAFT_CREATION': return 'Send to 1st Coordination (Internal)';
                          case 'OPR_REVISIONS': return 'Send to 2nd Coordination (External)';
                          case 'OPR_FINAL': return 'Send to Legal Review';
                          case 'OPR_LEGAL': return 'Send to Final Publishing';
                          default: return 'Ready to advance';
                        }
                      })()}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* ICU REVIEWER ACTIONS */}
              {userRole?.role === 'ICU_REVIEWER' && (workflowStage === 'INTERNAL_COORDINATION' || workflowStage === '1st Coordination') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    🔄 Internal Coordination Review
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: 'INTERNAL_COORDINATION',
                              toStage: 'OPR_REVISIONS',
                              transitionData: { reviewedBy: userRole?.email, decision: 'approved' }
                            })
                          });
                          if (response.ok) {
                            alert('Document sent to OPR for revisions!');
                            window.location.reload();
                          } else {
                            const errorData = await response.json();
                            alert(`Failed to approve document: ${errorData.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error approving document:', error);
                          alert('Error approving document');
                        }
                      }}
                      sx={{ mb: 1 }}
                    >
                      ✅ Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      onClick={async () => {
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: 'INTERNAL_COORDINATION',
                              toStage: 'OPR_REVISIONS',
                              transitionData: { reviewedBy: userRole?.email, decision: 'changes_requested' }
                            })
                          });
                          if (response.ok) {
                            alert('Document sent back for OPR revisions!');
                            window.location.reload();
                          } else {
                            const errorData = await response.json();
                            alert(`Failed to request changes: ${errorData.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error requesting changes:', error);
                          alert('Error requesting changes');
                        }
                      }}
                    >
                      📝 Request Changes
                    </Button>
                  </Box>
                </Box>
              )}

              {/* TECHNICAL REVIEWER ACTIONS */}
              {userRole?.role === 'TECHNICAL_REVIEWER' && (workflowStage === 'INTERNAL_COORDINATION' || workflowStage === '1st Coordination' || workflowStage === 'EXTERNAL_COORDINATION' || workflowStage === '2nd Coordination') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    ⚙️ Technical Review
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          const currentBackendStage = getBackendStage(workflowStage);
                          const nextStage = currentBackendStage === 'INTERNAL_COORDINATION' ? 'EXTERNAL_COORDINATION' : 'OPR_FINAL';
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: currentBackendStage,
                              toStage: nextStage,
                              transitionData: { reviewedBy: userRole?.email, decision: 'technical_approved' }
                            })
                          });
                          if (response.ok) {
                            alert(`Document advanced to ${nextStage}!`);
                            window.location.reload();
                          } else {
                            alert('Failed to approve document');
                          }
                        } catch (error) {
                          alert('Error approving document');
                        }
                      }}
                    >
                      ⚙️ Technical Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      onClick={async () => {
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: getBackendStage(workflowStage),
                              toStage: 'OPR_REVISIONS',
                              transitionData: { reviewedBy: userRole?.email, decision: 'technical_changes_requested' }
                            })
                          });
                          if (response.ok) {
                            alert('Document sent back for technical revisions!');
                            window.location.reload();
                          } else {
                            alert('Failed to request changes');
                          }
                        } catch (error) {
                          alert('Error requesting changes');
                        }
                      }}
                    >
                      🔧 Request Technical Changes
                    </Button>
                  </Box>
                </Box>
              )}

              {/* LEGAL REVIEWER ACTIONS */}
              {userRole?.role === 'LEGAL_REVIEWER' && (workflowStage === 'LEGAL_REVIEW' || workflowStage === 'Legal Review') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    ⚖️ Legal Review
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: 'LEGAL_REVIEW',
                              toStage: 'FINAL_PUBLISHING',
                              transitionData: { reviewedBy: userRole?.email, decision: 'legal_approved' }
                            })
                          });
                          if (response.ok) {
                            alert('Document approved for final publishing!');
                            window.location.reload();
                          } else {
                            alert('Failed to approve document');
                          }
                        } catch (error) {
                          alert('Error approving document');
                        }
                      }}
                    >
                      ⚖️ Legal Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      onClick={async () => {
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                            method: 'POST',
                            body: JSON.stringify({
                              fromStage: 'LEGAL_REVIEW',
                              toStage: 'OPR_LEGAL',
                              transitionData: { reviewedBy: userRole?.email, decision: 'legal_changes_requested' }
                            })
                          });
                          if (response.ok) {
                            alert('Document sent back for legal revisions!');
                            window.location.reload();
                          } else {
                            alert('Failed to request changes');
                          }
                        } catch (error) {
                          alert('Error requesting changes');
                        }
                      }}
                    >
                      📝 Request Legal Changes
                    </Button>
                  </Box>
                </Box>
              )}

              {/* PUBLISHER ACTIONS */}
              {userRole?.role === 'PUBLISHER' && workflowStage === 'FINAL_PUBLISHING' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    📰 Final Publishing
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/workflow/8-stage/advance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              workflowId: workflowId || documentId,
                              fromStage: 'FINAL_PUBLISHING',
                              toStage: 'PUBLISHED',
                              transitionData: { publishedBy: userRole?.email, publishDate: new Date().toISOString() }
                            })
                          });
                          if (response.ok) {
                            alert('Document published successfully!');
                            window.location.reload();
                          } else {
                            alert('Failed to publish document');
                          }
                        } catch (error) {
                          alert('Error publishing document');
                        }
                      }}
                    >
                      📰 Publish Document
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="info"
                    >
                      📅 Schedule Publishing
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ADMIN ACTIONS */}
              {/* console.log('🔐 ADMIN CHECK:', { userRole: userRole?.role, isAdmin: userRole?.role === 'WORKFLOW_ADMIN' || userRole?.role === 'ADMIN' || userRole?.role === 'Admin' }) */}
              {(userRole?.role === 'WORKFLOW_ADMIN' || userRole?.role === 'ADMIN' || userRole?.role === 'Admin') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="secondary">
                    👑 Admin Controls
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    {/* Admin can advance to next stage from any stage */}
                    {(() => {
                      const currentBackendStage = getBackendStage(workflowStage);
                      let nextStage = '';
                      let nextStageLabel = '';
                      
                      switch(currentBackendStage) {
                        case 'DRAFT_CREATION':
                          nextStage = 'INTERNAL_COORDINATION';
                          nextStageLabel = '1st Coordination';
                          break;
                        case 'INTERNAL_COORDINATION':
                          nextStage = 'OPR_REVISIONS';
                          nextStageLabel = 'OPR Revisions';
                          break;
                        case 'OPR_REVISIONS':
                          nextStage = 'EXTERNAL_COORDINATION';
                          nextStageLabel = '2nd Coordination';
                          break;
                        case 'EXTERNAL_COORDINATION':
                          nextStage = 'OPR_FINAL';
                          nextStageLabel = 'OPR Final';
                          break;
                        case 'OPR_FINAL':
                          nextStage = 'LEGAL_REVIEW';
                          nextStageLabel = 'Legal Review';
                          break;
                        case 'LEGAL_REVIEW':
                          nextStage = 'OPR_LEGAL';
                          nextStageLabel = 'OPR Legal';
                          break;
                        case 'OPR_LEGAL':
                          nextStage = 'FINAL_PUBLISHING';
                          nextStageLabel = 'Final Publishing';
                          break;
                        case 'FINAL_PUBLISHING':
                          nextStage = 'PUBLISHED';
                          nextStageLabel = 'Published';
                          break;
                      }
                      
                      if (nextStage && currentBackendStage !== 'PUBLISHED') {
                        return (
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={async () => {
                              try {
                                const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                                  method: 'POST',
                                  body: JSON.stringify({
                                    fromStage: currentBackendStage,
                                    toStage: nextStage,
                                    transitionData: { 
                                      adminOverride: true,
                                      advancedBy: userRole?.email,
                                      reason: 'Admin advancement'
                                    }
                                  })
                                });
                                if (response.ok) {
                                  alert(`Workflow advanced to ${nextStageLabel}!`);
                                  window.location.reload();
                                } else {
                                  const errorData = await response.json();
                                  alert(`Failed to advance workflow: ${errorData.message || 'Unknown error'}`);
                                }
                              } catch (error) {
                                alert('Error advancing workflow');
                              }
                            }}
                          >
                            ➡️ Advance to {nextStageLabel}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Move to Previous Stage */}
                    {workflowStage !== 'OPR Creates' && workflowStage !== 'DRAFT_CREATION' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={async () => {
                          const currentBackendStage = getBackendStage(workflowStage);
                          let previousStage = '';
                          let previousStageLabel = '';
                          
                          switch(currentBackendStage) {
                            case 'INTERNAL_COORDINATION':
                              previousStage = 'DRAFT_CREATION';
                              previousStageLabel = 'Draft Creation';
                              break;
                            case 'OPR_REVISIONS':
                              previousStage = 'INTERNAL_COORDINATION';
                              previousStageLabel = '1st Coordination';
                              break;
                            case 'EXTERNAL_COORDINATION':
                              previousStage = 'OPR_REVISIONS';
                              previousStageLabel = 'OPR Revisions';
                              break;
                            case 'OPR_FINAL':
                              previousStage = 'EXTERNAL_COORDINATION';
                              previousStageLabel = '2nd Coordination';
                              break;
                            case 'LEGAL_REVIEW':
                              previousStage = 'OPR_FINAL';
                              previousStageLabel = 'OPR Final';
                              break;
                            case 'OPR_LEGAL':
                              previousStage = 'LEGAL_REVIEW';
                              previousStageLabel = 'Legal Review';
                              break;
                            case 'FINAL_PUBLISHING':
                              previousStage = 'OPR_LEGAL';
                              previousStageLabel = 'OPR Legal';
                              break;
                            case 'PUBLISHED':
                              previousStage = 'FINAL_PUBLISHING';
                              previousStageLabel = 'Final Publishing';
                              break;
                          }
                          
                          if (!previousStage) return;
                          
                          try {
                            const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/move-backward/${workflowId || documentId}`, {
                              method: 'POST',
                              body: JSON.stringify({
                                fromStage: currentBackendStage,
                                toStage: previousStage,
                                reason: 'Admin moved workflow backward',
                                adminOverride: true
                              })
                            });
                            if (response.ok) {
                              alert(`Workflow moved back to ${previousStageLabel}!`);
                              window.location.reload();
                            } else {
                              const errorData = await response.json();
                              alert(`Failed to move backward: ${errorData.message || 'Unknown error'}`);
                            }
                          } catch (error) {
                            alert('Error moving workflow backward');
                          }
                        }}
                      >
                        ⬅️ Move to Previous Stage
                      </Button>
                    )}
                    
                    {/* Reset Workflow */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        if (!confirm('Are you sure you want to reset this workflow? This will move the document back to Draft Creation stage and clear all feedback.')) {
                          return;
                        }
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/reset/${workflowId || documentId}`, {
                            method: 'POST'
                          });
                          if (response.ok) {
                            alert('Workflow has been reset to Draft Creation stage!');
                            window.location.reload();
                          } else {
                            const errorData = await response.json();
                            alert(`Failed to reset workflow: ${errorData.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          alert('Error resetting workflow');
                        }
                      }}
                    >
                      🔄 Reset to Start
                    </Button>
                    
                    {/* Quick Jump to Any Stage - Dropdown buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Quick Jump to Stage:
                      </Typography>
                      {[
                        { value: 'DRAFT_CREATION', label: 'Draft Creation' },
                        { value: 'INTERNAL_COORDINATION', label: '1st Coordination' },
                        { value: 'OPR_REVISIONS', label: 'OPR Revisions' },
                        { value: 'EXTERNAL_COORDINATION', label: '2nd Coordination' },
                        { value: 'OPR_FINAL', label: 'OPR Final' },
                        { value: 'LEGAL_REVIEW', label: 'Legal Review' },
                        { value: 'OPR_LEGAL', label: 'OPR Legal' },
                        { value: 'FINAL_PUBLISHING', label: 'Final Publishing' },
                        { value: 'PUBLISHED', label: 'Published' }
                      ].map((stage) => {
                        const currentBackendStage = getBackendStage(workflowStage);
                        const isCurrent = stage.value === currentBackendStage;
                        
                        return (
                          <Button
                            key={stage.value}
                            size="small"
                            variant={isCurrent ? "contained" : "outlined"}
                            color={isCurrent ? "primary" : "secondary"}
                            disabled={isCurrent}
                            onClick={async () => {
                              try {
                                const response = await authTokenService.authenticatedFetch(`/api/workflow/8-stage/advance/${workflowId || documentId}`, {
                                  method: 'POST',
                                  body: JSON.stringify({
                                    fromStage: currentBackendStage,
                                    toStage: stage.value,
                                    transitionData: { 
                                      adminOverride: true,
                                      jumpedBy: userRole?.email,
                                      reason: 'Admin direct jump'
                                    }
                                  })
                                });
                                if (response.ok) {
                                  alert(`Workflow jumped to ${stage.label}!`);
                                  window.location.reload();
                                } else {
                                  const errorData = await response.json();
                                  alert(`Failed to jump to stage: ${errorData.message || 'Unknown error'}`);
                                }
                              } catch (error) {
                                alert('Error jumping to stage');
                              }
                            }}
                            sx={{ 
                              justifyContent: 'flex-start',
                              fontSize: '0.75rem',
                              py: 0.5
                            }}
                          >
                            {isCurrent ? '✓ ' : '→ '}{stage.label}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* No Actions Available */}
              {!userRole?.role || (
                userRole?.role !== 'OPR' && 
                userRole?.role !== 'ICU_REVIEWER' && 
                userRole?.role !== 'TECHNICAL_REVIEWER' && 
                userRole?.role !== 'LEGAL_REVIEWER' && 
                userRole?.role !== 'PUBLISHER' && 
                userRole?.role !== 'WORKFLOW_ADMIN' &&
                userRole?.role !== 'ADMIN' &&
                userRole?.role !== 'Admin'
              ) && (
                <Alert severity="info">
                  No workflow actions available for your current role.
                </Alert>
              )}

            </Paper>

            {/* Workflow Tasks Component */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <WorkflowTasks documentId={documentId} />
            </Paper>

            {/* Document Versions */}
            <Paper id="version-history" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📃 Version History
              </Typography>
              {documentData && currentUserId ? (
                <DocumentVersions 
                  documentId={documentId} 
                  document={documentData}
                  currentUserId={currentUserId}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading version history...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DocumentViewPage;