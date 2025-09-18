'use client';

import React from 'react';
import {
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
  ShareIcon,
  LockClosedIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  PrinterIcon,
  ArchiveBoxIcon,
  FolderIcon,
  TagIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  VideoCameraIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  HandRaisedIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  ServerIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
  BoltIcon,
  FireIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export interface TaskTemplate {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'review' | 'notification' | 'condition' | 'parallel' | 'end' | 'custom';
  category: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  defaultRoles: string[];
  defaultActions: string[];
  config: {
    timeLimit?: number;
    isRequired?: boolean;
    allowParallel?: boolean;
    canSkip?: boolean;
  };
  industry?: string[];
}

export const DocumentManagementTasks: TaskTemplate[] = [
  // Start/End Tasks
  {
    id: 'start',
    name: 'Start Workflow',
    type: 'start',
    category: 'Flow Control',
    icon: <PlayIcon className="w-6 h-6" />,
    emoji: '🚀',
    description: 'Beginning of the workflow process',
    defaultRoles: ['AUTHOR', 'OPR', 'INITIATOR'],
    defaultActions: ['submit', 'save_draft'],
    config: { isRequired: true },
    industry: ['all']
  },
  {
    id: 'end_success',
    name: 'Successful Completion',
    type: 'end',
    category: 'Flow Control',
    icon: <CheckCircleIcon className="w-6 h-6" />,
    emoji: '✅',
    description: 'Workflow completed successfully',
    defaultRoles: [],
    defaultActions: [],
    config: { isRequired: true },
    industry: ['all']
  },
  {
    id: 'end_cancel',
    name: 'Cancelled',
    type: 'end',
    category: 'Flow Control',
    icon: <StopIcon className="w-6 h-6" />,
    emoji: '🛑',
    description: 'Workflow was cancelled',
    defaultRoles: [],
    defaultActions: [],
    config: { isRequired: false },
    industry: ['all']
  },

  // Document Review Tasks
  {
    id: 'draft_review',
    name: 'Draft Review',
    type: 'review',
    category: 'Document Review',
    icon: <DocumentTextIcon className="w-6 h-6" />,
    emoji: '📝',
    description: 'Initial document review and feedback',
    defaultRoles: ['REVIEWER', 'TECHNICAL_REVIEWER', 'SUBJECT_MATTER_EXPERT'],
    defaultActions: ['approve', 'reject', 'request_changes', 'comment'],
    config: { timeLimit: 3, allowParallel: true },
    industry: ['all']
  },
  {
    id: 'content_review',
    name: 'Content Review',
    type: 'review',
    category: 'Document Review',
    icon: <EyeIcon className="w-6 h-6" />,
    emoji: '👁️',
    description: 'Review document content for accuracy',
    defaultRoles: ['CONTENT_REVIEWER', 'EDITOR'],
    defaultActions: ['approve', 'reject', 'edit', 'comment'],
    config: { timeLimit: 2, allowParallel: false },
    industry: ['all']
  },
  {
    id: 'technical_review',
    name: 'Technical Review',
    type: 'review',
    category: 'Document Review',
    icon: <CpuChipIcon className="w-6 h-6" />,
    emoji: '⚙️',
    description: 'Technical accuracy and implementation review',
    defaultRoles: ['TECHNICAL_REVIEWER', 'ENGINEER', 'ARCHITECT'],
    defaultActions: ['approve', 'reject', 'request_technical_changes'],
    config: { timeLimit: 5, allowParallel: true },
    industry: ['technical', 'engineering', 'military']
  },

  // Approval Tasks
  {
    id: 'manager_approval',
    name: 'Manager Approval',
    type: 'approval',
    category: 'Approvals',
    icon: <CheckCircleIcon className="w-6 h-6" />,
    emoji: '✅',
    description: 'Manager or supervisor approval',
    defaultRoles: ['MANAGER', 'SUPERVISOR', 'TEAM_LEAD'],
    defaultActions: ['approve', 'reject', 'escalate'],
    config: { timeLimit: 2, isRequired: true },
    industry: ['all']
  },
  {
    id: 'executive_approval',
    name: 'Executive Approval',
    type: 'approval',
    category: 'Approvals',
    icon: <BriefcaseIcon className="w-6 h-6" />,
    emoji: '👔',
    description: 'Executive or senior leadership approval',
    defaultRoles: ['EXECUTIVE', 'CEO', 'DIRECTOR', 'GENERAL'],
    defaultActions: ['approve', 'reject', 'delegate'],
    config: { timeLimit: 7, isRequired: true },
    industry: ['corporate', 'military']
  },
  {
    id: 'legal_approval',
    name: 'Legal Approval',
    type: 'approval',
    category: 'Approvals',
    icon: <ScaleIcon className="w-6 h-6" />,
    emoji: '⚖️',
    description: 'Legal review and approval',
    defaultRoles: ['LEGAL_REVIEWER', 'COUNSEL', 'COMPLIANCE_OFFICER'],
    defaultActions: ['approve', 'reject', 'request_legal_changes'],
    config: { timeLimit: 5, isRequired: true },
    industry: ['all']
  },

  // Military-Specific Tasks
  {
    id: 'opr_review',
    name: 'OPR Review',
    type: 'review',
    category: 'Military',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    emoji: '🛡️',
    description: 'Office of Primary Responsibility review',
    defaultRoles: ['OPR', 'PRIMARY_REVIEWER'],
    defaultActions: ['approve', 'reject', 'request_opr_changes'],
    config: { timeLimit: 5, isRequired: true },
    industry: ['military']
  },
  {
    id: 'icu_coordination',
    name: 'ICU Coordination',
    type: 'review',
    category: 'Military',
    icon: <UserGroupIcon className="w-6 h-6" />,
    emoji: '👥',
    description: 'Internal Coordinating Unit review',
    defaultRoles: ['ICU_REVIEWER', 'COORDINATING_UNIT'],
    defaultActions: ['coordinate', 'provide_input', 'approve'],
    config: { timeLimit: 7, allowParallel: true },
    industry: ['military']
  },
  {
    id: 'command_approval',
    name: 'Command Approval',
    type: 'approval',
    category: 'Military',
    icon: <AcademicCapIcon className="w-6 h-6" />,
    emoji: '🎖️',
    description: 'Military command approval',
    defaultRoles: ['COMMANDER', 'COMMANDING_OFFICER'],
    defaultActions: ['approve', 'reject', 'return_to_staff'],
    config: { timeLimit: 3, isRequired: true },
    industry: ['military']
  },

  // Publishing and Distribution
  {
    id: 'publish_review',
    name: 'Publishing Review',
    type: 'review',
    category: 'Publishing',
    icon: <PrinterIcon className="w-6 h-6" />,
    emoji: '🖨️',
    description: 'Final review before publishing',
    defaultRoles: ['PUBLISHER', 'PUBLICATION_MANAGER'],
    defaultActions: ['approve_for_publishing', 'request_changes'],
    config: { timeLimit: 1, isRequired: true },
    industry: ['all']
  },
  {
    id: 'distribution',
    name: 'Distribution',
    type: 'notification',
    category: 'Publishing',
    icon: <ShareIcon className="w-6 h-6" />,
    emoji: '📤',
    description: 'Distribute document to stakeholders',
    defaultRoles: ['DISTRIBUTION_MANAGER', 'ADMIN'],
    defaultActions: ['distribute', 'schedule_distribution'],
    config: { timeLimit: 1 },
    industry: ['all']
  },
  {
    id: 'archive',
    name: 'Archive Document',
    type: 'custom',
    category: 'Document Management',
    icon: <ArchiveBoxIcon className="w-6 h-6" />,
    emoji: '📦',
    description: 'Archive completed document',
    defaultRoles: ['ARCHIVIST', 'RECORDS_MANAGER'],
    defaultActions: ['archive', 'set_retention_period'],
    config: { timeLimit: 1 },
    industry: ['all']
  },

  // Conditional and Logic Tasks
  {
    id: 'conditional_branch',
    name: 'Conditional Branch',
    type: 'condition',
    category: 'Logic',
    icon: <ArrowPathIcon className="w-6 h-6" />,
    emoji: '🔀',
    description: 'Branch workflow based on conditions',
    defaultRoles: [],
    defaultActions: [],
    config: { isRequired: false },
    industry: ['all']
  },
  {
    id: 'parallel_review',
    name: 'Parallel Review',
    type: 'parallel',
    category: 'Logic',
    icon: <UserGroupIcon className="w-6 h-6" />,
    emoji: '⚡',
    description: 'Multiple simultaneous reviews',
    defaultRoles: ['REVIEWER'],
    defaultActions: ['review', 'approve', 'reject'],
    config: { allowParallel: true },
    industry: ['all']
  },

  // Notification Tasks
  {
    id: 'email_notification',
    name: 'Email Notification',
    type: 'notification',
    category: 'Notifications',
    icon: <EnvelopeIcon className="w-6 h-6" />,
    emoji: '📧',
    description: 'Send email notification',
    defaultRoles: ['SYSTEM', 'ADMIN'],
    defaultActions: ['send_email'],
    config: { timeLimit: 0 },
    industry: ['all']
  },
  {
    id: 'urgent_notification',
    name: 'Urgent Notification',
    type: 'notification',
    category: 'Notifications',
    icon: <ExclamationTriangleIcon className="w-6 h-6" />,
    emoji: '🚨',
    description: 'Send urgent notification to stakeholders',
    defaultRoles: ['SYSTEM', 'EMERGENCY_CONTACT'],
    defaultActions: ['send_urgent_alert'],
    config: { timeLimit: 0 },
    industry: ['all']
  },

  // Quality Assurance
  {
    id: 'qa_review',
    name: 'Quality Assurance',
    type: 'review',
    category: 'Quality',
    icon: <BeakerIcon className="w-6 h-6" />,
    emoji: '🔬',
    description: 'Quality assurance review',
    defaultRoles: ['QA_REVIEWER', 'QUALITY_MANAGER'],
    defaultActions: ['approve', 'reject', 'request_qa_changes'],
    config: { timeLimit: 3, isRequired: true },
    industry: ['manufacturing', 'technical']
  },
  {
    id: 'compliance_check',
    name: 'Compliance Check',
    type: 'review',
    category: 'Quality',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    emoji: '🔒',
    description: 'Compliance and regulatory review',
    defaultRoles: ['COMPLIANCE_OFFICER', 'AUDITOR'],
    defaultActions: ['approve', 'reject', 'flag_compliance_issue'],
    config: { timeLimit: 5, isRequired: true },
    industry: ['regulated', 'financial', 'healthcare']
  },

  // Emergency and Priority Tasks
  {
    id: 'emergency_review',
    name: 'Emergency Review',
    type: 'review',
    category: 'Emergency',
    icon: <FireIcon className="w-6 h-6" />,
    emoji: '🚨',
    description: 'Emergency fast-track review',
    defaultRoles: ['EMERGENCY_REVIEWER', 'DUTY_OFFICER'],
    defaultActions: ['emergency_approve', 'escalate'],
    config: { timeLimit: 0.5, isRequired: true },
    industry: ['emergency', 'military']
  },
  {
    id: 'priority_escalation',
    name: 'Priority Escalation',
    type: 'custom',
    category: 'Emergency',
    icon: <BoltIcon className="w-6 h-6" />,
    emoji: '⚡',
    description: 'Escalate to higher authority',
    defaultRoles: ['ESCALATION_MANAGER'],
    defaultActions: ['escalate', 'priority_flag'],
    config: { timeLimit: 1 },
    industry: ['all']
  }
];

export const getTasksByCategory = (category?: string): TaskTemplate[] => {
  if (!category) return DocumentManagementTasks;
  return DocumentManagementTasks.filter(task => task.category === category);
};

export const getTasksByIndustry = (industry: string): TaskTemplate[] => {
  return DocumentManagementTasks.filter(task => 
    task.industry?.includes(industry) || task.industry?.includes('all')
  );
};

export const getTaskCategories = (): string[] => {
  const categories = new Set(DocumentManagementTasks.map(task => task.category));
  return Array.from(categories).sort();
};

export const getIndustries = (): string[] => {
  const industries = new Set();
  DocumentManagementTasks.forEach(task => {
    task.industry?.forEach(ind => {
      if (ind !== 'all') industries.add(ind);
    });
  });
  return Array.from(industries).sort() as string[];
};