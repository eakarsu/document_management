'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';

// Import our new components
import { WorkflowStageDisplay } from './WorkflowStageDisplay';
import { WorkflowActions } from './WorkflowActions';
import { WorkflowHistory } from './WorkflowHistory';
import { DistributionDialog } from './DistributionDialog';
import { useWorkflowActions, WorkflowAction } from '@/hooks/useWorkflowActions';
import { api } from '@/services/api';
import {
  filterWorkflowActions,
  getStageProgress
} from '@/utils/workflowHelpers';

interface JsonWorkflowDisplayProps {
  documentId: string;
  userRole?: string;
  canEdit?: boolean;
  onWorkflowUpdate?: () => void;
}

export const JsonWorkflowDisplay: React.FC<JsonWorkflowDisplayProps> = ({
  documentId,
  userRole = 'viewer',
  canEdit = false,
  onWorkflowUpdate
}) => {
  // State management
  const [workflowDef, setWorkflowDef] = useState<any>(null);
  const [workflowInstance, setWorkflowInstance] = useState<any>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use our custom hook for workflow actions
  const {
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
  } = useWorkflowActions({
    documentId,
    workflowInstance,
    onWorkflowUpdate: () => {
      loadWorkflowStatus();
      onWorkflowUpdate?.();
    },
    onError: setError,
    onSuccess: setSuccessMessage
  });

  // Load workflow status
  const loadWorkflowStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use POST with documentId in body to avoid Next.js route issues
      // Call backend directly since nginx routes /api/ to backend
      const response = await api.get(`/api/workflow-instances/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to load workflow status');
      }

      const data = await response.json();

      if (data.active && data.workflowId) {
        setWorkflowInstance(data);

        // Load workflow definition
        const defResponse = await api.get(`/api/workflows/${data.workflowId}`);
        if (defResponse.ok) {
          const defData = await defResponse.json();
          setWorkflowDef(defData);
        }
      } else {
        // No active workflow, load available workflows
        const workflowsResponse = await api.get('/api/workflows');
        if (workflowsResponse.ok) {
          const workflows = await workflowsResponse.json();
          setAvailableWorkflows(workflows);
        }
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Initial load
  useEffect(() => {
    loadWorkflowStatus();
  }, [loadWorkflowStatus]);

  // Handle action click
  const handleActionClick = useCallback((action: WorkflowAction) => {
    if (action.requiresDistribution) {
      setCurrentAction(action);
      setShowDistributionDialog(true);
    } else {
      // Special handling for specific stages
      if (workflowInstance?.currentStageId === '9' && action.label === 'Sign and Approve') {
        advanceWorkflow('10', action.label);
      } else if (action.target !== workflowInstance?.currentStageId) {
        advanceWorkflow(action.target, action.label);
      } else if (action.label.toLowerCase().includes('review')) {
        // Navigate to editor for review actions
        window.location.href = `/editor/${documentId}`;
      }
    }
  }, [workflowInstance, advanceWorkflow, setCurrentAction, setShowDistributionDialog, documentId]);

  // Handle distribution confirm
  const handleDistributionConfirm = useCallback(() => {
    if (currentAction) {
      advanceWorkflow(currentAction.target, currentAction.label);
    }
  }, [currentAction, advanceWorkflow]);

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Get current stage
  const currentStage = workflowDef?.stages?.find(
    (s: any) => s.id === workflowInstance?.currentStageId
  );

  // Filter actions based on permissions
  const filteredActions = filterWorkflowActions(
    currentStage,
    workflowDef,
    workflowInstance,
    userRole,
    canEdit
  );

  // Calculate progress
  const stageProgress = getStageProgress(currentStage, workflowDef);

  // Render workflow not started
  if (!workflowInstance?.active && availableWorkflows.length > 0) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No Active Workflow
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This document doesn't have an active workflow. Start a workflow to begin processing.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            {availableWorkflows.map((workflow) => (
              <Button
                key={workflow.id}
                variant={workflow.isDefault ? 'contained' : 'outlined'}
                startIcon={<PlayArrow />}
                onClick={() => startWorkflow(workflow.id)}
                disabled={processingWorkflow || !canEdit}
              >
                Start {workflow.name}
              </Button>
            ))}
          </Box>
        </Paper>
      </Container>
    );
  }

  // Render main workflow display
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Stage Display */}
        <Grid item xs={12}>
          <WorkflowStageDisplay
            workflowDef={workflowDef}
            workflowInstance={workflowInstance}
            currentStage={currentStage}
            stageProgress={stageProgress}
          />
        </Grid>

        {/* Actions */}
        {filteredActions.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Actions
              </Typography>
              <WorkflowActions
                actions={filteredActions}
                processingWorkflow={processingWorkflow}
                onActionClick={handleActionClick}
                currentStageId={workflowInstance?.currentStageId}
              />

              {/* Reset Button - Admin Only */}
              {userRole === 'Admin' && workflowInstance?.active && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<Refresh />}
                    onClick={resetWorkflow}
                    disabled={processingWorkflow}
                  >
                    Reset Workflow
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* History */}
        {workflowInstance?.history && workflowInstance.history.length > 0 && (
          <Grid item xs={12}>
            <WorkflowHistory
              history={workflowInstance.history}
              currentStageId={workflowInstance.currentStageId}
            />
          </Grid>
        )}
      </Grid>

      {/* Distribution Dialog */}
      <DistributionDialog
        open={showDistributionDialog}
        onClose={() => {
          setShowDistributionDialog(false);
          setSelectedReviewers([]);
        }}
        onConfirm={handleDistributionConfirm}
        selectedReviewers={selectedReviewers}
        onReviewersChange={setSelectedReviewers}
        title={currentAction?.label}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};