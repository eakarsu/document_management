import React from 'react';
import {
  Paper,
  IconButton,
  Divider,
  ButtonGroup,
  Button,
  Box,
  Chip
} from '@mui/material';
import {
  DragIndicator,
  Save,
  CloudDownload,
  CloudUpload,
  Undo,
  Redo,
  PlayArrow,
  Psychology,
  Help,
  FiberManualRecord
} from '@mui/icons-material';

interface WorkflowToolbarProps {
  nodeCount: number;
  edgeCount: number;
  onToggleDrawer: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onRun: () => void;
  onValidate: () => void;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  nodeCount,
  edgeCount,
  onToggleDrawer,
  onSave,
  onExport,
  onImport,
  onRun,
  onValidate
}) => {
  return (
    <Paper sx={{
      p: 1,
      display: 'flex',
      gap: 1,
      alignItems: 'center',
      borderBottom: '2px solid #e0e0e0'
    }}>
      <IconButton onClick={onToggleDrawer}>
        <DragIndicator />
      </IconButton>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup variant="contained" size="small">
        <Button startIcon={<Save />} onClick={onSave}>
          Save
        </Button>
        <Button startIcon={<CloudDownload />} onClick={onExport}>
          Export
        </Button>
        <Button startIcon={<CloudUpload />} onClick={onImport}>
          Import
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup variant="outlined" size="small">
        <Button startIcon={<PlayArrow />} color="success" onClick={onRun}>
          Run
        </Button>
        <Button startIcon={<Psychology />} color="info" onClick={onValidate}>
          Validate
        </Button>
      </ButtonGroup>

      <Box sx={{ flexGrow: 1 }} />

      <Chip
        icon={<FiberManualRecord sx={{ fontSize: 12 }} />}
        label={`${nodeCount} nodes, ${edgeCount} connections`}
        color="primary"
        variant="outlined"
      />

      <IconButton>
        <Help />
      </IconButton>
    </Paper>
  );
};

export default WorkflowToolbar;