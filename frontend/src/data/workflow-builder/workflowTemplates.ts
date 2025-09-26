import { WorkflowTemplate } from '../../types/workflow-builder';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'af_8_stage_workflow',
    name: 'Air Force 8-Stage Workflow',
    description: 'Official Air Force 8-stage document approval workflow with OPR, ICU coordination, legal review, and final publishing',
    category: 'Military',
    estimatedTime: '2-3 weeks',
    icon: '🇺🇸',
    nodes: [],
    edges: [],
    tags: ['military', 'air-force', '8-stage', 'official'],
    steps: [
      {
        id: 'stage_1_start',
        name: 'Draft Creation',
        type: 'start' as const,
        icon: '🚀',
        roles: ['OPR', 'AUTHOR'],
        config: { timeLimit: 7, actions: ['submit_for_coordination', 'save_draft', 'edit_content'] },
        position: { x: 100, y: 100 },
        connections: ['stage_2_internal_coord']
      },
      {
        id: 'stage_2_internal_coord',
        name: 'Internal Coordination',
        type: 'parallel' as const,
        icon: '👥',
        roles: ['ICU_REVIEWER', 'TECHNICAL_REVIEWER'],
        config: { timeLimit: 10, actions: ['approve', 'reject', 'request_changes', 'add_comments', 'coordinate'], allowParallel: true },
        position: { x: 100, y: 250 },
        connections: ['stage_3_opr_revisions']
      },
      {
        id: 'stage_3_opr_revisions',
        name: 'OPR Revisions',
        type: 'review' as const,
        icon: '📝',
        roles: ['OPR', 'AUTHOR'],
        config: { timeLimit: 7, actions: ['incorporate_feedback', 'submit_revisions', 'request_clarification'] },
        position: { x: 100, y: 400 },
        connections: ['stage_4_external_coord']
      },
      {
        id: 'stage_4_external_coord',
        name: 'External Coordination',
        type: 'parallel' as const,
        icon: '🌐',
        roles: ['TECHNICAL_REVIEWER', 'ICU_REVIEWER'],
        config: { timeLimit: 14, actions: ['final_review', 'approve', 'reject', 'request_changes'], allowParallel: true },
        position: { x: 100, y: 550 },
        connections: ['stage_5_opr_final']
      },
      {
        id: 'stage_5_opr_final',
        name: 'OPR Final Review',
        type: 'review' as const,
        icon: '✅',
        roles: ['OPR'],
        config: { timeLimit: 5, actions: ['final_approval', 'submit_for_legal', 'request_final_changes'] },
        position: { x: 100, y: 700 },
        connections: ['stage_6_legal_review']
      },
      {
        id: 'stage_6_legal_review',
        name: 'Legal Review',
        type: 'approval' as const,
        icon: '⚖️',
        roles: ['LEGAL_REVIEWER'],
        config: { timeLimit: 10, actions: ['legal_approve', 'legal_reject', 'request_legal_changes', 'compliance_check'] },
        position: { x: 100, y: 850 },
        connections: ['stage_7_opr_legal']
      },
      {
        id: 'stage_7_opr_legal',
        name: 'OPR Legal Response',
        type: 'review' as const,
        icon: '📋',
        roles: ['OPR'],
        config: { timeLimit: 5, actions: ['address_legal_comments', 'submit_for_publishing', 'request_legal_clarification'] },
        position: { x: 100, y: 1000 },
        connections: ['stage_8_final_publishing']
      },
      {
        id: 'stage_8_final_publishing',
        name: 'Final Publishing',
        type: 'approval' as const,
        icon: '📢',
        roles: ['AFDPO'],
        config: { timeLimit: 7, actions: ['publish_document', 'format_review', 'schedule_publication', 'distribute'] },
        position: { x: 100, y: 1150 },
        connections: ['stage_9_published']
      },
      {
        id: 'stage_9_published',
        name: 'Published',
        type: 'end' as const,
        icon: '🎉',
        roles: [],
        config: { actions: ['archive', 'distribute', 'track_usage'] },
        position: { x: 100, y: 1300 },
        connections: []
      }
    ],
    roles: ['OPR', 'AUTHOR', 'ICU_REVIEWER', 'TECHNICAL_REVIEWER', 'LEGAL_REVIEWER', 'AFDPO']
  },
  {
    id: 'simple_approval',
    name: 'Simple Approval Workflow',
    description: 'Basic document approval process',
    category: 'Basic',
    estimatedTime: '3-5 days',
    icon: '✅',
    nodes: [],
    edges: [],
    tags: ['basic', 'simple', 'approval'],
    steps: [
      {
        id: 'start_1',
        name: 'Start Workflow',
        type: 'start' as const,
        icon: '🚀',
        roles: ['AUTHOR'],
        config: {},
        position: { x: 100, y: 100 },
        connections: ['review_1']
      },
      {
        id: 'review_1',
        name: 'Manager Review',
        type: 'review' as const,
        icon: '📝',
        roles: ['MANAGER'],
        config: { timeLimit: 3, actions: ['approve', 'reject', 'request_changes'] },
        position: { x: 100, y: 250 },
        connections: ['approval_1']
      },
      {
        id: 'approval_1',
        name: 'Final Approval',
        type: 'approval' as const,
        icon: '✅',
        roles: ['APPROVER'],
        config: { timeLimit: 2, actions: ['approve', 'reject'] },
        position: { x: 100, y: 400 },
        connections: ['end_1']
      },
      {
        id: 'end_1',
        name: 'Complete',
        type: 'end' as const,
        icon: '🏁',
        roles: [],
        config: {},
        position: { x: 100, y: 550 },
        connections: []
      }
    ],
    roles: ['AUTHOR', 'MANAGER', 'APPROVER']
  },
  {
    id: 'complex_military',
    name: 'Military Document Workflow',
    description: 'Complex military document approval with legal review',
    category: 'Military',
    estimatedTime: '2-3 weeks',
    icon: '🔒',
    nodes: [],
    edges: [],
    tags: ['military', 'complex', 'legal'],
    steps: [
      {
        id: 'mil_start',
        name: 'Draft Creation',
        type: 'start' as const,
        icon: '🚀',
        roles: ['OPR', 'AUTHOR'],
        config: {},
        position: { x: 100, y: 100 },
        connections: ['mil_technical']
      },
      {
        id: 'mil_technical',
        name: 'Technical Review',
        type: 'review' as const,
        icon: '⚙️',
        roles: ['TECHNICAL_REVIEWER'],
        config: { timeLimit: 7, actions: ['approve', 'reject', 'request_changes'] },
        position: { x: 100, y: 250 },
        connections: ['mil_legal']
      },
      {
        id: 'mil_legal',
        name: 'Legal Review',
        type: 'review' as const,
        icon: '⚖️',
        roles: ['LEGAL_REVIEWER'],
        config: { timeLimit: 5, actions: ['legal_approve', 'legal_reject'] },
        position: { x: 100, y: 400 },
        connections: ['mil_command']
      },
      {
        id: 'mil_command',
        name: 'Command Approval',
        type: 'approval' as const,
        icon: '✅',
        roles: ['COMMANDER'],
        config: { timeLimit: 3, actions: ['approve', 'reject'] },
        position: { x: 100, y: 550 },
        connections: ['mil_end']
      },
      {
        id: 'mil_end',
        name: 'Published',
        type: 'end' as const,
        icon: '📢',
        roles: [],
        config: {},
        position: { x: 100, y: 700 },
        connections: []
      }
    ],
    roles: ['OPR', 'AUTHOR', 'TECHNICAL_REVIEWER', 'LEGAL_REVIEWER', 'COMMANDER']
  },
  {
    id: 'technical_review',
    name: 'Technical Document Review',
    description: 'Technical document with parallel expert reviews',
    category: 'Technical',
    estimatedTime: '1-2 weeks',
    icon: '⚙️',
    nodes: [],
    edges: [],
    tags: ['technical', 'review', 'parallel'],
    steps: [
      {
        id: 'tech_start',
        name: 'Start',
        type: 'start' as const,
        icon: '🚀',
        roles: ['AUTHOR'],
        config: {},
        position: { x: 100, y: 100 },
        connections: ['tech_parallel']
      },
      {
        id: 'tech_parallel',
        name: 'Parallel Review',
        type: 'parallel' as const,
        icon: '🔀',
        roles: ['TECHNICAL_REVIEWER', 'SUBJECT_EXPERT'],
        config: { allowParallel: true, timeLimit: 5 },
        position: { x: 100, y: 250 },
        connections: ['tech_approval']
      },
      {
        id: 'tech_approval',
        name: 'Final Approval',
        type: 'approval' as const,
        icon: '✅',
        roles: ['TECHNICAL_LEAD'],
        config: { timeLimit: 2 },
        position: { x: 100, y: 400 },
        connections: ['tech_end']
      },
      {
        id: 'tech_end',
        name: 'Complete',
        type: 'end' as const,
        icon: '🏁',
        roles: [],
        config: {},
        position: { x: 100, y: 550 },
        connections: []
      }
    ],
    roles: ['AUTHOR', 'TECHNICAL_REVIEWER', 'SUBJECT_EXPERT', 'TECHNICAL_LEAD']
  },
  {
    id: 'emergency_approval',
    name: 'Emergency Fast-Track',
    description: 'Expedited approval for urgent documents',
    category: 'Emergency',
    estimatedTime: '24-48 hours',
    icon: '⚠️',
    nodes: [],
    edges: [],
    tags: ['emergency', 'fast-track', 'urgent'],
    steps: [
      {
        id: 'emerg_start',
        name: 'Emergency Start',
        type: 'start' as const,
        icon: '🚨',
        roles: ['EMERGENCY_AUTHOR'],
        config: {},
        position: { x: 100, y: 100 },
        connections: ['emerg_review']
      },
      {
        id: 'emerg_review',
        name: 'Urgent Review',
        type: 'review' as const,
        icon: '📝',
        roles: ['EMERGENCY_REVIEWER'],
        config: { timeLimit: 0.5, actions: ['emergency_approve', 'escalate'] },
        position: { x: 100, y: 250 },
        connections: ['emerg_approval']
      },
      {
        id: 'emerg_approval',
        name: 'Emergency Approval',
        type: 'approval' as const,
        icon: '⚡',
        roles: ['DUTY_OFFICER'],
        config: { timeLimit: 1, actions: ['emergency_approve'] },
        position: { x: 100, y: 400 },
        connections: ['emerg_end']
      },
      {
        id: 'emerg_end',
        name: 'Deployed',
        type: 'end' as const,
        icon: '🎯',
        roles: [],
        config: {},
        position: { x: 100, y: 550 },
        connections: []
      }
    ],
    roles: ['EMERGENCY_AUTHOR', 'EMERGENCY_REVIEWER', 'DUTY_OFFICER']
  }
];