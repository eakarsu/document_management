import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import { PerformanceMetrics } from './types';
import { getTrendIcon, getTrendColor } from './utils';

interface PerformanceMetricsGridProps {
  performanceMetrics: PerformanceMetrics;
}

const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({ performanceMetrics }) => {
  const TrendIcon = getTrendIcon(performanceMetrics.workflowEfficiency.trend);

  return (
    <Grid container spacing={3}>
      {/* Workflow Efficiency */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Workflow Efficiency</Typography>
              <TrendIcon color={getTrendColor(performanceMetrics.workflowEfficiency.trend, true) as any} />
            </Box>
            <Typography variant="h3" color="primary.main">
              {performanceMetrics.workflowEfficiency.current}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.workflowEfficiency.trend, true) + '.main'}
              >
                {performanceMetrics.workflowEfficiency.change > 0 ? '+' : ''}
                {performanceMetrics.workflowEfficiency.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Processing Time */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Avg Processing Time</Typography>
              {React.createElement(getTrendIcon(performanceMetrics.averageProcessingTime.trend), {
                color: getTrendColor(performanceMetrics.averageProcessingTime.trend, false) as any
              })}
            </Box>
            <Typography variant="h3" color="primary.main">
              {performanceMetrics.averageProcessingTime.current}h
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.averageProcessingTime.trend, false) + '.main'}
              >
                {performanceMetrics.averageProcessingTime.change > 0 ? '+' : ''}
                {performanceMetrics.averageProcessingTime.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quality Score */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Quality Score</Typography>
              {React.createElement(getTrendIcon(performanceMetrics.qualityScore.trend), {
                color: getTrendColor(performanceMetrics.qualityScore.trend, true) as any
              })}
            </Box>
            <Typography variant="h3" color="primary.main">
              {performanceMetrics.qualityScore.current}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.qualityScore.trend, true) + '.main'}
              >
                {performanceMetrics.qualityScore.change > 0 ? '+' : ''}
                {performanceMetrics.qualityScore.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* User Satisfaction */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">User Satisfaction</Typography>
              {React.createElement(getTrendIcon(performanceMetrics.userSatisfaction.trend), {
                color: getTrendColor(performanceMetrics.userSatisfaction.trend, true) as any
              })}
            </Box>
            <Typography variant="h3" color="primary.main">
              {performanceMetrics.userSatisfaction.current}/5
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.userSatisfaction.trend, true) + '.main'}
              >
                {performanceMetrics.userSatisfaction.change > 0 ? '+' : ''}
                {performanceMetrics.userSatisfaction.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Cost per Workflow */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Cost per Workflow</Typography>
              {React.createElement(getTrendIcon(performanceMetrics.costPerWorkflow.trend), {
                color: getTrendColor(performanceMetrics.costPerWorkflow.trend, false) as any
              })}
            </Box>
            <Typography variant="h3" color="primary.main">
              ${performanceMetrics.costPerWorkflow.current}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.costPerWorkflow.trend, false) + '.main'}
              >
                {performanceMetrics.costPerWorkflow.change > 0 ? '+' : ''}
                {performanceMetrics.costPerWorkflow.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Automation Rate */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Automation Rate</Typography>
              {React.createElement(getTrendIcon(performanceMetrics.automationRate.trend), {
                color: getTrendColor(performanceMetrics.automationRate.trend, true) as any
              })}
            </Box>
            <Typography variant="h3" color="primary.main">
              {performanceMetrics.automationRate.current}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color={getTrendColor(performanceMetrics.automationRate.trend, true) + '.main'}
              >
                {performanceMetrics.automationRate.change > 0 ? '+' : ''}
                {performanceMetrics.automationRate.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs previous period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PerformanceMetricsGrid;