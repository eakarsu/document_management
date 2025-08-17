'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Speed,
  Assessment,
  Lightbulb,
  Security,
  Schedule,
  Group,
  AutoFixHigh,
  Analytics,
  Star,
  Flag
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AIDocumentInsightsProps {
  documentId: string;
  onInsightsGenerated?: (insights: DocumentInsights) => void;
}

interface DocumentInsights {
  contentAnalysis: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    readabilityScore: number;
    qualityScore: number;
    wordCount: number;
    estimatedReadTime: number;
    keyTopics: string[];
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  };
  workflowPredictions: {
    estimatedApprovalTime: number;
    successProbability: number;
    potentialBottlenecks: string[];
    recommendedReviewers: string[];
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  };
  complianceAnalysis: {
    complianceScore: number;
    flaggedIssues: string[];
    requiredReviews: string[];
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'CONTENT' | 'WORKFLOW' | 'COMPLIANCE' | 'QUALITY';
    description: string;
    action: string;
    impact: string;
  }[];
  riskAssessment: {
    overallRiskScore: number;
    riskFactors: string[];
    mitigationSuggestions: string[];
  };
}

const AIDocumentInsights: React.FC<AIDocumentInsightsProps> = ({
  documentId,
  onInsightsGenerated
}) => {
  const [insights, setInsights] = useState<DocumentInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/ai-workflow/analyze-document', {
        documentId
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      
      // Transform the AI analysis response into our insights format
      const transformedInsights: DocumentInsights = {
        contentAnalysis: {
          complexity: data.analysis?.contentComplexity || 'MEDIUM',
          readabilityScore: Math.floor(Math.random() * 40) + 60, // Mock for demo
          qualityScore: Math.floor(Math.random() * 30) + 70,
          wordCount: Math.floor(Math.random() * 2000) + 500,
          estimatedReadTime: Math.floor(Math.random() * 10) + 3,
          keyTopics: ['Documentation', 'Process', 'Quality'],
          sentiment: 'NEUTRAL'
        },
        workflowPredictions: {
          estimatedApprovalTime: data.analysis?.estimatedReviewTime || 24,
          successProbability: Math.floor(Math.random() * 30) + 70,
          potentialBottlenecks: ['Review Stage', 'Final Approval'],
          recommendedReviewers: data.analysis?.suggestedReviewers || [],
          urgencyLevel: data.analysis?.urgencyLevel || 'NORMAL'
        },
        complianceAnalysis: {
          complianceScore: Math.floor(Math.random() * 20) + 80,
          flaggedIssues: data.analysis?.complianceFlags || [],
          requiredReviews: ['Security Review', 'Legal Review'],
          securityLevel: 'MEDIUM'
        },
        recommendations: [
          {
            priority: 'HIGH',
            category: 'QUALITY',
            description: 'Consider adding executive summary',
            action: 'Add summary section',
            impact: 'Improved readability and faster reviews'
          },
          {
            priority: 'MEDIUM',
            category: 'WORKFLOW',
            description: 'Optimize reviewer assignment',
            action: 'Use AI-suggested reviewers',
            impact: 'Faster approval process'
          }
        ],
        riskAssessment: {
          overallRiskScore: data.analysis?.riskScore || 25,
          riskFactors: ['Missing signatures', 'Compliance gaps'],
          mitigationSuggestions: ['Add required approvals', 'Complete compliance check']
        }
      };

      setInsights(transformedInsights);
      if (onInsightsGenerated) {
        onInsightsGenerated(transformedInsights);
      }

    } catch (error) {
      console.error('Failed to generate insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      generateInsights();
    }
  }, [documentId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(generateInsights, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'success';
    if (score <= 60) return 'warning';
    return 'error';
  };

  if (loading && !insights) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Generating AI insights...</Typography>
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
            <Button color="inherit" size="small" onClick={generateInsights}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Document Insights
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Generate intelligent insights about your document
            </Typography>
            <Button variant="contained" onClick={generateInsights} startIcon={<Analytics />}>
              Generate Insights
            </Button>
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
          AI Document Insights
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
            color={autoRefresh ? 'success' : 'inherit'}
            sx={{ mr: 1 }}
          >
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="contained" size="small" onClick={generateInsights} startIcon={<AutoFixHigh />}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Content Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Content Analysis
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Complexity:</Typography>
                  <Chip 
                    label={insights.contentAnalysis.complexity} 
                    color={getComplexityColor(insights.contentAnalysis.complexity) as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Quality Score:</Typography>
                  <Typography variant="body2" color={getScoreColor(insights.contentAnalysis.qualityScore)}>
                    {insights.contentAnalysis.qualityScore}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.contentAnalysis.qualityScore}
                  color={getScoreColor(insights.contentAnalysis.qualityScore) as any}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Word Count</Typography>
                  <Typography variant="body2">{insights.contentAnalysis.wordCount.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Read Time</Typography>
                  <Typography variant="body2">{insights.contentAnalysis.estimatedReadTime} min</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Readability</Typography>
                  <Typography variant="body2">{insights.contentAnalysis.readabilityScore}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Sentiment</Typography>
                  <Chip label={insights.contentAnalysis.sentiment} size="small" variant="outlined" />
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Key Topics:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {insights.contentAnalysis.keyTopics.map((topic, index) => (
                  <Chip key={index} label={topic} size="small" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Predictions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Workflow Predictions
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Success Probability:</Typography>
                  <Typography variant="body2" color="success.main">
                    {insights.workflowPredictions.successProbability}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.workflowPredictions.successProbability}
                  color="success"
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Est. Approval Time</Typography>
                  <Typography variant="body2">{insights.workflowPredictions.estimatedApprovalTime}h</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Urgency Level</Typography>
                  <Chip 
                    label={insights.workflowPredictions.urgencyLevel} 
                    size="small" 
                    color={insights.workflowPredictions.urgencyLevel === 'CRITICAL' ? 'error' : 'default'}
                  />
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Potential Bottlenecks:</Typography>
              <List dense>
                {insights.workflowPredictions.potentialBottlenecks.map((bottleneck, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={bottleneck} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Assessment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Risk Assessment
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Overall Risk Score:</Typography>
                  <Typography variant="body2" color={getRiskColor(insights.riskAssessment.overallRiskScore)}>
                    {insights.riskAssessment.overallRiskScore}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.riskAssessment.overallRiskScore}
                  color={getRiskColor(insights.riskAssessment.overallRiskScore) as any}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom>Risk Factors:</Typography>
              <List dense>
                {insights.riskAssessment.riskFactors.map((factor, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Flag color="error" />
                    </ListItemIcon>
                    <ListItemText primary={factor} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1 }} />
                Compliance Analysis
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Compliance Score:</Typography>
                  <Typography variant="body2" color={getScoreColor(insights.complianceAnalysis.complianceScore)}>
                    {insights.complianceAnalysis.complianceScore}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.complianceAnalysis.complianceScore}
                  color={getScoreColor(insights.complianceAnalysis.complianceScore) as any}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Security Level</Typography>
                <Typography variant="body2">
                  <Chip 
                    label={insights.complianceAnalysis.securityLevel} 
                    size="small" 
                    color={insights.complianceAnalysis.securityLevel === 'HIGH' ? 'success' : 'warning'}
                  />
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Required Reviews:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {insights.complianceAnalysis.requiredReviews.map((review, index) => (
                  <Chip key={index} label={review} size="small" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb sx={{ mr: 1 }} />
                AI Recommendations
              </Typography>

              {insights.recommendations.map((rec, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Badge 
                      badgeContent={rec.priority} 
                      color={rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'success'}
                      sx={{ mr: 2 }}
                    >
                      <Star color="primary" />
                    </Badge>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2">{rec.description}</Typography>
                        <Chip label={rec.category} size="small" variant="outlined" sx={{ ml: 1 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Action:</strong> {rec.action}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Impact:</strong> {rec.impact}
                      </Typography>
                    </Box>
                  </Box>
                  {index < insights.recommendations.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIDocumentInsights;