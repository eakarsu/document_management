import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Grid,
  Box,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Build } from '@mui/icons-material';

interface OptimizationPreviewDialogProps {
  open: boolean;
  selectedSuggestionsCount: number;
  totalImpact: {
    timeReduction: number;
    efficiencyGain: number;
    costSavings: number;
  };
  optimizationNotes: string;
  optimizing: boolean;
  onClose: () => void;
  onNotesChange: (notes: string) => void;
  onApplyOptimizations: () => void;
}

export const OptimizationPreviewDialog: React.FC<OptimizationPreviewDialogProps> = ({
  open,
  selectedSuggestionsCount,
  totalImpact,
  optimizationNotes,
  optimizing,
  onClose,
  onNotesChange,
  onApplyOptimizations
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Preview Optimizations</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          You have selected {selectedSuggestionsCount} optimization(s) that will improve your workflow:
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Expected Impact:</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="h4" color="success.main">{totalImpact.timeReduction}%</Typography>
              <Typography variant="caption">Time Reduction</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h4" color="primary.main">+{totalImpact.efficiencyGain}%</Typography>
              <Typography variant="caption">Efficiency Gain</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h4" color="info.main">{totalImpact.costSavings}h</Typography>
              <Typography variant="caption">Monthly Savings</Typography>
            </Grid>
          </Grid>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Implementation Notes (Optional)"
          placeholder="Add any specific requirements or considerations..."
          value={optimizationNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Alert severity="info">
          These optimizations will create a new workflow version. Your original workflow will be preserved.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onApplyOptimizations}
          disabled={optimizing}
          startIcon={optimizing ? <CircularProgress size={16} /> : <Build />}
        >
          {optimizing ? 'Optimizing...' : 'Apply Optimizations'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptimizationPreviewDialog;