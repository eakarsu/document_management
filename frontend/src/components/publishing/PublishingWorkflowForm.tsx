'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add, Delete, ExpandMore, Schedule, Group, Settings } from '@mui/icons-material';
import { api } from '@/lib/api';

interface ApprovalStep {
  stepNumber: number;
  stepName: string;
  description: string;
  isRequired: boolean;
  timeoutHours: number;
  requiredRole?: string;
  minApprovals: number;
  allowDelegation: boolean;
  requiredUsers: string[];
}

interface PublishingWorkflowFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (workflow: any) => void;
  editingWorkflow?: any;
}

const WORKFLOW_TYPES = [
  { value: 'DOCUMENT_APPROVAL', label: 'Document Approval' },
  { value: 'EMERGENCY_PUBLISH', label: 'Emergency Publishing' },
  { value: 'SCHEDULED_PUBLISH', label: 'Scheduled Publishing' },
  { value: 'COLLABORATIVE_REVIEW', label: 'Collaborative Review' },
  { value: 'COMPLIANCE_REVIEW', label: 'Compliance Review' }
];

export default function PublishingWorkflowForm({
  open,
  onClose,
  onSubmit,
  editingWorkflow
}: PublishingWorkflowFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workflowType: 'DOCUMENT_APPROVAL',
    autoApprove: false,
    requiredApprovers: 1,
    allowParallel: false,
    timeoutHours: 72,
    templateId: ''
  });

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([
    {
      stepNumber: 1,
      stepName: 'Initial Review',
      description: 'First level approval',
      isRequired: true,
      timeoutHours: 24,
      minApprovals: 1,
      allowDelegation: true,
      requiredUsers: []
    }
  ]);

  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplates();
      loadUsers();
      
      if (editingWorkflow) {
        setFormData({
          name: editingWorkflow.name,
          description: editingWorkflow.description || '',
          workflowType: editingWorkflow.workflowType,
          autoApprove: editingWorkflow.autoApprove,
          requiredApprovers: editingWorkflow.requiredApprovers,
          allowParallel: editingWorkflow.allowParallel,
          timeoutHours: editingWorkflow.timeoutHours,
          templateId: editingWorkflow.templateId || ''
        });
        
        if (editingWorkflow.approvalSteps) {
          setApprovalSteps(editingWorkflow.approvalSteps);
        }
      }
    }
  }, [open, editingWorkflow]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/publishing/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // This would need to be implemented in your API
      // const response = await api.get('/api/users');
      // setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (stepIndex: number, field: string, value: any) => {
    setApprovalSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, [field]: value } : step
    ));
  };

  const addApprovalStep = () => {
    const newStep: ApprovalStep = {
      stepNumber: approvalSteps.length + 1,
      stepName: `Approval Step ${approvalSteps.length + 1}`,
      description: '',
      isRequired: true,
      timeoutHours: 24,
      minApprovals: 1,
      allowDelegation: true,
      requiredUsers: []
    };
    setApprovalSteps(prev => [...prev, newStep]);
  };

  const removeApprovalStep = (stepIndex: number) => {
    setApprovalSteps(prev => {
      const newSteps = prev.filter((_, index) => index !== stepIndex);
      return newSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }));
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const workflowData = {
        ...formData,
        approvalSteps: approvalSteps.map(step => ({
          ...step,
          requiredUsers: step.requiredUsers
        }))
      };

      await onSubmit(workflowData);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      workflowType: 'DOCUMENT_APPROVAL',
      autoApprove: false,
      requiredApprovers: 1,
      allowParallel: false,
      timeoutHours: 72,
      templateId: ''
    });
    setApprovalSteps([
      {
        stepNumber: 1,
        stepName: 'Initial Review',
        description: 'First level approval',
        isRequired: true,
        timeoutHours: 24,
        minApprovals: 1,
        allowDelegation: true,
        requiredUsers: []
      }
    ]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        {editingWorkflow ? 'Edit Publishing Workflow' : 'Create Publishing Workflow'}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Workflow Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Workflow Type</InputLabel>
                <Select
                  value={formData.workflowType}
                  onChange={(e) => handleFormChange('workflowType', e.target.value)}
                  label="Workflow Type"
                >
                  {WORKFLOW_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Workflow Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Workflow Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Required Approvers"
                value={formData.requiredApprovers}
                onChange={(e) => handleFormChange('requiredApprovers', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout Hours"
                value={formData.timeoutHours}
                onChange={(e) => handleFormChange('timeoutHours', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.autoApprove}
                    onChange={(e) => handleFormChange('autoApprove', e.target.checked)}
                  />
                }
                label="Auto-approve documents"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allowParallel}
                    onChange={(e) => handleFormChange('allowParallel', e.target.checked)}
                  />
                }
                label="Allow parallel approvals"
              />
            </Grid>
            {templates.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Publishing Template (Optional)</InputLabel>
                  <Select
                    value={formData.templateId}
                    onChange={(e) => handleFormChange('templateId', e.target.value)}
                    label="Publishing Template (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {templates.map((template: any) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Approval Steps */}
        {!formData.autoApprove && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Approval Steps
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={addApprovalStep}
                variant="outlined"
                size="small"
              >
                Add Step
              </Button>
            </Box>

            {approvalSteps.map((step, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group />
                    <Typography>
                      Step {step.stepNumber}: {step.stepName}
                    </Typography>
                    {step.isRequired && (
                      <Chip label="Required" size="small" color="primary" />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Step Name"
                        value={step.stepName}
                        onChange={(e) => handleStepChange(index, 'stepName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Timeout Hours"
                        value={step.timeoutHours}
                        onChange={(e) => handleStepChange(index, 'timeoutHours', parseInt(e.target.value))}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Minimum Approvals"
                        value={step.minApprovals}
                        onChange={(e) => handleStepChange(index, 'minApprovals', parseInt(e.target.value))}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Required Role (Optional)"
                        value={step.requiredRole || ''}
                        onChange={(e) => handleStepChange(index, 'requiredRole', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={step.isRequired}
                            onChange={(e) => handleStepChange(index, 'isRequired', e.target.checked)}
                          />
                        }
                        label="This step is required"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={step.allowDelegation}
                            onChange={(e) => handleStepChange(index, 'allowDelegation', e.target.checked)}
                          />
                        }
                        label="Allow delegation"
                      />
                    </Grid>
                    {approvalSteps.length > 1 && (
                      <Grid item xs={12}>
                        <Button
                          startIcon={<Delete />}
                          onClick={() => removeApprovalStep(index)}
                          color="error"
                          variant="outlined"
                          size="small"
                        >
                          Remove Step
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name}
        >
          {loading ? 'Creating...' : editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}