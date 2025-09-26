'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Help as HelpIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
import { TaskTemplate } from '../../types/workflow-builder';

interface TaskTemplatesSidebarProps {
  taskTemplates: TaskTemplate[];
  categories: string[];
  onAddStep: (template: TaskTemplate) => void;
  onDragStart: (e: React.DragEvent, template: TaskTemplate) => void;
  onShowHelp: () => void;
  onShowShortcuts: () => void;
}

const TaskTemplatesSidebar: React.FC<TaskTemplatesSidebarProps> = ({
  taskTemplates,
  categories,
  onAddStep,
  onDragStart,
  onShowHelp,
  onShowShortcuts
}) => {
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Filter tasks based on search query
  const filteredTaskTemplates = taskTemplates.filter(task =>
    task.name.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
    task.category.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  const getTasksByCategory = (category: string) => {
    return taskTemplates.filter(task => task.category === category);
  };

  return (
    <Paper sx={{
      width: 280,
      flexShrink: 0,
      height: '100%',
      overflow: 'auto',
      borderRadius: '8px 0 0 8px'
    }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', flexGrow: 1 }}>
            Task Templates
          </Typography>
          <Tooltip title="Help">
            <IconButton size="small" onClick={onShowHelp}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Keyboard Shortcuts">
            <IconButton size="small" onClick={onShowShortcuts}>
              <KeyboardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search Field */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search tasks..."
          value={taskSearchQuery}
          onChange={(e) => setTaskSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: taskSearchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setTaskSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Task Count */}
        {taskSearchQuery && (
          <Box sx={{ mb: 1, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="caption" color="primary.main">
              Found {filteredTaskTemplates.length} matching tasks
            </Typography>
          </Box>
        )}

        {categories.map((category) => {
          const categoryTasks = taskSearchQuery
            ? filteredTaskTemplates.filter(task => task.category === category)
            : getTasksByCategory(category);

          if (taskSearchQuery && categoryTasks.length === 0) return null;

          return (
            <Accordion
              key={category}
              defaultExpanded={category === 'Flow Control'}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                mb: 1
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {category}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense sx={{ py: 0 }}>
                  {categoryTasks.map((template) => (
                    <Tooltip key={template.id} title={template.description} placement="right" arrow>
                      <ListItemButton
                        draggable
                        onDragStart={(e) => onDragStart(e, template)}
                        onClick={() => onAddStep(template)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          py: 0.5,
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' },
                          '&:hover': {
                            bgcolor: 'primary.light',
                            transform: 'scale(1.01)',
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Box
                            sx={{
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {template.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={template.name}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            lineHeight: 1.2
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
};

export default TaskTemplatesSidebar;