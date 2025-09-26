'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { WorkflowStep } from '../../types/workflow-builder';

interface WorkflowNodeProps {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isDraggingConnection: boolean;
  connectionStart: string | null;
  dragConnectionFrom: string | null;
  onMouseDown: (e: React.MouseEvent, stepId: string) => void;
  onClick: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onConnectionDragStart: (e: React.MouseEvent, stepId: string) => void;
  onConnectionDragEnd: (targetStepId: string) => void;
  onDelete: (stepId: string) => void;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  step,
  index,
  isSelected,
  isDragging,
  isDraggingConnection,
  connectionStart,
  dragConnectionFrom,
  onMouseDown,
  onClick,
  onMouseUp,
  onConnectionDragStart,
  onConnectionDragEnd,
  onDelete
}) => {
  return (
    <Card
      onMouseDown={(e) => onMouseDown(e, step.id)}
      onClick={onClick}
      onMouseUp={() => {
        if (isDraggingConnection) {
          onConnectionDragEnd(step.id);
        }
        onMouseUp();
      }}
      sx={{
        position: 'absolute',
        left: step.position.x,
        top: step.position.y,
        width: 220,
        cursor: isDragging && isSelected ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'all 0.2s',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isSelected ? 6 : 2,
        zIndex: isSelected ? 1000 :
               connectionStart === step.id ? 999 : 10,
        border: '3px solid',
        borderColor: isSelected ? 'secondary.main' :
                   connectionStart === step.id ? 'warning.main' :
                   step.type === 'start' ? 'success.main' :
                   step.type === 'end' ? 'error.main' :
                   step.type === 'approval' ? 'warning.main' : 'primary.main',
        '&:hover': !isDragging ? {
          transform: 'scale(1.02)',
          boxShadow: 4
        } : {}
      }}
    >
      {/* Connection Handle - Input */}
      {step.type !== 'start' && (
        <Box
          title="Drop connection here"
          onMouseUp={() => {
            if (isDraggingConnection) {
              onConnectionDragEnd(step.id);
            }
          }}
          sx={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: isDraggingConnection ? '#ff9800' : '#2196f3',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: 100,
            '&:hover': {
              transform: 'translateX(-50%) scale(1.3)',
              bgcolor: isDraggingConnection ? '#f57c00' : '#1976d2'
            }
          }}
        />
      )}

      {/* Connection Handle - Output (Draggable) */}
      {step.type !== 'end' && (
        <Box
          onMouseDown={(e) => onConnectionDragStart(e, step.id)}
          title="Drag to connect to another node"
          sx={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: dragConnectionFrom === step.id ? '#ff9800' : '#4caf50',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'grab',
            zIndex: 100,
            '&:hover': {
              transform: 'translateX(-50%) scale(1.3)',
              bgcolor: dragConnectionFrom === step.id ? '#f57c00' : '#388e3c'
            },
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        />
      )}

      {/* Delete Button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onDelete(step.id);
        }}
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 20,
          height: 20,
          bgcolor: 'error.main',
          color: 'white',
          '&:hover': { bgcolor: 'error.dark' }
        }}
        size="small"
      >
        <CloseIcon sx={{ fontSize: 12 }} />
      </IconButton>

      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              fontSize: '1.5rem',
              mr: 1,
              p: 0.5,
              borderRadius: 1,
              bgcolor: step.type === 'start' ? 'success.light' :
                     step.type === 'end' ? 'error.light' :
                     step.type === 'approval' ? 'warning.light' : 'primary.light'
            }}
          >
            {step.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Step {index + 1}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {step.type.toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
          {step.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {step.roles.slice(0, 2).map(role => (
            <Chip
              key={role}
              label={role}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 18 }}
            />
          ))}
          {step.roles.length > 2 && (
            <Chip
              label={`+${step.roles.length - 2}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 18 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkflowNode;