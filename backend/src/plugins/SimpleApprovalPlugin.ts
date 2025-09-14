import {
  IWorkflowPlugin,
  IWorkflowConfig,
  IWorkflowStage,
  IWorkflowContext,
  IStageResult
} from '../types/workflow.types';

export class SimpleApprovalPlugin implements IWorkflowPlugin {
  id = 'simple-approval';
  name = 'Simple Two-Stage Approval';
  version = '1.0.0';
  description = 'Basic workflow with draft, review, and approval stages';
  organization = 'Generic';
  
  config: IWorkflowConfig = {
    stages: [
      {
        id: 'draft',
        name: 'Draft',
        type: 'sequential',
        order: 1,
        description: 'Document is being drafted',
        required: true,
        skippable: false,
        actions: [
          {
            id: 'submit',
            label: 'Submit for Review',
            type: 'custom',
            targetStage: 'review'
          }
        ],
        allowedRoles: ['author', 'editor'],
        ui: {
          icon: 'edit',
          color: '#6B7280'
        }
      },
      {
        id: 'review',
        name: 'Under Review',
        type: 'approval',
        order: 2,
        description: 'Document is under review',
        required: true,
        skippable: false,
        timeLimit: 48,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: 'approved'
          },
          {
            id: 'reject',
            label: 'Request Changes',
            type: 'reject',
            targetStage: 'draft',
            requireComment: true
          }
        ],
        allowedRoles: ['reviewer', 'manager'],
        ui: {
          icon: 'rate_review',
          color: '#3B82F6'
        }
      },
      {
        id: 'approved',
        name: 'Approved',
        type: 'sequential',
        order: 3,
        description: 'Document has been approved',
        required: true,
        skippable: false,
        actions: [],
        allowedRoles: [],
        ui: {
          icon: 'check_circle',
          color: '#10B981'
        }
      }
    ],
    
    transitions: [
      { id: 't1', from: 'draft', to: 'review', action: 'submit' },
      { id: 't2', from: 'review', to: 'approved', action: 'approve' },
      { id: 't3', from: 'review', to: 'draft', action: 'reject' }
    ],
    
    permissions: {
      'draft': {
        view: ['author', 'editor', 'reviewer'],
        edit: ['author', 'editor'],
        submit: ['author', 'editor']
      },
      'review': {
        view: ['all'],
        approve: ['reviewer', 'manager'],
        reject: ['reviewer', 'manager']
      },
      'approved': {
        view: ['all']
      }
    }
  };

  getStages(): IWorkflowStage[] {
    return this.config.stages;
  }

  async validateTransition(from: string, to: string, context: IWorkflowContext): Promise<boolean> {
    const transition = this.config.transitions.find(t => t.from === from && t.to === to);
    return !!transition;
  }

  async executeStage(stageId: string, context: IWorkflowContext): Promise<IStageResult> {
    const stage = this.config.stages.find(s => s.id === stageId);
    if (!stage) {
      return { success: false, errors: [`Stage ${stageId} not found`] };
    }

    const nextTransition = this.config.transitions.find(t => t.from === stageId);
    return {
      success: true,
      nextStage: nextTransition?.to,
      data: {
        stageCompleted: stageId,
        completedAt: new Date()
      }
    };
  }
}