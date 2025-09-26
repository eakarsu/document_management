export interface AIDecisionSupportProps {
  documentId?: string;
  workflowId?: string;
  publishingId?: string;
  organizationId: string;
  currentStep?: string;
  onDecisionMade?: (decision: DecisionResult) => void;
}

export interface DecisionFactor {
  id: string;
  name: string;
  category: 'RISK' | 'COMPLIANCE' | 'QUALITY' | 'BUSINESS' | 'TECHNICAL';
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impact: number; // -100 to +100
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  recommendations: string[];
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  overallScore: number; // 0-100
  confidence: number; // 0-100
  pros: string[];
  cons: string[];
  risks: {
    type: string;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    mitigation: string;
  }[];
  benefits: {
    type: string;
    value: number;
    description: string;
  }[];
  implementation: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
    resources: string[];
    steps: string[];
  };
  compliance: {
    status: 'COMPLIANT' | 'REQUIRES_REVIEW' | 'NON_COMPLIANT';
    issues: string[];
    requirements: string[];
  };
}

export interface DecisionAnalysis {
  documentId: string;
  context: {
    documentType: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    stakeholders: string[];
    businessImpact: 'LOW' | 'MEDIUM' | 'HIGH';
    complianceRequirements: string[];
  };
  factors: DecisionFactor[];
  options: DecisionOption[];
  recommendation: {
    optionId: string;
    reasoning: string;
    confidence: number;
    alternativeOptions: string[];
    conditions: string[];
  };
  predictiveInsights: {
    timeToDecision: number; // hours
    successProbability: number; // percentage
    potentialBottlenecks: string[];
    escalationTriggers: string[];
  };
}

export interface DecisionResult {
  optionId: string;
  rationale: string;
  confidence: number;
  conditions: string[];
  nextSteps: string[];
}

export interface DecisionCriteria {
  risk: number;
  quality: number;
  compliance: number;
  business: number;
  timeline: number;
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