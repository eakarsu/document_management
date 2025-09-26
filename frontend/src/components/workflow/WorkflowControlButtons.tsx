import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  RestartAlt,
  Assignment,
  Send,
  CheckCircle,
  Cancel,
  ArrowDropDown,
  Rocket
} from '@mui/icons-material';

interface WorkflowControlButtonsProps {
  documentId: string;
  workflowStatus: {
    isActive: boolean;
    currentStageId?: string;
    currentStageName?: string;
  } | null;
  userRole?: string;
  onWorkflowStart?: (templateId: string) => Promise<void>;
  onWorkflowStop?: () => Promise<void>;
  onWorkflowPause?: () => Promise<void>;
  onWorkflowResume?: () => Promise<void>;
  onWorkflowRestart?: () => Promise<void>;
  onStageComplete?: () => Promise<void>;
  onStageReject?: (reason: string) => Promise<void>;
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'af_8_stage_workflow',
    name: 'Air Force 8-Stage Workflow',
    description: 'Official Air Force document approval workflow',
    icon: '🇺🇸'
  },
  {
    id: 'simple_approval',
    name: 'Simple Approval',
    description: 'Basic 3-step approval process',
    icon: '✅'
  },
  {
    id: 'technical_review',
    name: 'Technical Review',
    description: 'Technical document review with parallel reviews',
    icon: '⚙️'
  },
  {
    id: 'emergency_approval',
    name: 'Emergency Fast-Track',
    description: 'Expedited approval for urgent documents',
    icon: '⚠️'
  }
];

export const WorkflowControlButtons: React.FC<WorkflowControlButtonsProps> = ({
  documentId,
  workflowStatus,
  userRole = 'USER',
  onWorkflowStart,
  onWorkflowStop,
  onWorkflowPause,
  onWorkflowResume,
  onWorkflowRestart,
  onStageComplete,
  onStageReject
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!workflowStatus?.isActive) {
      setStartDialogOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStartWorkflow = async () => {
    if (!selectedTemplate) {
      setError('Please select a workflow template');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (onWorkflowStart) {
        await onWorkflowStart(selectedTemplate);
      }
      setStartDialogOpen(false);
      setSelectedTemplate('');
    } catch (err) {
      setError('Failed to start workflow');
      console.error('Error starting workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageComplete = async () => {
    setLoading(true);
    try {
      if (onStageComplete) {
        await onStageComplete();
      }
      handleClose();
    } catch (err) {
      console.error('Error completing stage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      if (onStageReject) {
        await onStageReject(rejectReason);
      }
      setRejectDialogOpen(false);
      setRejectReason('');
      handleClose();
    } catch (err) {
      console.error('Error rejecting stage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      if (onWorkflowStop) {
        await onWorkflowStop();
      }
      handleClose();
    } catch (err) {
      console.error('Error stopping workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      if (onWorkflowPause) {
        await onWorkflowPause();
      }
      handleClose();
    } catch (err) {
      console.error('Error pausing workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      if (onWorkflowResume) {
        await onWorkflowResume();
      }
      handleClose();
    } catch (err) {
      console.error('Error resuming workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      if (onWorkflowRestart) {
        await onWorkflowRestart();
      }
      handleClose();
    } catch (err) {
      console.error('Error restarting workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const isWorkflowActive = workflowStatus?.isActive || false;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Workflow Status Chip */}
      {isWorkflowActive && (
        <Chip
          label={`Stage: ${workflowStatus?.currentStageName || 'Unknown'}`}
          color="primary"
          variant="outlined"
          icon={<Assignment />}
        />
      )}

      {/* Main Control Button Group */}
      <ButtonGroup variant="contained" aria-label="workflow control button group">
        {!isWorkflowActive ? (
          <Button
            startIcon={<Rocket />}
            onClick={handleStartClick}
            color="success"
            disabled={loading}
          >
            Start Workflow
          </Button>
        ) : (
          <>
            <Button
              onClick={handleStartClick}
              endIcon={<ArrowDropDown />}
              disabled={loading}
            >
              Workflow Actions
            </Button>
          </>
        )}
      </ButtonGroup>

      {/* Stage Action Buttons (when workflow is active) */}
      {isWorkflowActive && (
        <ButtonGroup variant="outlined">
          <Tooltip title="Complete current stage">
            <Button
              startIcon={<CheckCircle />}
              onClick={handleStageComplete}
              color="success"
              disabled={loading}
            >
              Complete Stage
            </Button>
          </Tooltip>
          <Tooltip title="Reject and return">
            <Button
              startIcon={<Cancel />}
              onClick={() => setRejectDialogOpen(true)}
              color="error"
              disabled={loading}
            >
              Reject
            </Button>
          </Tooltip>
        </ButtonGroup>
      )}

      {/* Workflow Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handlePause}>
          <Pause sx={{ mr: 1 }} /> Pause Workflow
        </MenuItem>
        <MenuItem onClick={handleResume}>
          <PlayArrow sx={{ mr: 1 }} /> Resume Workflow
        </MenuItem>
        <MenuItem onClick={handleRestart}>
          <RestartAlt sx={{ mr: 1 }} /> Restart Workflow
        </MenuItem>
        <MenuItem onClick={handleStop}>
          <Stop sx={{ mr: 1 }} /> Stop Workflow
        </MenuItem>
      </Menu>

      {/* Start Workflow Dialog */}
      <Dialog
        open={startDialogOpen}
        onClose={() => !loading && setStartDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rocket />
            Start New Workflow
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a workflow template to begin the document approval process.
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="workflow-template-label">Workflow Template</InputLabel>
            <Select
              labelId="workflow-template-label"
              value={selectedTemplate}
              label="Workflow Template"
              onChange={(e: SelectChangeEvent) => setSelectedTemplate(e.target.value)}
              disabled={loading}
            >
              {WORKFLOW_TEMPLATES.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <span>{template.icon}</span>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStartWorkflow}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
            disabled={loading || !selectedTemplate}
          >
            {loading ? 'Starting...' : 'Start Workflow'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Stage Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !loading && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Stage</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this stage. The document will be returned to the previous stage.
          </Typography>
          <textarea
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStageReject}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={16} /> : <Cancel />}
            disabled={loading || !rejectReason.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject Stage'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowControlButtons;