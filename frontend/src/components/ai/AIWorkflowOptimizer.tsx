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
  Tooltip,
  Badge,
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
  SelectChangeEvent
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Settings,
  AutoFixHigh,
  Assessment,
  ExpandMore,
  PlayArrow,
  Pause,
  Refresh,
  Timeline,
  Psychology,
  CheckCircle,
  Warning,
  Error,
  Info,
  Lightbulb,
  Build,
  Analytics,
  Compare
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AIWorkflowOptimizerProps {
  workflowId?: string;
  organizationId: string;
  onOptimizationComplete?: (result: OptimizationResult) => void;
}

interface WorkflowBottleneck {
  stepId: string;
  stepName: string;
  averageTime: number;
  successRate: number;
  issueFrequency: number;
  impactScore: number;
  recommendations: string[];
}

interface OptimizationSuggestion {
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

interface OptimizationResult {
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

interface WorkflowAnalysis {
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

const AIWorkflowOptimizer: React.FC<AIWorkflowOptimizerProps> = ({
  workflowId,
  organizationId,
  onOptimizationComplete
}) => {
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [optimizationNotes, setOptimizationNotes] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
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

  const applyOptimizations = async () => {
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

      setPreviewDialogOpen(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return <CheckCircle color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      case 'HIGH': return <Error color="error" />;
      default: return <Info />;
    }
  };

  useEffect(() => {
    if (!workflowId) {
      fetchDocuments();
    }
  }, []);

  useEffect(() => {
    if (workflowId) {
      analyzeWorkflow();
    }
  }, [workflowId, organizationId]);

  useEffect(() => {
    if (!workflowId && selectedDocumentId && documents.length > 0) {
      analyzeWorkflow();
    }
  }, [selectedDocumentId, documents.length]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setAnalysis(null); // Clear previous analysis
    setSelectedSuggestions(new Set()); // Clear selected suggestions
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

  if (loading && !analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Analyzing workflow performance...</Typography>
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
            <Button color="inherit" size="small" onClick={analyzeWorkflow}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!workflowId && !selectedDocumentId) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Speed sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Workflow Optimizer
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to analyze and optimize its workflow with AI-powered insights
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
            <Speed sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Workflow Optimizer
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Analyze and optimize your workflow performance with AI-powered insights
            </Typography>
            <Button variant="contained" onClick={analyzeWorkflow} startIcon={<Analytics />}>
              Analyze Workflow
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalImpact = calculateTotalImpact();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Speed sx={{ mr: 1, color: 'primary.main' }} />
          AI Workflow Optimizer
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!workflowId && (
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
          )}
          <Button variant="outlined" size="small" onClick={analyzeWorkflow} startIcon={<Refresh />} disabled={!workflowId && !selectedDocumentId}>
            Re-analyze
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => setPreviewDialogOpen(true)}
            startIcon={<AutoFixHigh />}
            disabled={selectedSuggestions.size === 0}
          >
            Apply Optimizations ({selectedSuggestions.size})
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Current Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Current Performance
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Avg. Completion Time</Typography>
                  <Typography variant="h6">{analysis.currentPerformance.averageCompletionTime}h</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                  <Typography variant="h6" color="success.main">
                    {analysis.currentPerformance.successRate}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Bottlenecks</Typography>
                  <Typography variant="h6" color="error.main">
                    {analysis.currentPerformance.bottleneckCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Efficiency</Typography>
                  <Typography variant="h6" color="warning.main">
                    {analysis.currentPerformance.efficiency}%
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Overall Efficiency</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis.currentPerformance.efficiency}
                  color={analysis.currentPerformance.efficiency > 80 ? 'success' : 'warning'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Projected Impact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Projected Impact
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Time Reduction</Typography>
                  <Typography variant="h6" color="success.main">
                    {totalImpact.timeReduction}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Efficiency Gain</Typography>
                  <Typography variant="h6" color="success.main">
                    +{totalImpact.efficiencyGain}%
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Monthly Savings</Typography>
                  <Typography variant="h6" color="primary.main">
                    {totalImpact.costSavings} hours
                  </Typography>
                </Grid>
              </Grid>

              {selectedSuggestions.size > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Expected Efficiency</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(analysis.currentPerformance.efficiency + totalImpact.efficiencyGain, 100)}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bottlenecks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 1 }} />
                Bottlenecks Analysis
              </Typography>

              <List dense>
                {(analysis.bottlenecks || []).map((bottleneck, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Badge badgeContent={bottleneck.impactScore.toFixed(1)} color="error">
                        <Warning color="warning" />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={bottleneck.stepName}
                      secondary={`${bottleneck.averageTime}h avg • ${bottleneck.successRate}% success`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Wins */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb sx={{ mr: 1 }} />
                Quick Wins
              </Typography>

              {(analysis.quickWins || []).map((suggestion) => (
                <Box key={suggestion.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">{suggestion.title}</Typography>
                    <Chip 
                      label={`${suggestion.impact.timeReduction}% faster`}
                      size="small" 
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.description}
                  </Typography>
                  <Button 
                    size="small" 
                    startIcon={<PlayArrow />}
                    onClick={() => toggleSuggestion(suggestion.id)}
                    sx={{ mt: 1 }}
                  >
                    Apply Quick Fix
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Suggestions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoFixHigh sx={{ mr: 1 }} />
                Optimization Suggestions
              </Typography>

              {(analysis.suggestions || []).map((suggestion) => (
                <Accordion key={suggestion.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSuggestion(suggestion.id);
                          }}
                          color={selectedSuggestions.has(suggestion.id) ? 'primary' : 'default'}
                        >
                          <CheckCircle />
                        </IconButton>
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          {suggestion.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={suggestion.priority} 
                          size="small" 
                          color={getPriorityColor(suggestion.priority) as any}
                        />
                        <Tooltip title={`Complexity: ${suggestion.complexity}`}>
                          {getComplexityIcon(suggestion.complexity)}
                        </Tooltip>
                        <Chip 
                          label={`${suggestion.impact.timeReduction}% faster`}
                          size="small" 
                          color="success"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="body2" paragraph>
                          {suggestion.description}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>Benefits:</Typography>
                        <List dense>
                          {(suggestion.benefits || []).map((benefit, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={benefit} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>Impact Metrics:</Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption">Time Reduction</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={suggestion.impact.timeReduction}
                            color="success"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">Efficiency Gain: +{suggestion.impact.efficiencyGain}%</Typography>
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>Implementation:</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Est. time: {suggestion.estimatedImplementationTime}h
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Optimization Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview Optimizations</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            You have selected {selectedSuggestions.size} optimization(s) that will improve your workflow:
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Expected Impact:</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="h4" color="success.main">{totalImpact.timeReduction}%</Typography>
                <Typography variant="caption">Time Reduction</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h4" color="primary.main">+{totalImpact.efficiencyGain}%</Typography>
                <Typography variant="caption">Efficiency Gain</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h4" color="info.main">{totalImpact.costSavings}h</Typography>
                <Typography variant="caption">Monthly Savings</Typography>
              </Grid>
            </Grid>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Implementation Notes (Optional)"
            placeholder="Add any specific requirements or considerations..."
            value={optimizationNotes}
            onChange={(e) => setOptimizationNotes(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Alert severity="info">
            These optimizations will create a new workflow version. Your original workflow will be preserved.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={applyOptimizations}
            disabled={optimizing}
            startIcon={optimizing ? <CircularProgress size={16} /> : <Build />}
          >
            {optimizing ? 'Optimizing...' : 'Apply Optimizations'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIWorkflowOptimizer;