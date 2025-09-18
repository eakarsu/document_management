'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Assignment,
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Visibility,
  Send
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DistributionModal from './DistributionModal';

interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  stepNumber: number;
  formData: any;
  dueDate?: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  document?: {
    id: string;
    title: string;
    status: string;
    currentVersion: number;
  };
}

interface WorkflowTasksProps {
  showHeader?: boolean;
  maxTasks?: number;
}

const WorkflowTasks: React.FC<WorkflowTasksProps> = ({
  showHeader = true,
  maxTasks
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distributionModal, setDistributionModal] = useState<{
    open: boolean;
    documentId?: string;
    documentTitle?: string;
    workflowInstanceId?: string;
    stageId?: string;
  }>({ open: false });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflow/tasks', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let taskList = data.tasks || [];
        if (maxTasks) {
          taskList = taskList.slice(0, maxTasks);
        }
        setTasks(taskList);
        setError(null);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Failed to fetch workflow tasks:', error);
      setError('Failed to load workflow tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleViewDocument = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleApprovalAction = async (taskId: string, documentId: string, versionId: string, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          comments: `${action === 'approve' ? 'Approved' : 'Rejected'} from workflow dashboard`
        })
      });

      if (response.ok) {
        // Refresh tasks after approval
        await fetchTasks();
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval failed:', error);
      setError(error instanceof Error ? error.message : 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {showHeader && (
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Badge badgeContent={tasks.length} color="primary">
            <Assignment sx={{ mr: 1 }} />
          </Badge>
          Pending Approvals
        </Typography>
      )}

      <Paper>
        {tasks.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No pending tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up! No documents need your approval.
            </Typography>
          </Box>
        ) : (
          <List>
            {tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Assignment />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1">
                          {task.title}
                        </Typography>
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority)}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {task.description}
                        </Typography>
                        
                        {task.document && (
                          <Typography component="span" sx={{ display: 'block', mb: 1 }}>
                            <Typography component="span" variant="body2" sx={{ fontWeight: 'medium' }}>
                              Document: {task.document.title}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Status: {task.document.status} • Version: {task.document.currentVersion}
                            </Typography>
                          </Typography>
                        )}
                        
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Person sx={{ fontSize: 16 }} />
                          <Typography component="span" variant="caption" color="text.secondary">
                            From {task.createdBy?.firstName || 'Unknown'} {task.createdBy?.lastName || 'User'}
                          </Typography>
                          <Schedule sx={{ fontSize: 16, ml: 1 }} />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {formatDate(task.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Box component="span" sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          {task.document && (
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewDocument(task.document!.id)}
                            >
                              View Document
                            </Button>
                          )}

                          {task.formData?.action === 'DISTRIBUTE' ? (
                            <Button
                              size="small"
                              color="primary"
                              variant="contained"
                              startIcon={<Send />}
                              onClick={() => setDistributionModal({
                                open: true,
                                documentId: task.document!.id,
                                documentTitle: task.document!.title,
                                workflowInstanceId: task.formData.workflowInstanceId,
                                stageId: task.formData.stageId
                              })}
                              disabled={loading}
                            >
                              Distribute to Sub-Reviewers
                            </Button>
                          ) : (
                            task.formData?.documentId && task.formData?.versionId && (
                              <>
                                <Button
                                  size="small"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleApprovalAction(
                                    task.id,
                                    task.formData.documentId,
                                    task.formData.versionId,
                                    'approve'
                                  )}
                                  disabled={loading}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<Cancel />}
                                  onClick={() => handleApprovalAction(
                                    task.id,
                                    task.formData.documentId,
                                    task.formData.versionId,
                                    'reject'
                                  )}
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                              </>
                            )
                          )}
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < tasks.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {distributionModal.open && (
        <DistributionModal
          open={distributionModal.open}
          onClose={() => {
            setDistributionModal({ open: false });
            fetchTasks(); // Refresh tasks after distribution
          }}
          documentId={distributionModal.documentId || ''}
          documentTitle={distributionModal.documentTitle || ''}
          workflowInstanceId={distributionModal.workflowInstanceId || ''}
          stageId={distributionModal.stageId || ''}
        />
      )}
    </Box>
  );
};

export default WorkflowTasks;