import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Typography
} from '@mui/material';
import { MonitoringSettings } from './types';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: MonitoringSettings;
  onUpdateSettings: (settings: MonitoringSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const handleSettingsChange = (updates: Partial<MonitoringSettings>) => {
    onUpdateSettings({ ...settings, ...updates });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Monitoring Settings</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Switch
              checked={settings.realTimeUpdates}
              onChange={(e) => handleSettingsChange({ realTimeUpdates: e.target.checked })}
            />
          }
          label="Real-time Updates"
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle2" gutterBottom>Auto-refresh Interval (seconds)</Typography>
        <Typography variant="body2" gutterBottom>{settings.autoRefreshInterval}</Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Alert Thresholds</Typography>
        <Typography variant="body2">Delay Risk: {settings.alertThresholds.delayRisk}%</Typography>
        <Typography variant="body2">Quality Score: {settings.alertThresholds.qualityScore}%</Typography>
        <Typography variant="body2">Participant Inactivity: {settings.alertThresholds.participantInactivity} hours</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onClose}>
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};