import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { Task } from '@mui/icons-material';
import WorkflowTasks from '@/components/WorkflowTasks';

interface DocumentTasksProps {
  documentId: string;
  hasTasks?: boolean;
}

export const DocumentTasks: React.FC<DocumentTasksProps> = ({
  documentId,
  hasTasks = false
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Task sx={{ mr: 1, verticalAlign: 'middle' }} />
        Document Tasks
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {hasTasks ? (
        <WorkflowTasks />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No active tasks for this document.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};