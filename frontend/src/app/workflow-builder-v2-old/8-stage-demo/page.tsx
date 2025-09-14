'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  AppBar,
  Toolbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Group as UserGroupIcon,
  Description as DocumentTextIcon,
  ArrowForward as ArrowRightIcon,
  ArrowDownward as ArrowDownIcon,
  Speed as SpeedIcon,
  Security as ShieldIcon,
  ExpandMore as ExpandMoreIcon,
  RestartAlt as RestartIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import AirForce8StageTemplate from '../../../components/workflow-v2/AirForce8StageTemplate';
import { WorkflowTemplate, WorkflowStep } from '../../../components/workflow-v2/WorkflowTypes';

const AirForce8StageDemo: React.FC = () => {
  const [workflow, setWorkflow] = useState<WorkflowTemplate>(AirForce8StageTemplate);
  const [currentStep, setCurrentStep] = useState<string>('stage_1_start');
  const [isRunning, setIsRunning] = useState(false);
  const [stepHistory, setStepHistory] = useState<any[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);

  const getCurrentStepData = () => {
    return workflow.steps.find(step => step.id === currentStep);
  };

  const getStepStatus = (stepId: string) => {
    const historyIndex = stepHistory.findIndex(h => h.stepId === stepId);
    if (historyIndex >= 0) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (step: WorkflowStep) => {
    const status = getStepStatus(step.id);
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'active':
        return <PlayIcon color="primary" />;
      default:
        return <ClockIcon color="disabled" />;
    }
  };

  const simulateAdvance = () => {
    const currentStepData = getCurrentStepData();
    if (!currentStepData) return;

    // Add current step to history
    setStepHistory(prev => [...prev, {
      stepId: currentStep,
      stepName: currentStepData.name,
      timestamp: new Date(),
      action: 'completed',
      userId: 'demo_user',
      userRole: currentStepData.roles[0] || 'USER'
    }]);

    // Move to next step
    if (currentStepData.connections.length > 0) {
      setCurrentStep(currentStepData.connections[0]);
    } else {
      setIsRunning(false);
    }
  };

  const startSimulation = () => {
    setIsRunning(true);
    setStepHistory([]);
    setCurrentStep('stage_1_start');
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setStepHistory([]);
    setCurrentStep('stage_1_start');
  };

  const jumpToStep = (stepId: string) => {
    if (!isRunning) {
      setCurrentStep(stepId);
    }
  };

  useEffect(() => {
    if (isRunning) {
      const timer = setTimeout(simulateAdvance, simulationSpeed);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isRunning]);

  const currentStepData = getCurrentStepData();
  const completedSteps = stepHistory.length;
  const totalSteps = workflow.steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header AppBar */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <ShieldIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Air Force 8-Stage Workflow Demo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive demonstration of the Air Force document approval workflow
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
              onClick={startSimulation}
              disabled={isRunning}
              sx={{ borderRadius: 2 }}
            >
              {isRunning ? 'Running...' : 'Start Simulation'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestartIcon />}
              onClick={resetSimulation}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Progress Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Workflow Progress
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Speed</InputLabel>
                <Select
                  value={simulationSpeed}
                  label="Speed"
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                >
                  <MenuItem value={500}>Fast</MenuItem>
                  <MenuItem value={1000}>Normal</MenuItem>
                  <MenuItem value={2000}>Slow</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {completedSteps}/{totalSteps} Steps
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                    {completedSteps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Steps
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                    {currentStepData ? 1 : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Step
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {totalSteps - completedSteps - (currentStepData ? 1 : 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Steps
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Workflow Visualization */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} />
                Workflow Steps
              </Typography>

              <Stepper orientation="vertical" nonLinear>
                {workflow.steps.map((step, index) => {
                  const stepStatus = getStepStatus(step.id);
                  return (
                    <Step key={step.id} expanded active={stepStatus !== 'pending'}>
                      <StepLabel
                        icon={getStepIcon(step)}
                        onClick={() => jumpToStep(step.id)}
                        sx={{ 
                          cursor: isRunning ? 'default' : 'pointer',
                          '& .MuiStepLabel-label': {
                            fontWeight: stepStatus === 'active' ? 600 : 400
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            Stage {index + 1}: {step.name}
                          </Typography>
                          {stepStatus === 'active' && (
                            <Badge color="primary" variant="dot" />
                          )}
                        </Box>
                      </StepLabel>
                      <StepContent>
                        <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
                          <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <UserGroupIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Assigned Roles:
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {step.roles.length > 0 ? step.roles.map(role => {
                                    const roleData = workflow.roles.find(r => r.name === role);
                                    return (
                                      <Chip
                                        key={role}
                                        label={roleData?.displayName || role}
                                        size="small"
                                        sx={{ 
                                          bgcolor: roleData?.color || 'grey.200',
                                          color: 'white',
                                          fontWeight: 500
                                        }}
                                      />
                                    );
                                  }) : (
                                    <Chip label="System" size="small" variant="outlined" />
                                  )}
                                </Box>
                              </Grid>
                              
                              {step.config.timeLimit && (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <ClockIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      Time Limit:
                                    </Typography>
                                  </Box>
                                  <Chip
                                    icon={<ClockIcon />}
                                    label={`${step.config.timeLimit} days`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                </Grid>
                              )}
                            </Grid>

                            {step.config.actions && step.config.actions.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Available Actions:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {step.config.actions.map(action => (
                                    <Chip
                                      key={action}
                                      label={action.replace(/_/g, ' ')}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {step.config.allowParallel && (
                              <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                  This step supports parallel processing - multiple reviewers can work simultaneously.
                                </Typography>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </Paper>
          </Grid>

          {/* Sidebar Information */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Current Step Details */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1 }} />
                  Current Step Details
                </Typography>
                
                {currentStepData ? (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {currentStepData.icon}
                      {currentStepData.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Step ID: {currentStepData.id}
                    </Typography>

                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Assigned Roles</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {currentStepData.roles.map(role => {
                            const roleData = workflow.roles.find(r => r.name === role);
                            return (
                              <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: roleData?.color || 'grey.400'
                                  }}
                                />
                                <Typography variant="body2">
                                  {roleData?.displayName || role}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    {currentStepData.config.timeLimit && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Time Limit: {currentStepData.config.timeLimit} days
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No step selected</Typography>
                )}
              </Paper>

              {/* Step History */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Step History
                </Typography>
                
                {stepHistory.length > 0 ? (
                  <List dense>
                    {stepHistory.map((entry, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={entry.stepName}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {entry.userRole} • {entry.timestamp.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < stepHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No steps completed yet
                  </Typography>
                )}
              </Paper>

              {/* Workflow Statistics */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Workflow Statistics
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Total Steps:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{workflow.steps.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Completed:</Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      {stepHistory.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Remaining:</Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                      {workflow.steps.length - stepHistory.length - (getStepStatus(currentStep) === 'active' ? 1 : 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Estimated Duration:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{workflow.estimatedDuration}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AirForce8StageDemo;