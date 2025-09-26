import React from 'react';
import { Button, Box, Tooltip, CircularProgress } from '@mui/material';
import {
  Send,
  CheckCircle,
  Cancel,
  NavigateBefore,
  NavigateNext,
  Refresh,
  Description,
  Group,
  Gavel,
  Publish,
  Archive
} from '@mui/icons-material';
import { WorkflowAction } from '@/hooks/useWorkflowActions';

interface WorkflowActionsProps {
  actions: WorkflowAction[];
  processingWorkflow: boolean;
  onActionClick: (action: WorkflowAction) => void;
  currentStageId?: string;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  actions,
  processingWorkflow,
  onActionClick,
  currentStageId
}) => {
  const getActionIcon = (action: WorkflowAction) => {
    // Return button icon
    if (action.id.startsWith('return-to-')) {
      return <NavigateBefore />;
    }

    // Other action icons
    switch (action.label.toLowerCase()) {
      case 'submit to pcm':
      case 'submit to opr leadership':
      case 'submit to legal':
        return <Send />;
      case 'approve':
      case 'approve for publication':
      case 'sign and approve':
        return <CheckCircle />;
      case 'reject':
      case 'return to previous stage':
        return <Cancel />;
      case 'distribute to reviewers':
      case 'distribute draft to reviewers':
        return <Group />;
      case 'review document':
      case 'pcm final review':
      case 'final leadership review':
        return <Description />;
      case 'legal review':
        return <Gavel />;
      case 'publish document':
        return <Publish />;
      case 'archive':
        return <Archive />;
      case 'reset workflow':
        return <Refresh />;
      default:
        return <NavigateNext />;
    }
  };

  const getButtonVariant = (action: WorkflowAction): 'contained' | 'outlined' => {
    // Return buttons are always outlined
    if (action.id.startsWith('return-to-')) {
      return 'outlined';
    }

    // Primary actions are contained
    const primaryActions = [
      'submit',
      'approve',
      'sign',
      'publish',
      'distribute',
      'complete'
    ];

    return primaryActions.some(keyword =>
      action.label.toLowerCase().includes(keyword)
    ) ? 'contained' : 'outlined';
  };

  const getButtonColor = (action: WorkflowAction) => {
    if (action.id.startsWith('return-to-')) {
      return 'secondary';
    }

    if (action.label.toLowerCase().includes('reject') ||
        action.label.toLowerCase().includes('return')) {
      return 'error';
    }

    if (action.label.toLowerCase().includes('approve') ||
        action.label.toLowerCase().includes('complete') ||
        action.label.toLowerCase().includes('publish')) {
      return 'success';
    }

    return 'primary';
  };

  const getButtonStyles = (action: WorkflowAction) => {
    if (action.id.startsWith('return-to-')) {
      return {
        background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
        color: 'white',
        '&:hover': {
          background: 'linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)',
        }
      };
    }
    return {};
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
      {actions.map((action) => (
        <Tooltip
          key={action.id}
          title={action.disabledReason || ''}
          disableHoverListener={!action.disabled}
        >
          <span>
            <Button
              variant={getButtonVariant(action)}
              color={getButtonColor(action) as any}
              onClick={() => onActionClick(action)}
              disabled={action.disabled || processingWorkflow}
              startIcon={
                processingWorkflow ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  getActionIcon(action)
                )
              }
              sx={{
                minWidth: 150,
                ...getButtonStyles(action)
              }}
            >
              {action.label}
            </Button>
          </span>
        </Tooltip>
      ))}
    </Box>
  );
};