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
import OPRFeedbackProcessor from '../../../components/feedback/OPRFeedbackProcessor';
import { api } from '../../../lib/api';
import { authTokenService } from '../../../lib/authTokenService';
import CRMFeedbackForm from '../../../components/feedback/CRMFeedbackForm';
import { JsonWorkflowDisplay } from '../../../components/workflow/JsonWorkflowDisplay';
import { useRef } from 'react';

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
  const jsonWorkflowResetRef = useRef<(() => Promise<void>) | null>(null);

  // Define the 8-stage workflow steps
  // Updated for 11-stage hierarchical workflow
  const workflowSteps = [
    'Initial Draft',           // Stage 1
    'PCM Review',              // Stage 2
    'First Coordination',      // Stage 3
    'Review Collection',       // Stage 3.5
    'OPR Feedback',           // Stage 4
    'Second Coordination',     // Stage 5
    'Second Review',          // Stage 5.5
    'Second OPR Feedback',    // Stage 6
    'Legal Review',           // Stage 7
    'Post-Legal OPR',         // Stage 8
    'Leadership Review',      // Stage 9
    'AFDPO Publication'       // Stage 10
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

    // Updated for 11-stage hierarchical workflow
    const roleRequirements = {
      1: ['ADMIN', 'ACTION_OFFICER'],         // Stage 1: Initial Draft
      2: ['ADMIN', 'PCM'],                    // Stage 2: PCM Review
      3: ['ADMIN', 'COORDINATOR'],            // Stage 3: First Coordination
      3.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 3.5: Review Collection
      4: ['ADMIN', 'ACTION_OFFICER'],         // Stage 4: OPR Feedback
      5: ['ADMIN', 'COORDINATOR'],            // Stage 5: Second Coordination
      5.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 5.5: Second Review
      6: ['ADMIN', 'ACTION_OFFICER'],         // Stage 6: Second OPR Feedback
      7: ['ADMIN', 'LEGAL'],                  // Stage 7: Legal Review
      8: ['ADMIN', 'ACTION_OFFICER'],         // Stage 8: Post-Legal OPR
      9: ['ADMIN', 'LEADERSHIP'],             // Stage 9: Leadership Review
      10: ['ADMIN', 'AFDPO', 'PUBLISHER']     // Stage 10: AFDPO Publication
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
            'FINAL_PUBLISHING': 'AFDPO Publish',
            // New stages for hierarchical workflow
            '1': 'Initial Draft Preparation',
            '2': 'PCM Review',
            '3': 'First Coordination Distribution',
            '3.5': 'First Review Collection',
            '4': 'OPR Feedback Incorporation',
            '5': 'Second Coordination Distribution',
            '5.5': 'Second Review Collection',
            '6': 'Second OPR Feedback Incorporation',
            '7': 'Legal Review',
            '8': 'Post-Legal OPR Update',
            '9': 'OPR Leadership Review',
            '10': 'AFDPO Publication'
          };

          const frontendStage = stageMapping[backendStage as keyof typeof stageMapping] || backendStage || 'OPR Creates';
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

      const response = await authTokenService.authenticatedFetch(`/api/workflow/documents/${documentId}/workflow/initialize`, {
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
      const response = await authTokenService.authenticatedFetch(`/api/workflow/documents/${documentId}/workflow/status?t=${Date.now()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 WORKFLOW: Status response:', data);

        if (data.success && data.workflow) {
          setWorkflowActive(data.workflow.is_active);
          setWorkflowStage(data.workflow.current_stage);
          setWorkflowId(data.workflow.id);
          console.log('🔍 WORKFLOW: State updated:', {
            active: data.workflow.is_active,
            stage: data.workflow.current_stage,
            id: data.workflow.id
          });
        } else {
          console.log('❌ WORKFLOW: No workflow data in response or success=false');
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
      const response = await authTokenService.authenticatedFetch(`/api/workflow/documents/${documentId}/workflow/action`, {
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
        console.log('🔍 DEBUG: Document data:', {
          id: data.document.id,
          status: data.document.status,
          title: data.document.title,
          workflowInstanceId: data.document.workflowInstanceId
        });
        console.log('🔍 DEBUG: Is document status PUBLISHED?', data.document.status === 'PUBLISHED');
        setDocumentData(data.document);
        // Only consider document published if workflow is not active or completed
        // If workflow is active and not at final stage, show workflow UI instead
        const hasActiveWorkflow = data.document.workflowInstanceId && data.document.status !== 'COMPLETED';
        setIsDocumentPublished(data.document.status === 'PUBLISHED' && !hasActiveWorkflow);
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
    
    // Role-based stage responsibility mapping (11-stage workflow)
    const stageRoles: Record<number, string[]> = {
      1: ['ADMIN', 'ACTION_OFFICER'],         // Stage 1: Initial Draft
      2: ['ADMIN', 'PCM'],                    // Stage 2: PCM Review
      3: ['ADMIN', 'COORDINATOR'],            // Stage 3: First Coordination
      3.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 3.5: Review Collection
      4: ['ADMIN', 'ACTION_OFFICER'],         // Stage 4: OPR Feedback
      5: ['ADMIN', 'COORDINATOR'],            // Stage 5: Second Coordination
      5.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 5.5: Second Review
      6: ['ADMIN', 'ACTION_OFFICER'],         // Stage 6: Second OPR Feedback
      7: ['ADMIN', 'LEGAL'],                  // Stage 7: Legal Review
      8: ['ADMIN', 'ACTION_OFFICER'],         // Stage 8: Post-Legal OPR
      9: ['ADMIN', 'LEADERSHIP'],             // Stage 9: Leadership Review
      10: ['ADMIN', 'AFDPO', 'PUBLISHER']     // Stage 10: AFDPO Publication
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
            🔄 Workflow Progress
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
          🚀 Start Workflow
        </Button>
      );
    }

    // Stage-specific action buttons
    const renderStageButtons = () => {
      console.log('🔍 DEBUG renderStageButtons: workflowStage =', workflowStage);

      // If workflowStage is "PUBLISHED" but workflow is active, it's a mismatch
      // This can happen when document status is PUBLISHED but workflow is still active
      // In this case, don't show the published UI
      if (workflowStage === 'PUBLISHED' && workflowActive) {
        console.log('⚠️ WARNING: Document status is PUBLISHED but workflow is active. Not showing published UI.');
        return (
          <Alert severity="warning">
            Workflow is in progress. Please use the workflow controls to advance stages.
          </Alert>
        );
      }

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
              onClick={() => handleWorkflowAdvancement('AFDPO Publication', 10)}
              disabled={workflowStage !== '9' && workflowStage !== 'OPR Leadership Final Review'} // Only enable after Leadership review (stage 9)
            >
              📤 Send to AFDPO
            </Button>
          ) : (
            <Alert severity="warning">
              {getStageRequirementMessage(7)}
            </Alert>
          );

        case '6':
        case 'Second OPR Feedback Incorporation':
          // Stage 6 - Second OPR Feedback Incorporation
          return canAdvance ? (
            <div>
              <Typography variant="h6" gutterBottom>
                Second OPR Feedback Incorporation
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Action Officer is incorporating second round feedback.
                Use the workflow buttons to advance when ready.
              </Typography>
            </div>
          ) : (
            <Alert severity="info">
              Waiting for Action Officer to incorporate second round feedback.
            </Alert>
          );

        case 'AFDPO Publish':
        case 'FINAL_PUBLISHING':
        case 'AFDPO Publication':
        case '10':
        case 'PUBLISHED':  // Handle when document status is truly published
          // Final stage - document is published
          return (
            <Card sx={{
              bgcolor: 'success.light',
              color: 'white',
              p: 3,
              textAlign: 'center',
              border: '2px solid #4caf50'
            }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
                  ✅ Document Published
                </Typography>
                <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
                  🎉 Published & Complete
                </Typography>
                <Typography variant="body1" sx={{ color: 'success.dark' }}>
                  This document has been successfully published to AFDPO and is now complete.
                </Typography>
                {canAdvance && !isDocumentPublished && (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      setIsDocumentPublished(true);
                      alert('Document publication status updated!');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Mark as Published
                  </Button>
                )}
              </CardContent>
            </Card>
          );

        default:
          // Handle new hierarchical workflow stages
          return (
            <Alert severity="info">
              <Typography variant="subtitle1">
                Current Stage: {workflowStage}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please use the workflow buttons above to advance to the next stage when ready.
              </Typography>
            </Alert>
          );
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

                {/* OPR Review - Only visible to OPR and ADMIN users */}
                {(userRole?.role === 'OPR' || userRole?.role === 'ADMIN' || userRole?.role === 'Admin') && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<AssignmentIcon />}
                    onClick={() => router.push(`/documents/${documentId}/opr-review`)}
                    sx={{ minWidth: 150 }}
                  >
                    OPR Review
                  </Button>
                )}

                {/* Start/Continue Workflow - Removed (Using JSON workflows) */}

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

              {/* JSON-Based Workflow System */}
              <JsonWorkflowDisplay 
                documentId={documentId}
                userRole={userRole?.roleType || userRole?.role || 'USER'}
                onWorkflowChange={(instance) => {
                  // Update old workflow state to maintain compatibility
                  console.log('🔍 DEBUG onWorkflowChange: Instance received:', instance);
                  if ((instance as any).isActive || (instance as any).active) {
                    setWorkflowActive(true);
                    // Don't use document status as workflow stage - use actual workflow stage
                    const stageName = instance.currentStageName || '';
                    console.log('🔍 DEBUG onWorkflowChange: Setting stage to:', stageName, 'from instance:', instance);

                    // If the stage name is "PUBLISHED" but workflow is active,
                    // this is likely the document status, not the workflow stage
                    if (stageName === 'PUBLISHED' && instance.currentStageId) {
                      console.log('⚠️ WARNING: Stage name is PUBLISHED but workflow is active. Using stage ID:', instance.currentStageId);
                      // Map the stage ID to the correct stage name
                      const stageIdToName: Record<string, string> = {
                        '1': 'OPR Creates',
                        '2': '1st Coordination',
                        '3': 'Legal Review',
                        '4': 'OPR Feedback Incorporation',
                        '5': 'OPR Leadership Review',
                        '6': 'Second OPR Feedback Incorporation',
                        '7': 'Final Coordination',
                        '8': 'Final Legal Review',
                        '9': 'OPR Leadership Review',
                        '10': 'AFDPO Publication'
                      };
                      const mappedStage = stageIdToName[instance.currentStageId] || stageName;
                      setWorkflowStage(mappedStage);
                    } else {
                      setWorkflowStage(stageName);
                    }
                  } else {
                    setWorkflowActive(false);
                    setWorkflowStage('');
                  }
                }}
                onResetRef={(resetFn) => {
                  jsonWorkflowResetRef.current = resetFn;
                }}
              />
              
              {/* OLD 8-Stage Workflow (Disabled - using JSON workflows now) */}
              {/* {renderWorkflowProgress()} */}

              {/* Workflow Action Buttons - Disabled for JSON workflows */}
              {/* {renderWorkflowButtons()} */}

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

            {/* OPR Feedback Processor - Only visible to OPR users */}
            {(userRole?.role === 'OPR' || userRole?.role === 'ADMIN') && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  🤖 AI-Powered Feedback Processing
                </Typography>
                <OPRFeedbackProcessor documentId={documentId} documentTitle={documentData?.title || ''} />
              </Paper>
            )}
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

              {/* OPR ROLE ACTIONS - Disabled (Using JSON workflows) */}
              {userRole?.role === 'OPR' && (
                <Box>
                  <Alert severity="info">
                    OPR actions are managed through the JSON workflow system above.
                  </Alert>
                </Box>
              )}

              {/* ICU REVIEWER ACTIONS - Disabled (Using JSON workflows) */}
              {userRole?.role === 'ICU_REVIEWER' && (workflowStage === 'INTERNAL_COORDINATION' || workflowStage === '1st Coordination') && (
                <Box>
                  <Alert severity="info">
                    Review actions are managed through the JSON workflow system above.
                  </Alert>
                </Box>
              )}

              {/* TECHNICAL REVIEWER ACTIONS - Disabled (Using JSON workflows) */}
              {userRole?.role === 'TECHNICAL_REVIEWER' && (workflowStage === 'INTERNAL_COORDINATION' || workflowStage === '1st Coordination' || workflowStage === 'EXTERNAL_COORDINATION' || workflowStage === '2nd Coordination') && (
                <Box>
                  <Alert severity="info">
                    Technical review actions are managed through the JSON workflow system above.
                  </Alert>
                </Box>
              )}

              {/* LEGAL REVIEWER ACTIONS - Disabled (Using JSON workflows) */}
              {userRole?.role === 'LEGAL_REVIEWER' && (workflowStage === 'LEGAL_REVIEW' || workflowStage === 'Legal Review') && (
                <Box>
                  <Alert severity="info">
                    Legal review actions are managed through the JSON workflow system above.
                  </Alert>
                </Box>
              )}

              {/* PUBLISHER ACTIONS - Disabled (Using JSON workflows) */}
              {userRole?.role === 'PUBLISHER' && workflowStage === 'FINAL_PUBLISHING' && (
                <Box>
                  <Alert severity="info">
                    Publishing actions are managed through the JSON workflow system above.
                  </Alert>
                </Box>
              )}

              {/* ADMIN ACTIONS - Simplified for JSON Workflows */}
              {(userRole?.role === 'WORKFLOW_ADMIN' || userRole?.role === 'ADMIN' || userRole?.role === 'Admin') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="secondary">
                    👑 Admin Controls
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    {/* Admin controls are now handled by the JSON workflow system */}
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Workflow controls are managed through the JSON workflow system above.
                      Use the workflow actions in the main workflow display.
                    </Alert>
                    
                    {/* Reset Workflow - Now uses JSON workflow reset */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        if (!confirm('Are you sure you want to reset this workflow? This will move the document back to the beginning.')) {
                          return;
                        }
                        if (jsonWorkflowResetRef.current) {
                          try {
                            await jsonWorkflowResetRef.current();
                            alert('Workflow has been reset to the beginning!');
                            // Force page refresh to show updated workflow state
                            window.location.reload();
                          } catch (error) {
                            console.error('Error resetting workflow:', error);
                            alert('Failed to reset workflow. Please try again.');
                          }
                        } else {
                          alert('Reset function not available. Please refresh the page.');
                        }
                      }}
                    >
                      🔄 Reset to Start
                    </Button>
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
              <WorkflowTasks />
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