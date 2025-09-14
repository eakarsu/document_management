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

export class AirForce8StagePlugin implements IWorkflowPlugin {
  id = 'af-8-stage-review';
  name = 'Air Force 8-Stage Document Review';
  version = '1.0.0';
  description = 'Official U.S. Air Force document review and approval workflow with 8 comprehensive stages';
  organization = 'United States Air Force';
  author = 'AFDPO';

  config: IWorkflowConfig = {
    stages: [
      // Stage 1: OPR Draft Creation
      {
        id: 'opr_draft',
        name: 'OPR Draft Creation',
        type: 'sequential',
        order: 1,
        description: 'Office of Primary Responsibility creates initial draft',
        required: true,
        skippable: false,
        timeLimit: 168, // 7 days
        actions: [
          {
            id: 'submit_for_review',
            label: 'Submit for Review',
            type: 'custom',
            targetStage: 'internal_coordination',
            requireComment: false
          },
          {
            id: 'save_draft',
            label: 'Save Draft',
            type: 'custom',
            requireComment: false
          }
        ],
        allowedRoles: ['author', 'opr_staff', 'editor'],
        exitConditions: [
          {
            id: 'draft_complete',
            type: 'field',
            field: 'document.content',
            operator: 'exists',
            value: true,
            errorMessage: 'Document content cannot be empty'
          }
        ],
        ui: {
          icon: 'edit',
          color: '#6B7280',
          fields: [
            {
              id: 'title',
              type: 'text',
              label: 'Document Title',
              required: true
            },
            {
              id: 'classification',
              type: 'select',
              label: 'Classification',
              required: true
            }
          ]
        }
      },

      // Stage 2: Internal Coordination (ICU)
      {
        id: 'internal_coordination',
        name: 'Internal Coordination',
        type: 'parallel',
        order: 2,
        description: 'Internal stakeholders review and provide input',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: 'legal_review'
          },
          {
            id: 'request_changes',
            label: 'Request Changes',
            type: 'custom',
            targetStage: 'opr_draft',
            requireComment: true
          }
        ],
        allowedRoles: ['internal_coordinator', 'section_chief'],
        ui: {
          icon: 'people',
          color: '#3B82F6'
        }
      },

      // Stage 3: Legal Review
      {
        id: 'legal_review',
        name: 'Legal Review',
        type: 'approval',
        order: 3,
        description: 'Judge Advocate General (JAG) legal compliance review',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        actions: [
          {
            id: 'approve_legal',
            label: 'Legally Sufficient',
            type: 'approve',
            targetStage: 'o6_coordination'
          },
          {
            id: 'reject_legal',
            label: 'Legal Issues Found',
            type: 'reject',
            targetStage: 'opr_draft',
            requireComment: true,
            requireAttachment: false
          },
          {
            id: 'conditional_approve',
            label: 'Approve with Conditions',
            type: 'custom',
            targetStage: 'o6_coordination',
            requireComment: true
          }
        ],
        allowedRoles: ['legal_officer', 'jag_attorney'],
        entryConditions: [
          {
            id: 'internal_complete',
            type: 'field',
            field: 'workflow.previousStage',
            operator: 'equals',
            value: 'internal_coordination'
          }
        ],
        ui: {
          icon: 'gavel',
          color: '#7C3AED'
        }
      },

