import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Gavel } from '@mui/icons-material';
import { DecisionOption } from './types';

interface DecisionConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  selectedOption: DecisionOption | null;
  decisionRationale: string;
  onRationaleChange: (rationale: string) => void;
  decisionConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  onConfirm: () => void;
  loading: boolean;
}

export const DecisionConfirmDialog: React.FC<DecisionConfirmDialogProps> = ({
  open,
  onClose,
  selectedOption,
  decisionRationale,
  onRationaleChange,
  decisionConditions,
  onConditionsChange,
  onConfirm,
  loading
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm Decision</DialogTitle>
      <DialogContent>
        {selectedOption && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selected Option: {selectedOption.title}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Decision Rationale"
              placeholder="Explain your reasoning for this decision..."
              value={decisionRationale}
              onChange={(e) => onRationaleChange(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Additional Conditions (Optional)"
              placeholder="Any specific conditions or requirements..."
              value={decisionConditions.join('\n')}
              onChange={(e) => onConditionsChange(e.target.value.split('\n').filter(Boolean))}
              sx={{ mb: 2 }}
            />

            <Alert severity="info">
              This decision will be recorded and stakeholders will be notified.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading || !decisionRationale.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <Gavel />}
        >
          {loading ? 'Recording Decision...' : 'Confirm Decision'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};