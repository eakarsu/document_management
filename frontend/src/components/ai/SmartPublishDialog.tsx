'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Psychology,
  ExpandMore,
  TrendingUp,
  People,
  Speed,
  CheckCircle,
  Warning,
  Lightbulb,
  AutoFixHigh
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface SmartPublishDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  onSuccess: (result: any) => void;
}

interface AIAnalysis {
  contentComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredExpertise: string[];
  estimatedReviewTime: number;
  complianceFlags: string[];
  suggestedReviewers: string[];
  riskScore: number;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  confidenceScore: number;
  reasoning: string;
}

interface PredictionResult {
  successProbability: number;
  estimatedCompletionTime: number;
  potentialBottlenecks: {
    stepId: string;
    stepName: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedDelay: number;
    mitigation: string;
  }[];
  recommendations: string[];
}

const SmartPublishDialog: React.FC<SmartPublishDialogProps> = ({
  open,
  onClose,
  documentId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [useAIRecommendations, setUseAIRecommendations] = useState(true);
  const [naturalLanguageWorkflow, setNaturalLanguageWorkflow] = useState('');
  const [publishingNotes, setPublishingNotes] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [isEmergencyPublish, setIsEmergencyPublish] = useState(false);

  const [destinations] = useState([
    {
      destinationType: 'WEB_PORTAL' as const,
      destinationName: 'Internal Portal',
      destinationConfig: {}
    }
  ]);

  useEffect(() => {
    if (open && documentId) {
      analyzeDocument();
    }
  }, [open, documentId]);

  const analyzeDocument = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const response = await api.post('/api/ai-workflow/analyze-document', {
        documentId
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
      
      // Set urgency based on AI analysis
      setUrgencyLevel(data.analysis.urgencyLevel);
      setIsEmergencyPublish(data.analysis.riskScore > 80);
      
      // Generate initial notes based on AI reasoning
      setPublishingNotes(`AI Analysis: ${data.analysis.reasoning}`);

    } catch (error) {
      console.error('Failed to analyze document:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze document');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSmartSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const submissionData = {
        documentId,
        publishingNotes,
        urgencyLevel,
        isEmergencyPublish,
        destinations,
        useAIRecommendations,
        naturalLanguageWorkflow: naturalLanguageWorkflow.trim() || undefined
      };

      const response = await api.post('/api/ai-workflow/smart-submit', submissionData);

      if (!response.ok) {
        throw new Error('Failed to submit for smart publishing');
      }

      const data = await response.json();
      onSuccess(data.result);
      onClose();

    } catch (error) {
      console.error('Failed to submit for smart publishing:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit for smart publishing');
    } finally {
      setLoading(false);
    }
  };

  const generateWorkflowPreview = async () => {
    if (!naturalLanguageWorkflow.trim()) return;

    try {
      const response = await api.post('/api/ai-workflow/generate-workflow', {
        description: naturalLanguageWorkflow
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Workflow Preview:\nName: ${data.workflow.name}\nSteps: ${data.workflow.approvalSteps?.length || 0}\nDescription: ${data.workflow.description}`);
      }
    } catch (error) {
      console.error('Failed to generate workflow preview:', error);
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

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'success';
    if (risk < 70) return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 2, color: 'primary.main' }} />
          Smart Document Publishing
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* AI Analysis Section */}
        {analyzing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Analyzing document with AI...</Typography>
          </Box>
        ) : aiAnalysis ? (
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <AutoFixHigh sx={{ mr: 1, verticalAlign: 'bottom' }} />
                AI Analysis Results
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Document Complexity
                      </Typography>
                      <Chip
                        label={aiAnalysis.contentComplexity}
                        color={getComplexityColor(aiAnalysis.contentComplexity) as any}
                        sx={{ mb: 2 }}
                      />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        Risk Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={aiAnalysis.riskScore}
                          color={getRiskColor(aiAnalysis.riskScore) as any}
                          sx={{ flexGrow: 1, mr: 2 }}
                        />
                        <Typography variant="body2">
                          {aiAnalysis.riskScore}%
                        </Typography>
                      </Box>

                      <Typography variant="subtitle1" gutterBottom>
                        Estimated Review Time
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {aiAnalysis.estimatedReviewTime} hours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Required Expertise
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {aiAnalysis.requiredExpertise.map((expertise, index) => (
                          <Chip
                            key={index}
                            label={expertise}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>

                      <Typography variant="subtitle1" gutterBottom>
                        AI Confidence
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={aiAnalysis.confidenceScore}
                        color="primary"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {aiAnalysis.confidenceScore}% confidence
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {aiAnalysis.complianceFlags.length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2">Compliance Flags:</Typography>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {aiAnalysis.complianceFlags.map((flag, index) => (
                          <li key={index}>{flag}</li>
                        ))}
                      </ul>
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    AI Reasoning:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {aiAnalysis.reasoning}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ) : null}

        {/* Publishing Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Publishing Options
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={useAIRecommendations}
                onChange={(e) => setUseAIRecommendations(e.target.checked)}
              />
            }
            label="Use AI Recommendations (Auto-assign reviewers, optimize workflow)"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Natural Language Workflow (Optional)"
            placeholder="e.g., 'Documents need approval from legal team, then finance team, with 48-hour deadline'"
            value={naturalLanguageWorkflow}
            onChange={(e) => setNaturalLanguageWorkflow(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Describe your desired workflow in plain language, and AI will create it automatically"
          />

          {naturalLanguageWorkflow.trim() && (
            <Button
              variant="outlined"
              size="small"
              onClick={generateWorkflowPreview}
              sx={{ mb: 2 }}
            >
              Preview Generated Workflow
            </Button>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Publishing Notes"
            value={publishingNotes}
            onChange={(e) => setPublishingNotes(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Urgency Level"
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                SelectProps={{ native: true }}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEmergencyPublish}
                    onChange={(e) => setIsEmergencyPublish(e.target.checked)}
                  />
                }
                label="Emergency Publish"
              />
            </Grid>
          </Grid>
        </Box>

        {/* AI Suggestions */}
        {aiAnalysis && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Lightbulb sx={{ mr: 1, verticalAlign: 'bottom' }} />
                AI Suggestions
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText
                    primary="Suggested Reviewers"
                    secondary={`AI identified ${aiAnalysis.suggestedReviewers.length} optimal reviewers based on expertise and workload`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Speed />
                  </ListItemIcon>
                  <ListItemText
                    primary="Estimated Timeline"
                    secondary={`Expected completion in ${aiAnalysis.estimatedReviewTime} hours with current workload`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="Success Prediction"
                    secondary="AI will predict success probability and identify potential bottlenecks after submission"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Destination Preview */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Publishing Destinations:
          </Typography>
          {destinations.map((dest, index) => (
            <Chip
              key={index}
              label={`${dest.destinationType}: ${dest.destinationName}`}
              sx={{ mr: 1 }}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSmartSubmit}
          disabled={loading || analyzing}
          startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
        >
          {loading ? 'Publishing...' : 'Smart Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmartPublishDialog;