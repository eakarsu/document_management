import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authTokenService } from '@/lib/authTokenService';
import { api } from '@/lib/api';
import { DocumentDetails, UserRole, WorkflowState, FeedbackState, UIState } from './types';
import { getBackendStage, stageMapping, roleRequirements } from './workflowConstants';

export const useDocumentView = (documentId: string) => {
  const router = useRouter();
  const jsonWorkflowResetRef = useRef<(() => Promise<void>) | null>(null);

  // Core state
  const [documentData, setDocumentData] = useState<DocumentDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // UI state
  const [uiState, setUIState] = useState<UIState>({
    loading: true,
    error: null,
    statusMenuAnchor: null,
    isDocumentPublished: false
  });

  // Workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    active: false,
    stage: '',
    id: '',
    processing: false,
    history: [],
    currentWorkflow: null,
    canMoveBackward: false,
    buttonRenderKey: 0
  });

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    coordinatorInput: '',
    legalInput: '',
    actualCoordinatorFeedback: null,
    actualLegalFeedback: null,
    documentContentInput: '',
    savedDocumentContent: null
  });

  // Utility functions
  const getStageNumber = (stage: string): number => {
    const workflowSteps = [
      'Initial Draft', 'PCM Review', 'First Coordination', 'Review Collection',
      'OPR Feedback', 'Second Coordination', 'Second Review', 'Second OPR Feedback',
      'Legal Review', 'Post-Legal OPR', 'Leadership Review', 'AFDPO Publication'
    ];
    const stageIndex = workflowSteps.findIndex(step => step === stage);
    return stageIndex >= 0 ? stageIndex + 1 : 1;
  };

  const canUserAdvanceFromStage = (stageNumber: number): boolean => {
    if (!userRole) return false;
    const requiredRoles = roleRequirements[stageNumber as keyof typeof roleRequirements] || [];
    const userRoleType = userRole.roleType || userRole.role;
    return requiredRoles.includes(userRoleType);
  };

  const getStageRequirementMessage = (stageNumber: number): string => {
    const roleRequirementsMap = {
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

    return `${stageNames[stageNumber]} stage requires ${roleRequirementsMap[stageNumber as keyof typeof roleRequirementsMap] || 'authorized personnel'}. Your role: ${userRole?.role || 'Unknown'}`;
  };

  const canSubmitForCoordination = () => {
    return workflowState.stage === 'OPR Creates' ||
           workflowState.stage === 'DRAFT_CREATION' ||
           workflowState.stage === 'OPR Revisions' ||
           workflowState.stage === 'OPR_REVISIONS' ||
           workflowState.stage === 'OPR Final' ||
           workflowState.stage === 'OPR_FINAL' ||
           workflowState.stage === 'OPR Legal' ||
           workflowState.stage === 'OPR_LEGAL';
  };

  const isWorkflowNotStarted = () => {
    return !workflowState.active ||
           workflowState.stage === 'Not Started' ||
           workflowState.stage === '' ||
           !workflowState.stage;
  };

  // Fetch user info
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email);
        const roleName = data.user.role?.name || 'Unknown';
        setUserRole({
          role: roleName,
          roleType: data.user.role?.roleType || data.user.role?.name || 'ADMIN',
          email: data.user.email || ''
        });
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('Authentication error:', error.message);
        // Use hard redirect for authentication failures
        window.location.href = '/login';
      } else {
        console.error('Error fetching user info:', error);
        setUserRole({
          role: 'Admin',
          roleType: 'ADMIN',
          email: 'admin@example.com'
        });
      }
    }
  }, [router]);

  // Fetch document data
  const fetchDocumentData = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);

      if (response.ok) {
        const data = await response.json();
        setDocumentData(data.document);
        const hasActiveWorkflow = data.document.workflowInstanceId && data.document.status !== 'COMPLETED';
        setUIState(prev => ({
          ...prev,
          isDocumentPublished: data.document.status === 'PUBLISHED' && !hasActiveWorkflow
        }));
      } else {
        throw new Error('Failed to fetch document data');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        window.location.href = '/login';
      } else {
        console.error('Error fetching document data:', error);
        setUIState(prev => ({ ...prev, error: 'Failed to load document data' }));
      }
    }
  }, [documentId, router]);

  // Fetch workflow feedback
  const fetchWorkflowFeedback = useCallback(async () => {
    try {
      // Call backend 12-stage workflow directly (nginx routes /api/ to backend)
      const response = await fetch(
        `/api/workflow/documents/${documentId}/workflow/status`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${authTokenService.getAccessToken()}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.workflow) {
          const workflow = data.workflow;

          // Extract ICU feedback
          if (workflow.internal_coordinating_users && workflow.internal_coordinating_users.length > 0) {
            const icuFeedback = workflow.internal_coordinating_users.find((icu: any) => icu.feedback);
            if (icuFeedback) {
              setFeedbackState(prev => ({ ...prev, actualCoordinatorFeedback: icuFeedback.feedback }));
            }
          }

          // Extract legal feedback
          if (workflow.stage_transitions) {
            const legalTransition = workflow.stage_transitions.find((st: any) =>
              st.transition_data && st.transition_data.legalFeedback
            );
            if (legalTransition) {
              setFeedbackState(prev => ({ ...prev, actualLegalFeedback: legalTransition.transition_data.legalFeedback }));
            }
          }

          // Update workflow stage
          const backendStage = workflow.current_stage;
          const frontendStage = stageMapping[backendStage as keyof typeof stageMapping] || backendStage || 'OPR Creates';
          setWorkflowState(prev => ({
            ...prev,
            stage: frontendStage,
            active: true
          }));

          return workflow;
        }
      } else if (response.status === 401) {
        console.error('Authentication failed - redirecting to login');
        window.location.href = '/login';
        return null;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('Authentication error:', error.message);
        alert(error.message);
        window.location.href = '/login';
      } else {
        console.error('Error fetching feedback:', error);
      }
    }
    return null;
  }, [documentId, router]);

  // Fetch workflow status
  const fetchWorkflowStatus = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/workflow/documents/${documentId}/workflow/status?t=${Date.now()}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.workflow) {
          setWorkflowState(prev => ({
            ...prev,
            active: data.workflow.is_active,
            stage: data.workflow.current_stage,
            id: data.workflow.id
          }));
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('Authentication error, redirecting to login');
        window.location.href = '/login';
      } else {
        console.error('Error fetching workflow status:', error);
      }
    }
  }, [documentId, router]);

  // Start workflow
  const startWorkflow = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/workflow/documents/${documentId}/workflow/initialize`,
        {
          method: 'POST',
          body: JSON.stringify({ documentType: 'standard' })
        }
      );

      if (response.ok) {
        setWorkflowState(prev => ({
          ...prev,
          active: true,
          stage: 'Initial Draft'
        }));
        await fetchWorkflowStatus();
        alert('12-stage workflow started successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start workflow');
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      alert('Failed to start workflow. Please try again.');
    }
  }, [documentId, fetchWorkflowStatus]);

  // Handle workflow advancement
  const handleWorkflowAdvancement = useCallback(async (nextStage: string, currentStep: number) => {
    try {
      setWorkflowState(prev => ({ ...prev, processing: true }));

      // Save document content first if provided
      if (feedbackState.documentContentInput.trim()) {
        const contentResponse = await fetch('/api/workflow-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            documentId: documentId,
            documentContent: feedbackState.documentContentInput
          })
        });

        if (contentResponse.ok) {
          setFeedbackState(prev => ({ ...prev, savedDocumentContent: prev.documentContentInput }));
        }
      }

      // Update workflow state
      const response = await authTokenService.authenticatedFetch(
        `/api/workflow/documents/${documentId}/workflow/action`,
        {
          method: 'POST',
          body: JSON.stringify({
            fromStage: workflowState.stage,
            toStage: getBackendStage(nextStage),
            transitionData: {
              step: currentStep,
              advancedBy: currentUserEmail,
              timestamp: new Date().toISOString()
            }
          })
        }
      );

      if (response.ok) {
        setWorkflowState(prev => ({
          ...prev,
          stage: nextStage,
          buttonRenderKey: prev.buttonRenderKey + 1
        }));

        await fetchWorkflowFeedback();
        alert(`Document moved to ${nextStage} stage`);
      } else {
        throw new Error('Failed to advance workflow');
      }
    } catch (error) {
      console.error('Error advancing workflow:', error);
      alert('Failed to advance workflow. Please try again.');
    } finally {
      setWorkflowState(prev => ({ ...prev, processing: false }));
    }
  }, [documentId, currentUserEmail, workflowState.stage, feedbackState.documentContentInput, fetchWorkflowFeedback]);

  // Save workflow feedback
  const saveWorkflowFeedback = useCallback(async (stage: string, feedback: string) => {
    try {
      if (stage === '1st Coordination') {
        const response = await fetch('/api/workflow-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          setFeedbackState(prev => ({ ...prev, actualCoordinatorFeedback: feedback }));
        } else {
          throw new Error(`Failed to save coordinator feedback: ${response.status}`);
        }
      } else if (stage === 'Legal Review') {
        setFeedbackState(prev => ({ ...prev, actualLegalFeedback: feedback }));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        console.error('Authentication error:', error.message);
        alert(error.message);
        window.location.href = '/login';
      } else {
        console.error('Error saving feedback:', error);
        alert('Failed to save feedback. Please try again.');
      }
    }
  }, [documentId, router]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setUIState(prev => ({ ...prev, loading: true }));
      try {
        const tokenInfo = authTokenService.getTokenInfo();
        if (!tokenInfo.accessToken || !tokenInfo.isValid) {
          console.log('No valid token found, redirecting to login');
          window.location.href = '/login';
          return;
        }

        await Promise.all([
          fetchUserInfo(),
          fetchDocumentData(),
          fetchWorkflowFeedback(),
          fetchWorkflowStatus()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setUIState(prev => ({ ...prev, error: 'Failed to load page data' }));
      } finally {
        setUIState(prev => ({ ...prev, loading: false }));
      }
    };

    if (documentId) {
      loadData();
    }
  }, [documentId, router, fetchUserInfo, fetchDocumentData, fetchWorkflowFeedback, fetchWorkflowStatus]);

  // Window focus handler
  useEffect(() => {
    const handleFocus = async () => {
      try {
        await Promise.all([fetchWorkflowStatus(), fetchUserInfo()]);
      } catch (error) {
        console.error('Error refreshing on focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchWorkflowStatus, fetchUserInfo]);

  return {
    // State
    documentData,
    currentUserId,
    currentUserEmail,
    userRole,
    uiState,
    workflowState,
    feedbackState,
    jsonWorkflowResetRef,

    // Actions
    setUIState,
    setWorkflowState,
    setFeedbackState,
    fetchDocumentData,
    startWorkflow,
    handleWorkflowAdvancement,
    saveWorkflowFeedback,

    // Utilities
    getStageNumber,
    canUserAdvanceFromStage,
    getStageRequirementMessage,
    canSubmitForCoordination,
    isWorkflowNotStarted
  };
};