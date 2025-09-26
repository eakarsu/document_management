'use client';

import React from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { WorkflowStep } from '../../types/workflow-builder';

interface StepConfigurationDialogProps {
  open: boolean;
  step: WorkflowStep | null;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
  onStepChange: (step: WorkflowStep) => void;
}

const StepConfigurationDialog: React.FC<StepConfigurationDialogProps> = ({
  open,
  step,
  onClose,
  onSave,
  onStepChange
}) => {
  const availableRoles = ['AUTHOR', 'REVIEWER', 'APPROVER', 'LEGAL_REVIEWER', 'MANAGER', 'COMMANDER'];
  const availableActions = ['Approve', 'Reject', 'Request Changes', 'Comment'];

  const handleRoleChange = (role: string, checked: boolean) => {
    if (!step) return;

    if (checked) {
      onStepChange({
        ...step,
        roles: [...step.roles, role]
      });
    } else {
      onStepChange({
        ...step,
        roles: step.roles.filter(r => r !== role)
      });
    }
  };

  const handleSave = () => {
    if (step) {
      onSave(step);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Configure Step</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {step && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Step Name"
              value={step.name}
              onChange={(e) => {
                onStepChange({
                  ...step,
                  name: e.target.value
                });
              }}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned Roles</Typography>
              {availableRoles.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={step.roles.includes(role)}
                      onChange={(e) => handleRoleChange(role, e.target.checked)}
                    />
                  }
                  label={role}
                />
              ))}
            </Box>

            <TextField
              label="Time Limit (Days)"
              type="number"
              placeholder="Optional"
              fullWidth
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Available Actions</Typography>
              {availableActions.map((action) => (
                <FormControlLabel
                  key={action}
                  control={<Checkbox />}
                  label={action}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StepConfigurationDialog;