'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Button,
  Chip,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  stepConnectorClasses,
  Stack
} from '@mui/material';
import {
  Check as CheckIcon,
  ChevronLeft as BackIcon,
  ChevronRight as ForwardIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const WorkflowConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.grey[300],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const WorkflowStepIcon = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: ownerState.completed ? theme.palette.success.main : 
                   ownerState.active ? theme.palette.primary.main : theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
}));

interface WorkflowStatusBarProps {
  documentId: string;
  currentStage: string;
  workflowHistory: any[];
  userRole: string;
  canMoveBackward: boolean;
  onStageChange: (direction: 'forward' | 'backward', fromStage: string, toStage: string) => Promise<void>;
  onRefreshWorkflow: () => void;
}

const WorkflowStatusBar: React.FC<WorkflowStatusBarProps> = ({
  documentId,
  currentStage,
  workflowHistory,
  userRole,
  canMoveBackward,
  onStageChange,
  onRefreshWorkflow
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moveBackwardOpen, setMoveBackwardOpen] = useState(false);
  const [backwardReason, setBackwardReason] = useState('');
  const [selectedBackwardStage, setSelectedBackwardStage] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Define the 8-stage workflow
  const workflowSteps = [
    { key: 'DRAFT_CREATION', label: 'OPR Creates', requiredRole: 'AUTHOR' },
    { key: 'INTERNAL_COORDINATION', label: '1st Coordination', requiredRole: 'ICU_REVIEWER' },
    { key: 'OPR_REVISIONS', label: 'OPR Revisions', requiredRole: 'OPR' },
    { key: 'EXTERNAL_COORDINATION', label: '2nd Coordination', requiredRole: 'TECHNICAL_REVIEWER' },
    { key: 'OPR_FINAL', label: 'OPR Final', requiredRole: 'OPR' },
    { key: 'LEGAL_REVIEW', label: 'Legal Review', requiredRole: 'LEGAL_REVIEWER' },
    { key: 'OPR_LEGAL', label: 'OPR Legal', requiredRole: 'OPR' },
    { key: 'FINAL_PUBLISHING', label: 'AFDPO Publish', requiredRole: 'PUBLISHER' }
  ];

  const getCurrentStepIndex = () => {
    return workflowSteps.findIndex(step => step.key === currentStage);
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'pending';
  };

  const getValidBackwardStages = () => {
    const validTransitions: Record<string, string[]> = {
      'INTERNAL_COORDINATION': ['DRAFT_CREATION'],
      'OPR_REVISIONS': ['INTERNAL_COORDINATION'],
      'EXTERNAL_COORDINATION': ['OPR_REVISIONS'],
      'OPR_FINAL': ['EXTERNAL_COORDINATION'],
      'LEGAL_REVIEW': ['OPR_FINAL'],
      'OPR_LEGAL': ['LEGAL_REVIEW'],
      'FINAL_PUBLISHING': ['OPR_LEGAL']
    };
    
    return validTransitions[currentStage] || [];
  };

  const handleMoveBackward = async () => {
    if (!selectedBackwardStage || !backwardReason.trim()) return;
    
    setIsMoving(true);
    try {
      await onStageChange('backward', currentStage, selectedBackwardStage);
      setMoveBackwardOpen(false);
      setBackwardReason('');
      setSelectedBackwardStage('');
      onRefreshWorkflow();
    } catch (error) {
      console.error('Failed to move backward:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const canAdvanceToNextStage = () => {
    const nextStageIndex = currentStepIndex + 1;
    if (nextStageIndex >= workflowSteps.length) return false;
    
    const nextStage = workflowSteps[nextStageIndex];
    return nextStage.requiredRole === userRole || userRole === 'WORKFLOW_ADMIN';
  };

  const handleAdvanceForward = async () => {
    const nextStageIndex = currentStepIndex + 1;
    if (nextStageIndex >= workflowSteps.length) return;
    
    const nextStage = workflowSteps[nextStageIndex];
    setIsMoving(true);
    
    try {
      await onStageChange('forward', currentStage, nextStage.key);
      onRefreshWorkflow();
    } catch (error) {
      console.error('Failed to advance forward:', error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Card elevation={3} sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              Workflow Status - Document {documentId}
            </Typography>
            <Box>
              <Chip 
                label={`Current Stage: ${workflowSteps[currentStepIndex]?.label || 'Unknown'}`}
                color="primary"
                icon={<TaskIcon />}
              />
              <Chip 
                label={`Role: ${userRole}`}
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>

          {/* Workflow Stepper */}
          <Stepper 
            activeStep={currentStepIndex} 
            alternativeLabel
            connector={<WorkflowConnector />}
          >
            {workflowSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <Step key={step.key}>
                  <StepLabel
                    StepIconComponent={() => (
                      <WorkflowStepIcon
                        ownerState={{
                          completed: status === 'completed',
                          active: status === 'active'
                        }}
                      >
                        {status === 'completed' ? <CheckIcon /> : index + 1}
                      </WorkflowStepIcon>
                    )}
                  >
                    <Typography variant="caption" display="block">
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {step.requiredRole}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          {/* Action Buttons */}
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setHistoryOpen(true)}
            >
              View History
            </Button>
            
            {canMoveBackward && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ArrowBackIcon />}
                onClick={() => setMoveBackwardOpen(true)}
                disabled={currentStepIndex === 0}
              >
                Move Backward
              </Button>
            )}
            
            {canAdvanceToNextStage() && (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleAdvanceForward}
                disabled={isMoving || currentStepIndex >= workflowSteps.length - 1}
              >
                {isMoving ? 'Moving...' : 'Advance Forward'}
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>

      {/* Workflow History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Workflow History</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {workflowHistory.map((entry, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <Typography variant="subtitle2">
                        {entry.stage || entry.fromStage} → {entry.toStage || 'Current'}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Chip 
                        label={entry.transitionType || 'FORWARD'} 
                        size="small"
                        color={entry.transitionType === 'BACKWARD' ? 'warning' : 'primary'}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        {entry.user?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {entry.user?.role || 'Unknown Role'}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(entry.enteredAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      {entry.reason && (
                        <Tooltip title={entry.reason}>
                          <Typography variant="body2" noWrap>
                            {entry.reason}
                          </Typography>
                        </Tooltip>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Move Backward Dialog */}
      <Dialog open={moveBackwardOpen} onClose={() => setMoveBackwardOpen(false)}>
        <DialogTitle>Move Workflow Backward</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Moving backward will return the document to a previous stage. Please provide a reason.
            </Alert>
            
            <TextField
              select
              fullWidth
              label="Target Stage"
              value={selectedBackwardStage}
              onChange={(e) => setSelectedBackwardStage(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">Select target stage</option>
              {getValidBackwardStages().map(stageKey => {
                const stage = workflowSteps.find(s => s.key === stageKey);
                return (
                  <option key={stageKey} value={stageKey}>
                    {stage?.label}
                  </option>
                );
              })}
            </TextField>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for moving backward"
              value={backwardReason}
              onChange={(e) => setBackwardReason(e.target.value)}
              placeholder="Please provide a detailed reason for this backward transition..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveBackwardOpen(false)}>Cancel</Button>
          <Button
            onClick={handleMoveBackward}
            variant="contained"
            color="warning"
            disabled={!selectedBackwardStage || !backwardReason.trim() || isMoving}
          >
            {isMoving ? 'Moving...' : 'Move Backward'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default WorkflowStatusBar;