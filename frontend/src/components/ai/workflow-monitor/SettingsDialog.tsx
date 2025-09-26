import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import { MonitoringSettings } from '@/types/workflow-monitor';

interface SettingsDialogProps {
  open: boolean;
  settings: MonitoringSettings;
  onClose: () => void;
  onSettingsChange: (settings: MonitoringSettings) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  settings,
  onClose,
  onSettingsChange
}) => {
  const handleSave = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Monitoring Settings</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Switch
              checked={settings.realTimeUpdates}
              onChange={(e) => onSettingsChange({
                ...settings,
                realTimeUpdates: e.target.checked
              })}
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
        <Button variant="contained" onClick={handleSave}>
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;