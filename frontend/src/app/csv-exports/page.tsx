'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  AppBar,
  Toolbar,
  Tooltip,
  TablePagination,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Checkbox,
  DialogContentText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  ArrowBack,
  Refresh,
  TableChart,
  FileDownload,
  CheckCircle,
  HourglassEmpty
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CsvExport {
  id: string;
  fileName: string;
  exportType: string;
  recordCount: number;
  fileSize: number;
  status: string;
  filePath: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

const CsvExportsPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<CsvExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CsvExport | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fileName: '',
    exportType: 'users',
    recordCount: 0,
    fileSize: 0,
    status: 'PENDING',
    filePath: '',
    errorMessage: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/csv-exports');
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setItems(records);
        setTotalCount(data.pagination?.total || records.length);
        calculateStats(records);
      } else {
        setError('Failed to fetch CSV exports');
      }
    } catch (err) {
      console.error('Error fetching CSV exports:', err);
      setError('Failed to load CSV exports');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: CsvExport[]) => {
    setStats({
      total: records.length,
      completed: records.filter(r => r.status === 'COMPLETED').length,
      pending: records.filter(r => r.status === 'PENDING').length,
      failed: records.filter(r => r.status === 'FAILED').length
    });
  };

  const handleRowClick = (item: CsvExport) => {
    setSelectedItem(item);
    setDetailDialog(true);
  };

  const handleEditClick = (item: CsvExport) => {
    setSelectedItem(item);
    setFormData({
      fileName: item.fileName || '',
      exportType: item.exportType || 'users',
      recordCount: item.recordCount || 0,
      fileSize: item.fileSize || 0,
      status: item.status || 'PENDING',
      filePath: item.filePath || '',
      errorMessage: item.errorMessage || ''
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      fileName: '',
      exportType: 'users',
      recordCount: 0,
      fileSize: 0,
      status: 'PENDING',
      filePath: '',
      errorMessage: ''
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (item: CsvExport) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const response = editDialog
        ? await api.put(`/api/csv-exports/${selectedItem?.id}`, formData)
        : await api.post('/api/csv-exports', formData);

      if (response.ok) {
        setSuccess(editDialog ? 'CSV export updated successfully' : 'CSV export created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to save CSV export');
      }
    } catch (err) {
      console.error('Error saving CSV export:', err);
      setError('Failed to save CSV export');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/csv-exports/${selectedItem?.id}`);
      if (response.ok) {
        setSuccess('CSV export deleted successfully');
        setDeleteDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to delete CSV export');
      }
    } catch (err) {
      console.error('Error deleting CSV export:', err);
      setError('Failed to delete CSV export');
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.size > 0) {
      setBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await api.post('/api/csv-exports/bulk-delete', {
        ids: Array.from(selectedItems)
      });
      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || `Deleted ${selectedItems.size} records`);
        fetchItems();
        setSelectedItems(new Set());
        setBulkDeleteDialog(false);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to delete records');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError('An error occurred while deleting records');
    }
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.fileName || '').toLowerCase().includes(searchLower) ||
      (item.exportType || '').toLowerCase().includes(searchLower) ||
      (item.status || '').toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <TableChart sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CSV Exports
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add CSV Export
          </Button>
          <IconButton color="inherit" onClick={fetchItems}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FileDownload sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Exports</Typography>
                </Box>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography color="text.secondary" variant="body2">Completed</Typography>
                </Box>
                <Typography variant="h4">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HourglassEmpty sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography color="text.secondary" variant="body2">Pending</Typography>
                </Box>
                <Typography variant="h4">{stats.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TableChart sx={{ mr: 1, color: 'error.main' }} />
                  <Typography color="text.secondary" variant="body2">Failed</Typography>
                </Box>
                <Typography variant="h4">{stats.failed}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by file name, export type, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              {selectedItems.size > 0 && (
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete} sx={{ minWidth: '150px' }}>
                  Delete ({selectedItems.size})
                </Button>
              )}
            </Box>
            {selectedItems.size > 0 && (
              <Box sx={{ p: 1.5, bgcolor: 'info.lighter', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItems.size} record{selectedItems.size > 1 ? 's' : ''} selected</Typography>
                <Button size="small" onClick={() => setSelectedItems(new Set())}>Clear Selection</Button>
              </Box>
            )}
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedItems.size > 0 && selectedItems.size < filteredItems.length}
                      checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Export Type</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>File Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} selected={selectedItems.has(item.id)} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedItems.has(item.id)} onChange={() => handleSelectItem(item.id)} />
                      </TableCell>
                      <TableCell>{item.fileName || '-'}</TableCell>
                      <TableCell>
                        <Chip label={item.exportType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.recordCount ?? '-'}</TableCell>
                      <TableCell>{formatFileSize(item.fileSize)}</TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                      </TableCell>
                      <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditClick(item)} color="primary"><EditIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteClick(item)} color="error"><DeleteIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Paper>
      </Container>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.id}</Typography>
            <Typography variant="subtitle2" color="text.secondary">File Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.fileName || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Export Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.exportType || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Record Count</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.recordCount ?? '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">File Size</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{formatFileSize(selectedItem?.fileSize || 0)}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.status} size="small" color={getStatusColor(selectedItem?.status || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">File Path</Typography>
            <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all' }}>{selectedItem?.filePath || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Error Message</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.errorMessage || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : '-'}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button onClick={() => { setDetailDialog(false); handleEditClick(selectedItem!); }} color="primary" variant="outlined">Edit</Button>
          <Button onClick={() => { setDetailDialog(false); handleDeleteClick(selectedItem!); }} color="error" variant="outlined">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit CSV Export</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="File Name" value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Export Type</InputLabel>
                <Select value={formData.exportType} onChange={(e) => setFormData({ ...formData, exportType: e.target.value })} label="Export Type">
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="audit-logs">Audit Logs</MenuItem>
                  <MenuItem value="workflows">Workflows</MenuItem>
                  <MenuItem value="roles">Roles</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Record Count" type="number" value={formData.recordCount} onChange={(e) => setFormData({ ...formData, recordCount: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="File Size (bytes)" type="number" value={formData.fileSize} onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="File Path" value={formData.filePath} onChange={(e) => setFormData({ ...formData, filePath: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Error Message" multiline rows={2} value={formData.errorMessage} onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New CSV Export</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="File Name" value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Export Type</InputLabel>
                <Select value={formData.exportType} onChange={(e) => setFormData({ ...formData, exportType: e.target.value })} label="Export Type">
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="audit-logs">Audit Logs</MenuItem>
                  <MenuItem value="workflows">Workflows</MenuItem>
                  <MenuItem value="roles">Roles</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Record Count" type="number" value={formData.recordCount} onChange={(e) => setFormData({ ...formData, recordCount: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="File Size (bytes)" type="number" value={formData.fileSize} onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="File Path" value={formData.filePath} onChange={(e) => setFormData({ ...formData, filePath: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Error Message" multiline rows={2} value={formData.errorMessage} onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Create CSV Export</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete CSV Export</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the CSV export &quot;{selectedItem?.fileName}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Multiple Records</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedItems.size} selected record{selectedItems.size > 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained">Delete All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CsvExportsPage;
