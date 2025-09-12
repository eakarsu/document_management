import { WorkflowStep, WorkflowTemplate, CustomRole } from './WorkflowTypes';

// Air Force 8-Stage Workflow - Exact replica of your existing system
export const AirForce8StageWorkflowTemplate: WorkflowTemplate = {
  id: 'af_8_stage_workflow',
  name: 'Air Force 8-Stage Document Workflow',
  description: 'Official Air Force 8-stage document approval workflow with OPR, ICU coordination, legal review, and final publishing',
  category: 'Military',
  version: '2.0',
  createdBy: 'system',
  organizationId: 'air_force',
  isActive: true,
  tags: ['air-force', 'military', 'official', 'document-approval'],
  estimatedDuration: '2-3 weeks',
  
  // Custom roles specific to Air Force workflow
  roles: [
    {
      id: 'opr_role',
      name: 'OPR',
      displayName: 'Office of Primary Responsibility',
      permissions: ['create', 'edit', 'submit', 'revise', 'finalize'],
      description: 'Primary office responsible for document creation and maintenance',
      color: '#2563eb'
    },
    {
      id: 'author_role',
      name: 'AUTHOR',
      displayName: 'Document Author',
      permissions: ['create', 'edit', 'submit', 'revise'],
      description: 'Individual responsible for writing the document',
      color: '#059669'
    },
    {
      id: 'icu_reviewer_role',
      name: 'ICU_REVIEWER',
      displayName: 'Internal Coordinating Unit Reviewer',
      permissions: ['review', 'comment', 'approve', 'reject', 'coordinate'],
      description: 'Internal coordination and review authority',
      color: '#dc2626'
    },
    {
      id: 'technical_reviewer_role',
      name: 'TECHNICAL_REVIEWER',
      displayName: 'Technical Subject Matter Expert',
      permissions: ['review', 'comment', 'approve', 'reject', 'technical_analysis'],
      description: 'Technical expert for specialized content review',
      color: '#7c3aed'
    },
    {
      id: 'legal_reviewer_role',
      name: 'LEGAL_REVIEWER',
      displayName: 'Legal Review Officer',
      permissions: ['legal_review', 'legal_approve', 'legal_reject', 'compliance_check'],
      description: 'Legal and compliance review authority',
      color: '#ea580c'
    },
    {
      id: 'publisher_role',
      name: 'AFDPO',
      displayName: 'Air Force Departmental Publishing Office',
      permissions: ['publish', 'final_approve', 'format_review', 'distribute'],
      description: 'Final publishing authority for Air Force documents',
      color: '#0891b2'
    }
  ],

  // 8-Stage workflow steps matching your existing system
  steps: [
    // Stage 1: Start - Draft Creation
    {
      id: 'stage_1_start',
      name: 'Draft Creation',
      type: 'start',
      icon: '🚀',
      roles: ['OPR', 'AUTHOR'],
      config: {
        timeLimit: 7,
        actions: ['submit_for_coordination', 'save_draft', 'edit_content'],
        isRequired: true,
        notifications: ['OPR', 'AUTHOR']
      },
      position: { x: 100, y: 100 },
      connections: ['stage_2_internal_coord']
    },

    // Stage 2: Internal Coordination (1st Coordination)
    {
      id: 'stage_2_internal_coord',
      name: 'Internal Coordination',
      type: 'parallel',
      icon: '👥',
      roles: ['ICU_REVIEWER', 'TECHNICAL_REVIEWER'],
      config: {
        timeLimit: 10,
        actions: ['approve', 'reject', 'request_changes', 'add_comments', 'coordinate'],
        allowParallel: true,
        notifications: ['ICU_REVIEWER', 'TECHNICAL_REVIEWER', 'OPR'],
        parallelBranches: ['icu_review', 'technical_review']
      },
      position: { x: 100, y: 250 },
      connections: ['stage_3_opr_revisions']
    },

    // Stage 3: OPR Revisions
    {
      id: 'stage_3_opr_revisions',
      name: 'OPR Revisions',
      type: 'review',
      icon: '📝',
      roles: ['OPR', 'AUTHOR'],
      config: {
        timeLimit: 7,
        actions: ['incorporate_feedback', 'submit_revisions', 'request_clarification'],
        isRequired: true,
        notifications: ['OPR', 'AUTHOR']
      },
      position: { x: 100, y: 400 },
      connections: ['stage_4_external_coord']
    },

    // Stage 4: External Coordination (2nd Coordination)
    {
      id: 'stage_4_external_coord',
      name: 'External Coordination',
      type: 'parallel',
      icon: '🌐',
      roles: ['TECHNICAL_REVIEWER', 'ICU_REVIEWER'],
      config: {
        timeLimit: 14,
        actions: ['final_review', 'approve', 'reject', 'request_changes'],
        allowParallel: true,
        notifications: ['TECHNICAL_REVIEWER', 'ICU_REVIEWER', 'OPR']
      },
      position: { x: 100, y: 550 },
      connections: ['stage_5_opr_final']
    },

    // Stage 5: OPR Final
    {
      id: 'stage_5_opr_final',
      name: 'OPR Final Review',
      type: 'review',
      icon: '✅',
      roles: ['OPR'],
      config: {
        timeLimit: 5,
        actions: ['final_approval', 'submit_for_legal', 'request_final_changes'],
        isRequired: true,
        notifications: ['OPR', 'LEGAL_REVIEWER']
      },
      position: { x: 100, y: 700 },
      connections: ['stage_6_legal_review']
    },

    // Stage 6: Legal Review
    {
      id: 'stage_6_legal_review',
      name: 'Legal Review',
      type: 'approval',
      icon: '⚖️',
      roles: ['LEGAL_REVIEWER'],
      config: {
        timeLimit: 10,
        actions: ['legal_approve', 'legal_reject', 'request_legal_changes', 'compliance_check'],
        isRequired: true,
        notifications: ['LEGAL_REVIEWER', 'OPR']
      },
      position: { x: 100, y: 850 },
      connections: ['stage_7_opr_legal']
    },

    // Stage 7: OPR Legal Response
    {
      id: 'stage_7_opr_legal',
      name: 'OPR Legal Response',
      type: 'review',
      icon: '📋',
      roles: ['OPR'],
      config: {
        timeLimit: 5,
        actions: ['address_legal_comments', 'submit_for_publishing', 'request_legal_clarification'],
        isRequired: true,
        notifications: ['OPR', 'AFDPO']
      },
      position: { x: 100, y: 1000 },
      connections: ['stage_8_final_publishing']
    },

    // Stage 8: Final Publishing (AFDPO)
    {
      id: 'stage_8_final_publishing',
      name: 'Final Publishing',
      type: 'approval',
      icon: '📢',
      roles: ['AFDPO'],
      config: {
        timeLimit: 7,
        actions: ['publish_document', 'format_review', 'schedule_publication', 'distribute'],
        isRequired: true,
        notifications: ['AFDPO', 'OPR', 'ALL_STAKEHOLDERS']
      },
      position: { x: 100, y: 1150 },
      connections: ['stage_9_published']
    },

    // End: Published
    {
      id: 'stage_9_published',
      name: 'Published',
      type: 'end',
      icon: '🎉',
      roles: [],
      config: {
        actions: ['archive', 'distribute', 'track_usage'],
        notifications: ['ALL_STAKEHOLDERS']
      },
      position: { x: 100, y: 1300 },
      connections: []
    }
  ]
};

