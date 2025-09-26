import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { Insights } from '@mui/icons-material';
import { Document } from '@/types/ai-insights';

interface DocumentSelectorProps {
  selectedDocumentId: string;
  documents: Document[];
  documentsLoading: boolean;
  onDocumentChange: (event: SelectChangeEvent<string>) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocumentId,
  documents,
  documentsLoading,
  onDocumentChange
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Insights sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI Insights Hub
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Select a document to generate comprehensive AI-powered insights and analytics
          </Typography>

          <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            <FormControl fullWidth>
              <InputLabel>Select Document</InputLabel>
              <Select
                value={selectedDocumentId}
                label="Select Document"
                onChange={onDocumentChange}
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="caption">Loading documents...</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DocumentSelector;