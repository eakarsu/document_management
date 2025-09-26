import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Slider
} from '@mui/material';
import { WorkflowSettings } from '@/types/workflow-builder';

interface SettingsTabProps {
  settings: WorkflowSettings;
  onUpdateSettings: (settings: Partial<WorkflowSettings>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings
}) => {
  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Connection Mode</InputLabel>
        <Select
          value={settings.connectionMode}
          onChange={(e) => onUpdateSettings({ connectionMode: e.target.value as any })}
        >
          <MenuItem value="loose">Loose (Easy)</MenuItem>
          <MenuItem value="strict">Strict (Precise)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Edge Type</InputLabel>
        <Select
          value={settings.edgeType}
          onChange={(e) => onUpdateSettings({ edgeType: e.target.value as any })}
        >
          <MenuItem value="smart">Smart (Animated)</MenuItem>
          <MenuItem value="smoothstep">Smooth Step</MenuItem>
          <MenuItem value="straight">Straight</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={settings.snapToGrid}
            onChange={(e) => onUpdateSettings({ snapToGrid: e.target.checked })}
          />
        }
        label="Snap to Grid"
        sx={{ mb: 1 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Grid Size: {settings.gridSize}
        </Typography>
        <Slider
          value={settings.gridSize}
          onChange={(e, v) => onUpdateSettings({ gridSize: v as number })}
          min={5}
          max={50}
          step={5}
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
};