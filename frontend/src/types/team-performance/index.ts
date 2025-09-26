export interface AITeamPerformanceDashboardProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onInsightsGenerated?: (insights: TeamPerformanceInsights) => void;
}

export interface TeamMemberPerformance {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  performance: {
    overallScore: number; // 0-100
    productivity: number; // 0-100
    quality: number; // 0-100
    collaboration: number; // 0-100
    efficiency: number; // 0-100
  };
  metrics: {
    documentsReviewed: number;
    averageReviewTime: number; // hours
    approvalRate: number; // percentage
    rejectionRate: number; // percentage
    responseTime: number; // hours
    workloadCapacity: number; // percentage
    mentorshipScore: number; // 0-100
  };
  trends: {
    performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    productivityChange: number; // percentage change
    qualityChange: number; // percentage change
    workloadTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };
  strengths: string[];
  improvementAreas: string[];
  aiRecommendations: string[];
}

export interface TeamCollaborationMetrics {
  teamCohesion: number; // 0-100
  communicationEfficiency: number; // 0-100
  knowledgeSharing: number; // 0-100
  conflictResolution: number; // 0-100
  crossFunctionalWork: number; // 0-100
  mentorshipActivity: number; // 0-100
}

export interface ProductivityInsight {
  type: 'BOTTLENECK' | 'OPPORTUNITY' | 'STRENGTH' | 'RISK';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedMembers: string[];
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  recommendedActions: string[];
  estimatedImprovement: number; // percentage
}

export interface TeamPerformanceInsights {
  organizationId: string;
  timeRange: string;
  analyzedAt: Date;
  teamMembers: TeamMemberPerformance[];
  teamMetrics: {
    averagePerformance: number;
    totalProductivity: number;
    teamEfficiency: number;
    collaborationIndex: number;
    workloadBalance: number;
    knowledgeDistribution: number;
  };
  collaboration: TeamCollaborationMetrics;
  insights: ProductivityInsight[];
  topPerformers: string[];
  riskyMembers: string[];
  recommendations: {
    teamLevel: string[];
    individualLevel: { [userId: string]: string[] };
  };
  predictiveAnalytics: {
    burnoutRisk: { userId: string; riskLevel: number }[];
    promotionCandidates: string[];
    trainingNeeds: { skill: string; members: string[] }[];
  };
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