import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { CheckCircle, Lightbulb } from '@mui/icons-material';
import { WorkflowAlert } from './types';
import { getAlertIcon } from './ActivityIcons';
import { getSeverityColor, formatTimeAgo } from './utils';

interface AlertsPanelProps {
  alerts: WorkflowAlert[];
  onDismissAlert: (alertId: string) => void;
  selectedAlert: WorkflowAlert | null;
  onSelectAlert: (alert: WorkflowAlert | null) => void;
  alertDetailOpen: boolean;
  onToggleAlertDetail: (open: boolean) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onDismissAlert,
  selectedAlert,
  onSelectAlert,
  alertDetailOpen,
  onToggleAlertDetail
}) => {
  return (
    <>
      <Grid container spacing={2}>
        {alerts.map((alert) => (
          <Grid item xs={12} key={alert.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1 }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getAlertIcon(alert.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {alert.message}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getSeverityColor(alert.severity) as any}
                        />
                        <Chip
                          label={alert.type.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {alert.documentTitle} • {formatTimeAgo(alert.timestamp)}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {alert.description}
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        <strong>Estimated Impact:</strong> {alert.estimatedImpact}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        onSelectAlert(alert);
                        onToggleAlertDetail(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onDismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {alerts.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Active Alerts
              </Typography>
              <Typography color="text.secondary">
                All workflows are running smoothly
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Alert Detail Dialog */}
      <Dialog open={alertDetailOpen} onClose={() => onToggleAlertDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.message}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Suggested Actions:</Typography>
              <List>
                {selectedAlert.suggestedActions.map((action, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={action} />
                  </ListItem>
                ))}
              </List>

              <Card variant="outlined" sx={{ mt: 2, bgcolor: 'warning.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Estimated Impact:</strong> {selectedAlert.estimatedImpact}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onToggleAlertDetail(false)}>Close</Button>
          <Button variant="contained" onClick={() => selectedAlert && onDismissAlert(selectedAlert.id)}>
            Dismiss Alert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};