import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button
} from '@mui/material';
import { Group, Analytics } from '@mui/icons-material';
import DocumentSelector from './DocumentSelector';
import { Document } from '@/types/team-performance';
import { SelectChangeEvent } from '@mui/material';

interface EmptyStateProps {
  selectedDocumentId: string;
  documents: Document[];
  documentsLoading: boolean;
  onDocumentChange: (event: SelectChangeEvent<string>) => void;
  onAnalyzeClick: () => void;
  showDocumentSelector?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  selectedDocumentId,
  documents,
  documentsLoading,
  onDocumentChange,
  onAnalyzeClick,
  showDocumentSelector = true
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI Team Performance Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {showDocumentSelector
              ? 'Select a document to analyze team performance and collaboration patterns'
              : 'Get AI-powered insights into your team\'s performance and collaboration'
            }
          </Typography>

          {showDocumentSelector && (
            <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <DocumentSelector
                selectedDocumentId={selectedDocumentId}
                documents={documents}
                documentsLoading={documentsLoading}
                onDocumentChange={onDocumentChange}
                fullWidth
                showTitle
              />
            </Box>
          )}

          {!showDocumentSelector && (
            <Button variant="contained" onClick={onAnalyzeClick} startIcon={<Analytics />}>
              Analyze Team Performance
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmptyState;