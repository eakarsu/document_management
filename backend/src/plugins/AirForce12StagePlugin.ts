import {
  IWorkflowPlugin,
  IWorkflowConfig,
  IWorkflowStage,
  IWorkflowContext,
  IStageResult,
  ITransitionRule,
  ICondition,
  IStageAction
} from '../types/workflow.types';

export class AirForce12StagePlugin implements IWorkflowPlugin {
  id = 'af-12-stage-review';
  name = 'Air Force 12-Stage Hierarchical Distributed Workflow';
  version = '2.0.0';
  description = 'Enhanced Air Force document review with organizational hierarchy, gatekeepers, and ownership transfer';
  organization = 'United States Air Force';
  author = 'AFDPO';

  config: IWorkflowConfig = {
    stages: [
      // Stage 1: Initial Draft Preparation
      {
        id: '1',
        name: 'Initial Draft Preparation',
        type: 'sequential',
        order: 1,
        description: 'Action Officer creates and refines initial draft',
        required: true,
        skippable: false,
        timeLimit: 168, // 7 days
        actions: [
          {
            id: 'create_draft',
            label: 'Create Draft',
            type: 'custom',
            requireComment: false
          },
          {
            id: 'transfer_ownership',
            label: 'Transfer to Another AO',
            type: 'custom',
            requireComment: false
          },
          {
            id: 'submit_to_pcm',
            label: 'Submit to PCM',
            type: 'custom',
            targetStage: '2',
            requireComment: false
          }
        ],
        allowedRoles: ['ACTION_OFFICER'],
        ui: {
          icon: 'edit',
          color: '#6B7280'
        }
      },

      // Stage 2: PCM Review (OPR Gatekeeper)
      {
        id: '2',
        name: 'PCM Review (OPR Gatekeeper)',
        type: 'approval',
        order: 2,
        description: 'Program Control Manager reviews before coordination',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'review',
            label: 'Review Document',
            type: 'custom'
          },
          {
            id: 'approve',
            label: 'Approve for Coordination',
            type: 'approve',
            targetStage: '3'
          },
          {
            id: 'reject',
            label: 'Return to AO',
            type: 'reject',
            targetStage: '1',
            requireComment: true
          }
        ],
        allowedRoles: ['PCM'],
        ui: {
          icon: 'security',
          color: '#3B82F6'
        }
      },

      // Stage 3: First Coordination - Distribution Phase
      {
        id: '3',
        name: 'First Coordination - Distribution Phase',
        type: 'parallel',
        order: 3,
        description: 'Coordinator distributes to organization reviewers',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        actions: [
          {
            id: 'distribute_to_reviewers',
            label: 'Distribute to Reviewers',
            type: 'custom',
            targetStage: '3.5'
          }
        ],
        allowedRoles: ['COORDINATOR'],
        ui: {
          icon: 'group',
          color: '#10B981'
        }
      },

      // Stage 3.5: Review Collection Phase
      {
        id: '3.5',
        name: 'Review Collection Phase',
        type: 'parallel',
        order: 4,
        description: 'Collecting reviews from distributed reviewers',
        required: true,
        skippable: false,
        timeLimit: 240, // 10 days
        actions: [
          {
            id: 'submit_review',
            label: 'Submit Review',
            type: 'custom',
            targetStage: '3.5'
          },
          {
            id: 'complete_reviews',
            label: 'All Reviews Complete',
            type: 'custom',
            targetStage: '4'
          }
        ],
        allowedRoles: ['SUB_REVIEWER', 'OPR', 'COORDINATOR', 'ACTION_OFFICER'],
        ui: {
          icon: 'rate_review',
          color: '#6366F1'
        }
      },

      // Stage 4: OPR Feedback Incorporation & Draft Creation
      {
        id: '4',
        name: 'OPR Feedback Incorporation & Draft Creation',
        type: 'sequential',
        order: 5,
        description: 'Action Officer combines all feedback, creates updated draft document',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        actions: [
          {
            id: 'review_feedback',
            label: 'Review All Feedback',
            type: 'custom'
          },
          {
            id: 'incorporate_changes',
            label: 'Incorporate Changes',
            type: 'custom'
          },
          {
            id: 'create_draft_document',
            label: 'Create Draft Document',
            type: 'custom'
          },
          {
            id: 'submit_for_second_coordination',
            label: 'Submit for Second Coordination',
            type: 'custom',
            targetStage: '5'
          }
        ],
        allowedRoles: ['ACTION_OFFICER', 'LEADERSHIP'],
        ui: {
          icon: 'edit_note',
          color: '#8B5CF6'
        }
      },

