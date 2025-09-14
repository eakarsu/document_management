import {
  IWorkflowPlugin,
  IWorkflowConfig,
  IWorkflowStage,
  IWorkflowContext,
  IStageResult
} from '../types/workflow.types';

export class CorporateReviewPlugin implements IWorkflowPlugin {
  id = 'corporate-review';
  name = 'Corporate Document Review';
  version = '1.0.0';
  description = 'Multi-department corporate document review workflow';
  organization = 'Corporate';
  
  config: IWorkflowConfig = {
    stages: [
      {
        id: 'draft',
        name: 'Draft Creation',
        type: 'sequential',
        order: 1,
        description: 'Initial document creation',
        required: true,
        skippable: false,
        timeLimit: 120,
        actions: [
          {
            id: 'submit',
            label: 'Submit for Department Review',
            type: 'custom',
            targetStage: 'dept_review'
          }
        ],
        allowedRoles: ['author', 'contributor'],
        ui: {
          icon: 'create',
          color: '#6B7280'
        }
      },
      {
        id: 'dept_review',
        name: 'Department Review',
        type: 'parallel',
        order: 2,
        description: 'Department heads review',
        required: true,
        skippable: false,
        timeLimit: 72,
        requiredApprovals: 1,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: 'legal_compliance'
          },
          {
            id: 'request_changes',
            label: 'Request Changes',
            type: 'custom',
            targetStage: 'draft',
            requireComment: true
          }
        ],
        allowedRoles: ['department_head', 'team_lead'],
        ui: {
          icon: 'groups',
          color: '#3B82F6'
        }
      },
      {
        id: 'legal_compliance',
        name: 'Legal & Compliance',
        type: 'approval',
        order: 3,
        description: 'Legal and compliance review',
        required: true,
        skippable: false,
        timeLimit: 48,
        actions: [
          {
            id: 'approve',
            label: 'Compliant',
            type: 'approve',
            targetStage: 'executive_review'
          },
          {
            id: 'reject',
            label: 'Non-Compliant',
            type: 'reject',
            targetStage: 'draft',
            requireComment: true,
            requireAttachment: true
          }
        ],
        allowedRoles: ['legal_counsel', 'compliance_officer'],
        ui: {
          icon: 'balance',
          color: '#7C3AED'
        }
      },
      {
        id: 'executive_review',
        name: 'Executive Review',
        type: 'approval',
        order: 4,
        description: 'C-suite executive approval',
        required: true,
        skippable: false,
        timeLimit: 24,
        actions: [
          {
            id: 'approve',
            label: 'Approve for Publication',
            type: 'approve',
            targetStage: 'published'
          },
          {
            id: 'reject',
            label: 'Reject',
            type: 'reject',
            targetStage: 'dept_review',
            requireComment: true
          },
          {
            id: 'delegate',
            label: 'Delegate Review',
            type: 'delegate',
            requireComment: true
          }
        ],
        allowedRoles: ['ceo', 'cfo', 'coo', 'executive'],
        ui: {
          icon: 'business_center',
          color: '#DC2626'
        }
      },
      {
        id: 'published',
        name: 'Published',
        type: 'sequential',
        order: 5,
        description: 'Document published to organization',
        required: true,
        skippable: false,
        actions: [
          {
            id: 'archive',
            label: 'Archive Document',
            type: 'custom',
            targetStage: 'archived'
          }
        ],
        allowedRoles: ['admin', 'publisher'],
        ui: {
          icon: 'public',
          color: '#059669'
        }
      },
      {
        id: 'archived',
        name: 'Archived',
        type: 'sequential',
        order: 6,
        description: 'Document archived',
        required: false,
        skippable: false,
        actions: [],
        allowedRoles: [],
        ui: {
          icon: 'archive',
          color: '#6B7280'
        }
      }
    ],
    
    transitions: [
      { id: 't1', from: 'draft', to: 'dept_review', action: 'submit' },
      { id: 't2', from: 'dept_review', to: 'legal_compliance', action: 'approve' },
      { id: 't3', from: 'dept_review', to: 'draft', action: 'request_changes' },
      { id: 't4', from: 'legal_compliance', to: 'executive_review', action: 'approve' },
      { id: 't5', from: 'legal_compliance', to: 'draft', action: 'reject' },
      { id: 't6', from: 'executive_review', to: 'published', action: 'approve' },
      { id: 't7', from: 'executive_review', to: 'dept_review', action: 'reject' },
      { id: 't8', from: 'published', to: 'archived', action: 'archive' }
    ],
    
    permissions: {
      'draft': {
        view: ['author', 'contributor', 'department_head'],
        edit: ['author', 'contributor'],
        submit: ['author']
      },
      'dept_review': {
        view: ['all'],
        edit: ['department_head'],
        approve: ['department_head', 'team_lead'],
        request_changes: ['department_head', 'team_lead']
      },
      'legal_compliance': {
        view: ['all'],
        edit: ['legal_counsel', 'compliance_officer'],
        approve: ['legal_counsel', 'compliance_officer'],
        reject: ['legal_counsel', 'compliance_officer']
      },
      'executive_review': {
        view: ['all'],
        approve: ['ceo', 'cfo', 'coo', 'executive'],
        reject: ['ceo', 'cfo', 'coo', 'executive'],
        delegate: ['ceo', 'cfo', 'coo']
      },
      'published': {
        view: ['all'],
        archive: ['admin', 'publisher']
      },
      'archived': {
        view: ['admin', 'executive']
      }
    },
    
    notifications: [
      {
        id: 'n1',
        trigger: 'stage_enter',
        stage: 'dept_review',
        recipients: { type: 'role', value: ['department_head'] },
        template: 'New document pending department review: {{document.title}}',
        channel: 'email'
      },
      {
        id: 'n2',
        trigger: 'stage_enter',
        stage: 'legal_compliance',
        recipients: { type: 'role', value: ['legal_counsel'] },
        template: 'Document requires legal compliance review: {{document.title}}',
        channel: 'email'
      },
      {
        id: 'n3',
        trigger: 'stage_enter',
        stage: 'executive_review',
        recipients: { type: 'role', value: ['ceo', 'executive'] },
        template: 'Document awaiting executive approval: {{document.title}}',
        channel: 'in_app'
      }
    ],
    
    businessRules: [
      {
        id: 'br1',
        name: 'Financial Documents Require CFO',
        trigger: 'pre_transition',
        conditions: [
          {
            id: 'c1',
            type: 'field',
            field: 'document.category',
            operator: 'equals',
            value: 'financial'
          }
        ],
        actions: [
          {
            type: 'set_field',
            config: {
              field: 'workflow.requiredApprover',
              value: 'cfo'
            }
          }
        ]
      }
    ],
    
    settings: {
      allowSkipStages: false,
      requireComments: true,
      autoAdvance: false,
      parallelProcessing: true,
      trackHistory: true
    }
  };

  getStages(): IWorkflowStage[] {
    return this.config.stages;
  }

  async validateTransition(from: string, to: string, context: IWorkflowContext): Promise<boolean> {
    const transition = this.config.transitions.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      return false;
    }

    // Corporate-specific validations
    if (from === 'legal_compliance' && to === 'executive_review') {
      // Ensure compliance checks passed
      const complianceChecks = context.metadata?.complianceChecks;
      if (!complianceChecks || !complianceChecks.passed) {
        return false;
      }
    }

    return true;
  }

  async executeStage(stageId: string, context: IWorkflowContext): Promise<IStageResult> {
    const stage = this.config.stages.find(s => s.id === stageId);
    if (!stage) {
      return { success: false, errors: [`Stage ${stageId} not found`] };
    }

    switch (stageId) {
      case 'legal_compliance':
        return await this.executeLegalCompliance(context);
      
      case 'executive_review':
        return await this.executeExecutiveReview(context);
      
      case 'published':
        return await this.executePublishing(context);
      
      default:
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

  private async executeLegalCompliance(context: IWorkflowContext): Promise<IStageResult> {
    // Run compliance checks
    const complianceResult = {
      gdpr: true,
      sox: true,
      hipaa: context.document.category !== 'healthcare' || true,
      passed: true
    };

    return {
      success: true,
      nextStage: 'executive_review',
      data: {
        complianceChecks: complianceResult,
        reviewedBy: context.user.id,
        reviewDate: new Date()
      }
    };
  }

  private async executeExecutiveReview(context: IWorkflowContext): Promise<IStageResult> {
    // Check if proper executive approved
    const isFinancial = context.document.category === 'financial';
    const approver = context.user.roles;
    
    if (isFinancial && !approver.includes('cfo')) {
      return {
        success: false,
        errors: ['Financial documents require CFO approval']
      };
    }

    return {
      success: true,
      nextStage: 'published',
      data: {
        executiveApproval: true,
        approvedBy: context.user.id,
        approvalDate: new Date()
      }
    };
  }

  private async executePublishing(context: IWorkflowContext): Promise<IStageResult> {
    return {
      success: true,
      data: {
        publishedAt: new Date(),
        publishedBy: context.user.id,
        distributionList: ['all_employees'],
        publicUrl: `/documents/${context.document.id}`
      },
      notifications: [
        {
          recipientId: 'all',
          type: 'publication',
          subject: 'New Document Published',
          body: `${context.document.title} is now available`,
          priority: 'normal'
        }
      ]
    };
  }
}