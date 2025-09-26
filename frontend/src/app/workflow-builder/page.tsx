'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Snackbar, Alert } from '@mui/material';
import { NodeTypes, EdgeTypes } from 'reactflow';

// Import all modular components
import { useWorkflowBuilder } from '@/components/workflow-builder/useWorkflowBuilder';
import { ProfessionalWorkflowNode } from '@/components/workflow-builder/CustomNodes';
import { SmartEdge, CustomConnectionLine } from '@/components/workflow-builder/CustomEdges';
import { WorkflowSidebar } from '@/components/workflow-builder/WorkflowSidebar';
import { WorkflowToolbar } from '@/components/workflow-builder/WorkflowToolbar';
import { PropertiesPanel } from '@/components/workflow-builder/PropertiesPanel';
import { WorkflowCanvas } from '@/components/workflow-builder/WorkflowCanvas';
import { DocumentTaskType } from '@/types/document-workflow-tasks';

// Define node and edge types
const nodeTypes: NodeTypes = {
  professional: ProfessionalWorkflowNode,
};

const edgeTypes: EdgeTypes = {
  smart: SmartEdge,
};

// Main refactored workflow builder component (under 200 lines)
export default function ProfessionalWorkflowBuilder() {
  const workflowBuilder = useWorkflowBuilder();
  const {
    state,
    uiState,
    settings,
    reactFlowInstance,
    // State setters
    setWorkflowName,
    setWorkflowDescription,
    setTabValue,
    setDrawerOpen,
    setPropertiesOpen,
    toggleCategory,
    showSuccessMessage,
    // Settings setters
    setConnectionMode,
    setEdgeType,
    setSnapToGrid,
    setGridSize,
    // Workflow actions
    saveWorkflow,
    exportWorkflow,
    loadTemplate,
    validateWorkflow,
    // Node/Edge handlers
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDrop,
    onDragOver,
    onNodeClick,
    onEdgeClick,
    handleDragStart,
    // Utils
    fitView,
    autoLayout,
    // History actions
    undo,
    redo,
    saveToHistory,
    // Additional refs
    reactFlowWrapper,
    setReactFlowInstance
  } = workflowBuilder;


  // Node and edge update handlers
  const handleUpdateNode = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  const handleUpdateEdge = (edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updates } }
          : edge
      )
    );
  };

  // Delete handlers
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) =>
      e.source !== nodeId && e.target !== nodeId
    ));
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  };

  // Add new node handler
  const handleAddNode = () => {
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

  // Template with sidebar showing templates
  const handleTabChange = (value: number) => {
    setTabValue(value);
  };

  return (
    <ReactFlowProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Global styles for animations */}
        <style jsx global>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}</style>

        {/* Left Sidebar */}
        <WorkflowSidebar
          state={state}
          uiState={uiState}
          settings={settings}
          onWorkflowNameChange={setWorkflowName}
          onWorkflowDescriptionChange={setWorkflowDescription}
          onTabChange={handleTabChange}
          onCategoryToggle={toggleCategory}
          onDragStart={handleDragStart}
          onConnectionModeChange={setConnectionMode}
          onEdgeTypeChange={setEdgeType}
          onSnapToGridChange={setSnapToGrid}
          onGridSizeChange={setGridSize}
        />

        {/* Main Canvas Area */}
        <Box
          sx={{ flexGrow: 1, position: 'relative', background: '#fafafa' }}
        >
          {/* Toolbar */}
          <WorkflowToolbar
            nodeCount={state.nodes.length}
            edgeCount={state.edges.length}
            onToggleDrawer={() => setDrawerOpen(!uiState.drawerOpen)}
            onSave={saveWorkflow}
            onExport={exportWorkflow}
            onImport={() => showSuccessMessage('Import functionality to be implemented')}
            onRun={() => showSuccessMessage('Workflow validation completed')}
            onValidate={() => {
              const result = validateWorkflow();
              showSuccessMessage(
                result.valid
                  ? 'Workflow is valid!'
                  : `Found ${result.errors.length} errors, ${result.warnings.length} warnings`
              );
            }}
          />

          {/* React Flow Canvas */}
          <Box ref={reactFlowWrapper} sx={{ height: 'calc(100% - 56px)' }}>
            <WorkflowCanvas
              workflowBuilder={workflowBuilder}
            />
          </Box>
        </Box>

        {/* Right Properties Panel */}
        <PropertiesPanel
          open={uiState.propertiesOpen}
          selectedNode={state.selectedNode}
          selectedEdge={state.selectedEdge}
          onClose={() => setPropertiesOpen(false)}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
        />

        {/* Success Notifications */}
        <Snackbar
          open={state.showSuccess}
          autoHideDuration={3000}
          onClose={() => showSuccessMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            onClose={() => showSuccessMessage('')}
            sx={{ minWidth: 300 }}
          >
            {state.successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ReactFlowProvider>
  );
}