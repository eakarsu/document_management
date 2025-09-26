import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress
} from '@mui/material';
import { TeamPerformanceInsights } from '@/types/team-performance';

interface TeamOverviewCardsProps {
  insights: TeamPerformanceInsights;
}

const TeamOverviewCards: React.FC<TeamOverviewCardsProps> = ({ insights }) => {
  const cards = [
    {
      title: 'Average Performance',
      value: insights.teamMetrics.averagePerformance,
      color: 'primary.main' as const,
      progressColor: 'primary' as const
    },
    {
      title: 'Team Efficiency',
      value: insights.teamMetrics.teamEfficiency,
      color: 'success.main' as const,
      progressColor: 'success' as const
    },
    {
      title: 'Team Cohesion',
      value: insights.collaboration.teamCohesion,
      color: 'info.main' as const,
      progressColor: 'info' as const
    },
    {
      title: 'Workload Balance',
      value: insights.teamMetrics.workloadBalance,
      color: 'warning.main' as const,
      progressColor: 'warning' as const
    }
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color={card.color}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.title}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={card.value}
                color={card.progressColor}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TeamOverviewCards;