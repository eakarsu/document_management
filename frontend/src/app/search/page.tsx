'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Alert,
  CircularProgress,
  Menu,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Checkbox
} from '@mui/material';
import {
  Business,
  ArrowBack,
  Search as SearchIcon,
  Description as DocumentIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon,
  HealthAndSafety as HealthIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon
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
  content?: string;
}

const categories = ['All', 'Contract', 'Report', 'Invoice', 'Legal', 'HR', 'Technical', 'Marketing', 'Other'];

const popularSearches = [
  'contracts',
  'invoices',
  'reports',
  'legal documents',
  'HR policies'
];

const SearchPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchHealth, setSearchHealth] = useState<{status: string, timestamp: string} | null>(null);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load all documents when component mounts
  useEffect(() => {
    loadAllDocuments();
    checkSearchHealth();
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&field=title`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const checkSearchHealth = async () => {
    try {
      const response = await fetch('/api/search/health');
      
      if (response.ok) {
        const data = await response.json();
        setSearchHealth({
          status: data.status,
          timestamp: data.timestamp
        });
      }
    } catch (error) {
      console.error('Search health check failed:', error);
      setSearchHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleReindex = async () => {
    try {
      const response = await fetch('/api/search/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ organizationOnly: true })
      });

      if (response.ok) {
        alert('Document reindexing started successfully!');
        await checkSearchHealth();
      } else {
        alert('Failed to start document reindexing');
      }
    } catch (error) {
      console.error('Reindex failed:', error);
      alert('Failed to start document reindexing');
    }
  };

  const loadAllDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/search?limit=50', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.documents || []);
        setHasSearched(true);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string, category?: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (category && category !== 'All') {
        params.append('category', category);
      }

      const response = await fetch(`/api/documents/search?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.documents || []);
        setHasSearched(true);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, selectedCategory);
  };

  const handlePopularSearch = (term: string) => {
    setSearchTerm(term);
    performSearch(term, selectedCategory);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    loadAllDocuments();
  };

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
    if (selectedDocuments.size === results.length) {
      setSelectedDocuments(new Set());
    } else {
      const allIds = new Set(results.map(doc => doc.id));
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

      // Remove deleted documents from results
      setResults(results.filter(doc => !selectedDocuments.has(doc.id)));
      setSelectedDocuments(new Set());
      setBulkDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedDoc(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Remove the deleted document from the results
        setResults(prevResults => prevResults.filter(doc => doc.id !== selectedDoc.id));
        setDeleteDialogOpen(false);
        setSelectedDoc(null);
      } else {
        alert('Failed to delete document. Please try again.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDoc(null);
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
            Search Documents - Richmond DMS
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Search Documents
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Find documents quickly using advanced search
          </Typography>
        </Box>

        {/* Search Health Status */}
        {searchHealth && (
          <Alert 
            severity={searchHealth.status === 'healthy' ? 'success' : 'warning'} 
            sx={{ mb: 3 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowHealthCheck(!showHealthCheck)}
                  startIcon={<HealthIcon />}
                >
                  {showHealthCheck ? 'Hide' : 'Details'}
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleReindex}
                  startIcon={<RefreshIcon />}
                >
                  Reindex
                </Button>
              </Box>
            }
          >
            Search Engine Status: {searchHealth.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
            {showHealthCheck && (
              <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                  Last checked: {new Date(searchHealth.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                  Service: Elasticsearch • Status: {searchHealth.status}
                </div>
              </Box>
            )}
          </Alert>
        )}

        {/* Search Form */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <form onSubmit={handleSearch}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={suggestions}
                  inputValue={searchTerm}
                  onInputChange={(event, newInputValue) => {
                    setSearchTerm(newInputValue);
                    fetchSuggestions(newInputValue);
                  }}
                  loading={loadingSuggestions}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      placeholder="Search for documents..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loadingSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                            {searchTerm && (
                              <InputAdornment position="end">
                                <IconButton onClick={handleClearSearch} edge="end">
                                  <ClearIcon />
                                </IconButton>
                              </InputAdornment>
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!searchTerm.trim() || loading}
                  startIcon={<SearchIcon />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Popular Searches */}
        {!hasSearched && !loading && results.length === 0 && (
          <Paper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Popular Searches
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {popularSearches.map((term) => (
                <Chip
                  key={term}
                  label={term}
                  onClick={() => handlePopularSearch(term)}
                  clickable
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Search Results */}
        {hasSearched && (
          <Paper>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {searchTerm ? `Search Results (${results.length})` : `All Documents (${results.length})`}
                  </Typography>
                  {searchTerm && (
                    <Typography variant="body2" color="text.secondary">
                      Results for "{searchTerm}"
                      {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                    </Typography>
                  )}
                </Box>
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
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Select all checkbox */}
            {results.length > 1 && (
              <Box sx={{ px: 3, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={selectedDocuments.size === results.length}
                  indeterminate={selectedDocuments.size > 0 && selectedDocuments.size < results.length}
                  onChange={handleSelectAll}
                />
                <Typography variant="body2" color="text.secondary">
                  Select All
                </Typography>
              </Box>
            )}

            {results.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No documents found
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search terms or filters
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleClearSearch}
                >
                  Clear Search
                </Button>
              </Box>
            ) : (
              <List>
                {results.map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        backgroundColor: selectedDocuments.has(doc.id) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="more"
                          onClick={(e) => handleMenuOpen(e, doc)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
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
                      <ListItemButton
                        onClick={() => handleDocumentClick(doc.id)}
                        sx={{ mr: 6 }}
                      >
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
                            <React.Fragment>
                              <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                Created by {doc.createdBy?.firstName || 'Unknown'} {doc.createdBy?.lastName || 'User'} • {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                              {doc.content && (
                                <span style={{ display: 'block', marginTop: '4px', color: 'rgba(0, 0, 0, 0.6)' }}>
                                  {doc.content.substring(0, 150)}...
                                </span>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Document</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Delete Document</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedDoc?.title}"? This document will be moved to trash.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
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

export default SearchPage;