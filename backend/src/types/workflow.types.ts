// Core Workflow Types and Interfaces

export interface IWorkflowPlugin {
  // Metadata
  id: string;
  name: string;
  version: string;
  description: string;
  organization: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Configuration
  config: IWorkflowConfig;
  
  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  
  // Core workflow methods
  getStages: () => IWorkflowStage[];
  validateTransition: (from: string, to: string, context: IWorkflowContext) => boolean | Promise<boolean>;
  executeStage: (stageId: string, context: IWorkflowContext) => Promise<IStageResult>;
  
  // UI components
  getUIComponents?: () => IWorkflowUIComponents;
  
  // Event handlers
  handlers?: IWorkflowHandlers;
}

export interface IWorkflowConfig {
  stages: IWorkflowStage[];
  transitions: ITransitionRule[];
  permissions: IPermissionMatrix;
  notifications?: INotificationConfig[];
  integrations?: IIntegrationConfig[];
  customFields?: ICustomField[];
  businessRules?: IBusinessRule[];
  settings?: {
    allowSkipStages?: boolean;
    requireComments?: boolean;
    autoAdvance?: boolean;
    parallelProcessing?: boolean;
    trackHistory?: boolean;
  };
}

export interface IWorkflowStage {
  id: string;
  name: string;
  type: 'sequential' | 'parallel' | 'conditional' | 'approval' | 'automated';
  order: number;
  description?: string;
  
  // Stage configuration
  required: boolean;
  skippable?: boolean;
  repeatable?: boolean;
  timeLimit?: number; // in hours
  autoComplete?: boolean;
  
  // Actions available in this stage
  actions: IStageAction[];
  
  // Roles that can act on this stage
  allowedRoles: string[];
  requiredApprovals?: number;
  
  // Conditions to enter/exit stage
  entryConditions?: ICondition[];
  exitConditions?: ICondition[];
  
  // Automation
  automationRules?: IAutomationRule[];
  
  // UI configuration
  ui?: {
    icon?: string;
    color?: string;
    component?: string; // Custom React component name
    fields?: IFieldConfig[];
    layout?: 'default' | 'custom';
  };
}

export interface IStageAction {
  id: string;
  label: string;
  type: 'approve' | 'reject' | 'comment' | 'delegate' | 'custom';
  targetStage?: string;
  requireComment?: boolean;
  requireAttachment?: boolean;
  permissions?: string[];
  validations?: IValidation[];
}

export interface ITransitionRule {
  id: string;
  from: string;
  to: string;
  action: string;
  conditions?: ICondition[];
  validators?: IValidator[];
  effects?: ITransitionEffect[];
  metadata?: Record<string, any>;
}

export interface ICondition {
  id: string;
  type: 'field' | 'role' | 'time' | 'custom' | 'expression';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  expression?: string;
  errorMessage?: string;
}

export interface IPermissionMatrix {
  [stageId: string]: {
    view?: string[];
    edit?: string[];
    approve?: string[];
    reject?: string[];
    delegate?: string[];
    [action: string]: string[] | undefined;
  };
}

export interface IWorkflowContext {
  document: IWorkflowDocument;
  user: IWorkflowUser;
  action: string;
  comment?: string;
  attachments?: IAttachment[];
  metadata?: Record<string, any>;
  history?: IWorkflowHistory[];
}

export interface IWorkflowDocument {
  id: string;
  type: string;
  title: string;
  content?: any;
  metadata?: Record<string, any>;
  currentStage?: string;
  workflowState?: IWorkflowState;
  [key: string]: any;
}

export interface IWorkflowUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions?: string[];
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface IWorkflowState {
  workflowId: string;
  documentId: string;
  currentStage: string;
  previousStage?: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended' | 'error';
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  data?: Record<string, any>;
  history: IWorkflowHistory[];
  participants?: IParticipant[];
  deadlines?: IDeadline[];
}

export interface IWorkflowHistory {
  id: string;
  timestamp: Date;
  stageId: string;
  action: string;
  userId: string;
  userName?: string;
  comment?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  duration?: number; // time spent in stage
}

