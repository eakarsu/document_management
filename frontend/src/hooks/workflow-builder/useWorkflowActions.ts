import { useCallback, useRef } from 'react';
import { Node, Edge, Connection, addEdge, MarkerType, ReactFlowInstance } from 'reactflow';
import { DocumentTaskType } from '@/types/document-workflow-tasks';
import { WorkflowExport, TaskDragData } from '@/types/workflow-builder';

interface UseWorkflowActionsProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  showSuccessMessage: (message: string) => void;
  snapToGrid: boolean;
  gridSize: number;
  edgeType: string;
}

export const useWorkflowActions = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  showSuccessMessage,
  snapToGrid,
  gridSize,
  edgeType
}: UseWorkflowActionsProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
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
  }, [nodes, edges, showSuccessMessage]);

  // Connection handler
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) return;

      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: edgeType,
        data: {
          label: 'Proceed',
          condition: null,
          requireComment: false
        },
        style: {
          stroke: '#1976d2',
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#1976d2'
        },
        animated: sourceNode?.data.taskType?.includes('CONDITIONAL')
      };

      setEdges((eds) => addEdge(newEdge, eds));
      showSuccessMessage(`Connected: ${sourceNode?.data.label} → ${targetNode?.data.label}`);
    },
    [nodes, edges, edgeType, isValidConnection, setEdges, showSuccessMessage]
  );

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const taskData = event.dataTransfer.getData('application/reactflow');

      if (!taskData || !reactFlowBounds || !reactFlowInstance.current) {
        return;
      }

      const task = JSON.parse(taskData) as TaskDragData;
      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Snap to grid if enabled
      if (snapToGrid) {
        position.x = Math.round(position.x / gridSize) * gridSize;
        position.y = Math.round(position.y / gridSize) * gridSize;
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
        },
      };

      setNodes((nds) => nds.concat(newNode));
      showSuccessMessage(`Added: ${task.name}`);
    },
    [snapToGrid, gridSize, setNodes, showSuccessMessage]
  );

  const onDragStart = (event: React.DragEvent, task: TaskDragData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Node and edge updates
  const updateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const updateEdge = useCallback((edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updates }, ...updates }
          : edge
      )
    );
  }, [setEdges]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) =>
      e.source !== nodeId && e.target !== nodeId
    ));
  }, [setNodes, setEdges]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  // Workflow operations
  const saveWorkflow = useCallback(async (workflow: WorkflowExport) => {
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
        a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to save:', error);
      // Save locally anyway
      const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      showSuccessMessage('Workflow saved as JSON file!');
    }
  }, [showSuccessMessage]);

  const exportWorkflow = useCallback((workflow: WorkflowExport) => {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    showSuccessMessage('Workflow exported as JSON!');
  }, [showSuccessMessage]);

  return {
    reactFlowWrapper,
    reactFlowInstance,
    onConnect,
    onDragOver,
    onDrop,
    onDragStart,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    saveWorkflow,
    exportWorkflow
  };
};