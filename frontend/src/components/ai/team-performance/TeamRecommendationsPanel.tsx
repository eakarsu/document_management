import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip
} from '@mui/material';
import { EmojiEvents, CheckCircle } from '@mui/icons-material';
import { TeamPerformanceInsights } from '@/types/team-performance';

interface TeamRecommendationsPanelProps {
  insights: TeamPerformanceInsights;
}

const TeamRecommendationsPanel: React.FC<TeamRecommendationsPanelProps> = ({ insights }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EmojiEvents sx={{ mr: 1 }} />
          AI Recommendations
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Team-Level Recommendations</Typography>
            <List dense>
              {insights.recommendations.teamLevel.map((rec, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Training Needs</Typography>
            {insights.predictiveAnalytics.trainingNeeds.map((need, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {need.skill}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {need.members.map((userId, idx) => {
                    const member = insights.teamMembers.find(m => m.userId === userId);
                    return (
                      <Chip
                        key={idx}
                        label={member?.name}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TeamRecommendationsPanel;