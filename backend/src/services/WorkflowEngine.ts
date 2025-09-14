import { 
  IWorkflowPlugin,
  IWorkflowContext,
  IWorkflowDocument,
  IWorkflowState,
  IStageResult,
  IWorkflowHistory,
  INotification,
  ITransitionRule,
  IWorkflowStage,
  ICondition
} from '../types/workflow.types';
import { WorkflowRegistry } from './WorkflowRegistry';
import { WorkflowStateManager } from './WorkflowStateManager';
import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

export interface IWorkflowResult {
  success: boolean;
  documentId: string;
  previousStage: string;
  currentStage: string;
  action: string;
  timestamp: Date;
  errors?: string[];
  warnings?: string[];
  notifications?: INotification[];
  data?: Record<string, any>;
}

export class WorkflowEngine extends EventEmitter {
  private registry: WorkflowRegistry;
  private stateManager: WorkflowStateManager;
  private prisma: PrismaClient;

  constructor() {
    super();
    this.registry = WorkflowRegistry.getInstance();
    this.stateManager = new WorkflowStateManager();
    this.prisma = new PrismaClient();
  }

  // Initialize workflow for a new document
  async initializeWorkflow(document: IWorkflowDocument): Promise<IWorkflowState> {
    const workflow = this.registry.getWorkflowForDocument(document);
    if (!workflow) {
      throw new Error(`No workflow configured for document type: ${document.type}`);
    }

    const stages = workflow.getStages();
    const firstStage = stages.find(s => s.order === 1) || stages[0];

    if (!firstStage) {
      throw new Error('Workflow has no initial stage');
    }

    const initialState: IWorkflowState = {
      workflowId: workflow.id,
      documentId: document.id,
      currentStage: firstStage.id,
      status: 'active',
      startedAt: new Date(),
      updatedAt: new Date(),
      history: [{
        id: this.generateId(),
        timestamp: new Date(),
        stageId: firstStage.id,
        action: 'workflow_started',
        userId: document.metadata?.createdBy || 'system',
        comment: 'Workflow initialized'
      }],
      data: {}
    };

    await this.stateManager.createState(document.id, initialState);

    // Emit workflow started event
    this.emit('workflow.started', {
      documentId: document.id,
      workflowId: workflow.id,
      stage: firstStage.id
    });

    // Execute stage enter handlers
    if (workflow.handlers?.onStageEnter) {
      await workflow.handlers.onStageEnter(firstStage, {
        document,
        user: { id: 'system', email: 'system', name: 'System', roles: ['system'] },
        action: 'initialize'
      });
    }

    return initialState;
  }

