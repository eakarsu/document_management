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
  MarkEmailRead,
  Email,
  CheckCircle,
  HourglassEmpty
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface EmailVerification {
  id: string;
  email: string;
  token: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  ipAddress: string;
  expiresAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const EmailVerificationsPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<EmailVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmailVerification | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    token: '',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 5,
    ipAddress: '',
    expiresAt: '',
    userId: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    failed: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email-verifications');
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setItems(records);
        setTotalCount(data.pagination?.total || records.length);
        calculateStats(records);
      } else {
        setError('Failed to fetch email verifications');
      }
    } catch (err) {
      console.error('Error fetching email verifications:', err);
      setError('Failed to load email verifications');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: EmailVerification[]) => {
    setStats({
      total: records.length,
      pending: records.filter(r => r.status === 'PENDING').length,
      verified: records.filter(r => r.status === 'VERIFIED').length,
      failed: records.filter(r => r.status === 'FAILED').length
    });
  };

  const handleRowClick = (item: EmailVerification) => {
    setSelectedItem(item);
    setDetailDialog(true);
  };

  const handleEditClick = (item: EmailVerification) => {
    setSelectedItem(item);
    setFormData({
      email: item.email || '',
      token: item.token || '',
      status: item.status || 'PENDING',
      attempts: item.attempts || 0,
      maxAttempts: item.maxAttempts || 5,
      ipAddress: item.ipAddress || '',
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 16) : '',
      userId: item.userId || ''
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      email: '',
      token: crypto.randomUUID(),
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      ipAddress: '',
      expiresAt: '',
      userId: ''
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (item: EmailVerification) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const response = editDialog
        ? await api.put(`/api/email-verifications/${selectedItem?.id}`, formData)
        : await api.post('/api/email-verifications', formData);

      if (response.ok) {
        setSuccess(editDialog ? 'Email verification updated successfully' : 'Email verification created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to save email verification');
      }
    } catch (err) {
      console.error('Error saving email verification:', err);
      setError('Failed to save email verification');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/email-verifications/${selectedItem?.id}`);
      if (response.ok) {
        setSuccess('Email verification deleted successfully');
        setDeleteDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to delete email verification');
      }
    } catch (err) {
      console.error('Error deleting email verification:', err);
      setError('Failed to delete email verification');
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
      const response = await api.post('/api/email-verifications/bulk-delete', {
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
      (item.email || '').toLowerCase().includes(searchLower) ||
      (item.token || '').toLowerCase().includes(searchLower) ||
      (item.status || '').toLowerCase().includes(searchLower) ||
      (item.ipAddress || '').toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string): 'warning' | 'success' | 'default' | 'error' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'VERIFIED': return 'success';
      case 'EXPIRED': return 'default';
      case 'FAILED': return 'error';
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
          <MarkEmailRead sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Email Verifications
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add Verification
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
                  <Email sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Verifications</Typography>
                </Box>
                <Typography variant="h4">{stats.total}</Typography>
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
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography color="text.secondary" variant="body2">Verified</Typography>
                </Box>
                <Typography variant="h4">{stats.verified}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MarkEmailRead sx={{ mr: 1, color: 'error.main' }} />
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
                placeholder="Search by email, token, status, or IP..."
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
                  <TableCell>Email</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Expires At</TableCell>
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
                      <TableCell>{item.email || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title={item.token}>
                          <span>{item.token ? item.token.substring(0, 12) + '...' : '-'}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                      </TableCell>
                      <TableCell>{item.attempts ?? 0} / {item.maxAttempts ?? 5}</TableCell>
                      <TableCell>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : '-'}</TableCell>
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
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.email || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Token</Typography>
            <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all' }}>{selectedItem?.token || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.status} size="small" color={getStatusColor(selectedItem?.status || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Attempts</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.attempts ?? 0} / {selectedItem?.maxAttempts ?? 5}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Max Attempts</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.maxAttempts ?? 5}</Typography>
            <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.ipAddress || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.userId || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Expires At</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.expiresAt ? new Date(selectedItem.expiresAt).toLocaleString() : '-'}</Typography>
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
        <DialogTitle>Edit Email Verification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Token" value={formData.token} onChange={(e) => setFormData({ ...formData, token: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="VERIFIED">VERIFIED</MenuItem>
                  <MenuItem value="EXPIRED">EXPIRED</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Attempts" type="number" value={formData.attempts} onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Max Attempts" type="number" value={formData.maxAttempts} onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 5 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Expires At" type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} InputLabelProps={{ shrink: true }} />
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
        <DialogTitle>Add New Email Verification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Token (auto-generated)" value={formData.token} onChange={(e) => setFormData({ ...formData, token: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="VERIFIED">VERIFIED</MenuItem>
                  <MenuItem value="EXPIRED">EXPIRED</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Attempts" type="number" value={formData.attempts} onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Max Attempts" type="number" value={formData.maxAttempts} onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 5 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Expires At" type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Create Verification</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Email Verification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the email verification for &quot;{selectedItem?.email}&quot;? This action cannot be undone.
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

export default EmailVerificationsPage;
