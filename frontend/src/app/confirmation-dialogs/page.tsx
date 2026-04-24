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
  QuestionAnswer,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ConfirmationDialog {
  id: string;
  name: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  dialogType: string;
  severity: string;
  icon: string;
  requireInput: boolean;
  inputLabel: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const ConfirmationDialogsPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<ConfirmationDialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConfirmationDialog | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    dialogType: 'INFO',
    severity: 'LOW',
    icon: '',
    requireInput: false,
    inputLabel: '',
    isActive: true
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    info: 0,
    danger: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/confirmation-dialogs');
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setItems(records);
        setTotalCount(data.pagination?.total || records.length);
        calculateStats(records);
      } else {
        setError('Failed to fetch confirmation dialogs');
      }
    } catch (err) {
      console.error('Error fetching confirmation dialogs:', err);
      setError('Failed to load confirmation dialogs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: ConfirmationDialog[]) => {
    setStats({
      total: records.length,
      active: records.filter(r => r.isActive).length,
      info: records.filter(r => r.dialogType === 'INFO').length,
      danger: records.filter(r => r.dialogType === 'DANGER').length
    });
  };

  const handleRowClick = (item: ConfirmationDialog) => {
    setSelectedItem(item);
    setDetailDialog(true);
  };

  const handleEditClick = (item: ConfirmationDialog) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      title: item.title || '',
      message: item.message || '',
      confirmText: item.confirmText || 'Confirm',
      cancelText: item.cancelText || 'Cancel',
      dialogType: item.dialogType || 'INFO',
      severity: item.severity || 'LOW',
      icon: item.icon || '',
      requireInput: item.requireInput || false,
      inputLabel: item.inputLabel || '',
      isActive: item.isActive !== false
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      dialogType: 'INFO',
      severity: 'LOW',
      icon: '',
      requireInput: false,
      inputLabel: '',
      isActive: true
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (item: ConfirmationDialog) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const response = editDialog
        ? await api.put(`/api/confirmation-dialogs/${selectedItem?.id}`, formData)
        : await api.post('/api/confirmation-dialogs', formData);

      if (response.ok) {
        setSuccess(editDialog ? 'Confirmation dialog updated successfully' : 'Confirmation dialog created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to save confirmation dialog');
      }
    } catch (err) {
      console.error('Error saving confirmation dialog:', err);
      setError('Failed to save confirmation dialog');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/confirmation-dialogs/${selectedItem?.id}`);
      if (response.ok) {
        setSuccess('Confirmation dialog deleted successfully');
        setDeleteDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to delete confirmation dialog');
      }
    } catch (err) {
      console.error('Error deleting confirmation dialog:', err);
      setError('Failed to delete confirmation dialog');
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
      const response = await api.post('/api/confirmation-dialogs/bulk-delete', {
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
      (item.name || '').toLowerCase().includes(searchLower) ||
      (item.title || '').toLowerCase().includes(searchLower) ||
      (item.dialogType || '').toLowerCase().includes(searchLower) ||
      (item.severity || '').toLowerCase().includes(searchLower) ||
      (item.confirmText || '').toLowerCase().includes(searchLower)
    );
  });

  const getDialogTypeColor = (type: string): 'info' | 'warning' | 'error' | 'success' | 'default' => {
    switch (type) {
      case 'INFO': return 'info';
      case 'WARNING': return 'warning';
      case 'DANGER': return 'error';
      case 'SUCCESS': return 'success';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string): 'default' | 'warning' | 'error' => {
    switch (severity) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <QuestionAnswer sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Confirmation Dialogs
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add Dialog
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
                  <QuestionAnswer sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Dialogs</Typography>
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
                  <Typography color="text.secondary" variant="body2">Active</Typography>
                </Box>
                <Typography variant="h4">{stats.active}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Info sx={{ mr: 1, color: 'info.main' }} />
                  <Typography color="text.secondary" variant="body2">Info Type</Typography>
                </Box>
                <Typography variant="h4">{stats.info}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning sx={{ mr: 1, color: 'error.main' }} />
                  <Typography color="text.secondary" variant="body2">Danger Type</Typography>
                </Box>
                <Typography variant="h4">{stats.danger}</Typography>
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
                placeholder="Search by name, title, type, or severity..."
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
                  <TableCell>Name</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Dialog Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Confirm Text</TableCell>
                  <TableCell>Usage Count</TableCell>
                  <TableCell>Active</TableCell>
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
                      <TableCell>{item.name || '-'}</TableCell>
                      <TableCell>{item.title || '-'}</TableCell>
                      <TableCell>
                        <Chip label={item.dialogType} size="small" color={getDialogTypeColor(item.dialogType)} />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.severity} size="small" color={getSeverityColor(item.severity)} />
                      </TableCell>
                      <TableCell>{item.confirmText || '-'}</TableCell>
                      <TableCell>{item.usageCount ?? 0}</TableCell>
                      <TableCell>
                        <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" color={item.isActive ? 'success' : 'default'} variant="outlined" />
                      </TableCell>
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
            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.name || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Title</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.title || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Message</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.message || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Confirm Text</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.confirmText || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Cancel Text</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.cancelText || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Dialog Type</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.dialogType} size="small" color={getDialogTypeColor(selectedItem?.dialogType || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.severity} size="small" color={getSeverityColor(selectedItem?.severity || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Icon</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.icon || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Require Input</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.requireInput ? 'Yes' : 'No'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Input Label</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.inputLabel || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Active</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.isActive ? 'Active' : 'Inactive'} size="small" color={selectedItem?.isActive ? 'success' : 'default'} variant="outlined" />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Usage Count</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.usageCount ?? 0}</Typography>
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
        <DialogTitle>Edit Confirmation Dialog</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Message" multiline rows={3} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Confirm Text" value={formData.confirmText} onChange={(e) => setFormData({ ...formData, confirmText: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cancel Text" value={formData.cancelText} onChange={(e) => setFormData({ ...formData, cancelText: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Dialog Type</InputLabel>
                <Select value={formData.dialogType} onChange={(e) => setFormData({ ...formData, dialogType: e.target.value })} label="Dialog Type">
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="WARNING">WARNING</MenuItem>
                  <MenuItem value="DANGER">DANGER</MenuItem>
                  <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} label="Severity">
                  <MenuItem value="LOW">LOW</MenuItem>
                  <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Checkbox checked={formData.requireInput} onChange={(e) => setFormData({ ...formData, requireInput: e.target.checked })} />
                <Typography>Require Input</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Input Label" value={formData.inputLabel} onChange={(e) => setFormData({ ...formData, inputLabel: e.target.value })} disabled={!formData.requireInput} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <Typography>Active</Typography>
              </Box>
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
        <DialogTitle>Add New Confirmation Dialog</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Message" multiline rows={3} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Confirm Text" value={formData.confirmText} onChange={(e) => setFormData({ ...formData, confirmText: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cancel Text" value={formData.cancelText} onChange={(e) => setFormData({ ...formData, cancelText: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Dialog Type</InputLabel>
                <Select value={formData.dialogType} onChange={(e) => setFormData({ ...formData, dialogType: e.target.value })} label="Dialog Type">
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="WARNING">WARNING</MenuItem>
                  <MenuItem value="DANGER">DANGER</MenuItem>
                  <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} label="Severity">
                  <MenuItem value="LOW">LOW</MenuItem>
                  <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Checkbox checked={formData.requireInput} onChange={(e) => setFormData({ ...formData, requireInput: e.target.checked })} />
                <Typography>Require Input</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Input Label" value={formData.inputLabel} onChange={(e) => setFormData({ ...formData, inputLabel: e.target.value })} disabled={!formData.requireInput} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <Typography>Active</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Create Dialog</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Confirmation Dialog</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the confirmation dialog &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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

export default ConfirmationDialogsPage;