  // Process document through workflow
  async processDocument(
    document: IWorkflowDocument,
    action: string,
    context: IWorkflowContext
  ): Promise<IWorkflowResult> {
    try {
      // Get appropriate workflow
      const workflow = this.registry.getWorkflowForDocument(document);
      if (!workflow) {
        throw new Error(`No workflow configured for document type: ${document.type}`);
      }

      // Get current state
      let currentState = await this.stateManager.getState(document.id);
      if (!currentState) {
        currentState = await this.initializeWorkflow(document);
      }

      // Check if workflow is active
      if (currentState.status !== 'active') {
        throw new Error(`Workflow is ${currentState.status}, cannot process action`);
      }

      // Find the transition for this action
      const transition = this.findTransition(
        workflow, 
        currentState.currentStage, 
        action
      );

      if (!transition) {
        throw new Error(`No valid transition from stage '${currentState.currentStage}' with action '${action}'`);
      }

      // Validate transition
      const canTransition = await workflow.validateTransition(
        currentState.currentStage,
        transition.to,
        context
      );

      if (!canTransition) {
        throw new Error(`Transition validation failed: ${currentState.currentStage} -> ${transition.to}`);
      }

      // Check permissions
      const hasPermission = await this.checkPermissions(
        workflow,
        currentState.currentStage,
        action,
        context
      );

      if (!hasPermission) {
        throw new Error(`User lacks permission to perform action '${action}'`);
      }

      // Execute business rules (pre-transition)
      await this.executeBusinessRules(
        workflow,
        'pre_transition',
        currentState.currentStage,
        context
      );

      // Get current and next stages
      const currentStageObj = workflow.getStages().find(s => s.id === currentState.currentStage);
      const nextStageObj = workflow.getStages().find(s => s.id === transition.to);

      // Execute stage exit handlers
      if (currentStageObj && workflow.handlers?.onStageExit) {
        await workflow.handlers.onStageExit(currentStageObj, context);
      }

      // Execute the stage transition
      const result = await workflow.executeStage(transition.to, context);

      if (!result.success) {
        throw new Error(`Stage execution failed: ${result.errors?.join(', ')}`);
      }

      // Calculate time spent in previous stage
      const lastHistory = currentState.history[currentState.history.length - 1];
      const timeInStage = Date.now() - lastHistory.timestamp.getTime();

      // Update state
      const newState: IWorkflowState = {
        ...currentState,
        previousStage: currentState.currentStage,
        currentStage: transition.to,
        updatedAt: new Date(),
        history: [
          ...currentState.history,
          {
            id: this.generateId(),
            timestamp: new Date(),
            stageId: transition.to,
            action,
            userId: context.user.id,
            userName: context.user.name,
            comment: context.comment,
            duration: timeInStage,
            metadata: context.metadata
          }
        ],
        data: {
          ...currentState.data,
          ...result.data
        }
      };

      // Check if workflow is complete
      if (this.isWorkflowComplete(workflow, transition.to)) {
        newState.status = 'completed';
        newState.completedAt = new Date();
      }

      await this.stateManager.updateState(document.id, newState);

      // Execute stage enter handlers for new stage
      if (nextStageObj && workflow.handlers?.onStageEnter) {
        await workflow.handlers.onStageEnter(nextStageObj, context);
      }

      // Execute business rules (post-transition)
      await this.executeBusinessRules(
        workflow,
        'post_transition',
        transition.to,
        context
      );

      // Send notifications
      const notifications = await this.generateNotifications(
        workflow,
        transition,
        context
      );

      // Emit transition event
      this.emit('workflow.transition', {
        documentId: document.id,
        workflowId: workflow.id,
        from: currentState.currentStage,
        to: transition.to,
        action,
        userId: context.user.id,
        timestamp: new Date()
      });

      // If workflow completed, emit completion event
      if (newState.status === 'completed') {
        this.emit('workflow.completed', {
          documentId: document.id,
          workflowId: workflow.id,
          completedAt: newState.completedAt,
          duration: newState.completedAt!.getTime() - newState.startedAt.getTime()
        });

        if (workflow.handlers?.onComplete) {
          await workflow.handlers.onComplete(context);
        }
      }

      return {
        success: true,
        documentId: document.id,
        previousStage: currentState.currentStage,
        currentStage: transition.to,
        action,
        timestamp: new Date(),
        notifications,
        data: result.data
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log error
      console.error('Workflow processing error:', error);

      // Emit error event
      this.emit('workflow.error', {
        documentId: document.id,
        action,
        error: errorMessage,
        timestamp: new Date()
      });

      // Execute error handler if exists
      const workflow = this.registry.getWorkflowForDocument(document);
      if (workflow?.handlers?.onError) {
        await workflow.handlers.onError(error as Error, context);
      }

      return {
        success: false,
        documentId: document.id,
        previousStage: context.document.currentStage || '',
        currentStage: context.document.currentStage || '',
        action,
        timestamp: new Date(),
        errors: [errorMessage]
      };
    }
  }

  // Get available actions for current stage
  async getAvailableActions(
    document: IWorkflowDocument,
    userId: string
  ): Promise<string[]> {
    const workflow = this.registry.getWorkflowForDocument(document);
    if (!workflow) {
      return [];
    }

    const state = await this.stateManager.getState(document.id);
    if (!state || state.status !== 'active') {
      return [];
    }

    const currentStage = workflow.getStages().find(s => s.id === state.currentStage);
    if (!currentStage) {
      return [];
    }

    // Get user from context (would normally fetch from database)
    const user = { id: userId, roles: ['user'] }; // Simplified for now

    // Filter actions based on permissions
    const availableActions: string[] = [];
    for (const action of currentStage.actions) {
      const hasPermission = await this.checkActionPermission(
        workflow,
        state.currentStage,
        action.id,
        user
      );
      if (hasPermission) {
        availableActions.push(action.id);
      }
    }

    return availableActions;
  }

  // Get workflow history
  async getWorkflowHistory(documentId: string): Promise<IWorkflowHistory[]> {
    const state = await this.stateManager.getState(documentId);
    return state?.history || [];
  }

  // Get workflow status
  async getWorkflowStatus(documentId: string): Promise<IWorkflowState | null> {
    return await this.stateManager.getState(documentId);
  }

  // Cancel workflow
  async cancelWorkflow(
    documentId: string,
    reason: string,
    userId: string
  ): Promise<void> {
    const state = await this.stateManager.getState(documentId);
    if (!state) {
      throw new Error('Workflow state not found');
    }

    const updatedState: IWorkflowState = {
      ...state,
      status: 'cancelled',
      updatedAt: new Date(),
      history: [
        ...state.history,
        {
          id: this.generateId(),
          timestamp: new Date(),
          stageId: state.currentStage,
          action: 'cancel',
          userId,
          comment: reason
        }
      ]
    };

    await this.stateManager.updateState(documentId, updatedState);

    this.emit('workflow.cancelled', {
      documentId,
      reason,
      userId,
      timestamp: new Date()
    });
  }

  // Suspend workflow
  async suspendWorkflow(
    documentId: string,
    reason: string,
    userId: string
  ): Promise<void> {
    const state = await this.stateManager.getState(documentId);
    if (!state) {
      throw new Error('Workflow state not found');
    }

    const updatedState: IWorkflowState = {
      ...state,
      status: 'suspended',
      updatedAt: new Date(),
      history: [
        ...state.history,
        {
          id: this.generateId(),
          timestamp: new Date(),
          stageId: state.currentStage,
          action: 'suspend',
          userId,
          comment: reason
        }
      ]
    };

    await this.stateManager.updateState(documentId, updatedState);

    this.emit('workflow.suspended', {
      documentId,
      reason,
      userId,
      timestamp: new Date()
    });
  }

  // Resume workflow
  async resumeWorkflow(
    documentId: string,
    userId: string
  ): Promise<void> {
    const state = await this.stateManager.getState(documentId);
    if (!state) {
      throw new Error('Workflow state not found');
    }

    if (state.status !== 'suspended') {
      throw new Error('Workflow is not suspended');
    }

    const updatedState: IWorkflowState = {
      ...state,
      status: 'active',
      updatedAt: new Date(),
      history: [
        ...state.history,
        {
          id: this.generateId(),
          timestamp: new Date(),
          stageId: state.currentStage,
          action: 'resume',
          userId,
          comment: 'Workflow resumed'
        }
      ]
    };

    await this.stateManager.updateState(documentId, updatedState);

    this.emit('workflow.resumed', {
      documentId,
      userId,
      timestamp: new Date()
    });
  }

  // Private helper methods
  private findTransition(
    workflow: IWorkflowPlugin,
    fromStage: string,
    action: string
  ): ITransitionRule | null {
    return workflow.config.transitions.find(t => 
      t.from === fromStage && t.action === action
    ) || null;
  }

  private async checkPermissions(
    workflow: IWorkflowPlugin,
    stage: string,
    action: string,
    context: IWorkflowContext
  ): Promise<boolean> {
    const permissions = workflow.config.permissions[stage];
    if (!permissions) {
      return true; // No permissions defined, allow
    }

    const actionPermissions = permissions[action];
    if (!actionPermissions) {
      return true; // No specific permissions for this action
    }

    // Check if user has any of the required roles
    return context.user.roles.some(role => 
      actionPermissions.includes(role)
    );
  }

  private async checkActionPermission(
    workflow: IWorkflowPlugin,
    stage: string,
    actionId: string,
    user: { id: string; roles: string[] }
  ): Promise<boolean> {
    const permissions = workflow.config.permissions[stage];
    if (!permissions) {
      return true;
    }

    const actionPermissions = permissions[actionId];
    if (!actionPermissions) {
      return true;
    }

    return user.roles.some(role => actionPermissions.includes(role));
  }

  private async executeBusinessRules(
    workflow: IWorkflowPlugin,
    trigger: string,
    stage: string,
    context: IWorkflowContext
  ): Promise<void> {
    if (!workflow.config.businessRules) {
      return;
    }

    const rules = workflow.config.businessRules.filter(r => 
      r.trigger === trigger
    );

    for (const rule of rules) {
      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        rule.conditions,
        context
      );

      if (conditionsMet) {
        // Execute actions
        for (const action of rule.actions) {
          await this.executeBusinessAction(action, context);
        }
      }
    }
  }

