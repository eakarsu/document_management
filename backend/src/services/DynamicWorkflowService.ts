import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'review' | 'notification' | 'condition' | 'parallel' | 'end';
  icon: string;
  roles: string[];
  config: {
    timeLimit?: number;
    actions?: string[];
    conditions?: any;
    notifications?: string[];
    parallelBranches?: string[];
  };
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowTemplate {
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

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  description: string;
  color: string;
}

interface WorkflowInstance {
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

interface WorkflowStepHistory {
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

export class DynamicWorkflowService {
  constructor() {}

  // Create new workflow template
  async createWorkflowTemplate(params: {
    name: string;
    description: string;
    category: string;
    steps: WorkflowStep[];
    roles: CustomRole[];
    createdBy: string;
    organizationId: string;
    tags?: string[];
  }): Promise<{ success: boolean; template?: WorkflowTemplate; error?: string }> {
    try {
      // Validate workflow structure
      const validation = this.validateWorkflowStructure(params.steps);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const template: WorkflowTemplate = {
        id: `wf_${Date.now()}`,
        name: params.name,
        description: params.description,
        category: params.category,
        version: '1.0',
        createdBy: params.createdBy,
        organizationId: params.organizationId,
        steps: params.steps,
        roles: params.roles,
        isActive: true,
        tags: params.tags || [],
        estimatedDuration: this.calculateEstimatedDuration(params.steps)
      };

      // Store in database (using document custom fields for now)
      await prisma.document.create({
        data: {
          title: `Workflow Template: ${params.name}`,
          fileName: `${template.id}.json`,
          originalName: `${template.id}.json`,
          mimeType: 'application/json',
          fileSize: JSON.stringify(template).length,
          checksum: `wf_${Date.now()}`,
          storagePath: `/workflow-templates/${template.id}.json`,
          organizationId: params.organizationId,
          createdById: params.createdBy,
          customFields: {
            type: 'workflow_template',
            template: template as any,
            isSystemDocument: true
          } as any
        }
      });

      logger.info(`Dynamic workflow template created: ${template.id} by ${params.createdBy}`);

      return { success: true, template };
    } catch (error: any) {
      logger.error('Error creating workflow template:', error);
      return { success: false, error: 'Failed to create workflow template' };
    }
  }

  // Start workflow instance from template
  async startWorkflowInstance(params: {
    templateId: string;
    documentId: string;
    createdBy: string;
    variables?: Record<string, any>;
  }): Promise<{ success: boolean; instance?: WorkflowInstance; error?: string }> {
    try {
      // Get workflow template
      const template = await this.getWorkflowTemplate(params.templateId);
      if (!template) {
        return { success: false, error: 'Workflow template not found' };
      }

      // Find start step
      const startStep = template.steps.find(step => step.type === 'start');
      if (!startStep) {
        return { success: false, error: 'Workflow template has no start step' };
      }

      const instance: WorkflowInstance = {
        id: `wi_${Date.now()}`,
        templateId: params.templateId,
        documentId: params.documentId,
        currentStepId: startStep.id,
        status: 'active',
        createdBy: params.createdBy,
        startedAt: new Date(),
        variables: params.variables || {},
        stepHistory: [{
          stepId: startStep.id,
          stepName: startStep.name,
          userId: params.createdBy,
          userRole: 'INITIATOR',
          action: 'STARTED',
          timestamp: new Date()
        }]
      };

      // Update document with workflow instance
      await prisma.document.update({
        where: { id: params.documentId },
        data: {
          customFields: {
            workflowV2: {
              instanceId: instance.id,
              templateId: params.templateId,
              currentStepId: startStep.id,
              status: 'active',
              startedAt: new Date().toISOString(),
              stepHistory: instance.stepHistory as any
            }
          } as any
        }
      });

      logger.info(`Dynamic workflow instance started: ${instance.id} for document ${params.documentId}`);

      return { success: true, instance };
    } catch (error: any) {
      logger.error('Error starting workflow instance:', error);
      return { success: false, error: 'Failed to start workflow instance' };
    }
  }

