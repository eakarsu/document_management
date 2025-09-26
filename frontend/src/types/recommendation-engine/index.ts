export interface SmartRecommendationEngineProps {
  organizationId: string;
  currentContext?: {
    documentId?: string;
    workflowId?: string;
    userId?: string;
  };
  onRecommendationApplied?: (recommendation: Recommendation) => void;
}

export interface Recommendation {
  id: string;
  type: 'PROCESS_OPTIMIZATION' | 'WORKFLOW_AUTOMATION' | 'REVIEWER_ASSIGNMENT' | 'DEADLINE_MANAGEMENT' | 'QUALITY_IMPROVEMENT' | 'COLLABORATION_ENHANCEMENT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  rationale: string;
  confidence: number; // 0-100
  impact: {
    efficiency: number; // percentage improvement
    timeReduction: number; // hours saved
    qualityImprovement: number; // percentage
    costSavings: number; // estimated dollars
  };
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedImplementationTime: number; // hours
  prerequisites: string[];
  steps: string[];
  riskFactors: string[];
  successMetrics: string[];
  tags: string[];
  applicableToCurrentContext: boolean;
  historicalSuccessRate: number; // percentage
}

export interface RecommendationFilter {
  types: string[];
  priorities: string[];
  complexities: string[];
  minConfidence: number;
  contextRelevant: boolean;
}

export interface RecommendationFeedback {
  recommendationId: string;
  helpful: boolean;
  implemented: boolean;
  actualImpact?: number;
  comments?: string;
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

export type SortBy = 'priority' | 'confidence' | 'impact' | 'relevance';
export type PriorityColor = 'error' | 'warning' | 'info' | 'success' | 'default';
export type ComplexityColor = 'success' | 'warning' | 'error' | 'default';