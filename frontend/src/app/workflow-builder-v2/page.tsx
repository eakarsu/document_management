'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  FormControlLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  AccountTree as WorkflowIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Notifications as NotificationIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowDownward as ArrowDownIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'review' | 'notification' | 'condition' | 'parallel' | 'end';
  icon: string;
  roles: string[];
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  roles: string[];
}

const WorkflowBuilderV2: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [openStepDialog, setOpenStepDialog] = useState(false);
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragConnectionFrom, setDragConnectionFrom] = useState<string | null>(null);
  const [dragConnectionTo, setDragConnectionTo] = useState<{ x: number; y: number } | null>(null);

  // Pre-defined task templates for document management
  const taskTemplates = [
    // Flow Control Elements
    {
      id: 'start',
      name: 'Start Workflow',
      type: 'start',
      icon: '🚀',
      description: 'Beginning of the workflow process',
      defaultRoles: ['AUTHOR', 'OPR', 'INITIATOR'],
      category: 'Flow Control'
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
    }
  ];

  // Pre-defined workflow templates
  const workflowTemplates = [
    {
      id: 'af_8_stage_workflow',
      name: 'Air Force 8-Stage Workflow',
      description: 'Official Air Force 8-stage document approval workflow with OPR, ICU coordination, legal review, and final publishing',
      category: 'Military',
      estimatedTime: '2-3 weeks',
      icon: '🇺🇸',
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

  const createNewWorkflow = () => {
    const newWorkflow: WorkflowTemplate = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: 'Custom workflow',
      category: 'Custom',
      steps: [],
      roles: []
    };
    setSelectedWorkflow(newWorkflow);
    setIsBuilderMode(true);
  };

  const addStep = (template: any, position?: { x: number; y: number }) => {
    if (!selectedWorkflow) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: template.name,
      type: template.type,
      icon: template.icon,
      roles: template.defaultRoles,
      config: {},
      position: position || { x: 100, y: selectedWorkflow.steps.length * 150 + 100 },
      connections: []
    };

    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep]
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, template: any) => {
    setDraggedTask(template);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the canvas area completely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedTask) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasPan.x) / canvasZoom;
      const y = (e.clientY - rect.top - canvasPan.y) / canvasZoom;
      
      addStep(draggedTask, { x: Math.max(50, x - 100), y: Math.max(50, y - 50) });
      setDraggedTask(null);
    }
  };

  // Node interaction handlers
  const handleNodeMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.workflow-canvas')?.getBoundingClientRect();
    
    if (canvasRect) {
      setNodeOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setSelectedNodeId(stepId);
      setIsDraggingNode(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode && selectedNodeId && selectedWorkflow) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - nodeOffset.x - canvasPan.x) / canvasZoom;
      const y = (e.clientY - rect.top - nodeOffset.y - canvasPan.y) / canvasZoom;

      setSelectedWorkflow({
        ...selectedWorkflow,
        steps: selectedWorkflow.steps.map(step =>
          step.id === selectedNodeId
            ? { ...step, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : step
        )
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingNode(false);
    setSelectedNodeId(null);
  };

  // Drag-to-connect handlers
  const handleConnectionDragStart = (e: React.MouseEvent, fromStepId: string) => {
    e.stopPropagation();
    setIsDraggingConnection(true);
    setDragConnectionFrom(fromStepId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.workflow-canvas')?.getBoundingClientRect();
    if (canvasRect) {
      setDragConnectionTo({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      });
    }
  };

  const handleConnectionDragMove = (e: React.MouseEvent) => {
    if (isDraggingConnection) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragConnectionTo({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleConnectionDragEnd = (targetStepId?: string) => {
    if (isDraggingConnection && dragConnectionFrom && targetStepId && selectedWorkflow) {
      // Only connect if it's a different node and connection doesn't already exist
      if (dragConnectionFrom !== targetStepId) {
        const sourceStep = selectedWorkflow.steps.find(s => s.id === dragConnectionFrom);
        if (sourceStep && !sourceStep.connections.includes(targetStepId)) {
          setSelectedWorkflow({
            ...selectedWorkflow,
            steps: selectedWorkflow.steps.map(step =>
              step.id === dragConnectionFrom
                ? { ...step, connections: [...step.connections, targetStepId] }
                : step
            )
          });
        }
      }
    }
    
    // Reset drag state
    setIsDraggingConnection(false);
    setDragConnectionFrom(null);
    setDragConnectionTo(null);
  };

  const deleteStep = (stepId: string) => {
    if (selectedWorkflow) {
      setSelectedWorkflow({
        ...selectedWorkflow,
        steps: selectedWorkflow.steps.filter(step => step.id !== stepId)
      });
    }
  };

  // Canvas controls
  const handleZoomIn = () => setCanvasZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setCanvasZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setCanvasZoom(1);

  const getTasksByCategory = (category: string) => {
    return taskTemplates.filter(task => task.category === category);
  };

  const categories = [
    'Flow Control', 
    'Document Review', 
    'Approvals', 
    'Military', 
    'Notifications', 
    'Emergency', 
    'Administration'
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header AppBar */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <WorkflowIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Workflow Builder v2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create custom workflows for document management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createNewWorkflow}
              sx={{ borderRadius: 2 }}
            >
              New Workflow
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 2, height: '100vh' }}>
        {!isBuilderMode ? (
          /* Workflow Gallery */
          <Box>
            {/* Quick Templates */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Start Templates
              </Typography>
              <Grid container spacing={3}>
                {workflowTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => {
                        setSelectedWorkflow(template as WorkflowTemplate);
                        setIsBuilderMode(true);
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'primary.light',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2
                          }}
                        >
                          {template.icon}
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Chip
                          icon={<ScheduleIcon />}
                          label={template.estimatedTime}
                          size="small"
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Existing Workflows */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Your Workflows
              </Typography>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <DocumentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No custom workflows created yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "New Workflow" to get started
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        ) : (
          /* Workflow Builder Interface */
          <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
            {/* Far Left Sidebar - Task Templates */}
            <Paper sx={{ 
              width: 280, 
              flexShrink: 0, 
              height: '100%',
              overflow: 'auto',
              borderRadius: '8px 0 0 8px'
            }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1rem' }}>
                  Task Templates
                </Typography>
                
                {categories.map((category) => (
                  <Accordion 
                    key={category} 
                    defaultExpanded={category === 'Flow Control'}
                    sx={{ 
                      '&:before': { display: 'none' },
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {category}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List dense sx={{ py: 0 }}>
                        {getTasksByCategory(category).map((template) => (
                          <ListItemButton
                            key={template.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, template)}
                            onClick={() => addStep(template)}
                            sx={{ 
                              borderRadius: 1, 
                              mb: 0.5,
                              py: 0.5,
                              cursor: 'grab',
                              '&:active': { cursor: 'grabbing' },
                              '&:hover': { 
                                bgcolor: 'primary.light',
                                transform: 'scale(1.01)',
                                transition: 'all 0.2s'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <Box 
                                sx={{ 
                                  fontSize: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {template.icon}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={template.name}
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                lineHeight: 1.2
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Paper>

            {/* Main Canvas - Full Width */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '0 8px 8px 0'
              }}>
                {/* Canvas Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      value={selectedWorkflow?.name || ''}
                      onChange={(e) => {
                        if (selectedWorkflow) {
                          setSelectedWorkflow({
                            ...selectedWorkflow,
                            name: e.target.value
                          });
                        }
                      }}
                      variant="outlined"
                      placeholder="Workflow Name"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '1rem', fontWeight: 600 } }}
                    />
                    
                    {/* Canvas Controls */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton onClick={handleZoomOut} size="small" title="Zoom Out">
                        <Typography variant="body2">🔍-</Typography>
                      </IconButton>
                      <IconButton onClick={handleResetZoom} size="small" title="Reset Zoom">
                        <Typography variant="body2">{Math.round(canvasZoom * 100)}%</Typography>
                      </IconButton>
                      <IconButton onClick={handleZoomIn} size="small" title="Zoom In">
                        <Typography variant="body2">🔍+</Typography>
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<PlayIcon />} size="small">
                      Test
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon />} size="small">
                      Save
                    </Button>
                  </Box>
                </Box>

                {/* Canvas Area - Visual Workflow Builder */}
                <Box
                  className="workflow-canvas"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onMouseMove={(e) => {
                    handleCanvasMouseMove(e);
                    handleConnectionDragMove(e);
                  }}
                  onMouseUp={() => {
                    handleCanvasMouseUp();
                    handleConnectionDragEnd();
                  }}
                  sx={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isDragOver ? 'primary.50' : '#f8f9fa',
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    cursor: isDraggingNode ? 'grabbing' : 'default'
                  }}
                >
                  {!selectedWorkflow || selectedWorkflow?.steps?.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1
                    }}>
                      <Box
                        sx={{
                          fontSize: '4rem',
                          color: 'text.disabled',
                          mb: 2,
                          animation: isDragOver ? 'bounce 1s infinite' : 'none',
                          '@keyframes bounce': {
                            '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                            '40%': { transform: 'translateY(-10px)' },
                            '60%': { transform: 'translateY(-5px)' }
                          }
                        }}
                      >
                        🎯
                      </Box>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        {isDragOver ? 'Drop here to add step!' : 'Drag task templates here to build your workflow'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start with a "Start Workflow" task template
                      </Typography>
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'relative',
                        transform: `scale(${canvasZoom}) translate(${canvasPan.x}px, ${canvasPan.y}px)`,
                        transformOrigin: 'top left',
                        minWidth: '2000px',
                        minHeight: '2000px'
                      }}
                    >
                      {/* Workflow Steps as Visual Nodes */}
                      {selectedWorkflow?.steps?.map((step, index) => (
                        <Card
                          key={step.id}
                          onMouseDown={(e) => handleNodeMouseDown(e, step.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDraggingNode && !isDraggingConnection) {
                              // Open step dialog for configuration
                              setSelectedStep(step);
                              setOpenStepDialog(true);
                            }
                          }}
                          onMouseUp={() => {
                            if (isDraggingConnection) {
                              handleConnectionDragEnd(step.id);
                            }
                          }}
                          sx={{
                            position: 'absolute',
                            left: step.position.x,
                            top: step.position.y,
                            width: 220,
                            cursor: isDraggingNode && selectedNodeId === step.id ? 'grabbing' : 'grab',
                            transition: isDraggingNode ? 'none' : 'all 0.2s',
                            transform: selectedNodeId === step.id ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: selectedNodeId === step.id ? 6 : 2,
                            zIndex: selectedNodeId === step.id ? 1000 : 
                                   connectionStart === step.id ? 999 : 10,
                            border: '3px solid',
                            borderColor: selectedNodeId === step.id ? 'secondary.main' :
                                       connectionStart === step.id ? 'warning.main' :
                                       step.type === 'start' ? 'success.main' : 
                                       step.type === 'end' ? 'error.main' :
                                       step.type === 'approval' ? 'warning.main' : 'primary.main',
                            '&:hover': !isDraggingNode ? {
                              transform: 'scale(1.02)',
                              boxShadow: 4
                            } : {}
                          }}
                        >
                          {/* Connection Handle - Input */}
                          {step.type !== 'start' && (
                            <Box
                              title="Drop connection here"
                              onMouseUp={() => {
                                if (isDraggingConnection) {
                                  handleConnectionDragEnd(step.id);
                                }
                              }}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: isDraggingConnection ? '#ff9800' : '#2196f3',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                zIndex: 100,
                                '&:hover': {
                                  transform: 'translateX(-50%) scale(1.3)',
                                  bgcolor: isDraggingConnection ? '#f57c00' : '#1976d2'
                                }
                              }}
                            />
                          )}

                          {/* Connection Handle - Output (Draggable) */}
                          {step.type !== 'end' && (
                            <Box
                              onMouseDown={(e) => handleConnectionDragStart(e, step.id)}
                              title="Drag to connect to another node"
                              sx={{
                                position: 'absolute',
                                bottom: -8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: dragConnectionFrom === step.id ? '#ff9800' : '#4caf50',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'grab',
                                zIndex: 100,
                                '&:hover': {
                                  transform: 'translateX(-50%) scale(1.3)',
                                  bgcolor: dragConnectionFrom === step.id ? '#f57c00' : '#388e3c'
                                },
                                '&:active': {
                                  cursor: 'grabbing'
                                }
                              }}
                            />
                          )}

                          {/* Delete Button */}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStep(step.id);
                            }}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 20,
                              height: 20,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                            size="small"
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>

                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box
                                sx={{
                                  fontSize: '1.5rem',
                                  mr: 1,
                                  p: 0.5,
                                  borderRadius: 1,
                                  bgcolor: step.type === 'start' ? 'success.light' : 
                                         step.type === 'end' ? 'error.light' :
                                         step.type === 'approval' ? 'warning.light' : 'primary.light'
                                }}
                              >
                                {step.icon}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Step {index + 1}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {step.type.toUpperCase()}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                              {step.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {step.roles.slice(0, 2).map(role => (
                                <Chip 
                                  key={role} 
                                  label={role} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: 18 }}
                                />
                              ))}
                              {step.roles.length > 2 && (
                                <Chip 
                                  label={`+${step.roles.length - 2}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: 18 }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Connection Lines between steps */}
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 1
                        }}
                      >
                        {/* Render connection lines */}
                        {selectedWorkflow?.steps?.map((step) => {
                          return step.connections.map((targetId) => {
                            const targetStep = selectedWorkflow.steps.find(s => s.id === targetId);
                            if (!targetStep) return null;
                            
                            return (
                              <line
                                key={`line-${step.id}-${targetId}`}
                                x1={step.position.x + 110}
                                y1={step.position.y + 80}
                                x2={targetStep.position.x + 110}
                                y2={targetStep.position.y + 20}
                                stroke="#1976d2"
                                strokeWidth="3"
                                markerEnd="url(#arrowhead)"
                              />
                            );
                          });
                        })}
                        
                        {/* Live connection preview while dragging */}
                        {isDraggingConnection && dragConnectionFrom && dragConnectionTo && (
                          <line
                            x1={selectedWorkflow?.steps?.find(s => s.id === dragConnectionFrom)?.position.x! + 110}
                            y1={selectedWorkflow?.steps?.find(s => s.id === dragConnectionFrom)?.position.y! + 80}
                            x2={dragConnectionTo.x / canvasZoom - canvasPan.x}
                            y2={dragConnectionTo.y / canvasZoom - canvasPan.y}
                            stroke="#ff9800"
                            strokeWidth="4"
                            strokeDasharray="8,4"
                            opacity="0.8"
                          />
                        )}
                        
                        {/* Arrow marker definition */}
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill="#1976d2"
                            />
                          </marker>
                        </defs>
                      </svg>
                      
                      {/* Drop zone indicator when dragging */}
                      {isDragOver && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            border: '3px dashed',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 999
                          }}
                        >
                          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
                            Drop to Add Step
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>

      {/* Step Configuration Dialog */}
      <Dialog 
        open={openStepDialog} 
        onClose={() => setOpenStepDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Configure Step</Typography>
            <IconButton onClick={() => setOpenStepDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStep && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Step Name"
                value={selectedStep.name}
                onChange={(e) => {
                  setSelectedStep({
                    ...selectedStep,
                    name: e.target.value
                  });
                }}
                fullWidth
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned Roles</Typography>
                {['AUTHOR', 'REVIEWER', 'APPROVER', 'LEGAL_REVIEWER'].map((role) => (
                  <FormControlLabel
                    key={role}
                    control={
                      <Checkbox
                        checked={selectedStep.roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStep({
                              ...selectedStep,
                              roles: [...selectedStep.roles, role]
                            });
                          } else {
                            setSelectedStep({
                              ...selectedStep,
                              roles: selectedStep.roles.filter(r => r !== role)
                            });
                          }
                        }}
                      />
                    }
                    label={role}
                  />
                ))}
              </Box>

              <TextField
                label="Time Limit (Days)"
                type="number"
                placeholder="Optional"
                fullWidth
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Available Actions</Typography>
                {['Approve', 'Reject', 'Request Changes', 'Comment'].map((action) => (
                  <FormControlLabel
                    key={action}
                    control={<Checkbox />}
                    label={action}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStepDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenStepDialog(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowBuilderV2;