      // Stage 5: Second Coordination - Distribution Phase
      {
        id: '5',
        name: 'Second Coordination - Distribution Phase',
        type: 'parallel',
        order: 6,
        description: 'Coordinator distributes updated draft document to organization reviewers',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        actions: [
          {
            id: 'distribute_draft_to_reviewers',
            label: 'Distribute Draft to Reviewers',
            type: 'custom',
            targetStage: '5.5'
          }
        ],
        allowedRoles: ['COORDINATOR'],
        ui: {
          icon: 'share',
          color: '#EC4899'
        }
      },

      // Stage 5.5: Second Review Collection Phase
      {
        id: '5.5',
        name: 'Second Review Collection Phase',
        type: 'parallel',
        order: 7,
        description: 'Collecting reviews from distributed reviewers for the draft document',
        required: true,
        skippable: false,
        timeLimit: 240, // 10 days
        actions: [
          {
            id: 'submit_draft_review',
            label: 'Submit Draft Review',
            type: 'custom',
            targetStage: '5.5'
          },
          {
            id: 'complete_draft_reviews',
            label: 'All Draft Reviews Complete',
            type: 'custom',
            targetStage: '6'
          }
        ],
        allowedRoles: ['SUB_REVIEWER', 'OPR', 'COORDINATOR', 'ACTION_OFFICER', 'LEADERSHIP', 'LEGAL', 'LEGAL_REVIEWER'],
        ui: {
          icon: 'reviews',
          color: '#F59E0B'
        }
      },

      // Stage 6: Second OPR Feedback Incorporation
      {
        id: '6',
        name: 'Second OPR Feedback Incorporation',
        type: 'sequential',
        order: 8,
        description: 'OPR incorporates second round feedback',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        actions: [
          {
            id: 'review_second_feedback',
            label: 'Review Second Round Feedback',
            type: 'custom'
          },
          {
            id: 'final_updates',
            label: 'Make Final Updates',
            type: 'custom'
          },
          {
            id: 'submit_to_legal',
            label: 'Submit to Legal',
            type: 'custom',
            targetStage: '7'
          }
        ],
        allowedRoles: ['ACTION_OFFICER', 'OPR', 'LEADERSHIP', 'OPR_LEADERSHIP'],
        ui: {
          icon: 'refresh',
          color: '#10B981'
        }
      },

