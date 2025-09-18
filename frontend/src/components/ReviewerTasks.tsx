'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Assignment,
  RateReview,
  Description,
  AccessTime,
  Info,
  CheckCircle,
  Warning,
  Schedule,
  GroupWork,
  CalendarToday,
  NavigateNext,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
  formData: any;
  document?: {
    id: string;
    title: string;
    category: string;
    status: string;
  };
}

// Custom hook for grouping tasks
const useGroupedTasks = (tasks: WorkflowTask[]) => {
  return React.useMemo(() => {
    const grouped: { [key: string]: WorkflowTask[] } = {};

    tasks.forEach(task => {
      const docId = task.formData?.documentId || 'other';
      if (!grouped[docId]) {
        grouped[docId] = [];
      }
      grouped[docId].push(task);
    });

    return grouped;
  }, [tasks]);
};

export default function ReviewerTasks() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const groupedTasks = useGroupedTasks(tasks);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/tasks');

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
  };

  const handleReviewClick = (task: WorkflowTask) => {
    if (task.formData?.documentId) {
      // Navigate to Review & CRM page for reviewers
      router.push(`/documents/${task.formData.documentId}/review`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <Warning color="error" fontSize="small" />;
      case 'medium':
        return <Info color="warning" fontSize="small" />;
      default:
        return <CheckCircle color="success" fontSize="small" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && !refreshing) {
    return (
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={60} sx={{ color: 'white' }} />
          <Typography variant="h6" color="white">
            Loading your review tasks...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              My Review Tasks
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              You have {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} pending review
            </Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Filter tasks">
                <IconButton sx={{ color: 'white' }}>
                  <FilterList />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh tasks">
                <IconButton
                  sx={{ color: 'white' }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? <CircularProgress size={24} color="inherit" /> : <Refresh />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>

        {/* Stats Bar */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', p: 2, borderRadius: 2 }}>
              <Typography variant="h3" fontWeight="bold">
                {tasks.filter(t => t.status === 'PENDING').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending Reviews
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', p: 2, borderRadius: 2 }}>
              <Typography variant="h3" fontWeight="bold">
                {Object.keys(groupedTasks).length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Documents
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', p: 2, borderRadius: 2 }}>
              <Typography variant="h3" fontWeight="bold">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                In Progress
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Section */}
      {tasks.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Box sx={{ py: 4 }}>
            <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              No Review Tasks Available
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You don't have any pending review tasks at the moment.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{ mt: 3 }}
            >
              Check Again
            </Button>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Object.entries(groupedTasks).map(([docId, docTasks]) => {
            const primaryTask = docTasks[0];
            const hasDuplicates = docTasks.length > 1;

            return (
              <Grid item xs={12} key={docId}>
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  {/* Task Header */}
                  <Box
                    sx={{
                      background: 'linear-gradient(90deg, #f5f5f5 0%, #e8e8e8 100%)',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 56,
                            height: 56
                          }}
                        >
                          <Description />
                        </Avatar>
                      </Grid>
                      <Grid item xs>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography variant="h6" fontWeight="600">
                            {primaryTask.title || 'Review Task'}
                          </Typography>
                          {hasDuplicates && (
                            <Chip
                              label={`${docTasks.length} duplicate tasks`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {primaryTask.description || 'Document review required'}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Chip
                          label={primaryTask.status}
                          color={getStatusColor(primaryTask.status)}
                          size="medium"
                          sx={{ fontWeight: 600 }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Task Content */}
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        {primaryTask.document && (
                          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              DOCUMENT DETAILS
                            </Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>
                              {primaryTask.document.title}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Chip
                                icon={<GroupWork />}
                                label={primaryTask.document.category || 'General'}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                icon={<Info />}
                                label={primaryTask.document.status}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </Stack>
                          </Paper>
                        )}

                        {/* Task Metadata */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                          <Grid item xs={6}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CalendarToday fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Created
                                </Typography>
                                <Typography variant="body2">
                                  {formatDate(primaryTask.createdAt)}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={6}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Schedule fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Due Date
                                </Typography>
                                <Typography variant="body2">
                                  {formatDate(primaryTask.dueDate)}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Action Section */}
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            startIcon={<RateReview />}
                            endIcon={<NavigateNext />}
                            onClick={() => handleReviewClick(primaryTask)}
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #21CBF3 90%)',
                                transform: 'scale(1.02)'
                              }
                            }}
                          >
                            Start Review
                          </Button>

                          {hasDuplicates && (
                            <Typography variant="caption" color="error" textAlign="center">
                              Note: You have {docTasks.length} review requests for this document.
                              Completing one will complete all.
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>

                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={primaryTask.status === 'COMPLETED' ? 100 : primaryTask.status === 'IN_PROGRESS' ? 50 : 0}
                    sx={{ height: 4 }}
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}