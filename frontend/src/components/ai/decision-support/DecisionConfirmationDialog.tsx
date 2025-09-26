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
import { DecisionAnalysis } from '@/types/decision-support';

interface DecisionConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedOption: string | null;
  analysis: DecisionAnalysis | null;
  decisionRationale: string;
  onRationaleChange: (value: string) => void;
  decisionConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  loading: boolean;
  onConfirm: () => void;
}

const DecisionConfirmationDialog: React.FC<DecisionConfirmationDialogProps> = ({
  open,
  onClose,
  selectedOption,
  analysis,
  decisionRationale,
  onRationaleChange,
  decisionConditions,
  onConditionsChange,
  loading,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm Decision</DialogTitle>
      <DialogContent>
        {selectedOption && analysis && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selected Option: {analysis.options.find(opt => opt.id === selectedOption)?.title}
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

export default DecisionConfirmationDialog;