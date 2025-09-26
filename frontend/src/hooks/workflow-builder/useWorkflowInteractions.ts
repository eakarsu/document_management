import { useCallback, useState } from 'react';
import { TaskTemplate, WorkflowStep } from '../../types/workflow-builder';
import { useDragAndDrop } from './useDragAndDrop';
import { useCanvasControls } from './useCanvasControls';
import { useWorkflowState } from './useWorkflowState';

export const useWorkflowInteractions = () => {
  const workflowState = useWorkflowState();
  const dragAndDrop = useDragAndDrop();
  const canvasControls = useCanvasControls();

  // Additional state for workflow builder
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [openStepDialog, setOpenStepDialog] = useState(false);

  const addStep = useCallback((task: TaskTemplate, position: { x: number, y: number }) => {
    console.log('Adding step:', task, position);
  }, []);

  const addConnection = useCallback((from: string, to: string) => {
    console.log('Adding connection:', from, to);
  }, []);

  const updateWorkflow = useCallback((workflow: any) => {
    setSelectedWorkflow(workflow);
  }, []);

  const createNewWorkflow = useCallback(() => {
    setSelectedWorkflow({ id: 'new', name: 'New Workflow', steps: [], connections: [] });
    setIsBuilderMode(true);
  }, []);

  const deleteStep = useCallback((stepId: string) => {
    console.log('Deleting step:', stepId);
  }, []);

  const updateStep = useCallback((step: any) => {
    console.log('Updating step:', step);
  }, []);
  const { dragState, setDraggedTask, setIsDragOver, setSelectedNodeId, setIsDraggingNode, setNodeOffset, setIsDraggingConnection, setDragConnectionFrom, setDragConnectionTo } = dragAndDrop;
  const { canvasState } = canvasControls;

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, template: TaskTemplate) => {
    setDraggedTask(template);
    e.dataTransfer.effectAllowed = 'copy';
  }, [setDraggedTask]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, [setIsDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, [setIsDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (dragState.draggedTask) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
      const y = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

      addStep(dragState.draggedTask, { x: Math.max(50, x - 100), y: Math.max(50, y - 50) });
      setDraggedTask(null);
    }
  }, [dragState.draggedTask, canvasState, addStep, setDraggedTask, setIsDragOver]);

  // Node interaction handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.workflow-canvas')?.getBoundingClientRect();

    if (canvasRect) {
      setNodeOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setSelectedNodeId(stepId);
      setIsDraggingNode(true);
    }
  }, [setNodeOffset, setSelectedNodeId, setIsDraggingNode]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDraggingNode && dragState.selectedNodeId && selectedWorkflow) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - dragState.nodeOffset.x - canvasState.pan.x) / canvasState.zoom;
      const y = (e.clientY - rect.top - dragState.nodeOffset.y - canvasState.pan.y) / canvasState.zoom;

      updateWorkflow({
        ...selectedWorkflow,
        steps: selectedWorkflow.steps.map(step =>
          step.id === dragState.selectedNodeId
            ? { ...step, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : step
        )
      });
    }
  }, [dragState, selectedWorkflow, canvasState, updateWorkflow]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingNode(false);
    setSelectedNodeId(null);
  }, [setIsDraggingNode, setSelectedNodeId]);

  // Connection drag handlers
  const handleConnectionDragStart = useCallback((e: React.MouseEvent, fromStepId: string) => {
    e.stopPropagation();
    setIsDraggingConnection(true);
    setDragConnectionFrom(fromStepId);

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.workflow-canvas')?.getBoundingClientRect();
    if (canvasRect) {
      setDragConnectionTo({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      });
    }
  }, [setIsDraggingConnection, setDragConnectionFrom, setDragConnectionTo]);

  const handleConnectionDragMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDraggingConnection) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragConnectionTo({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [dragState.isDraggingConnection, setDragConnectionTo]);

  const handleConnectionDragEnd = useCallback((targetStepId?: string) => {
    if (dragState.isDraggingConnection && dragState.dragConnectionFrom && targetStepId && selectedWorkflow) {
      if (dragState.dragConnectionFrom !== targetStepId) {
        addConnection(dragState.dragConnectionFrom, targetStepId);
      }
    }

    setIsDraggingConnection(false);
    setDragConnectionFrom(null);
    setDragConnectionTo(null);
  }, [dragState, selectedWorkflow, addConnection, setIsDraggingConnection, setDragConnectionFrom, setDragConnectionTo]);

  return {
    ...workflowState,
    ...dragAndDrop,
    ...canvasControls,
    // Add missing properties expected by components
    selectedWorkflow,
    addStep,
    addConnection,
    updateWorkflow,
    isBuilderMode,
    selectedStep,
    openStepDialog,
    setSelectedWorkflow,
    setIsBuilderMode,
    setSelectedStep,
    setOpenStepDialog,
    createNewWorkflow,
    deleteStep,
    updateStep,
    // Handler functions
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleNodeMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleConnectionDragStart,
    handleConnectionDragMove,
    handleConnectionDragEnd
  };
};