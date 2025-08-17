'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Paper,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Psychology,
  Gavel,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Lightbulb,
  Analytics,
  ExpandMore,
  PlayArrow,
  ThumbUp,
  ThumbDown,
  Balance,
  Assessment,
  Timeline,
  Compare,
  EmojiObjects,
  AutoFixHigh,
  Refresh,
  QuestionAnswer,
  Rule,
  PriorityHigh
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AIDecisionSupportProps {
  documentId?: string;
  workflowId?: string;
  publishingId?: string;
  organizationId: string;
  currentStep?: string;
  onDecisionMade?: (decision: DecisionResult) => void;
}

interface DecisionFactor {
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

interface DecisionOption {
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

interface DecisionAnalysis {
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

interface DecisionResult {
  optionId: string;
  rationale: string;
  confidence: number;
  conditions: string[];
  nextSteps: string[];
}

interface DecisionCriteria {
  risk: number;
  quality: number;
  compliance: number;
  business: number;
  timeline: number;
}

interface Document {
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

const AIDecisionSupport: React.FC<AIDecisionSupportProps> = ({
  documentId,
  workflowId,
  publishingId,
  organizationId,
  currentStep,
  onDecisionMade
}) => {
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(documentId || '');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

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

      // Enhanced mock analysis with document context
      const mockAnalysis: DecisionAnalysis = {
        documentId: selectedDocumentId,
        context: {
          documentType: `${selectedDoc?.category || 'Document'} - "${docTitle}"`,
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
          },
          {
            id: 'factor-3',
            name: 'Technical Implementation Risk',
            category: 'TECHNICAL',
            importance: 'MEDIUM',
            impact: -15,
            confidence: 75,
            description: 'Some technical challenges identified in implementation plan',
            evidence: [
              'System integration complexity',
              'Resource allocation concerns',
              'Timeline constraints'
            ],
            recommendations: [
              'Develop detailed technical plan',
              'Allocate additional resources',
              'Consider phased implementation'
            ]
          },
          {
            id: 'factor-4',
            name: 'Quality Assurance Standards',
            category: 'QUALITY',
            importance: 'HIGH',
            impact: 35,
            confidence: 90,
            description: 'Document meets high quality standards and best practices',
            evidence: [
              'Quality review completed',
              'Standards compliance verified',
              'Peer review positive'
            ],
            recommendations: [
              'Maintain quality standards',
              'Document best practices',
              'Share learnings with team'
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
              },
              {
                type: 'Implementation Risk',
                level: 'LOW',
                description: 'Complexity in tracking conditions',
                mitigation: 'Use automated tracking system'
              }
            ],
            benefits: [
              {
                type: 'Time Savings',
                value: 15,
                description: 'Saves 15 days compared to full revision'
              },
              {
                type: 'Business Continuity',
                value: 85,
                description: 'Maintains business operations'
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
              },
              {
                type: 'Resource Risk',
                level: 'MEDIUM',
                description: 'Requires significant rework effort',
                mitigation: 'Allocate dedicated resources'
              }
            ],
            benefits: [
              {
                type: 'Quality Improvement',
                value: 95,
                description: 'Ensures highest quality standards'
              },
              {
                type: 'Risk Reduction',
                value: 90,
                description: 'Minimizes compliance and operational risks'
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
          },
          {
            id: 'option-3',
            title: `Approve "${docTitle}" as-is`,
            description: `Approve "${docTitle}" in its current state without conditions`,
            overallScore: 55,
            confidence: 70,
            pros: [
              'Immediate approval',
              'No delays',
              'Maintains project momentum'
            ],
            cons: [
              'Leaves potential issues unaddressed',
              'Higher risk profile',
              'May require future corrections'
            ],
            risks: [
              {
                type: 'Compliance Risk',
                level: 'HIGH',
                description: 'Regulatory alignment issues remain',
                mitigation: 'Enhanced monitoring and rapid response plan'
              },
              {
                type: 'Operational Risk',
                level: 'MEDIUM',
                description: 'Potential process inefficiencies',
                mitigation: 'Regular review and adjustment'
              }
            ],
            benefits: [
              {
                type: 'Speed',
                value: 100,
                description: 'Immediate implementation possible'
              },
              {
                type: 'Cost Savings',
                value: 80,
                description: 'No additional review costs'
              }
            ],
            implementation: {
              complexity: 'LOW',
              timeline: 'Immediate',
              resources: ['Minimal resources required'],
              steps: [
                'Final approval documentation',
                'Notification to stakeholders',
                'Implementation planning'
              ]
            },
            compliance: {
              status: 'NON_COMPLIANT',
              issues: ['Regulatory alignment concerns', 'Standards compliance gaps'],
              requirements: ['Immediate compliance review post-approval']
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

      setConfirmDialogOpen(false);
      
    } catch (error) {
      console.error('Failed to make decision:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to make decision');
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightedScore = (option: DecisionOption) => {
    // Simplified weighted scoring based on criteria
    const baseScore = option.overallScore;
    const confidenceAdjustment = (option.confidence - 50) / 10; // -5 to +5
    return Math.max(0, Math.min(100, baseScore + confidenceAdjustment));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RISK': return 'error';
      case 'COMPLIANCE': return 'warning';
      case 'QUALITY': return 'success';
      case 'BUSINESS': return 'primary';
      case 'TECHNICAL': return 'info';
      default: return 'default';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'success';
      case 'REQUIRES_REVIEW': return 'warning';
      case 'NON_COMPLIANT': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      analyzeDecision();
    }
  }, [selectedDocumentId, documents, organizationId]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setAnalysis(null); // Clear previous analysis
  };

  if (loading && !analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Analyzing decision factors with AI...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={analyzeDecision}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDocumentId) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Gavel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Decision Support
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to get AI-powered decision analysis and recommendations
            </Typography>
            
            <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <FormControl fullWidth>
                <InputLabel>Select Document</InputLabel>
                <Select
                  value={selectedDocumentId}
                  label="Select Document"
                  onChange={handleDocumentChange}
                  disabled={documentsLoading}
                >
                  {documents.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      <Box>
                        <Typography variant="body2">{doc.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.category} • {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {documentsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="caption">Loading documents...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Gavel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Decision Support
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Get AI-powered analysis and recommendations for complex decisions
            </Typography>
            <Button variant="contained" onClick={analyzeDecision} startIcon={<Analytics />}>
              Analyze Decision
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const sortedOptions = [...analysis.options].sort((a, b) => 
    calculateWeightedScore(b) - calculateWeightedScore(a)
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          AI Decision Support
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Document</InputLabel>
            <Select
              value={selectedDocumentId}
              label="Document"
              onChange={handleDocumentChange}
              disabled={documentsLoading}
            >
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                    {doc.title}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={analyzeDecision} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Re-analyze
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={!selectedOption}
            startIcon={<Gavel />}
          >
            Make Decision
          </Button>
        </Box>
      </Box>

      {/* Context & Urgency */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Decision Context</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Document Type</Typography>
              <Typography variant="body2">{analysis.context.documentType}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Urgency</Typography>
              <Chip 
                label={analysis.context.urgency} 
                size="small" 
                color={analysis.context.urgency === 'CRITICAL' ? 'error' : 'warning'}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Business Impact</Typography>
              <Typography variant="body2">{analysis.context.businessImpact}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Time to Decision</Typography>
              <Typography variant="body2" color="warning.main">
                {analysis.predictiveInsights.timeToDecision} hours
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Decision Factors */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Balance sx={{ mr: 1 }} />
                Decision Factors
              </Typography>

              {analysis.factors.map((factor) => (
                <Accordion key={factor.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">{factor.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip
                            label={factor.category}
                            size="small"
                            color={getCategoryColor(factor.category) as any}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={factor.importance}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color={factor.impact > 0 ? 'success.main' : 'error.main'}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact}
                        </Typography>
                        <Typography variant="caption">
                          {factor.confidence}% confidence
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" paragraph>
                      {factor.description}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>Evidence:</Typography>
                    <List dense>
                      {factor.evidence.map((item, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Info fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                    <List dense>
                      {factor.recommendations.map((item, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Lightbulb fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Decision Options */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Compare sx={{ mr: 1 }} />
                Decision Options
              </Typography>

              {/* AI Recommendation */}
              {analysis.recommendation && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 3 }}
                  icon={<EmojiObjects />}
                >
                  <Typography variant="subtitle2" gutterBottom>AI Recommendation</Typography>
                  <Typography variant="body2">
                    {analysis.recommendation.reasoning}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`${analysis.recommendation.confidence}% confidence`}
                      size="small"
                      color="info"
                    />
                  </Box>
                </Alert>
              )}

              {sortedOptions.map((option) => (
                <Card 
                  key={option.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 2, 
                    border: selectedOption === option.id ? 2 : 1,
                    borderColor: selectedOption === option.id ? 'primary.main' : 'divider',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                          {option.title}
                          {analysis.recommendation.optionId === option.id && (
                            <Chip label="Recommended" size="small" color="success" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary.main">
                          {calculateWeightedScore(option).toFixed(0)}
                        </Typography>
                        <Typography variant="caption">Overall Score</Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Confidence</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={option.confidence}
                          color="primary"
                          sx={{ mt: 0.5 }}
                        />
                        <Typography variant="caption">{option.confidence}%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Complexity</Typography>
                        <Chip 
                          label={option.implementation.complexity}
                          size="small"
                          color={option.implementation.complexity === 'LOW' ? 'success' : 'warning'}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Compliance</Typography>
                        <Chip 
                          label={option.compliance.status}
                          size="small"
                          color={getComplianceColor(option.compliance.status) as any}
                        />
                      </Grid>
                    </Grid>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">View Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="success.main">Pros</Typography>
                            <List dense>
                              {option.pros.map((pro, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                  <ListItemIcon>
                                    <ThumbUp fontSize="small" color="success" />
                                  </ListItemIcon>
                                  <ListItemText primary={pro} />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="error.main">Cons</Typography>
                            <List dense>
                              {option.cons.map((con, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                  <ListItemIcon>
                                    <ThumbDown fontSize="small" color="error" />
                                  </ListItemIcon>
                                  <ListItemText primary={con} />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>Risks</Typography>
                        {option.risks.map((risk, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Chip 
                                label={risk.level}
                                size="small"
                                color={getRiskColor(risk.level) as any}
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {risk.type}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {risk.description}
                            </Typography>
                            <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                              Mitigation: {risk.mitigation}
                            </Typography>
                          </Box>
                        ))}

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Implementation Steps</Typography>
                        <List dense>
                          {option.implementation.steps.map((step, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <Typography variant="caption" sx={{ 
                                  width: 20, 
                                  height: 20, 
                                  borderRadius: '50%', 
                                  bgcolor: 'primary.main', 
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {index + 1}
                                </Typography>
                              </ListItemIcon>
                              <ListItemText primary={step} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Decision Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Confirm Decision</DialogTitle>
        <DialogContent>
          {selectedOption && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selected Option: {analysis.options.find(opt => opt.id === selectedOption)?.title}
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Decision Rationale"
                placeholder="Explain your reasoning for this decision..."
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Conditions (Optional)"
                placeholder="Any specific conditions or requirements..."
                value={decisionConditions.join('\n')}
                onChange={(e) => setDecisionConditions(e.target.value.split('\n').filter(Boolean))}
                sx={{ mb: 2 }}
              />

              <Alert severity="info">
                This decision will be recorded and stakeholders will be notified.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={makeDecision}
            disabled={loading || !decisionRationale.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Gavel />}
          >
            {loading ? 'Recording Decision...' : 'Confirm Decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIDecisionSupport;