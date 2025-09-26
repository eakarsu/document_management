import React, { useState, useCallback, useEffect } from 'react';
import { Button, ButtonGroup, Paper } from '@mui/material';
import { Undo, Redo } from '@mui/icons-material';
import { Node, Edge } from 'reactflow';

interface SimpleUndoRedoProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export const SimpleUndoRedo: React.FC<SimpleUndoRedoProps> = ({
  nodes,
  edges,
  setNodes,
  setEdges
}) => {
  // Simple history state
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // Save current state to history
  const saveState = useCallback(() => {
    const newState = {
      nodes: nodes.map(n => ({ ...n })),
      edges: edges.map(e => ({ ...e }))
    };

    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);

      // Keep only last 50 states
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      return newHistory;
    });

    setCurrentIndex(prev => prev + 1);
  }, [nodes, edges, currentIndex]);

  // Undo function
  const handleUndo = useCallback(() => {

    if (currentIndex > 0) {
      setIsUndoRedo(true); // Prevent auto-save
      const newIndex = currentIndex - 1;
      const prevState = history[newIndex];


      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCurrentIndex(newIndex);

      // Re-enable auto-save after a delay
      setTimeout(() => setIsUndoRedo(false), 1000);

    } else {
    }
  }, [currentIndex, history, setNodes, setEdges]);

  // Redo function
  const handleRedo = useCallback(() => {

    if (currentIndex < history.length - 1) {
      setIsUndoRedo(true); // Prevent auto-save
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];


      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCurrentIndex(newIndex);

      // Re-enable auto-save after a delay
      setTimeout(() => setIsUndoRedo(false), 1000);

    } else {
    }
  }, [currentIndex, history, setNodes, setEdges]);

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

  // Auto-save state when nodes or edges change
  useEffect(() => {
    // Don't save during undo/redo operations
    if (isUndoRedo) {
      return;
    }

    const timer = setTimeout(() => {
      // Only save if we have nodes or edges
      if (nodes.length > 0 || edges.length > 0) {
        saveState();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nodes, edges, saveState, isUndoRedo]);

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        p: 1
      }}
    >
      <ButtonGroup variant="contained" size="small">
        <Button
          onClick={handleUndo}
          disabled={currentIndex <= 0}
          startIcon={<Undo />}
        >
          Undo ({currentIndex}/{history.length})
        </Button>
        <Button
          onClick={handleRedo}
          disabled={currentIndex >= history.length - 1}
          startIcon={<Redo />}
        >
          Redo
        </Button>
      </ButtonGroup>
    </Paper>
  );
};

export default SimpleUndoRedo;