import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { Document } from '@/types/team-performance';

interface DocumentSelectorProps {
  selectedDocumentId: string;
  documents: Document[];
  documentsLoading: boolean;
  onDocumentChange: (event: SelectChangeEvent<string>) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  showTitle?: boolean;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocumentId,
  documents,
  documentsLoading,
  onDocumentChange,
  size = 'medium',
  fullWidth = false,
  showTitle = false
}) => {
  return (
    <Box sx={{ minWidth: fullWidth ? '100%' : 200 }}>
      <FormControl fullWidth={fullWidth} size={size}>
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
                <Typography variant="body2" noWrap sx={{ maxWidth: showTitle ? 300 : 180 }}>
                  {doc.title}
                </Typography>
                {showTitle && (
                  <Typography variant="caption" color="text.secondary">
                    {doc.category} • {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {documentsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="caption">Loading documents...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default DocumentSelector;