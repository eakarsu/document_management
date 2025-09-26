import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import {
  Description,
  Category,
  AccountTree,
  Settings,
  ExpandMore,
  ExpandLess,
  DragIndicator
} from '@mui/icons-material';
import { TaskCategories, getTaskConfiguration } from '@/types/document-workflow-tasks';
import { UIState, WorkflowSettings, WorkflowBuilderState } from './types';

interface WorkflowSidebarProps {
  state: WorkflowBuilderState;
  uiState: UIState;
  settings: WorkflowSettings;
  onWorkflowNameChange: (name: string) => void;
  onWorkflowDescriptionChange: (description: string) => void;
  onTabChange: (value: number) => void;
  onCategoryToggle: (category: string) => void;
  onDragStart: (event: React.DragEvent, task: any) => void;
  onConnectionModeChange: (mode: 'loose' | 'strict') => void;
  onEdgeTypeChange: (type: 'smart' | 'smoothstep' | 'straight') => void;
  onSnapToGridChange: (snap: boolean) => void;
  onGridSizeChange: (size: number) => void;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  state,
  uiState,
  settings,
  onWorkflowNameChange,
  onWorkflowDescriptionChange,
  onTabChange,
  onCategoryToggle,
  onDragStart,
  onConnectionModeChange,
  onEdgeTypeChange,
  onSnapToGridChange,
  onGridSizeChange
}) => {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={uiState.drawerOpen}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          top: 64,
          background: '#f8f9fa'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Workflow Designer
        </Typography>

        <TextField
          fullWidth
          label="Workflow Name"
          value={state.workflowName}
          onChange={(e) => onWorkflowNameChange(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        <TextField
          fullWidth
          label="Description"
          value={state.workflowDescription}
          onChange={(e) => onWorkflowDescriptionChange(e.target.value)}
          multiline
          rows={2}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Tabs
          value={uiState.tabValue}
          onChange={(e, v) => onTabChange(v)}
          sx={{ mb: 2 }}
          variant="fullWidth"
        >
          <Tab label="Tasks" icon={<Category />} />
          <Tab label="Templates" icon={<AccountTree />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>

        {/* Tasks Tab */}
        {uiState.tabValue === 0 && (
          <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Drag tasks to canvas
            </Typography>

            {Object.entries(TaskCategories).map(([key, category]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => onCategoryToggle(key)}
                  sx={{
                    borderRadius: 1,
                    bgcolor: category.color + '20',
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: category.color + '30'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Typography>{category.icon}</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={category.name}
                    secondary={`${category.tasks.length} tasks`}
                  />
                  {uiState.expandedCategories.includes(key) ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={uiState.expandedCategories.includes(key)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {category.tasks.map(taskType => {
                      const config = getTaskConfiguration(taskType);
                      return (
                        <ListItem
                          key={taskType}
                          draggable
                          onDragStart={(e) => {
                            onDragStart(e, {
                              type: taskType,
                              name: config.name,
                              description: config.description,
                              category: key,
                              requiresApproval: config.settings.requiresApproval,
                              inputs: config.inputs,
                              outputs: config.outputs
                            });
                          }}
                          sx={{
                            pl: 4,
                            cursor: 'grab',
                            borderRadius: 1,
                            mb: 0.5,
                            bgcolor: '#fff',
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              bgcolor: category.color + '10',
                              borderColor: category.color
                            },
                            '&:active': {
                              cursor: 'grabbing'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <DragIndicator sx={{ fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={config.name}
                            secondary={config.description}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}

        {/* Templates Tab */}
        {uiState.tabValue === 1 && (
          <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
              Pre-built workflow templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Templates will be loaded from WorkflowTemplates component
            </Typography>
          </Box>
        )}

        {/* Settings Tab */}
        {uiState.tabValue === 2 && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Connection Mode</InputLabel>
              <Select
                value={settings.connectionMode}
                onChange={(e) => onConnectionModeChange(e.target.value as any)}
              >
                <MenuItem value="loose">Loose (Easy)</MenuItem>
                <MenuItem value="strict">Strict (Precise)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Edge Type</InputLabel>
              <Select
                value={settings.edgeType}
                onChange={(e) => onEdgeTypeChange(e.target.value as any)}
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
                  onChange={(e) => onSnapToGridChange(e.target.checked)}
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
                onChange={(e, v) => onGridSizeChange(v as number)}
                min={5}
                max={50}
                step={5}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default WorkflowSidebar;