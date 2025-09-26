import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip
} from '@mui/material';
import { Insights } from '@mui/icons-material';
import { TeamPerformanceInsights } from '@/types/team-performance';
import { usePerformanceUtils } from '../../../hooks/team-performance/usePerformanceUtils';

interface AIInsightsPanelProps {
  insights: TeamPerformanceInsights;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const { getInsightIcon, getInsightColor, getPriorityColor } = usePerformanceUtils();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Insights sx={{ mr: 1 }} />
          AI Insights
        </Typography>

        <List dense>
          {insights.insights.map((insight, index) => {
            const InsightIcon = getInsightIcon(insight.type);
            const insightColor = getInsightColor(insight.type);

            return (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${insightColor}.main` }}>
                    <InsightIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={insight.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {insight.description}
                      </Typography>
                      <Chip
                        label={insight.priority}
                        size="small"
                        color={getPriorityColor(insight.priority)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;