import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import { Timeline, Warning } from '@mui/icons-material';
import { WorkflowBottleneck } from '@/types/workflow-optimizer';

interface BottleneckAnalysisCardProps {
  bottlenecks: WorkflowBottleneck[];
}

export const BottleneckAnalysisCard: React.FC<BottleneckAnalysisCardProps> = ({ bottlenecks }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} />
          Bottlenecks Analysis
        </Typography>

        <List dense>
          {(bottlenecks || []).map((bottleneck, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Badge badgeContent={bottleneck.impactScore.toFixed(1)} color="error">
                  <Warning color="warning" />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={bottleneck.stepName}
                secondary={`${bottleneck.averageTime}h avg • ${bottleneck.successRate}% success`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default BottleneckAnalysisCard;