      // Stage 4: O-6/GS-15 Coordination
      {
        id: 'o6_coordination',
        name: 'O-6/GS-15 Coordination',
        type: 'approval',
        order: 4,
        description: 'Senior officer and civilian equivalent review',
        required: true,
        skippable: false,
        timeLimit: 96, // 4 days
        requiredApprovals: 2,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: 'two_letter_coordination'
          },
          {
            id: 'reject',
            label: 'Reject',
            type: 'reject',
            targetStage: 'opr_update_first',
            requireComment: true
          }
        ],
        allowedRoles: ['colonel', 'gs15', 'senior_reviewer'],
        ui: {
          icon: 'star',
          color: '#F59E0B'
        }
      },

      // Stage 5: OPR Update (First)
      {
        id: 'opr_update_first',
        name: 'OPR Update (First Round)',
        type: 'sequential',
        order: 5,
        description: 'OPR addresses feedback from initial reviews',
        required: false,
        skippable: true,
        timeLimit: 72, // 3 days
        actions: [
          {
            id: 'submit_updates',
            label: 'Submit Updates',
            type: 'custom',
            targetStage: 'two_letter_coordination'
          }
        ],
        allowedRoles: ['author', 'opr_staff'],
        ui: {
          icon: 'refresh',
          color: '#10B981'
        }
      },

      // Stage 6: Two-Letter Coordination
      {
        id: 'two_letter_coordination',
        name: 'Two-Letter Coordination',
        type: 'approval',
        order: 6,
        description: 'Two-letter general officer review',
        required: true,
        skippable: false,
        timeLimit: 120, // 5 days
        requiredApprovals: 1,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            type: 'approve',
            targetStage: 'leadership_approval'
          },
          {
            id: 'reject',
            label: 'Reject',
            type: 'reject',
            targetStage: 'opr_update_second',
            requireComment: true
          }
        ],
        allowedRoles: ['general_officer', 'two_letter_coordinator'],
        ui: {
          icon: 'military_tech',
          color: '#EF4444'
        }
      },

      // Stage 7: OPR Update (Second)
      {
        id: 'opr_update_second',
        name: 'OPR Update (Second Round)',
        type: 'sequential',
        order: 7,
        description: 'OPR addresses senior leadership feedback',
        required: false,
        skippable: true,
        timeLimit: 48, // 2 days
        actions: [
          {
            id: 'submit_final_updates',
            label: 'Submit Final Updates',
            type: 'custom',
            targetStage: 'leadership_approval'
          }
        ],
        allowedRoles: ['author', 'opr_staff'],
        ui: {
          icon: 'refresh',
          color: '#10B981'
        }
      },

      // Stage 8: Leadership Approval & Publishing
      {
        id: 'leadership_approval',
        name: 'Leadership Approval & AFDPO Publishing',
        type: 'approval',
        order: 8,
        description: 'Final commander approval and AFDPO publication',
        required: true,
        skippable: false,
        timeLimit: 72, // 3 days
        actions: [
          {
            id: 'approve_publish',
            label: 'Approve and Publish',
            type: 'approve',
            targetStage: 'published'
          },
          {
            id: 'reject_final',
            label: 'Reject',
            type: 'reject',
            targetStage: 'opr_update_second',
            requireComment: true
          }
        ],
        allowedRoles: ['commander', 'afdpo_analyst', 'publications_office'],
        ui: {
          icon: 'published_with_changes',
          color: '#059669'
        }
      },

      // Final Stage: Published
      {
        id: 'published',
        name: 'Published',
        type: 'sequential',
        order: 9,
        description: 'Document is officially published',
        required: true,
        skippable: false,
        actions: [],
        allowedRoles: [],
        ui: {
          icon: 'check_circle',
          color: '#065F46'
        }
      }
    ],

    transitions: [
      // From Draft
      { id: 't1', from: 'opr_draft', to: 'internal_coordination', action: 'submit_for_review' },
      
      // From Internal Coordination
      { id: 't2', from: 'internal_coordination', to: 'legal_review', action: 'approve' },
      { id: 't3', from: 'internal_coordination', to: 'opr_draft', action: 'request_changes' },
      
      // From Legal Review
      { id: 't4', from: 'legal_review', to: 'o6_coordination', action: 'approve_legal' },
      { id: 't5', from: 'legal_review', to: 'o6_coordination', action: 'conditional_approve' },
      { id: 't6', from: 'legal_review', to: 'opr_draft', action: 'reject_legal' },
      
      // From O-6 Coordination
      { id: 't7', from: 'o6_coordination', to: 'two_letter_coordination', action: 'approve' },
      { id: 't8', from: 'o6_coordination', to: 'opr_update_first', action: 'reject' },
      
      // From OPR Update First
      { id: 't9', from: 'opr_update_first', to: 'two_letter_coordination', action: 'submit_updates' },
      
      // From Two-Letter Coordination
      { id: 't10', from: 'two_letter_coordination', to: 'leadership_approval', action: 'approve' },
      { id: 't11', from: 'two_letter_coordination', to: 'opr_update_second', action: 'reject' },
      
      // From OPR Update Second
      { id: 't12', from: 'opr_update_second', to: 'leadership_approval', action: 'submit_final_updates' },
      
      // From Leadership Approval
      { id: 't13', from: 'leadership_approval', to: 'published', action: 'approve_publish' },
      { id: 't14', from: 'leadership_approval', to: 'opr_update_second', action: 'reject_final' }
    ],

    permissions: {
      'opr_draft': {
        view: ['author', 'opr_staff', 'editor', 'admin'],
        edit: ['author', 'opr_staff', 'editor'],
        submit_for_review: ['author', 'opr_staff']
      },
      'internal_coordination': {
        view: ['all'],
        edit: ['internal_coordinator', 'section_chief'],
        approve: ['internal_coordinator', 'section_chief'],
        request_changes: ['internal_coordinator', 'section_chief']
      },
      'legal_review': {
        view: ['all'],
        edit: ['legal_officer', 'jag_attorney'],
        approve_legal: ['legal_officer', 'jag_attorney'],
        reject_legal: ['legal_officer', 'jag_attorney'],
        conditional_approve: ['legal_officer', 'jag_attorney']
      },
      'o6_coordination': {
        view: ['all'],
        edit: ['colonel', 'gs15'],
        approve: ['colonel', 'gs15'],
        reject: ['colonel', 'gs15']
      },
      'opr_update_first': {
        view: ['all'],
        edit: ['author', 'opr_staff'],
        submit_updates: ['author', 'opr_staff']
      },
      'two_letter_coordination': {
        view: ['all'],
        edit: ['general_officer', 'two_letter_coordinator'],
        approve: ['general_officer', 'two_letter_coordinator'],
        reject: ['general_officer', 'two_letter_coordinator']
      },
      'opr_update_second': {
        view: ['all'],
        edit: ['author', 'opr_staff'],
        submit_final_updates: ['author', 'opr_staff']
      },
      'leadership_approval': {
        view: ['all'],
        edit: ['commander', 'afdpo_analyst'],
        approve_publish: ['commander', 'afdpo_analyst'],
        reject_final: ['commander']
      },
      'published': {
        view: ['all']
      }
    },

    notifications: [
      {
        id: 'n1',
        trigger: 'stage_enter',
        stage: 'internal_coordination',
        recipients: {
          type: 'role',
          value: ['internal_coordinator']
        },
        template: 'New document ready for internal coordination: {{document.title}}',
        channel: 'email'
      },
      {
        id: 'n2',
        trigger: 'stage_enter',
        stage: 'legal_review',
        recipients: {
          type: 'role',
          value: ['legal_officer']
        },
        template: 'Document requires legal review: {{document.title}}',
        channel: 'email'
      },
      {
        id: 'n3',
        trigger: 'deadline_approaching',
        recipients: {
          type: 'dynamic',
          value: (context) => [context.document.currentAssignee]
        },
        template: 'Action required: {{document.title}} deadline in 24 hours',
        channel: 'in_app'
      }
    ],

    businessRules: [
      {
        id: 'br1',
        name: 'Legal Review Mandatory',
        trigger: 'pre_transition',
        conditions: [
          {
            id: 'c1',
            type: 'field',
            field: 'document.type',
            operator: 'in',
            value: ['policy', 'directive', 'instruction']
          }
        ],
        actions: [
          {
            type: 'set_field',
            config: {
              field: 'workflow.requireLegalReview',
              value: true
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

  // Get all stages
  getStages(): IWorkflowStage[] {
    return this.config.stages;
  }

  // Validate transition between stages
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

    // Additional Air Force-specific validations
    if (from === 'legal_review' && to === 'o6_coordination') {
      // Ensure legal review passed
      const legalApproved = context.metadata?.legalApproval === true;
      if (!legalApproved) {
        console.error('Legal approval required before O-6 coordination');
        return false;
      }
    }

    if (to === 'published') {
      // Ensure all required signatures are collected
      const requiredSignatures = ['commander', 'afdpo_analyst'];
      const signatures = context.metadata?.signatures || [];
      const hasAllSignatures = requiredSignatures.every(sig => 
        signatures.includes(sig)
      );
      
      if (!hasAllSignatures) {
        console.error('Missing required signatures for publication');
        return false;
      }
    }

    return true;
  }

  // Execute stage-specific logic
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

    // Stage-specific logic
    switch (stageId) {
      case 'legal_review':
        return await this.executeLegalReview(context);
      
      case 'o6_coordination':
        return await this.executeO6Coordination(context);
      
      case 'two_letter_coordination':
        return await this.executeTwoLetterCoordination(context);
      
      case 'leadership_approval':
        return await this.executeLeadershipApproval(context);
      
      case 'published':
        return await this.executePublishing(context);
      
      default:
        // Generic stage execution
        return {
          success: true,
          nextStage: this.getNextStage(stageId),
          data: {
            stageCompleted: stageId,
            completedBy: context.user.id,
            completedAt: new Date()
          }
        };
    }
  }

  // Private helper methods
  private async executeLegalReview(context: IWorkflowContext): Promise<IStageResult> {
    // Check for legal compliance
    const hasLegalIssues = await this.checkLegalCompliance(context.document);
    
    if (hasLegalIssues) {
      return {
        success: false,
        errors: ['Document has legal compliance issues'],
        data: {
          legalIssues: hasLegalIssues
        }
      };
    }

    return {
      success: true,
      nextStage: 'o6_coordination',
      data: {
        legalApproval: true,
        legalReviewedBy: context.user.id,
        legalReviewDate: new Date()
      }
    };
  }

  private async executeO6Coordination(context: IWorkflowContext): Promise<IStageResult> {
    // Collect O-6 level approvals
    const approvals = context.metadata?.o6Approvals || [];
    
    if (approvals.length < 2) {
      return {
        success: false,
        warnings: [`Need ${2 - approvals.length} more O-6 level approvals`]
      };
    }

    return {
      success: true,
      nextStage: 'two_letter_coordination',
      data: {
        o6Approvals: approvals,
        o6CompletedAt: new Date()
      }
    };
  }

  private async executeTwoLetterCoordination(context: IWorkflowContext): Promise<IStageResult> {
    // Two-letter general officer review
    const generalApproval = context.metadata?.generalOfficerApproval;
    
    if (!generalApproval) {
      return {
        success: false,
        errors: ['General officer approval required']
      };
    }

    return {
      success: true,
      nextStage: 'leadership_approval',
      data: {
        twoLetterApproval: true,
        twoLetterApprovedBy: context.user.id,
        twoLetterApprovalDate: new Date()
      }
    };
  }

  private async executeLeadershipApproval(context: IWorkflowContext): Promise<IStageResult> {
    // Final commander approval
    const commanderApproval = context.metadata?.commanderApproval;
    const afdpoReady = context.metadata?.afdpoPublicationReady;
    
    if (!commanderApproval || !afdpoReady) {
      return {
        success: false,
        errors: [
          !commanderApproval ? 'Commander approval required' : '',
          !afdpoReady ? 'AFDPO publication readiness check required' : ''
        ].filter(Boolean)
      };
    }

    // Generate document number
    const documentNumber = this.generateDocumentNumber(context.document);

    return {
      success: true,
      nextStage: 'published',
      data: {
        finalApproval: true,
        documentNumber,
        approvedBy: context.user.id,
        approvalDate: new Date(),
        publicationDate: new Date()
      },
      notifications: [
        {
          recipientId: 'all',
          type: 'publication',
          subject: 'Document Published',
          body: `${context.document.title} has been officially published with document number ${documentNumber}`,
          priority: 'high'
        }
      ]
    };
  }

  private async executePublishing(context: IWorkflowContext): Promise<IStageResult> {
    // Document is published - final state
    return {
      success: true,
      data: {
        publishedAt: new Date(),
        isPublished: true,
        documentUrl: `/publications/${context.document.id}`
      }
    };
  }

  private async checkLegalCompliance(document: any): Promise<any> {
    // Simulate legal compliance check
    // In production, this would integrate with legal review systems
    return null; // No issues found
  }

  private generateDocumentNumber(document: any): string {
    // Generate Air Force document number
    // Format: AFI 36-2903 or AFMAN 10-401
    const prefix = document.type === 'instruction' ? 'AFI' : 'AFMAN';
    const series = Math.floor(Math.random() * 99) + 1;
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${prefix} ${series}-${number}`;
  }

  private getNextStage(currentStage: string): string | undefined {
    const currentIndex = this.config.stages.findIndex(s => s.id === currentStage);
    if (currentIndex === -1 || currentIndex === this.config.stages.length - 1) {
      return undefined;
    }
    return this.config.stages[currentIndex + 1].id;
  }

  // Lifecycle hooks
  async onInstall(): Promise<void> {
    console.log('Installing Air Force 8-Stage Workflow Plugin...');
    // Setup any required resources
  }

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Air Force 8-Stage Workflow Plugin...');
    // Cleanup resources
  }

  async onEnable(): Promise<void> {
    console.log('Air Force 8-Stage Workflow Plugin enabled');
  }

  async onDisable(): Promise<void> {
    console.log('Air Force 8-Stage Workflow Plugin disabled');
  }
}