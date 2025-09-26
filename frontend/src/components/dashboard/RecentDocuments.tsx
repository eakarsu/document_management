'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  Checkbox,
  IconButton
} from '@mui/material';
import {
  Description as DocumentIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DashboardData } from '@/types/dashboard';

interface RecentDocumentsProps {
  dashboardData: DashboardData;
  selectedDocuments: Set<string>;
  onDocumentClick: (documentId: string) => void;
  onSelectDocument: (documentId: string) => void;
  onSelectAll: () => void;
  onDeleteDocument: (documentId: string, documentTitle: string) => void;
  onBulkDelete: () => void;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  dashboardData,
  selectedDocuments,
  onDocumentClick,
  onSelectDocument,
  onSelectAll,
  onDeleteDocument,
  onBulkDelete
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Recent Documents
        </Typography>
        {selectedDocuments.size > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${selectedDocuments.size} selected`}
              color="primary"
              size="small"
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={onBulkDelete}
            >
              Delete Selected
            </Button>
          </Box>
        )}
      </Box>
      {dashboardData.recentDocuments.length > 0 ? (
        <>
          {dashboardData.recentDocuments.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 2 }}>
              <Checkbox
                checked={selectedDocuments.size === dashboardData.recentDocuments.length}
                indeterminate={selectedDocuments.size > 0 && selectedDocuments.size < dashboardData.recentDocuments.length}
                onChange={onSelectAll}
              />
              <Typography variant="body2" color="text.secondary">
                Select All
              </Typography>
            </Box>
          )}
          <List>
            {dashboardData.recentDocuments.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem
                  button
                  onClick={() => onDocumentClick(doc.id)}
                  selected={selectedDocuments.has(doc.id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    backgroundColor: selectedDocuments.has(doc.id) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedDocuments.has(doc.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(doc.id);
                      }}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.title}
                    secondary={`${doc.createdBy?.firstName || 'Unknown'} ${doc.createdBy?.lastName || 'User'} • ${new Date(doc.createdAt).toLocaleDateString()}`}
                  />
                  <Chip
                    label={doc.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id, doc.title);
                    }}
                    sx={{ ml: 1 }}
                    title="Delete document"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                {index < dashboardData.recentDocuments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No documents found. Start by uploading your first document!
        </Typography>
      )}
    </Paper>
  );
};