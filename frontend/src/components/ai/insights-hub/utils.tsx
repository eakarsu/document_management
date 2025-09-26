import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Assessment,
  Speed,
  Star,
  Group,
  Timeline,
  Warning,
  Insights
} from '@mui/icons-material';

export const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'UP': return <TrendingUp color="success" />;
    case 'DOWN': return <TrendingDown color="error" />;
    case 'STABLE': return <TrendingFlat color="info" />;
    default: return <TrendingFlat />;
  }
};

export const getTrendColor = (trend: string, positive: boolean) => {
  if (trend === 'STABLE') return 'info';
  if (positive) {
    return trend === 'UP' ? 'success' : 'error';
  } else {
    return trend === 'DOWN' ? 'success' : 'error';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'OPPORTUNITY': return 'success';
    case 'RISK': return 'error';
    case 'ACHIEVEMENT': return 'primary';
    case 'ALERT': return 'warning';
    default: return 'default';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'PERFORMANCE': return <Assessment />;
    case 'EFFICIENCY': return <Speed />;
    case 'QUALITY': return <Star />;
    case 'COST': return <TrendingUp />;
    case 'USER_BEHAVIOR': return <Group />;
    case 'PREDICTION': return <Timeline />;
    case 'ANOMALY': return <Warning />;
    default: return <Insights />;
  }
};