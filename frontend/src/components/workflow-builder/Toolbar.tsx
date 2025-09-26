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
import { Node, Edge } from 'reactflow';
import { WorkflowExport } from '@/types/workflow-builder';

interface ToolbarProps {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  nodes: Node[];
  edges: Edge[];
  workflowName: string;
  workflowDescription: string;
  onSave: (workflow: WorkflowExport) => Promise<void>;
  onExport: (workflow: WorkflowExport) => void;
  onImport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRun: () => void;
  onValidate: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  drawerOpen,
  onToggleDrawer,
  nodes,
  edges,
  workflowName,
  workflowDescription,
  onSave,
  onExport,
  onImport,
  onUndo,
  onRedo,
  onRun,
  onValidate
}) => {
  const generateWorkflow = (): WorkflowExport => ({
    id: `workflow-${Date.now()}`,
    name: workflowName,
    description: workflowDescription,
    version: '1.0.0',
    type: 'document-review',
    stages: nodes.map((node, index) => ({
      id: node.id,
      name: node.data.label,
      type: node.data.taskType || 'MANUAL_REVIEW',
      order: index + 1,
      required: true,
      roles: node.data.roles || ['Admin'],
      actions: edges
        .filter(e => e.source === node.id)
        .map(e => ({
          id: e.id,
          label: e.data?.label || 'Proceed',
          target: e.target,
          condition: e.data?.condition
        }))
    })),
    transitions: edges.map(edge => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: edge.data?.label || 'proceed',
      condition: edge.data?.condition
    }))
  });

  const handleSave = async () => {
    const workflow = generateWorkflow();
    await onSave(workflow);
  };

  const handleExport = () => {
    const workflow = generateWorkflow();
    onExport(workflow);
  };

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
        <Button startIcon={<Save />} onClick={handleSave}>
          Save
        </Button>
        <Button startIcon={<CloudDownload />} onClick={handleExport}>
          Export
        </Button>
        <Button startIcon={<CloudUpload />} onClick={onImport}>
          Import
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup variant="outlined" size="small">
        <Button startIcon={<Undo />} onClick={onUndo}>Undo</Button>
        <Button startIcon={<Redo />} onClick={onRedo}>Redo</Button>
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
        label={`${nodes.length} nodes, ${edges.length} connections`}
        color="primary"
        variant="outlined"
      />

      <IconButton>
        <Help />
      </IconButton>
    </Paper>
  );
};