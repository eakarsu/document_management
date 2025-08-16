'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepConnector,
  Tooltip,
  Menu,
  MenuItem as MenuOption,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Group,
  MoreVert,
  Comment,
  History,
  Warning,
  ExpandMore,
  Assignment,
  Timeline,
  Approval,
  RateReview,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import { api } from '@/lib/api';

interface ApprovalStep {
  id: string;
  stepNumber: number;
  stepName: string;
  description: string;
  isRequired: boolean;
  timeoutHours: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
  requiredApprovals: number;
  receivedApprovals: number;
  approvers: Approver[];
}

interface Approver {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED';
  decision?: string;
  comments?: string;
  respondedAt?: string;
  dueDate?: string;
  delegatedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface WorkflowStatus {
  id: string;
  document: {
    title: string;
    fileName: string;
  };
  publishingStatus: string;
  currentStep: number;
  totalSteps: number;
  urgencyLevel: string;
  submittedBy: {
    firstName: string;
    lastName: string;
  };
  submittedAt: string;
  approvalSteps: ApprovalStep[];
  timeline: any[];
}

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  approver: Approver | null;
  onSubmit: (decision: string, comments?: string, conditions?: string) => void;
}

function ApprovalDialog({ open, onClose, approver, onSubmit }: ApprovalDialogProps) {
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [conditions, setConditions] = useState('');

  const handleSubmit = () => {
    if (decision) {
      onSubmit(decision, comments || undefined, conditions || undefined);
      setDecision('');
      setComments('');
      setConditions('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Process Approval
        {approver && (
          <Typography variant="body2" color="text.secondary">
            Document approval request
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Decision</InputLabel>
            <Select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              label="Decision"
              required
            >
              <MenuItem value="APPROVE">Approve</MenuItem>
              <MenuItem value="REJECT">Reject</MenuItem>
              <MenuItem value="APPROVE_WITH_CONDITIONS">Approve with Conditions</MenuItem>
              <MenuItem value="REQUEST_CHANGES">Request Changes</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Add your comments or feedback..."
          />

          {decision === 'APPROVE_WITH_CONDITIONS' && (
            <TextField
              fullWidth
              label="Conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              multiline
              rows={2}
              placeholder="Specify the conditions for approval..."
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!decision}
          color={decision === 'APPROVE' || decision === 'APPROVE_WITH_CONDITIONS' ? 'success' : 'error'}
        >
          Submit {decision === 'APPROVE' ? 'Approval' : decision === 'REJECT' ? 'Rejection' : 'Decision'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ApprovalChainManager({ publishingId }: { publishingId?: string }) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedStep, setExpandedStep] = useState<string | false>(false);

  useEffect(() => {
    if (publishingId) {
      loadWorkflowStatus();
    }
  }, [publishingId]);

  const loadWorkflowStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/publishing/collaborative/${publishingId}/status`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowStatus(data.status);
      } else {
        setError('Failed to load workflow status');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load workflow status');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (decision: string, comments?: string, conditions?: string) => {
    if (!selectedApprover || !workflowStatus) return;

    try {
      await api.post('/api/publishing/collaborative/approvals', {
        publishingId: workflowStatus.id,
        stepId: getCurrentStepId(),
        decision,
        comments,
        conditions
      });
      
      await loadWorkflowStatus();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to process approval');
    }
  };

  const getCurrentStepId = () => {
    if (!workflowStatus) return '';
    const currentStep = workflowStatus.approvalSteps.find(
      step => step.stepNumber === workflowStatus.currentStep
    );
    return currentStep?.id || '';
  };

  const getStepStatus = (step: ApprovalStep) => {
    if (step.stepNumber < workflowStatus!.currentStep) return 'COMPLETED';
    if (step.stepNumber === workflowStatus!.currentStep) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const getStepIcon = (step: ApprovalStep) => {
    const status = getStepStatus(step);
    switch (status) {
      case 'COMPLETED': return <CheckCircle color="success" />;
      case 'IN_PROGRESS': return <PlayArrow color="primary" />;
      case 'PENDING': return <Schedule color="disabled" />;
      default: return <Schedule color="disabled" />;
    }
  };

  const getApproverStatusIcon = (approver: Approver) => {
    switch (approver.status) {
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Cancel color="error" />;
      case 'DELEGATED': return <Assignment color="info" />;
      case 'PENDING': return <Schedule color="warning" />;
      default: return <Schedule color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const calculateProgress = () => {
    if (!workflowStatus) return 0;
    return (workflowStatus.currentStep / workflowStatus.totalSteps) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading approval chain...
        </Typography>
      </Box>
    );
  }

  if (!workflowStatus) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No approval workflow found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Approval Chain Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {workflowStatus.document.title}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Workflow Progress</Typography>
                <Chip
                  label={workflowStatus.publishingStatus}
                  color={getStatusColor(workflowStatus.publishingStatus) as any}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Step {workflowStatus.currentStep} of {workflowStatus.totalSteps}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={calculateProgress()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted by
                  </Typography>
                  <Typography variant="body1">
                    {workflowStatus.submittedBy.firstName} {workflowStatus.submittedBy.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted on
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(workflowStatus.submittedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Info
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                File: {workflowStatus.document.fileName}
              </Typography>
              <Chip
                label={workflowStatus.urgencyLevel}
                color={workflowStatus.urgencyLevel === 'HIGH' || workflowStatus.urgencyLevel === 'URGENT' ? 'error' : 'default'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Steps */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Approval Steps
          </Typography>
          
          <Stepper orientation="vertical" nonLinear>
            {workflowStatus.approvalSteps.map((step) => {
              const stepStatus = getStepStatus(step);
              const isCurrentStep = step.stepNumber === workflowStatus.currentStep;
              
              return (
                <Step key={step.id} active={isCurrentStep} completed={stepStatus === 'COMPLETED'}>
                  <StepLabel
                    icon={getStepIcon(step)}
                    error={false}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {step.stepName}
                      </Typography>
                      <Chip
                        label={`${step.receivedApprovals}/${step.requiredApprovals}`}
                        size="small"
                        color={step.receivedApprovals >= step.requiredApprovals ? 'success' : 'default'}
                      />
                      {step.isRequired && (
                        <Chip label="Required" size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                  </StepLabel>
                  
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {step.description}
                    </Typography>
                    
                    {/* Approvers for this step */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Approvers ({step.approvers.length})
                      </Typography>
                      
                      <List dense>
                        {step.approvers.map((approver) => (
                          <ListItem key={approver.id} divider>
                            <ListItemAvatar>
                              <Avatar
                                src={approver.user.avatar}
                                sx={{ 
                                  bgcolor: approver.status === 'APPROVED' ? 'success.main' : 
                                           approver.status === 'REJECTED' ? 'error.main' : 'grey.400'
                                }}
                              >
                                {approver.user.firstName[0]}{approver.user.lastName[0]}
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {approver.user.firstName} {approver.user.lastName}
                                  </Typography>
                                  {getApproverStatusIcon(approver)}
                                  <Chip
                                    label={approver.status}
                                    size="small"
                                    color={getStatusColor(approver.status) as any}
                                  />
                                  {isOverdue(approver.dueDate) && approver.status === 'PENDING' && (
                                    <Tooltip title="Overdue">
                                      <Warning color="error" fontSize="small" />
                                    </Tooltip>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {approver.user.email}
                                  </Typography>
                                  {approver.dueDate && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Due: {formatDate(approver.dueDate)}
                                    </Typography>
                                  )}
                                  {approver.comments && (
                                    <Typography variant="caption" display="block">
                                      "{approver.comments}"
                                    </Typography>
                                  )}
                                  {approver.delegatedTo && (
                                    <Typography variant="caption" color="info.main" display="block">
                                      Delegated to: {approver.delegatedTo.firstName} {approver.delegatedTo.lastName}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            
                            <ListItemSecondaryAction>
                              {isCurrentStep && approver.status === 'PENDING' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedApprover(approver);
                                    setApprovalDialogOpen(true);
                                  }}
                                >
                                  Review
                                </Button>
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Approval Timeline
          </Typography>
          
          {workflowStatus.timeline.length > 0 ? (
            <List>
              {workflowStatus.timeline.map((event, index) => (
                <ListItem key={index} divider={index < workflowStatus.timeline.length - 1}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Timeline />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={event.event}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.timestamp)}
                          {event.actor && ` • by ${event.actor.firstName || 'System'} ${event.actor.lastName || ''}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No timeline events yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        approver={selectedApprover}
        onSubmit={handleApproval}
      />
    </Box>
  );
}