import React from 'react';
import {
  Box,
  Typography,
  List,
  Card,
  Chip
} from '@mui/material';
import { Node, Edge } from 'reactflow';
import { DocumentTaskType } from '@/types/document-workflow-tasks';

interface TemplatesTabProps {
  onLoadTemplate: (nodes: Node[], edges: Edge[]) => void;
  onShowSuccess: (message: string) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  onLoadTemplate,
  onShowSuccess
}) => {
  const loadDocumentReviewTemplate = () => {
    const templateNodes = [
      { id: '1', type: 'professional', position: { x: 100, y: 200 },
        data: { label: 'Upload Document', taskType: DocumentTaskType.UPLOAD_DOCUMENT, status: 'pending' }},
      { id: '2', type: 'professional', position: { x: 350, y: 200 },
        data: { label: 'OCR Extraction', taskType: DocumentTaskType.OCR_EXTRACTION, status: 'pending' }},
      { id: '3', type: 'professional', position: { x: 600, y: 200 },
        data: { label: 'AI Classification', taskType: DocumentTaskType.AI_CLASSIFICATION, status: 'pending' }},
      { id: '4', type: 'professional', position: { x: 850, y: 100 },
        data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending' }},
      { id: '5', type: 'professional', position: { x: 850, y: 300 },
        data: { label: 'Manual Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending' }},
      { id: '6', type: 'professional', position: { x: 1100, y: 200 },
        data: { label: 'Approval', taskType: DocumentTaskType.APPROVAL_REQUEST, status: 'pending' }},
      { id: '7', type: 'professional', position: { x: 1350, y: 200 },
        data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
      { id: '8', type: 'professional', position: { x: 1600, y: 200 },
        data: { label: 'Store Document', taskType: DocumentTaskType.STORE_DOCUMENT, status: 'pending' }}
    ];
    const templateEdges = [
      { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Process' }},
      { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Classify' }},
      { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Legal', condition: 'type === "legal"' }},
      { id: 'e3-5', source: '3', target: '5', type: 'smart', data: { label: 'Standard' }},
      { id: 'e4-6', source: '4', target: '6', type: 'smart', data: { label: 'Submit' }},
      { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Submit' }},
      { id: 'e6-7', source: '6', target: '7', type: 'smart', data: { label: 'Approved', condition: 'approved === true' }},
      { id: 'e7-8', source: '7', target: '8', type: 'smart', data: { label: 'Store' }}
    ];
    onLoadTemplate(templateNodes, templateEdges);
    onShowSuccess('Document Review Template loaded');
  };

  const loadContractApprovalTemplate = () => {
    const templateNodes = [
      { id: '1', type: 'professional', position: { x: 100, y: 200 },
        data: { label: 'Create Contract', taskType: DocumentTaskType.CREATE_DOCUMENT, status: 'pending' }},
      { id: '2', type: 'professional', position: { x: 350, y: 200 },
        data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending', requiresApproval: true }},
      { id: '3', type: 'professional', position: { x: 600, y: 200 },
        data: { label: 'Compliance Check', taskType: DocumentTaskType.COMPLIANCE_CHECK, status: 'pending' }},
      { id: '4', type: 'professional', position: { x: 850, y: 200 },
        data: { label: 'Executive Approval', taskType: DocumentTaskType.MULTI_LEVEL_APPROVAL, status: 'pending', requiresApproval: true }},
      { id: '5', type: 'professional', position: { x: 1100, y: 200 },
        data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
      { id: '6', type: 'professional', position: { x: 1350, y: 200 },
        data: { label: 'Send to Parties', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }}
    ];
    const templateEdges = [
      { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Review' }},
      { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Check' }},
      { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
      { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Sign' }},
      { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Distribute' }}
    ];
    onLoadTemplate(templateNodes, templateEdges);
    onShowSuccess('Contract Approval Template loaded');
  };

  const loadInvoiceProcessingTemplate = () => {
    const templateNodes = [
      { id: '1', type: 'professional', position: { x: 100, y: 200 },
        data: { label: 'Scan Invoice', taskType: DocumentTaskType.SCAN_DOCUMENT, status: 'pending' }},
      { id: '2', type: 'professional', position: { x: 350, y: 200 },
        data: { label: 'Extract Data', taskType: DocumentTaskType.AI_EXTRACTION, status: 'pending' }},
      { id: '3', type: 'professional', position: { x: 600, y: 200 },
        data: { label: 'Validate', taskType: DocumentTaskType.VALIDATE_FORMAT, status: 'pending' }},
      { id: '4', type: 'professional', position: { x: 850, y: 200 },
        data: { label: 'ERP Sync', taskType: DocumentTaskType.ERP_SYNC, status: 'pending' }},
      { id: '5', type: 'professional', position: { x: 1100, y: 200 },
        data: { label: 'Archive', taskType: DocumentTaskType.ARCHIVE_DOCUMENT, status: 'pending' }}
    ];
    const templateEdges = [
      { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Extract' }},
      { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Validate' }},
      { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Sync' }},
      { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Archive' }}
    ];
    onLoadTemplate(templateNodes, templateEdges);
    onShowSuccess('Invoice Processing Template loaded');
  };

  const loadHROnboardingTemplate = () => {
    const templateNodes = [
      { id: '1', type: 'professional', position: { x: 100, y: 200 },
        data: { label: 'Generate Forms', taskType: DocumentTaskType.GENERATE_FROM_TEMPLATE, status: 'pending' }},
      { id: '2', type: 'professional', position: { x: 350, y: 100 },
        data: { label: 'Send to Employee', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }},
      { id: '3', type: 'professional', position: { x: 350, y: 300 },
        data: { label: 'Send to Manager', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }},
      { id: '4', type: 'professional', position: { x: 600, y: 200 },
        data: { label: 'Collect Signatures', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
      { id: '5', type: 'professional', position: { x: 850, y: 200 },
        data: { label: 'HR Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending' }},
      { id: '6', type: 'professional', position: { x: 1100, y: 200 },
        data: { label: 'Store in HR System', taskType: DocumentTaskType.DATABASE_INSERT, status: 'pending' }}
    ];
    const templateEdges = [
      { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Send' }},
      { id: 'e1-3', source: '1', target: '3', type: 'smart', data: { label: 'Notify' }},
      { id: 'e2-4', source: '2', target: '4', type: 'smart', data: { label: 'Sign' }},
      { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
      { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Review' }},
      { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Store' }}
    ];
    onLoadTemplate(templateNodes, templateEdges);
    onShowSuccess('HR Onboarding Template loaded');
  };

  return (
    <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
        Pre-built workflow templates
      </Typography>

      <List>
        {/* Document Review Template */}
        <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
          onClick={loadDocumentReviewTemplate}>
          <Typography variant="h6" gutterBottom>📋 Document Review Workflow</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Complete document processing pipeline with OCR, AI classification, review stages, approval, and digital signature.
          </Typography>
          <Chip label="8 stages" sx={{ mr: 1 }} />
          <Chip label="AI-powered" color="primary" sx={{ mr: 1 }} />
          <Chip label="Multi-review" color="secondary" />
        </Card>

        {/* Contract Approval Template */}
        <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
          onClick={loadContractApprovalTemplate}>
          <Typography variant="h6" gutterBottom>📝 Contract Approval</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Legal contract workflow with compliance checks, multi-level approval, and automated distribution.
          </Typography>
          <Chip label="6 stages" sx={{ mr: 1 }} />
          <Chip label="Legal focus" color="error" sx={{ mr: 1 }} />
          <Chip label="Compliance" color="warning" />
        </Card>

        {/* Invoice Processing Template */}
        <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
          onClick={loadInvoiceProcessingTemplate}>
          <Typography variant="h6" gutterBottom>💰 Invoice Processing</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Automated invoice scanning, data extraction, validation, and ERP integration.
          </Typography>
          <Chip label="5 stages" sx={{ mr: 1 }} />
          <Chip label="Automated" color="success" sx={{ mr: 1 }} />
          <Chip label="ERP integrated" color="info" />
        </Card>

        {/* HR Onboarding Template */}
        <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
          onClick={loadHROnboardingTemplate}>
          <Typography variant="h6" gutterBottom>👥 HR Onboarding</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Employee onboarding with document generation, multi-party signatures, and HR system integration.
          </Typography>
          <Chip label="6 stages" sx={{ mr: 1 }} />
          <Chip label="Parallel tasks" color="primary" sx={{ mr: 1 }} />
          <Chip label="HR focused" color="secondary" />
        </Card>
      </List>
    </Box>
  );
};