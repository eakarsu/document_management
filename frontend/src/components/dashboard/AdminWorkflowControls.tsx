'use client';

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  Divider
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { api } from '@/lib/api';

interface AdminWorkflowControlsProps {
  userRole: string;
}

export const AdminWorkflowControls: React.FC<AdminWorkflowControlsProps> = ({ userRole }) => {
  const handleSubmitReview = async () => {
    try {
      const response = await api.post('/api/workflow/submit-review');
      if (response.ok) {
        alert('Review submitted successfully');
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    }
  };

  const handleAllReviewsComplete = async () => {
    try {
      const response = await api.post('/api/workflow/all-reviews-complete');
      if (response.ok) {
        alert('Workflow advanced successfully - All reviews marked as complete');
      } else {
        alert('Failed to advance workflow');
      }
    } catch (error) {
      console.error('Error advancing workflow:', error);
      alert('Error advancing workflow');
    }
  };

  // Only render for admin users
  if (!(userRole === 'ADMIN' || userRole === 'Admin' || userRole === 'WORKFLOW_ADMIN')) {
    return null;
  }

  return (
    <Grid item xs={12} md={6} lg={4}>
      <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AdminIcon sx={{ color: 'error.main' }} />
          Admin Workflow Controls (Review Collection Phase)
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmitReview}
            >
              Submit Review
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              onClick={handleAllReviewsComplete}
            >
              All Reviews Complete
            </Button>
          </Box>
          <Divider />
          <Typography variant="caption" color="text.secondary">
            Use "Submit Review" to submit your own review. Use "All Reviews Complete" when all reviewers have submitted their feedback to advance the workflow to the next stage.
          </Typography>
        </Stack>
      </Paper>
    </Grid>
  );
};