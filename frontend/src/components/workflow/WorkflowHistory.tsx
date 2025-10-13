import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Send,
  Cancel,
  Flag,
  PlayArrow,
  AccountTree
} from '@mui/icons-material';

interface WorkflowHistoryProps {
  history: any[];
  currentStageId: string;
}

export const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({
  history,
  currentStageId
}) => {
  const getStageIcon = (stageId: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle color="success" />;
    } else if (stageId === currentStageId) {
      return <Schedule color="warning" />;
    } else {
      return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AccountTree sx={{ mr: 1, verticalAlign: 'middle' }} />
        Workflow History
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {history.length > 0 ? (
        <List>
          {history.map((item, index) => (
            <React.Fragment key={item.id || index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getStageIcon(item.stageId, item.status)}
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {item.stageName || item.name || `Stage ${item.stageId}`}
                      </Typography>
                      <Chip
                        label={item.status || 'unknown'}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                      {item.stageId === currentStageId && (
                        <Chip
                          label="Current"
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {item.startedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Started: {formatDate(item.startedAt)}
                          </Typography>
                        )}
                        {item.completedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Completed: {formatDate(item.completedAt)}
                          </Typography>
                        )}
                        {item.assignedTo && (
                          <Typography variant="caption" color="text.secondary">
                            Assigned to: {item.assignedTo}
                          </Typography>
                        )}
                      </Box>
                      {item.comments && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontStyle: 'italic',
                            bgcolor: 'grey.50',
                            p: 1,
                            borderRadius: 1
                          }}
                        >
                          "{item.comments}"
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < history.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No workflow history available.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};