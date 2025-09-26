import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, ButtonGroup, Paper } from '@mui/material';
import { Undo, Redo } from '@mui/icons-material';
import { Node, Edge } from 'reactflow';

interface SimpleUndoRedoProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export const SimpleUndoRedoFixed: React.FC<SimpleUndoRedoProps> = ({
  nodes,
  edges,
  setNodes,
  setEdges
}) => {
  // Use refs for history to avoid React state issues
  const historyRef = useRef<{ nodes: Node[], edges: Edge[] }[]>([]);
  const indexRef = useRef(-1);
  const [, forceUpdate] = useState({});
  const skipSaveRef = useRef(false);
  const lastSavedStateRef = useRef<string>('');

  // Manual save function (for testing)
  const manualSave = useCallback(() => {
    if (skipSaveRef.current) {
      return;
    }

    const newState = {
      nodes: [...nodes],
      edges: [...edges]
    };

    // Check if state actually changed
    const stateString = JSON.stringify({ nodes, edges });
    if (stateString === lastSavedStateRef.current) {
      return;
    }

    // Remove future history
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);

    // Add new state
    historyRef.current.push(newState);
    indexRef.current = historyRef.current.length - 1;
    lastSavedStateRef.current = stateString;

    forceUpdate({});
  }, [nodes, edges]);

  // Undo function
  const handleUndo = useCallback(() => {

    // First, save current state if we're at the end
    if (indexRef.current === historyRef.current.length - 1 && historyRef.current.length > 0) {
      const currentStateString = JSON.stringify({ nodes, edges });
      const lastHistoryString = JSON.stringify(historyRef.current[indexRef.current]);

      if (currentStateString !== lastHistoryString) {
        manualSave();
      }
    }

    if (indexRef.current > 0) {
      skipSaveRef.current = true;
      indexRef.current--;

      const prevState = historyRef.current[indexRef.current];

      // Actually update the React Flow state
      setNodes([...prevState.nodes]);
      setEdges([...prevState.edges]);

      // Update our last saved state reference
      lastSavedStateRef.current = JSON.stringify(prevState);

      setTimeout(() => {
        skipSaveRef.current = false;
      }, 500);

      forceUpdate({});
    } else {
    }
  }, [nodes, edges, setNodes, setEdges, manualSave]);

  // Redo function
  const handleRedo = useCallback(() => {

    if (indexRef.current < historyRef.current.length - 1) {
      skipSaveRef.current = true;
      indexRef.current++;

      const nextState = historyRef.current[indexRef.current];

      // Actually update the React Flow state
      setNodes([...nextState.nodes]);
      setEdges([...nextState.edges]);

      // Update our last saved state reference
      lastSavedStateRef.current = JSON.stringify(nextState);

      setTimeout(() => {
        skipSaveRef.current = false;
      }, 500);

      forceUpdate({});
    } else {
    }
  }, [setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Auto-save on changes
  useEffect(() => {
    if (skipSaveRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if ((nodes.length > 0 || edges.length > 0) && !skipSaveRef.current) {
        manualSave();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [nodes, edges, manualSave]);

  // Initialize with empty state
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [{ nodes: [], edges: [] }];
      indexRef.current = 0;
      forceUpdate({});
    }
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        p: 0.5,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2
      }}
    >
      <ButtonGroup variant="contained" size="medium">
        <Button
          onClick={handleUndo}
          disabled={!canUndo}
          startIcon={<Undo />}
          sx={{
            minWidth: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)'
            },
            '&:disabled': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          Undo
        </Button>
        <Button
          onClick={handleRedo}
          disabled={!canRedo}
          startIcon={<Redo />}
          sx={{
            minWidth: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)'
            },
            '&:disabled': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          Redo
        </Button>
      </ButtonGroup>
    </Paper>
  );
};

export default SimpleUndoRedoFixed;