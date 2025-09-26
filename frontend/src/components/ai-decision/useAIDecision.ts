import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  DecisionAnalysis,
  DecisionResult,
  DecisionCriteria,
  Document
} from './types';

export const useAIDecision = (
  organizationId: string,
  documentId?: string,
  onDecisionMade?: (decision: DecisionResult) => void
) => {
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionConditions, setDecisionConditions] = useState<string[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<DecisionCriteria>({
    risk: 25,
    quality: 25,
    compliance: 20,
    business: 20,
    timeline: 10
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(documentId || '');

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

  const generateMockAnalysis = (documentId: string, docTitle: string): DecisionAnalysis => {
    return {
      documentId: documentId,
      context: {
        documentType: `Document - "${docTitle}"`,
        urgency: 'HIGH',
        stakeholders: ['Legal Team', 'Compliance Officer', 'Management'],
        businessImpact: 'HIGH',
        complianceRequirements: ['SOX Compliance', 'Data Privacy', 'Industry Standards']
      },
      factors: [
        {
          id: 'factor-1',
          name: 'Regulatory Compliance Risk',
          category: 'COMPLIANCE',
          importance: 'CRITICAL',
          impact: -30,
          confidence: 92,
          description: 'The document contains provisions that may not align with new regulatory requirements',
          evidence: [
            'Recent regulatory updates (Jan 2024)',
            'Legal team concerns raised',
            'Compliance audit findings'
          ],
          recommendations: [
            'Conduct thorough legal review',
            'Update relevant sections',
            'Obtain compliance sign-off'
          ]
        },
        {
          id: 'factor-2',
          name: 'Business Process Efficiency',
          category: 'BUSINESS',
          importance: 'HIGH',
          impact: 45,
          confidence: 88,
          description: 'Implementation would streamline current processes and reduce operational overhead',
          evidence: [
            'Process analysis shows 30% efficiency gain',
            'Stakeholder feedback positive',
            'Historical data supports benefits'
          ],
          recommendations: [
            'Proceed with implementation',
            'Monitor efficiency metrics',
            'Provide adequate training'
          ]
        }
      ],
      options: [
        {
          id: 'option-1',
          title: `Approve "${docTitle}" with Conditions`,
          description: `Approve "${docTitle}" with specific conditions that must be met within 30 days`,
          overallScore: 78,
          confidence: 85,
          pros: [
            'Allows progress while addressing concerns',
            'Maintains momentum',
            'Provides safety net with conditions'
          ],
          cons: [
            'Requires ongoing monitoring',
            'May delay final implementation',
            'Conditional approval may create confusion'
          ],
          risks: [
            {
              type: 'Compliance Risk',
              level: 'MEDIUM',
              description: 'Conditions may not be met within timeframe',
              mitigation: 'Set up monitoring and escalation procedures'
            }
          ],
          benefits: [
            {
              type: 'Time Savings',
              value: 15,
              description: 'Saves 15 days compared to full revision'
            }
          ],
          implementation: {
            complexity: 'MEDIUM',
            timeline: '30 days',
            resources: ['Legal reviewer', 'Compliance officer', 'Project manager'],
            steps: [
              'Document specific conditions',
              'Set up monitoring process',
              'Assign responsibility',
              'Schedule review checkpoints'
            ]
          },
          compliance: {
            status: 'REQUIRES_REVIEW',
            issues: ['Need to address regulatory alignment'],
            requirements: ['Legal sign-off on conditions', 'Compliance monitoring plan']
          }
        },
        {
          id: 'option-2',
          title: `Request Major Revisions for "${docTitle}"`,
          description: `Send "${docTitle}" back for significant revisions to address identified issues`,
          overallScore: 65,
          confidence: 90,
          pros: [
            'Addresses all concerns thoroughly',
            'Ensures full compliance',
            'Higher quality final product'
          ],
          cons: [
            'Significant time delay',
            'Higher resource cost',
            'May impact project timeline'
          ],
          risks: [
            {
              type: 'Timeline Risk',
              level: 'HIGH',
              description: 'Could delay project by 6-8 weeks',
              mitigation: 'Parallel workstream planning'
            }
          ],
          benefits: [
            {
              type: 'Quality Improvement',
              value: 95,
              description: 'Ensures highest quality standards'
            }
          ],
          implementation: {
            complexity: 'HIGH',
            timeline: '6-8 weeks',
            resources: ['Document author', 'Legal team', 'Compliance team', 'Subject matter experts'],
            steps: [
              'Provide detailed revision requirements',
              'Set up revision timeline',
              'Assign revision team',
              'Schedule review milestones'
            ]
          },
          compliance: {
            status: 'COMPLIANT',
            issues: [],
            requirements: ['Full compliance review after revisions']
          }
        }
      ],
      recommendation: {
        optionId: 'option-1',
        reasoning: 'Conditional approval provides the best balance of progress and risk management. It addresses critical compliance concerns while allowing business continuity.',
        confidence: 82,
        alternativeOptions: ['option-2'],
        conditions: [
          'Legal review and sign-off within 15 days',
          'Compliance plan implementation within 30 days',
          'Regular monitoring checkpoints'
        ]
      },
      predictiveInsights: {
        timeToDecision: 4,
        successProbability: 85,
        potentialBottlenecks: [
          'Legal review scheduling',
          'Stakeholder availability',
          'Compliance verification process'
        ],
        escalationTriggers: [
          'Decision not made within 48 hours',
          'Stakeholder disagreement',
          'New compliance issues identified'
        ]
      }
    };
  };

  const analyzeDecision = async () => {
    if (!selectedDocumentId) {
      setError('Please select a document to analyze for decision support');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Try to call the AI service for document-specific decision analysis
      try {
        const response = await api.post('/api/ai-workflow/analyze-decision-support', {
          documentId: selectedDocumentId,
          organizationId: organizationId
        });

        if (response.ok) {
          const aiResponse = await response.json();
          // Transform AI response to decision analysis format
          // For now, fall back to enhanced mock with document context
        }
      } catch (error) {
        console.warn('AI service unavailable, using context-aware mock analysis');
      }

      const mockAnalysis = generateMockAnalysis(selectedDocumentId, docTitle);
      setAnalysis(mockAnalysis);
      setSelectedOption(mockAnalysis.recommendation.optionId);

    } catch (error) {
      console.error('Failed to analyze decision:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to analyze decision');
    } finally {
      setLoading(false);
    }
  };

  const makeDecision = async () => {
    if (!selectedOption || !analysis) return;

    try {
      setLoading(true);

      const selectedOptionData = analysis.options.find(opt => opt.id === selectedOption);
      if (!selectedOptionData) return;

      const result: DecisionResult = {
        optionId: selectedOption,
        rationale: decisionRationale || `Selected option: ${selectedOptionData.title}`,
        confidence: selectedOptionData.confidence,
        conditions: decisionConditions,
        nextSteps: selectedOptionData.implementation.steps
      };

      if (onDecisionMade) {
        onDecisionMade(result);
      }

    } catch (error) {
      console.error('Failed to make decision:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to make decision');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setAnalysis(null); // Clear previous analysis
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      analyzeDecision();
    }
  }, [selectedDocumentId, documents, organizationId]);

  return {
    // State
    analysis,
    loading,
    error,
    selectedOption,
    decisionRationale,
    decisionConditions,
    criteriaWeights,
    documents,
    documentsLoading,
    selectedDocumentId,

    // Actions
    analyzeDecision,
    makeDecision,
    handleDocumentChange,
    setSelectedOption,
    setDecisionRationale,
    setDecisionConditions,
    setCriteriaWeights
  };
};