import { useReducer, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import {
  AIInsightsState,
  AIInsightsAction,
  Insight,
  PerformanceMetrics,
  PredictiveAnalytics,
  BenchmarkData,
  Document
} from './types';
import { generateMockData } from './utils';

const initialState: AIInsightsState = {
  insights: [],
  performanceMetrics: null,
  predictiveAnalytics: null,
  benchmarkData: null,
  visualizations: [],
  loading: false,
  error: null,
  selectedTimeRange: 'month',
  selectedTab: 0,
  filterType: 'ALL',
  filterPriority: 'ALL',
  selectedInsight: null,
  detailDialogOpen: false,
  selectedDocumentId: '',
  documents: [],
  documentsLoading: false,
};

function aiInsightsReducer(state: AIInsightsState, action: AIInsightsAction): AIInsightsState {
  switch (action.type) {
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload };
    case 'SET_PREDICTIVE_ANALYTICS':
      return { ...state, predictiveAnalytics: action.payload };
    case 'SET_BENCHMARK_DATA':
      return { ...state, benchmarkData: action.payload };
    case 'SET_VISUALIZATIONS':
      return { ...state, visualizations: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SELECTED_TIME_RANGE':
      return { ...state, selectedTimeRange: action.payload };
    case 'SET_SELECTED_TAB':
      return { ...state, selectedTab: action.payload };
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload };
    case 'SET_FILTER_PRIORITY':
      return { ...state, filterPriority: action.payload };
    case 'SET_SELECTED_INSIGHT':
      return { ...state, selectedInsight: action.payload };
    case 'SET_DETAIL_DIALOG_OPEN':
      return { ...state, detailDialogOpen: action.payload };
    case 'SET_SELECTED_DOCUMENT_ID':
      return { ...state, selectedDocumentId: action.payload };
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'SET_DOCUMENTS_LOADING':
      return { ...state, documentsLoading: action.payload };
    case 'UPDATE_INSIGHT':
      return {
        ...state,
        insights: state.insights.map(insight =>
          insight.id === action.payload.id
            ? { ...insight, ...action.payload.updates }
            : insight
        )
      };
    case 'CLEAR_DATA':
      return {
        ...state,
        insights: [],
        performanceMetrics: null,
        predictiveAnalytics: null,
        benchmarkData: null,
        visualizations: []
      };
    default:
      return state;
  }
}

