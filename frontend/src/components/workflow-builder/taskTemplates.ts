import { TaskTemplate, DocumentTaskType } from './types';

export const taskTemplates: TaskTemplate[] = [
  // Flow Control Elements
  {
    id: 'start',
    name: 'Start Workflow',
    type: DocumentTaskType.START,
    icon: '🚀',
    description: 'Beginning of the workflow process',
    category: 'Flow Control'
  },
  {
    id: 'end',
    name: 'End Workflow',
    type: DocumentTaskType.END,
    icon: '🏁',
    description: 'End of workflow',
    category: 'Flow Control'
  },
  {
    id: 'decision_point',
    name: 'Decision Point',
    type: DocumentTaskType.CONDITION,
    icon: '❓',
    description: 'Conditional branching based on criteria',
    category: 'Flow Control'
  },
  {
    id: 'parallel_split',
    name: 'Parallel Split',
    type: DocumentTaskType.PARALLEL,
    icon: '🔀',
    description: 'Split workflow into parallel branches',
    category: 'Flow Control'
  },
  {
    id: 'merge_point',
    name: 'Merge Point',
    type: DocumentTaskType.PARALLEL,
    icon: '🔗',
    description: 'Merge parallel branches back together',
    category: 'Flow Control'
  },

  // Document Review Elements
  {
    id: 'draft_creation',
    name: 'Draft Creation',
    type: DocumentTaskType.START,
    icon: '📄',
    description: 'Create initial document draft',
    category: 'Document Review'
  },
  {
    id: 'content_review',
    name: 'Content Review',
    type: DocumentTaskType.REVIEW,
    icon: '📝',
    description: 'Review document content and structure',
    category: 'Document Review'
  },
  {
    id: 'technical_review',
    name: 'Technical Review',
    type: DocumentTaskType.REVIEW,
    icon: '⚙️',
    description: 'Technical accuracy and compliance review',
    category: 'Document Review'
  },
  {
    id: 'peer_review',
    name: 'Peer Review',
    type: DocumentTaskType.PARALLEL,
    icon: '👥',
    description: 'Multiple peer reviewers evaluate document',
    category: 'Document Review'
  },
  {
    id: 'formatting_review',
    name: 'Format Review',
    type: DocumentTaskType.REVIEW,
    icon: '📐',
    description: 'Check formatting and style compliance',
    category: 'Document Review'
  },
  {
    id: 'revision_cycle',
    name: 'Revision Cycle',
    type: DocumentTaskType.REVIEW,
    icon: '🔄',
    description: 'Iterative revision and improvement',
    category: 'Document Review'
  },

  // Approval Elements
  {
    id: 'manager_approval',
    name: 'Manager Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '👔',
    description: 'Managerial approval required',
    category: 'Approvals'
  },
  {
    id: 'executive_approval',
    name: 'Executive Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '🏢',
    description: 'Executive level approval',
    category: 'Approvals'
  },
  {
    id: 'legal_approval',
    name: 'Legal Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '⚖️',
    description: 'Legal compliance and approval',
    category: 'Approvals'
  },
  {
    id: 'financial_approval',
    name: 'Financial Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '💰',
    description: 'Financial impact assessment and approval',
    category: 'Approvals'
  },
  {
    id: 'security_approval',
    name: 'Security Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '🔒',
    description: 'Security clearance and approval',
    category: 'Approvals'
  },
  {
    id: 'quality_approval',
    name: 'Quality Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '✅',
    description: 'Quality assurance approval',
    category: 'Approvals'
  },

  // Military/Government Specific
  {
    id: 'opr_coordination',
    name: 'OPR Coordination',
    type: DocumentTaskType.REVIEW,
    icon: '🎖️',
    description: 'Office of Primary Responsibility coordination',
    category: 'Military'
  },
  {
    id: 'icu_review',
    name: 'ICU Review',
    type: DocumentTaskType.PARALLEL,
    icon: '🏛️',
    description: 'Internal Coordinating Unit review',
    category: 'Military'
  },
  {
    id: 'command_approval',
    name: 'Command Approval',
    type: DocumentTaskType.APPROVAL,
    icon: '⭐',
    description: 'Command level approval',
    category: 'Military'
  },
  {
    id: 'afdpo_publishing',
    name: 'AFDPO Publishing',
    type: DocumentTaskType.APPROVAL,
    icon: '📢',
    description: 'Air Force Departmental Publishing Office',
    category: 'Military'
  },
  {
    id: 'classification_review',
    name: 'Classification Review',
    type: DocumentTaskType.REVIEW,
    icon: '🔐',
    description: 'Document classification assessment',
    category: 'Military'
  },

  // Notification Elements
  {
    id: 'email_notification',
    name: 'Email Notification',
    type: DocumentTaskType.NOTIFICATION,
    icon: '📧',
    description: 'Send email notification',
    category: 'Notifications'
  },
  {
    id: 'team_notification',
    name: 'Team Notification',
    type: DocumentTaskType.NOTIFICATION,
    icon: '👨‍👩‍👧‍👦',
    description: 'Notify entire team',
    category: 'Notifications'
  },
  {
    id: 'stakeholder_alert',
    name: 'Stakeholder Alert',
    type: DocumentTaskType.NOTIFICATION,
    icon: '🚨',
    description: 'Alert key stakeholders',
    category: 'Notifications'
  },
  {
    id: 'status_update',
    name: 'Status Update',
    type: DocumentTaskType.NOTIFICATION,
    icon: '📊',
    description: 'Send status update notification',
    category: 'Notifications'
  },

  // Specialized Elements
  {
    id: 'emergency_review',
    name: 'Emergency Review',
    type: DocumentTaskType.REVIEW,
    icon: '🚨',
    description: 'Urgent emergency review process',
    category: 'Emergency'
  },
  {
    id: 'fast_track',
    name: 'Fast Track',
    type: DocumentTaskType.APPROVAL,
    icon: '⚡',
    description: 'Expedited approval process',
    category: 'Emergency'
  },
  {
    id: 'escalation',
    name: 'Escalation',
    type: DocumentTaskType.CONDITION,
    icon: '📈',
    description: 'Escalate to higher authority',
    category: 'Emergency'
  },
  {
    id: 'archive',
    name: 'Archive Document',
    type: DocumentTaskType.END,
    icon: '📁',
    description: 'Archive completed document',
    category: 'Administration'
  },
  {
    id: 'publish',
    name: 'Publish Document',
    type: DocumentTaskType.END,
    icon: '🌐',
    description: 'Publish document publicly',
    category: 'Administration'
  },
  {
    id: 'distribute',
    name: 'Distribute',
    type: DocumentTaskType.NOTIFICATION,
    icon: '📤',
    description: 'Distribute to stakeholders',
    category: 'Administration'
  },

  // Data & Integration Tasks
  {
    id: 'data_validation',
    name: 'Data Validation',
    type: DocumentTaskType.REVIEW,
    icon: '🔍',
    description: 'Validate data accuracy and completeness',
    category: 'Data Processing'
  },
  {
    id: 'api_integration',
    name: 'API Integration',
    type: DocumentTaskType.PARALLEL,
    icon: '🔌',
    description: 'Integrate with external systems',
    category: 'Data Processing'
  },
  {
    id: 'data_export',
    name: 'Data Export',
    type: DocumentTaskType.NOTIFICATION,
    icon: '📤',
    description: 'Export data to external format',
    category: 'Data Processing'
  },
  {
    id: 'batch_processing',
    name: 'Batch Processing',
    type: DocumentTaskType.PARALLEL,
    icon: '⚡',
    description: 'Process multiple items in batch',
    category: 'Data Processing'
  },

  // Collaboration Tasks
  {
    id: 'team_meeting',
    name: 'Team Meeting',
    type: DocumentTaskType.PARALLEL,
    icon: '👥',
    description: 'Schedule team synchronization meeting',
    category: 'Collaboration'
  },
  {
    id: 'feedback_collection',
    name: 'Feedback Collection',
    type: DocumentTaskType.PARALLEL,
    icon: '💬',
    description: 'Collect feedback from multiple stakeholders',
    category: 'Collaboration'
  },
  {
    id: 'voting_round',
    name: 'Voting Round',
    type: DocumentTaskType.PARALLEL,
    icon: '🗳️',
    description: 'Conduct voting or polling',
    category: 'Collaboration'
  },

  // Quality & Testing
  {
    id: 'quality_check',
    name: 'Quality Check',
    type: DocumentTaskType.REVIEW,
    icon: '✔️',
    description: 'Comprehensive quality assurance',
    category: 'Quality Assurance'
  },
  {
    id: 'user_acceptance',
    name: 'User Acceptance Testing',
    type: DocumentTaskType.APPROVAL,
    icon: '👍',
    description: 'UAT by end users',
    category: 'Quality Assurance'
  },
  {
    id: 'security_scan',
    name: 'Security Scan',
    type: DocumentTaskType.REVIEW,
    icon: '🛡️',
    description: 'Security vulnerability scanning',
    category: 'Quality Assurance'
  },

  // Automation & AI Tasks
  {
    id: 'ai_analysis',
    name: 'AI Analysis',
    type: DocumentTaskType.REVIEW,
    icon: '🤖',
    description: 'AI-powered content analysis',
    category: 'Automation'
  },
  {
    id: 'automated_check',
    name: 'Automated Check',
    type: DocumentTaskType.CONDITION,
    icon: '⚙️',
    description: 'Automated validation and checks',
    category: 'Automation'
  },
  {
    id: 'scheduled_task',
    name: 'Scheduled Task',
    type: DocumentTaskType.NOTIFICATION,
    icon: '⏰',
    description: 'Time-based scheduled execution',
    category: 'Automation'
  },

  // Compliance & Audit
  {
    id: 'compliance_check',
    name: 'Compliance Check',
    type: DocumentTaskType.REVIEW,
    icon: '📑',
    description: 'Verify regulatory compliance',
    category: 'Compliance'
  },
  {
    id: 'risk_assessment',
    name: 'Risk Assessment',
    type: DocumentTaskType.REVIEW,
    icon: '⚠️',
    description: 'Assess and document risks',
    category: 'Compliance'
  },
  {
    id: 'audit_trail',
    name: 'Audit Trail',
    type: DocumentTaskType.NOTIFICATION,
    icon: '📜',
    description: 'Generate audit trail documentation',
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

export const getTasksByCategory = (category: string) => {
  return taskTemplates.filter(task => task.category === category);
};