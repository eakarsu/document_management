import React, { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  NavigateNext,
  NavigateBefore,
  Info,
  Assignment,
  AccessTime
} from '@mui/icons-material';
import { api } from '../../lib/api';
import DistributionModal from '../DistributionModal';

// Global instance tracker to ensure only one workflow component per document
const globalInstances = new Map<string, boolean>();

interface WorkflowStage {
  id: string;
  name: string;
  type: string;
  order: number;
  required: boolean;
  roles: string[];
  actions: Array<{
    id: string;
    label: string;
    target: string;
    condition?: string;
  }>;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  stages: WorkflowStage[];
  transitions: Array<{
    id: string;
    from: string;
    to: string;
    label: string;
    condition?: string;
  }>;
  settings: {
    allowSkip: boolean;
    requireComments: boolean;
    notifyOnStageChange: boolean;
    timeoutHours: number;
  };
}

interface WorkflowInstance {
  active: boolean;
  workflowId?: string;
  workflowName?: string;
  currentStageId?: string;
  currentStageName?: string;
  currentStageType?: string;
  stageOrder?: number;
  totalStages?: number;
  history?: Array<{
    id: string;
    stageId: string;
    stageName: string;
    action: string;
    performedBy: string;
    createdAt: string;
    metadata?: any;
  }>;
  metadata?: any;
  startedAt?: string;
  updatedAt?: string;
}

interface JsonWorkflowDisplayProps {
  documentId: string;
  userRole?: string;
  onWorkflowChange?: (instance: WorkflowInstance) => void;
  onResetRef?: (reset: () => Promise<void>) => void;
}

