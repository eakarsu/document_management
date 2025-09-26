import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  WorkflowAnalysis,
  OptimizationResult,
  Document
} from '../../types/workflow-optimizer';

export const useWorkflowOptimizer = (workflowId?: string, organizationId?: string) => {
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.get('/api/documents/search?limit=20');

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const analyzeWorkflow = async () => {
    if (!workflowId && !selectedDocumentId) {
      setError('Please select a document to optimize its workflow');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Call the AI service for document-specific workflow optimization
      const response = await api.post('/api/ai-workflow/optimize-workflow', {
        documentId: selectedDocumentId,
        workflowId: workflowId,
        organizationId: organizationId
      });

      if (response.ok) {
        const aiResponse = await response.json();

        // Transform AI response to workflow analysis format
        if (aiResponse.success && aiResponse.optimization) {
          const opt = aiResponse.optimization;

          // Build workflow analysis from AI response
          const aiAnalysis: WorkflowAnalysis = {
            workflowId: workflowId || `doc-${selectedDocumentId}`,
            currentPerformance: {
              averageCompletionTime: opt.recommendedWorkflow?.estimatedDuration ?
                parseInt(opt.recommendedWorkflow.estimatedDuration) : 72,
              successRate: opt.documentAnalysis?.riskScore ?
                (100 - opt.documentAnalysis.riskScore) : 85,
              bottleneckCount: opt.bottleneckAnalysis?.identified?.length || 3,
              efficiency: opt.documentAnalysis?.complexity === 'HIGH' ? 65 :
                        opt.documentAnalysis?.complexity === 'MEDIUM' ? 75 : 85
            },
            bottlenecks: opt.bottleneckAnalysis?.identified?.map((bottleneck: string, index: number) => ({
              stepId: `step-${index + 1}`,
              stepName: bottleneck,
              averageTime: 24 + (index * 12),
              successRate: 85 - (index * 5),
              issueFrequency: 0.1 + (index * 0.05),
              impactScore: 8 - index,
              recommendations: opt.bottleneckAnalysis?.solutions?.slice(index * 2, (index + 1) * 2) || []
            })) || [],
            suggestions: opt.optimizations?.map((optimization: any, index: number) => ({
              id: `opt-${index + 1}`,
              type: optimization.impact === 'HIGH' ? 'PARALLEL_PROCESSING' :
                    optimization.impact === 'MEDIUM' ? 'AUTOMATION' : 'RULE_BASED',
              priority: optimization.impact || 'MEDIUM',
              title: optimization.title,
              description: optimization.description,
              impact: {
                timeReduction: parseInt(optimization.estimatedTimeSaving) || 30,
                efficiencyGain: optimization.impact === 'HIGH' ? 40 : 25,
                costSavings: optimization.impact === 'HIGH' ? 150 : 75
              },
              complexity: optimization.effort || 'MEDIUM',
              estimatedImplementationTime: optimization.effort === 'HIGH' ? 40 :
                                          optimization.effort === 'MEDIUM' ? 20 : 8,
              automationPotential: opt.automationOpportunities?.includes(optimization.title) ? 85 : 60
            })) || [],
            predictedImpact: {
              completionTimeReduction: opt.optimizations?.length ? opt.optimizations.length * 15 : 30,
              efficiencyIncrease: opt.automationOpportunities?.length ?
                opt.automationOpportunities.length * 10 : 25,
              costReduction: opt.optimizations?.filter((o: any) => o.impact === 'HIGH').length * 500 || 1500
            },
            implementationRoadmap: opt.recommendedWorkflow?.steps?.map((step: string, index: number) => ({
              phase: index + 1,
              title: step,
              duration: `Week ${index + 1}`,
              dependencies: index > 0 ? [`Phase ${index}`] : [],
              resources: opt.recommendedWorkflow?.requiredReviewers || 2,
              milestones: [`Complete ${step}`]
            })) || [],
            riskFactors: opt.bottleneckAnalysis?.identified || [],
            quickWins: []
          };

          setAnalysis(aiAnalysis);
          return; // Exit early if we got AI data
        }
      }

      // Fallback to mock data only if AI service fails
      console.warn('Using fallback mock data');
      const mockAnalysis: WorkflowAnalysis = {
        workflowId: workflowId || 'mock-workflow',
        currentPerformance: {
          averageCompletionTime: 72, // hours
          successRate: 85, // percentage
          bottleneckCount: 3,
          efficiency: 68 // percentage
        },
        bottlenecks: [
          {
            stepId: 'step-1',
            stepName: 'Initial Review',
            averageTime: 24,
            successRate: 90,
            issueFrequency: 0.15,
            impactScore: 8.5,
            recommendations: [
              `Add automated pre-screening for "${docTitle}" type documents`,
              `Implement parallel review for "${selectedDoc?.category}" documents`,
              `Set up auto-approval for low-risk "${selectedDoc?.category}" items`
            ]
          },
          {
            stepId: 'step-2',
            stepName: 'Legal Review',
            averageTime: 36,
            successRate: 78,
            issueFrequency: 0.22,
            impactScore: 9.2,
            recommendations: [
              `Create legal checklist template for "${selectedDoc?.category}" documents`,
              `Add AI legal compliance pre-check for "${docTitle}" workflow`,
              `Implement escalation rules for "${selectedDoc?.category}" complexity`
            ]
          },
          {
            stepId: 'step-3',
            stepName: 'Final Approval',
            averageTime: 12,
            successRate: 95,
            issueFrequency: 0.05,
            impactScore: 5.1,
            recommendations: [
              'Enable mobile approval',
              'Add approval deadline reminders'
            ]
          }
        ],
        suggestions: [
          {
            id: 'opt-1',
            type: 'PARALLEL_PROCESSING',
            priority: 'HIGH',
            title: 'Enable Parallel Processing',
            description: 'Allow multiple review steps to happen simultaneously for low-risk documents',
            impact: {
              timeReduction: 40,
              efficiencyGain: 35,
              costSavings: 120
            },
            complexity: 'MEDIUM',
            estimatedImplementationTime: 16,
            risks: ['Potential communication gaps', 'Coordination overhead'],
            benefits: ['Faster turnaround', 'Better resource utilization', 'Improved user satisfaction']
          },
          {
            id: 'opt-2',
            type: 'AUTO_APPROVAL',
            priority: 'HIGH',
            title: 'Implement Smart Auto-Approval',
            description: 'Automatically approve documents that meet predefined criteria using AI scoring',
            impact: {
              timeReduction: 60,
              efficiencyGain: 45,
              costSavings: 200
            },
            complexity: 'HIGH',
            estimatedImplementationTime: 32,
            risks: ['Quality concerns', 'Compliance risks'],
            benefits: ['Dramatic time savings', 'Consistent decisions', 'Focus on complex cases']
          },
          {
            id: 'opt-3',
            type: 'REVIEWER_OPTIMIZATION',
            priority: 'MEDIUM',
            title: 'AI-Powered Reviewer Assignment',
            description: 'Use AI to assign the most suitable reviewers based on expertise and workload',
            impact: {
              timeReduction: 25,
              efficiencyGain: 30,
              costSavings: 80
            },
            complexity: 'MEDIUM',
            estimatedImplementationTime: 20,
            risks: ['Learning curve', 'Reviewer preferences'],
            benefits: ['Better expertise matching', 'Balanced workload', 'Faster reviews']
          }
        ],
        riskFactors: [
          'High dependency on single reviewers',
          'No escalation procedures for delays',
          'Manual routing decisions',
          'Limited visibility into bottlenecks'
        ],
        quickWins: [
          {
            id: 'quick-1',
            type: 'CONDITIONAL_ROUTING',
            priority: 'LOW',
            title: 'Add Automatic Routing Rules',
            description: 'Set up rules to automatically route documents based on content type and urgency',
            impact: {
              timeReduction: 15,
              efficiencyGain: 20,
              costSavings: 40
            },
            complexity: 'LOW',
            estimatedImplementationTime: 8,
            risks: ['Initial setup complexity'],
            benefits: ['Reduced manual work', 'Consistent routing', 'Faster processing']
          }
        ]
      };

      setAnalysis(mockAnalysis);

    } catch (error) {
      console.error('Failed to analyze workflow:', error);
      setError('Failed to analyze workflow');
    } finally {
      setLoading(false);
    }
  };

  const applyOptimizations = async (
    onOptimizationComplete?: (result: OptimizationResult) => void
  ) => {
    try {
      setOptimizing(true);
      setError(null);

      // Mock optimization implementation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result: OptimizationResult = {
        originalWorkflowId: workflowId || 'mock-workflow',
        optimizedWorkflowId: 'optimized-' + Date.now(),
        improvements: Array.from(selectedSuggestions).map(id =>
          analysis?.suggestions.find(s => s.id === id)?.title || ''
        ).filter(Boolean),
        performanceGain: 42, // percentage
        estimatedSavings: {
          timePerWorkflow: 28, // hours
          monthlyHoursSaved: 340,
          annualCostSavings: 85000
        }
      };

      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }

      setSelectedSuggestions(new Set());

    } catch (error) {
      console.error('Failed to apply optimizations:', error);
      setError('Failed to apply optimizations');
    } finally {
      setOptimizing(false);
    }
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const calculateTotalImpact = () => {
    if (!analysis) return { timeReduction: 0, efficiencyGain: 0, costSavings: 0 };

    const selectedSuggestionsList = analysis.suggestions.filter(s => selectedSuggestions.has(s.id));
    return selectedSuggestionsList.reduce((total, suggestion) => ({
      timeReduction: Math.min(total.timeReduction + suggestion.impact.timeReduction, 85), // Cap at 85%
      efficiencyGain: Math.min(total.efficiencyGain + suggestion.impact.efficiencyGain, 90),
      costSavings: total.costSavings + suggestion.impact.costSavings
    }), { timeReduction: 0, efficiencyGain: 0, costSavings: 0 });
  };

  // Auto-fetch documents if no workflowId is provided
  useEffect(() => {
    if (!workflowId) {
      fetchDocuments();
    }
  }, []);

  // Auto-analyze if workflowId is provided
  useEffect(() => {
    if (workflowId) {
      analyzeWorkflow();
    }
  }, [workflowId, organizationId]);

  // Auto-analyze when document is selected
  useEffect(() => {
    if (!workflowId && selectedDocumentId && documents.length > 0) {
      analyzeWorkflow();
    }
  }, [selectedDocumentId, documents.length]);

  return {
    analysis,
    loading,
    optimizing,
    error,
    selectedSuggestions,
    documents,
    documentsLoading,
    selectedDocumentId,
    analyzeWorkflow,
    applyOptimizations,
    toggleSuggestion,
    calculateTotalImpact,
    setSelectedDocumentId,
    setAnalysis,
    setSelectedSuggestions
  };
};