      // Stage 7: Legal Review & Approval
      {
        id: '7',
        name: 'Legal Review & Approval',
        type: 'approval',
        order: 9,
        description: 'Legal team reviews for compliance and regulatory issues',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'legal_review',
            label: 'Legal Review',
            type: 'custom'
          },
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: '8'
          },
          {
            id: 'reject',
            label: 'Reject with Legal Concerns',
            type: 'reject',
            targetStage: '6',
            requireComment: true
          }
        ],
        allowedRoles: ['LEGAL'],
        ui: {
          icon: 'gavel',
          color: '#DC2626'
        }
      },

      // Stage 8: Post-Legal OPR Update
      {
        id: '8',
        name: 'Post-Legal OPR Update',
        type: 'sequential',
        order: 10,
        description: 'Action Officer addresses any legal concerns',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        actions: [
          {
            id: 'address_legal',
            label: 'Address Legal Feedback',
            type: 'custom'
          },
          {
            id: 'prepare_for_leadership',
            label: 'Prepare for Leadership Review',
            type: 'custom'
          },
          {
            id: 'submit_to_leadership',
            label: 'Submit to OPR Leadership',
            type: 'custom',
            targetStage: '9'
          }
        ],
        allowedRoles: ['ACTION_OFFICER', 'OPR', 'LEADERSHIP'],
        ui: {
          icon: 'task_alt',
          color: '#059669'
        }
      },

      // Stage 9: OPR Leadership Final Review & Signature
      {
        id: '9',
        name: 'OPR Leadership Final Review & Signature',
        type: 'approval',
        order: 11,
        description: 'OPR organization leadership provides final approval and signature',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'final_review',
            label: 'Final Leadership Review',
            type: 'custom'
          },
          {
            id: 'sign_and_approve',
            label: 'Sign and Approve',
            type: 'approve',
            targetStage: '10'
          },
          {
            id: 'reject',
            label: 'Reject',
            type: 'reject',
            targetStage: '8',
            requireComment: true
          }
        ],
        allowedRoles: ['LEADERSHIP'],
        ui: {
          icon: 'verified',
          color: '#7C3AED'
        }
      },

      // Stage 10: PCM Final Validation
      {
        id: '10',
        name: 'PCM Final Validation',
        type: 'approval',
        order: 12,
        description: 'PCM performs final validation before publication',
        required: true,
        skippable: false,
        timeLimit: 48, // 2 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'pcm_final_review',
            label: 'PCM Final Review',
            type: 'custom'
          },
          {
            id: 'approve_for_publication',
            label: 'Approve for Publication',
            type: 'approve',
            targetStage: '11'
          },
          {
            id: 'return_to_leadership',
            label: 'Return to Leadership',
            type: 'reject',
            targetStage: '9',
            requireComment: true
          }
        ],
        allowedRoles: ['PCM'],
        ui: {
          icon: 'fact_check',
          color: '#0891B2'
        }
      },

      // Stage 11: AFDPO Publication
      {
        id: '11',
        name: 'AFDPO Publication',
        type: 'approval',
        order: 13,
        description: 'Final publication and distribution',
        required: true,
        skippable: false,
        timeLimit: 168, // 7 days
        actions: [
          {
            id: 'final_check',
            label: 'Final Publication Check',
            type: 'custom'
          },
          {
            id: 'publish',
            label: 'Publish Document',
            type: 'custom'
          },
          {
            id: 'archive',
            label: 'Archive',
            type: 'custom'
          }
        ],
        allowedRoles: ['AFDPO'],
        ui: {
          icon: 'publish',
          color: '#EA580C'
        }
      }
    ],

    transitions: [
      { id: 't1', from: '1', to: '2', action: 'submit_to_pcm' },
      { id: 't2', from: '2', to: '3', action: 'approve' },
      { id: 't3', from: '2', to: '1', action: 'reject' },
      { id: 't4', from: '3', to: '3.5', action: 'distribute_to_reviewers' },
      { id: 't5', from: '3.5', to: '4', action: 'complete_reviews' },
      { id: 't6', from: '4', to: '5', action: 'submit_for_second_coordination' },
      { id: 't7', from: '5', to: '5.5', action: 'distribute_draft_to_reviewers' },
      { id: 't8', from: '5.5', to: '6', action: 'complete_draft_reviews' },
      { id: 't9', from: '6', to: '7', action: 'submit_to_legal' },
      { id: 't10', from: '7', to: '8', action: 'approve' },
      { id: 't11', from: '7', to: '6', action: 'reject' },
      { id: 't12', from: '8', to: '9', action: 'submit_to_leadership' },
      { id: 't13', from: '9', to: '10', action: 'sign_and_approve' },
      { id: 't14', from: '9', to: '8', action: 'reject' },
      { id: 't15', from: '10', to: '11', action: 'approve_for_publication' },
      { id: 't16', from: '10', to: '9', action: 'return_to_leadership' }
    ],


    notifications: [
      {
        id: 'stage_complete',
        trigger: 'stage_exit',
        recipients: {
          type: 'role',
          value: ['ACTION_OFFICER', 'PCM']
        },
        template: 'stage_completed',
        channel: 'email'
      },
      {
        id: 'assignment_created',
        trigger: 'stage_enter',
        recipients: {
          type: 'role',
          value: ['ACTION_OFFICER']
        },
        template: 'new_assignment',
        channel: 'email'
      }
    ],

    permissions: {
      '1': {
        view: ['ACTION_OFFICER', 'PCM'],
        edit: ['ACTION_OFFICER'],
        approve: ['ACTION_OFFICER']
      },
      '2': {
        view: ['PCM', 'ACTION_OFFICER'],
        edit: ['PCM'],
        approve: ['PCM'],
        reject: ['PCM']
      },
      '3': {
        view: ['COORDINATOR', 'ACTION_OFFICER', 'PCM'],
        edit: ['COORDINATOR'],
        distribute: ['COORDINATOR']
      },
      '3.5': {
        view: ['SUB_REVIEWER', 'OPR', 'COORDINATOR', 'ACTION_OFFICER'],
        edit: ['SUB_REVIEWER', 'OPR'],
        review: ['SUB_REVIEWER', 'OPR']
      },
      '4': {
        view: ['ACTION_OFFICER', 'PCM'],
        edit: ['ACTION_OFFICER']
      },
      '5': {
        view: ['COORDINATOR', 'ACTION_OFFICER', 'PCM'],
        edit: ['COORDINATOR'],
        distribute: ['COORDINATOR']
      },
      '5.5': {
        view: ['SUB_REVIEWER', 'OPR', 'COORDINATOR', 'ACTION_OFFICER', 'LEADERSHIP'],
        edit: ['SUB_REVIEWER', 'OPR', 'LEADERSHIP'],
        review: ['SUB_REVIEWER', 'OPR', 'LEADERSHIP']
      },
      '6': {
        view: ['ACTION_OFFICER', 'PCM'],
        edit: ['ACTION_OFFICER']
      },
      '7': {
        view: ['LEGAL', 'ACTION_OFFICER', 'PCM'],
        edit: ['LEGAL'],
        approve: ['LEGAL'],
        reject: ['LEGAL']
      },
      '8': {
        view: ['ACTION_OFFICER', 'PCM', 'OPR', 'LEADERSHIP'],
        edit: ['ACTION_OFFICER', 'OPR', 'LEADERSHIP']
      },
      '9': {
        view: ['LEADERSHIP', 'ACTION_OFFICER', 'PCM'],
        edit: ['LEADERSHIP'],
        approve: ['LEADERSHIP'],
        reject: ['LEADERSHIP']
      },
      '10': {
        view: ['PCM', 'ACTION_OFFICER'],
        edit: ['PCM'],
        approve: ['PCM'],
        reject: ['PCM']
      },
      '11': {
        view: ['AFDPO', 'PCM', 'ACTION_OFFICER'],
        edit: ['AFDPO'],
        publish: ['AFDPO'],
        archive: ['AFDPO']
      }
    }
  };

  // Get all stages
  getStages(): IWorkflowStage[] {
    return this.config.stages;
  }

  // Validate a stage transition
  async validateTransition(
    from: string,
    to: string,
    context: IWorkflowContext
  ): Promise<boolean> {
    // Find the transition rule
    const transition = this.config.transitions.find(
      t => t.from === from && t.to === to
    );

    if (!transition) {
      return false;
    }

    // Check if user has permission for this stage
    const currentStage = this.config.stages.find(s => s.id === from);
    if (currentStage && currentStage.allowedRoles) {
      const userRoles = context.user?.roles || [];
      const hasRole = userRoles.some(role => currentStage.allowedRoles.includes(role));
      if (!hasRole) {
        return false;
      }
    }

    // Additional validation logic can be added here
    return true;
  }

  // Execute a stage
  async executeStage(
    stageId: string,
    context: IWorkflowContext
  ): Promise<IStageResult> {
    const stage = this.config.stages.find(s => s.id === stageId);

    if (!stage) {
      return {
        success: false,
        errors: [`Stage ${stageId} not found`]
      };
    }

    // Execute stage logic based on type
    switch (stage.type) {
      case 'approval':
        return this.executeApprovalStage(stage, context);
      case 'parallel':
        return this.executeParallelStage(stage, context);
      case 'sequential':
        return this.executeSequentialStage(stage, context);
      default:
        return {
          success: true,
          data: {
            stageId: stage.id,
            stageName: stage.name,
            status: 'in_progress'
          }
        };
    }
  }

  private async executeApprovalStage(
    stage: IWorkflowStage,
    context: IWorkflowContext
  ): Promise<IStageResult> {
    // Implementation for approval stages
    return {
      success: true,
      data: {
        stageId: stage.id,
        stageName: stage.name,
        status: 'awaiting_approval',
        requiredApprovals: stage.requiredApprovals || 1
      }
    };
  }

  private async executeParallelStage(
    stage: IWorkflowStage,
    context: IWorkflowContext
  ): Promise<IStageResult> {
    // Implementation for parallel review stages
    return {
      success: true,
      data: {
        stageId: stage.id,
        stageName: stage.name,
        status: 'distributed',
        reviewers: context.document?.workflowState?.data?.reviewers || []
      }
    };
  }

  private async executeSequentialStage(
    stage: IWorkflowStage,
    context: IWorkflowContext
  ): Promise<IStageResult> {
    // Implementation for sequential stages
    return {
      success: true,
      data: {
        stageId: stage.id,
        stageName: stage.name,
        status: 'in_progress'
      }
    };
  }

  // Lifecycle hooks
  async onEnable(): Promise<void> {
    console.log('✅ Air Force 12-Stage Workflow enabled');
  }

  async onDisable(): Promise<void> {
    console.log('🔴 Air Force 12-Stage Workflow disabled');
  }
}