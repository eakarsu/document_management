import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Document } from './types';

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocumentId: string;
  onDocumentChange: (documentId: string) => void;
  loading?: boolean;
  size?: 'small' | 'medium';
  minWidth?: number;
  showDetails?: boolean;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  selectedDocumentId,
  onDocumentChange,
  loading = false,
  size = 'medium',
  minWidth = 200,
  showDetails = false
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onDocumentChange(event.target.value);
  };

  return (
    <FormControl size={size} sx={{ minWidth }}>
      <InputLabel>Document</InputLabel>
      <Select
        value={selectedDocumentId}
        label="Document"
        onChange={handleChange}
        disabled={loading}
      >
        {documents.map((doc) => (
          <MenuItem key={doc.id} value={doc.id}>
            {showDetails ? (
              <Box>
                <Typography variant="body2">{doc.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {doc.category} • {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" noWrap sx={{ maxWidth: minWidth - 40 }}>
                {doc.title}
              </Typography>
            )}
          </MenuItem>
        ))}
      </Select>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <CircularProgress size={16} />
        </Box>
      )}
    </FormControl>
  );
};