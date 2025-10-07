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
import { api } from '@/lib/api';
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

      // Call backend directly since nginx routes /api/ to backend
      const response = await api.get(`/api/workflow-instances/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to load workflow status');
      }

      const data = await response.json();

      if (data.workflowId) {
        // Workflow exists (active or completed)
        setWorkflowInstance(data);

        // Load workflow definition
        const defResponse = await api.get(`/api/workflows/${data.workflowId}`);
        if (defResponse.ok) {
          const defData = await defResponse.json();
          // Check if the response is wrapped in a success/workflow structure
          const workflowData = defData.workflow || defData;
          setWorkflowDef(workflowData);
        }
      } else {
        // No workflow exists for this document, load available workflows to start
        setWorkflowInstance(null); // Clear any dummy instance data
        const workflowsResponse = await api.get('/api/workflows');
        if (workflowsResponse.ok) {
          const data = await workflowsResponse.json();
          // Extract workflows array from response
          const workflows = data.workflows || data;
          setAvailableWorkflows(Array.isArray(workflows) ? workflows : []);
        } else {
          // Set default workflows if API fails
          setAvailableWorkflows([{
            id: 'af-12-stage-review',
            name: 'Air Force 12-Stage Hierarchical Distributed Workflow',
            isDefault: true,
            stages: [
              { id: '1', name: 'Initial Draft Preparation', order: 1 },
              { id: '2', name: 'PCM Review', order: 2 },
              { id: '3', name: 'First Coordination Distribution', order: 3 },
              { id: '3.5', name: 'First Review Collection', order: 3.5 },
              { id: '4', name: 'OPR Feedback Incorporation', order: 4 },
              { id: '5', name: 'Second Coordination Distribution', order: 5 },
              { id: '5.5', name: 'Second Review Collection', order: 5.5 },
              { id: '6', name: 'Second OPR Feedback Incorporation', order: 6 },
              { id: '7', name: 'Legal Review & Approval', order: 7 },
              { id: '8', name: 'Post-Legal OPR Update', order: 8 },
              { id: '9', name: 'OPR Leadership Review', order: 9 },
              { id: '10', name: 'Final Command Approval', order: 10 },
              { id: '11', name: 'AFDPO Publication', order: 11 },
              { id: '12', name: 'Complete', order: 12 }
            ]
          }]);
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
    } else if (action.label === 'Publish Document' || action.id === 'publish') {
      // Handle publish action - complete the workflow
      advanceWorkflow('complete', action.label);
    } else if (action.label === 'Archive' || action.id === 'archive') {
      // Handle archive action - complete the workflow
      advanceWorkflow('complete', action.label);
    } else if (action.label === 'Review All Feedback' || action.id === 'review_feedback') {
      // Navigate to OPR review page for reviewing feedback
      window.location.href = `/documents/${documentId}/opr-review`;
    } else if (action.label === 'Submit Review' || action.label === 'Submit Draft Review' || action.id === 'submit_review' || action.id === 'submit_draft_review') {
      // Navigate to review page for reviewers to submit their review
      window.location.href = `/documents/${documentId}/review`;
    } else if (action.label === 'Review Second Round Feedback' || action.id === 'review_second_feedback') {
      // Navigate to Review & CRM page for second round feedback
      window.location.href = `/documents/${documentId}/review`;
    } else {
      // Special handling for specific stages
      if (workflowInstance?.currentStageId === '9' && action.label === 'Sign and Approve') {
        advanceWorkflow('10', action.label);
      } else if (action.target !== workflowInstance?.currentStageId) {
        advanceWorkflow(action.target, action.label);
      } else if (action.label.toLowerCase().includes('review document')) {
        // Navigate to editor for "Review Document" actions
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

  // Render workflow not started - but still show the stage display
  if ((!workflowInstance || !workflowInstance.workflowId) && availableWorkflows.length > 0) {
    return (
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Always show Stage Display with pending stages */}
          <Grid item xs={12}>
            <WorkflowStageDisplay
              workflowDef={availableWorkflows[0]} // Use first available workflow as template
              workflowInstance={null}
              currentStage={null}
              stageProgress={0}
            />
          </Grid>

          {/* Start Workflow Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                No Active Workflow
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This document doesn't have an active workflow. Start a workflow to begin processing.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                {availableWorkflows
                  .filter(workflow => workflow.id === 'af-12-stage-review' || workflow.name?.includes('Air Force'))
                  .map((workflow) => (
                    <Button
                      key={workflow.id}
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => startWorkflow(workflow.id)}
                      disabled={processingWorkflow || !canEdit}
                    >
                      Start Air Force 12-Stage Workflow
                    </Button>
                  ))}
              </Box>

              {/* Admin Reset Note - shown when no workflow exists */}
              {userRole === 'Admin' && (
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                  Note: Workflow has been reset. You can start a new workflow process.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
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

        {/* Review Button for Reviewers in Second Review Collection Phase */}
        {userRole && userRole.toLowerCase().includes('reviewer') &&
         workflowInstance?.currentStageId === '5.5' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Review Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please review the document and provide your feedback before submitting.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.href = `/documents/${documentId}/review`}
                startIcon={<PlayArrow />}
              >
                Review Document & Add Feedback
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Actions - Only show if workflow is not completed */}
        {(filteredActions.length > 0 || userRole === 'Admin') && !workflowInstance?.completedAt && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              {filteredActions.length > 0 && !workflowInstance?.completedAt && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Available Actions
                  </Typography>
                  <WorkflowActions
                    actions={filteredActions}
                    processingWorkflow={processingWorkflow}
                    onActionClick={handleActionClick}
                    currentStageId={workflowInstance?.currentStageId}
                  />
                </>
              )}

              {/* Reset Button - Admin Only - Only when workflow actually exists */}
              {(userRole === 'Admin' || userRole === 'ADMIN') && workflowInstance && workflowInstance.workflowId && (
                <Box sx={{ mt: filteredActions.length > 0 ? 2 : 0, pt: filteredActions.length > 0 ? 2 : 0, borderTop: filteredActions.length > 0 ? 1 : 0, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Admin Controls
                  </Typography>
                  <Button
                    variant="contained"
                    color={workflowInstance?.completedAt || !workflowInstance?.isActive ? "error" : "warning"}
                    startIcon={<Refresh />}
                    onClick={resetWorkflow}
                    disabled={processingWorkflow}
                    size="large"
                  >
                    Reset Workflow to Initial Stage
                  </Button>
                  {workflowInstance?.completedAt && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This workflow was completed/published. Resetting will restart the entire workflow process from the beginning.
                    </Alert>
                  )}
                  {!workflowInstance?.isActive && !workflowInstance?.completedAt && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      This workflow is inactive. Reset it to restart the process.
                    </Alert>
                  )}
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