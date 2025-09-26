import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface WorkflowAction {
  id: string;
  label: string;
  target: string;
  disabled?: boolean;
  disabledReason?: string;
  type?: string;
  icon?: string;
  requiresDistribution?: boolean;
}

interface UseWorkflowActionsProps {
  documentId: string;
  workflowInstance: any;
  onWorkflowUpdate?: () => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const useWorkflowActions = ({
  documentId,
  workflowInstance,
  onWorkflowUpdate,
  onError,
  onSuccess
}: UseWorkflowActionsProps) => {
  const [processingWorkflow, setProcessingWorkflow] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<WorkflowAction | null>(null);

  const advanceWorkflow = useCallback(async (
    targetStageId: string,
    action: string,
    additionalData?: any
  ) => {
    setProcessingWorkflow(true);

    try {
      let metadata: any = {};

      // Handle distribution action
      if (action === 'Distribute to Reviewers' || action === 'Distribute Draft to Reviewers') {
        if (!selectedReviewers || selectedReviewers.length === 0) {
          throw new Error('Please select at least one reviewer');
        }

        const response = await api.post(
          `/api/workflows/documents/${documentId}/distribute`,
          {
            reviewerEmails: selectedReviewers,
            workflowInstanceId: workflowInstance?.id,
            stageId: workflowInstance?.currentStageId
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to distribute document');
        }

        setSelectedReviewers([]);
        setShowDistributionDialog(false);
        onSuccess?.('Document distributed successfully');
        onWorkflowUpdate?.();
        return;
      }

      // Handle publish action
      if (action === 'Publish Document' || action === 'publish') {
        // For publish, mark workflow as complete
        const publishResponse = await api.post(`/api/workflow-instances/${documentId}/complete`, {
          action: 'publish',
          metadata: {
            publishedAt: new Date().toISOString(),
            publishedBy: 'system',
            finalStage: workflowInstance?.currentStageId,
            finalStageName: workflowInstance?.currentStageName || 'AFDPO Publication'
          }
        });

        if (!publishResponse.ok) {
          const errorData = await publishResponse.json();
          throw new Error(errorData.error || 'Failed to publish document');
        }

        onSuccess?.('🎉 Document published successfully! Workflow completed.');
        onWorkflowUpdate?.();
        return;
      }

      // Handle other metadata
      if (additionalData) {
        Object.assign(metadata, additionalData);
      }

      // Use the simpler workflow advance endpoint
      const response = await api.post(`/api/workflow-instances/${documentId}/advance`, {
        targetStageId,
        action,
        metadata: {
          ...metadata,
          fromStage: workflowInstance?.currentStageId,
          fromStageName: workflowInstance?.currentStageName || 'Initial Draft Preparation',
          targetStageName: action
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to advance workflow');
      }

      const result = await response.json();

      if (result.isComplete) {
        onSuccess?.('Workflow completed successfully');
      } else {
        onSuccess?.(`Workflow advanced to ${result.currentStage}`);
      }

      onWorkflowUpdate?.();
    } catch (error) {
      console.error('Error advancing workflow:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to advance workflow');
    } finally {
      setProcessingWorkflow(false);
    }
  }, [documentId, workflowInstance, selectedReviewers, onWorkflowUpdate, onError, onSuccess]);

  const startWorkflow = useCallback(async (workflowId: string) => {
    setProcessingWorkflow(true);

    try {
      // Always use the 12-stage workflow
      const response = await api.post(`/api/workflow-instances/${documentId}/start`, {
        workflowId: 'af-12-stage-review'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start workflow');
      }

      onSuccess?.('Workflow started successfully');
      onWorkflowUpdate?.();
    } catch (error) {
      console.error('Error starting workflow:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start workflow');
    } finally {
      setProcessingWorkflow(false);
    }
  }, [documentId, onWorkflowUpdate, onError, onSuccess]);

  const resetWorkflow = useCallback(async () => {
    if (!confirm('Are you sure you want to reset the workflow? This will completely remove the workflow and allow you to start fresh.')) {
      return;
    }

    setProcessingWorkflow(true);

    try {
      const response = await api.post(`/api/workflow-instances/${documentId}/reset`, {});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset workflow');
      }

      onSuccess?.('Workflow reset successfully');
      onWorkflowUpdate?.();
    } catch (error) {
      console.error('Error resetting workflow:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to reset workflow');
    } finally {
      setProcessingWorkflow(false);
    }
  }, [documentId, onWorkflowUpdate, onError, onSuccess]);

  return {
    processingWorkflow,
    selectedReviewers,
    setSelectedReviewers,
    showDistributionDialog,
    setShowDistributionDialog,
    currentAction,
    setCurrentAction,
    advanceWorkflow,
    startWorkflow,
    resetWorkflow
  };
};