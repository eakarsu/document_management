'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as CriticalIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  Group as GroupIcon,
  AutoFixHigh as AIIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  BatchPrediction as BatchIcon,
  Assessment as AssessmentIcon,
  ThumbUp,
  ThumbDown,
  Psychology as AIRecommendIcon
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface FeedbackItem {
  id: string;
  content: string;
  severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  reviewer: string;
  reviewerId: string;
  location: {
    page: string;
    paragraph: string;
    line: string;
  };
  originalSentence: string;
  createdAt: string;
  status: string;
  metadata?: any;
}

interface ConsolidatedFeedback {
  locationKey: string;
  location: {
    page: string;
    paragraph: string;
    line: string;
  };
  originalSentence: string;
  feedbackCount: number;
  hasCritical: boolean;
  items: FeedbackItem[];
}

interface ProcessedResult {
  feedbackIds: string[];
  improvement: string;
  modelUsed: string;
  confidence: number;
}

interface OPRFeedbackProcessorProps {
  documentId: string;
  documentTitle: string;
  onUpdate?: () => void;
}

const OPRFeedbackProcessor: React.FC<OPRFeedbackProcessorProps> = ({
  documentId,
  documentTitle,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [feedbackGroups, setFeedbackGroups] = useState<ConsolidatedFeedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [justificationDialog, setJustificationDialog] = useState(false);
  const [justification, setJustification] = useState('');
  const [currentDecision, setCurrentDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStatus, setProcessingStatus] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadFeedback();
    loadCriticalCount();
  }, [documentId]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/feedback-processor/document/${documentId}/feedback?groupByLocation=true`
      );

      if (response.ok) {
        const data = await response.json();
        setFeedbackGroups(data.grouped || []);
      } else if (response.status === 404) {
        // Endpoint not implemented, silently ignore
        setFeedbackGroups([]);
      }
    } catch (error) {
      // Silently ignore if endpoint doesn't exist
      setFeedbackGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCriticalCount = async () => {
    try {
      const response = await api.get(
        `/api/feedback-processor/feedback/critical/${documentId}`
      );

      if (response.ok) {
        const data = await response.json();
        setCriticalCount(data.count);
      } else if (response.status === 404) {
        // Endpoint not implemented, silently ignore
        setCriticalCount(0);
      }
    } catch (error) {
      // Silently ignore if endpoint doesn't exist
      setCriticalCount(0);
    }
  };

  const handleDecision = async (feedback: FeedbackItem, decision: 'APPROVE' | 'REJECT') => {
    setSelectedFeedback(feedback);
    setCurrentDecision(decision);
    
    // For critical feedback rejection, require justification
    if (feedback.severity === 'CRITICAL' && decision === 'REJECT') {
      setJustificationDialog(true);
      return;
    }
    
    // For approval, show AI recommendation first
    if (decision === 'APPROVE') {
      await getAIRecommendation(feedback);
      setShowAIDialog(true);
      return;
    }
    
    // Process rejection directly
    await processFeedbackDecision(feedback.id, decision, '');
  };

  const processFeedbackDecision = async (
    feedbackId: string,
    decision: 'APPROVE' | 'REJECT',
    justificationText: string
  ) => {
    setProcessingStatus(new Map(processingStatus.set(feedbackId, 'processing')));
    
    try {
      const response = await api.post(
        `/api/feedback-processor/feedback/${feedbackId}/decision`,
        {
          decision,
          justification: justificationText
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.processed && data.result) {
          setSuccessMessage(
            `Feedback ${decision.toLowerCase()}d and improvement applied using ${data.result.modelUsed}`
          );
        } else {
          setSuccessMessage(`Feedback ${decision.toLowerCase()}d`);
        }
        
        setProcessingStatus(new Map(processingStatus.set(feedbackId, 'completed')));
        
        // Reload feedback
        await loadFeedback();
        await loadCriticalCount();
        
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process decision');
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      setProcessingStatus(new Map(processingStatus.set(feedbackId, 'failed')));
    }
  };

  const getAIRecommendation = async (feedback: FeedbackItem) => {
    try {
      const response = await api.post(
        '/api/feedback-processor/feedback/ai-recommendation',
        {
          originalSentence: feedback.originalSentence,
          feedbackContent: feedback.content,
          severity: feedback.severity,
          documentContext: '' // Could add surrounding context
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAiRecommendation(data);
      }
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedBatch.size === 0) {
      setErrorMessage('Please select feedback items to process');
      return;
    }
    
    setLoading(true);
    
    const approvedIds: string[] = [];
    const rejectedIds: string[] = [];
    
    // Separate approved and rejected (for now, we'll approve all selected)
    selectedBatch.forEach(id => {
      approvedIds.push(id);
    });
    
    try {
      const response = await api.post(
        '/api/feedback-processor/feedback/batch-process',
        {
          documentId,
          approvedFeedbackIds: approvedIds,
          rejectedFeedbackIds: rejectedIds
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(
          `Batch processing complete: ${data.summary.approved} approved, ${data.summary.rejected} rejected`
        );
        
        // Clear selection and reload
        setSelectedBatch(new Set());
        setBatchMode(false);
        await loadFeedback();
        
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error: any) {
      setErrorMessage('Batch processing failed');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'MAJOR': return 'warning';
      case 'SUBSTANTIVE': return 'info';
      case 'ADMINISTRATIVE': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <CriticalIcon />;
      case 'MAJOR': return <InfoIcon />;
      default: return null;
    }
  };

  const renderFeedbackGroup = (group: ConsolidatedFeedback) => {
    const isProcessing = Array.from(processingStatus.keys()).some(
      id => group.items.some(item => item.id === id)
    );
    
    return (
      <Accordion key={group.locationKey} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1">
                Page {group.location.page}, Paragraph {group.location.paragraph}, Line {group.location.line}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Original: "{group.originalSentence?.substring(0, 100)}..."
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {group.hasCritical && (
                <Chip
                  label="Critical"
                  color="error"
                  size="small"
                  icon={<CriticalIcon />}
                />
              )}
              <Badge badgeContent={group.feedbackCount} color="primary">
                <GroupIcon />
              </Badge>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {group.items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.severity}
                          size="small"
                          color={getSeverityColor(item.severity) as any}
                          icon={getSeverityIcon(item.severity) as any}
                        />
                        <Typography variant="body1">
                          {item.reviewer}
                        </Typography>
                        {item.status === 'RESOLVED' && (
                          <Chip label="Resolved" size="small" color="success" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.content}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {item.status !== 'RESOLVED' && item.status !== 'REJECTED' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {batchMode ? (
                          <Checkbox
                            checked={selectedBatch.has(item.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedBatch);
                              if (e.target.checked) {
                                newSet.add(item.id);
                              } else {
                                newSet.delete(item.id);
                              }
                              setSelectedBatch(newSet);
                            }}
                          />
                        ) : (
                          <>
                            <Tooltip title="Approve and apply AI improvement">
                              <IconButton
                                color="success"
                                onClick={() => handleDecision(item, 'APPROVE')}
                                disabled={isProcessing}
                              >
                                {processingStatus.get(item.id) === 'processing' ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <ThumbUp />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={
                              item.severity === 'CRITICAL' 
                                ? "Critical feedback requires resolution" 
                                : "Reject feedback"
                            }>
                              <IconButton
                                color="error"
                                onClick={() => handleDecision(item, 'REJECT')}
                                disabled={isProcessing || item.severity === 'CRITICAL'}
                              >
                                <ThumbDown />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          
          {group.feedbackCount > 1 && !batchMode && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Consolidation Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Multiple reviewers provided feedback for this location. 
                Use batch mode to process them together.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">
            OPR Feedback Processor
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {criticalCount > 0 && (
              <Chip
                label={`${criticalCount} Critical`}
                color="error"
                icon={<CriticalIcon />}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                />
              }
              label="Batch Mode"
            />
            {batchMode && selectedBatch.size > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<BatchIcon />}
                onClick={handleBatchProcess}
              >
                Process {selectedBatch.size} Items
              </Button>
            )}
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Document: {documentTitle}
        </Typography>
        
        {criticalCount > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            This document has {criticalCount} critical feedback item(s) that require mandatory resolution.
          </Alert>
        )}
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`All Feedback (${feedbackGroups.length})`} />
          <Tab label="Critical Only" />
          <Tab label="Processed" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {feedbackGroups
            .filter(group => {
              if (tabValue === 1) return group.hasCritical;
              if (tabValue === 2) return group.items.some(i => i.status === 'RESOLVED');
              return true;
            })
            .map(group => renderFeedbackGroup(group))}
        </Box>
      )}
      
      {/* AI Recommendation Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIRecommendIcon color="primary" />
            AI Recommendation
          </Box>
        </DialogTitle>
        <DialogContent>
          {aiRecommendation && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Original Sentence:
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  {selectedFeedback?.originalSentence}
                </Typography>
              </Paper>
              
              <Typography variant="subtitle2" gutterBottom>
                AI Improved Sentence:
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="body2">
                  {aiRecommendation.recommendation}
                </Typography>
              </Paper>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Model: {aiRecommendation.modelUsed}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {(aiRecommendation.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
              
              {aiRecommendation.reasoning && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {aiRecommendation.reasoning}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ApproveIcon />}
            onClick={async () => {
              setShowAIDialog(false);
              if (selectedFeedback) {
                await processFeedbackDecision(selectedFeedback.id, 'APPROVE', '');
              }
            }}
          >
            Apply Improvement
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Justification Dialog for Critical Rejection */}
      <Dialog
        open={justificationDialog}
        onClose={() => setJustificationDialog(false)}
      >
        <DialogTitle>Justification Required</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Critical feedback cannot be rejected without proper justification and resolution.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Provide justification and resolution"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJustificationDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={justification.length < 20}
            onClick={async () => {
              setJustificationDialog(false);
              if (selectedFeedback && currentDecision) {
                await processFeedbackDecision(
                  selectedFeedback.id,
                  currentDecision,
                  justification
                );
              }
              setJustification('');
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add missing import
import { Checkbox } from '@mui/material';

export default OPRFeedbackProcessor;