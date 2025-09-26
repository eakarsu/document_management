import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { WorkflowActivity } from '@/types/workflow-monitor';
import { useWorkflowHelpers } from '../../../hooks/workflow-monitor/useWorkflowHelpers';

interface LiveActivityTabProps {
  recentActivity: WorkflowActivity[];
  loading: boolean;
}

const LiveActivityTab: React.FC<LiveActivityTabProps> = ({
  recentActivity,
  loading
}) => {
  const { getActivityIcon } = useWorkflowHelpers();

  if (loading || recentActivity.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Recent Activity
        </Typography>

        <List>
          {recentActivity.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  {getActivityIcon(activity.activity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>{activity.user.name}</strong> {activity.activity.toLowerCase().replace('_', ' ')} in {activity.documentTitle}
                      </Typography>
                      <Chip
                        label={activity.impact}
                        size="small"
                        color={activity.impact === 'HIGH' ? 'error' : 'default'}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.details}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((Date.now() - activity.timestamp.getTime()) / (1000 * 60))} minutes ago
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < recentActivity.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default LiveActivityTab;