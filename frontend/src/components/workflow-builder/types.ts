import { Node, Edge, ReactFlowInstance, Connection } from 'reactflow';
import { DocumentTaskType } from '@/types/document-workflow-tasks';

// Re-export DocumentTaskType for components
export { DocumentTaskType };

// Core WorkflowBuilder Types
export interface WorkflowBuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  workflowName: string;
  workflowDescription: string;
  showSuccess: boolean;
  successMessage: string;
}

// UI State Types
export interface UIState {
  drawerOpen: boolean;
  propertiesOpen: boolean;
  tabValue: number;
  selectedCategory: string | null;
  expandedCategories: string[];
  taskSearchQuery: string;
  showHelp: boolean;
  showShortcuts: boolean;
  openStepDialog?: boolean;
  selectedStep?: any;
}

// Settings Types
export interface WorkflowSettings {
  connectionMode: 'loose' | 'strict';
  edgeType: 'smart' | 'smoothstep' | 'straight';
  gridSize: number;
  snapToGrid: boolean;
}

// Node Data Types
export interface NodeData {
  label: string;
  taskType: DocumentTaskType;
  description?: string;
  category?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  roles: string[];
  timeLimit?: number | null;
  requiresApproval?: boolean;
  inputs?: any[];
  outputs?: any[];
}

// Edge Data Types
export interface EdgeData {
  label?: string;
  condition?: string | null;
  requireComment?: boolean;
}

// Custom Edge Props
export interface SmartEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  data?: EdgeData;
  markerEnd?: any;
  style?: React.CSSProperties;
  selected?: boolean;
}

// Custom Node Props
export interface ProfessionalNodeProps {
  data: NodeData;
  selected: boolean;
  isConnectable: boolean;
}

// Connection Line Props
export interface CustomConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionLineStyle?: React.CSSProperties;
}

// Workflow Template Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes?: Node[];
  edges?: Edge[];
  estimatedTime?: string;
  icon?: string;
  tags?: string[];
  steps?: WorkflowStep[];
  roles?: string[];
}

// Task Template Types
export interface TaskTemplate {
  id?: string;
  type: DocumentTaskType;
  name: string;
  description: string;
  category: string;
  requiresApproval?: boolean;
  inputs?: any[];
  outputs?: any[];
  icon?: string;
}

// Drag and Drop Types
export interface DraggedTask extends TaskTemplate {
  // Additional properties for drag operation
}

// Toolbar Actions
export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

// Properties Panel Types
export interface PropertyField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'switch' | 'number' | 'autocomplete' | 'textarea';
  value: any;
  options?: { value: any; label: string }[];
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

// Workflow Export Types
export interface WorkflowExport {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  metadata?: Record<string, any>;
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: DocumentTaskType;
  order: number;
  required: boolean;
  roles: string[];
  actions: WorkflowAction[];
  settings?: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  label: string;
  target: string;
  condition?: string;
}

export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  label: string;
  condition?: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  id: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  id: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

// Hook Types
export interface UseWorkflowBuilderReturn {
  // State
  state: WorkflowBuilderState;
  uiState: UIState;
  settings: WorkflowSettings;
  reactFlowInstance: ReactFlowInstance | null;
  selectedWorkflow: any;
  isBuilderMode: boolean;
  canvasState: CanvasState;
  dragState: DragState;

  // Actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: Connection) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;

  // UI Actions
  setSelectedNode: (node: Node | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setDrawerOpen: (open: boolean) => void;
  setPropertiesOpen: (open: boolean) => void;
  setTabValue: (value: number) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleCategory: (category: string) => void;
  showSuccessMessage: (message: string) => void;

  // Settings Actions
  setConnectionMode: (mode: 'loose' | 'strict') => void;
  setEdgeType: (type: 'smart' | 'smoothstep' | 'straight') => void;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;

  // Workflow Actions
  saveWorkflow: () => Promise<void>;
  exportWorkflow: () => void;
  loadTemplate: (template: WorkflowTemplate) => void;
  validateWorkflow: () => ValidationResult;
  clearWorkflow: () => void;
  createNewWorkflow: () => void;
  selectTemplate: (template: any) => void;
  setIsBuilderMode: (mode: boolean) => void;
  addStep: (step: any) => void;
  deleteStep: (stepId: string) => void;

  // Canvas Actions
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  handleDragStart: (event: React.DragEvent, task: any) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => void;
  handleNodeMouseDown: (event: React.MouseEvent, nodeId: string) => void;
  // History Actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  handleCanvasMouseMove: (event: React.MouseEvent) => void;
  handleCanvasMouseUp: (event: React.MouseEvent) => void;
  handleConnectionDragStart: (nodeId: string) => void;
  handleConnectionDragEnd: (targetNodeId?: string) => void;

  // Dialog Actions
  openStepDialog: (step?: any) => void;
  closeStepDialog: () => void;
  updateSelectedStep: (step: any) => void;
  setUIState: (state: UIState | ((prev: UIState) => UIState)) => void;

  // Utils
  isValidConnection: (connection: Connection) => boolean;
  fitView: () => void;
  autoLayout: () => void;

  // Additional refs
  reactFlowWrapper: React.RefObject<HTMLDivElement> | null;
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
}

// Legacy types for backward compatibility
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'review' | 'notification' | 'condition' | 'parallel' | 'end';
  icon: string;
  roles: string[];
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
}

export interface DragState {
  isDragOver: boolean;
  draggedTask: TaskTemplate | null;
  selectedNodeId: string | null;
  isDraggingNode: boolean;
  nodeOffset: { x: number; y: number };
  isConnecting: boolean;
  connectionStart: string | null;
  isDraggingConnection: boolean;
  dragConnectionFrom: string | null;
  dragConnectionTo: { x: number; y: number } | null;
}