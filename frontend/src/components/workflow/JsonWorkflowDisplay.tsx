import React, { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  NavigateNext,
  NavigateBefore,
  Info,
  Assignment,
  AccessTime
} from '@mui/icons-material';
import { api } from '../../lib/api';

// Global instance tracker to ensure only one workflow component per document
const globalInstances = new Map<string, boolean>();

interface WorkflowStage {
  id: string;
  name: string;
  type: string;
  order: number;
  required: boolean;
  roles: string[];
  actions: Array<{
    id: string;
    label: string;
    target: string;
    condition?: string;
  }>;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  stages: WorkflowStage[];
  transitions: Array<{
    id: string;
    from: string;
    to: string;
    label: string;
    condition?: string;
  }>;
  settings: {
    allowSkip: boolean;
    requireComments: boolean;
    notifyOnStageChange: boolean;
    timeoutHours: number;
  };
}

interface WorkflowInstance {
  active: boolean;
  workflowId?: string;
  workflowName?: string;
  currentStageId?: string;
  currentStageName?: string;
  currentStageType?: string;
  stageOrder?: number;
  totalStages?: number;
  history?: Array<{
    id: string;
    stageId: string;
    stageName: string;
    action: string;
    performedBy: string;
    createdAt: string;
    metadata?: any;
  }>;
  metadata?: any;
  startedAt?: string;
  updatedAt?: string;
}

interface JsonWorkflowDisplayProps {
  documentId: string;
  userRole?: string;
  onWorkflowChange?: (instance: WorkflowInstance) => void;
  onResetRef?: (reset: () => Promise<void>) => void;
}

