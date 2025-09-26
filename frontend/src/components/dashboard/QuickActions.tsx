'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Stack
} from '@mui/material';
import {
  Upload as UploadIcon,
  Folder as FolderIcon,
  Search as SearchIcon,
  BarChart as AnalyticsIcon,
  Publish as PublishIcon,
  AutoFixHigh as SmartIcon,
  AccountTree as WorkflowBuilderIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

interface QuickActionsProps {
  onUploadDocument: () => void;
  onBrowseFolders: () => void;
  onSearchDocuments: () => void;
  onViewAnalytics: () => void;
  onPublishing: () => void;
  onAIDocumentGenerator: () => void;
  onWorkflowBuilder: () => void;
  onUsersManagement: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onUploadDocument,
  onBrowseFolders,
  onSearchDocuments,
  onViewAnalytics,
  onPublishing,
  onAIDocumentGenerator,
  onWorkflowBuilder,
  onUsersManagement
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Stack spacing={2}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SmartIcon />}
          size="large"
          onClick={onAIDocumentGenerator}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            }
          }}
        >
          🤖 Create AI Document
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={<WorkflowBuilderIcon />}
          size="large"
          onClick={onWorkflowBuilder}
          sx={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            }
          }}
        >
          📊 Workflow Builder
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UploadIcon />}
          size="large"
          onClick={onUploadDocument}
        >
          Upload Document
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FolderIcon />}
          size="large"
          onClick={onBrowseFolders}
        >
          Browse Folders
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SearchIcon />}
          size="large"
          onClick={onSearchDocuments}
        >
          Search Documents
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AnalyticsIcon />}
          size="large"
          onClick={onViewAnalytics}
        >
          View Analytics
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AdminIcon />}
          size="large"
          onClick={onUsersManagement}
          sx={{
            color: 'warning.main',
            borderColor: 'warning.main',
            '&:hover': {
              borderColor: 'warning.dark',
              backgroundColor: 'rgba(237, 108, 2, 0.04)'
            }
          }}
        >
          Users Management
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PublishIcon />}
          size="large"
          onClick={onPublishing}
          sx={{
            color: 'success.main',
            borderColor: 'success.main',
            '&:hover': {
              borderColor: 'success.dark',
              backgroundColor: 'success.light'
            }
          }}
        >
          Publishing Management
        </Button>
      </Stack>
    </Paper>
  );
};