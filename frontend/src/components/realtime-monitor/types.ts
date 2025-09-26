export interface RealtimeWorkflowMonitorProps {
  organizationId: string;
  workflowIds?: string[];
  onAlert?: (alert: WorkflowAlert) => void;
  onIntervention?: (intervention: InterventionSuggestion) => void;
}

export interface WorkflowActivity {
  id: string;
  workflowId: string;
  documentTitle: string;
  activity: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REASSIGNED' | 'ESCALATED' | 'COMMENT_ADDED' | 'DEADLINE_UPDATED';
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  details: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WorkflowStatus {
  workflowId: string;
  documentId: string;
  documentTitle: string;
  currentStep: string;
  overallProgress: number; // 0-100
  health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  velocity: number; // steps per hour
  estimatedCompletion: Date;
  blockers: string[];
  participants: {
    userId: string;
    name: string;
    avatar?: string;
    status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
    lastActivity: Date;
    pendingTasks: number;
  }[];
  metrics: {
    totalSteps: number;
    completedSteps: number;
    avgStepTime: number; // minutes
    delayRisk: number; // 0-100
    qualityScore: number; // 0-100
  };
}

export interface WorkflowAlert {
  id: string;
  type: 'DELAY_RISK' | 'BOTTLENECK' | 'CONFLICT' | 'DEADLINE_APPROACHING' | 'QUALITY_ISSUE' | 'PARTICIPANT_UNAVAILABLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  workflowId: string;
  documentTitle: string;
  message: string;
  description: string;
  timestamp: Date;
  actionRequired: boolean;
  suggestedActions: string[];
  affectedUsers: string[];
  estimatedImpact: string;
}

export interface InterventionSuggestion {
  id: string;
  workflowId: string;
  type: 'REASSIGN' | 'ESCALATE' | 'SCHEDULE_MEETING' | 'SEND_REMINDER' | 'MODIFY_DEADLINE' | 'ADD_REVIEWER';
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number; // 0-100
  expectedOutcome: string;
  implementation: {
    steps: string[];
    estimatedTime: number; // minutes
    requirements: string[];
  };
}

export interface MonitoringSettings {
  realTimeUpdates: boolean;
  alertThresholds: {
    delayRisk: number;
    qualityScore: number;
    participantInactivity: number; // hours
  };
  notificationTypes: string[];
  autoRefreshInterval: number; // seconds
}

export interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface MonitoringData {
  workflowStatuses: WorkflowStatus[];
  recentActivity: WorkflowActivity[];
  activeAlerts: WorkflowAlert[];
  interventionSuggestions: InterventionSuggestion[];
}