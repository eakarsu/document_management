import { Node, Edge, MarkerType } from 'reactflow';
import { DocumentTaskType, getTaskConfiguration } from '@/types/document-workflow-tasks';
import { NodeData, TaskTemplate, WorkflowExport } from './types';

/**
 * Create a new task node with default properties
 */
export const createTaskNode = (
  task: TaskTemplate,
  position: { x: number; y: number },
  id?: string
): Node => {
  const nodeId = id || `node-${Date.now()}`;
  const config = getTaskConfiguration(task.type);

  return {
    id: nodeId,
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
      inputs: task.inputs || config.inputs || [],
      outputs: task.outputs || config.outputs || []
    } as NodeData,
  };
};

/**
 * Create a new connection edge between two nodes
 */
export const createConnectionEdge = (
  sourceId: string,
  targetId: string,
  edgeType: 'smart' | 'smoothstep' | 'straight' = 'smart',
  label: string = 'Proceed'
): Edge => {
  return {
    id: `${sourceId}-${targetId}-${Date.now()}`,
    source: sourceId,
    target: targetId,
    type: edgeType,
    data: {
      label,
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
    }
  };
};

/**
 * Validate if a connection between two nodes is allowed
 */
export const validateConnection = (
  sourceNode: Node,
  targetNode: Node,
  existingEdges: Edge[]
): { valid: boolean; message?: string } => {
  // Prevent self-connections
  if (sourceNode.id === targetNode.id) {
    return { valid: false, message: 'Cannot connect node to itself' };
  }

  // Check for duplicate connections
  const isDuplicate = existingEdges.some(
    edge => edge.source === sourceNode.id && edge.target === targetNode.id
  );

  if (isDuplicate) {
    return { valid: false, message: 'Connection already exists' };
  }

  // Task-specific validation
  const sourceTaskType = sourceNode.data.taskType as DocumentTaskType;
  const targetTaskType = targetNode.data.taskType as DocumentTaskType;

  // Example validations
  if (sourceTaskType?.includes('APPROVAL') && targetTaskType?.includes('APPROVAL')) {
    return {
      valid: false,
      message: 'Approval tasks cannot connect directly to each other'
    };
  }

  if (sourceTaskType === DocumentTaskType.END_WORKFLOW) {
    return {
      valid: false,
      message: 'End workflow tasks cannot have outgoing connections'
    };
  }

  return { valid: true };
};

/**
 * Auto-arrange nodes in a grid layout
 */
export const autoLayoutNodes = (nodes: Node[], gridSpacing: number = 250): Node[] => {
  const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % nodesPerRow) * gridSpacing,
      y: Math.floor(index / nodesPerRow) * gridSpacing
    }
  }));
};

/**
 * Find disconnected nodes in the workflow
 */
export const findDisconnectedNodes = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length <= 1) return [];

  const connectedNodeIds = new Set<string>();

  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  return nodes.filter(node => !connectedNodeIds.has(node.id));
};

/**
 * Find cycles in the workflow graph
 */
export const findCycles = (nodes: Node[], edges: Edge[]): string[][] => {
  const graph: Record<string, string[]> = {};
  const cycles: string[][] = [];

  // Build adjacency list
  nodes.forEach(node => {
    graph[node.id] = [];
  });

  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  });

  // DFS to find cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of graph[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycles;
};

/**
 * Export workflow to JSON format
 */
export const exportWorkflowToJSON = (
  nodes: Node[],
  edges: Edge[],
  workflowName: string,
  workflowDescription: string
): WorkflowExport => {
  return {
    id: `workflow-${Date.now()}`,
    name: workflowName,
    description: workflowDescription,
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
};

/**
 * Calculate workflow statistics
 */
export const calculateWorkflowStats = (nodes: Node[], edges: Edge[]) => {
  const stats = {
    totalNodes: nodes.length,
    totalConnections: edges.length,
    averageConnectionsPerNode: nodes.length > 0 ? edges.length / nodes.length : 0,
    nodesByCategory: {} as Record<string, number>,
    nodesByStatus: {} as Record<string, number>,
    disconnectedNodes: findDisconnectedNodes(nodes, edges).length,
    cycles: findCycles(nodes, edges).length
  };

  // Count nodes by category
  nodes.forEach(node => {
    const category = node.data.category || 'Unknown';
    stats.nodesByCategory[category] = (stats.nodesByCategory[category] || 0) + 1;
  });

  // Count nodes by status
  nodes.forEach(node => {
    const status = node.data.status || 'pending';
    stats.nodesByStatus[status] = (stats.nodesByStatus[status] || 0) + 1;
  });

  return stats;
};

/**
 * Snap position to grid
 */
export const snapToGrid = (position: { x: number; y: number }, gridSize: number) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

/**
 * Get all paths from start to end nodes
 */
export const findAllPaths = (nodes: Node[], edges: Edge[]): string[][] => {
  const graph: Record<string, string[]> = {};
  const paths: string[][] = [];

  // Build adjacency list
  nodes.forEach(node => {
    graph[node.id] = [];
  });

  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  });

  // Find start nodes (no incoming edges)
  const startNodes = nodes.filter(node =>
    !edges.some(edge => edge.target === node.id)
  );

  // Find end nodes (no outgoing edges)
  const endNodes = new Set(
    nodes.filter(node =>
      !edges.some(edge => edge.source === node.id)
    ).map(node => node.id)
  );

  // DFS to find all paths
  const dfs = (nodeId: string, currentPath: string[]) => {
    const newPath = [...currentPath, nodeId];

    if (endNodes.has(nodeId)) {
      paths.push(newPath);
      return;
    }

    for (const neighbor of graph[nodeId] || []) {
      if (!currentPath.includes(neighbor)) { // Avoid cycles
        dfs(neighbor, newPath);
      }
    }
  };

  startNodes.forEach(startNode => {
    dfs(startNode.id, []);
  });

  return paths;
};

/**
 * Validate workflow structure
 */
export const validateWorkflowStructure = (nodes: Node[], edges: Edge[]) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    errors.push('Workflow must have at least one task');
    return { valid: false, errors, warnings };
  }

  // Check for disconnected nodes
  const disconnected = findDisconnectedNodes(nodes, edges);
  if (disconnected.length > 0) {
    warnings.push(`${disconnected.length} disconnected nodes found`);
  }

  // Check for cycles
  const cycles = findCycles(nodes, edges);
  if (cycles.length > 0) {
    warnings.push(`${cycles.length} cycles detected in workflow`);
  }

  // Check for start nodes
  const startNodes = nodes.filter(node =>
    !edges.some(edge => edge.target === node.id)
  );
  if (startNodes.length === 0 && nodes.length > 1) {
    warnings.push('No start node found (node with no incoming connections)');
  }

  // Check for end nodes
  const endNodes = nodes.filter(node =>
    !edges.some(edge => edge.source === node.id)
  );
  if (endNodes.length === 0 && nodes.length > 1) {
    warnings.push('No end node found (node with no outgoing connections)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generate a unique ID for nodes/edges
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Download content as a file
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'application/json') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};