export interface IStageResult {
  success: boolean;
  newState?: Partial<IWorkflowState>;
  errors?: string[];
  warnings?: string[];
  nextStage?: string;
  data?: Record<string, any>;
  notifications?: INotification[];
}

export interface INotificationConfig {
  id: string;
  trigger: 'stage_enter' | 'stage_exit' | 'deadline_approaching' | 'deadline_passed' | 'action_taken';
  stage?: string;
  recipients: IRecipientConfig;
  template: string;
  channel: 'email' | 'sms' | 'in_app' | 'webhook';
  data?: Record<string, any>;
}

export interface IRecipientConfig {
  type: 'role' | 'user' | 'group' | 'dynamic';
  value: string | string[] | ((context: IWorkflowContext) => string[]);
}

export interface ICustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file';
  label: string;
  required?: boolean;
  defaultValue?: any;
  validations?: IValidation[];
  options?: { label: string; value: any }[];
  visibility?: ICondition[];
}

export interface IValidation {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, context: IWorkflowContext) => boolean;
}

export interface IBusinessRule {
  id: string;
  name: string;
  description?: string;
  trigger: 'pre_transition' | 'post_transition' | 'stage_enter' | 'stage_exit';
  conditions: ICondition[];
  actions: IBusinessAction[];
  priority?: number;
}

export interface IBusinessAction {
  type: 'set_field' | 'send_notification' | 'call_api' | 'execute_script' | 'trigger_workflow';
  config: Record<string, any>;
}

export interface IWorkflowUIComponents {
  stageCard?: string;
  actionButton?: string;
  progressBar?: string;
  timeline?: string;
  detailsPanel?: string;
  customComponents?: Record<string, string>;
}

export interface IWorkflowHandlers {
  onStageEnter?: (stage: IWorkflowStage, context: IWorkflowContext) => Promise<void>;
  onStageExit?: (stage: IWorkflowStage, context: IWorkflowContext) => Promise<void>;
  onTransition?: (transition: ITransitionRule, context: IWorkflowContext) => Promise<void>;
  onComplete?: (context: IWorkflowContext) => Promise<void>;
  onError?: (error: Error, context: IWorkflowContext) => Promise<void>;
}

export interface IValidator {
  id: string;
  name: string;
  validate: (context: IWorkflowContext) => Promise<boolean>;
  errorMessage?: string;
}

export interface ITransitionEffect {
  type: 'field_update' | 'notification' | 'api_call' | 'script';
  config: Record<string, any>;
}

export interface IAutomationRule {
  id: string;
  trigger: 'timer' | 'condition' | 'event';
  config: Record<string, any>;
  action: string;
}

export interface IFieldConfig {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validations?: IValidation[];
}

export interface IIntegrationConfig {
  id: string;
  type: 'api' | 'webhook' | 'database' | 'service';
  config: Record<string, any>;
  triggers?: string[];
}

export interface IAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface IParticipant {
  userId: string;
  role: string;
  joinedAt: Date;
  actions?: string[];
}

export interface IDeadline {
  stageId: string;
  dueDate: Date;
  warningDate?: Date;
  escalationRules?: IEscalationRule[];
}

export interface IEscalationRule {
  trigger: 'warning' | 'overdue';
  action: 'notify' | 'reassign' | 'escalate';
  config: Record<string, any>;
}

export interface INotification {
  recipientId: string;
  type: string;
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
}

// Plugin Registry Types
export interface IPluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  organization?: string;
  tags?: string[];
  icon?: string;
  screenshots?: string[];
  documentation?: string;
  repository?: string;
  license?: string;
  dependencies?: string[];
  compatibleVersions?: string[];
}

// Workflow Builder Types
export interface IWorkflowBuilderNode {
  id: string;
  type: 'stage' | 'decision' | 'parallel' | 'end';
  position: { x: number; y: number };
  data: IWorkflowStage | IDecisionNode;
}

export interface IWorkflowBuilderEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: ICondition;
  style?: Record<string, any>;
}

export interface IDecisionNode {
  id: string;
  name: string;
  conditions: ICondition[];
  trueBranch: string;
  falseBranch: string;
}

export interface IWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: IWorkflowConfig;
  thumbnail?: string;
  popularity?: number;
}