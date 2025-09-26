import React from 'react';
import {
  Box,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Chip,
  Grid,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Compare as CompareIcon,
  CheckCircleOutline as AcceptAllIcon,
  HighlightOff as RejectAllIcon,
  TrackChanges as TrackChangesIcon,
  BatchPrediction as BatchIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  Save as SaveIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { CRMComment, HistoryEntry, ChangeMarker } from './types';

interface FeedbackControlPanelProps {
  mergeMode: 'manual' | 'ai' | 'hybrid';
  historyIndex: number;
  changeHistory: HistoryEntry[];
  changeMarkers: ChangeMarker[];
  currentChangeIndex: number;
  feedback: CRMComment[];
  selectAll: boolean;
  savingDocument: boolean;
  showComparisonView: boolean;
  onMergeModeChange: (event: React.MouseEvent<HTMLElement>, newMode: 'manual' | 'ai' | 'hybrid' | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCompareToggle: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyAll: () => void;
  onApplySelected: () => void;
  onSelectAll: () => void;
  onSaveDocument: () => void;
  onShowHistory: () => void;
}

const FeedbackControlPanel: React.FC<FeedbackControlPanelProps> = ({
  mergeMode,
  historyIndex,
  changeHistory,
  changeMarkers,
  currentChangeIndex,
  feedback,
  selectAll,
  savingDocument,
  showComparisonView,
  onMergeModeChange,
  onUndo,
  onRedo,
  onCompareToggle,
  onNavigatePrevious,
  onNavigateNext,
  onAcceptAll,
  onRejectAll,
  onApplyAll,
  onApplySelected,
  onSelectAll,
  onSaveDocument,
  onShowHistory,
}) => {
  const pendingCount = feedback.filter(f => !f.status || f.status === 'pending').length;
  const nonCriticalPendingCount = feedback.filter(
    f => (!f.status || f.status === 'pending') && f.commentType !== 'C' && f.changeTo
  ).length;
  const selectedCount = feedback.filter((i: any) => i.selected).length;

  return (
    <Box sx={{ p: 1 }}>
      {/* Merge Strategy Selection */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'medium' }}>Strategy:</Typography>
        <ToggleButtonGroup
          value={mergeMode}
          exclusive
          onChange={onMergeModeChange}
          size="small"
          sx={{ mb: 0.5 }}
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
      <Box sx={{ mb: 1, p: 0.5, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Track Changes:</Typography>
        <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
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
            disabled={historyIndex >= changeHistory.length - 1}
            title="Redo last undone change"
          >
            Redo
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={onCompareToggle}
            color={showComparisonView ? 'primary' : 'inherit'}
            title="Toggle side-by-side comparison"
          >
            Compare
          </Button>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrevIcon />}
            onClick={onNavigatePrevious}
            disabled={changeMarkers.length === 0}
            title="Go to previous change"
          >
            Prev
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<NextIcon />}
            onClick={onNavigateNext}
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
      <Box sx={{ mb: 1, p: 0.5, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Batch Operations:</Typography>
        <Stack direction="row" spacing={0.5}>
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
      <Grid container spacing={0.5}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<TrackChangesIcon />}
            onClick={onApplyAll}
            disabled={nonCriticalPendingCount === 0}
            title="Apply all non-critical feedback items"
          >
            Apply All ({nonCriticalPendingCount})
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
            Selected ({selectedCount})
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={selectAll ? <DeselectAllIcon /> : <SelectAllIcon />}
            onClick={onSelectAll}
          >
            {selectAll ? 'Deselect' : 'Select'} All
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={onSaveDocument}
            disabled={savingDocument}
          >
            Save Changes
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={onShowHistory}
          >
            History
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FeedbackControlPanel;