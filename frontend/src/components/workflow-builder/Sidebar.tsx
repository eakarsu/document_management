import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider
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
import {
  TaskCategories,
  getTaskConfiguration,
  DocumentTaskType
} from '@/types/document-workflow-tasks';
import { WorkflowTemplate } from './types';

interface SidebarProps {
  open: boolean;
  workflowName: string;
  workflowDescription: string;
  onUpdateWorkflowName: (name: string) => void;
  onUpdateWorkflowDescription: (description: string) => void;
  tabValue: number;
  onTabChange: (value: number) => void;
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
  onDragStart: (event: React.DragEvent, task: any) => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  connectionMode: 'loose' | 'strict';
  onConnectionModeChange: (mode: 'loose' | 'strict') => void;
  edgeType: 'smart' | 'smoothstep' | 'straight';
  onEdgeTypeChange: (type: 'smart' | 'smoothstep' | 'straight') => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  workflowName,
  workflowDescription,
  onUpdateWorkflowName,
  onUpdateWorkflowDescription,
  tabValue,
  onTabChange,
  expandedCategories,
  onToggleCategory,
  onDragStart,
  onLoadTemplate,
  connectionMode,
  onConnectionModeChange,
  edgeType,
  onEdgeTypeChange,
  gridSize,
  onGridSizeChange,
  snapToGrid,
  onSnapToGridChange
}) => {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
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
          value={workflowName}
          onChange={(e) => onUpdateWorkflowName(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        <TextField
          fullWidth
          label="Description"
          value={workflowDescription}
          onChange={(e) => onUpdateWorkflowDescription(e.target.value)}
          multiline
          rows={2}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Tabs
          value={tabValue}
          onChange={(e, v) => onTabChange(v)}
          sx={{ mb: 2 }}
          variant="fullWidth"
        >
          <Tab label="Tasks" icon={<Category />} />
          <Tab label="Templates" icon={<AccountTree />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>

        {/* Tasks Tab */}
        {tabValue === 0 && (
          <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Drag tasks to canvas
            </Typography>

            {Object.entries(TaskCategories).map(([key, category]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => onToggleCategory(key)}
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
                  {expandedCategories.includes(key) ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={expandedCategories.includes(key)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {category.tasks.map(taskType => {
                      const config = getTaskConfiguration(taskType);
                      return (
                        <ListItem
                          key={taskType}
                          draggable
                          onDragStart={(e) => onDragStart(e, {
                            type: taskType,
                            name: config.name,
                            description: config.description,
                            category: key,
                            requiresApproval: config.settings.requiresApproval,
                            inputs: config.inputs,
                            outputs: config.outputs
                          })}
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
        {tabValue === 1 && (
          <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
              Pre-built workflow templates
            </Typography>

            {/* Template components would go here */}
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
              Templates will be loaded here
            </Typography>
          </Box>
        )}

        {/* Settings Tab */}
        {tabValue === 2 && (
          <Box>
            {/* Settings components would be rendered here */}
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
              Settings will be loaded here
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;