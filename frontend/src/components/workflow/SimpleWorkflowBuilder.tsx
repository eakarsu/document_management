import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  Badge
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ArrowForward,
  ArrowBack,
  Save,
  PlayArrow,
  CheckCircle,
  Cancel,
  Person,
  Group,
  Timer,
  Email,
  Description,
  Settings,
  DragIndicator,
  ContentCopy,
  CloudDownload,
  CloudUpload,
  AutoAwesome,
  Lightbulb,
  Speed,
  Business,
  School,
  LocalHospital,
  Gavel
} from '@mui/icons-material';

interface WorkflowStage {
  id: string;
  name: string;
  type: 'start' | 'review' | 'approval' | 'decision' | 'end';
  description: string;
  assignedTo: string[];
  timeLimit?: number;
  actions: { label: string; next: string; color?: string }[];
  requireComment?: boolean;
  requireAttachment?: boolean;
  notifications?: boolean;
}

export default function SimpleWorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState('');
  const [organization, setOrganization] = useState('');
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Quick templates for different organizations
  const templates = [
    {
      id: 'simple',
      name: '✨ Simple Approval',
      icon: <Speed />,
      description: 'Basic 3-step approval process',
      color: '#4CAF50',
      stages: [
        {
          id: 'draft',
          name: 'Create Document',
          type: 'start' as const,
          description: 'Author creates the initial document',
          assignedTo: ['Author'],
          actions: [{ label: 'Submit for Review', next: 'review', color: '#2196F3' }]
        },
        {
          id: 'review',
          name: 'Manager Review',
          type: 'approval' as const,
          description: 'Manager reviews and approves',
          assignedTo: ['Manager'],
          timeLimit: 48,
          requireComment: true,
          actions: [
            { label: 'Approve', next: 'complete', color: '#4CAF50' },
            { label: 'Request Changes', next: 'draft', color: '#FF9800' }
          ]
        },
        {
          id: 'complete',
          name: 'Published',
          type: 'end' as const,
          description: 'Document is published',
          assignedTo: ['System'],
          actions: []
        }
      ]
    },
    {
      id: 'corporate',
      name: '🏢 Corporate Review',
      icon: <Business />,
      description: 'Multi-department business approval',
      color: '#2196F3',
      stages: [
        {
          id: 'draft',
          name: 'Draft Creation',
          type: 'start' as const,
          description: 'Create initial draft',
          assignedTo: ['Author'],
          actions: [{ label: 'Submit', next: 'dept', color: '#2196F3' }]
        },
        {
          id: 'dept',
          name: 'Department Review',
          type: 'review' as const,
          description: 'Department head reviews',
          assignedTo: ['Department Head'],
          timeLimit: 72,
          actions: [
            { label: 'Approve', next: 'legal', color: '#4CAF50' },
            { label: 'Reject', next: 'draft', color: '#F44336' }
          ]
        },
        {
          id: 'legal',
          name: 'Legal Review',
          type: 'approval' as const,
          description: 'Legal compliance check',
          assignedTo: ['Legal Team'],
          timeLimit: 48,
          requireComment: true,
          actions: [
            { label: 'Approve', next: 'exec', color: '#4CAF50' },
            { label: 'Reject', next: 'draft', color: '#F44336' }
          ]
        },
        {
          id: 'exec',
          name: 'Executive Approval',
          type: 'approval' as const,
          description: 'C-suite final approval',
          assignedTo: ['CEO', 'CFO'],
          timeLimit: 24,
          actions: [
            { label: 'Approve', next: 'publish', color: '#4CAF50' },
            { label: 'Reject', next: 'dept', color: '#F44336' }
          ]
        },
        {
          id: 'publish',
          name: 'Published',
          type: 'end' as const,
          description: 'Document published',
          assignedTo: ['System'],
          actions: []
        }
      ]
    },
    {
      id: 'academic',
      name: '🎓 Academic Review',
      icon: <School />,
      description: 'University document approval',
      color: '#9C27B0',
      stages: []
    },
    {
      id: 'healthcare',
      name: '🏥 Healthcare Protocol',
      icon: <LocalHospital />,
      description: 'Medical document review',
      color: '#F44336',
      stages: []
    },
    {
      id: 'legal',
      name: '⚖️ Legal Document',
      icon: <Gavel />,
      description: 'Legal document workflow',
      color: '#FF9800',
      stages: []
    }
  ];

  const roles = [
    'Author',
    'Manager',
    'Reviewer',
    'Department Head',
    'Legal Team',
    'CEO',
    'CFO',
    'HR',
    'Finance',
    'IT',
    'Admin',
    'System'
  ];

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.stages.length > 0) {
      setStages(template.stages);
      setSelectedTemplate(templateId);
      setCurrentStep(2); // Jump to customize step
    }
  };

  const addStage = () => {
    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      name: 'New Stage',
      type: 'review',
      description: 'Describe this stage',
      assignedTo: [],
      actions: [
        { label: 'Approve', next: '', color: '#4CAF50' },
        { label: 'Reject', next: '', color: '#F44336' }
      ]
    };
    setEditingStage(newStage);
    setDialogOpen(true);
  };

  const editStage = (stage: WorkflowStage) => {
    setEditingStage({ ...stage });
    setDialogOpen(true);
  };

  const deleteStage = (stageId: string) => {
    setStages(stages.filter(s => s.id !== stageId));
  };

  const saveStage = () => {
    if (editingStage) {
      const existingIndex = stages.findIndex(s => s.id === editingStage.id);
      if (existingIndex >= 0) {
        const newStages = [...stages];
        newStages[existingIndex] = editingStage;
        setStages(newStages);
      } else {
        setStages([...stages, editingStage]);
      }
      setDialogOpen(false);
      setEditingStage(null);
    }
  };

  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      organization: organization,
      config: {
        stages: stages.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          type: stage.type === 'approval' ? 'approval' : 'sequential',
          order: index + 1,
          description: stage.description,
          required: true,
          timeLimit: stage.timeLimit,
          actions: stage.actions.map(action => ({
            id: action.label.toLowerCase().replace(/\s+/g, '_'),
            label: action.label,
            targetStage: action.next
          })),
          allowedRoles: stage.assignedTo,
          ui: {
            icon: stage.type === 'start' ? 'edit' : stage.type === 'end' ? 'check_circle' : 'review',
            color: stage.type === 'start' ? '#4CAF50' : stage.type === 'end' ? '#2196F3' : '#FFC107'
          }
        })),
        transitions: stages.flatMap(stage =>
          stage.actions.map(action => ({
            from: stage.id,
            to: action.next,
            action: action.label.toLowerCase().replace(/\s+/g, '_')
          }))
        ),
        permissions: stages.reduce((acc, stage) => ({
          ...acc,
          [stage.id]: {
            view: ['all'],
            edit: stage.assignedTo,
            [stage.actions[0]?.label.toLowerCase().replace(/\s+/g, '_')]: stage.assignedTo
          }
        }), {})
      }
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}-workflow.json`;
    a.click();
  };

  const getStageIcon = (type: string) => {
    switch (type) {
      case 'start': return <PlayArrow />;
      case 'review': return <Description />;
      case 'approval': return <CheckCircle />;
      case 'decision': return <Settings />;
      case 'end': return <CheckCircle />;
      default: return <Description />;
    }
  };

  const getStageColor = (type: string) => {
    switch (type) {
      case 'start': return '#4CAF50';
      case 'review': return '#2196F3';
      case 'approval': return '#FF9800';
      case 'decision': return '#9C27B0';
      case 'end': return '#4CAF50';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🚀 Easy Workflow Builder
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create your workflow in 3 simple steps - no technical knowledge required!
        </Typography>

        <Stepper activeStep={currentStep} orientation="vertical">
          {/* Step 1: Basic Info */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Basic Information</Typography>
            </StepLabel>
            <StepContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Workflow Name"
                    placeholder="e.g., Purchase Order Approval"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    helperText="Give your workflow a descriptive name"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Organization"
                    placeholder="e.g., Marketing Department"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    helperText="Which team will use this workflow?"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={() => setCurrentStep(1)}
                    disabled={!workflowName || !organization}
                  >
                    Next: Choose Template
                  </Button>
                </Grid>
              </Grid>
            </StepContent>
          </Step>

          {/* Step 2: Choose Template */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Choose a Starting Template</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a template that matches your needs. You can customize it in the next step.
              </Typography>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedTemplate === template.id ? '2px solid' : '1px solid #ddd',
                        borderColor: selectedTemplate === template.id ? template.color : '#ddd',
                        '&:hover': {
                          boxShadow: 3
                        }
                      }}
                      onClick={() => loadTemplate(template.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ color: template.color, mr: 1 }}>
                            {template.icon}
                          </Box>
                          <Typography variant="h6">
                            {template.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        {template.stages.length > 0 && (
                          <Chip 
                            label={`${template.stages.length} stages`}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: '2px dashed #ddd',
                      '&:hover': {
                        borderColor: '#2196F3',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                    onClick={() => {
                      setStages([]);
                      setCurrentStep(2);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Add sx={{ fontSize: 40, color: '#757575' }} />
                      <Typography variant="h6" color="text.secondary">
                        Start from Scratch
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Build your own custom workflow
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={() => setCurrentStep(0)} sx={{ mr: 1 }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setCurrentStep(2)}
                  disabled={stages.length === 0}
                >
                  Next: Customize Workflow
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Customize */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Customize Your Workflow</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addStage}
                  sx={{ mr: 1 }}
                >
                  Add Stage
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  sx={{ mr: 1 }}
                >
                  AI Suggest
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </Box>

              {/* Workflow Stages */}
              <Grid container spacing={2}>
                {stages.map((stage, index) => (
                  <Grid item xs={12} key={stage.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Badge badgeContent={index + 1} color="primary" sx={{ mr: 2 }}>
                            <Box sx={{ color: getStageColor(stage.type) }}>
                              {getStageIcon(stage.type)}
                            </Box>
                          </Badge>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">{stage.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stage.description}
                            </Typography>
                          </Box>
                          <IconButton onClick={() => editStage(stage)}>
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => deleteStage(stage.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {stage.assignedTo.map((role) => (
                            <Chip
                              key={role}
                              label={role}
                              size="small"
                              icon={<Person />}
                            />
                          ))}
                          {stage.timeLimit && (
                            <Chip
                              label={`${stage.timeLimit}h limit`}
                              size="small"
                              icon={<Timer />}
                              color="warning"
                            />
                          )}
                        </Box>

                        {stage.actions.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {stage.actions.map((action, i) => (
                              <Chip
                                key={i}
                                label={action.label}
                                size="small"
                                sx={{ 
                                  backgroundColor: action.color || '#ddd',
                                  color: '#fff'
                                }}
                                onDelete={undefined}
                                deleteIcon={<ArrowForward sx={{ color: '#fff !important' }} />}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button onClick={() => setCurrentStep(1)} sx={{ mr: 1 }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={exportWorkflow}
                  disabled={stages.length === 0}
                >
                  Export Workflow
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      {/* Stage Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStage?.id.startsWith('stage-') ? 'Add New Stage' : 'Edit Stage'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stage Name"
                value={editingStage?.name || ''}
                onChange={(e) => setEditingStage({ ...editingStage!, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Stage Type</InputLabel>
                <Select
                  value={editingStage?.type || 'review'}
                  onChange={(e) => setEditingStage({ ...editingStage!, type: e.target.value as any })}
                >
                  <MenuItem value="start">Start (Initial Stage)</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="approval">Approval Required</MenuItem>
                  <MenuItem value="decision">Decision Point</MenuItem>
                  <MenuItem value="end">End (Final Stage)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={editingStage?.description || ''}
                onChange={(e) => setEditingStage({ ...editingStage!, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  multiple
                  value={editingStage?.assignedTo || []}
                  onChange={(e) => setEditingStage({ ...editingStage!, assignedTo: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Limit (hours)"
                type="number"
                value={editingStage?.timeLimit || ''}
                onChange={(e) => setEditingStage({ ...editingStage!, timeLimit: parseInt(e.target.value) })}
                helperText="Leave empty for no time limit"
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingStage?.requireComment || false}
                      onChange={(e) => setEditingStage({ ...editingStage!, requireComment: e.target.checked })}
                    />
                  }
                  label="Require comment when taking action"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingStage?.requireAttachment || false}
                      onChange={(e) => setEditingStage({ ...editingStage!, requireAttachment: e.target.checked })}
                    />
                  }
                  label="Require attachment"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingStage?.notifications || false}
                      onChange={(e) => setEditingStage({ ...editingStage!, notifications: e.target.checked })}
                    />
                  }
                  label="Send email notifications"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveStage}>Save Stage</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Help Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {}}
      >
        <Lightbulb />
      </Fab>
    </Box>
  );
}