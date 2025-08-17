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
  Badge,
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
  Divider,
  Paper,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Psychology,
  Lightbulb,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Group,
  Speed,
  ExpandMore,
  PlayArrow,
  ThumbUp,
  ThumbDown,
  AutoFixHigh,
  Analytics,
  Star,
  Refresh,
  FilterList,
  Sort,
  Insights,
  EmojiEvents,
  Assignment,
  Tune
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface SmartRecommendationEngineProps {
  organizationId: string;
  currentContext?: {
    documentId?: string;
    workflowId?: string;
    userId?: string;
  };
  onRecommendationApplied?: (recommendation: Recommendation) => void;
}

interface Recommendation {
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

interface RecommendationFilter {
  types: string[];
  priorities: string[];
  complexities: string[];
  minConfidence: number;
  contextRelevant: boolean;
}

interface RecommendationFeedback {
  recommendationId: string;
  helpful: boolean;
  implemented: boolean;
  actualImpact?: number;
  comments?: string;
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

const SmartRecommendationEngine: React.FC<SmartRecommendationEngineProps> = ({
  organizationId,
  currentContext,
  onRecommendationApplied
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [implementDialogOpen, setImplementDialogOpen] = useState(false);
  const [filters, setFilters] = useState<RecommendationFilter>({
    types: [],
    priorities: [],
    complexities: [],
    minConfidence: 50,
    contextRelevant: false
  });
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'impact' | 'relevance'>('priority');
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

  const generateRecommendations = async () => {
    if (!selectedDocumentId) {
      setError('Please select a document to analyze for recommendations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Try to call the AI service for document-specific recommendations
      try {
        const response = await api.post('/api/ai-workflow/analyze-document-workflow', {
          documentId: selectedDocumentId,
          organizationId: organizationId
        });

        if (response.ok) {
          const aiResponse = await response.json();
          // Transform AI response to recommendations format
          // For now, fall back to enhanced mock with document context
        }
      } catch (error) {
        console.warn('AI service unavailable, using context-aware mock recommendations');
      }

      // Enhanced mock recommendations with document context
      const mockRecommendations: Recommendation[] = [
        {
          id: 'rec-1',
          type: 'PROCESS_OPTIMIZATION',
          priority: 'HIGH',
          title: `Optimize "${docTitle}" Approval Workflow`,
          description: `Enable multiple reviewers to work simultaneously on different sections of "${docTitle}"`,
          rationale: `Analysis of "${docTitle}" shows this document type typically has 40% of review time spent waiting for sequential approvals. Parallel processing can significantly reduce turnaround time.`,
          confidence: 92,
          impact: {
            efficiency: 45,
            timeReduction: 28,
            qualityImprovement: 15,
            costSavings: 12000
          },
          implementationComplexity: 'MEDIUM',
          estimatedImplementationTime: 24,
          prerequisites: [
            'Workflow redesign approval',
            'Reviewer training',
            'System configuration updates'
          ],
          steps: [
            'Identify documents suitable for parallel processing',
            'Set up parallel approval workflows',
            'Train reviewers on new process',
            'Monitor and optimize performance'
          ],
          riskFactors: [
            'Potential coordination challenges',
            'Initial learning curve',
            'Quality consistency concerns'
          ],
          successMetrics: [
            '30% reduction in average approval time',
            '20% increase in reviewer satisfaction',
            'Maintained or improved approval quality'
          ],
          tags: ['efficiency', 'workflow', 'automation'],
          applicableToCurrentContext: true,
          historicalSuccessRate: 85
        },
        {
          id: 'rec-2',
          type: 'WORKFLOW_AUTOMATION',
          priority: 'CRITICAL',
          title: `Smart Routing for "${docTitle}" Category`,
          description: `Use AI to automatically route documents like "${docTitle}" to appropriate reviewers based on content analysis`,
          rationale: `Documents similar to "${docTitle}" currently experience manual routing delays. AI content analysis can route 80% of similar documents automatically with 95% accuracy.`,
          confidence: 88,
          impact: {
            efficiency: 60,
            timeReduction: 18,
            qualityImprovement: 25,
            costSavings: 8500
          },
          implementationComplexity: 'HIGH',
          estimatedImplementationTime: 40,
          prerequisites: [
            'Content classification model training',
            'Reviewer expertise mapping',
            'Automated routing rules setup'
          ],
          steps: [
            'Train AI content classifier',
            'Map reviewer expertise areas',
            'Create routing decision matrix',
            'Implement automated routing system',
            'Set up fallback manual routing'
          ],
          riskFactors: [
            'AI misclassification risks',
            'Complex setup requirements',
            'Need for ongoing model training'
          ],
          successMetrics: [
            '80% automated routing accuracy',
            '50% reduction in routing time',
            '90% reviewer satisfaction with assignments'
          ],
          tags: ['ai', 'automation', 'routing'],
          applicableToCurrentContext: true,
          historicalSuccessRate: 78
        },
        {
          id: 'rec-3',
          type: 'QUALITY_IMPROVEMENT',
          priority: 'MEDIUM',
          title: 'Implement AI-Powered Quality Scoring',
          description: 'Add AI quality assessment to help reviewers focus on critical issues',
          rationale: 'Quality inconsistencies detected in 30% of approvals. AI scoring can help standardize quality assessment.',
          confidence: 75,
          impact: {
            efficiency: 25,
            timeReduction: 12,
            qualityImprovement: 40,
            costSavings: 6000
          },
          implementationComplexity: 'MEDIUM',
          estimatedImplementationTime: 32,
          prerequisites: [
            'Quality criteria definition',
            'Historical data for model training',
            'Reviewer feedback integration'
          ],
          steps: [
            'Define quality scoring criteria',
            'Train AI quality assessment model',
            'Integrate scoring into review interface',
            'Collect reviewer feedback',
            'Continuously improve model accuracy'
          ],
          riskFactors: [
            'Subjective quality criteria',
            'Model bias potential',
            'Integration complexity'
          ],
          successMetrics: [
            '30% improvement in quality consistency',
            '20% reduction in revision cycles',
            '85% reviewer adoption rate'
          ],
          tags: ['quality', 'ai', 'scoring'],
          applicableToCurrentContext: false,
          historicalSuccessRate: 72
        },
        {
          id: 'rec-4',
          type: 'COLLABORATION_ENHANCEMENT',
          priority: 'MEDIUM',
          title: 'Smart Meeting Scheduler for Conflicts',
          description: 'Automatically schedule resolution meetings when conflicts are detected',
          rationale: 'Conflict resolution currently takes 3-5 days. Automated scheduling can reduce this to 1-2 days.',
          confidence: 82,
          impact: {
            efficiency: 35,
            timeReduction: 24,
            qualityImprovement: 20,
            costSavings: 4500
          },
          implementationComplexity: 'LOW',
          estimatedImplementationTime: 16,
          prerequisites: [
            'Calendar integration setup',
            'Conflict detection rules',
            'Meeting room availability system'
          ],
          steps: [
            'Integrate with calendar systems',
            'Set up conflict detection triggers',
            'Create automated meeting templates',
            'Configure participant notification system'
          ],
          riskFactors: [
            'Calendar integration challenges',
            'Participant availability conflicts',
            'Over-scheduling risk'
          ],
          successMetrics: [
            '50% faster conflict resolution',
            '90% meeting attendance rate',
            '80% conflict resolution success rate'
          ],
          tags: ['collaboration', 'scheduling', 'conflict-resolution'],
          applicableToCurrentContext: true,
          historicalSuccessRate: 89
        },
        {
          id: 'rec-5',
          type: 'DEADLINE_MANAGEMENT',
          priority: 'HIGH',
          title: 'Predictive Deadline Risk Alerts',
          description: 'Use AI to predict and prevent deadline misses before they happen',
          rationale: '25% of workflows miss deadlines. Predictive alerts can prevent 80% of these misses.',
          confidence: 90,
          impact: {
            efficiency: 30,
            timeReduction: 15,
            qualityImprovement: 10,
            costSavings: 7500
          },
          implementationComplexity: 'MEDIUM',
          estimatedImplementationTime: 20,
          prerequisites: [
            'Historical deadline data analysis',
            'Risk factor identification',
            'Alert notification system'
          ],
          steps: [
            'Analyze historical deadline patterns',
            'Identify risk factor patterns',
            'Develop predictive model',
            'Set up automated alert system',
            'Create escalation procedures'
          ],
          riskFactors: [
            'False positive alerts',
            'Alert fatigue potential',
            'Model accuracy dependencies'
          ],
          successMetrics: [
            '80% reduction in missed deadlines',
            '90% alert accuracy rate',
            '95% user satisfaction with alerts'
          ],
          tags: ['deadlines', 'prediction', 'alerts'],
          applicableToCurrentContext: true,
          historicalSuccessRate: 83
        }
      ];

      setRecommendations(mockRecommendations);

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (recommendation: Recommendation) => {
    try {
      setLoading(true);
      
      // Mock implementation - in real app, this would apply the recommendation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onRecommendationApplied) {
        onRecommendationApplied(recommendation);
      }
      
      setImplementDialogOpen(false);
      setSelectedRecommendation(null);
      
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply recommendation');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedback: RecommendationFeedback) => {
    try {
      // Mock feedback submission
      console.log('Submitting feedback:', feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getFilteredAndSortedRecommendations = () => {
    let filtered = recommendations.filter(rec => {
      if (filters.types.length && !filters.types.includes(rec.type)) return false;
      if (filters.priorities.length && !filters.priorities.includes(rec.priority)) return false;
      if (filters.complexities.length && !filters.complexities.includes(rec.implementationComplexity)) return false;
      if (rec.confidence < filters.minConfidence) return false;
      if (filters.contextRelevant && !rec.applicableToCurrentContext) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'impact':
          return b.impact.efficiency - a.impact.efficiency;
        case 'relevance':
          return (b.applicableToCurrentContext ? 1 : 0) - (a.applicableToCurrentContext ? 1 : 0);
        case 'priority':
        default:
          const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROCESS_OPTIMIZATION': return <Speed />;
      case 'WORKFLOW_AUTOMATION': return <AutoFixHigh />;
      case 'REVIEWER_ASSIGNMENT': return <Assignment />;
      case 'DEADLINE_MANAGEMENT': return <Schedule />;
      case 'QUALITY_IMPROVEMENT': return <Star />;
      case 'COLLABORATION_ENHANCEMENT': return <Group />;
      default: return <Lightbulb />;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      generateRecommendations();
    }
  }, [selectedDocumentId, documents, organizationId, currentContext]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setRecommendations([]); // Clear previous recommendations
  };

  const filteredRecommendations = getFilteredAndSortedRecommendations();

  if (loading && recommendations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Generating AI recommendations...</Typography>
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
            <Button color="inherit" size="small" onClick={generateRecommendations}>
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
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Smart Recommendation Engine
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to get AI-powered workflow optimization recommendations
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          Smart Recommendation Engine
          <Badge badgeContent={filteredRecommendations.length} color="primary" sx={{ ml: 2 }}>
            <Insights />
          </Badge>
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
          <Button variant="outlined" size="small" startIcon={<FilterList />}>
            Filters
          </Button>
          <Button variant="outlined" size="small" startIcon={<Sort />}>
            Sort: {sortBy}
          </Button>
          <Button variant="outlined" size="small" onClick={generateRecommendations} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {recommendations.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH').length}
            </Typography>
            <Typography variant="caption">High Priority</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {Math.round(recommendations.reduce((sum, r) => sum + r.impact.efficiency, 0) / recommendations.length)}%
            </Typography>
            <Typography variant="caption">Avg Efficiency Gain</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {recommendations.reduce((sum, r) => sum + r.impact.timeReduction, 0)}h
            </Typography>
            <Typography variant="caption">Total Time Savings</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {recommendations.filter(r => r.applicableToCurrentContext).length}
            </Typography>
            <Typography variant="caption">Context Relevant</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recommendations List */}
      <Box>
        {filteredRecommendations.map((recommendation) => (
          <Card key={recommendation.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                    {getTypeIcon(recommendation.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      {recommendation.title}
                      {recommendation.applicableToCurrentContext && (
                        <Chip label="Contextual" size="small" color="success" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendation.description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Chip
                    label={recommendation.priority}
                    size="small"
                    color={getPriorityColor(recommendation.priority) as any}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 0.5 }}>Confidence:</Typography>
                    <Rating value={recommendation.confidence / 20} readOnly size="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {recommendation.confidence}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Efficiency Gain</Typography>
                  <Typography variant="body2" color="success.main">
                    +{recommendation.impact.efficiency}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Time Reduction</Typography>
                  <Typography variant="body2" color="info.main">
                    {recommendation.impact.timeReduction}h
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Implementation</Typography>
                  <Chip
                    label={recommendation.implementationComplexity}
                    size="small"
                    color={getComplexityColor(recommendation.implementationComplexity) as any}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                  <Typography variant="body2">
                    {recommendation.historicalSuccessRate}%
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {recommendation.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
                <Box>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedRecommendation(recommendation);
                      setDetailDialogOpen(true);
                    }}
                    sx={{ mr: 1 }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      setSelectedRecommendation(recommendation);
                      setImplementDialogOpen(true);
                    }}
                  >
                    Implement
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {filteredRecommendations.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No recommendations match your filters
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your filters or refresh to get new recommendations
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {selectedRecommendation && getTypeIcon(selectedRecommendation.type)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {selectedRecommendation?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecommendation && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedRecommendation.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>Rationale</Typography>
              <Typography variant="body2" paragraph>
                {selectedRecommendation.rationale}
              </Typography>

              <Typography variant="h6" gutterBottom>Implementation Steps</Typography>
              <List dense>
                {selectedRecommendation.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>Risk Factors</Typography>
              <List dense>
                {selectedRecommendation.riskFactors.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>Success Metrics</Typography>
              <List dense>
                {selectedRecommendation.successMetrics.map((metric, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={metric} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailDialogOpen(false);
              setImplementDialogOpen(true);
            }}
            startIcon={<PlayArrow />}
          >
            Implement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Implementation Dialog */}
      <Dialog open={implementDialogOpen} onClose={() => setImplementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Implement Recommendation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you ready to implement "{selectedRecommendation?.title}"?
          </Typography>
          
          {selectedRecommendation && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Expected Impact:</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Efficiency: +{selectedRecommendation.impact.efficiency}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Time Saved: {selectedRecommendation.impact.timeReduction}h
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Quality: +{selectedRecommendation.impact.qualityImprovement}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Cost Savings: ${selectedRecommendation.impact.costSavings.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Implementation time: {selectedRecommendation.estimatedImplementationTime} hours
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImplementDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedRecommendation && applyRecommendation(selectedRecommendation)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
          >
            {loading ? 'Implementing...' : 'Implement Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartRecommendationEngine;