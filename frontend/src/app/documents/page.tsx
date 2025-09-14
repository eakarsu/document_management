'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Divider,
  Avatar,
  Checkbox,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Business,
  ArrowBack,
  Description as DocumentIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Add as CreateIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  fileSize?: number;
  mimeType?: string;
}

const categories = ['All', 'Contract', 'Report', 'Invoice', 'Legal', 'HR', 'Technical', 'Marketing', 'Other'];

const DocumentsPage: React.FC = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents/search', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [router]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDocumentClick = (documentId: string) => {
    // Only navigate if not selecting
    if (selectedDocuments.size === 0) {
      router.push(`/documents/${documentId}`);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      const allIds = new Set(filteredDocuments.map(doc => doc.id));
      setSelectedDocuments(allIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size > 0) {
      setBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected documents from database
      const deletePromises = Array.from(selectedDocuments).map(docId =>
        fetch(`/api/documents/${docId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);

      // Refresh documents list
      const response = await fetch('/api/documents/search', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }

      setSelectedDocuments(new Set());
      setBulkDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleDownload = async (documentId: string, title: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Documents - Richmond DMS
          </Typography>
          <Button
            color="inherit"
            startIcon={<CreateIcon />}
            onClick={() => router.push('/documents/create')}
            sx={{ mr: 1 }}
          >
            Create
          </Button>
          <Button
            color="inherit"
            startIcon={<UploadIcon />}
            onClick={() => router.push('/upload')}
          >
            Upload
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Document Library
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Browse and manage your documents
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                {filteredDocuments.length} documents found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Documents List */}
        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading documents...</Typography>
          </Paper>
        ) : filteredDocuments.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <FolderIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No documents found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {documents.length === 0 
                ? "You haven't uploaded any documents yet." 
                : "No documents match your current filters."
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<CreateIcon />}
              onClick={() => router.push('/documents/create')}
              sx={{ mr: 2 }}
            >
              Create Document
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => router.push('/upload')}
            >
              Upload Documents
            </Button>
          </Paper>
        ) : (
          <Paper>
            {/* Selection controls */}
            {selectedDocuments.size > 0 && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={`${selectedDocuments.size} selected`}
                    color="primary"
                    size="small"
                  />
                  {filteredDocuments.length > 1 && (
                    <Button
                      size="small"
                      onClick={handleSelectAll}
                    >
                      {selectedDocuments.size === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
              </Box>
            )}
            {/* Select all checkbox */}
            {filteredDocuments.length > 1 && selectedDocuments.size === 0 && (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={false}
                  onChange={handleSelectAll}
                />
                <Typography variant="body2" color="text.secondary">
                  Select All
                </Typography>
              </Box>
            )}
            <List>
              {filteredDocuments.map((doc, index) => (
                <React.Fragment key={doc.id}>
                  <ListItem
                    button
                    onClick={() => handleDocumentClick(doc.id)}
                    selected={selectedDocuments.has(doc.id)}
                    sx={{
                      py: 2,
                      backgroundColor: selectedDocuments.has(doc.id) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedDocuments.has(doc.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDocument(doc.id);
                        }}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <DocumentIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" component="span">
                            {doc.title}
                          </Typography>
                          <Chip 
                            label={doc.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Created by {doc.createdBy?.firstName || 'Unknown'} {doc.createdBy?.lastName || 'User'} • {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.fileSize && ` • ${(doc.fileSize / 1024 / 1024).toFixed(2)} MB`}
                        </Typography>
                      }
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/documents/${doc.id}/edit`);
                      }}
                      sx={{ ml: 1 }}
                      title="Edit Document"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc.id, doc.title);
                      }}
                      sx={{ ml: 1 }}
                      title="Download Document"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </ListItem>
                  {index < filteredDocuments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Container>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
      >
        <DialogTitle>Delete Multiple Documents</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedDocuments.size} selected document{selectedDocuments.size > 1 ? 's' : ''}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;