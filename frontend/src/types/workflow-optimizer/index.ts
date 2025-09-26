export interface AIWorkflowOptimizerProps {
  workflowId?: string;
  organizationId: string;
  onOptimizationComplete?: (result: OptimizationResult) => void;
}

export interface WorkflowBottleneck {
  stepId: string;
  stepName: string;
  averageTime: number;
  successRate: number;
  issueFrequency: number;
  impactScore: number;
  recommendations: string[];
}

export interface OptimizationSuggestion {
  id: string;
  type: 'PARALLEL_PROCESSING' | 'AUTO_APPROVAL' | 'REVIEWER_OPTIMIZATION' | 'STEP_ELIMINATION' | 'CONDITIONAL_ROUTING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: {
    timeReduction: number; // percentage
    efficiencyGain: number; // percentage
    costSavings: number; // estimated hours saved per month
  };
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedImplementationTime: number; // hours
  risks: string[];
  benefits: string[];
  automationPotential?: number; // percentage
}

export interface OptimizationResult {
  originalWorkflowId: string;
  optimizedWorkflowId: string;
  improvements: string[];
  performanceGain: number;
  estimatedSavings: {
    timePerWorkflow: number;
    monthlyHoursSaved: number;
    annualCostSavings: number;
  };
}

export interface WorkflowAnalysis {
  workflowId: string;
  currentPerformance: {
    averageCompletionTime: number;
    successRate: number;
    bottleneckCount: number;
    efficiency: number;
  };
  bottlenecks: WorkflowBottleneck[];
  suggestions: OptimizationSuggestion[];
  riskFactors: string[];
  quickWins: OptimizationSuggestion[];
  predictedImpact?: {
    completionTimeReduction: number;
    efficiencyIncrease: number;
    costReduction: number;
  };
  implementationRoadmap?: {
    phase: number;
    title: string;
    duration: string;
    dependencies: string[];
    resources: number;
    milestones: string[];
  }[];
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