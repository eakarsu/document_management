export interface AIInsightsHubProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onInsightAction?: (insight: Insight, action: string) => void;
}

export interface MetricTrend {
  current: number;
  previous: number;
  change: number; // percentage change
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface PerformanceMetrics {
  workflowEfficiency: MetricTrend;
  averageProcessingTime: MetricTrend;
  qualityScore: MetricTrend;
  userSatisfaction: MetricTrend;
  costPerWorkflow: MetricTrend;
  automationRate: MetricTrend;
}

export interface Insight {
  id: string;
  type: 'PERFORMANCE' | 'EFFICIENCY' | 'QUALITY' | 'COST' | 'USER_BEHAVIOR' | 'PREDICTION' | 'ANOMALY';
  category: 'OPPORTUNITY' | 'RISK' | 'ACHIEVEMENT' | 'ALERT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  findings: string[];
  recommendations: string[];
  impact: {
    financial: number; // estimated dollar impact
    efficiency: number; // percentage improvement
    timeImpact: number; // hours saved/lost
    qualityImpact: number; // quality score impact
  };
  confidence: number; // 0-100
  dataPoints: number; // number of data points used
  timeframe: string;
  affectedWorkflows: string[];
  relatedInsights: string[];
  actionable: boolean;
  suggestedActions: {
    action: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
    expectedOutcome: string;
  }[];
}

export interface PredictiveAnalytics {
  workloadPrediction: {
    nextWeek: number;
    nextMonth: number;
    peakTimes: string[];
    capacityUtilization: number;
  };
  bottleneckPrediction: {
    likelyBottlenecks: string[];
    riskLevel: number;
    preventiveMeasures: string[];
  };
  qualityForecast: {
    expectedQualityScore: number;
    qualityTrends: string[];
    riskFactors: string[];
  };
}

export interface BenchmarkData {
  industryAverage: {
    processingTime: number;
    qualityScore: number;
    automationRate: number;
    userSatisfaction: number;
  };
  organizationRanking: {
    percentile: number;
    strengths: string[];
    improvementAreas: string[];
  };
  competitiveInsights: string[];
}

export interface VisualizationData {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
  insights: string[];
}

export interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}