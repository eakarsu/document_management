'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { WorkflowTemplate, WorkflowStep, CanvasState, DragState, TaskTemplate } from '../../types/workflow-builder';
import WorkflowNode from './WorkflowNode';

interface WorkflowCanvasProps {
  selectedWorkflow: WorkflowTemplate | null;
  canvasState: CanvasState;
  dragState: DragState;
  onWorkflowChange: (workflow: WorkflowTemplate) => void;
  onNodeMouseDown: (e: React.MouseEvent, stepId: string) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onConnectionDragStart: (e: React.MouseEvent, fromStepId: string) => void;
  onConnectionDragMove: (e: React.MouseEvent) => void;
  onConnectionDragEnd: (targetStepId?: string) => void;
  onStepClick: (step: WorkflowStep) => void;
  onDeleteStep: (stepId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  selectedWorkflow,
  canvasState,
  dragState,
  onWorkflowChange,
  onNodeMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onConnectionDragStart,
  onConnectionDragMove,
  onConnectionDragEnd,
  onStepClick,
  onDeleteStep,
  onDragOver,
  onDragLeave,
  onDrop,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  const {
    isDraggingNode,
    isDragOver,
    isDraggingConnection,
    selectedNodeId,
    connectionStart,
    dragConnectionFrom,
    dragConnectionTo
  } = dragState;

  const { zoom: canvasZoom, pan: canvasPan } = canvasState;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0 8px 8px 0'
      }}>
        {/* Canvas Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              value={selectedWorkflow?.name || ''}
              onChange={(e) => {
                if (selectedWorkflow) {
                  onWorkflowChange({
                    ...selectedWorkflow,
                    name: e.target.value
                  });
                }
              }}
              variant="outlined"
              placeholder="Workflow Name"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '1rem', fontWeight: 600 } }}
            />

            {/* Canvas Controls */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton onClick={onZoomOut} size="small" title="Zoom Out">
                <Typography variant="body2">🔍-</Typography>
              </IconButton>
              <IconButton onClick={onResetZoom} size="small" title="Reset Zoom">
                <Typography variant="body2">{Math.round(canvasZoom * 100)}%</Typography>
              </IconButton>
              <IconButton onClick={onZoomIn} size="small" title="Zoom In">
                <Typography variant="body2">🔍+</Typography>
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<PlayIcon />} size="small">
              Test
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} size="small">
              Save
            </Button>
          </Box>
        </Box>

        {/* Canvas Area - Visual Workflow Builder */}
        <Box
          className="workflow-canvas"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onMouseMove={(e) => {
            onCanvasMouseMove(e);
            onConnectionDragMove(e);
          }}
          onMouseUp={() => {
            onCanvasMouseUp();
            onConnectionDragEnd();
          }}
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: isDragOver ? 'primary.50' : '#f8f9fa',
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            cursor: isDraggingNode ? 'grabbing' : 'default'
          }}
        >
          {!selectedWorkflow || selectedWorkflow?.steps?.length === 0 ? (
            <Box sx={{
              textAlign: 'center',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}>
              <Box
                sx={{
                  fontSize: '4rem',
                  color: 'text.disabled',
                  mb: 2,
                  animation: isDragOver ? 'bounce 1s infinite' : 'none',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' }
                  }
                }}
              >
                🎯
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {isDragOver ? 'Drop here to add step!' : 'Drag task templates here to build your workflow'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start with a "Start Workflow" task template
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transform: `scale(${canvasZoom}) translate(${canvasPan.x}px, ${canvasPan.y}px)`,
                transformOrigin: 'top left',
                minWidth: '2000px',
                minHeight: '2000px'
              }}
            >
              {/* Workflow Steps as Visual Nodes */}
              {selectedWorkflow?.steps?.map((step, index) => (
                <WorkflowNode
                  key={step.id}
                  step={step}
                  index={index}
                  isSelected={selectedNodeId === step.id}
                  isDragging={isDraggingNode}
                  isDraggingConnection={isDraggingConnection}
                  connectionStart={connectionStart}
                  dragConnectionFrom={dragConnectionFrom}
                  onMouseDown={onNodeMouseDown}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDraggingNode && !isDraggingConnection) {
                      onStepClick(step);
                    }
                  }}
                  onMouseUp={() => {}}
                  onConnectionDragStart={onConnectionDragStart}
                  onConnectionDragEnd={onConnectionDragEnd}
                  onDelete={onDeleteStep}
                />
              ))}

              {/* Connection Lines between steps */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                {/* Render connection lines */}
                {selectedWorkflow?.steps?.map((step) => {
                  return step.connections.map((targetId) => {
                    const targetStep = selectedWorkflow.steps.find(s => s.id === targetId);
                    if (!targetStep) return null;

                    return (
                      <line
                        key={`line-${step.id}-${targetId}`}
                        x1={step.position.x + 110}
                        y1={step.position.y + 80}
                        x2={targetStep.position.x + 110}
                        y2={targetStep.position.y + 20}
                        stroke="#1976d2"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  });
                })}

                {/* Live connection preview while dragging */}
                {isDraggingConnection && dragConnectionFrom && dragConnectionTo && (
                  <line
                    x1={selectedWorkflow?.steps?.find(s => s.id === dragConnectionFrom)?.position.x! + 110}
                    y1={selectedWorkflow?.steps?.find(s => s.id === dragConnectionFrom)?.position.y! + 80}
                    x2={dragConnectionTo.x / canvasZoom - canvasPan.x}
                    y2={dragConnectionTo.y / canvasZoom - canvasPan.y}
                    stroke="#ff9800"
                    strokeWidth="4"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                )}

                {/* Arrow marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#1976d2"
                    />
                  </marker>
                </defs>
              </svg>

              {/* Drop zone indicator when dragging */}
              {isDragOver && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    border: '3px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999
                  }}
                >
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
                    Drop to Add Step
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default WorkflowCanvas;