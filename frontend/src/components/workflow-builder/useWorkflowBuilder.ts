import React, { useState, useCallback, useRef } from 'react';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import {
  WorkflowBuilderState,
  UIState,
  WorkflowSettings,
  UseWorkflowBuilderReturn,
  WorkflowTemplate,
  WorkflowExport,
  ValidationResult,
  NodeData,
  TaskTemplate
} from './types';
import { DocumentTaskType, getTaskConfiguration } from '@/types/document-workflow-tasks';

export const useWorkflowBuilder = (): UseWorkflowBuilderReturn => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Core state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Undo/Redo history - using refs for better performance
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef(0);
  const skipHistorySave = useRef(false);

  // Workflow builder state
  const [state, setState] = useState<WorkflowBuilderState>({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    workflowName: 'Professional Workflow',
    workflowDescription: '',
    showSuccess: false,
    successMessage: ''
  });

  // UI state
  const [uiState, setUIState] = useState<UIState>({
    drawerOpen: true,
    propertiesOpen: false,
    tabValue: 0,
    selectedCategory: null,
    expandedCategories: [],
    taskSearchQuery: '',
    showHelp: false,
    showShortcuts: false
  });

  // Settings state
  const [settings, setSettings] = useState<WorkflowSettings>({
    connectionMode: 'loose',
    edgeType: 'smart',
    gridSize: 15,
    snapToGrid: true
  });

  // Save state to history for undo/redo with detailed logging
  const saveToHistory = useCallback(() => {

    if (skipHistorySave.current) {
      return;
    }

    const currentState = {
      nodes: nodes.map(n => ({ ...n })),
      edges: edges.map(e => ({ ...e }))
    };


    // Check if state actually changed
    const lastState = historyRef.current[historyIndexRef.current];
    if (lastState) {
      const nodesChanged = JSON.stringify(lastState.nodes) !== JSON.stringify(currentState.nodes);
      const edgesChanged = JSON.stringify(lastState.edges) !== JSON.stringify(currentState.edges);

      if (!nodesChanged && !edgesChanged) {
        return;
      }

    }

    // Remove future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const removed = historyRef.current.length - historyIndexRef.current - 1;
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(currentState);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, [nodes, edges]);

  // Professional connection validation
  const isValidConnection = useCallback((connection: Connection): boolean => {
    // Get source and target nodes
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Prevent self-connections
    if (connection.source === connection.target) {
      showSuccessMessage('Cannot connect node to itself');
      return false;
    }

    // Check for duplicate connections
    const isDuplicate = edges.some(
      edge => edge.source === connection.source && edge.target === connection.target
    );

    if (isDuplicate) {
      showSuccessMessage('Connection already exists');
      return false;
    }

    // Task-specific validation
    const sourceTaskType = sourceNode.data.taskType as DocumentTaskType;
    const targetTaskType = targetNode.data.taskType as DocumentTaskType;

    // Example: Approval tasks cannot connect directly to another approval
    if (sourceTaskType?.includes('APPROVAL') && targetTaskType?.includes('APPROVAL')) {
      showSuccessMessage('Approval tasks cannot connect directly to each other');
      return false;
    }

    return true;
  }, [nodes, edges]);

  // Simplified connection handler with logging
  const onConnect = useCallback((params: Connection) => {

    // Simple validation - just prevent self-connections
    if (params.source === params.target) {
      return;
    }

    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      animated: false,  // Remove animation
      style: {
        stroke: '#1976d2',
        strokeWidth: 2,
        strokeDasharray: '0',  // Solid line (no dashes)
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#1976d2'
      }
    };

    setEdges((eds) => addEdge(newEdge, eds));

    // Save to history after connection
    setTimeout(() => {
      saveToHistory();
    }, 200);
  }, [setEdges, saveToHistory]);

  // Advanced drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const taskData = event.dataTransfer.getData('application/reactflow');

    if (!taskData || !reactFlowBounds || !reactFlowInstance) {
      return;
    }

    const task = JSON.parse(taskData);
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // Snap to grid if enabled
    if (settings.snapToGrid) {
      position.x = Math.round(position.x / settings.gridSize) * settings.gridSize;
      position.y = Math.round(position.y / settings.gridSize) * settings.gridSize;
    }

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'professional',
      position,
      data: {
        label: task.name,
        taskType: task.type,
        description: task.description,
        category: task.category,
        status: 'pending',
        roles: [],
        timeLimit: null,
        requiresApproval: task.requiresApproval || false,
        inputs: task.inputs || [],
        outputs: task.outputs || []
      } as NodeData,
    };

    setNodes((nds) => nds.concat(newNode));
    showSuccessMessage(`Added: ${task.name}`);
    // Save to history after adding node
    setTimeout(saveToHistory, 200);
  }, [reactFlowInstance, settings.snapToGrid, settings.gridSize, setNodes]);

  // Node and edge selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setPropertiesOpen(true);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setPropertiesOpen(true);
  }, []);

  // UI Actions
  const setSelectedNode = useCallback((node: Node | null) => {
    setState(prev => ({ ...prev, selectedNode: node }));
  }, []);

  const setSelectedEdge = useCallback((edge: Edge | null) => {
    setState(prev => ({ ...prev, selectedEdge: edge }));
  }, []);

  const setWorkflowName = useCallback((name: string) => {
    setState(prev => ({ ...prev, workflowName: name }));
  }, []);

  const setWorkflowDescription = useCallback((description: string) => {
    setState(prev => ({ ...prev, workflowDescription: description }));
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setUIState(prev => ({ ...prev, drawerOpen: open }));
  }, []);

  const setPropertiesOpen = useCallback((open: boolean) => {
    setUIState(prev => ({ ...prev, propertiesOpen: open }));
  }, []);

  const setTabValue = useCallback((value: number) => {
    setUIState(prev => ({ ...prev, tabValue: value }));
  }, []);

  const setSelectedCategory = useCallback((category: string | null) => {
    setUIState(prev => ({ ...prev, selectedCategory: category }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setUIState(prev => ({
      ...prev,
      expandedCategories: prev.expandedCategories.includes(category)
        ? prev.expandedCategories.filter(c => c !== category)
        : [...prev.expandedCategories, category]
    }));
  }, []);

  const showSuccessMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      showSuccess: true,
      successMessage: message
    }));
    setTimeout(() => {
      setState(prev => ({ ...prev, showSuccess: false }));
    }, 3000);
  }, []);

  // Undo action with detailed logging
  const undo = useCallback(() => {

    // Save current state if we're at the end of history
    if (historyIndexRef.current === historyRef.current.length - 1 && nodes.length + edges.length > 0) {
      const currentState = {
        nodes: nodes.map(n => ({ ...n })),
        edges: edges.map(e => ({ ...e }))
      };

      // Only save if different from last state
      const lastState = historyRef.current[historyIndexRef.current];
      if (!lastState ||
          JSON.stringify(lastState.nodes) !== JSON.stringify(currentState.nodes) ||
          JSON.stringify(lastState.edges) !== JSON.stringify(currentState.edges)) {
        historyRef.current.push(currentState);
        historyIndexRef.current++;
      } else {
      }
    }

    if (historyIndexRef.current > 0) {
      skipHistorySave.current = true;
      historyIndexRef.current--;
      const prevState = historyRef.current[historyIndexRef.current];

      setNodes(prevState.nodes);
      setEdges(prevState.edges);

      setTimeout(() => {
        skipHistorySave.current = false;
      }, 100);

      showSuccessMessage('Undo completed');
    } else {
      showSuccessMessage('Nothing to undo');
    }
  }, [nodes, edges, setNodes, setEdges, showSuccessMessage]);

  // Redo action with detailed logging
  const redo = useCallback(() => {

    if (historyIndexRef.current < historyRef.current.length - 1) {
      skipHistorySave.current = true;
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];

      setNodes(nextState.nodes);
      setEdges(nextState.edges);

      setTimeout(() => {
        skipHistorySave.current = false;
      }, 100);

      showSuccessMessage('Redo completed');
    } else {
      showSuccessMessage('Nothing to redo');
    }
  }, [nodes, edges, setNodes, setEdges, showSuccessMessage]);

  // Custom handlers that save history on changes with logging
  const onNodesChangeWithHistory = useCallback((changes: any) => {
    onNodesChange(changes);

    // Only save history for significant changes
    const significantChange = changes.some((change: any) =>
      change.type === 'remove' ||
      (change.type === 'position' && !change.dragging)
    );

    if (significantChange && !skipHistorySave.current) {
      setTimeout(() => {
        saveToHistory();
      }, 200);
    } else {
    }
  }, [onNodesChange, saveToHistory]);

  const onEdgesChangeWithHistory = useCallback((changes: any) => {
    onEdgesChange(changes);

    // Save history after edge changes
    if (changes.some((change: any) => change.type === 'remove') && !skipHistorySave.current) {
      setTimeout(() => {
        saveToHistory();
      }, 200);
    } else {
    }
  }, [onEdgesChange, saveToHistory]);

  // Settings Actions
  const setConnectionMode = useCallback((mode: 'loose' | 'strict') => {
    setSettings(prev => ({ ...prev, connectionMode: mode }));
  }, []);

  const setEdgeType = useCallback((type: 'smart' | 'smoothstep' | 'straight') => {
    setSettings(prev => ({ ...prev, edgeType: type }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setSettings(prev => ({ ...prev, gridSize: size }));
  }, []);

  const setSnapToGrid = useCallback((snap: boolean) => {
    setSettings(prev => ({ ...prev, snapToGrid: snap }));
  }, []);

  // Workflow Actions
  const saveWorkflow = useCallback(async () => {
    // Generate workflow JSON
    const workflow: WorkflowExport = {
      id: `workflow-${Date.now()}`,
      name: state.workflowName,
      description: state.workflowDescription,
      version: '1.0.0',
      type: 'document-review',
      stages: nodes.map((node, index) => ({
        id: node.id,
        name: node.data.label,
        type: node.data.taskType || DocumentTaskType.MANUAL_REVIEW,
        order: index + 1,
        required: true,
        roles: node.data.roles || ['Admin'],
        actions: edges
          .filter(e => e.source === node.id)
          .map(e => ({
            id: e.id,
            label: e.data?.label || 'Proceed',
            target: e.target,
            condition: e.data?.condition
          }))
      })),
      transitions: edges.map(edge => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        label: edge.data?.label || 'proceed',
        condition: edge.data?.condition
      }))
    };

    // Save to backend
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });

      if (response.ok) {
        showSuccessMessage('Workflow saved to backend!');

        // Also save as JSON file
        const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to save:', error);
      // Save locally anyway
      const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      showSuccessMessage('Workflow saved as JSON file!');
    }
  }, [state.workflowName, state.workflowDescription, nodes, edges]);

  const exportWorkflow = useCallback(() => {
    const workflow: WorkflowExport = {
      id: `workflow-${Date.now()}`,
      name: state.workflowName,
      description: state.workflowDescription,
      version: '1.0.0',
      type: 'document-review',
      stages: nodes.map((node, index) => ({
        id: node.id,
        name: node.data.label,
        type: node.data.taskType || DocumentTaskType.MANUAL_REVIEW,
        order: index + 1,
        required: true,
        roles: node.data.roles || ['Admin'],
        actions: edges
          .filter(e => e.source === node.id)
          .map(e => ({
            id: e.id,
            label: e.data?.label || 'Proceed',
            target: e.target,
            condition: e.data?.condition
          }))
      })),
      transitions: edges.map(edge => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        label: edge.data?.label || 'proceed',
        condition: edge.data?.condition
      }))
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    showSuccessMessage('Workflow exported as JSON!');
  }, [state.workflowName, state.workflowDescription, nodes, edges]);

  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    showSuccessMessage(`${template.name} loaded`);
  }, [setNodes, setEdges]);

  const validateWorkflow = useCallback((): ValidationResult => {
    const errors = [];
    const warnings = [];

    // Basic validation
    if (nodes.length === 0) {
      errors.push({
        id: 'no-nodes',
        message: 'Workflow must have at least one task',
        severity: 'error' as const
      });
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (nodes.length > 1 && !connectedNodes.has(node.id)) {
        warnings.push({
          id: `disconnected-${node.id}`,
          message: `Task "${node.data.label}" is not connected`,
          nodeId: node.id
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [nodes, edges]);

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setWorkflowName('Professional Workflow');
    setWorkflowDescription('');
    setSelectedNode(null);
    setSelectedEdge(null);
    showSuccessMessage('Workflow cleared');
  }, [setNodes, setEdges]);

  // Utils
  const fitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const autoLayout = useCallback(() => {
    // Simple auto layout - arrange nodes in a grid
    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 4) * 250,
        y: Math.floor(index / 4) * 150
      }
    }));
    setNodes(updatedNodes);
    showSuccessMessage('Auto layout applied');
  }, [nodes, setNodes]);

  // Sync state with nodes/edges
  React.useEffect(() => {
    setState(prev => ({ ...prev, nodes, edges }));
  }, [nodes, edges]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((event: React.DragEvent, task: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const taskData = event.dataTransfer.getData('application/reactflow');

    if (!taskData) {
      return;
    }

    if (!reactFlowInstance) {
      return;
    }

    try {
      const task = JSON.parse(taskData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${task.type}-${Date.now()}`,
        type: 'professional',
        position,
        data: {
          label: task.name,
          taskType: task.type,
          description: task.description,
          status: 'pending' as const,
          inputs: task.inputs || [],
          outputs: task.outputs || [],
          settings: {
            requiresApproval: task.requiresApproval || false,
            timeout: 3600000, // 1 hour default
            retries: 0
          }
        }
      };

      setNodes((nds) => nds.concat(newNode));
      showSuccessMessage('Task added to canvas');
      // Save to history after adding node
      setTimeout(saveToHistory, 200);
    } catch (error) {
      console.error('Failed to parse dropped task data:', error);
    }
  }, [reactFlowInstance, setNodes, showSuccessMessage]);

  return {
    // State
    state: {
      ...state,
      nodes,
      edges
    },
    uiState,
    settings,
    reactFlowInstance,
    selectedWorkflow: null,
    isBuilderMode: true,
    canvasState: { zoom: 1, pan: { x: 0, y: 0 } },
    dragState: {
      isDragOver: false,
      draggedTask: null,
      selectedNodeId: null,
      isDraggingNode: false,
      nodeOffset: { x: 0, y: 0 },
      isConnecting: false,
      connectionStart: null,
      isDraggingConnection: false,
      dragConnectionFrom: null,
      dragConnectionTo: null
    },

    // Actions
    setNodes,
    setEdges,
    onNodesChange: onNodesChangeWithHistory,
    onEdgesChange: onEdgesChangeWithHistory,
    onConnect,
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onNodeClick,
    onEdgeClick,
    handleDragStart,

    // UI Actions
    setSelectedNode,
    setSelectedEdge,
    setWorkflowName,
    setWorkflowDescription,
    setDrawerOpen,
    setPropertiesOpen,
    setTabValue,
    setSelectedCategory,
    toggleCategory,
    showSuccessMessage,

    // Settings Actions
    setConnectionMode,
    setEdgeType,
    setGridSize,
    setSnapToGrid,

    // Workflow Actions
    saveWorkflow,
    exportWorkflow,
    loadTemplate,
    validateWorkflow,
    clearWorkflow,
    createNewWorkflow: () => {},
    selectTemplate: () => {},
    setIsBuilderMode: () => {},
    addStep: () => {},
    deleteStep: () => {},

    // Canvas Actions
    handleZoomIn: () => {
      reactFlowInstance?.zoomIn();
    },
    handleZoomOut: () => {
      reactFlowInstance?.zoomOut();
    },
    handleResetZoom: () => {
      reactFlowInstance?.fitView();
    },
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleNodeMouseDown: () => {},
    handleCanvasMouseMove: () => {},
    handleCanvasMouseUp: () => {},
    handleConnectionDragStart: () => {},
    handleConnectionDragEnd: () => {},

    // Dialog Actions
    openStepDialog: () => {},
    closeStepDialog: () => {},
    updateSelectedStep: () => {},
    setUIState: (newState: any) => setUIState(newState),

    // Utils
    isValidConnection,
    fitView,
    autoLayout,
    undo,
    redo,
    saveToHistory,

    // Additional refs
    reactFlowWrapper,
    setReactFlowInstance
  };
};

export default useWorkflowBuilder;