import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { Document } from '@/types/workflow-monitor';

interface EmptyStateProps {
  documents: Document[];
  documentsLoading: boolean;
  selectedDocumentId: string;
  onDocumentChange: (documentId: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  documents,
  documentsLoading,
  selectedDocumentId,
  onDocumentChange
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Timeline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Real-time Workflow Monitor
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Select a document to monitor its workflow in real-time
          </Typography>

          <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            <FormControl fullWidth>
              <InputLabel>Select Document</InputLabel>
              <Select
                value={selectedDocumentId}
                label="Select Document"
                onChange={(e) => onDocumentChange(e.target.value)}
                disabled={documentsLoading}
              >
                {documents.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Box>
                      <Typography variant="body2">{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.category} • {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {documentsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={40} sx={{ mr: 2 }} />
              <Typography variant="body1">Loading documents...</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmptyState;