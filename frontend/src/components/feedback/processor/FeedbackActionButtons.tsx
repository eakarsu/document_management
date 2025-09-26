import React from 'react';
import {
  Button,
  Stack,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  TrackChanges as TrackChangesIcon,
  BatchPrediction as BatchIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { FeedbackItem } from '@/types/feedback-processor';

interface FeedbackActionButtonsProps {
  loading: boolean;
  saving: boolean;
  feedbackItems: FeedbackItem[];
  selectAll: boolean;
  autoSave: boolean;
  showPositionDetails: boolean;
  previewContent: string;
  versionsCount: number;
  onApplyAll: () => void;
  onApplySelected: () => void;
  onSelectAll: () => void;
  onShowVersionHistory: () => void;
  onSaveChanges: () => void;
  onTogglePreview: () => void;
  onAutoSaveChange: (enabled: boolean) => void;
  onPositionDetailsChange: (enabled: boolean) => void;
}

const FeedbackActionButtons: React.FC<FeedbackActionButtonsProps> = ({
  loading,
  saving,
  feedbackItems,
  selectAll,
  autoSave,
  showPositionDetails,
  previewContent,
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
  const pendingCount = feedbackItems.filter(i => i.status === 'pending').length;

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<TrackChangesIcon />}
        onClick={onApplyAll}
        disabled={loading || pendingCount === 0}
      >
        Apply All ({pendingCount})
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
        disabled={pendingCount === 0}
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

export default FeedbackActionButtons;