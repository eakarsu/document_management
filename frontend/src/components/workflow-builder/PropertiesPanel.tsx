import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormControlLabel,
  Switch,
  Autocomplete,
  Button
} from '@mui/material';
import {
  Close,
  Delete
} from '@mui/icons-material';
import { Node, Edge } from 'reactflow';
import {
  DocumentTaskType,
  getTaskConfiguration
} from '@/types/document-workflow-tasks';

interface PropertiesPanelProps {
  open: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onUpdateEdge: (edgeId: string, updates: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  open,
  onClose,
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge
}) => {
  const handleNodeUpdate = (field: string, value: any) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { [field]: value });
    }
  };

  const handleEdgeUpdate = (field: string, value: any) => {
    if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, { [field]: value });
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: 300,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 300,
          boxSizing: 'border-box',
          top: 64,
          background: '#f8f9fa'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {selectedNode ? 'Task Properties' : selectedEdge ? 'Connection Properties' : 'Properties'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {selectedNode && (
          <Box>
            <TextField
              fullWidth
              label="Task Name"
              value={selectedNode.data.label}
              onChange={(e) => handleNodeUpdate('label', e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={selectedNode.data.taskType || ''}
                onChange={(e) => {
                  const taskType = e.target.value as DocumentTaskType;
                  const config = getTaskConfiguration(taskType);
                  onUpdateNode(selectedNode.id, {
                    taskType,
                    label: config.name,
                    description: config.description
                  });
                }}
              >
                {Object.values(DocumentTaskType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ').toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              value={selectedNode.data.description || ''}
              onChange={(e) => handleNodeUpdate('description', e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Advanced Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={selectedNode.data.requiresApproval || false}
                  onChange={(e) => handleNodeUpdate('requiresApproval', e.target.checked)}
                />
              }
              label="Requires Approval"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              label="Time Limit (hours)"
              type="number"
              value={selectedNode.data.timeLimit || ''}
              onChange={(e) => handleNodeUpdate('timeLimit', parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={['Admin', 'Manager', 'User', 'Reviewer', 'Legal', 'Executive']}
              value={selectedNode.data.roles || []}
              onChange={(e, value) => handleNodeUpdate('roles', value)}
              renderInput={(params) => (
                <TextField {...params} label="Allowed Roles" />
              )}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => {
                onDeleteNode(selectedNode.id);
                onClose();
              }}
            >
              Delete Task
            </Button>
          </Box>
        )}

        {selectedEdge && (
          <Box>
            <TextField
              fullWidth
              label="Connection Label"
              value={selectedEdge.data?.label || ''}
              onChange={(e) => handleEdgeUpdate('label', e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Condition (Optional)"
              value={selectedEdge.data?.condition || ''}
              onChange={(e) => handleEdgeUpdate('condition', e.target.value)}
              placeholder="e.g., approved === true"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={selectedEdge.data?.requireComment || false}
                  onChange={(e) => handleEdgeUpdate('requireComment', e.target.checked)}
                />
              }
              label="Require Comment"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Connection Style</InputLabel>
              <Select
                value={selectedEdge.type || 'smart'}
                onChange={(e) => onUpdateEdge(selectedEdge.id, { type: e.target.value })}
              >
                <MenuItem value="smart">Smart</MenuItem>
                <MenuItem value="smoothstep">Smooth</MenuItem>
                <MenuItem value="straight">Straight</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => {
                onDeleteEdge(selectedEdge.id);
                onClose();
              }}
            >
              Delete Connection
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};