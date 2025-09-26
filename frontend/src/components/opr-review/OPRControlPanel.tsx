import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Chip
} from '@mui/material';
import {
  Build,
  AutoAwesome as AIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Compare as CompareIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  CheckCircleOutline as AcceptAllIcon,
  HighlightOff as RejectAllIcon,
  TrackChanges as TrackChangesIcon,
  BatchPrediction as BatchIcon
} from '@mui/icons-material';
import { MergeMode, CRMComment, ChangeMarker } from '../../types/opr-review';

interface OPRControlPanelProps {
  mergeMode: MergeMode;
  onMergeModeChange: (mode: MergeMode) => void;
  feedback: CRMComment[];
  changeMarkers: ChangeMarker[];
  currentChangeIndex: number;
  historyIndex: number;
  changeHistoryLength: number;
  showComparisonView: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleComparison: () => void;
  onNavigateToPrevious: () => void;
  onNavigateToNext: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyAll: () => void;
  onApplySelected: () => void;
}

const OPRControlPanel: React.FC<OPRControlPanelProps> = ({
  mergeMode,
  onMergeModeChange,
  feedback,
  changeMarkers,
  currentChangeIndex,
  historyIndex,
  changeHistoryLength,
  showComparisonView,
  onUndo,
  onRedo,
  onToggleComparison,
  onNavigateToPrevious,
  onNavigateToNext,
  onAcceptAll,
  onRejectAll,
  onApplyAll,
  onApplySelected
}) => {
  const handleMergeModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: MergeMode
  ) => {
    if (newMode !== null) {
      onMergeModeChange(newMode);
    }
  };

  const pendingCount = feedback.filter(f => f.status === 'pending').length;
  const selectedCount = feedback.filter(f => f.selected).length;
  const nonCriticalCount = feedback.filter(f => (!f.status || f.status === 'pending') && f.commentType !== 'C').length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Build />
        Feedback Management
      </Typography>

      {/* Merge Strategy Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>Strategy:</Typography>
        <ToggleButtonGroup
          value={mergeMode}
          exclusive
          onChange={handleMergeModeChange}
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="manual">
            <ManualIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Manual
          </ToggleButton>
          <ToggleButton value="ai">
            <AIIcon sx={{ mr: 0.5, fontSize: 16 }} />
            AI
          </ToggleButton>
          <ToggleButton value="hybrid">
            <HybridIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Hybrid
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Track Changes Controls */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Track Changes:</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UndoIcon />}
            onClick={onUndo}
            disabled={historyIndex <= 0}
            title="Undo last change"
          >
            Undo
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RedoIcon />}
            onClick={onRedo}
            disabled={historyIndex >= changeHistoryLength - 1}
            title="Redo last undone change"
          >
            Redo
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={onToggleComparison}
            color={showComparisonView ? 'primary' : 'inherit'}
            title="Toggle side-by-side comparison"
          >
            Compare
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrevIcon />}
            onClick={onNavigateToPrevious}
            disabled={changeMarkers.length === 0}
            title="Go to previous change"
          >
            Prev
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<NextIcon />}
            onClick={onNavigateToNext}
            disabled={changeMarkers.length === 0}
            title="Go to next change"
          >
            Next
          </Button>
          <Chip
            size="small"
            label={`${currentChangeIndex + 1}/${changeMarkers.length}`}
            sx={{ ml: 1 }}
          />
        </Stack>
      </Box>

      {/* Batch Operations */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Batch Operations:</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<AcceptAllIcon />}
            onClick={onAcceptAll}
            disabled={pendingCount === 0}
          >
            Accept All
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<RejectAllIcon />}
            onClick={onRejectAll}
            disabled={pendingCount === 0}
          >
            Reject All
          </Button>
        </Stack>
      </Box>

      {/* Action Buttons Grid */}
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<TrackChangesIcon />}
            onClick={onApplyAll}
            disabled={nonCriticalCount === 0}
            title="Apply all non-critical feedback items"
          >
            Apply All ({nonCriticalCount})
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<BatchIcon />}
            onClick={onApplySelected}
            disabled={selectedCount === 0}
          >
            Apply Selected ({selectedCount})
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default OPRControlPanel;