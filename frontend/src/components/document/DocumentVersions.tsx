import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress
} from '@mui/material';
import { History } from '@mui/icons-material';
import DocumentVersionsWithComparison from '@/components/DocumentVersionsWithComparison';
import { DocumentData } from '@/hooks/useDocumentData';

interface DocumentVersionsProps {
  documentId: string;
  document?: DocumentData | null;
  currentUserId?: string;
  onVersionUpdate?: () => void;
  loading?: boolean;
}

export const DocumentVersions: React.FC<DocumentVersionsProps> = ({
  documentId,
  document,
  currentUserId,
  onVersionUpdate,
  loading = false
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <History sx={{ mr: 1, verticalAlign: 'middle' }} />
        Version History
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading version history...
          </Typography>
        </Box>
      ) : document && currentUserId ? (
        <DocumentVersionsWithComparison
          documentId={documentId}
          document={{
            title: document.title,
            status: document.status,
            currentVersion: document.version || 1,
            createdById: (document.createdBy as any)?.id || currentUserId
          }}
          currentUserId={currentUserId}
          onVersionUpdate={onVersionUpdate}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No version history available.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};