import React, { useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  ConnectionMode,
  BackgroundVariant
} from 'reactflow';
import {
  Box,
  Alert,
  Typography,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Add,
  AutoAwesome,
  CenterFocusStrong,
  GridOn,
  FiberManualRecord
} from '@mui/icons-material';
import { UseWorkflowBuilderReturn } from './types';
import { ProfessionalWorkflowNode } from './ProfessionalWorkflowNode';
import { SmartEdge } from './SmartEdge';
import { CustomConnectionLine } from './CustomConnectionLine';
import { TaskCategories, DocumentTaskType } from '@/types/document-workflow-tasks';
import { SimpleUndoRedoFixed } from './SimpleUndoRedoFixed';

// Define node and edge types outside component to prevent recreation
const nodeTypes: NodeTypes = {
  professional: ProfessionalWorkflowNode,
};

const edgeTypes = {
  smart: SmartEdge,
};

interface WorkflowCanvasProps {
  workflowBuilder: UseWorkflowBuilderReturn;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflowBuilder
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const {
    state,
    settings,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDrop,
    onDragOver,
    onNodeClick,
    onEdgeClick,
    fitView,
    autoLayout,
    setSnapToGrid,
    setReactFlowInstance,
    reactFlowInstance,
    saveToHistory
  } = workflowBuilder;

  // Extract nodes and edges from state
  const { nodes, edges } = state;


  const addNewNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'professional',
      position: { x: 300, y: 300 },
      data: {
        label: 'New Task',
        taskType: DocumentTaskType.MANUAL_REVIEW,
        status: 'pending' as const,
        description: 'Configure this task',
        roles: []
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onDragOverWrapper = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropWrapper = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const taskData = event.dataTransfer.getData('application/reactflow');

    if (taskData && reactFlowInstance) {
      const task = JSON.parse(taskData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${task.type}-${Date.now()}`,
        type: 'default',  // Use default node type for simplicity
        position,
        data: {
          label: task.name || 'New Task'
        },
        style: {
          backgroundColor: '#fff',
          border: '2px solid #1976d2',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          fontWeight: 500,
          width: 180,
          textAlign: 'center' as const
        }
      };

      setNodes((nds) => {
        const updated = nds.concat(newNode);
        return updated;
      });
      // Save to history after adding node
      setTimeout(saveToHistory, 100);
    }
  }, [reactFlowInstance, setNodes, saveToHistory]);

  return (
    <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', background: '#fafafa' }}>
      {/* Simple Undo/Redo Component */}
      <SimpleUndoRedoFixed
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
      />

      {/* React Flow Canvas */}
      <div
        ref={reactFlowWrapper}
        className="reactflow-wrapper"
        style={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative' }}
        onDragOver={onDragOverWrapper}
        onDrop={onDropWrapper}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onDrop={onDropWrapper}
          onDragOver={onDragOverWrapper}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={settings.connectionMode === 'loose' ? ConnectionMode.Loose : ConnectionMode.Strict}
          connectionLineComponent={CustomConnectionLine}
          fitView
          snapToGrid={settings.snapToGrid}
          snapGrid={[settings.gridSize, settings.gridSize]}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Control']}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#1976d2',
              strokeWidth: 2,
              strokeDasharray: '0'
            }
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={settings.gridSize}
            size={1}
            color="#ddd"
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const category = Object.values(TaskCategories).find(cat =>
                cat.tasks.includes(node.data.taskType as DocumentTaskType)
              );
              return category?.color || '#9e9e9e';
            }}
            nodeStrokeWidth={3}
            pannable
            zoomable
          />

          {/* Professional Help Panel */}
          <Panel position="top-center">
            <Alert
              severity="info"
              sx={{
                background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                color: '#fff',
                '& .MuiAlert-icon': { color: '#fff' }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Professional Workflow Builder
              </Typography>
              <Typography variant="caption">
                Hover nodes to see connection ports • Drag from any port to connect • Double-click to edit
              </Typography>
            </Alert>
          </Panel>

          {/* CSS for animations */}
          <style jsx global>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -10;
              }
            }
          `}</style>
        </ReactFlow>
      </div>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Add Node"
          onClick={addNewNode}
        />
        <SpeedDialAction
          icon={<AutoAwesome />}
          tooltipTitle="Auto Layout"
          onClick={autoLayout}
        />
        <SpeedDialAction
          icon={<CenterFocusStrong />}
          tooltipTitle="Fit View"
          onClick={fitView}
        />
        <SpeedDialAction
          icon={<GridOn />}
          tooltipTitle="Toggle Grid"
          onClick={() => setSnapToGrid(!settings.snapToGrid)}
        />
      </SpeedDial>
    </Box>
  );
};

export default WorkflowCanvas;