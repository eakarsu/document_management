import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Avatar
} from '@mui/material';
import { WorkflowStatus } from '@/types/workflow-monitor';
import { useWorkflowHelpers } from '../../../hooks/workflow-monitor/useWorkflowHelpers';

interface WorkflowStatusTabProps {
  workflowStatuses: WorkflowStatus[];
  loading: boolean;
}

const WorkflowStatusTab: React.FC<WorkflowStatusTabProps> = ({
  workflowStatuses,
  loading
}) => {
  const { getHealthColor, getParticipantStatusColor } = useWorkflowHelpers();

  if (loading || workflowStatuses.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      {workflowStatuses.map((workflow) => (
        <Grid item xs={12} lg={6} key={workflow.workflowId}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{workflow.documentTitle}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current: {workflow.currentStep}
                  </Typography>
                </Box>
                <Chip
                  label={workflow.health}
                  color={getHealthColor(workflow.health) as any}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="body2">{workflow.overallProgress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={workflow.overallProgress}
                  color={getHealthColor(workflow.health) as any}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Velocity</Typography>
                  <Typography variant="body2">{workflow.velocity} steps/hour</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">ETA</Typography>
                  <Typography variant="body2">
                    {workflow.estimatedCompletion.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Delay Risk</Typography>
                  <Typography variant="body2" color={workflow.metrics.delayRisk > 70 ? 'error.main' : 'text.primary'}>
                    {workflow.metrics.delayRisk}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Quality Score</Typography>
                  <Typography variant="body2" color="success.main">
                    {workflow.metrics.qualityScore}%
                  </Typography>
                </Grid>
              </Grid>

              {workflow.blockers.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Blockers:</Typography>
                  {workflow.blockers.map((blocker, index) => (
                    <Typography key={index} variant="body2">• {blocker}</Typography>
                  ))}
                </Alert>
              )}

              <Typography variant="subtitle2" gutterBottom>Participants</Typography>
              <List dense>
                {workflow.participants.map((participant) => (
                  <ListItem key={participant.userId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Badge
                        color={getParticipantStatusColor(participant.status) as any}
                        variant="dot"
                      >
                        <Avatar>{participant.name[0]}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.name}
                      secondary={`${participant.pendingTasks} pending • Last active ${Math.round((Date.now() - participant.lastActivity.getTime()) / (1000 * 60))}m ago`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default WorkflowStatusTab;