  // Advance workflow to next step
  async advanceWorkflow(params: {
    instanceId: string;
    userId: string;
    userRole: string;
    action: string;
    comments?: string;
    data?: any;
  }): Promise<{ success: boolean; nextStep?: WorkflowStep; error?: string }> {
    try {
      // Get current workflow instance
      const instance = await this.getWorkflowInstance(params.instanceId);
      if (!instance) {
        return { success: false, error: 'Workflow instance not found' };
      }

      // Get workflow template
      const template = await this.getWorkflowTemplate(instance.templateId);
      if (!template) {
        return { success: false, error: 'Workflow template not found' };
      }

      // Get current step
      const currentStep = template.steps.find(step => step.id === instance.currentStepId);
      if (!currentStep) {
        return { success: false, error: 'Current step not found' };
      }

      // Validate user has permission for this action
      const hasPermission = await this.validateUserPermission(
        params.userId,
        params.userRole,
        currentStep,
        params.action
      );
      if (!hasPermission) {
        return { success: false, error: 'User does not have permission for this action' };
      }

      // Determine next step(s)
      const nextSteps = await this.determineNextSteps(currentStep, template.steps, params.action, params.data);
      
      if (nextSteps.length === 0) {
        // Workflow completed
        await this.completeWorkflow(instance.id);
        return { success: true };
      }

      // Handle single next step (most common case)
      const nextStep = nextSteps[0];

      // Record step completion
      const stepHistoryEntry: WorkflowStepHistory = {
        stepId: currentStep.id,
        stepName: currentStep.name,
        userId: params.userId,
        userRole: params.userRole,
        action: params.action,
        timestamp: new Date(),
        comments: params.comments,
        data: params.data
      };

      // Update workflow instance
      instance.currentStepId = nextStep.id;
      instance.stepHistory.push(stepHistoryEntry);

      // Update document
      await this.updateWorkflowInstance(instance);

      // Send notifications if configured
      await this.sendStepNotifications(nextStep, instance, template);

      logger.info(`Workflow advanced: ${params.instanceId} from ${currentStep.name} to ${nextStep.name}`);

      return { success: true, nextStep };
    } catch (error: any) {
      logger.error('Error advancing workflow:', error);
      return { success: false, error: 'Failed to advance workflow' };
    }
  }

  // Get workflow templates
  async getWorkflowTemplates(organizationId: string, category?: string): Promise<WorkflowTemplate[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          organizationId,
          customFields: {
            path: ['type'],
            equals: 'workflow_template'
          }
        }
      });

      const templates = documents
        .map((doc: any) => {
          const customFields = doc.customFields as any;
          return customFields?.template as WorkflowTemplate;
        })
        .filter(template => template && (!category || template.category === category));

