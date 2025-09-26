import { TrendingUp, TrendingDown, Warning, Star, CheckCircle, Insights } from '@mui/icons-material';

export const usePerformanceUtils = () => {
  const getPerformanceColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return TrendingUp;
      case 'DECLINING': return TrendingDown;
      default: return TrendingUp;
    }
  };

  const getTrendColor = (trend: string): 'success' | 'error' | 'disabled' => {
    switch (trend) {
      case 'IMPROVING': return 'success';
      case 'DECLINING': return 'error';
      default: return 'disabled';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'RISK': return Warning;
      case 'OPPORTUNITY': return Star;
      case 'STRENGTH': return CheckCircle;
      default: return Insights;
    }
  };

  const getInsightColor = (type: string): 'error' | 'primary' | 'success' => {
    switch (type) {
      case 'RISK': return 'error';
      case 'OPPORTUNITY': return 'primary';
      case 'STRENGTH': return 'success';
      default: return 'primary';
    }
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'success';
    }
  };

  const getWorkloadColor = (capacity: number): 'error' | 'warning' | 'success' => {
    if (capacity > 90) return 'error';
    if (capacity > 75) return 'warning';
    return 'success';
  };

  const getBurnoutRiskColor = (riskLevel: number): 'error' | 'warning' => {
    return riskLevel > 70 ? 'error' : 'warning';
  };

  return {
    getPerformanceColor,
    getTrendIcon,
    getTrendColor,
    getInsightIcon,
    getInsightColor,
    getPriorityColor,
    getWorkloadColor,
    getBurnoutRiskColor
  };
};