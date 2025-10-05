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
  DialogContentText,
  Tabs,
  Tab,
  Badge,
  Collapse,
  ListSubheader,
  Checkbox,
  Alert
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
  Publish as PublishIcon,
  Psychology as AIIcon,
  Speed as OptimizeIcon,
  Insights as InsightsIcon,
  Timeline as MonitorIcon,
  Lightbulb as RecommendIcon,
  Gavel as DecisionIcon,
  Assessment as ContentIcon,
  Group as TeamIcon,
  Visibility as RealtimeIcon,
  AutoFixHigh as SmartIcon,
  Create as CreateIcon,
  AccountTree as WorkflowBuilderIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import WorkflowTasks from '../../components/WorkflowTasks';
import ReviewerTasks from '../../components/ReviewerTasks';

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
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch current user to get role
        const userResponse = await api.get('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserRole(userData.role || '');
        }

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
            window.location.href = '/login';
            return;
          }

          setDashboardData({
            totalDocuments: statsData.stats?.totalDocuments || 0,
            totalUsers: statsData.stats?.totalUsers || 0,
            recentDocuments: recentDocuments.slice(0, 5)
          });
        } else if (statsResponse.status === 401) {
          // If authentication fails, redirect to login
          window.location.href = '/login';
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
      // Call logout API to clear cookies
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear ALL storage regardless of API response
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies from client side
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Hard redirect to login
    window.location.href = '/login';
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
    if (selectedDocuments.size === dashboardData.recentDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      const allIds = new Set(dashboardData.recentDocuments.map(doc => doc.id));
      setSelectedDocuments(allIds);
    }
  };

  const handleDeleteDocument = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      docId: documentId,
      docTitle: documentTitle
    });
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size > 0) {
      setBulkDeleteDialog(true);
    }
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

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected documents from database
      const deletePromises = Array.from(selectedDocuments).map(async (docId) => {
        try {
          const response = await api.delete(`/api/documents/${docId}`);
          if (!response.ok) {
            console.error(`Failed to delete document ${docId}`);
            return { success: false, docId };
          }
          return { success: true, docId };
        } catch (error) {
          console.error(`Error deleting document ${docId}:`, error);
          return { success: false, docId };
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        console.log(`Successfully deleted ${successCount} document(s)`);
      }
      if (failCount > 0) {
        console.error(`Failed to delete ${failCount} document(s)`);
      }

      // Refresh dashboard data after bulk deletion
      const fetchDashboardData = async () => {
        try {
          const statsResponse = await api.get('/api/dashboard/stats');
          const docsResponse = await api.get('/api/documents/search?limit=5');

          if (statsResponse.ok && docsResponse.ok) {
            const statsData = await statsResponse.json();
            const docsData = await docsResponse.json();

            const recentDocuments = docsData.documents || [];

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
      setSelectedDocuments(new Set());
      setBulkDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('An error occurred while deleting documents. Please try again.');
    }
  };

  const handleAIWorkflow = () => {
    router.push('/ai-workflow');
  };

  const handleAIDocumentGenerator = () => {
    router.push('/ai-document-generator');
  };

  const handleWorkflowBuilder = () => {
    router.push('/workflow-builder');
  };

  const handleUsersManagement = () => {
    router.push('/users');
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
            Your enterprise document management system with AI-powered workflow automation is ready to use
          </Typography>
          
          {/* AI Features Highlight */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 2, color: 'primary.main', fontSize: 30 }} />
            <Box>
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                🚀 NEW: AI Workflow Assistant Available!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access 8 powerful AI features including smart recommendations, real-time monitoring, 
                decision support, and predictive analytics. Click the AI Features card or button to explore.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Feature Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Document Management */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => router.push('/documents')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <DocumentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Document Management
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Create, edit, and manage documents with collaborative workflows
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Document Generator */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleAIDocumentGenerator}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <SmartIcon sx={{ fontSize: 48, color: 'white', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Document Generator
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }} variant="body2">
                  Generate professional documents with AI assistance
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Workflow Builder */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleWorkflowBuilder}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <WorkflowBuilderIcon sx={{ fontSize: 48, color: 'white', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Workflow Builder
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }} variant="body2">
                  Design and manage document approval workflows
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Workflow Assistant */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleAIWorkflow}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <AIIcon sx={{ fontSize: 48, color: 'white', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Workflow Assistant
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }} variant="body2">
                  8 AI-powered features for workflow optimization
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Search & Analytics */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleSearchDocuments}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <SearchIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Search & Analytics
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Find documents and analyze workflow performance
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Publishing Management */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handlePublishing}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <PublishIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Publishing Management
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage document publishing and distribution
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* User Management */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleUsersManagement}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <AdminIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  User Management
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage users, roles, and permissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* File Upload */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={handleUploadDocument}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <UploadIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  File Upload
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Upload and import documents from various sources
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
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
                      onClick={handleBulkDelete}
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
                        onChange={handleSelectAll}
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
                        onClick={() => handleDocumentClick(doc.id)}
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
                              handleSelectDocument(doc.id);
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
                </>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No documents found. Start by uploading your first document!
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreateIcon />
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CreateIcon />}
                  size="large"
                  onClick={() => router.push('/documents/create')}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    }
                  }}
                >
                  Create New Document
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SmartIcon />}
                  size="large"
                  onClick={handleAIDocumentGenerator}
                  sx={{
                    borderColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  Generate with AI
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  size="large"
                  onClick={handleUploadDocument}
                >
                  Upload Files
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  size="large"
                  onClick={handleBrowseFolders}
                >
                  Browse Documents
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon sx={{ fontSize: 18 }} />
                System Overview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Documents</Typography>
                  <Chip size="small" label={dashboardData.totalDocuments} color="primary" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  <Chip size="small" label={dashboardData.totalUsers} color="secondary" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Published</Typography>
                  <Chip
                    size="small"
                    label={dashboardData.recentDocuments.filter(doc => doc.status === 'PUBLISHED').length}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

            {/* Admin Workflow Controls Section - Only visible to admin users */}
            {(userRole === 'ADMIN' || userRole === 'Admin' || userRole === 'WORKFLOW_ADMIN') && (
              <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AdminIcon sx={{ color: 'error.main' }} />
                    Admin Workflow Controls (Review Collection Phase)
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={async () => {
                          // Submit review functionality
                          try {
                            const response = await api.post('/api/workflow/submit-review');
                            if (response.ok) {
                              alert('Review submitted successfully');
                            } else {
                              alert('Failed to submit review');
                            }
                          } catch (error) {
                            console.error('Error submitting review:', error);
                            alert('Error submitting review');
                          }
                        }}
                      >
                        Submit Review
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={async () => {
                          // All reviews complete - advance workflow
                          try {
                            const response = await api.post('/api/workflow/all-reviews-complete');
                            if (response.ok) {
                              alert('Workflow advanced successfully - All reviews marked as complete');
                            } else {
                              alert('Failed to advance workflow');
                            }
                          } catch (error) {
                            console.error('Error advancing workflow:', error);
                            alert('Error advancing workflow');
                          }
                        }}
                      >
                        All Reviews Complete
                      </Button>
                    </Box>
                    <Divider />
                    <Typography variant="caption" color="text.secondary">
                      Use "Submit Review" to submit your own review. Use "All Reviews Complete" when all reviewers have submitted their feedback to advance the workflow to the next stage.
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            )}

            {/* AI Workflow Section */}
            <Grid item xs={12} md={6} lg={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AIIcon />}
                    size="large"
                    onClick={handleAIWorkflow}
                    sx={{
                      color: 'primary.main',
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  🤖 AI Workflow Assistant
                </Button>
                </Grid>
              </Grid>
            </Grid>
        </Grid>

          {/* Workflow Tasks - Pending Approvals */}
          <Box sx={{ mt: 3 }}>
            <WorkflowTasks showHeader={true} maxTasks={5} />
          </Box>

          {/* Reviewer Tasks - For Sub-Reviewers */}
          <Box sx={{ mt: 3 }}>
            <ReviewerTasks />
          </Box>

        {/* System Status */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonitorIcon />
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Backend API</Typography>
                  <Chip label="Online" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Database</Typography>
                  <Chip label="Connected" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">AI Services</Typography>
                  <Chip label="Available" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
            </Grid>
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

export default DashboardPage;