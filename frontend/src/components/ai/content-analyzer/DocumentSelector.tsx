import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import {
  Spellcheck,
  Analytics
} from '@mui/icons-material';
import { Document } from '@/types/content-analyzer';

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocumentId: string;
  documentsLoading: boolean;
  loading: boolean;
  onDocumentChange: (event: SelectChangeEvent<string>) => void;
  onAnalyze: () => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  selectedDocumentId,
  documentsLoading,
  loading,
  onDocumentChange,
  onAnalyze
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Spellcheck sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI Content Analyzer
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Select a document to get comprehensive AI-powered content analysis
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

          {selectedDocumentId && (
            <Button
              variant="contained"
              onClick={onAnalyze}
              startIcon={<Analytics />}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Content'}
            </Button>
          )}

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