export const JsonWorkflowDisplay: React.FC<JsonWorkflowDisplayProps> = ({
  documentId,
  userRole = 'USER',
  onWorkflowChange,
  onResetRef
}) => {
  // HOOKS FIRST - Always call hooks in the same order
  const [loading, setLoading] = useState(true);
  const [workflowDef, setWorkflowDef] = useState<WorkflowDefinition | null>(null);
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [forceStage8, setForceStage8] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [clickedButtons, setClickedButtons] = useState<Set<string>>(new Set());
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  // PERMANENT FIX: Default to 10-stage hierarchical workflow
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('hierarchical-distributed-workflow');
  const [selectWorkflowDialog, setSelectWorkflowDialog] = useState(false);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);

  // PERMANENT FIX: Removed hardcoded workflow options
  // Workflows are now loaded from backend only

  // SINGLETON PATTERN - After all hooks
  const instanceKey = `${documentId}-${userRole}`;
  const isFirstInstance = useRef(false);
  const isDuplicate = globalInstances.has(instanceKey);

  if (!isDuplicate) {
    globalInstances.set(instanceKey, true);
    isFirstInstance.current = true;
  }

  // Fetch workflow instance and definition
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get workflow instance for this document
      const instanceResponse = await api.get(`/api/workflow-instances/${documentId}`);
      if (!instanceResponse.ok) {
        throw new Error('Failed to fetch workflow instance');
      }

      const instance = await instanceResponse.json();
      console.log('📊 WORKFLOW INSTANCE FROM API:', {
        active: instance.active,
        isActive: instance.isActive,
        workflowId: instance.workflowId,
        currentStageId: instance.currentStageId,
        user: userRole
      });
      setWorkflowInstance(instance);

      if (instance.active && instance.workflowId) {
        // Fetch workflow definition
        const defResponse = await api.get(`/api/workflows/${instance.workflowId}`);
        if (!defResponse.ok) {
          throw new Error('Failed to fetch workflow definition');
        }

        const definition = await defResponse.json();
        setWorkflowDef(definition);
      }

      if (onWorkflowChange) {
        onWorkflowChange(instance);
      }
    } catch (err) {
      console.error('Error fetching workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchAvailableWorkflows();
    // Removed auto-refresh - workflow updates will be fetched on user actions

    // Cleanup function to remove instance from global tracker
    return () => {
      if (isFirstInstance.current) {
        globalInstances.delete(instanceKey);
      }
    };
  }, [documentId]);

  // Expose reset function to parent
  useEffect(() => {
    if (onResetRef) {
      onResetRef(resetWorkflow);
    }
  }, [onResetRef]);

  // Fetch available workflows
  const fetchAvailableWorkflows = async () => {
    try {
      const response = await api.get('/api/workflows');
      if (response.ok) {
        const workflows = await response.json();
        console.log('📋 WORKFLOWS FROM BACKEND:', workflows);
        setAvailableWorkflows(workflows);

        // PERMANENT FIX: Don't override with hardcoded options
        // Use the workflows from the backend
      }
    } catch (err) {
      console.error('Error fetching available workflows:', err);
      // PERMANENT FIX: Don't use hardcoded options on error
      // Let the backend provide the workflows
    }
  };

  // Start a new workflow
  const startWorkflow = async (workflowId: string = selectedWorkflowId) => {
    try {
      setProcessing(true);
      setError(null);

      console.log('🚀 STARTING WORKFLOW:', workflowId);
      console.log('Selected workflow ID:', selectedWorkflowId);

      const response = await api.post(`/api/workflow-instances/${documentId}/start`, {
        workflowId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start workflow');
      }

      await fetchWorkflow();
      
      // Also trigger the onWorkflowChange callback to refresh parent component
      if (onWorkflowChange) {
        const updatedData = await api.get(`/api/workflow-instances/${documentId}`);
        const updatedInstance = await updatedData.json();
        onWorkflowChange(updatedInstance);
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    } finally {
      setProcessing(false);
    }
  };

  // Reset workflow to beginning
  const resetWorkflow = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await api.post(`/api/workflow-instances/${documentId}/reset`, {});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset workflow');
      }

      // PERMANENT FIX: After reset, set workflow to null/inactive state
      // Don't auto-fetch or auto-start - let user manually start when ready
      setWorkflowInstance(null);
      setWorkflowDef(null);

      // Notify parent that workflow is now inactive
      if (onWorkflowChange) {
        onWorkflowChange({
          active: false,
          workflowId: null,
          message: 'Workflow reset. Start a new workflow to continue.'
        } as WorkflowInstance);
      }

      // Success message
      console.log('Workflow reset successfully. Ready to start new workflow.');
    } catch (err) {
      console.error('Error resetting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset workflow');
      throw err; // Re-throw to let parent handle it
    } finally {
      setProcessing(false);
    }
  };

  // Advance workflow to next stage
  const advanceWorkflow = async (targetStageId: string | null, action: string, additionalData?: any) => {
    const buttonId = `${targetStageId || 'complete'}-${action}`;
    try {
      setProcessing(true);
      setError(null);

      // Mark this button as clicked
      setClickedButtons(prev => new Set(prev).add(buttonId));

      const metadata: any = {};
      if (comment) {
        metadata.comment = comment;
      }

      // Merge additional data (like completeWorkflow flag)
      if (additionalData) {
        Object.assign(metadata, additionalData);
      }

      const response = await api.post(`/api/workflow-instances/${documentId}/advance`, {
        targetStageId,
        action,
        metadata
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to advance workflow');
      }

      setComment('');
      await fetchWorkflow();
      
      // Clear clicked buttons after successful workflow advancement
      setClickedButtons(new Set());
    } catch (err) {
      console.error('Error advancing workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to advance workflow');
      
      // Remove the button from clicked state on error so user can retry
      setClickedButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(buttonId);
        return newSet;
      });
    } finally {
      setProcessing(false);
    }
  };

  // Submit review for Stage 3.5 reviewers
  const submitReview = async (feedback: string, approved: boolean) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await api.post(`/api/workflows/documents/${documentId}/submit-review`, {
        workflowInstanceId: (workflowInstance as any)?.id,
        feedback,
        approved
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      // Refresh workflow after successful review submission
      await fetchWorkflow();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setProcessing(false);
    }
  };

  // Check if user can perform actions on current stage
  const canUserAct = (stage: WorkflowStage): boolean => {
    const normalizedRole = userRole?.toUpperCase();
    if (normalizedRole === 'ADMIN') return true;

    // PERMANENT FIX: Support both 'roles' array and 'assignedRole' string
    if (stage.roles) {
      return stage.roles.some(r => r?.toLowerCase() === userRole?.toLowerCase());
    }
    if ((stage as any).assignedRole) {
      return (stage as any).assignedRole.toLowerCase() === userRole?.toLowerCase();
    }
    return false;
  };

  // Get available actions for current stage
  const getAvailableActions = (): Array<{ id: string; label: string; target: string; disabled: boolean; disabledReason?: string }> => {
    if (!workflowDef || !workflowInstance?.currentStageId) {
      return [];
    }

    const currentStage = workflowDef.stages.find(s => s.id === workflowInstance.currentStageId);
    if (!currentStage) {
      return [];
    }

    // Check if user has permission for this stage
    const normalizedRole = userRole?.toUpperCase();

    // Debug logging - always log to understand role issues
    console.log('🔍 ROLE CHECK:', {
      userRole,
      normalizedRole,
      currentStageId: currentStage.id,
      currentStageAssignedRole: (currentStage as any).assignedRole,
      isStage10: currentStage.id === '10',
      stageRequiresAFDPO: (currentStage as any).assignedRole === 'AFDPO'
    });

    const isAdmin = normalizedRole === 'ADMIN';
    const isOPR = normalizedRole === 'OPR' || normalizedRole === 'OPR LEADERSHIP' || normalizedRole?.includes('OPR');
    const isLeadership = normalizedRole === 'LEADERSHIP' || normalizedRole === 'OPR LEADERSHIP';
    const isActionOfficer = normalizedRole === 'ACTION_OFFICER' || normalizedRole === 'ACTION OFFICER';
    const isAFDPO = normalizedRole === 'AFDPO' || normalizedRole === 'AFDPO_ANALYST' || normalizedRole === 'PUBLISHER';

    // CRITICAL FIX: Block any publish actions unless at stage 10 (AFDPO Publication)
    const canPublish = currentStage.id === '10' && (isAFDPO || isAdmin);

    // Debug logging to see what userRole we're getting
    console.log('🔍 WORKFLOW PERMISSION DEBUG:', {
      userRole,
      normalizedRole,
      isAdmin,
      isOPR,
      isLeadership,
      isActionOfficer,
      currentStageId: workflowInstance?.currentStageId,
      currentStageName: currentStage?.name,
      currentStageAssignedRole: (currentStage as any)?.assignedRole,
      canPublish
    });

    // Support both 'roles' array and 'assignedRole' string
    // OPR/Leadership should be able to act as ACTION_OFFICER for feedback incorporation stages
    const userCanAct = isAdmin ||
                       (currentStage.roles && currentStage.roles.some(r => r.toUpperCase() === normalizedRole)) ||
                       ((currentStage as any).assignedRole && (currentStage as any).assignedRole.toUpperCase() === normalizedRole) ||
                       (isActionOfficer && (currentStage as any).assignedRole === 'ACTION_OFFICER') ||
                       (isAFDPO && (currentStage as any).assignedRole === 'AFDPO') || // AFDPO can act on AFDPO stages
                       ((isOPR || isLeadership) && (currentStage.id === '4' || currentStage.id === '3.5' || currentStage.id === '6' ||
                                  currentStage.id === '8' || // Post-Legal OPR Update
                                  (currentStage as any).assignedRole === 'ACTION_OFFICER' || // OPR/Leadership can act as Action Officer
                                  currentStage.name?.toLowerCase().includes('review collection')));

    console.log('🎯 USER CAN ACT?', {
      userCanAct,
      isAFDPO,
      isAdmin,
      currentStageAssignedRole: (currentStage as any).assignedRole
    });

    // Get all defined actions for this stage
    let actions: Array<{ id: string; label: string; target: string; disabled: boolean; disabledReason?: string }> =
      [...(currentStage.actions || [])].map(action => {
        // Handle both string actions and object actions
        if (typeof action === 'string') {
          // Convert string action to proper object format
          // Capitalize first letter and replace underscores
          const label = (action as string).charAt(0).toUpperCase() + (action as string).slice(1).replace(/_/g, ' ');
          return {
            id: `action-${action}`,
            label: label,
            target: currentStage.id, // Actions don't change stage, transitions do
            disabled: !userCanAct,
            disabledReason: !userCanAct ? `This action requires ${currentStage.roles?.join(' or ') || (currentStage as any).assignedRole || 'appropriate'} role` : undefined
          };
        } else {
          // Handle object actions with existing properties
          return {
            ...action,
            id: (action as any).id || `action-${(action as any).name}`,
            label: (action as any).label || (action as any).name || 'Action',
            target: (action as any).nextStage || currentStage.id, // Use nextStage if it exists, otherwise stay on current stage
            disabled: !userCanAct,
            disabledReason: !userCanAct ? `This action requires ${currentStage.roles?.join(' or ') || (currentStage as any).assignedRole || 'appropriate'} role` : undefined
          };
        }
      });
    
    // For users with appropriate roles, ensure all transitions are available
    // This includes both defined actions and any additional transitions
    const availableTransitions = workflowDef.transitions.filter(
      (t: any) => t.from === workflowInstance.currentStageId
    );
    
    
    // Special handling for Review Collection Phases - ONLY stages 3.5 and 5.5
    // Stage 4 is OPR Feedback Incorporation, NOT a review collection phase!
    const isReviewCollectionPhase = currentStage.id === '3.5' || currentStage.id === '5.5' ||
                                   currentStage.name?.toLowerCase().includes('review collection');

    if (isReviewCollectionPhase) {
      console.log('🔍 Review Collection Phase detected:', {
        stageId: currentStage.id,
        stageName: currentStage.name,
        existingActions: actions.map(a => ({ id: a.id, label: a.label, disabled: a.disabled }))
      });

      // Check user role for coordinator
      const roleToCheck = userRole?.toLowerCase() || '';
      const isCoordinator = roleToCheck.includes('coordinator') ||
                           roleToCheck === 'coordinator1' ||
                           roleToCheck === 'coordinator';

      console.log('🔍 Role check in Review Phase - roleToCheck:', roleToCheck, 'isCoordinator:', isCoordinator);

      // Filter actions based on role
      if (!isCoordinator) {
        console.log('👤 User is NOT coordinator (reviewer) - keeping only Submit Review button');
        console.log('   Actions before filtering:', actions.map(a => a.label));
        // Remove "All Reviews Complete" and "Process Feedback" actions for non-coordinators
        actions = actions.filter(action => {
          const shouldRemove = action.label?.toLowerCase().includes('all reviews complete') ||
                               action.label?.toLowerCase().includes('process feedback');
          if (shouldRemove) {
            console.log('   ❌ Removing action:', action.label);
          }
          return !shouldRemove;
        });
        console.log('   Actions after filtering:', actions.map(a => a.label));
      } else {
        console.log('👮 User is coordinator - removing Submit Review button');
        console.log('   Actions before filtering:', actions.map(a => a.label));
        // Remove "Submit Review" action for coordinators - they only need management buttons
        actions = actions.filter(action => {
          const shouldRemove = action.label?.toLowerCase() === 'submit review' ||
                               (action as any).type === 'REVIEW_SUBMIT';
          if (shouldRemove) {
            console.log('   ❌ Removing action:', action.label);
          }
          return !shouldRemove;
        });
        console.log('   Actions after filtering (coordinator sees):', actions.map(a => a.label));
      }

      // Enable remaining actions
      console.log('🚀 Enabling actions for Review Collection Phase');
      actions.forEach(action => {
        action.disabled = false;
        action.disabledReason = undefined;
      });

      // Check if we already have review collection actions
      const hasReviewActions = actions.some(a =>
        a.label?.toLowerCase().includes('complete') ||
        a.label?.toLowerCase().includes('process') ||
        a.label?.toLowerCase().includes('review')
      );

      console.log('🔍 Has existing review actions:', hasReviewActions);

      if (!hasReviewActions) {
        console.log('🚀 Adding Review Collection Phase actions for stage:', currentStage.id, 'User role:', userRole);

        // Only add "All Reviews Complete" action for coordinators
        const roleToCheck = userRole?.toLowerCase() || '';
        const isCoordinator = roleToCheck.includes('coordinator') ||
                             roleToCheck === 'coordinator1' ||
                             roleToCheck === 'coordinator';

        console.log('🔍 Role check - roleToCheck:', roleToCheck, 'isCoordinator:', isCoordinator);

        if (isCoordinator) {
          console.log('👮 User is coordinator - adding All Reviews Complete button');
          // Add "All Reviews Complete" action - ONLY for coordinators
          actions.push({
            id: 'opr-complete-reviews',
            label: 'All Reviews Complete',
            target: currentStage.id,
            disabled: false,
            disabledReason: undefined
          });

          // Add "Process Feedback" action - ONLY for coordinators
          actions.push({
            id: 'opr-process-feedback',
            label: 'Process Feedback & Continue',
            target: currentStage.id,
            disabled: false,
            disabledReason: undefined
          });
        } else {
          console.log('👤 User is NOT coordinator (role:', userRole, ') - NOT adding All Reviews Complete button');
          console.log('   Reviewers should only see Submit Review button');
        }
      } else {
        console.log('🔍 Existing review actions found and enabled');
      }
    }

    // Add transition buttons for all users (but disabled if no permission)
    // IMPORTANT: In Review Collection Phase, only coordinators should see transition buttons
    const roleToCheck = userRole?.toLowerCase() || '';
    const isCoordinator = roleToCheck.includes('coordinator');
    const shouldShowTransitions = !isReviewCollectionPhase || isCoordinator;

    console.log('🚦 Transition button check:', {
      isReviewCollectionPhase,
      isCoordinator,
      shouldShowTransitions,
      userRole,
      availableTransitions: availableTransitions.length
    });

    if (shouldShowTransitions) {
      console.log('✅ Adding transition buttons for user');
      availableTransitions.forEach((transition: any) => {
        const targetStage = workflowDef.stages.find((s: any) => s.id === transition.to);
        const hasAction = actions.some(a => a.target === transition.to);

        if (isAdmin && !hasAction) {
        // Admin override button (always enabled for admins)
        actions.push({
          id: `admin-override-${transition.to}`,
          label: `Admin: Move to ${targetStage?.name || 'Next Stage'}`,
          target: transition.to,
          disabled: false,
          disabledReason: undefined
        });
      } else if (!hasAction) {
        // Regular user transition button (may be disabled)
        // PERMANENT FIX: Support both 'roles' array and 'assignedRole' string
        // OPR/Leadership can act as ACTION_OFFICER for feedback incorporation stages
        const canPerformAction = userCanAct && (
          (currentStage.roles && currentStage.roles.some(r => r.toUpperCase() === normalizedRole)) ||
          ((currentStage as any).assignedRole && (currentStage as any).assignedRole.toUpperCase() === normalizedRole) ||
          ((isOPR || isLeadership) && (currentStage.id === '4' || currentStage.id === '6' || currentStage.id === '8' ||
                     (currentStage as any).assignedRole === 'ACTION_OFFICER' ||
                     currentStage.name?.toLowerCase().includes('review collection')))
        );
        actions.push({
          id: `user-transition-${transition.to}`,
          label: transition.label || `Submit to ${targetStage?.name || 'Next Stage'}`,
          target: transition.to,
          disabled: !canPerformAction,
          disabledReason: !canPerformAction ? `This action requires ${currentStage.roles?.join(' or ') || (currentStage as any).assignedRole || 'OPR'} role` : undefined
        });
      }
    });
    } // End of shouldShowTransitions check

    // CRITICAL FIX: Filter out any publish-related actions unless at stage 10 (AFDPO Publication)
    const filteredActions = actions.filter(action => {
      const lowerLabel = action.label?.toLowerCase() || '';
      const isPublishAction = lowerLabel.includes('publish') ||
                              lowerLabel.includes('afdpo') ||
                              action.id?.toLowerCase().includes('publish');

      // Only allow publish actions at stage 10
      if (isPublishAction && currentStage.id !== '10') {
        console.warn(`⚠️ Blocking publish action "${action.label}" at stage ${currentStage.id} (should only be at stage 10)`);
        return false;
      }

      return true;
    });

    console.log('📊 FINAL ACTIONS for', userRole, ':', filteredActions.map(a => a.label));

    return filteredActions;
  };

  // Calculate progress percentage based on actual stage position
  const getProgressPercentage = (): number => {
    if (!workflowDef || !workflowInstance?.currentStageId) return 0;

    const sortedStages = workflowDef.stages.slice().sort((a, b) => a.order - b.order);
    const currentStageIndex = sortedStages.findIndex(s => s.id === workflowInstance.currentStageId);

    if (currentStageIndex === -1) return 0;

    // Use currentStageIndex + 1 to show progress including current stage
    return ((currentStageIndex + 1) / sortedStages.length) * 100;
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Check if workflow is completed (at the final stage) even if inactive
  const isWorkflowCompleted = (() => {
    if (!workflowInstance) return false;

    // Get isActive status first (can't use the variable defined later)
    const currentIsActive = (workflowInstance as any)?.isActive ?? (workflowInstance as any)?.active;

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Workflow Completion Check:', {
        isActive: currentIsActive,
        status: (workflowInstance as any).status,
        completedAt: (workflowInstance as any).completedAt,
        currentStageId: workflowInstance.currentStageId
      });
    }

    // Check if status is explicitly marked as completed
    if ((workflowInstance as any).status === 'completed') {
      console.log('✅ Marked complete due to status=completed');
      return true;
    }

    // Only mark as complete if explicitly inactive AND at final stage
    if (workflowDef && !currentIsActive) {
      const maxStageOrder = Math.max(...workflowDef.stages.map(s => s.order));
      const currentStageOrder = workflowInstance.stageOrder ||
        workflowDef.stages.find(s => s.id === workflowInstance.currentStageId)?.order;

      if (currentStageOrder === maxStageOrder) {
        console.log('✅ Marked complete due to inactive + final stage');
        return true;
      }
    }

    // For workflows without definition, check if completedAt is set AND workflow is inactive
    if (!currentIsActive && (workflowInstance as any).completedAt) {
      console.log('✅ Marked complete due to inactive + completedAt');
      return true;
    }

    console.log('❌ Workflow NOT marked as complete');
    return false;
  })();

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    const componentId = Math.random().toString(36).substr(2, 9);
  }

  // Only log duplicate detection in development
  if (isDuplicate && process.env.NODE_ENV === 'development') {
  }

  // FORCE workflow completion screen - but still show the workflow visualization
  // Don't return early, just set a flag
  // (Removed early return to allow showing the full workflow visualization)

  // Skip the active check if workflow is completed - completed workflows should always show completion
  const isActive = (workflowInstance as any)?.isActive ?? (workflowInstance as any)?.active;
  if (!isActive && !isWorkflowCompleted) {
    if (process.env.NODE_ENV === 'development') {
    }
    return (
      <>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Management
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              No active workflow for this document. Select a workflow to begin processing.
            </Alert>
            
            {availableWorkflows.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Workflow</InputLabel>
                  <Select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    label="Select Workflow"
                  >
                    {availableWorkflows.map((workflow) => (
                      <MenuItem key={workflow.id} value={workflow.id}>
                        {workflow.name} (v{workflow.version})
                        {workflow.isDefault && ' ⭐ DEFAULT'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedWorkflowId && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {availableWorkflows.find(w => w.id === selectedWorkflowId)?.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stages: {availableWorkflows.find(w => w.id === selectedWorkflowId)?.stageCount || 0}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => startWorkflow(selectedWorkflowId)}
                disabled={processing || !selectedWorkflowId}
              >
                {processing ? 'Starting...' : 'Start Selected Workflow'}
              </Button>
              
              {availableWorkflows.length === 0 && (
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/workflows'}
                >
                  Manage Workflows
                </Button>
              )}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (!workflowDef && !isWorkflowCompleted) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">
            Workflow definition not found. Please contact administrator.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If workflow is completed but no workflow def, show completion screen anyway
  if (!workflowDef && isWorkflowCompleted) {
    return (
      <Card sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            p: 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a1a2e' }}>
              ✅ Workflow Complete
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This workflow has been successfully completed.
            </Typography>
          </Box>
          <Box sx={{
            background: 'white',
            p: 3,
            mb: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> 🎉 Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Progress:</strong> 100% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentStage = workflowDef?.stages?.find(s => s.id === workflowInstance.currentStageId);
  const availableActions = workflowDef ? getAvailableActions() : [];
  
  // Check if workflow is at the final stage (AFDPO - stage 10 in 11-stage workflow, stage 8 in 8-stage workflow)
  // For hierarchical-distributed-workflow, stage 10 (order 11) is the final AFDPO Publication stage
  const isFinalStage = (workflowDef?.id === 'hierarchical-distributed-workflow' && currentStage?.id === '10') ||
                       (workflowDef?.id === 'opr-review-workflow' && currentStage?.order === 8) ||
                       currentStage?.type === 'AFDPO_FINAL' ||
                       (currentStage as any)?.assignedRole === 'AFDPO';
  // Only mark as complete if workflow instance is actually completed, not just at final stage
  const isWorkflowComplete = !isActive && isFinalStage;
  


  return (
    <Card sx={{
      mb: 3,
      background: isWorkflowComplete
        ? 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      borderRadius: 2
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Professional Header Section */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          p: 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a1a2e' }}>
                {(() => {
                  const headerText = isWorkflowComplete ? '✅ Document Published' : workflowDef.name;
                  return headerText;
                })()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {(() => {
                  const descText = isWorkflowComplete
                    ? 'This document has been successfully published to AFDPO and is now complete.'
                    : workflowDef.description;
                  return descText;
                })()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={`v${workflowDef.version}`}
                size="medium"
                sx={{ 
                  mb: 1,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Started: {new Date(workflowInstance.startedAt!).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Workflow Completion Banner */}
        {isWorkflowCompleted && (
          <Box sx={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            color: 'white',
            p: 2,
            mb: 2,
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography variant="h5" fontWeight="bold">
              ✅ Workflow Complete
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All stages have been successfully completed. Document status: PUBLISHED
            </Typography>
          </Box>
        )}

        {/* Visual Workflow Progress */}
        <Box sx={{
          background: 'white',
          p: 3,
          mb: 2
        }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Workflow Progress {isWorkflowCompleted && '- Complete'}
          </Typography>
          
          {/* Horizontal Stage Display */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            overflowX: 'auto',
            py: 2,
            px: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 3,
            }
          }}>
            {workflowDef.stages
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => {
                // Get current stage to properly determine completed stages
                const currentStageObj = workflowDef.stages.find(s => s.id === workflowInstance.currentStageId);
                const currentOrder = currentStageObj?.order || workflowInstance.stageOrder || 0;

                // If workflow is completed, all stages are complete
                const isCompleted = isWorkflowCompleted ? true : stage.order < currentOrder;
                const isCurrent = isWorkflowCompleted ? false : stage.id === workflowInstance.currentStageId;
                const isPending = isWorkflowCompleted ? false : stage.order > currentOrder;
                
                return (
                  <React.Fragment key={stage.id}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 120
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted 
                          ? 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)'
                          : isCurrent 
                          ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                          : '#e0e0e0',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: isCurrent ? '0 0 20px rgba(33, 150, 243, 0.5)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        {isCompleted ? <CheckCircle /> : stage.order}
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 1,
                          textAlign: 'center',
                          fontWeight: isCurrent ? 'bold' : 'normal',
                          color: isCurrent ? 'primary.main' : 'text.secondary',
                          maxWidth: 100
                        }}
                      >
                        {stage.name}
                      </Typography>
                      {isCurrent && (
                        <Chip 
                          label="CURRENT" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                    {index < workflowDef.stages.length - 1 && (
                      <Box sx={{
                        flex: 1,
                        height: 2,
                        background: isCompleted ? '#4CAF50' : '#e0e0e0',
                        mx: 1,
                        minWidth: 30
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
          </Box>
          
          {/* Progress Statistics */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1
          }}>
            <Typography variant="body2">
              <strong>Status:</strong> {isWorkflowComplete ? '🎉 Published & Complete' : currentStage?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Progress:</strong> {(() => {
                // Find current stage position in sorted list
                const sortedStages = workflowDef?.stages?.slice().sort((a, b) => a.order - b.order) || [];
                const currentStageIndex = sortedStages.findIndex(s => s.id === workflowInstance.currentStageId);
                return `${currentStageIndex + 1} of ${sortedStages.length} stages`;
              })()}
            </Typography>
            <Typography variant="body2" color={isWorkflowComplete ? "success.main" : "primary"}>
              <strong>{Math.round(getProgressPercentage())}%</strong> Complete
            </Typography>
          </Box>
        </Box>


        {/* Error Display */}
        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}

        {/* Actions Section - Hide only when workflow is complete */}
        {!isWorkflowComplete && (
          <Box sx={{ 
            background: 'white',
            p: 3,
            mb: 2
          }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Available Actions
            </Typography>
            
            {workflowDef.settings?.requireComments && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comments (Required)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 2 }}
                disabled={processing}
                variant="outlined"
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {availableActions.map((action) => {
                // Determine button styling based on action type
                const isAdminAction = action.id.startsWith('admin-');
                const isUserAction = action.id.startsWith('user-');
                const buttonId = `${action.target}-${action.label}`;
                const isButtonClicked = clickedButtons.has(buttonId);
                
                // Different colors for different action types
                let buttonGradient = 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)';
                let hoverGradient = 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)';
                let disabledGradient = 'linear-gradient(45deg, #BDBDBD 30%, #E0E0E0 90%)';
                
                if (isAdminAction) {
                  // Admin actions - Red gradient
                  buttonGradient = 'linear-gradient(45deg, #FF6B6B 30%, #FF8787 90%)';
                  hoverGradient = 'linear-gradient(45deg, #FF5252 30%, #FF6B6B 90%)';
                } else if (action.label?.toLowerCase().includes('approve')) {
                  // Approval actions - Green gradient
                  buttonGradient = 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)';
                  hoverGradient = 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)';
                } else if (action.label?.toLowerCase().includes('reject')) {
                  // Reject actions - Orange gradient
                  buttonGradient = 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)';
                  hoverGradient = 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)';
                }
                
                const isButtonDisabled = processing || isButtonClicked || (workflowDef.settings?.requireComments && !comment) || action.disabled;

                // Determine the disabled reason
                let disabledTooltip = '';
                if (action.disabled && action.disabledReason) {
                  disabledTooltip = action.disabledReason;
                } else if (workflowDef.settings?.requireComments && !comment) {
                  disabledTooltip = 'Please add a comment before proceeding';
                } else if (processing) {
                  disabledTooltip = 'Processing...';
                } else if (isButtonClicked) {
                  disabledTooltip = 'Action already performed';
                }

                return (
                  <Tooltip key={action.id} title={disabledTooltip} arrow>
                    <span>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<NavigateNext />}
                        onClick={() => {
                          // Special handling for "All Reviews Complete" in Review Collection Phase
                          if (action.label?.toLowerCase().includes('all reviews complete') ||
                              action.label?.toLowerCase().includes('reviews complete')) {
                            console.log('🚀 Processing All Reviews Complete action');
                            // Navigate to OPR review page for feedback processing
                            window.location.href = `/documents/${documentId}/opr-review`;
                            return;
                          }

                          // PERMANENT FIX: Special handling for OPR actions in stage 4
                          if (action.id === 'opr-complete-reviews') {
                            // Navigate to OPR review page for feedback processing
                            window.location.href = `/documents/${documentId}/opr-review`;
                            return;
                          }

                          if (action.id === 'opr-process-feedback') {
                            // Navigate to OPR review page for feedback processing
                            window.location.href = `/documents/${documentId}/opr-review`;
                            return;
                          }

                          // Special handling for DISTRIBUTE action type
                          if (action.label.toLowerCase().includes('distribute') ||
                              (action as any).type === 'DISTRIBUTE' ||
                              (workflowInstance?.currentStageId === '3' &&
                               (userRole === 'Coordinator' || userRole === 'COORDINATOR'))) {
                            setDistributionModalOpen(true);
                            return;
                          }

                          // Special handling for Stage 3.5 review submission
                          if (workflowInstance?.currentStageId === '3.5' &&
                              (action as any).type === 'REVIEW_SUBMIT') {
                            // Navigate to Review & CRM page instead of showing popup
                            window.location.href = `/documents/${documentId}/review`;
                            return;
                          }

                          // Special handling for AFDPO actions in Stage 10
                          if (workflowInstance?.currentStageId === '10' &&
                              ((action as any).type === 'PUBLISH' || (action as any).type === 'ARCHIVE' || action.id === 'final_check')) {
                            console.log('🚀 Processing AFDPO action:', (action as any).name, (action as any).type);

                            if ((action as any).type === 'PUBLISH') {
                              // Complete the workflow when publishing
                              advanceWorkflow(null, action.label, { completeWorkflow: true });
                            } else if ((action as any).type === 'REVIEW' || action.id === 'final_check') {
                              // Final Publication Check - just show a confirmation
                              alert('Final publication check completed. Document is ready for publication.');
                            } else if ((action as any).type === 'ARCHIVE') {
                              // Archive the document and complete workflow
                              advanceWorkflow(null, action.label, { completeWorkflow: true, archive: true });
                            }
                            return;
                          }

                          // Special handling for Stage 9 Leadership "Sign and Approve" - MUST transition to Stage 10
                          if (workflowInstance?.currentStageId === '9' &&
                              (action.label === 'Sign and Approve' || action.id === 'sign_and_approve')) {
                            console.log('🚀 Leadership Sign and Approve - transitioning to AFDPO (Stage 10)');
                            advanceWorkflow('10', action.label);
                          }
                          // Check if this action has a target stage different from current (i.e., it's a transition)
                          else if (action.target !== workflowInstance?.currentStageId) {
                            advanceWorkflow(action.target, action.label);
                          } else {
                            // Non-transitioning action (like "Review Document")
                            // Navigate to the full editor page
                            if (action.label.toLowerCase().includes('review')) {
                              // Navigate to editor page in same window
                              window.location.href = `/editor/${documentId}`;
                            }
                            console.log('Non-transitioning action:', action.label);
                          }
                        }}
                        disabled={isButtonDisabled}
                        sx={{
                          background: isButtonDisabled ? disabledGradient : buttonGradient,
                          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .2)',
                          fontWeight: 'bold',
                          minWidth: '150px',
                          opacity: isButtonClicked ? 0.7 : 1,
                          '&:hover': {
                            background: isButtonDisabled ? disabledGradient : hoverGradient,
                            transform: isButtonDisabled ? 'none' : 'translateY(-2px)',
                            boxShadow: isButtonDisabled ? '0 3px 5px 2px rgba(0, 0, 0, .2)' : '0 5px 10px 2px rgba(0, 0, 0, .3)',
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isButtonClicked ? 'Processing...' : action.label}
                      </Button>
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}


      </CardContent>

      {/* Distribution Modal for Stage 3 Coordinator */}
      {distributionModalOpen && (
        <DistributionModal
          open={distributionModalOpen}
          onClose={() => setDistributionModalOpen(false)}
          documentId={documentId}
          documentTitle={workflowInstance?.metadata?.documentTitle || 'Document'}
          workflowInstanceId={workflowInstance?.metadata?.instanceId || ''}
          stageId={workflowInstance?.currentStageId || '3'}
        />
      )}
    </Card>
  );
};