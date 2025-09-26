import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { WorkflowAlert } from '@/types/workflow-monitor';

interface AlertDetailDialogProps {
  open: boolean;
  alert: WorkflowAlert | null;
  onClose: () => void;
  onDismissAlert: (alertId: string) => void;
}

const AlertDetailDialog: React.FC<AlertDetailDialogProps> = ({
  open,
  alert,
  onClose,
  onDismissAlert
}) => {
  const handleDismiss = () => {
    if (alert) {
      onDismissAlert(alert.id);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Alert Details</DialogTitle>
      <DialogContent>
        {alert && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {alert.message}
            </Typography>
            <Typography variant="body1" paragraph>
              {alert.description}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>Suggested Actions:</Typography>
            <List>
              {alert.suggestedActions.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Estimated Impact:</strong> {alert.estimatedImpact}
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleDismiss}>
          Dismiss Alert
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDetailDialog;