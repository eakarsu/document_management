import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Paper
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { WorkflowAlert } from '@/types/workflow-monitor';
import { useWorkflowHelpers } from '../../../hooks/workflow-monitor/useWorkflowHelpers';

interface AlertsTabProps {
  activeAlerts: WorkflowAlert[];
  loading: boolean;
  onAlertDetail: (alert: WorkflowAlert) => void;
  onDismissAlert: (alertId: string) => void;
}

const AlertsTab: React.FC<AlertsTabProps> = ({
  activeAlerts,
  loading,
  onAlertDetail,
  onDismissAlert
}) => {
  const { getAlertIcon, getSeverityColor } = useWorkflowHelpers();

  if (loading) {
    return null;
  }

  if (activeAlerts.length === 0) {
    return (
      <Grid container spacing={2}>
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
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {activeAlerts.map((alert) => (
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
                      {alert.documentTitle} • {Math.round((Date.now() - alert.timestamp.getTime()) / (1000 * 60))} minutes ago
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
                    onClick={() => onAlertDetail(alert)}
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
    </Grid>
  );
};

export default AlertsTab;