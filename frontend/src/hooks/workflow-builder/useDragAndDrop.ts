import { useState, useCallback } from 'react';
import { TaskTemplate, DragState } from '../../types/workflow-builder';

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDraggingNode: false,
    isDragOver: false,
    isDraggingConnection: false,
    selectedNodeId: null,
    draggedTask: null,
    nodeOffset: { x: 0, y: 0 },
    connectionStart: null,
    dragConnectionFrom: null,
    dragConnectionTo: null
  });

  const setDraggedTask = useCallback((task: TaskTemplate | null) => {
    setDragState(prev => ({ ...prev, draggedTask: task }));
  }, []);

  const setIsDragOver = useCallback((isDragOver: boolean) => {
    setDragState(prev => ({ ...prev, isDragOver }));
  }, []);

  const setSelectedNodeId = useCallback((nodeId: string | null) => {
    setDragState(prev => ({ ...prev, selectedNodeId: nodeId }));
  }, []);

  const setIsDraggingNode = useCallback((isDragging: boolean) => {
    setDragState(prev => ({ ...prev, isDraggingNode: isDragging }));
  }, []);

  const setNodeOffset = useCallback((offset: { x: number; y: number }) => {
    setDragState(prev => ({ ...prev, nodeOffset: offset }));
  }, []);

  const setConnectionStart = useCallback((stepId: string | null) => {
    setDragState(prev => ({ ...prev, connectionStart: stepId }));
  }, []);

  const setIsDraggingConnection = useCallback((isDragging: boolean) => {
    setDragState(prev => ({ ...prev, isDraggingConnection: isDragging }));
  }, []);

  const setDragConnectionFrom = useCallback((stepId: string | null) => {
    setDragState(prev => ({ ...prev, dragConnectionFrom: stepId }));
  }, []);

  const setDragConnectionTo = useCallback((position: { x: number; y: number } | null) => {
    setDragState(prev => ({ ...prev, dragConnectionTo: position }));
  }, []);

  const resetDragState = useCallback(() => {
    setDragState({
      isDraggingNode: false,
      isDragOver: false,
      isDraggingConnection: false,
      selectedNodeId: null,
      draggedTask: null,
      nodeOffset: { x: 0, y: 0 },
      connectionStart: null,
      dragConnectionFrom: null,
      dragConnectionTo: null
    });
  }, []);

  return {
    dragState,
    setDraggedTask,
    setIsDragOver,
    setSelectedNodeId,
    setIsDraggingNode,
    setNodeOffset,
    setConnectionStart,
    setIsDraggingConnection,
    setDragConnectionFrom,
    setDragConnectionTo,
    resetDragState
  };
};