import React from 'react';
import {
  Box,
  Typography,
  List,
  Card,
  Chip
} from '@mui/material';
import { DocumentTaskType } from '@/types/document-workflow-tasks';
import { WorkflowTemplate } from './types';

interface WorkflowTemplatesProps {
  onLoadTemplate: (template: WorkflowTemplate) => void;
}

export const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  onLoadTemplate
}) => {
  const templates: WorkflowTemplate[] = [
    {
      id: 'document-review',
      name: '📋 Document Review Workflow',
      description: 'Complete document processing pipeline with OCR, AI classification, review stages, approval, and digital signature.',
      category: 'Document Processing',
      tags: ['8 stages', 'AI-powered', 'Multi-review'],
      nodes: [
        { id: '1', type: 'professional', position: { x: 100, y: 200 },
          data: { label: 'Upload Document', taskType: DocumentTaskType.UPLOAD_DOCUMENT, status: 'pending', roles: [] }},
        { id: '2', type: 'professional', position: { x: 350, y: 200 },
          data: { label: 'OCR Extraction', taskType: DocumentTaskType.OCR_EXTRACTION, status: 'pending', roles: [] }},
        { id: '3', type: 'professional', position: { x: 600, y: 200 },
          data: { label: 'AI Classification', taskType: DocumentTaskType.AI_CLASSIFICATION, status: 'pending', roles: [] }},
        { id: '4', type: 'professional', position: { x: 850, y: 100 },
          data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending', roles: [] }},
        { id: '5', type: 'professional', position: { x: 850, y: 300 },
          data: { label: 'Manual Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending', roles: [] }},
        { id: '6', type: 'professional', position: { x: 1100, y: 200 },
          data: { label: 'Approval', taskType: DocumentTaskType.APPROVAL_REQUEST, status: 'pending', roles: [] }},
        { id: '7', type: 'professional', position: { x: 1350, y: 200 },
          data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending', roles: [] }},
        { id: '8', type: 'professional', position: { x: 1600, y: 200 },
          data: { label: 'Store Document', taskType: DocumentTaskType.STORE_DOCUMENT, status: 'pending', roles: [] }}
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Process' }},
        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Classify' }},
        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Legal', condition: 'type === "legal"' }},
        { id: 'e3-5', source: '3', target: '5', type: 'smart', data: { label: 'Standard' }},
        { id: 'e4-6', source: '4', target: '6', type: 'smart', data: { label: 'Submit' }},
        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Submit' }},
        { id: 'e6-7', source: '6', target: '7', type: 'smart', data: { label: 'Approved', condition: 'approved === true' }},
        { id: 'e7-8', source: '7', target: '8', type: 'smart', data: { label: 'Store' }}
      ]
    },
    {
      id: 'contract-approval',
      name: '📝 Contract Approval',
      description: 'Legal contract workflow with compliance checks, multi-level approval, and automated distribution.',
      category: 'Legal',
      tags: ['6 stages', 'Legal focus', 'Compliance'],
      nodes: [
        { id: '1', type: 'professional', position: { x: 100, y: 200 },
          data: { label: 'Create Contract', taskType: DocumentTaskType.CREATE_DOCUMENT, status: 'pending', roles: [] }},
        { id: '2', type: 'professional', position: { x: 350, y: 200 },
          data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending', requiresApproval: true, roles: [] }},
        { id: '3', type: 'professional', position: { x: 600, y: 200 },
          data: { label: 'Compliance Check', taskType: DocumentTaskType.COMPLIANCE_CHECK, status: 'pending', roles: [] }},
        { id: '4', type: 'professional', position: { x: 850, y: 200 },
          data: { label: 'Executive Approval', taskType: DocumentTaskType.MULTI_LEVEL_APPROVAL, status: 'pending', requiresApproval: true, roles: [] }},
        { id: '5', type: 'professional', position: { x: 1100, y: 200 },
          data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending', roles: [] }},
        { id: '6', type: 'professional', position: { x: 1350, y: 200 },
          data: { label: 'Send to Parties', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending', roles: [] }}
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Review' }},
        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Check' }},
        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Sign' }},
        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Distribute' }}
      ]
    },
    {
      id: 'invoice-processing',
      name: '💰 Invoice Processing',
      description: 'Automated invoice scanning, data extraction, validation, and ERP integration.',
      category: 'Financial',
      tags: ['5 stages', 'Automated', 'ERP integrated'],
      nodes: [
        { id: '1', type: 'professional', position: { x: 100, y: 200 },
          data: { label: 'Scan Invoice', taskType: DocumentTaskType.SCAN_DOCUMENT, status: 'pending', roles: [] }},
        { id: '2', type: 'professional', position: { x: 350, y: 200 },
          data: { label: 'Extract Data', taskType: DocumentTaskType.AI_EXTRACTION, status: 'pending', roles: [] }},
        { id: '3', type: 'professional', position: { x: 600, y: 200 },
          data: { label: 'Validate', taskType: DocumentTaskType.VALIDATE_FORMAT, status: 'pending', roles: [] }},
        { id: '4', type: 'professional', position: { x: 850, y: 200 },
          data: { label: 'ERP Sync', taskType: DocumentTaskType.ERP_SYNC, status: 'pending', roles: [] }},
        { id: '5', type: 'professional', position: { x: 1100, y: 200 },
          data: { label: 'Archive', taskType: DocumentTaskType.ARCHIVE_DOCUMENT, status: 'pending', roles: [] }}
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Extract' }},
        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Validate' }},
        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Sync' }},
        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Archive' }}
      ]
    },
    {
      id: 'hr-onboarding',
      name: '👥 HR Onboarding',
      description: 'Employee onboarding with document generation, multi-party signatures, and HR system integration.',
      category: 'Human Resources',
      tags: ['6 stages', 'Parallel tasks', 'HR focused'],
      nodes: [
        { id: '1', type: 'professional', position: { x: 100, y: 200 },
          data: { label: 'Generate Forms', taskType: DocumentTaskType.GENERATE_FROM_TEMPLATE, status: 'pending', roles: [] }},
        { id: '2', type: 'professional', position: { x: 350, y: 100 },
          data: { label: 'Send to Employee', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending', roles: [] }},
        { id: '3', type: 'professional', position: { x: 350, y: 300 },
          data: { label: 'Send to Manager', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending', roles: [] }},
        { id: '4', type: 'professional', position: { x: 600, y: 200 },
          data: { label: 'Collect Signatures', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending', roles: [] }},
        { id: '5', type: 'professional', position: { x: 850, y: 200 },
          data: { label: 'HR Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending', roles: [] }},
        { id: '6', type: 'professional', position: { x: 1100, y: 200 },
          data: { label: 'Store in HR System', taskType: DocumentTaskType.DATABASE_INSERT, status: 'pending', roles: [] }}
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Send' }},
        { id: 'e1-3', source: '1', target: '3', type: 'smart', data: { label: 'Notify' }},
        { id: 'e2-4', source: '2', target: '4', type: 'smart', data: { label: 'Sign' }},
        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Review' }},
        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Store' }}
      ]
    }
  ];

  return (
    <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
        Pre-built workflow templates
      </Typography>

      <List>
        {templates.map((template) => (
          <Card
            key={template.id}
            sx={{
              mb: 2,
              p: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
            onClick={() => onLoadTemplate(template)}
          >
            <Typography variant="h6" gutterBottom>
              {template.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {template.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {template.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  color={index === 0 ? 'default' : index === 1 ? 'primary' : 'secondary'}
                />
              ))}
            </Box>
          </Card>
        ))}
      </List>
    </Box>
  );
};

export default WorkflowTemplates;