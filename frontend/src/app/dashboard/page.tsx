'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
  Menu,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Description as DocumentIcon,
  AccountCircle,
  Folder as FolderIcon,
  Search as SearchIcon,
  BarChart as AnalyticsIcon,
  Logout as LogoutIcon,
  Business,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import WorkflowTasks from '../../components/WorkflowTasks';

interface DashboardData {
  totalDocuments: number;
  totalUsers: number;
  recentDocuments: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const DashboardPage: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalDocuments: 0,
    totalUsers: 0,
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, docId: string, docTitle: string}>({
    open: false,
    docId: '',
    docTitle: ''
  });
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats (token will be read from HTTP-only cookies server-side)
        const statsResponse = await api.get('/api/dashboard/stats');

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          // Fetch recent documents (token will be read from HTTP-only cookies server-side)
          const docsResponse = await api.get('/api/documents/search?limit=5');

          let recentDocuments = [];
          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            recentDocuments = docsData.documents || [];
          } else if (docsResponse.status === 401) {
            // If documents API also returns 401, redirect to login
            router.push('/login');
            return;
          }

          setDashboardData({
            totalDocuments: statsData.stats?.totalDocuments || 0,
            totalUsers: statsData.stats?.totalUsers || 0,
            recentDocuments: recentDocuments.slice(0, 5)
          });
        } else if (statsResponse.status === 401) {
          // If authentication fails, redirect to login
          router.push('/login');
        } else {
          console.error('Failed to fetch dashboard stats:', statsResponse.status);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies and notify backend
      const response = await api.post('/api/auth/logout');

      if (response.ok) {
        // Clear any localStorage data as well
        localStorage.removeItem('user');
        
        // Redirect to login
        router.push('/login');
      } else {
        console.error('Logout failed');
        // Still redirect to login even if logout API fails
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even on error
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleUploadDocument = () => {
    router.push('/upload');
  };

  const handleBrowseFolders = () => {
    router.push('/documents');
  };

  const handleSearchDocuments = () => {
    router.push('/search');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handlePublishing = () => {
    router.push('/publishing');
  };

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleDeleteDocument = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      docId: documentId,
      docTitle: documentTitle
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/api/documents/${deleteDialog.docId}`);

      if (response.ok) {
        // Refresh dashboard data to reflect the deletion
        const fetchDashboardData = async () => {
          try {
            const statsResponse = await api.get('/api/dashboard/stats');

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              
              const docsResponse = await api.get('/api/documents/search?limit=5');

              let recentDocuments = [];
              if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                recentDocuments = docsData.documents || [];
              }

              setDashboardData({
                totalDocuments: statsData.stats?.totalDocuments || 0,
                totalUsers: statsData.stats?.totalUsers || 0,
                recentDocuments: recentDocuments.slice(0, 5)
              });
            }
          } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
          }
        };

        await fetchDashboardData();
        setDeleteDialog({ open: false, docId: '', docTitle: '' });
      } else {
        const error = await response.json();
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, docId: '', docTitle: '' });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Richmond Document Management System
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Richmond DMS
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Your enterprise document management system is ready to use
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DocumentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {dashboardData.totalDocuments}
                </Typography>
                <Typography color="text.secondary">
                  Total Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountCircle sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {dashboardData.totalUsers}
                </Typography>
                <Typography color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <FolderIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  12
                </Typography>
                <Typography color="text.secondary">
                  Folders
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PublishIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {dashboardData.recentDocuments.filter(doc => doc.status === 'PUBLISHED').length}
                </Typography>
                <Typography color="text.secondary">
                  Published Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
              {dashboardData.recentDocuments.length > 0 ? (
                <List>
                  {dashboardData.recentDocuments.map((doc, index) => (
                    <React.Fragment key={doc.id}>
                      <ListItem 
                        button
                        onClick={() => handleDocumentClick(doc.id)}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
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
                            handleDeleteDocument(doc.id, doc.title);
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
              ) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No documents found. Start by uploading your first document!
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<UploadIcon />}
                  size="large"
                  onClick={handleUploadDocument}
                >
                  Upload Document
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  size="large"
                  onClick={handleBrowseFolders}
                >
                  Browse Folders
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  size="large"
                  onClick={handleSearchDocuments}
                >
                  Search Documents
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  size="large"
                  onClick={handleViewAnalytics}
                >
                  View Analytics
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PublishIcon />}
                  size="large"
                  onClick={handlePublishing}
                  sx={{ 
                    color: 'success.main',
                    borderColor: 'success.main',
                    '&:hover': {
                      borderColor: 'success.dark',
                      backgroundColor: 'success.light'
                    }
                  }}
                >
                  Publishing Management
                </Button>
              </Stack>
            </Paper>

            {/* Workflow Tasks - Pending Approvals */}
            <Box sx={{ mt: 3 }}>
              <WorkflowTasks showHeader={true} maxTasks={5} />
            </Box>
          </Grid>
        </Grid>

        {/* API Status */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              🚀 System Status: Backend API running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} | 
              Frontend running at http://localhost:{process.env.PORT || '3000'} | 
              Database: {dashboardData.totalUsers} users, {dashboardData.totalDocuments} documents
            </Typography>
          </Paper>
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.docTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;