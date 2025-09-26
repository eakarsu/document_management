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
import { PerformanceMetrics, Insight, PredictiveAnalytics, BenchmarkData } from './types';

export const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'UP': return TrendingUp;
    case 'DOWN': return TrendingDown;
    case 'STABLE': return TrendingFlat;
    default: return TrendingFlat;
  }
};

export const getTrendColor = (trend: string, positive: boolean): string => {
  if (trend === 'STABLE') return 'info';
  if (positive) {
    return trend === 'UP' ? 'success' : 'error';
  } else {
    return trend === 'DOWN' ? 'success' : 'error';
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'OPPORTUNITY': return 'success';
    case 'RISK': return 'error';
    case 'ACHIEVEMENT': return 'primary';
    case 'ALERT': return 'warning';
    default: return 'default';
  }
};

export const getPriorityColor = (priority: string): string => {
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
    case 'PERFORMANCE': return Assessment;
    case 'EFFICIENCY': return Speed;
    case 'QUALITY': return Star;
    case 'COST': return TrendingUp;
    case 'USER_BEHAVIOR': return Group;
    case 'PREDICTION': return Timeline;
    case 'ANOMALY': return Warning;
    default: return Insights;
  }
};

export const generateMockData = (docTitle: string, docCategory?: string) => {
  const mockPerformanceMetrics: PerformanceMetrics = {
    workflowEfficiency: { current: 78, previous: 72, change: 8.3, trend: 'UP' },
    averageProcessingTime: { current: 24, previous: 28, change: -14.3, trend: 'DOWN' },
    qualityScore: { current: 85, previous: 82, change: 3.7, trend: 'UP' },
    userSatisfaction: { current: 4.2, previous: 3.9, change: 7.7, trend: 'UP' },
    costPerWorkflow: { current: 125, previous: 145, change: -13.8, trend: 'DOWN' },
    automationRate: { current: 65, previous: 58, change: 12.1, trend: 'UP' }
  };

  const mockInsights: Insight[] = [
    {
      id: 'insight-1',
      type: 'EFFICIENCY',
      category: 'OPPORTUNITY',
      priority: 'HIGH',
      title: `Workflow Optimization for "${docTitle}"`,
      description: `Analysis of "${docTitle}" shows this document type could benefit from parallel processing, potentially reducing processing time by 35%`,
      findings: [
        `"${docTitle}" type documents have independent review steps`,
        `Sequential processing for "${docTitle}" adds average 18 hours to workflow time`,
        `Similar documents like "${docTitle}" show legal and compliance reviews rarely have dependencies`
      ],
      recommendations: [
        `Implement parallel processing for "${docTitle}" and similar document types`,
        `Create reviewer availability matrix optimized for "${docTitle}" workflow`,
        `Set up automated dependency detection for "${docTitle}" category`
      ],
      impact: {
        financial: 45000,
        efficiency: 35,
        timeImpact: 520,
        qualityImpact: 5
      },
      confidence: 92,
      dataPoints: 347,
      timeframe: 'Last 3 months',
      affectedWorkflows: ['Policy Review', 'Compliance Documentation', 'Standard Procedures'],
      relatedInsights: ['insight-3'],
      actionable: true,
      suggestedActions: [
        {
          action: 'Enable parallel processing for top 3 workflow types',
          effort: 'MEDIUM',
          timeline: '2-3 weeks',
          expectedOutcome: '25% reduction in processing time'
        },
        {
          action: 'Train reviewers on parallel workflow procedures',
          effort: 'LOW',
          timeline: '1 week',
          expectedOutcome: 'Improved reviewer coordination'
        }
      ]
    },
    {
      id: 'insight-2',
      type: 'QUALITY',
      category: 'ACHIEVEMENT',
      priority: 'MEDIUM',
      title: `Quality Analysis for "${docTitle}"`,
      description: `Quality analysis of "${docTitle}" and similar documents shows 15% improvement over the past quarter, with AI-assisted reviews showing highest quality gains`,
      findings: [
        `AI-assisted reviews for "${docTitle}" type have 23% higher quality scores`,
        `Revision cycles for "${docTitle}" reduced from 2.3 to 1.7 on average`,
        `User satisfaction with "${docTitle}" final versions increased to 4.2/5`
      ],
      recommendations: [
        `Expand AI assistance to all "${docCategory}" documents`,
        'Document and share quality improvement best practices',
        'Recognize high-performing review teams'
      ],
      impact: {
        financial: 12000,
        efficiency: 15,
        timeImpact: 180,
        qualityImpact: 15
      },
      confidence: 88,
      dataPoints: 234,
      timeframe: 'Last quarter',
      affectedWorkflows: ['All workflow types'],
      relatedInsights: ['insight-4'],
      actionable: true,
      suggestedActions: [
        {
          action: 'Implement AI assistance for remaining 35% of workflows',
          effort: 'MEDIUM',
          timeline: '3-4 weeks',
          expectedOutcome: 'Additional 10% quality improvement'
        }
      ]
    },
    {
      id: 'insight-3',
      type: 'PERFORMANCE',
      category: 'RISK',
      priority: 'CRITICAL',
      title: 'Bottleneck Pattern in Legal Reviews',
      description: 'Legal review step consistently causes 40% of workflow delays, with peak bottlenecks occurring on Mondays and Fridays',
      findings: [
        'Legal team capacity is 85% utilized during peak times',
        'Monday backlogs cause average 2.5 day delays',
        'Friday submissions often delayed until following week'
      ],
      recommendations: [
        'Implement smart scheduling to distribute legal review load',
        'Add backup legal reviewer for peak periods',
        'Create triage system for urgent vs. routine legal reviews'
      ],
      impact: {
        financial: -25000,
        efficiency: -20,
        timeImpact: -480,
        qualityImpact: -5
      },
      confidence: 95,
      dataPoints: 456,
      timeframe: 'Last 6 months',
      affectedWorkflows: ['Contract Review', 'Policy Approval', 'Compliance Documentation'],
      relatedInsights: ['insight-1'],
      actionable: true,
      suggestedActions: [
        {
          action: 'Hire additional part-time legal reviewer',
          effort: 'HIGH',
          timeline: '4-6 weeks',
          expectedOutcome: '50% reduction in legal review delays'
        },
        {
          action: 'Implement smart scheduling system',
          effort: 'MEDIUM',
          timeline: '2-3 weeks',
          expectedOutcome: '30% better load distribution'
        }
      ]
    },
    {
      id: 'insight-4',
      type: 'PREDICTION',
      category: 'ALERT',
      priority: 'HIGH',
      title: 'Upcoming Peak Workload Predicted',
      description: 'AI models predict 40% increase in workflow volume over next 2 weeks due to quarter-end document submissions',
      findings: [
        'Historical data shows consistent Q4 volume spikes',
        'Current pipeline has 60% more draft documents than usual',
        'Resource utilization will exceed 95% capacity'
      ],
      recommendations: [
        'Proactively schedule additional reviewer hours',
        'Activate expedited review processes for routine documents',
        'Communicate with stakeholders about potential delays'
      ],
      impact: {
        financial: -15000,
        efficiency: -15,
        timeImpact: -240,
        qualityImpact: -8
      },
      confidence: 87,
      dataPoints: 189,
      timeframe: 'Next 2 weeks',
      affectedWorkflows: ['All workflow types'],
      relatedInsights: ['insight-3'],
      actionable: true,
      suggestedActions: [
        {
          action: 'Schedule overtime reviewer hours',
          effort: 'LOW',
          timeline: 'Immediate',
          expectedOutcome: 'Maintain service levels during peak'
        },
        {
          action: 'Activate fast-track process for routine documents',
          effort: 'LOW',
          timeline: 'Immediate',
          expectedOutcome: '20% faster processing for 70% of documents'
        }
      ]
    },
    {
      id: 'insight-5',
      type: 'COST',
      category: 'OPPORTUNITY',
      priority: 'MEDIUM',
      title: 'Automation ROI Exceeding Expectations',
      description: 'AI-powered automation features are delivering 150% of projected ROI, with potential for further expansion',
      findings: [
        'Automated routing saves 12 hours per workflow on average',
        'AI quality checks reduce revision cycles by 30%',
        'Smart notifications improve response times by 45%'
      ],
      recommendations: [
        'Expand automation to additional workflow steps',
        'Invest in advanced AI capabilities',
        'Create automation success metrics dashboard'
      ],
      impact: {
        financial: 67000,
        efficiency: 25,
        timeImpact: 720,
        qualityImpact: 12
      },
      confidence: 90,
      dataPoints: 298,
      timeframe: 'Last 6 months',
      affectedWorkflows: ['Automated workflows'],
      relatedInsights: ['insight-2'],
      actionable: true,
      suggestedActions: [
        {
          action: 'Implement AI document classification',
          effort: 'HIGH',
          timeline: '6-8 weeks',
          expectedOutcome: 'Additional 20% efficiency gain'
        },
        {
          action: 'Add predictive deadline management',
          effort: 'MEDIUM',
          timeline: '3-4 weeks',
          expectedOutcome: '15% reduction in deadline misses'
        }
      ]
    }
  ];

  const mockPredictiveAnalytics: PredictiveAnalytics = {
    workloadPrediction: {
      nextWeek: 125,
      nextMonth: 480,
      peakTimes: ['Monday 9-11 AM', 'Friday 2-4 PM'],
      capacityUtilization: 87
    },
    bottleneckPrediction: {
      likelyBottlenecks: ['Legal Review', 'Final Approval'],
      riskLevel: 75,
      preventiveMeasures: ['Add backup reviewers', 'Implement triage system', 'Enable parallel processing']
    },
    qualityForecast: {
      expectedQualityScore: 87,
      qualityTrends: ['Improving documentation standards', 'Better AI assistance adoption'],
      riskFactors: ['Peak workload periods', 'New reviewer onboarding']
    }
  };

  const mockBenchmarkData: BenchmarkData = {
    industryAverage: {
      processingTime: 32,
      qualityScore: 78,
      automationRate: 45,
      userSatisfaction: 3.6
    },
    organizationRanking: {
      percentile: 78,
      strengths: ['Automation adoption', 'Quality scores', 'User satisfaction'],
      improvementAreas: ['Processing speed', 'Cost efficiency']
    },
    competitiveInsights: [
      'Above average in quality and automation',
      'Processing time competitive but not leading',
      'Strong user satisfaction indicates good process design'
    ]
  };

  return {
    mockPerformanceMetrics,
    mockInsights,
    mockPredictiveAnalytics,
    mockBenchmarkData
  };
};