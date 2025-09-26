import React from 'react';
import {
  Stack,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  TrackChanges as TrackChangesIcon,
  BatchPrediction as BatchIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  CheckBox as SelectAllIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { FeedbackItem } from './types';

interface ActionButtonsProps {
  loading: boolean;
  saving: boolean;
  feedbackItems: FeedbackItem[];
  selectAll: boolean;
  previewContent: string;
  autoSave: boolean;
  showPositionDetails: boolean;
  versionsCount: number;
  onApplyAll: () => void;
  onApplySelected: () => void;
  onSelectAll: () => void;
  onShowVersionHistory: () => void;
  onSaveChanges: () => void;
  onTogglePreview: () => void;
  onAutoSaveChange: (enabled: boolean) => void;
  onPositionDetailsChange: (show: boolean) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  loading,
  saving,
  feedbackItems,
  selectAll,
  previewContent,
  autoSave,
  showPositionDetails,
  versionsCount,
  onApplyAll,
  onApplySelected,
  onSelectAll,
  onShowVersionHistory,
  onSaveChanges,
  onTogglePreview,
  onAutoSaveChange,
  onPositionDetailsChange
}) => {
  const selectedCount = feedbackItems.filter(i => i.selected).length;

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<TrackChangesIcon />}
        onClick={onApplyAll}
        disabled={loading || feedbackItems.length === 0}
      >
        Apply All
      </Button>

      <Button
        variant="outlined"
        startIcon={<BatchIcon />}
        onClick={onApplySelected}
        disabled={loading || selectedCount === 0}
      >
        Apply Selected ({selectedCount})
      </Button>

      <Button
        variant="outlined"
        startIcon={selectAll ? <DeselectAllIcon /> : <SelectAllIcon />}
        onClick={onSelectAll}
      >
        {selectAll ? 'Deselect All' : 'Select All'}
      </Button>

      <Button
        variant="outlined"
        startIcon={<HistoryIcon />}
        onClick={onShowVersionHistory}
      >
        Version History ({versionsCount})
      </Button>

      {previewContent && (
        <>
          <Button
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={onSaveChanges}
            disabled={loading || saving}
          >
            Save Changes
          </Button>

          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={onTogglePreview}
          >
            Preview
          </Button>
        </>
      )}

      {/* Toggle switches */}
      <FormControlLabel
        control={
          <Switch
            checked={autoSave}
            onChange={(e) => onAutoSaveChange(e.target.checked)}
            size="small"
          />
        }
        label="Auto-save"
      />

      <FormControlLabel
        control={
          <Switch
            checked={showPositionDetails}
            onChange={(e) => onPositionDetailsChange(e.target.checked)}
            size="small"
          />
        }
        label="Position Tracking"
      />
    </Stack>
  );
};