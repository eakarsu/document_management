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
  CleaningServices,
  Shield,
  CheckCircle,
  Block
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface InputSanitizationRule {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  pattern: string;
  replacement: string;
  fieldTarget: string;
  isActive: boolean;
  priority: number;
  blockedCount: number;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

const InputSanitizationRulesPage: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<InputSanitizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InputSanitizationRule | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'XSS_PREVENTION',
    pattern: '',
    replacement: '',
    fieldTarget: '',
    isActive: true,
    priority: 0,
    blockedCount: 0,
    errorMessage: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalBlocked: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/input-sanitization-rules');
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setItems(records);
        setTotalCount(data.pagination?.total || records.length);
        calculateStats(records);
      } else {
        setError('Failed to fetch input sanitization rules');
      }
    } catch (err) {
      console.error('Error fetching input sanitization rules:', err);
      setError('Failed to load input sanitization rules');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: InputSanitizationRule[]) => {
    setStats({
      total: records.length,
      active: records.filter(r => r.isActive).length,
      totalBlocked: records.reduce((sum, r) => sum + (r.blockedCount || 0), 0),
      inactive: records.filter(r => !r.isActive).length
    });
  };

  const handleRowClick = (item: InputSanitizationRule) => {
    setSelectedItem(item);
    setDetailDialog(true);
  };

  const handleEditClick = (item: InputSanitizationRule) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      ruleType: item.ruleType || 'XSS_PREVENTION',
      pattern: item.pattern || '',
      replacement: item.replacement || '',
      fieldTarget: item.fieldTarget || '',
      isActive: item.isActive !== false,
      priority: item.priority || 0,
      blockedCount: item.blockedCount || 0,
      errorMessage: item.errorMessage || ''
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      description: '',
      ruleType: 'XSS_PREVENTION',
      pattern: '',
      replacement: '',
      fieldTarget: '',
      isActive: true,
      priority: 0,
      blockedCount: 0,
      errorMessage: ''
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (item: InputSanitizationRule) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const response = editDialog
        ? await api.put(`/api/input-sanitization-rules/${selectedItem?.id}`, formData)
        : await api.post('/api/input-sanitization-rules', formData);

      if (response.ok) {
        setSuccess(editDialog ? 'Rule updated successfully' : 'Rule created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to save rule');
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save rule');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/input-sanitization-rules/${selectedItem?.id}`);
      if (response.ok) {
        setSuccess('Rule deleted successfully');
        setDeleteDialog(false);
        fetchItems();
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to delete rule');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule');
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
      const response = await api.post('/api/input-sanitization-rules/bulk-delete', {
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
      (item.ruleType || '').toLowerCase().includes(searchLower) ||
      (item.pattern || '').toLowerCase().includes(searchLower) ||
      (item.fieldTarget || '').toLowerCase().includes(searchLower)
    );
  });

  const getRuleTypeColor = (type: string): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (type) {
      case 'XSS_PREVENTION': return 'error';
      case 'SQL_INJECTION': return 'error';
      case 'HTML_ESCAPE': return 'warning';
      case 'TRIM_WHITESPACE': return 'default';
      case 'REMOVE_SPECIAL_CHARS': return 'info';
      case 'URL_ENCODE': return 'primary';
      case 'EMAIL_NORMALIZE': return 'primary';
      case 'PATH_TRAVERSAL': return 'error';
      case 'COMMAND_INJECTION': return 'error';
      case 'CUSTOM_REGEX': return 'secondary';
      case 'LENGTH_LIMIT': return 'warning';
      case 'PROFANITY_FILTER': return 'info';
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
          <CleaningServices sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Input Sanitization Rules
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add Rule
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
                  <Shield sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Rules</Typography>
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
                  <Block sx={{ mr: 1, color: 'error.main' }} />
                  <Typography color="text.secondary" variant="body2">Total Blocked</Typography>
                </Box>
                <Typography variant="h4">{stats.totalBlocked}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CleaningServices sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography color="text.secondary" variant="body2">Inactive</Typography>
                </Box>
                <Typography variant="h4">{stats.inactive}</Typography>
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
                placeholder="Search by name, rule type, pattern, or field target..."
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
                  <TableCell>Rule Type</TableCell>
                  <TableCell>Pattern</TableCell>
                  <TableCell>Field Target</TableCell>
                  <TableCell>Blocked Count</TableCell>
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
                      <TableCell>
                        <Chip label={item.ruleType} size="small" color={getRuleTypeColor(item.ruleType)} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.pattern || ''}>
                          <span>{item.pattern ? (item.pattern.length > 20 ? item.pattern.substring(0, 20) + '...' : item.pattern) : '-'}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{item.fieldTarget || '-'}</TableCell>
                      <TableCell>{item.blockedCount ?? 0}</TableCell>
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
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.description || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Rule Type</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.ruleType} size="small" color={getRuleTypeColor(selectedItem?.ruleType || '')} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Pattern</Typography>
            <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedItem?.pattern || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Replacement</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.replacement || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Field Target</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.fieldTarget || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Active</Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedItem?.isActive ? 'Active' : 'Inactive'} size="small" color={selectedItem?.isActive ? 'success' : 'default'} variant="outlined" />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.priority ?? 0}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Blocked Count</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem?.blockedCount ?? 0}</Typography>
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
        <DialogTitle>Edit Input Sanitization Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select value={formData.ruleType} onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })} label="Rule Type">
                  <MenuItem value="XSS_PREVENTION">XSS_PREVENTION</MenuItem>
                  <MenuItem value="SQL_INJECTION">SQL_INJECTION</MenuItem>
                  <MenuItem value="HTML_ESCAPE">HTML_ESCAPE</MenuItem>
                  <MenuItem value="TRIM_WHITESPACE">TRIM_WHITESPACE</MenuItem>
                  <MenuItem value="REMOVE_SPECIAL_CHARS">REMOVE_SPECIAL_CHARS</MenuItem>
                  <MenuItem value="URL_ENCODE">URL_ENCODE</MenuItem>
                  <MenuItem value="EMAIL_NORMALIZE">EMAIL_NORMALIZE</MenuItem>
                  <MenuItem value="PATH_TRAVERSAL">PATH_TRAVERSAL</MenuItem>
                  <MenuItem value="COMMAND_INJECTION">COMMAND_INJECTION</MenuItem>
                  <MenuItem value="CUSTOM_REGEX">CUSTOM_REGEX</MenuItem>
                  <MenuItem value="LENGTH_LIMIT">LENGTH_LIMIT</MenuItem>
                  <MenuItem value="PROFANITY_FILTER">PROFANITY_FILTER</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Pattern" value={formData.pattern} onChange={(e) => setFormData({ ...formData, pattern: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Replacement" value={formData.replacement} onChange={(e) => setFormData({ ...formData, replacement: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Field Target" value={formData.fieldTarget} onChange={(e) => setFormData({ ...formData, fieldTarget: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Priority" type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Blocked Count" type="number" value={formData.blockedCount} onChange={(e) => setFormData({ ...formData, blockedCount: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Error Message" multiline rows={2} value={formData.errorMessage} onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })} />
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
        <DialogTitle>Add New Input Sanitization Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Rule Type</InputLabel>
                <Select value={formData.ruleType} onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })} label="Rule Type">
                  <MenuItem value="XSS_PREVENTION">XSS_PREVENTION</MenuItem>
                  <MenuItem value="SQL_INJECTION">SQL_INJECTION</MenuItem>
                  <MenuItem value="HTML_ESCAPE">HTML_ESCAPE</MenuItem>
                  <MenuItem value="TRIM_WHITESPACE">TRIM_WHITESPACE</MenuItem>
                  <MenuItem value="REMOVE_SPECIAL_CHARS">REMOVE_SPECIAL_CHARS</MenuItem>
                  <MenuItem value="URL_ENCODE">URL_ENCODE</MenuItem>
                  <MenuItem value="EMAIL_NORMALIZE">EMAIL_NORMALIZE</MenuItem>
                  <MenuItem value="PATH_TRAVERSAL">PATH_TRAVERSAL</MenuItem>
                  <MenuItem value="COMMAND_INJECTION">COMMAND_INJECTION</MenuItem>
                  <MenuItem value="CUSTOM_REGEX">CUSTOM_REGEX</MenuItem>
                  <MenuItem value="LENGTH_LIMIT">LENGTH_LIMIT</MenuItem>
                  <MenuItem value="PROFANITY_FILTER">PROFANITY_FILTER</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Pattern" value={formData.pattern} onChange={(e) => setFormData({ ...formData, pattern: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Replacement" value={formData.replacement} onChange={(e) => setFormData({ ...formData, replacement: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Field Target" value={formData.fieldTarget} onChange={(e) => setFormData({ ...formData, fieldTarget: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Priority" type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Blocked Count" type="number" value={formData.blockedCount} onChange={(e) => setFormData({ ...formData, blockedCount: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Error Message" multiline rows={2} value={formData.errorMessage} onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })} />
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
          <Button onClick={handleSave} variant="contained">Create Rule</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Input Sanitization Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the rule &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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

export default InputSanitizationRulesPage;
