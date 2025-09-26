import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import { MetricTrend } from '@/types/ai-insights';
import { getTrendIcon, getTrendColor } from './utils';

interface PerformanceMetricsCardProps {
  title: string;
  metric: MetricTrend;
  unit?: string;
  positive?: boolean;
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  title,
  metric,
  unit = '%',
  positive = true
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">{title}</Typography>
          {getTrendIcon(metric.trend)}
        </Box>
        <Typography variant="h3" color="primary.main">
          {unit === '$' ? unit : ''}{metric.current}{unit === '%' || unit === 'h' || unit === '/5' ? unit : ''}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography
            variant="body2"
            color={getTrendColor(metric.trend, positive) + '.main'}
          >
            {metric.change > 0 ? '+' : ''}
            {metric.change}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            vs previous period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard;