import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { Recommendation } from '@/types/recommendation-engine';

interface ImplementationDialogProps {
  open: boolean;
  recommendation: Recommendation | null;
  loading: boolean;
  onClose: () => void;
  onImplement: () => void;
}

const ImplementationDialog: React.FC<ImplementationDialogProps> = ({
  open,
  recommendation,
  loading,
  onClose,
  onImplement
}) => {
  if (!recommendation) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Implement Recommendation</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Are you ready to implement "{recommendation.title}"?
        </Typography>

        <Box>
          <Typography variant="subtitle2" gutterBottom>Expected Impact:</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2">
                Efficiency: +{recommendation.impact.efficiency}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Time Saved: {recommendation.impact.timeReduction}h
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Quality: +{recommendation.impact.qualityImprovement}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Cost Savings: ${recommendation.impact.costSavings.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            Implementation time: {recommendation.estimatedImplementationTime} hours
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onImplement}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
        >
          {loading ? 'Implementing...' : 'Implement Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImplementationDialog;