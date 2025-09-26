'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { DocumentDetails } from '@/types/editor';

interface DocumentHeaderProps {
  documentData: DocumentDetails | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  documentData,
  hasUnsavedChanges,
  lastSaved
}) => {
  const router = useRouter();

  return (
    <>
      {/* Editor Header */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              Editing: {documentData?.title}
            </Typography>
            <Typography variant="caption">
              {hasUnsavedChanges ? (
                <span style={{ color: '#ff9800' }}>Unsaved changes</span>
              ) : lastSaved ? (
                `Last saved: ${lastSaved.toLocaleTimeString()}`
              ) : (
                'Ready'
              )}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Document Info */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h5">{documentData?.title}</Typography>
            <Chip label={documentData?.category} size="small" />
            <Chip label={documentData?.status} variant="outlined" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created by {documentData?.createdBy?.firstName} {documentData?.createdBy?.lastName} on{' '}
            {documentData?.createdAt ? new Date(documentData.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>
        </Paper>
      </Container>
    </>
  );
};