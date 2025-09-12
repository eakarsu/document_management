export interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'review' | 'notification' | 'condition' | 'parallel' | 'end' | 'custom';
  icon: string;
  roles: string[];
  config: {
    timeLimit?: number;
    actions?: string[];
    conditions?: any;
    notifications?: string[];
    parallelBranches?: string[];
    isRequired?: boolean;
    allowParallel?: boolean;
    canSkip?: boolean;
  };
  position: { x: number; y: number };
  connections: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  createdBy: string;
  organizationId: string;
  steps: WorkflowStep[];
  roles: CustomRole[];
  isActive: boolean;
  tags: string[];
  estimatedDuration?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  description: string;
  color: string;
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  documentId: string;
  currentStepId: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdBy: string;
  startedAt: Date;
  completedAt?: Date;
  variables: Record<string, any>;
  stepHistory: WorkflowStepHistory[];
}

export interface WorkflowStepHistory {
  stepId: string;
  stepName: string;
  userId: string;
  userRole: string;
  action: string;
  timestamp: Date;
  duration?: number;
  comments?: string;
  data?: any;
}