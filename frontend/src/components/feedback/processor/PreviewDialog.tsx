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
  onClose: () => void;
  previewContent: string;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  onClose,
  previewContent
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
          value={previewContent}
          InputProps={{ readOnly: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;