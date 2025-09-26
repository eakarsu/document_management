import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import { AccountTree } from '@mui/icons-material';
import { JsonWorkflowDisplay } from '@/components/workflow/JsonWorkflowDisplay';
import { WorkflowStatus } from '@/hooks/useDocumentData';

interface DocumentWorkflowProps {
  documentId: string;
  workflowStatus?: WorkflowStatus | null;
  userRole?: string;
  onWorkflowChange?: (instance: any) => void;
  onResetRef?: (resetFn: (() => Promise<void>) | null) => void;
}

export const DocumentWorkflow: React.FC<DocumentWorkflowProps> = ({
  documentId,
  workflowStatus,
  userRole,
  onWorkflowChange,
  onResetRef
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AccountTree sx={{ mr: 1, verticalAlign: 'middle' }} />
        Workflow Management
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {workflowStatus?.active ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Current Stage: <strong>{workflowStatus.currentStageName}</strong>
          </Typography>

          <JsonWorkflowDisplay
            documentId={documentId}
            userRole={userRole || 'USER'}
            onWorkflowUpdate={onWorkflowChange ? () => onWorkflowChange(null) : undefined}
          />
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No active workflow for this document.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Start a workflow to begin the review and approval process.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};