export const JsonWorkflowDisplay: React.FC<JsonWorkflowDisplayProps> = ({
  documentId,
  userRole = 'USER',
  onWorkflowChange,
  onResetRef
}) => {
  // HOOKS FIRST - Always call hooks in the same order
  const [loading, setLoading] = useState(true);
  const [workflowDef, setWorkflowDef] = useState<WorkflowDefinition | null>(null);
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [forceStage8, setForceStage8] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [clickedButtons, setClickedButtons] = useState<Set<string>>(new Set());
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  // Force OPR workflow as the only option
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('opr-review-workflow');
  const [selectWorkflowDialog, setSelectWorkflowDialog] = useState(false);

  // SINGLETON PATTERN - After all hooks
  const instanceKey = `${documentId}-${userRole}`;
  const isFirstInstance = useRef(false);
  const isDuplicate = globalInstances.has(instanceKey);

  if (!isDuplicate) {
    globalInstances.set(instanceKey, true);
    isFirstInstance.current = true;
  }

  // Fetch workflow instance and definition
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get workflow instance for this document
      const instanceResponse = await api.get(`/api/workflow-instances/${documentId}`);
      if (!instanceResponse.ok) {
        throw new Error('Failed to fetch workflow instance');
      }

      const instance = await instanceResponse.json();
      setWorkflowInstance(instance);

      if (instance.active && instance.workflowId) {
        // Fetch workflow definition
        const defResponse = await api.get(`/api/workflows/${instance.workflowId}`);
        if (!defResponse.ok) {
          throw new Error('Failed to fetch workflow definition');
        }

        const definition = await defResponse.json();
        setWorkflowDef(definition);
      }

      if (onWorkflowChange) {
        onWorkflowChange(instance);
      }
    } catch (err) {
      console.error('Error fetching workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchAvailableWorkflows();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWorkflow, 30000);

    // Cleanup function to remove instance from global tracker
    return () => {
      clearInterval(interval);
      if (isFirstInstance.current) {
        globalInstances.delete(instanceKey);
      }
    };
  }, [documentId]);

  // Expose reset function to parent
  useEffect(() => {
    if (onResetRef) {
      onResetRef(resetWorkflow);
    }
  }, [onResetRef]);

  // Fetch available workflows
  const fetchAvailableWorkflows = async () => {
    try {
      const response = await api.get('/api/workflows');
      if (response.ok) {
        const workflows = await response.json();
        setAvailableWorkflows(workflows);
        
        // ALWAYS force OPR workflow as selected
        setSelectedWorkflowId('opr-review-workflow');
      }
    } catch (err) {
      console.error('Error fetching available workflows:', err);
      // Even on error, force OPR workflow
      setSelectedWorkflowId('opr-review-workflow');
    }
  };

  // Start a new workflow
  const startWorkflow = async (workflowId: string = selectedWorkflowId) => {
    try {
      setProcessing(true);
      setError(null);

      
      const response = await api.post(`/api/workflow-instances/${documentId}/start`, {
        workflowId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start workflow');
      }

      await fetchWorkflow();
      
      // Also trigger the onWorkflowChange callback to refresh parent component
      if (onWorkflowChange) {
        const updatedData = await api.get(`/api/workflow-instances/${documentId}`);
        const updatedInstance = await updatedData.json();
        onWorkflowChange(updatedInstance);
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    } finally {
      setProcessing(false);
    }
  };

  // Reset workflow to beginning
  const resetWorkflow = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await api.post(`/api/workflow-instances/${documentId}/reset`, {});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset workflow');
      }

      // Force refresh the workflow data
      await fetchWorkflow();
      
      // Also trigger the onWorkflowChange callback to refresh parent component
      if (onWorkflowChange) {
        const refreshedData = await api.get(`/api/workflow-instances/${documentId}`);
        const refreshedInstance = await refreshedData.json();
        onWorkflowChange(refreshedInstance);
      }
      
      return true; // Return success indicator
    } catch (err) {
      console.error('Error resetting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset workflow');
      throw err; // Re-throw to let parent handle it
    } finally {
      setProcessing(false);
    }
  };

  // Advance workflow to next stage
  const advanceWorkflow = async (targetStageId: string, action: string) => {
    const buttonId = `${targetStageId}-${action}`;
    try {
      setProcessing(true);
      setError(null);
      
      // Mark this button as clicked
      setClickedButtons(prev => new Set(prev).add(buttonId));

      const metadata: any = {};
      if (comment) {
        metadata.comment = comment;
      }

      const response = await api.post(`/api/workflow-instances/${documentId}/advance`, {
        targetStageId,
        action,
        metadata
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to advance workflow');
      }

      setComment('');
      await fetchWorkflow();
      
      // Clear clicked buttons after successful workflow advancement
      setClickedButtons(new Set());
    } catch (err) {
      console.error('Error advancing workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to advance workflow');
      
      // Remove the button from clicked state on error so user can retry
      setClickedButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(buttonId);
        return newSet;
      });
    } finally {
      setProcessing(false);
    }
  };

  // Check if user can perform actions on current stage
  const canUserAct = (stage: WorkflowStage): boolean => {
    const normalizedRole = userRole?.toUpperCase();
    if (normalizedRole === 'ADMIN') return true;
    return stage.roles.some(r => r.toLowerCase() === userRole?.toLowerCase());
  };

  // Get available actions for current stage
  const getAvailableActions = (): Array<{ id: string; label: string; target: string }> => {
    if (!workflowDef || !workflowInstance?.currentStageId) {
      return [];
    }

    const currentStage = workflowDef.stages.find(s => s.id === workflowInstance.currentStageId);
    if (!currentStage) {
      return [];
    }
    
    
    // Check if user has permission for this stage
    const normalizedRole = userRole?.toUpperCase();
    const isAdmin = normalizedRole === 'ADMIN';
    
    const userCanAct = isAdmin || 
                       currentStage.roles.some(r => r.toUpperCase() === normalizedRole);
    
    
    if (!userCanAct) {
      return [];
    }

    // Get all defined actions for this stage
    const actions = [...(currentStage.actions || [])];
    
    // For users with appropriate roles, ensure all transitions are available
    // This includes both defined actions and any additional transitions
    const availableTransitions = workflowDef.transitions.filter(
      (t: any) => t.from === workflowInstance.currentStageId
    );
    
    
    // For admins, ALWAYS add a "Move to Next Stage" button for all transitions
    if (isAdmin) {
      availableTransitions.forEach((transition: any) => {
        const targetStage = workflowDef.stages.find((s: any) => s.id === transition.to);
        
        // Add admin override button (even if action already exists)
        actions.push({
          id: `admin-override-${transition.to}`,
          label: `Admin: Move to ${targetStage?.name || 'Next Stage'}`,
          target: transition.to
        });
      });
    } else {
      // For non-admin users, only add transitions that aren't already in actions
      availableTransitions.forEach((transition: any) => {
        const hasAction = actions.some(a => a.target === transition.to);
        
        if (!hasAction && currentStage.roles.some(r => r.toUpperCase() === normalizedRole)) {
          const targetStage = workflowDef.stages.find((s: any) => s.id === transition.to);
          actions.push({
            id: `user-transition-${transition.to}`,
            label: transition.label || `Submit to ${targetStage?.name || 'Next Stage'}`,
            target: transition.to
          });
        }
      });
    }
    
    return actions;
  };

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    if (!workflowInstance?.stageOrder || !workflowInstance?.totalStages) return 0;
    return (workflowInstance.stageOrder / workflowInstance.totalStages) * 100;
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Check if workflow is completed (at the final stage) even if inactive
  const isWorkflowCompleted = (() => {
    if (!workflowInstance) return false;

    // Check if status is explicitly marked as completed
    if (workflowInstance.status === 'completed') return true;

    // Check if workflow definition exists and we're at the last stage
    if (workflowDef) {
      const maxStageOrder = Math.max(...workflowDef.stages.map(s => s.order));
      const currentStageOrder = workflowInstance.stageOrder ||
        workflowDef.stages.find(s => s.id === workflowInstance.currentStageId)?.order;

      if (currentStageOrder === maxStageOrder) return true;
    }

    // For workflows without definition, check if completedAt is set
    if (workflowInstance.completedAt) return true;

    return false;
  })();

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    const componentId = Math.random().toString(36).substr(2, 9);
  }

  // Only log duplicate detection in development
  if (isDuplicate && process.env.NODE_ENV === 'development') {
  }

  // FORCE workflow completion screen - override any inactive status
  if (isWorkflowCompleted) {
    if (process.env.NODE_ENV === 'development') {
    }
    return (
      <Card sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            p: 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a1a2e' }}>
              ✅ Workflow Complete
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This workflow has been successfully completed.
            </Typography>
          </Box>
          <Box sx={{
            background: 'white',
            p: 3,
            mb: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> 🎉 Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Progress:</strong> 100% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Skip the active check if workflow is completed - completed workflows should always show completion
  const isActive = workflowInstance?.isActive ?? workflowInstance?.active;
  if (!isActive && !isWorkflowCompleted) {
    if (process.env.NODE_ENV === 'development') {
    }
    return (
      <>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Management
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              No active workflow for this document. Select a workflow to begin processing.
            </Alert>
            
            {availableWorkflows.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Workflow</InputLabel>
                  <Select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    label="Select Workflow"
                  >
                    {availableWorkflows.map((workflow) => (
                      <MenuItem key={workflow.id} value={workflow.id}>
                        {workflow.name} (v{workflow.version})
                        {workflow.isDefault && ' ⭐ DEFAULT'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedWorkflowId && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {availableWorkflows.find(w => w.id === selectedWorkflowId)?.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stages: {availableWorkflows.find(w => w.id === selectedWorkflowId)?.stageCount || 0}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => startWorkflow(selectedWorkflowId)}
                disabled={processing || !selectedWorkflowId}
              >
                {processing ? 'Starting...' : 'Start Selected Workflow'}
              </Button>
              
              {availableWorkflows.length === 0 && (
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/workflows'}
                >
                  Manage Workflows
                </Button>
              )}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (!workflowDef && !isWorkflowCompleted) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">
            Workflow definition not found. Please contact administrator.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If workflow is completed but no workflow def, show completion screen anyway
  if (!workflowDef && isWorkflowCompleted) {
    return (
      <Card sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            p: 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a1a2e' }}>
              ✅ Workflow Complete
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This workflow has been successfully completed.
            </Typography>
          </Box>
          <Box sx={{
            background: 'white',
            p: 3,
            mb: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> 🎉 Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Progress:</strong> 100% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentStage = workflowDef?.stages?.find(s => s.id === workflowInstance.currentStageId);
  const availableActions = workflowDef ? getAvailableActions() : [];
  
  // Check if workflow is at the final stage (AFDPO - stage 8)
  const isFinalStage = currentStage?.order === 8 || currentStage?.type === 'AFDPO_FINAL';
  // Stage 8 means document is published - show completion regardless of available actions
  const isWorkflowComplete = isFinalStage;
  


  return (
    <Card sx={{
      mb: 3,
      background: isWorkflowComplete
        ? 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      borderRadius: 2
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Professional Header Section */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          p: 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a1a2e' }}>
                {(() => {
                  const headerText = isWorkflowComplete ? '✅ Document Published' : workflowDef.name;
                  return headerText;
                })()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {(() => {
                  const descText = isWorkflowComplete
                    ? 'This document has been successfully published to AFDPO and is now complete.'
                    : workflowDef.description;
                  return descText;
                })()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={`v${workflowDef.version}`}
                size="medium"
                sx={{ 
                  mb: 1,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Started: {new Date(workflowInstance.startedAt!).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Visual Workflow Progress */}
        <Box sx={{ 
          background: 'white',
          p: 3,
          mb: 2
        }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Workflow Progress
          </Typography>
          
          {/* Horizontal Stage Display */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            overflowX: 'auto',
            py: 2,
            px: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 3,
            }
          }}>
            {workflowDef.stages
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => {
                const isCompleted = stage.order < workflowInstance.stageOrder!;
                const isCurrent = stage.id === workflowInstance.currentStageId;
                const isPending = stage.order > workflowInstance.stageOrder!;
                
                return (
                  <React.Fragment key={stage.id}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 120
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted 
                          ? 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)'
                          : isCurrent 
                          ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                          : '#e0e0e0',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: isCurrent ? '0 0 20px rgba(33, 150, 243, 0.5)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        {isCompleted ? <CheckCircle /> : stage.order}
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 1,
                          textAlign: 'center',
                          fontWeight: isCurrent ? 'bold' : 'normal',
                          color: isCurrent ? 'primary.main' : 'text.secondary',
                          maxWidth: 100
                        }}
                      >
                        {stage.name}
                      </Typography>
                      {isCurrent && (
                        <Chip 
                          label="CURRENT" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                    {index < workflowDef.stages.length - 1 && (
                      <Box sx={{
                        flex: 1,
                        height: 2,
                        background: isCompleted ? '#4CAF50' : '#e0e0e0',
                        mx: 1,
                        minWidth: 30
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
          </Box>
          
          {/* Progress Statistics */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1
          }}>
            <Typography variant="body2">
              <strong>Status:</strong> {isWorkflowComplete ? '🎉 Published & Complete' : currentStage?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Progress:</strong> {workflowInstance.stageOrder} of {workflowInstance.totalStages} stages
            </Typography>
            <Typography variant="body2" color={isWorkflowComplete ? "success.main" : "primary"}>
              <strong>{Math.round(getProgressPercentage())}%</strong> Complete
            </Typography>
          </Box>
        </Box>


        {/* Error Display */}
        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}

        {/* Actions Section - Hide when workflow is complete */}
        {availableActions.length > 0 && !isWorkflowComplete && (
          <Box sx={{ 
            background: 'white',
            p: 3,
            mb: 2
          }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Available Actions
            </Typography>
            
            {workflowDef.settings.requireComments && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comments (Required)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 2 }}
                disabled={processing}
                variant="outlined"
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {availableActions.map((action) => {
                // Determine button styling based on action type
                const isAdminAction = action.id.startsWith('admin-');
                const isUserAction = action.id.startsWith('user-');
                const buttonId = `${action.target}-${action.label}`;
                const isButtonClicked = clickedButtons.has(buttonId);
                
                // Different colors for different action types
                let buttonGradient = 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)';
                let hoverGradient = 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)';
                let disabledGradient = 'linear-gradient(45deg, #BDBDBD 30%, #E0E0E0 90%)';
                
                if (isAdminAction) {
                  // Admin actions - Red gradient
                  buttonGradient = 'linear-gradient(45deg, #FF6B6B 30%, #FF8787 90%)';
                  hoverGradient = 'linear-gradient(45deg, #FF5252 30%, #FF6B6B 90%)';
                } else if (action.label.toLowerCase().includes('approve')) {
                  // Approval actions - Green gradient
                  buttonGradient = 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)';
                  hoverGradient = 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)';
                } else if (action.label.toLowerCase().includes('reject')) {
                  // Reject actions - Orange gradient
                  buttonGradient = 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)';
                  hoverGradient = 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)';
                }
                
                const isButtonDisabled = processing || isButtonClicked || (workflowDef.settings.requireComments && !comment);
                
                return (
                  <Button
                    key={action.id}
                    variant="contained"
                    size="large"
                    startIcon={<NavigateNext />}
                    onClick={() => advanceWorkflow(action.target, action.label)}
                    disabled={isButtonDisabled}
                    sx={{
                      background: isButtonDisabled ? disabledGradient : buttonGradient,
                      boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .2)',
                      fontWeight: 'bold',
                      minWidth: '150px',
                      opacity: isButtonClicked ? 0.7 : 1,
                      '&:hover': {
                        background: isButtonDisabled ? disabledGradient : hoverGradient,
                        transform: isButtonDisabled ? 'none' : 'translateY(-2px)',
                        boxShadow: isButtonDisabled ? '0 3px 5px 2px rgba(0, 0, 0, .2)' : '0 5px 10px 2px rgba(0, 0, 0, .3)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isButtonClicked ? 'Processing...' : action.label}
                  </Button>
                );
              })}}
            </Box>
          </Box>
        )}


      </CardContent>
    </Card>
  );
};