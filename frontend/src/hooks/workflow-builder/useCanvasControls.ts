import { useState, useCallback } from 'react';
import { CanvasState } from '../../types/workflow-builder';

export const useCanvasControls = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 }
  });

  const setCanvasZoom = useCallback((zoom: number) => {
    setCanvasState(prev => ({ ...prev, zoom }));
  }, []);

  const setCanvasPan = useCallback((pan: { x: number; y: number }) => {
    setCanvasState(prev => ({ ...prev, pan }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setCanvasZoom(Math.min(canvasState.zoom + 0.1, 2));
  }, [canvasState.zoom, setCanvasZoom]);

  const handleZoomOut = useCallback(() => {
    setCanvasZoom(Math.max(canvasState.zoom - 0.1, 0.5));
  }, [canvasState.zoom, setCanvasZoom]);

  const handleResetZoom = useCallback(() => {
    setCanvasZoom(1);
  }, [setCanvasZoom]);

  return {
    canvasState,
    setCanvasZoom,
    setCanvasPan,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom
  };
};