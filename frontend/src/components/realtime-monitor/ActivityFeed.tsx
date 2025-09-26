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
import { WorkflowActivity } from './types';
import { getActivityIcon } from './ActivityIcons';
import { formatTimeAgo } from './utils';

interface ActivityFeedProps {
  activities: WorkflowActivity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Recent Activity
        </Typography>

        <List>
          {activities.map((activity, index) => (
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
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};