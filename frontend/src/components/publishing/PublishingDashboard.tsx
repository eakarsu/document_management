'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Publish,
  Schedule,
  CheckCircle,
  Error,
  Visibility,
  Edit,
  Add,
  Timeline,
  Assessment,
  Notifications,
  Approval,
  Group
} from '@mui/icons-material';
import { api } from '@/lib/api';
import PublishingWorkflowForm from './PublishingWorkflowForm';
import DocumentPublishForm from './DocumentPublishForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`publishing-tabpanel-${index}`}
      aria-labelledby={`publishing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function PublishingDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [workflowFormOpen, setWorkflowFormOpen] = useState(false);
  const [publishFormOpen, setPublishFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadWorkflows();
    loadTemplates();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/api/publishing/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.dashboard);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data');
    }
  };

  const loadWorkflows = async () => {
    try {
      // For now, set the workflows we created directly
      // In production, this would fetch from /api/publishing/workflows
      setWorkflows([
        {
          id: 'cmeei0nyf0001jeh3ayevrt2q',
          name: 'Simple Document Publishing',
          description: 'Basic publishing workflow',
          workflowType: 'DOCUMENT_APPROVAL',
          isActive: true,
          autoApprove: true
        },
        {
          id: 'cmeeihgpy0008x9uorr9oqsgf',
          name: 'Standard Publishing Process',
          description: 'Standard workflow for document publishing',
          workflowType: 'DOCUMENT_APPROVAL',
          isActive: true,
          autoApprove: true
        },
        {
          id: 'express-workflow',
          name: 'Express Publishing',
          description: 'Fast-track publishing for urgent documents',
          workflowType: 'DOCUMENT_APPROVAL',
          isActive: true,
          autoApprove: true
        }
      ]);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/publishing/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (workflowData: any) => {
    try {
      await api.post('/api/publishing/workflows', workflowData);
      await loadWorkflows();
      setWorkflowFormOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create workflow');
    }
  };

  const handleEditWorkflow = (workflow: any) => {
    setEditingWorkflow(workflow);
    setWorkflowFormOpen(true);
  };

  const handlePublishDocument = async (publishData: any) => {
    try {
      await api.post('/api/publishing/submit', publishData);
      await loadDashboardData();
      setPublishFormOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit for publishing');
    }
  };

  const handleApproval = async (publishingId: string, stepId: string, decision: string, comments?: string) => {
    try {
      await api.post('/api/publishing/approvals', {
        publishingId,
        stepId,
        decision,
        comments
      });
      await loadDashboardData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to process approval');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'APPROVED': return 'info';
      case 'PENDING_APPROVAL': return 'warning';
      case 'REJECTED': return 'error';
      case 'IN_APPROVAL': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading publishing dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Publishing Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setWorkflowFormOpen(true)}
          >
            Create Workflow
          </Button>
          <Button
            variant="contained"
            startIcon={<Publish />}
            onClick={() => setPublishFormOpen(true)}
          >
            Publish Document
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge badgeContent={dashboardData.pendingApprovals} color="error">
                    <Approval color="primary" />
                  </Badge>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {dashboardData.pendingApprovals}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approvals
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule color="primary" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {dashboardData.scheduledPublications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Publications
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {dashboardData.recentPublications?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recent Publications
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge badgeContent={dashboardData.myApprovals?.length || 0} color="primary">
                    <Group color="primary" />
                  </Badge>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {dashboardData.myApprovals?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      My Approvals
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="My Approvals" icon={<Approval />} />
          <Tab label="Recent Publications" icon={<Timeline />} />
          <Tab label="Workflows" icon={<Assessment />} />
          <Tab label="Templates" icon={<Edit />} />
        </Tabs>

        {/* My Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          {dashboardData?.myApprovals?.length > 0 ? (
            <List>
              {dashboardData.myApprovals.map((approval: any) => (
                <ListItem key={approval.id} divider>
                  <ListItemText
                    primary={approval.documentPublishing.document.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Step: {approval.approvalStep.stepName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {approval.dueDate ? formatDate(approval.dueDate) : 'No deadline'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleApproval(
                          approval.publishingId,
                          approval.stepId,
                          'APPROVE'
                        )}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleApproval(
                          approval.publishingId,
                          approval.stepId,
                          'REJECT'
                        )}
                      >
                        Reject
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => {
                          // Navigate to document view
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No pending approvals
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Recent Publications Tab */}
        <TabPanel value={tabValue} index={1}>
          {dashboardData?.recentPublications?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Published By</TableCell>
                    <TableCell>Published Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.recentPublications.map((publication: any) => (
                    <TableRow key={publication.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {publication.document.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {publication.document.fileName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {publication.publishedBy ? 
                          `${publication.publishedBy.firstName} ${publication.publishedBy.lastName}` : 
                          'System'
                        }
                      </TableCell>
                      <TableCell>
                        {publication.publishedAt ? formatDate(publication.publishedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={publication.publishingStatus}
                          color={getStatusColor(publication.publishingStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Navigate to document view
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No recent publications
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Workflows Tab */}
        <TabPanel value={tabValue} index={2}>
          {workflows.length > 0 ? (
            <List>
              {workflows.map((workflow: any) => (
                <ListItem key={workflow.id} divider>
                  <ListItemText
                    primary={workflow.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Type: {workflow.workflowType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {workflow.description}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => handleEditWorkflow(workflow)}
                    >
                      <Edit />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No workflows created yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setWorkflowFormOpen(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Workflow
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={3}>
          {templates.length > 0 ? (
            <Grid container spacing={2}>
              {templates.map((template: any) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Chip
                        label={template.templateType}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Used {template.usageCount} times
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            // Preview template
                          }}
                        >
                          Preview
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No publishing templates available
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <PublishingWorkflowForm
        open={workflowFormOpen}
        onClose={() => {
          setWorkflowFormOpen(false);
          setEditingWorkflow(null);
        }}
        onSubmit={handleCreateWorkflow}
        editingWorkflow={editingWorkflow}
      />

      <DocumentPublishForm
        open={publishFormOpen}
        onClose={() => setPublishFormOpen(false)}
        onSubmit={handlePublishDocument}
        workflows={workflows}
      />
    </Box>
  );
}