import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import { Group, Send, Cancel } from '@mui/icons-material';

interface DistributionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedReviewers: string[];
  onReviewersChange: (reviewers: string[]) => void;
  title?: string;
}

// Pre-defined reviewer emails for demo
const AVAILABLE_REVIEWERS = [
  'john.doe.ops@airforce.mil',
  'jane.smith.log@airforce.mil',
  'mike.johnson.fin@airforce.mil',
  'sarah.williams.per@airforce.mil',
  'david.brown.ops@airforce.mil',
  'lisa.davis.log@airforce.mil',
  'robert.miller.fin@airforce.mil',
  'emily.wilson.per@airforce.mil'
];

export const DistributionDialog: React.FC<DistributionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedReviewers,
  onReviewersChange,
  title = 'Distribute Document to Reviewers'
}) => {
  const handleReviewerChange = (event: SelectChangeEvent<typeof selectedReviewers>) => {
    const value = event.target.value;
    onReviewersChange(typeof value === 'string' ? value.split(',') : value);
  };

  const getOrganizationFromEmail = (email: string): string => {
    if (email.includes('ops')) return 'Operations';
    if (email.includes('log')) return 'Logistics';
    if (email.includes('fin')) return 'Finance';
    if (email.includes('per')) return 'Personnel';
    return 'Unknown';
  };

  const getChipColor = (email: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (email.includes('ops')) return 'primary';
    if (email.includes('log')) return 'secondary';
    if (email.includes('fin')) return 'success';
    if (email.includes('per')) return 'warning';
    return 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Group />
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select reviewers from different organizations to provide feedback on this document.
          Each reviewer will receive access to view and comment on the document.
        </Typography>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Reviewers</InputLabel>
          <Select
            multiple
            value={selectedReviewers}
            onChange={handleReviewerChange}
            input={<OutlinedInput label="Select Reviewers" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value.split('@')[0].replace(/\./g, ' ').toUpperCase()}
                    size="small"
                    color={getChipColor(value)}
                  />
                ))}
              </Box>
            )}
          >
            {AVAILABLE_REVIEWERS.map((email) => (
              <MenuItem key={email} value={email}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {email.split('@')[0].replace(/\./g, ' ').toUpperCase()}
                    </Typography>
                    <Chip
                      label={getOrganizationFromEmail(email)}
                      size="small"
                      color={getChipColor(email)}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {email}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedReviewers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Reviewers ({selectedReviewers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedReviewers.map((email) => (
                <Box key={email} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${email.split('@')[0].replace(/\./g, ' ').toUpperCase()} - ${getOrganizationFromEmail(email)}`}
                    size="small"
                    onDelete={() => {
                      onReviewersChange(selectedReviewers.filter((r) => r !== email));
                    }}
                    color={getChipColor(email)}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {email}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          startIcon={<Cancel />}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={selectedReviewers.length === 0}
          variant="contained"
          startIcon={<Send />}
        >
          Distribute to {selectedReviewers.length} Reviewer{selectedReviewers.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};