  private async evaluateConditions(
    conditions: ICondition[],
    context: IWorkflowContext
  ): Promise<boolean> {
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, context);
      if (!met) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(
    condition: ICondition,
    context: IWorkflowContext
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In production, this would be more sophisticated
    switch (condition.type) {
      case 'field':
        const fieldValue = this.getFieldValue(context, condition.field!);
        return this.compareValues(fieldValue, condition.operator, condition.value);
      
      case 'role':
        return context.user.roles.includes(condition.value);
      
      case 'time':
        // Time-based conditions
        return true; // Simplified
      
      default:
        return true;
    }
  }

  private getFieldValue(context: IWorkflowContext, field: string): any {
    // Navigate nested fields using dot notation
    const parts = field.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private compareValues(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'not_equals':
        return value !== target;
      case 'contains':
        return String(value).includes(String(target));
      case 'greater_than':
        return value > target;
      case 'less_than':
        return value < target;
      case 'in':
        return Array.isArray(target) && target.includes(value);
      case 'not_in':
        return Array.isArray(target) && !target.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'not_exists':
        return value === undefined || value === null;
      default:
        return false;
    }
  }

  private async executeBusinessAction(
    action: any,
    context: IWorkflowContext
  ): Promise<void> {
    switch (action.type) {
      case 'set_field':
        // Set field value
        break;
      
      case 'send_notification':
        // Send notification
        break;
      
      case 'call_api':
        // Call external API
        break;
      
      case 'execute_script':
        // Execute custom script
        break;
      
      case 'trigger_workflow':
        // Trigger another workflow
        break;
    }
  }

  private async generateNotifications(
    workflow: IWorkflowPlugin,
    transition: ITransitionRule,
    context: IWorkflowContext
  ): Promise<INotification[]> {
    const notifications: INotification[] = [];

    if (!workflow.config.notifications) {
      return notifications;
    }

    // Find applicable notification configs
    const configs = workflow.config.notifications.filter(n => 
      n.trigger === 'action_taken' && n.stage === transition.to
    );

    for (const config of configs) {
      // Generate notification
      notifications.push({
        recipientId: 'admin', // Simplified
        type: 'workflow_transition',
        subject: `Document moved to ${transition.to}`,
        body: `Document ${context.document.id} has been moved to stage ${transition.to}`,
        priority: 'normal',
        data: {
          documentId: context.document.id,
          fromStage: transition.from,
          toStage: transition.to,
          action: context.action,
          userId: context.user.id
        }
      });
    }

    return notifications;
  }

  private isWorkflowComplete(
    workflow: IWorkflowPlugin,
    currentStage: string
  ): boolean {
    // Check if there are any outgoing transitions from current stage
    const hasOutgoingTransitions = workflow.config.transitions.some(t => 
      t.from === currentStage
    );
    
    return !hasOutgoingTransitions;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}