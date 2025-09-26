import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
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
import { BenchmarkData, PerformanceMetrics } from '@/types/ai-insights';

interface BenchmarksTabProps {
  benchmarkData: BenchmarkData;
  performanceMetrics?: PerformanceMetrics | null;
}

const BenchmarksTab: React.FC<BenchmarksTabProps> = ({ benchmarkData, performanceMetrics }) => {
  return (
    <Grid container spacing={3}>
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
                  {((benchmarkData.industryAverage.processingTime - (performanceMetrics?.averageProcessingTime.current || 0)) / benchmarkData.industryAverage.processingTime * 100).toFixed(1)}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Quality Score</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.qualityScore.current}% vs {benchmarkData.industryAverage.qualityScore}%
                </Typography>
                <Typography variant="caption" color="success.main">
                  {(((performanceMetrics?.qualityScore.current || 0) - benchmarkData.industryAverage.qualityScore) / benchmarkData.industryAverage.qualityScore * 100).toFixed(1)}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Automation Rate</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.automationRate.current}% vs {benchmarkData.industryAverage.automationRate}%
                </Typography>
                <Typography variant="caption" color="success.main">
                  {(((performanceMetrics?.automationRate.current || 0) - benchmarkData.industryAverage.automationRate) / benchmarkData.industryAverage.automationRate * 100).toFixed(1)}% better
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">User Satisfaction</Typography>
                <Typography variant="h6">
                  {performanceMetrics?.userSatisfaction.current}/5 vs {benchmarkData.industryAverage.userSatisfaction}/5
                </Typography>
                <Typography variant="caption" color="success.main">
                  {(((performanceMetrics?.userSatisfaction.current || 0) - benchmarkData.industryAverage.userSatisfaction) / benchmarkData.industryAverage.userSatisfaction * 100).toFixed(1)}% better
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

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

export default BenchmarksTab;