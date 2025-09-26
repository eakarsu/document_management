import React from 'react';
import {
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { Recommendation } from '@/types/recommendation-engine';

interface QuickStatsProps {
  recommendations: Recommendation[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return null;
  }

  const highPriorityCount = recommendations.filter(r =>
    r.priority === 'CRITICAL' || r.priority === 'HIGH'
  ).length;

  const avgEfficiencyGain = Math.round(
    recommendations.reduce((sum, r) => sum + r.impact.efficiency, 0) / recommendations.length
  );

  const totalTimeReduction = recommendations.reduce(
    (sum, r) => sum + r.impact.timeReduction, 0
  );

  const contextRelevantCount = recommendations.filter(r =>
    r.applicableToCurrentContext
  ).length;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main">
            {highPriorityCount}
          </Typography>
          <Typography variant="caption">High Priority</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {avgEfficiencyGain}%
          </Typography>
          <Typography variant="caption">Avg Efficiency Gain</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">
            {totalTimeReduction}h
          </Typography>
          <Typography variant="caption">Total Time Savings</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {contextRelevantCount}
          </Typography>
          <Typography variant="caption">Context Relevant</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default QuickStats;