import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CompareArrows,
  EmojiEvents,
  Lightbulb
} from '@mui/icons-material';
import { BenchmarkData, PerformanceMetrics } from './types';

interface BenchmarksGridProps {
  benchmarkData: BenchmarkData;
  performanceMetrics: PerformanceMetrics | null;
}

const BenchmarksGrid: React.FC<BenchmarksGridProps> = ({ benchmarkData, performanceMetrics }) => {
  const calculateImprovement = (current: number, benchmark: number) => {
    return ((current - benchmark) / benchmark * 100).toFixed(1);
  };

  return (
    <Grid container spacing={3}>
      {/* Industry Benchmarks */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CompareArrows sx={{ mr: 1 }} />
              Industry Benchmarks
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Processing Time</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.averageProcessingTime.current}h vs {benchmarkData.industryAverage.processingTime}h
                </Typography>
                <Typography variant="caption" color="success.main">
                  {calculateImprovement(
                    benchmarkData.industryAverage.processingTime,
                    performanceMetrics?.averageProcessingTime.current || 0
                  )}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Quality Score</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.qualityScore.current}% vs {benchmarkData.industryAverage.qualityScore}%
                </Typography>
                <Typography variant="caption" color="success.main">
                  {calculateImprovement(
                    performanceMetrics?.qualityScore.current || 0,
                    benchmarkData.industryAverage.qualityScore
                  )}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Automation Rate</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.automationRate.current}% vs {benchmarkData.industryAverage.automationRate}%
                </Typography>
                <Typography variant="caption" color="success.main">
                  {calculateImprovement(
                    performanceMetrics?.automationRate.current || 0,
                    benchmarkData.industryAverage.automationRate
                  )}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">User Satisfaction</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.userSatisfaction.current}/5 vs {benchmarkData.industryAverage.userSatisfaction}/5
                </Typography>
                <Typography variant="caption" color="success.main">
                  {calculateImprovement(
                    performanceMetrics?.userSatisfaction.current || 0,
                    benchmarkData.industryAverage.userSatisfaction
                  )}% better
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Organization Ranking */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1 }} />
              Organization Ranking
            </Typography>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h3" color="primary.main">
                {benchmarkData.organizationRanking.percentile}th
              </Typography>
              <Typography variant="body2" color="text.secondary">
                percentile in industry
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>Strengths</Typography>
            {benchmarkData.organizationRanking.strengths.map((strength, index) => (
              <Chip key={index} label={strength} size="small" color="success" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Improvement Areas</Typography>
            {benchmarkData.organizationRanking.improvementAreas.map((area, index) => (
              <Chip key={index} label={area} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Competitive Insights */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Competitive Insights</Typography>
            <List>
              {benchmarkData.competitiveInsights.map((insight, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={insight} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default BenchmarksGrid;