'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Snackbar, Alert } from '@mui/material';

// Import refactored components
import { useWorkflowBuilder } from '@/components/workflow-builder/useWorkflowBuilder';
import { Sidebar } from '@/components/workflow-builder/Sidebar';
import { Toolbar } from '@/components/workflow-builder/Toolbar';
import { WorkflowCanvas } from '@/components/workflow-builder/WorkflowCanvas';
import { PropertiesPanel } from '@/components/workflow-builder/PropertiesPanel';
import { WorkflowTemplate } from '@/components/workflow-builder/types';

// Main Professional Workflow Builder Component
export default function ProfessionalWorkflowBuilderRefactored() {
  const workflowBuilder = useWorkflowBuilder();

  const {
    state,
    uiState,
    settings,
    setNodes,
    setEdges,
    setDrawerOpen,
    setPropertiesOpen,
    setTabValue,
    toggleCategory,
    setConnectionMode,
    setEdgeType,
    setGridSize,
    setSnapToGrid,
    saveWorkflow,
    exportWorkflow,
    loadTemplate,
    validateWorkflow,
    showSuccessMessage
  } = workflowBuilder;

  // Drag start handler for task items
  const onDragStart = (event: React.DragEvent, task: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Node update handlers
  const handleNodeUpdate = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  const handleEdgeUpdate = (edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updates } }
          : edge
      )
    );
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) =>
      e.source !== nodeId && e.target !== nodeId
    ));
  };

  const handleEdgeDelete = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  };

  // Template loading handler
  const handleLoadTemplate = (template: WorkflowTemplate) => {
    loadTemplate(template);
  };

  // Toolbar action handlers
  const handleSave = async () => {
    await saveWorkflow();
  };

  const handleExport = () => {
    exportWorkflow();
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    showSuccessMessage('Import functionality to be implemented');
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    showSuccessMessage('Undo functionality to be implemented');
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
    showSuccessMessage('Redo functionality to be implemented');
  };

  const handleRun = () => {
    const validation = validateWorkflow();
    if (validation.valid) {
      showSuccessMessage('Workflow validation passed! Ready to run.');
    } else {
      showSuccessMessage(`Validation failed: ${validation.errors[0]?.message}`);
    }
  };

  const handleValidate = () => {
    const validation = validateWorkflow();
    if (validation.valid) {
      showSuccessMessage('Workflow is valid!');
    } else {
      showSuccessMessage(`Validation errors: ${validation.errors.length}, Warnings: ${validation.warnings.length}`);
    }
  };

  return (
    <ReactFlowProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Professional Sidebar */}
        <Sidebar
          open={uiState.drawerOpen}
          workflowName={state.workflowName}
          workflowDescription={state.workflowDescription}
          onUpdateWorkflowName={workflowBuilder.setWorkflowName}
          onUpdateWorkflowDescription={workflowBuilder.setWorkflowDescription}
          tabValue={uiState.tabValue}
          onTabChange={setTabValue}
          expandedCategories={uiState.expandedCategories}
          onToggleCategory={toggleCategory}
          onDragStart={onDragStart}
          onLoadTemplate={handleLoadTemplate}
          connectionMode={settings.connectionMode}
          onConnectionModeChange={setConnectionMode}
          edgeType={settings.edgeType}
          onEdgeTypeChange={setEdgeType}
          gridSize={settings.gridSize}
          onGridSizeChange={setGridSize}
          snapToGrid={settings.snapToGrid}
          onSnapToGridChange={setSnapToGrid}
        />

        {/* Main Canvas Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Professional Toolbar */}
          <Toolbar
            drawerOpen={uiState.drawerOpen}
            onToggleDrawer={() => setDrawerOpen(!uiState.drawerOpen)}
            nodes={state.nodes}
            edges={state.edges}
            workflowName={state.workflowName}
            workflowDescription={state.workflowDescription}
            onSave={handleSave}
            onExport={handleExport}
            onImport={handleImport}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onRun={handleRun}
            onValidate={handleValidate}
          />

          {/* Workflow Canvas */}
          <WorkflowCanvas workflowBuilder={workflowBuilder} />
        </Box>

        {/* Properties Panel */}
        <PropertiesPanel
          open={uiState.propertiesOpen}
          onClose={() => setPropertiesOpen(false)}
          selectedNode={state.selectedNode}
          selectedEdge={state.selectedEdge}
          onUpdateNode={handleNodeUpdate}
          onUpdateEdge={handleEdgeUpdate}
          onDeleteNode={handleNodeDelete}
          onDeleteEdge={handleEdgeDelete}
        />

        {/* Success Notifications */}
        <Snackbar
          open={state.showSuccess}
          autoHideDuration={3000}
          onClose={() => {}}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            onClose={() => {}}
            sx={{ minWidth: 300 }}
          >
            {state.successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ReactFlowProvider>
  );
}