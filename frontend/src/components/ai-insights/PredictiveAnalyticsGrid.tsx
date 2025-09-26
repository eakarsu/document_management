import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Timeline,
  Warning,
  Star,
  CheckCircle
} from '@mui/icons-material';
import { PredictiveAnalytics } from './types';

interface PredictiveAnalyticsGridProps {
  predictiveAnalytics: PredictiveAnalytics;
}

const PredictiveAnalyticsGrid: React.FC<PredictiveAnalyticsGridProps> = ({ predictiveAnalytics }) => {
  return (
    <Grid container spacing={3}>
      {/* Workload Prediction */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ mr: 1 }} />
              Workload Prediction
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Next Week</Typography>
              <Typography variant="h4" color="primary.main">
                {predictiveAnalytics.workloadPrediction.nextWeek}
              </Typography>
              <Typography variant="caption">workflows</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Next Month</Typography>
              <Typography variant="h4" color="primary.main">
                {predictiveAnalytics.workloadPrediction.nextMonth}
              </Typography>
              <Typography variant="caption">workflows</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Capacity Utilization</Typography>
              <LinearProgress
                variant="determinate"
                value={predictiveAnalytics.workloadPrediction.capacityUtilization}
                color={predictiveAnalytics.workloadPrediction.capacityUtilization > 90 ? 'error' : 'primary'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption">
                {predictiveAnalytics.workloadPrediction.capacityUtilization}% capacity
              </Typography>
            </Box>
            <Typography variant="subtitle2" gutterBottom>Peak Times</Typography>
            {predictiveAnalytics.workloadPrediction.peakTimes.map((time, index) => (
              <Chip key={index} label={time} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Bottleneck Prediction */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Warning sx={{ mr: 1 }} />
              Bottleneck Prediction
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Risk Level</Typography>
              <LinearProgress
                variant="determinate"
                value={predictiveAnalytics.bottleneckPrediction.riskLevel}
                color={predictiveAnalytics.bottleneckPrediction.riskLevel > 70 ? 'error' : 'warning'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption">
                {predictiveAnalytics.bottleneckPrediction.riskLevel}% risk
              </Typography>
            </Box>
            <Typography variant="subtitle2" gutterBottom>Likely Bottlenecks</Typography>
            {predictiveAnalytics.bottleneckPrediction.likelyBottlenecks.map((bottleneck, index) => (
              <Chip key={index} label={bottleneck} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Preventive Measures</Typography>
            <List dense>
              {predictiveAnalytics.bottleneckPrediction.preventiveMeasures.map((measure, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={measure} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Quality Forecast */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Star sx={{ mr: 1 }} />
              Quality Forecast
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Expected Quality Score</Typography>
              <Typography variant="h4" color="success.main">
                {predictiveAnalytics.qualityForecast.expectedQualityScore}%
              </Typography>
            </Box>
            <Typography variant="subtitle2" gutterBottom>Quality Trends</Typography>
            {predictiveAnalytics.qualityForecast.qualityTrends.map((trend, index) => (
              <Chip key={index} label={trend} size="small" color="success" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Risk Factors</Typography>
            {predictiveAnalytics.qualityForecast.riskFactors.map((risk, index) => (
              <Chip key={index} label={risk} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PredictiveAnalyticsGrid;