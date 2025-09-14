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
  Avatar,
  Tooltip,
  TablePagination,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Divider,
  Checkbox,
  DialogContentText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as AddUserIcon,
  Search as SearchIcon,
  ArrowBack,
  Business,
  AdminPanelSettings,
  Person,
  Email,
  Phone,
  Badge,
  CalendarToday,
  Security,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  phone?: string;
  department?: string;
  title?: string;
  isActive?: boolean;
}

interface Role {
  id: string;
  name: string;
}

const UsersManagementPage: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for editing/adding
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    phone: '',
    department: '',
    title: '',
    password: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    usersByRole: {} as Record<string, number>
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);

        // Use stats from backend instead of calculating from paginated list
        if (data.stats) {
          setStats({
            totalUsers: data.stats.totalUsers,
            activeUsers: data.stats.activeUsers,
            adminCount: data.stats.administrators,
            usersByRole: {} // This would need backend support to populate properly
          });
        } else {
          // Fallback to calculating from current page (not accurate for totals)
          calculateStats(data.users || []);
        }
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/roles');

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const calculateStats = (usersList: User[]) => {
    const usersByRole: Record<string, number> = {};
    let adminCount = 0;
    let activeCount = 0;

    usersList.forEach(user => {
      const roleName = user.role?.name || 'No Role';
      usersByRole[roleName] = (usersByRole[roleName] || 0) + 1;

      if (roleName === 'ADMIN' || roleName === 'Admin') {
        adminCount++;
      }

      if (user.isActive !== false) {
        activeCount++;
      }
    });

    setStats({
      totalUsers: usersList.length,
      activeUsers: activeCount,
      adminCount,
      usersByRole
    });
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.role?.id || '',
      phone: user.phone || '',
      department: user.department || '',
      title: user.title || '',
      password: ''
    });
    setEditDialog(true);
  };

  const handleAddClick = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      roleId: '',
      phone: '',
      department: '',
      title: '',
      password: ''
    });
    setAddDialog(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      const url = editDialog
        ? `/api/users/${selectedUser?.id}`
        : '/api/users';

      const method = editDialog ? 'PUT' : 'POST';

      const response = editDialog
        ? await api.put(url, formData)
        : await api.post(url, formData);

      if (response.ok) {
        setSuccess(editDialog ? 'User updated successfully' : 'User created successfully');
        setEditDialog(false);
        setAddDialog(false);
        fetchUsers();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await api.delete(`/api/users/${selectedUser?.id}`);

      if (response.ok) {
        setSuccess('User deleted successfully');
        setDeleteDialog(false);
        fetchUsers();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      const allUserIds = new Set(filteredUsers.map(user => user.id));
      setSelectedUsers(allUserIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size > 0) {
      setBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      // Use bulk delete endpoint for efficiency
      const response = await api.post('/api/users/bulk-delete', {
        userIds: Array.from(selectedUsers)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);

        // Refresh users list
        fetchUsers();
        setSelectedUsers(new Set());
        setBulkDeleteDialog(false);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete users');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      setError('An error occurred while deleting users');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.role?.name.toLowerCase().includes(searchLower)
    );
  });

  const getRoleColor = (roleName: string) => {
    switch (roleName?.toUpperCase()) {
      case 'ADMIN':
        return 'error';
      case 'OPR':
      case 'AUTHOR':
        return 'primary';
      case 'TECHNICAL_REVIEWER':
        return 'warning';
      case 'LEGAL_REVIEWER':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Users Management
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddUserIcon />}
            onClick={handleAddClick}
            sx={{ mr: 2 }}
          >
            Add User
          </Button>
          <IconButton color="inherit" onClick={fetchUsers}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary" variant="body2">
                    Total Users
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Security sx={{ mr: 1, color: 'success.main' }} />
                  <Typography color="text.secondary" variant="body2">
                    Active Users
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.activeUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AdminPanelSettings sx={{ mr: 1, color: 'error.main' }} />
                  <Typography color="text.secondary" variant="body2">
                    Administrators
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.adminCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography color="text.secondary" variant="body2">
                    Roles
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {Object.keys(stats.usersByRole).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search users by name, email, or role..."
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
              {selectedUsers.size > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                  sx={{ minWidth: '150px' }}
                >
                  Delete ({selectedUsers.size})
                </Button>
              )}
            </Box>
            {/* Selection info bar */}
            {selectedUsers.size > 0 && (
              <Box sx={{
                p: 1.5,
                bgcolor: 'info.lighter',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="body2">
                  {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                </Typography>
                <Button size="small" onClick={() => setSelectedUsers(new Set())}>
                  Clear Selection
                </Button>
              </Box>
            )}
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                      checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow
                      key={user.id}
                      selected={selectedUsers.has(user.id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2 }}>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {user.firstName} {user.lastName}
                            </Typography>
                            {user.title && (
                              <Typography variant="caption" color="text.secondary">
                                {user.title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role?.name || 'No Role'}
                          size="small"
                          color={getRoleColor(user.role?.name)}
                        />
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive !== false ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.isActive !== false ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit User">
                          <IconButton
                            onClick={() => handleEditClick(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            onClick={() => handleDeleteClick(user)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
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
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      </Container>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.firstName} {selectedUser?.lastName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Multiple Users</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedUsers.size} selected user{selectedUsers.size > 1 ? 's' : ''}?
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

export default UsersManagementPage;