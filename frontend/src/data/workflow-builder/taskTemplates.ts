import { TaskTemplate } from '../../types/workflow-builder';

export const taskTemplates: TaskTemplate[] = [
  // Flow Control Elements
  {
    id: 'start',
    name: 'Start Workflow',
    type: 'start',
    icon: '🚀',
    description: 'Beginning of the workflow process',
    defaultRoles: ['AUTHOR', 'OPR', 'INITIATOR'],
    category: 'Flow Control',
    shortcut: 'S'
  },
  {
    id: 'end',
    name: 'End Workflow',
    type: 'end',
    icon: '🏁',
    description: 'End of workflow',
    defaultRoles: [],
    category: 'Flow Control'
  },
  {
    id: 'decision_point',
    name: 'Decision Point',
    type: 'condition',
    icon: '❓',
    description: 'Conditional branching based on criteria',
    defaultRoles: ['REVIEWER', 'DECISION_MAKER'],
    category: 'Flow Control'
  },
  {
    id: 'parallel_split',
    name: 'Parallel Split',
    type: 'parallel',
    icon: '🔀',
    description: 'Split workflow into parallel branches',
    defaultRoles: ['COORDINATOR'],
    category: 'Flow Control'
  },
  {
    id: 'merge_point',
    name: 'Merge Point',
    type: 'parallel',
    icon: '🔗',
    description: 'Merge parallel branches back together',
    defaultRoles: ['COORDINATOR'],
    category: 'Flow Control'
  },

  // Document Review Elements
  {
    id: 'draft_creation',
    name: 'Draft Creation',
    type: 'start',
    icon: '📄',
    description: 'Create initial document draft',
    defaultRoles: ['AUTHOR', 'WRITER'],
    category: 'Document Review'
  },
  {
    id: 'content_review',
    name: 'Content Review',
    type: 'review',
    icon: '📝',
    description: 'Review document content and structure',
    defaultRoles: ['CONTENT_REVIEWER', 'EDITOR'],
    category: 'Document Review'
  },
  {
    id: 'technical_review',
    name: 'Technical Review',
    type: 'review',
    icon: '⚙️',
    description: 'Technical accuracy and compliance review',
    defaultRoles: ['TECHNICAL_REVIEWER', 'SUBJECT_EXPERT'],
    category: 'Document Review'
  },
  {
    id: 'peer_review',
    name: 'Peer Review',
    type: 'parallel',
    icon: '👥',
    description: 'Multiple peer reviewers evaluate document',
    defaultRoles: ['PEER_REVIEWER'],
    category: 'Document Review'
  },
  {
    id: 'formatting_review',
    name: 'Format Review',
    type: 'review',
    icon: '📐',
    description: 'Check formatting and style compliance',
    defaultRoles: ['FORMATTER', 'STYLE_REVIEWER'],
    category: 'Document Review'
  },
  {
    id: 'revision_cycle',
    name: 'Revision Cycle',
    type: 'review',
    icon: '🔄',
    description: 'Iterative revision and improvement',
    defaultRoles: ['AUTHOR', 'REVIEWER'],
    category: 'Document Review'
  },

  // Approval Elements
  {
    id: 'manager_approval',
    name: 'Manager Approval',
    type: 'approval',
    icon: '👔',
    description: 'Managerial approval required',
    defaultRoles: ['MANAGER', 'SUPERVISOR'],
    category: 'Approvals'
  },
  {
    id: 'executive_approval',
    name: 'Executive Approval',
    type: 'approval',
    icon: '🏢',
    description: 'Executive level approval',
    defaultRoles: ['EXECUTIVE', 'CEO', 'DIRECTOR'],
    category: 'Approvals'
  },
  {
    id: 'legal_approval',
    name: 'Legal Approval',
    type: 'approval',
    icon: '⚖️',
    description: 'Legal compliance and approval',
    defaultRoles: ['LEGAL_REVIEWER', 'COMPLIANCE_OFFICER'],
    category: 'Approvals'
  },
  {
    id: 'financial_approval',
    name: 'Financial Approval',
    type: 'approval',
    icon: '💰',
    description: 'Financial impact assessment and approval',
    defaultRoles: ['FINANCE_MANAGER', 'CFO'],
    category: 'Approvals'
  },
  {
    id: 'security_approval',
    name: 'Security Approval',
    type: 'approval',
    icon: '🔒',
    description: 'Security clearance and approval',
    defaultRoles: ['SECURITY_OFFICER', 'OPSEC'],
    category: 'Approvals'
  },
  {
    id: 'quality_approval',
    name: 'Quality Approval',
    type: 'approval',
    icon: '✅',
    description: 'Quality assurance approval',
    defaultRoles: ['QA_MANAGER', 'QUALITY_REVIEWER'],
    category: 'Approvals'
  },

  // Military/Government Specific
  {
    id: 'opr_coordination',
    name: 'OPR Coordination',
    type: 'review',
    icon: '🎖️',
    description: 'Office of Primary Responsibility coordination',
    defaultRoles: ['OPR', 'COORDINATOR'],
    category: 'Military'
  },
  {
    id: 'icu_review',
    name: 'ICU Review',
    type: 'parallel',
    icon: '🏛️',
    description: 'Internal Coordinating Unit review',
    defaultRoles: ['ICU_REVIEWER', 'INTERNAL_COORD'],
    category: 'Military'
  },
  {
    id: 'command_approval',
    name: 'Command Approval',
    type: 'approval',
    icon: '⭐',
    description: 'Command level approval',
    defaultRoles: ['COMMANDER', 'COMMANDING_OFFICER'],
    category: 'Military'
  },
  {
    id: 'afdpo_publishing',
    name: 'AFDPO Publishing',
    type: 'approval',
    icon: '📢',
    description: 'Air Force Departmental Publishing Office',
    defaultRoles: ['AFDPO', 'PUBLISHER'],
    category: 'Military'
  },
  {
    id: 'classification_review',
    name: 'Classification Review',
    type: 'review',
    icon: '🔐',
    description: 'Document classification assessment',
    defaultRoles: ['CLASSIFICATION_OFFICER', 'SECURITY'],
    category: 'Military'
  },

  // Notification Elements
  {
    id: 'email_notification',
    name: 'Email Notification',
    type: 'notification',
    icon: '📧',
    description: 'Send email notification',
    defaultRoles: ['SYSTEM'],
    category: 'Notifications'
  },
  {
    id: 'team_notification',
    name: 'Team Notification',
    type: 'notification',
    icon: '👨‍👩‍👧‍👦',
    description: 'Notify entire team',
    defaultRoles: ['TEAM_LEAD'],
    category: 'Notifications'
  },
  {
    id: 'stakeholder_alert',
    name: 'Stakeholder Alert',
    type: 'notification',
    icon: '🚨',
    description: 'Alert key stakeholders',
    defaultRoles: ['STAKEHOLDER_MANAGER'],
    category: 'Notifications'
  },
  {
    id: 'status_update',
    name: 'Status Update',
    type: 'notification',
    icon: '📊',
    description: 'Send status update notification',
    defaultRoles: ['PROJECT_MANAGER'],
    category: 'Notifications'
  },

  // Specialized Elements
  {
    id: 'emergency_review',
    name: 'Emergency Review',
    type: 'review',
    icon: '🚨',
    description: 'Urgent emergency review process',
    defaultRoles: ['EMERGENCY_REVIEWER', 'DUTY_OFFICER'],
    category: 'Emergency'
  },
  {
    id: 'fast_track',
    name: 'Fast Track',
    type: 'approval',
    icon: '⚡',
    description: 'Expedited approval process',
    defaultRoles: ['FAST_TRACK_APPROVER'],
    category: 'Emergency'
  },
  {
    id: 'escalation',
    name: 'Escalation',
    type: 'condition',
    icon: '📈',
    description: 'Escalate to higher authority',
    defaultRoles: ['ESCALATION_MANAGER'],
    category: 'Emergency'
  },
  {
    id: 'archive',
    name: 'Archive Document',
    type: 'end',
    icon: '📁',
    description: 'Archive completed document',
    defaultRoles: ['ARCHIVIST', 'RECORDS_MANAGER'],
    category: 'Administration'
  },
  {
    id: 'publish',
    name: 'Publish Document',
    type: 'end',
    icon: '🌐',
    description: 'Publish document publicly',
    defaultRoles: ['PUBLISHER', 'WEB_ADMIN'],
    category: 'Administration'
  },
  {
    id: 'distribute',
    name: 'Distribute',
    type: 'notification',
    icon: '📤',
    description: 'Distribute to stakeholders',
    defaultRoles: ['DISTRIBUTION_MANAGER'],
    category: 'Administration'
  },

  // Data & Integration Tasks
  {
    id: 'data_validation',
    name: 'Data Validation',
    type: 'review',
    icon: '🔍',
    description: 'Validate data accuracy and completeness',
    defaultRoles: ['DATA_ANALYST', 'VALIDATOR'],
    category: 'Data Processing'
  },
  {
    id: 'api_integration',
    name: 'API Integration',
    type: 'parallel',
    icon: '🔌',
    description: 'Integrate with external systems',
    defaultRoles: ['SYSTEM_ADMIN', 'DEVELOPER'],
    category: 'Data Processing'
  },
  {
    id: 'data_export',
    name: 'Data Export',
    type: 'notification',
    icon: '📤',
    description: 'Export data to external format',
    defaultRoles: ['DATA_MANAGER'],
    category: 'Data Processing'
  },
  {
    id: 'batch_processing',
    name: 'Batch Processing',
    type: 'parallel',
    icon: '⚡',
    description: 'Process multiple items in batch',
    defaultRoles: ['BATCH_PROCESSOR', 'SYSTEM'],
    category: 'Data Processing'
  },

  // Collaboration Tasks
  {
    id: 'team_meeting',
    name: 'Team Meeting',
    type: 'parallel',
    icon: '👥',
    description: 'Schedule team synchronization meeting',
    defaultRoles: ['TEAM_LEAD', 'PROJECT_MANAGER'],
    category: 'Collaboration'
  },
  {
    id: 'feedback_collection',
    name: 'Feedback Collection',
    type: 'parallel',
    icon: '💬',
    description: 'Collect feedback from multiple stakeholders',
    defaultRoles: ['COORDINATOR', 'PM'],
    category: 'Collaboration'
  },
  {
    id: 'voting_round',
    name: 'Voting Round',
    type: 'parallel',
    icon: '🗳️',
    description: 'Conduct voting or polling',
    defaultRoles: ['FACILITATOR'],
    category: 'Collaboration'
  },

  // Quality & Testing
  {
    id: 'quality_check',
    name: 'Quality Check',
    type: 'review',
    icon: '✔️',
    description: 'Comprehensive quality assurance',
    defaultRoles: ['QA_MANAGER', 'QUALITY_REVIEWER'],
    category: 'Quality Assurance'
  },
  {
    id: 'user_acceptance',
    name: 'User Acceptance Testing',
    type: 'approval',
    icon: '👍',
    description: 'UAT by end users',
    defaultRoles: ['END_USER', 'UAT_COORDINATOR'],
    category: 'Quality Assurance'
  },
  {
    id: 'security_scan',
    name: 'Security Scan',
    type: 'review',
    icon: '🛡️',
    description: 'Security vulnerability scanning',
    defaultRoles: ['SECURITY_ANALYST'],
    category: 'Quality Assurance'
  },

  // Automation & AI Tasks
  {
    id: 'ai_analysis',
    name: 'AI Analysis',
    type: 'review',
    icon: '🤖',
    description: 'AI-powered content analysis',
    defaultRoles: ['AI_SYSTEM', 'DATA_SCIENTIST'],
    category: 'Automation'
  },
  {
    id: 'automated_check',
    name: 'Automated Check',
    type: 'condition',
    icon: '⚙️',
    description: 'Automated validation and checks',
    defaultRoles: ['SYSTEM', 'BOT'],
    category: 'Automation'
  },
  {
    id: 'scheduled_task',
    name: 'Scheduled Task',
    type: 'notification',
    icon: '⏰',
    description: 'Time-based scheduled execution',
    defaultRoles: ['SCHEDULER', 'SYSTEM'],
    category: 'Automation'
  },

  // Compliance & Audit
  {
    id: 'compliance_check',
    name: 'Compliance Check',
    type: 'review',
    icon: '📑',
    description: 'Verify regulatory compliance',
    defaultRoles: ['COMPLIANCE_OFFICER', 'AUDITOR'],
    category: 'Compliance'
  },
  {
    id: 'risk_assessment',
    name: 'Risk Assessment',
    type: 'review',
    icon: '⚠️',
    description: 'Assess and document risks',
    defaultRoles: ['RISK_MANAGER', 'ANALYST'],
    category: 'Compliance'
  },
  {
    id: 'audit_trail',
    name: 'Audit Trail',
    type: 'notification',
    icon: '📜',
    description: 'Generate audit trail documentation',
    defaultRoles: ['AUDITOR', 'SYSTEM'],
    category: 'Compliance'
  }
];

export const categories = [
  'Flow Control',
  'Document Review',
  'Approvals',
  'Military',
  'Notifications',
  'Emergency',
  'Administration',
  'Data Processing',
  'Collaboration',
  'Quality Assurance',
  'Automation',
  'Compliance'
];