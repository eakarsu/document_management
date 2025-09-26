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

export interface AIInsightsState {
  insights: Insight[];
  performanceMetrics: PerformanceMetrics | null;
  predictiveAnalytics: PredictiveAnalytics | null;
  benchmarkData: BenchmarkData | null;
  visualizations: VisualizationData[];
  loading: boolean;
  error: string | null;
  selectedTimeRange: 'week' | 'month' | 'quarter' | 'year';
  selectedTab: number;
  filterType: string;
  filterPriority: string;
  selectedInsight: Insight | null;
  detailDialogOpen: boolean;
  selectedDocumentId: string;
  documents: Document[];
  documentsLoading: boolean;
}

export type AIInsightsAction =
  | { type: 'SET_INSIGHTS'; payload: Insight[] }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_PREDICTIVE_ANALYTICS'; payload: PredictiveAnalytics }
  | { type: 'SET_BENCHMARK_DATA'; payload: BenchmarkData }
  | { type: 'SET_VISUALIZATIONS'; payload: VisualizationData[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_TIME_RANGE'; payload: 'week' | 'month' | 'quarter' | 'year' }
  | { type: 'SET_SELECTED_TAB'; payload: number }
  | { type: 'SET_FILTER_TYPE'; payload: string }
  | { type: 'SET_FILTER_PRIORITY'; payload: string }
  | { type: 'SET_SELECTED_INSIGHT'; payload: Insight | null }
  | { type: 'SET_DETAIL_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SELECTED_DOCUMENT_ID'; payload: string }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_DOCUMENTS_LOADING'; payload: boolean }
  | { type: 'UPDATE_INSIGHT'; payload: { id: string; updates: Partial<Insight> } }
  | { type: 'CLEAR_DATA' };