import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress
} from '@mui/material';
import { Assessment, TrendingUp } from '@mui/icons-material';
import { WorkflowAnalysis } from '@/types/workflow-optimizer';

interface WorkflowPerformanceCardProps {
  analysis: WorkflowAnalysis;
  totalImpact?: {
    timeReduction: number;
    efficiencyGain: number;
    costSavings: number;
  };
  selectedSuggestionsCount: number;
}

export const WorkflowPerformanceCard: React.FC<WorkflowPerformanceCardProps> = ({
  analysis,
  totalImpact = { timeReduction: 0, efficiencyGain: 0, costSavings: 0 },
  selectedSuggestionsCount
}) => {
  return (
    <>
      {/* Current Performance */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              Current Performance
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Avg. Completion Time</Typography>
                <Typography variant="h6">{analysis.currentPerformance.averageCompletionTime}h</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                <Typography variant="h6" color="success.main">
                  {analysis.currentPerformance.successRate}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Bottlenecks</Typography>
                <Typography variant="h6" color="error.main">
                  {analysis.currentPerformance.bottleneckCount}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Efficiency</Typography>
                <Typography variant="h6" color="warning.main">
                  {analysis.currentPerformance.efficiency}%
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Overall Efficiency</Typography>
              <LinearProgress
                variant="determinate"
                value={analysis.currentPerformance.efficiency}
                color={analysis.currentPerformance.efficiency > 80 ? 'success' : 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Projected Impact */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Projected Impact
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Time Reduction</Typography>
                <Typography variant="h6" color="success.main">
                  {totalImpact.timeReduction}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Efficiency Gain</Typography>
                <Typography variant="h6" color="success.main">
                  +{totalImpact.efficiencyGain}%
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Monthly Savings</Typography>
                <Typography variant="h6" color="primary.main">
                  {totalImpact.costSavings} hours
                </Typography>
              </Grid>
            </Grid>

            {selectedSuggestionsCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Expected Efficiency</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(analysis.currentPerformance.efficiency + totalImpact.efficiencyGain, 100)}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default WorkflowPerformanceCard;