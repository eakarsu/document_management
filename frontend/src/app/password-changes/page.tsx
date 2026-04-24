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
  Password,
  SwapHoriz,
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface PasswordChange {
  id: string;
  changeType: string;
  status: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
  userId: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  createdAt: string;
  updatedAt: string;
}

const PasswordChangesPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<PasswordChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PasswordChange | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    changeType: 'USER_INITIATED',
    status: 'PENDING',
    ipAddress: '',
    userAgent: '',
    reason: '',
    userId: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/password-changes');
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setItems(records);
        setTotalCount(data.pagination?.total || records.length);
        calculateStats(records);
      } else {
        setError('Failed to fetch password changes');
      }
    } catch (err) {
      console.error('Error fetching password changes:', err);
      setError('Failed to load password changes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: PasswordChange[]) => {
    setStats({
      total: records.length,
      success: records.filter(r => r.status === 'SUCCESS').length,
      failed: records.filter(r => r.status === 'FAILED').length,
      pending: records.filter(r => r.status === 'PENDING').length
    });
  };

  const handleRowClick = (item: PasswordChange) => {
    setSelectedItem(item);
    setDetailDialog(true);
  };

  const handleEditClick = (item: PasswordChange) => {
    setSelectedItem(item);
    setFormData({
      changeType: item.changeType || 'USER_INITIATED',
      status: item.status || 'PENDING',
      ipAddress: item.ipAddress || '',
      userAgent: item.userAgent || '',
      reason: item.reason || '',
      userId: item.userId || ''
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      changeType: 'USER_INITIATED',
      status: 'PENDING',
      ipAddress: '',
      userAgent: '',
      reason: '',
      userId: ''
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (item: PasswordChange) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const response = editDialog
        ? await api.put(`/api/password-changes/${selectedItem?.id}`, formData)
        : await api.post('/api/password-changes', formData);

      if (response.ok) {
        setSuccess(editDialog ? 'Password change updated successfully' : 'Password change created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to save password change');
      }
    } catch (err) {
      console.error('Error saving password change:', err);
      setError('Failed to save password change');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/password-changes/${selectedItem?.id}`);
      if (response.ok) {
        setSuccess('Password change deleted successfully');
        setDeleteDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to delete password change');
      }
    } catch (err) {
      console.error('Error deleting password change:', err);
      setError('Failed to delete password change');
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
      const response = await api.post('/api/password-changes/bulk-delete', {
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
      (item.changeType || '').toLowerCase().includes(searchLower) ||
      (item.status || '').toLowerCase().includes(searchLower) ||
      (item.ipAddress || '').toLowerCase().includes(searchLower) ||
      (item.reason || '').toLowerCase().includes(searchLower) ||
      (item.user?.email || '').toLowerCase().includes(searchLower)
    );
  });

  const getChangeTypeColor = (type: string): 'primary' | 'warning' | 'error' | 'info' | 'default' => {
    switch (type) {
      case 'USER_INITIATED': return 'primary';
      case 'ADMIN_RESET': return 'warning';
      case 'FORCED_CHANGE': return 'error';
      case 'RECOVERY': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      case 'REVERTED': return 'default';
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
          <Password sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Password Changes
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add Password Change
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
                  <SwapHoriz sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Changes</Typography>
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
                  <Typography color="text.secondary" variant="body2">Successful</Typography>
                </Box>
                <Typography variant="h4">{stats.success}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorOutline sx={{ mr: 1, color: 'error.main' }} />
                  <Typography color="text.secondary" variant="body2">Failed</Typography>
                </Box>
                <Typography variant="h4">{stats.failed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Password sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography color="text.secondary" variant="body2">Pending</Typography>
                </Box>
                <Typography variant="h4">{stats.pending}</Typography>
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
                placeholder="Search by user, change type, status, or reason..."
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
                  <TableCell>User</TableCell>
                  <TableCell>Change Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Reason</TableCell>
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
                      <TableCell>{item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.email : item.userId || '-'}</TableCell>
                      <TableCell>
                        <Chip label={item.changeType} size="small" color={getChangeTypeColor(item.changeType)} />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                      </TableCell>
                      <TableCell>{item.ipAddress || '-'}</TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
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
            <Typography variant="subtitle2" color="text.secondary">User</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.user ? `${selectedItem.user.firstName || ''} ${selectedItem.user.lastName || ''}`.trim() || selectedItem.user.email : selectedItem?.userId || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Change Type</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.changeType} size="small" color={getChangeTypeColor(selectedItem?.changeType || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.status} size="small" color={getStatusColor(selectedItem?.status || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.ipAddress || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.userAgent || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.reason || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.userId || '-'}</Typography>
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
        <DialogTitle>Edit Password Change</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Change Type</InputLabel>
                <Select value={formData.changeType} onChange={(e) => setFormData({ ...formData, changeType: e.target.value })} label="Change Type">
                  <MenuItem value="USER_INITIATED">USER_INITIATED</MenuItem>
                  <MenuItem value="ADMIN_RESET">ADMIN_RESET</MenuItem>
                  <MenuItem value="FORCED_CHANGE">FORCED_CHANGE</MenuItem>
                  <MenuItem value="RECOVERY">RECOVERY</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="REVERTED">REVERTED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="User Agent" value={formData.userAgent} onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Reason" multiline rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
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
        <DialogTitle>Add New Password Change</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Change Type</InputLabel>
                <Select value={formData.changeType} onChange={(e) => setFormData({ ...formData, changeType: e.target.value })} label="Change Type">
                  <MenuItem value="USER_INITIATED">USER_INITIATED</MenuItem>
                  <MenuItem value="ADMIN_RESET">ADMIN_RESET</MenuItem>
                  <MenuItem value="FORCED_CHANGE">FORCED_CHANGE</MenuItem>
                  <MenuItem value="RECOVERY">RECOVERY</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="REVERTED">REVERTED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="User Agent" value={formData.userAgent} onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Reason" multiline rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Create Password Change</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Password Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this password change record? This action cannot be undone.
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

export default PasswordChangesPage;
