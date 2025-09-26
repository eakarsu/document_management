import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

interface PreviewDialogProps {
  open: boolean;
  content: string;
  onClose: () => void;
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  content,
  onClose
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Document Preview with Changes</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={20}
          value={content}
          InputProps={{ readOnly: true }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};