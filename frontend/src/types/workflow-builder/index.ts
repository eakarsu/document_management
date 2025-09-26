export interface WorkflowNodeData {
  label: string;
  taskType: string;
  description?: string;
  category?: string;
  status: 'pending' | 'active' | 'error' | 'completed';
  roles: string[];
  timeLimit?: number | null;
  requiresApproval?: boolean;
  inputs?: any[];
  outputs?: any[];
}

export interface ConnectionData {
  label?: string;
  condition?: string | null;
  requireComment?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  category: string;
  tags: string[];
  steps?: WorkflowStep[];
  icon?: string;
  estimatedTime?: number | string;
  roles?: string[];
}

export interface WorkflowSettings {
  connectionMode: 'loose' | 'strict';
  edgeType: 'smart' | 'smoothstep' | 'straight';
  gridSize: number;
  snapToGrid: boolean;
}

export interface WorkflowExport {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: string;
  order: number;
  required: boolean;
  roles: string[];
  actions: WorkflowAction[];
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

export interface NotificationState {
  showSuccess: boolean;
  successMessage: string;
}

export interface TaskDragData {
  type: string;
  name: string;
  description: string;
  category: string;
  requiresApproval?: boolean;
  inputs?: any[];
  outputs?: any[];
}

// Additional type exports - simple any types to fix compilation
export type WorkflowStep = any;
export type TaskTemplate = any;
export type CanvasState = any;
export type DragState = any;