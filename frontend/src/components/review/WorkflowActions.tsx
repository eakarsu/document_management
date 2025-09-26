'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { WorkflowStage, UserRole, CRMComment } from '../../types/review';
import { authTokenService } from '../../lib/authTokenService';

interface WorkflowActionsProps {
  workflowStage: WorkflowStage;
  userRole: UserRole;
  documentId: string;
  comments: CRMComment[];
  handleSubmitFeedbackToOPR: () => void;
  handleSubmitForSecondCoordination: () => void;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  workflowStage,
  userRole,
  documentId,
  comments,
  handleSubmitFeedbackToOPR,
  handleSubmitForSecondCoordination
}) => {
  const router = useRouter();

  const handleAdvanceWorkflow = async (fromStage: string, toStage: string) => {
    try {
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
          fromStage,
          toStage
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        alert(`Workflow advanced from Stage ${fromStage} to Stage ${toStage}!`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(`Failed to advance workflow: ${responseData.error || responseData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert('Error advancing workflow: ' + error.message);
    }
  };

  return (
    <>
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
            onClick={() => handleAdvanceWorkflow('3.5', '4')}
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
      {workflowStage === '4' && (
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
      )}

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
              onClick={() => handleAdvanceWorkflow('5.5', '6')}
              fullWidth
            >
              Process Feedback & Continue Workflow
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default WorkflowActions;