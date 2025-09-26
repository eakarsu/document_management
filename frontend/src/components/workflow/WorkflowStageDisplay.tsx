import React from 'react';
import { Paper, Typography, Box, Chip, LinearProgress, Tooltip } from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Flag,
  AccountTree,
  Circle,
  FiberManualRecord
} from '@mui/icons-material';

interface WorkflowStageDisplayProps {
  workflowDef: any;
  workflowInstance: any;
  currentStage: any;
  stageProgress: number;
}

export const WorkflowStageDisplay: React.FC<WorkflowStageDisplayProps> = ({
  workflowDef,
  workflowInstance,
  currentStage,
  stageProgress
}) => {
  // Default to 12-stage workflow if no workflowDef provided
  const defaultStages = [
    { id: '1', name: 'Initial Draft Preparation', order: 1 },
    { id: '2', name: 'PCM Review', order: 2 },
    { id: '3', name: 'First Coordination Distribution', order: 3 },
    { id: '3.5', name: 'First Review Collection', order: 3.5 },
    { id: '4', name: 'OPR Feedback Incorporation', order: 4 },
    { id: '5', name: 'Second Coordination Distribution', order: 5 },
    { id: '5.5', name: 'Second Review Collection', order: 5.5 },
    { id: '6', name: 'Second OPR Feedback Incorporation', order: 6 },
    { id: '7', name: 'Legal Review & Approval', order: 7 },
    { id: '8', name: 'Post-Legal OPR Update', order: 8 },
    { id: '9', name: 'OPR Leadership Review', order: 9 },
    { id: '10', name: 'Final Command Approval', order: 10 },
    { id: '11', name: 'AFDPO Publication', order: 11 },
    { id: '12', name: 'Complete', order: 12 }
  ];

  const stages = workflowDef?.stages || defaultStages;
  const getStageIcon = (stageType?: string) => {
    switch (stageType) {
      case 'REVIEW':
        return <Schedule fontSize="small" />;
      case 'APPROVE':
        return <CheckCircle fontSize="small" />;
      case 'DISTRIBUTE':
        return <AccountTree fontSize="small" />;
      case 'COMPLETE':
        return <Flag fontSize="small" />;
      default:
        return <RadioButtonUnchecked fontSize="small" />;
    }
  };

  const getStageStatus = (stageId: string) => {
    // If no workflow instance, all stages are pending
    if (!workflowInstance) return 'pending';

    // If workflow is completed, all stages are completed
    if (workflowInstance?.completedAt || workflowInstance?.isCompleted || (!workflowInstance?.active && workflowInstance?.currentStageId === '11')) return 'completed';
    if (stageId === workflowInstance?.currentStageId) return 'active';

    const currentOrder = currentStage?.order || 0;
    const stageOrder = stages.find((s: any) => s.id === stageId)?.order || 0;

    return stageOrder < currentOrder ? 'completed' : 'pending';
  };

  const getStageStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderColor: '#764ba2',
          textColor: '#fff',
          iconColor: '#fff',
        };
      case 'active':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #4f46e5 100%)',
          borderColor: '#4f46e5',
          textColor: '#fff',
          iconColor: '#fff',
        };
      case 'pending':
      default:
        return {
          background: '#f5f5f7',
          borderColor: '#e1e1e3',
          textColor: '#9ca3af',
          iconColor: '#9ca3af',
        };
    }
  };

  // Check if workflow is completed
  const isCompleted = workflowInstance?.completedAt || workflowInstance?.isCompleted || (!workflowInstance?.active && workflowInstance?.currentStageId === '11');

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {isCompleted ? (
        <>
          {/* Completed Workflow Display */}
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#10b981'
            }}
          >
            <CheckCircle sx={{ fontSize: 32 }} />
            Workflow Complete - Document Published
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            This document has been successfully published and the workflow process is complete.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="success.main" fontWeight="bold">
                COMPLETED
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#d4f4dd',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#10b981'
                }
              }}
            />
          </Box>
        </>
      ) : (
        <>
          {/* Active Workflow Display */}
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStageIcon(currentStage?.type)}
            Current Stage: {currentStage?.name || 'Unknown'}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {currentStage?.description}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stage {currentStage?.order || 1} of {stages.length}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stageProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </>
      )}

      {/* Professional Workflow Progress Display */}
      <Box sx={{
        background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
        borderRadius: '16px',
        p: 4,
        mt: 2,
        border: '1px solid #e1e4e8',
      }}>
        {/* Progress Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ color: isCompleted ? '#10b981' : '#586069', fontWeight: 500 }}>
            {isCompleted ? '✅ WORKFLOW COMPLETED' : 'WORKFLOW PROGRESS'}
          </Typography>
          <Typography variant="caption" sx={{
            color: isCompleted ? '#fff' : '#0969da',
            background: isCompleted ? '#10b981' : '#ddf4ff',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontWeight: 600,
          }}>
            {isCompleted ? 'PUBLISHED' : `Stage ${currentStage?.order || 1} of ${stages.length}`}
          </Typography>
        </Box>

        {/* Stage Circles Container - Perfect Horizontal Line */}
        <Box sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'visible',
          px: 2,
          pb: 8,
          pt: 4,
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f6f8fa',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#d1d5da',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#c1c8cd',
            },
          },
        }}>
          {/* Container for circles only */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            minWidth: 'fit-content',
          }}>
            {/* Background connecting line */}
            <Box sx={{
              position: 'absolute',
              left: '32px',
              right: '32px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '2px',
              background: '#e5e7eb',
              zIndex: 0,
            }} />

            {/* Stages */}
            {stages.sort((a: any, b: any) => a.order - b.order).map((stage: any, index: number, arr: any[]) => {
              const status = getStageStatus(stage.id);
              const styles = getStageStyles(status);
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              const isLast = index === arr.length - 1;

              return (
                <Box
                  key={stage.id}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: isLast ? 0 : '100px',
                  }}
                >
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {stage.name}
                        </Typography>
                        {stage.description && (
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            {stage.description}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                          {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    {/* Circle */}
                    <Box
                      sx={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: styles.background,
                        border: `3px solid ${styles.borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 2,
                        boxShadow: isActive
                          ? '0 10px 40px rgba(79, 70, 229, 0.3), 0 0 0 8px rgba(79, 70, 229, 0.1)'
                          : isCompleted
                          ? '0 4px 12px rgba(102, 126, 234, 0.2)'
                          : '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: isActive
                            ? '0 12px 48px rgba(79, 70, 229, 0.4), 0 0 0 12px rgba(79, 70, 229, 0.15)'
                            : '0 6px 20px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle sx={{ fontSize: 32, color: styles.iconColor }} />
                      ) : isActive ? (
                        <FiberManualRecord
                          sx={{
                            fontSize: 16,
                            color: styles.iconColor,
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{
                            color: styles.textColor,
                            fontWeight: 600,
                          }}
                        >
                          {stage.order || index + 1}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>

                  {/* Stage Label - positioned below */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '-35px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '90px',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '9px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#4f46e5' : isCompleted ? '#764ba2' : '#6b7280',
                        letterSpacing: '0.01em',
                        lineHeight: 1.2,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      }}
                    >
                      {stage.name}
                    </Typography>
                  </Box>

                  {/* Progress line overlay for completed stages */}
                  {!isLast && isCompleted && (
                    <Box sx={{
                      position: 'absolute',
                      left: '32px',
                      right: '-100px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '3px',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      zIndex: 1,
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Animation Keyframes */}
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </Box>

      {/* Stage Metadata */}
      {currentStage?.assignedRole && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Assigned to: <strong>{currentStage.assignedRole}</strong>
          </Typography>
          {currentStage?.signatureRequired && (
            <Typography variant="caption" color="warning.main" sx={{ ml: 2 }}>
              ✍️ Signature Required
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};