      return templates;
    } catch (error: any) {
      logger.error('Error getting workflow templates:', error);
      return [];
    }
  }

  // Get workflow instance
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          customFields: {
            path: ['workflowV2', 'instanceId'],
            equals: instanceId
          }
        }
      });

      if (!document) return null;

      const workflowData = (document.customFields as any)?.workflowV2;
      if (!workflowData) return null;

      return {
        id: workflowData.instanceId,
        templateId: workflowData.templateId,
        documentId: document.id,
        currentStepId: workflowData.currentStepId,
        status: workflowData.status,
        createdBy: document.createdById,
        startedAt: new Date(workflowData.startedAt),
        completedAt: workflowData.completedAt ? new Date(workflowData.completedAt) : undefined,
        variables: workflowData.variables || {},
        stepHistory: workflowData.stepHistory || []
      };
    } catch (error: any) {
      logger.error('Error getting workflow instance:', error);
      return null;
    }
  }

  // Get workflow template
  async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate | null> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          customFields: {
            path: ['template', 'id'],
            equals: templateId
          }
        }
      });

      if (!document) return null;

      const customFields = document.customFields as any;
      return customFields?.template as WorkflowTemplate;
    } catch (error: any) {
      logger.error('Error getting workflow template:', error);
      return null;
    }
  }

  // Role and permission management
  async createCustomRole(params: {
    name: string;
    displayName: string;
    permissions: string[];
    description: string;
    color: string;
    organizationId: string;
  }): Promise<{ success: boolean; role?: CustomRole; error?: string }> {
    try {
      const role: CustomRole = {
        id: `role_${Date.now()}`,
        name: params.name.toUpperCase().replace(/\s+/g, '_'),
        displayName: params.displayName,
        permissions: params.permissions,
        description: params.description,
        color: params.color
      };

      // Store role definition
      await prisma.document.create({
        data: {
          title: `Custom Role: ${params.displayName}`,
          fileName: `${role.id}.json`,
          originalName: `${role.id}.json`,
          mimeType: 'application/json',
          fileSize: JSON.stringify(role).length,
          checksum: `role_${Date.now()}`,
          storagePath: `/custom-roles/${role.id}.json`,
          organizationId: params.organizationId,
          createdById: 'system',
          customFields: {
            type: 'custom_role',
            role: role as any,
            isSystemDocument: true
          } as any
        }
      });

      return { success: true, role };
    } catch (error: any) {
      logger.error('Error creating custom role:', error);
      return { success: false, error: 'Failed to create custom role' };
    }
  }

  // Private helper methods
  private validateWorkflowStructure(steps: WorkflowStep[]): { valid: boolean; error?: string } {
    // Check for start step
    const startSteps = steps.filter(step => step.type === 'start');
    if (startSteps.length !== 1) {
      return { valid: false, error: 'Workflow must have exactly one start step' };
    }

    // Check for end step
    const endSteps = steps.filter(step => step.type === 'end');
    if (endSteps.length === 0) {
      return { valid: false, error: 'Workflow must have at least one end step' };
    }

    // Check for orphaned steps (no connections)
    const connectedSteps = new Set();
    steps.forEach(step => {
      step.connections.forEach(conn => connectedSteps.add(conn));
    });

    const orphanedSteps = steps.filter(step => 
      step.type !== 'start' && !connectedSteps.has(step.id)
    );

    if (orphanedSteps.length > 0) {
      return { valid: false, error: `Orphaned steps found: ${orphanedSteps.map(s => s.name).join(', ')}` };
    }

    return { valid: true };
  }

  private calculateEstimatedDuration(steps: WorkflowStep[]): string {
    let totalDays = 0;
    steps.forEach(step => {
      if (step.config.timeLimit) {
        totalDays += step.config.timeLimit;
      }
    });

    if (totalDays === 0) return 'Not specified';
    if (totalDays === 1) return '1 day';
    if (totalDays < 7) return `${totalDays} days`;
    if (totalDays < 30) return `${Math.ceil(totalDays / 7)} weeks`;
    return `${Math.ceil(totalDays / 30)} months`;
  }

  private async validateUserPermission(
    userId: string,
    userRole: string,
    step: WorkflowStep,
    action: string
  ): Promise<boolean> {
    // Check if user role is allowed for this step
    if (!step.roles.includes(userRole) && !step.roles.includes('ALL')) {
      return false;
    }

    // Check if action is allowed for this step
    if (step.config.actions && !step.config.actions.includes(action)) {
      return false;
    }

    // Additional permission checks can be added here
    return true;
  }

  private async determineNextSteps(
    currentStep: WorkflowStep,
    allSteps: WorkflowStep[],
    action: string,
    data?: any
  ): Promise<WorkflowStep[]> {
    const nextSteps: WorkflowStep[] = [];

    // Handle different step types
    switch (currentStep.type) {
      case 'condition':
        // Evaluate condition logic
        const conditionResult = this.evaluateCondition(currentStep.config.conditions, data);
        const targetStepId = conditionResult ? currentStep.connections[0] : currentStep.connections[1];
        const targetStep = allSteps.find(step => step.id === targetStepId);
        if (targetStep) nextSteps.push(targetStep);
        break;

      case 'parallel':
        // Add all parallel branches
        currentStep.connections.forEach(connId => {
          const step = allSteps.find(s => s.id === connId);
          if (step) nextSteps.push(step);
        });
        break;

      default:
        // Standard single next step
        if (currentStep.connections.length > 0) {
          const nextStep = allSteps.find(step => step.id === currentStep.connections[0]);
          if (nextStep) nextSteps.push(nextStep);
        }
    }

    return nextSteps;
  }

  private evaluateCondition(conditions: any, data: any): boolean {
    // Simple condition evaluation - can be extended
    if (!conditions || !data) return true;
    
    // Example: { field: 'approval_status', operator: 'equals', value: 'approved' }
    if (conditions.field && conditions.operator && conditions.value) {
      const fieldValue = data[conditions.field];
      switch (conditions.operator) {
        case 'equals':
          return fieldValue === conditions.value;
        case 'not_equals':
          return fieldValue !== conditions.value;
        case 'greater_than':
          return fieldValue > conditions.value;
        case 'less_than':
          return fieldValue < conditions.value;
        default:
          return true;
      }
    }

    return true;
  }

  private async sendStepNotifications(
    step: WorkflowStep,
    instance: WorkflowInstance,
    template: WorkflowTemplate
  ): Promise<void> {
    // Implementation for sending notifications
    // Email, in-app notifications, etc.
    if (step.config.notifications && step.config.notifications.length > 0) {
      logger.info(`Sending notifications for step ${step.name} in workflow ${instance.id}`);
      // Notification logic here
    }
  }

  private async updateWorkflowInstance(instance: WorkflowInstance): Promise<void> {
    await prisma.document.update({
      where: { id: instance.documentId },
      data: {
        customFields: {
          workflowV2: {
            instanceId: instance.id,
            templateId: instance.templateId,
            currentStepId: instance.currentStepId,
            status: instance.status,
            startedAt: instance.startedAt.toISOString(),
            completedAt: instance.completedAt?.toISOString(),
            variables: instance.variables,
            stepHistory: instance.stepHistory as any
          }
        } as any
      }
    });
  }

  private async completeWorkflow(instanceId: string): Promise<void> {
    const instance = await this.getWorkflowInstance(instanceId);
    if (instance) {
      instance.status = 'completed';
      instance.completedAt = new Date();
      await this.updateWorkflowInstance(instance);
      
      logger.info(`Workflow completed: ${instanceId}`);
    }
  }
}