// Alternative workflow paths for different scenarios
export const AirForce8StageVariants = {
  // Emergency fast-track version
  emergency: {
    ...AirForce8StageWorkflowTemplate,
    id: 'af_8_stage_emergency',
    name: 'Air Force 8-Stage Emergency Workflow',
    description: 'Expedited version with reduced time limits for urgent documents',
    steps: AirForce8StageWorkflowTemplate.steps.map(step => ({
      ...step,
      config: {
        ...step.config,
        timeLimit: step.config.timeLimit ? Math.max(1, Math.ceil(step.config.timeLimit! / 2)) : undefined
      }
    }))
  },

  // Simplified version for routine documents
  routine: {
    ...AirForce8StageWorkflowTemplate,
    id: 'af_8_stage_routine',
    name: 'Air Force 8-Stage Routine Workflow',
    description: 'Standard workflow with extended time limits for routine documents',
    steps: AirForce8StageWorkflowTemplate.steps.map(step => ({
      ...step,
      config: {
        ...step.config,
        timeLimit: step.config.timeLimit ? step.config.timeLimit * 1.5 : undefined
      }
    }))
  }
};

// Workflow transition rules (matching your existing logic)
export const AirForce8StageTransitionRules = {
  'stage_1_start': {
    nextStages: ['stage_2_internal_coord'],
    requiredActions: ['submit_for_coordination'],
    conditions: []
  },
  'stage_2_internal_coord': {
    nextStages: ['stage_3_opr_revisions'],
    requiredActions: ['approve'],
    conditions: ['all_parallel_reviews_complete']
  },
  'stage_3_opr_revisions': {
    nextStages: ['stage_4_external_coord'],
    requiredActions: ['submit_revisions'],
    conditions: []
  },
  'stage_4_external_coord': {
    nextStages: ['stage_5_opr_final'],
    requiredActions: ['approve'],
    conditions: ['all_external_coordination_complete']
  },
  'stage_5_opr_final': {
    nextStages: ['stage_6_legal_review'],
    requiredActions: ['final_approval'],
    conditions: []
  },
  'stage_6_legal_review': {
    nextStages: ['stage_7_opr_legal'],
    requiredActions: ['legal_approve'],
    conditions: []
  },
  'stage_7_opr_legal': {
    nextStages: ['stage_8_final_publishing'],
    requiredActions: ['submit_for_publishing'],
    conditions: []
  },
  'stage_8_final_publishing': {
    nextStages: ['stage_9_published'],
    requiredActions: ['publish_document'],
    conditions: []
  }
};

// Backward transition rules (matching your bidirectional workflow)
export const AirForce8StageBackwardRules = {
  'stage_2_internal_coord': ['stage_1_start'],
  'stage_3_opr_revisions': ['stage_2_internal_coord', 'stage_1_start'],
  'stage_4_external_coord': ['stage_3_opr_revisions', 'stage_2_internal_coord'],
  'stage_5_opr_final': ['stage_4_external_coord', 'stage_3_opr_revisions'],
  'stage_6_legal_review': ['stage_5_opr_final', 'stage_4_external_coord'],
  'stage_7_opr_legal': ['stage_6_legal_review', 'stage_5_opr_final'],
  'stage_8_final_publishing': ['stage_7_opr_legal', 'stage_6_legal_review']
};

export default AirForce8StageWorkflowTemplate;