'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemIcon,
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
  Snackbar,
  Stack,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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
  Psychology as AIRecommendIcon,
  History as HistoryIcon,
  Compare as CompareIcon,
  MergeType as MergeIcon,
  TrackChanges as TrackChangesIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { api } from '../../lib/api';
import FeedbackVersionControl, {
  DocumentPosition,
  FeedbackChange,
  DocumentVersion
} from '../../services/FeedbackVersionControl';

interface FeedbackItem {
  id: string;
  content: string;
  severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  reviewer: string;
  reviewerId: string;
  location: DocumentPosition;
  originalText: string;
  suggestedText: string;
  createdAt: string;
  status: 'pending' | 'applied' | 'rejected' | 'conflicted';
  metadata?: any;
}

interface ConflictGroup {
  id: string;
  location: DocumentPosition;
  originalText: string;
  items: FeedbackItem[];
  resolution?: {
    chosenFeedbackId?: string;
    customText?: string;
    resolvedBy: string;
    resolvedAt: string;
  };
}

interface OPRFeedbackProcessorV2Props {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onUpdate?: () => void;
  onContentChange?: (newContent: string) => void;
}

const OPRFeedbackProcessorV2: React.FC<OPRFeedbackProcessorV2Props> = ({
  documentId,
  documentTitle,
  documentContent,
  onUpdate,
  onContentChange
}) => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [versionControl] = useState(() => new FeedbackVersionControl());
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
  const [appliedChanges, setAppliedChanges] = useState<FeedbackChange[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictGroup | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Initialize version control
  useEffect(() => {
    initializeVersionControl();
  }, [documentId]);

  const initializeVersionControl = async () => {
    setLoading(true);
    try {
      await versionControl.initialize(documentId, documentContent);
      await loadFeedback();
      await loadVersionHistory();
    } catch (error) {
      console.error('Error initializing version control:', error);
      setErrorMessage('Failed to initialize version control');
    } finally {
      setLoading(false);
    }
  };

  // Load feedback from API
  const loadFeedback = async () => {
    try {
      const response = await api.get(`/api/documents/${documentId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        const feedback = data.crmFeedback || [];

        // Convert to FeedbackItem format with location data
        const items: FeedbackItem[] = feedback.map((item: any) => ({
          ...item,
          location: item.location || parseLocation(item.paragraph, item.line),
          originalText: item.originalSentence || item.content,
          suggestedText: item.suggestedText || '',
          status: item.status || 'pending'
        }));

        setFeedbackItems(items.filter(item => item.status === 'pending'));
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  // Parse location from legacy format
  const parseLocation = (paragraph: string, line: string): DocumentPosition => {
    // Parse "p2-para3-l5" format
    const parts = paragraph?.match(/p(\d+)-para(\d+)-l(\d+)/);
    if (parts) {
      return {
        page: parseInt(parts[1]) || 1,
        paragraph: parseInt(parts[2]) || 1,
        line: parseInt(parts[3]) || 1
      };
    }
    return { page: 1, paragraph: 1, line: 1 };
  };

  // Load version history
  const loadVersionHistory = async () => {
    try {
      const response = await api.get(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  // Apply all pending feedback with version control
  const applyAllFeedback = async () => {
    setLoading(true);
    setProcessingProgress(0);

    try {
      const result = await versionControl.applyFeedback(
        feedbackItems,
        documentContent
      );

      // Update state with results
      setAppliedChanges(result.applied);
      setConflicts(result.conflicts.map(c => ({
        ...c,
        originalText: '', // Add empty originalText for now
        items: feedbackItems.filter(f =>
          c.items.some(ci => ci.feedbackId === f.id)
        )
      })));

      // Update document content if changes were applied
      if (result.applied.length > 0 && (result as any).newContent) {
        setPreviewContent((result as any).newContent);
        setShowPreview(true);
      }

      // Update progress
      const totalItems = feedbackItems.length;
      const processedItems = result.applied.length;
      setProcessingProgress((processedItems / totalItems) * 100);

      // Show results
      if (result.conflicts.length > 0) {
        setTabValue(1); // Switch to conflicts tab
        setSuccessMessage(
          `Applied ${result.applied.length} changes. ${result.conflicts.length} conflicts need resolution.`
        );
      } else {
        setSuccessMessage(`Successfully applied all ${result.applied.length} feedback items!`);
      }

      // Update feedback items status
      const updatedItems = feedbackItems.map(item => ({
        ...item,
        status: result.applied.find(a => a.feedbackId === item.id)
          ? 'applied'
          : result.conflicts.some(c => c.items.some(ci => ci.feedbackId === item.id))
          ? 'conflicted'
          : item.status
      } as FeedbackItem));

      setFeedbackItems(updatedItems);

    } catch (error) {
      console.error('Error applying feedback:', error);
      setErrorMessage('Failed to apply feedback');
    } finally {
      setLoading(false);
      setProcessingProgress(100);
    }
  };

  // Resolve a conflict
  const resolveConflict = async (
    conflict: ConflictGroup,
    chosenFeedbackId?: string,
    customText?: string
  ) => {
    setLoading(true);

    try {
      await versionControl.resolveConflict(
        conflict.id,
        chosenFeedbackId || '',
        customText
      );

      // Update conflict resolution
      const updatedConflicts = conflicts.map(c =>
        c.id === conflict.id
          ? {
              ...c,
              resolution: {
                chosenFeedbackId,
                customText,
                resolvedBy: 'current_user',
                resolvedAt: new Date().toISOString()
              }
            }
          : c
      );

      setConflicts(updatedConflicts);
      setSelectedConflict(null);
      setSuccessMessage('Conflict resolved successfully');

      // Re-apply to get updated content
      await applyAllFeedback();

    } catch (error) {
      console.error('Error resolving conflict:', error);
      setErrorMessage('Failed to resolve conflict');
    } finally {
      setLoading(false);
    }
  };

  // Save changes and create new version
  const saveChanges = async () => {
    if (!previewContent) return;

    setLoading(true);
    try {
      // Update document content
      const response = await api.put(`/api/documents/${documentId}`, {
        content: previewContent
      });

      if (response.ok) {
        // Clear applied feedback
        const remainingFeedback = feedbackItems.filter(
          item => item.status === 'pending' || item.status === 'conflicted'
        );
        setFeedbackItems(remainingFeedback);

        // Update document content
        if (onContentChange) {
          onContentChange(previewContent);
        }

        // Reset states
        setAppliedChanges([]);
        setShowPreview(false);
        setPreviewContent('');

        setSuccessMessage('Changes saved successfully!');

        if (onUpdate) {
          onUpdate();
        }

        // Reload version history
        await loadVersionHistory();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setErrorMessage('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // Compare two versions
  const compareVersions = async (v1: string, v2: string) => {
    try {
      const diff = await versionControl.getVersionDiff(v1, v2);
      // Show diff in dialog
      console.log('Version diff:', diff);
    } catch (error) {
      console.error('Error comparing versions:', error);
    }
  };

  // Render feedback by severity
  const renderFeedbackBySeverity = (severity: string) => {
    const items = feedbackItems.filter(
      item => item.severity === severity && item.status === 'pending'
    );

    if (items.length === 0) return null;

    return (
      <Accordion key={severity}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Badge badgeContent={items.length} color="primary">
            <Typography variant="subtitle1">
              {severity} ({items.length})
            </Typography>
          </Badge>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {items.map(item => (
              <ListItem key={item.id}>
                <ListItemIcon>
                  <LocationIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Page {item.location.page}, Para {item.location.paragraph}, Line {item.location.line}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Original:</strong> {item.originalText}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        <strong>Suggested:</strong> {item.suggestedText}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Chip
                        label={item.reviewer}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                {item.status === 'applied' && (
                  <Chip
                    label="Applied"
                    color="success"
                    size="small"
                    icon={<ApproveIcon />}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Render conflicts
  const renderConflicts = () => {
    if (conflicts.length === 0) {
      return (
        <Alert severity="info">
          No conflicts detected. All feedback can be applied automatically.
        </Alert>
      );
    }

    return (
      <List>
        {conflicts.map(conflict => (
          <Card key={conflict.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conflict at Page {conflict.location.page},
                Para {conflict.location.paragraph},
                Line {conflict.location.line}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Original text:</strong> {conflict.originalText}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Multiple suggestions from reviewers:
              </Typography>

              <List dense>
                {conflict.items.map(item => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.suggestedText}
                      secondary={
                        <Box>
                          <Chip
                            label={item.reviewer}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={item.severity}
                            size="small"
                            color={
                              item.severity === 'CRITICAL' ? 'error' :
                              item.severity === 'MAJOR' ? 'warning' :
                              'default'
                            }
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => resolveConflict(conflict, item.id)}
                      >
                        Use This
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {conflict.resolution && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Resolved by {conflict.resolution.resolvedBy} on{' '}
                  {new Date(conflict.resolution.resolvedAt).toLocaleDateString()}
                </Alert>
              )}
            </CardContent>

            {!conflict.resolution && (
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<MergeIcon />}
                  onClick={() => setSelectedConflict(conflict)}
                >
                  Custom Resolution
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
      </List>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          OPR Feedback Processor (Version Control)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {documentTitle} - {feedbackItems.length} pending feedback items
        </Typography>

        {processingProgress > 0 && processingProgress < 100 && (
          <LinearProgress
            variant="determinate"
            value={processingProgress}
            sx={{ mt: 2 }}
          />
        )}
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TrackChangesIcon />}
          onClick={applyAllFeedback}
          disabled={loading || feedbackItems.length === 0}
        >
          Apply All Feedback
        </Button>

        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setShowVersionHistory(!showVersionHistory)}
        >
          Version History
        </Button>

        {previewContent && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={saveChanges}
              disabled={loading}
            >
              Save Changes
            </Button>

            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(!showPreview)}
            >
              Preview
            </Button>
          </>
        )}
      </Stack>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={`Pending (${feedbackItems.filter(i => i.status === 'pending').length})`} />
        <Tab label={`Conflicts (${conflicts.length})`} />
        <Tab label={`Applied (${appliedChanges.length})`} />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ minHeight: 400 }}>
        {tabValue === 0 && (
          <Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                {renderFeedbackBySeverity('CRITICAL')}
                {renderFeedbackBySeverity('MAJOR')}
                {renderFeedbackBySeverity('SUBSTANTIVE')}
                {renderFeedbackBySeverity('ADMINISTRATIVE')}
              </>
            )}
          </Box>
        )}

        {tabValue === 1 && renderConflicts()}

        {tabValue === 2 && (
          <List>
            {appliedChanges.map(change => (
              <ListItem key={change.id}>
                <ListItemIcon>
                  <ApproveIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`Changed: "${change.originalText}" → "${change.actualAppliedText}"`}
                  secondary={`Applied at ${change.appliedAt}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Custom Resolution Dialog */}
      <Dialog
        open={!!selectedConflict}
        onClose={() => setSelectedConflict(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Custom Conflict Resolution</DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <>
              <Typography variant="body2" gutterBottom>
                Original: {selectedConflict.originalText}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Custom Resolution"
                placeholder="Enter your merged/custom text"
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedConflict(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedConflict) {
                resolveConflict(selectedConflict, undefined, 'custom text here');
              }
            }}
          >
            Apply Custom
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Document Preview with Changes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={previewContent}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
      >
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default OPRFeedbackProcessorV2;