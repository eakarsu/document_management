'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Warning,
  CheckCircle,
  Speed,
  Group,
  Analytics,
  AutoFixHigh,
  Lightbulb,
  Timeline,
  Refresh
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AIWorkflowDashboardProps {
  organizationId: string;
  timeRange?: { from: Date; to: Date };
}

interface WorkflowHealth {
  score: number;
  status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
}

interface PredictiveAlert {
  type: 'DEADLINE_RISK' | 'CONFLICT_LIKELY' | 'BOTTLENECK_FORMING' | 'QUALITY_CONCERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  suggestedAction: string;
  timeframe: number;
}

interface WorkflowInsights {
  workflowHealth: WorkflowHealth;
  teamCollaboration: {
    effectivenessScore: number;
    communicationQuality: number;
    consensusBuilding: number;
    conflictResolution: number;
    improvements: string[];
  };
  predictiveAlerts: PredictiveAlert[];
}

const AIWorkflowDashboard: React.FC<AIWorkflowDashboardProps> = ({ 
  organizationId, 
  timeRange 
}) => {
  const [insights, setInsights] = useState<WorkflowInsights | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<PredictiveAlert | null>(null);
  const [optimizationDialog, setOptimizationDialog] = useState(false);

  useEffect(() => {
    loadAIDashboard();
  }, [organizationId, timeRange]);

  const loadAIDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load comprehensive insights
      const queryParams = timeRange ? `?from=${timeRange.from.toISOString()}&to=${timeRange.to.toISOString()}` : '';
      const insightsResponse = await api.get(`/api/ai-workflow/analytics/comprehensive-insights${queryParams}`);

      if (!insightsResponse.ok) {
        throw new Error('Failed to load AI insights');
      }

      const insightsData = await insightsResponse.json();
      setInsights(insightsData.insights);

      // Load AI dashboard data
      const dashboardResponse = await api.get(`/api/ai-workflow/analytics/dashboard${queryParams}`);

      if (!dashboardResponse.ok) {
        throw new Error('Failed to load AI dashboard');
      }

      const dashboardData = await dashboardResponse.json();
      setDashboard(dashboardData.dashboard);

    } catch (error) {
      console.error('Failed to load AI dashboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load AI dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeWorkflow = async (workflowId: string) => {
    try {
      const response = await api.post('/api/ai-workflow/optimize-workflow', {
        workflowId
      });

      if (response.ok) {
        alert('Workflow optimization completed! Check the optimized workflow in your workflow list.');
        loadAIDashboard(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to optimize workflow:', error);
      alert('Failed to optimize workflow. Please try again.');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'success';
      case 'AT_RISK': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'info';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'info';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE_RISK': return <Warning />;
      case 'CONFLICT_LIKELY': return <Group />;
      case 'BOTTLENECK_FORMING': return <Speed />;
      case 'QUALITY_CONCERN': return <CheckCircle />;
      default: return <Warning />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 2, color: 'primary.main' }} />
          AI Workflow Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAIDashboard}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHigh />}
            onClick={() => setOptimizationDialog(true)}
          >
            AI Optimization
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Workflow Health Overview */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Analytics sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Workflow Health
              </Typography>
              
              {insights && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={insights.workflowHealth.score}
                      size={60}
                      color={getHealthStatusColor(insights.workflowHealth.status) as any}
                    />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h4">
                        {insights.workflowHealth.score}%
                      </Typography>
                      <Chip
                        label={insights.workflowHealth.status}
                        size="small"
                        color={getHealthStatusColor(insights.workflowHealth.status) as any}
                      />
                    </Box>
                  </Box>

                  {insights.workflowHealth.issues.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Issues Detected:</Typography>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {insights.workflowHealth.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Collaboration Metrics */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Group sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Team Collaboration
              </Typography>
              
              {insights && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Effectiveness Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={insights.teamCollaboration.effectivenessScore}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2">
                      {insights.teamCollaboration.effectivenessScore}%
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Communication Quality
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={insights.teamCollaboration.communicationQuality}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2">
                      {insights.teamCollaboration.communicationQuality}%
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Consensus Building
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={insights.teamCollaboration.consensusBuilding}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2">
                      {insights.teamCollaboration.consensusBuilding}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Efficiency Overview */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Efficiency Metrics
              </Typography>
              
              {dashboard && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Overall Efficiency
                    </Typography>
                    <Typography variant="h6">
                      {dashboard.efficiency}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Predictions
                    </Typography>
                    <Typography variant="h6">
                      {dashboard.predictions?.length || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Bottlenecks
                    </Typography>
                    <Typography variant="h6" color={dashboard.bottlenecks?.length > 0 ? 'warning.main' : 'success.main'}>
                      {dashboard.bottlenecks?.length || 0}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Predictive Alerts */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Warning sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Predictive Alerts
              </Typography>
              
              {insights && insights.predictiveAlerts.length > 0 ? (
                <List>
                  {insights.predictiveAlerts.map((alert, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => setSelectedAlert(alert)}
                      sx={{
                        border: '1px solid',
                        borderColor: `${getSeverityColor(alert.severity)}.main`,
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: `${getSeverityColor(alert.severity)}.50`
                      }}
                    >
                      <ListItemIcon>
                        {getAlertIcon(alert.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={`Timeframe: ${alert.timeframe} hours - ${alert.suggestedAction}`}
                      />
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  No critical alerts detected. All workflows are operating normally.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Lightbulb sx={{ mr: 1, verticalAlign: 'bottom' }} />
                AI Recommendations
              </Typography>
              
              {dashboard && dashboard.recommendations && dashboard.recommendations.length > 0 ? (
                <List dense>
                  {dashboard.recommendations.slice(0, 5).map((rec: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Chip
                          label={rec.priority}
                          size="small"
                          color={rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.description}
                        secondary={`Impact: ${rec.impact}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific recommendations at this time. Your workflows are optimized!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Performance Timeline */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Active Workflow Predictions
              </Typography>
              
              {dashboard && dashboard.predictions && dashboard.predictions.length > 0 ? (
                <Grid container spacing={2}>
                  {dashboard.predictions.map((prediction: any, index: number) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {prediction.documentTitle || `Document ${prediction.publishingId.substring(0, 8)}`}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Success Probability
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={prediction.prediction.successProbability}
                              color={prediction.prediction.successProbability > 70 ? 'success' : 
                                     prediction.prediction.successProbability > 40 ? 'warning' : 'error'}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2">
                              {prediction.prediction.successProbability}%
                            </Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary">
                            Estimated completion: {prediction.prediction.estimatedCompletionTime} hours
                          </Typography>

                          {prediction.prediction.potentialBottlenecks?.length > 0 && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Bottlenecks detected: {prediction.prediction.potentialBottlenecks.length}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No active workflows to predict at this time.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Detail Dialog */}
      <Dialog
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details: {selectedAlert?.type.replace('_', ' ')}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Alert severity={getSeverityColor(selectedAlert.severity) as any} sx={{ mb: 2 }}>
                <Typography variant="h6">{selectedAlert.message}</Typography>
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                Suggested Action:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedAlert.suggestedAction}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Timeline:
              </Typography>
              <Typography variant="body1">
                Action needed within {selectedAlert.timeframe} hours
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAlert(null)}>
            Close
          </Button>
          <Button variant="contained">
            Take Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* Optimization Dialog */}
      <Dialog
        open={optimizationDialog}
        onClose={() => setOptimizationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>AI Workflow Optimization</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            AI can analyze your current workflows and suggest optimizations to improve efficiency, 
            reduce bottlenecks, and enhance collaboration.
          </Typography>
          <Alert severity="info">
            This will create optimized versions of your workflows based on performance data and AI analysis.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptimizationDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setOptimizationDialog(false);
              // Could implement workflow selection here
              alert('Workflow optimization feature will be available soon!');
            }}
          >
            Start Optimization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIWorkflowDashboard;