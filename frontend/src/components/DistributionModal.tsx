'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { Send, Groups, CheckCircle } from '@mui/icons-material';
import { api } from '../lib/api';

interface SubReviewer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
}

interface DistributionModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  workflowInstanceId: string;
  stageId: string;
}

const DistributionModal: React.FC<DistributionModalProps> = ({
  open,
  onClose,
  documentId,
  documentTitle,
  workflowInstanceId,
  stageId
}) => {
  const [subReviewers, setSubReviewers] = useState<SubReviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-defined sub-reviewers for the distributed workflow
  const predefinedReviewers: SubReviewer[] = [
    {
      id: 'ops1',
      email: 'ops.reviewer1@airforce.mil',
      firstName: 'James',
      lastName: 'Wilson',
      organization: 'Operations'
    },
    {
      id: 'ops2',
      email: 'ops.reviewer2@airforce.mil',
      firstName: 'Mary',
      lastName: 'Brown',
      organization: 'Operations'
    },
    {
      id: 'log',
      email: 'log.reviewer1@airforce.mil',
      firstName: 'Christopher',
      lastName: 'Lee',
      organization: 'Logistics'
    },
    {
      id: 'fin',
      email: 'fin.reviewer1@airforce.mil',
      firstName: 'Linda',
      lastName: 'Anderson',
      organization: 'Finance'
    },
    {
      id: 'per',
      email: 'per.reviewer1@airforce.mil',
      firstName: 'Richard',
      lastName: 'Taylor',
      organization: 'Personnel'
    }
  ];

  useEffect(() => {
    if (open) {
      setSubReviewers(predefinedReviewers);
      // Select ALL reviewers by default for distribution
      setSelectedReviewers(predefinedReviewers.map(r => r.id));
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleToggleReviewer = (reviewerId: string) => {
    setSelectedReviewers(prev => {
      if (prev.includes(reviewerId)) {
        return prev.filter(id => id !== reviewerId);
      } else {
        return [...prev, reviewerId];
      }
    });
  };

  const handleDistribute = async () => {
    if (selectedReviewers.length === 0) {
      setError('Please select at least one sub-reviewer');
      return;
    }

    setDistributing(true);
    setError(null);

    try {
      // Get the emails of selected reviewers
      const reviewerEmails = selectedReviewers.map(id => {
        const reviewer = subReviewers.find(r => r.id === id);
        return reviewer?.email;
      }).filter(email => email);

      // Call the distribution API
      const response = await api.post(`/api/workflows/documents/${documentId}/distribute`, {
        reviewerEmails,
        workflowInstanceId,
        stageId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Distribution failed');
      }

      const result = await response.json();
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute document. Please try again.');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Groups />
          <Typography variant="h6">Distribute Document to Sub-Reviewers</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Document: <strong>{documentTitle}</strong>
            </Typography>
            <Typography variant="body2">
              Stage {stageId}: {stageId === '2' ? 'First Coordination' : 'Second Coordination'} - Distribution Phase
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle />
                Document successfully distributed to selected sub-reviewers!
              </Box>
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Select Sub-Reviewers:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which departments should review this document
          </Typography>

          <FormGroup>
            {subReviewers.map(reviewer => (
              <Box key={reviewer.id} sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedReviewers.includes(reviewer.id)}
                      onChange={() => handleToggleReviewer(reviewer.id)}
                      disabled={distributing || success}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>
                        {reviewer.firstName} {reviewer.lastName}
                      </Typography>
                      <Chip
                        label={reviewer.organization}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  {reviewer.email}
                </Typography>
              </Box>
            ))}
          </FormGroup>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Selected: {selectedReviewers.length} reviewer(s)
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={distributing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={distributing ? <CircularProgress size={20} /> : <Send />}
          onClick={handleDistribute}
          disabled={distributing || success || selectedReviewers.length === 0}
        >
          {distributing ? 'Distributing...' : 'Distribute Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DistributionModal;