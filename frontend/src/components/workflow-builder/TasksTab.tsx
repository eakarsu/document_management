import React from 'react';
import {
  Box,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
  Collapse
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  DragIndicator
} from '@mui/icons-material';
import {
  TaskCategories,
  getTaskConfiguration
} from '@/types/document-workflow-tasks';
import { TaskDragData } from '@/types/workflow-builder';

interface TasksTabProps {
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
  onDragStart: (event: React.DragEvent, task: TaskDragData) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  expandedCategories,
  onToggleCategory,
  onDragStart
}) => {
  return (
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
  );
};