export const useAIInsights = (organizationId: string, onInsightAction?: (insight: Insight, action: string) => void) => {
  const [state, dispatch] = useReducer(aiInsightsReducer, initialState);

  const fetchDocuments = useCallback(async () => {
    try {
      dispatch({ type: 'SET_DOCUMENTS_LOADING', payload: true });
      const response = await api.get('/api/documents/search?limit=20');

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_DOCUMENTS', payload: data.documents || [] });
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      dispatch({ type: 'SET_DOCUMENTS_LOADING', payload: false });
    }
  }, []);

  const generateInsights = useCallback(async () => {
    if (!state.selectedDocumentId) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a document to generate AI insights' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const selectedDoc = state.documents.find(doc => doc.id === state.selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Call the AI service for insights
      const response = await api.post('/api/ai-workflow/generate-insights', {
        documentId: state.selectedDocumentId,
        organizationId: organizationId,
        timeRange: state.selectedTimeRange
      });

      if (response.ok) {
        const aiResponse = await response.json();

        // Process AI insights and transform to UI format
        if (aiResponse.success && aiResponse.insights) {
          const insights = aiResponse.insights;

          // Transform AI response to UI format
          const performanceData: PerformanceMetrics = {
            workflowEfficiency: {
              current: insights.efficiencyMetrics?.overall || 78,
              previous: 72,
              change: insights.efficiencyMetrics?.improvement || 8.3,
              trend: insights.efficiencyMetrics?.improvement > 0 ? 'UP' : 'DOWN'
            },
            averageProcessingTime: {
              current: insights.performanceMetrics?.avgProcessingTime || 24,
              previous: 28,
              change: -14.3,
              trend: 'DOWN'
            },
            qualityScore: {
              current: insights.performanceMetrics?.qualityScore || 85,
              previous: 82,
              change: 3.7,
              trend: 'UP'
            },
            userSatisfaction: {
              current: insights.teamMetrics?.satisfactionScore || 4.2,
              previous: 3.9,
              change: 7.7,
              trend: 'UP'
            },
            costPerWorkflow: {
              current: insights.costMetrics?.perWorkflow || 125,
              previous: 145,
              change: -13.8,
              trend: 'DOWN'
            },
            automationRate: {
              current: insights.automationMetrics?.rate || 65,
              previous: 58,
              change: 12.1,
              trend: 'UP'
            }
          };

          dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: performanceData });

          // Process insights into actionable items
          const processedInsights: Insight[] = insights.recommendations?.map((rec: any, index: number) => ({
            id: `insight-${index}`,
            title: rec.title || 'Workflow Optimization',
            description: rec.description || rec,
            impact: rec.impact || 'HIGH',
            category: rec.category || 'EFFICIENCY',
            action: rec.action || 'Implement suggested changes',
            potentialSavings: rec.savings || '15% time reduction',
            status: 'NEW'
          })) || [];

          // Add document-specific insights if available
          if (aiResponse.documentInsights) {
            const docAnalysis = aiResponse.documentInsights.documentAnalysis;
            if (docAnalysis) {
              processedInsights.unshift({
                id: 'doc-insight-1',
                title: `Document Analysis: ${selectedDoc?.title}`,
                description: `Risk Score: ${docAnalysis.riskScore}, Complexity: ${docAnalysis.complexity}`,
                impact: {
                  financial: docAnalysis.riskScore > 50 ? 80 : 40,
                  efficiency: docAnalysis.riskScore > 50 ? 70 : 30,
                  timeImpact: docAnalysis.riskScore > 50 ? 60 : 20,
                  qualityImpact: docAnalysis.riskScore > 50 ? 90 : 50
                },
                category: 'RISK',
                type: 'EFFICIENCY',
                priority: 'HIGH',
                findings: [],
                recommendations: [],
                timestamp: new Date(),
                confidence: 0.8,
                source: 'DOCUMENT_ANALYSIS',
                metadata: {},
                isImplemented: false,
                estimatedSavings: 0
              } as any);
            }
          }

          dispatch({ type: 'SET_INSIGHTS', payload: processedInsights });

          // Use predictive data from AI if available
          if (insights.predictiveAnalytics) {
            dispatch({ type: 'SET_PREDICTIVE_ANALYTICS', payload: insights.predictiveAnalytics });
          } else {
            // Set default predictive analytics
            const defaultPredictive: PredictiveAnalytics = {
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
            dispatch({ type: 'SET_PREDICTIVE_ANALYTICS', payload: defaultPredictive });
          }

          // Use benchmark data from AI if available
          if (insights.benchmarkData) {
            dispatch({ type: 'SET_BENCHMARK_DATA', payload: insights.benchmarkData });
          } else {
            // Set default benchmark data
            const defaultBenchmark: BenchmarkData = {
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
            dispatch({ type: 'SET_BENCHMARK_DATA', payload: defaultBenchmark });
          }

          return; // Exit early if we got AI data
        }
      }

      // Fallback to mock data only if AI service fails
      console.warn('Using fallback mock data');
      const { mockPerformanceMetrics, mockInsights, mockPredictiveAnalytics, mockBenchmarkData } =
        generateMockData(docTitle, selectedDoc?.category);

      dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: mockPerformanceMetrics });
      dispatch({ type: 'SET_INSIGHTS', payload: mockInsights });
      dispatch({ type: 'SET_PREDICTIVE_ANALYTICS', payload: mockPredictiveAnalytics });
      dispatch({ type: 'SET_BENCHMARK_DATA', payload: mockBenchmarkData });

    } catch (error) {
      console.error('Failed to generate insights:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? (error as Error).message : 'Failed to generate insights'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.selectedDocumentId, state.documents, organizationId, state.selectedTimeRange]);

  const executeInsightAction = useCallback(async (insight: Insight, action: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Mock action execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onInsightAction) {
        onInsightAction(insight, action);
      }

      // Update insight status or remove from actionable list
      dispatch({
        type: 'UPDATE_INSIGHT',
        payload: {
          id: insight.id,
          updates: { actionable: false }
        }
      });

    } catch (error) {
      console.error('Failed to execute insight action:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? (error as Error).message : 'Failed to execute action'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [onInsightAction]);

  const getFilteredInsights = useCallback(() => {
    return state.insights.filter(insight => {
      if (state.filterType !== 'ALL' && insight.type !== state.filterType) return false;
      if (state.filterPriority !== 'ALL' && insight.priority !== state.filterPriority) return false;
      return true;
    });
  }, [state.insights, state.filterType, state.filterPriority]);

  const handleDocumentChange = useCallback((documentId: string) => {
    dispatch({ type: 'SET_SELECTED_DOCUMENT_ID', payload: documentId });
    // Clear previous data when switching documents
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  // Fetch documents on hook initialization
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Generate insights when document or time range changes
  useEffect(() => {
    if (state.selectedDocumentId && state.documents.length > 0) {
      generateInsights();
    }
  }, [state.selectedDocumentId, state.documents, generateInsights]);

  return {
    state,
    actions: {
      setSelectedTimeRange: (timeRange: 'week' | 'month' | 'quarter' | 'year') =>
        dispatch({ type: 'SET_SELECTED_TIME_RANGE', payload: timeRange }),
      setSelectedTab: (tab: number) =>
        dispatch({ type: 'SET_SELECTED_TAB', payload: tab }),
      setFilterType: (type: string) =>
        dispatch({ type: 'SET_FILTER_TYPE', payload: type }),
      setFilterPriority: (priority: string) =>
        dispatch({ type: 'SET_FILTER_PRIORITY', payload: priority }),
      setSelectedInsight: (insight: Insight | null) =>
        dispatch({ type: 'SET_SELECTED_INSIGHT', payload: insight }),
      setDetailDialogOpen: (open: boolean) =>
        dispatch({ type: 'SET_DETAIL_DIALOG_OPEN', payload: open }),
      handleDocumentChange,
      generateInsights,
      executeInsightAction,
      getFilteredInsights,
    }
  };
};