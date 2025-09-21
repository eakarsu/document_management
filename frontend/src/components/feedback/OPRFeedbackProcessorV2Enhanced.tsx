'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  InputLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Collapse,
  Fade,
  Slide,
  Zoom
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
  LocationOn as LocationIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  Error as ErrorIcon,
  CheckCircleOutline,
  HighlightOff,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  DataUsage as DataUsageIcon,
  BugReport as BugIcon,
  AutoAwesome as GenerateAIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon
} from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { api } from '../../lib/api';
import FeedbackVersionControl, {
  DocumentPosition,
  FeedbackChange,
  DocumentVersion,
  FeedbackItem as ServiceFeedbackItem,
  ApplyResult,
  FeedbackConflict
} from '../../services/FeedbackVersionControl';

// Extend the service FeedbackItem to include UI-specific properties
interface FeedbackItem extends ServiceFeedbackItem {
  content: string;
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

interface OPRFeedbackProcessorV2EnhancedProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  initialFeedback?: any[];
  onUpdate?: () => void;
  onContentChange?: (newContent: string) => void;
}

const OPRFeedbackProcessorV2Enhanced: React.FC<OPRFeedbackProcessorV2EnhancedProps> = ({
  documentId,
  documentTitle,
  documentContent,
  initialFeedback,
  onUpdate,
  onContentChange
}) => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
  const [selectAll, setSelectAll] = useState(false);
  const [showPositionDetails, setShowPositionDetails] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  const [feedbackMode, setFeedbackMode] = useState<'manual' | 'ai' | 'hybrid'>('ai'); // Default to AI mode
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    processTime: 0,
    saveTime: 0
  });

  // Refs for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<Date>(new Date());
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Initialize version control
  useEffect(() => {
    setMounted(true);
    initializeVersionControl();
    setLastSyncTime(new Date().toLocaleTimeString());

    // Auto-generate AI feedback when component mounts in AI mode
    if (feedbackMode === 'ai' || feedbackMode === 'hybrid') {
      setTimeout(() => {
        generateAIFeedback();
      }, 1500); // Delay to ensure component is ready
    }
  }, [documentId]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && previewContent) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveChanges(true);
      }, 5000); // Auto-save after 5 seconds of inactivity
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [previewContent, autoSave]);

  const initializeVersionControl = async () => {
    const startTime = performance.now();
    setLoading(true);
    try {
      await versionControl.initialize(documentId, documentContent);
      await loadFeedback();
      await loadVersionHistory();

      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, loadTime }));

      // Set current version
      const latest = await versionControl.getLatestVersion();
      setCurrentVersion(latest);
    } catch (error) {
      console.error('Error initializing version control:', error);
      setErrorMessage('Failed to initialize version control');
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Init failed',
        details: error
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Load feedback from API or use initialFeedback
  const loadFeedback = async () => {
    try {
      setSyncing(true);

      // Debug log to see what we received
      console.log('🔍 OPRFeedbackProcessorV2Enhanced - loadFeedback called with:', {
        hasInitialFeedback: !!initialFeedback,
        initialFeedbackLength: initialFeedback?.length || 0,
        initialFeedbackData: initialFeedback
      });

      // Use initialFeedback if provided, otherwise fetch from API
      let feedback = [];
      if (initialFeedback && initialFeedback.length > 0) {
        console.log('✅ Using initialFeedback - not making API call');
        feedback = initialFeedback;
      } else if (!initialFeedback) {
        console.log('⚠️ No initialFeedback provided, fetching from API');
        const response = await api.get(`/api/documents/${documentId}/feedback`);
        if (response.ok) {
          const data = await response.json();
          feedback = data.crmFeedback || data.draftFeedback || [];
        }
      }

      // Convert to FeedbackItem format with location data
      const items: FeedbackItem[] = feedback.map((item: any) => {
        console.log('🔍 Processing feedback item:', item);
        return {
        id: item.id || Math.random().toString(),
        content: item.coordinatorComment || item.comment || item.content || item.text || '',
        severity: mapCommentTypeToSeverity(item.commentType || item.severity || 'S'),
        reviewer: item.pocName || item.reviewer || 'Unknown',
        reviewerId: item.pocEmail || item.reviewerId || 'unknown',
        location: {
          page: parseInt(item.page) || 1,
          paragraph: parseInt(item.paragraphNumber) || 1,
          line: parseInt(item.lineNumber) || 1
        },
        originalText: item.changeFrom || item.originalText || '',
        suggestedText: item.changeTo || item.suggestedText || '',
        createdAt: item.createdAt || new Date().toISOString(),
        status: item.status || 'pending',
        selected: false
      };
    });

      console.log('📋 Converted feedback items:', {
        totalItems: items.length,
        itemsWithPendingStatus: items.filter(item => item.status === 'pending').length,
        allStatuses: Array.from(new Set(items.map(item => item.status))),
        firstItem: items[0]
      });

      // Show all feedback items, not just pending ones
      setFeedbackItems(items);
      lastSyncTimeRef.current = new Date();
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading feedback:', error);
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Load feedback failed',
        details: error
      }]);
    } finally {
      setSyncing(false);
    }
  };

  // Map comment type to severity
  const mapCommentTypeToSeverity = (type: string): FeedbackItem['severity'] => {
    switch(type) {
      case 'C': return 'CRITICAL';
      case 'M': return 'MAJOR';
      case 'S': return 'SUBSTANTIVE';
      case 'A': return 'ADMINISTRATIVE';
      default: return 'ADMINISTRATIVE';
    }
  };

  // Load version history
  const loadVersionHistory = async () => {
    try {
      const history = await versionControl.getVersionHistory();
      setVersions(history);
    } catch (error) {
      console.error('Error loading versions:', error);
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Load versions failed',
        details: error
      }]);
    }
  };

  // Toggle select all
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setFeedbackItems(items =>
      items.map(item => ({ ...item, selected: newSelectAll && item.status === 'pending' }))
    );
  };

  // Toggle individual item selection
  const handleToggleSelect = (id: string) => {
    setFeedbackItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Apply selected feedback
  const applySelectedFeedback = async () => {
    const selected = feedbackItems.filter(item => item.selected);
    if (selected.length === 0) {
      setErrorMessage('No feedback items selected');
      return;
    }

    await applyFeedback(selected);
  };

  // Apply all or selected feedback with version control
  const applyFeedback = async (itemsToApply?: FeedbackItem[]) => {
    const startTime = performance.now();
    setLoading(true);
    setProcessingProgress(0);

    try {
      const items = itemsToApply || feedbackItems.filter(i => i.status === 'pending');

      const result = await versionControl.applyFeedback(items, documentContent);

      // Update state with results
      setAppliedChanges(prev => [...prev, ...result.applied]);

      // Handle conflicts
      if (result.conflicts.length > 0) {
        const newConflicts = result.conflicts.map(c => ({
          ...c,
          originalText: '', // Add empty originalText
          items: items.filter(f =>
            c.items.some(ci => ci.feedbackId === f.id)
          )
        }));
        setConflicts(prev => [...prev, ...newConflicts]);
      }

      // Update document content if changes were applied
      if (result.applied.length > 0 && result.newContent) {
        setPreviewContent(result.newContent);
        setShowPreview(true);
      }

      // Update progress
      const totalItems = items.length;
      const processedItems = result.applied.length;
      setProcessingProgress((processedItems / totalItems) * 100);

      // Show results
      if (result.conflicts.length > 0) {
        setTabValue(1); // Switch to conflicts tab
        setSuccessMessage(
          `Applied ${result.applied.length} changes. ${result.conflicts.length} conflicts need resolution.`
        );
      } else {
        setSuccessMessage(`Successfully applied ${result.applied.length} feedback items!`);
      }

      // Update feedback items status
      const updatedItems = feedbackItems.map(item => ({
        ...item,
        status: result.applied.find(a => a.feedbackId === item.id)
          ? 'applied' as const
          : result.conflicts.some(c => c.items.some(ci => ci.feedbackId === item.id))
          ? 'conflicted' as const
          : item.status,
        selected: false
      }));

      setFeedbackItems(updatedItems);

      const processTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, processTime }));

      // Auto-switch to applied tab if no conflicts
      if (result.conflicts.length === 0 && result.applied.length > 0) {
        setTabValue(2);
      }

    } catch (error) {
      console.error('Error applying feedback:', error);
      setErrorMessage('Failed to apply feedback');
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Apply feedback failed',
        details: error
      }]);
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
      await applyFeedback();

    } catch (error) {
      console.error('Error resolving conflict:', error);
      setErrorMessage('Failed to resolve conflict');
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Resolve conflict failed',
        details: error
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Save changes and create new version
  const saveChanges = async (isAutoSave = false) => {
    if (!previewContent) return;

    const startTime = performance.now();
    setSaving(true);
    try {
      // Create new version
      const newVersion = await versionControl.createVersion(
        previewContent,
        appliedChanges,
        `${isAutoSave ? 'Auto-saved' : 'Manual save'} - ${appliedChanges.length} changes applied`
      );

      // Update document content
      const response = await api.put(`/api/documents/${documentId}`, {
        content: previewContent,
        customFields: {
          versions: [...versions, newVersion],
          lastVersionUpdate: new Date().toISOString()
        }
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
        setConflicts([]);

        setSuccessMessage(`Changes ${isAutoSave ? 'auto-' : ''}saved successfully!`);

        if (onUpdate) {
          onUpdate();
        }

        // Reload version history
        await loadVersionHistory();

        const saveTime = performance.now() - startTime;
        setPerformanceMetrics(prev => ({ ...prev, saveTime }));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setErrorMessage('Failed to save changes');
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Save failed',
        details: error
      }]);
    } finally {
      setSaving(false);
    }
  };

  // Revert to version
  const revertToVersion = async (versionId: string) => {
    try {
      const revertedContent = await versionControl.revertToVersion(versionId);
      if (onContentChange) {
        onContentChange(revertedContent);
      }
      setSuccessMessage('Reverted to selected version');
      await loadVersionHistory();
    } catch (error) {
      console.error('Error reverting:', error);
      setErrorMessage('Failed to revert to version');
    }
  };

  // Generate AI feedback
  const generateAIFeedback = async () => {
    setGeneratingAIFeedback(true);
    try {
      const response = await api.post('/api/generate-ai-feedback', {
        documentId,
        documentContent,
        documentType: 'OPR' // Officer Performance Report
      });

      if (response.ok) {
        const aiGeneratedFeedback = await response.json();

        // Convert AI feedback to our FeedbackItem format
        const aiFeedbackItems: FeedbackItem[] = aiGeneratedFeedback.feedback.map((item: any, index: number) => ({
          id: `ai_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          content: item.comment || item.content,
          severity: item.severity || 'SUBSTANTIVE',
          reviewer: 'AI Assistant',
          reviewerId: 'ai-system',
          location: {
            page: item.page || 1,
            paragraph: item.paragraph || index + 1,
            line: item.line || 1,
            characterOffset: 0
          },
          originalText: item.originalText || '',
          suggestedText: item.suggestedText || item.suggestion || '',
          createdAt: new Date().toISOString(),
          status: 'pending',
          selected: false,
          metadata: { source: 'ai-generated' }
        }));

        setFeedbackItems(prev => [...prev, ...aiFeedbackItems]);
        setSuccessMessage(`Generated ${aiFeedbackItems.length} AI feedback items`);
      } else {
        setErrorMessage('Failed to generate AI feedback');
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      setErrorMessage('Failed to generate AI feedback');
    } finally {
      setGeneratingAIFeedback(false);
    }
  };

  // Render Version History
  const renderVersionHistory = () => (
    <Dialog
      open={showVersionHistory}
      onClose={() => setShowVersionHistory(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HistoryIcon />
          <Typography variant="h6">Version History</Typography>
          <Chip label={`${versions.length} versions`} size="small" />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((version, index) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <Chip
                      label={`v${version.versionNumber}`}
                      color={index === versions.length - 1 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{version.changes.length}</TableCell>
                  <TableCell>{version.description || 'No description'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => revertToVersion(version.id)}
                        disabled={index === versions.length - 1}
                      >
                        <UndoIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowVersionHistory(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // Render Position Details
  const renderPositionDetails = (location: DocumentPosition) => (
    <Fade in={showPositionDetails}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LocationIcon fontSize="small" color="action" />
        <Chip
          label={`Page ${location.page}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`¶ ${location.paragraph}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Line ${location.line}`}
          size="small"
          variant="outlined"
        />
      </Box>
    </Fade>
  );

  // Render Error Details
  const renderErrorDetails = () => (
    <Collapse in={showErrorDetails}>
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Error Log:</Typography>
        {errorDetails.slice(-5).map((error, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="caption">
              {mounted && error.timestamp ? error.timestamp.toLocaleTimeString() : 'Error'}: {error.error}
            </Typography>
          </Box>
        ))}
      </Alert>
    </Collapse>
  );

  // Render Real-time Status
  const renderRealtimeStatus = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {syncing && (
        <Chip
          icon={<SyncIcon />}
          label="Syncing..."
          size="small"
          color="primary"
          sx={{ animation: 'pulse 1s infinite' }}
        />
      )}
      {saving && (
        <Chip
          icon={<CloudSyncIcon />}
          label="Saving..."
          size="small"
          color="success"
        />
      )}
      {autoSave && (
        <Chip
          icon={<CheckCircleOutline />}
          label="Auto-save ON"
          size="small"
          color="success"
          variant="outlined"
        />
      )}
      {mounted && (
        <Typography variant="caption" color="text.secondary">
          Last sync: {lastSyncTime || 'Not synced'}
        </Typography>
      )}
    </Box>
  );

  // Render Performance Metrics
  const renderPerformanceMetrics = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Performance: Load {performanceMetrics.loadTime.toFixed(0)}ms |
        Process {performanceMetrics.processTime.toFixed(0)}ms |
        Save {performanceMetrics.saveTime.toFixed(0)}ms
      </Typography>
    </Box>
  );

  // Render feedback by severity with enhancements
  const renderFeedbackBySeverity = (severity: string) => {
    const items = feedbackItems.filter(
      item => item.severity === severity
    );

    console.log(`🔍 Rendering ${severity} feedback:`, {
      severity,
      itemsFound: items.length,
      allSeverities: feedbackItems.map(i => i.severity),
      items: items
    });

    // Always show the accordion even if empty for debugging
    // if (items.length === 0) return null;

    const severityColors = {
      CRITICAL: 'error',
      MAJOR: 'warning',
      SUBSTANTIVE: 'info',
      ADMINISTRATIVE: 'success'
    };

    return (
      <Accordion key={severity}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge badgeContent={items.length} color={severityColors[severity as keyof typeof severityColors] as any}>
              <Typography variant="subtitle1">{severity}</Typography>
            </Badge>
            <Checkbox
              size="small"
              checked={items.every(item => item.selected)}
              indeterminate={items.some(item => item.selected) && !items.every(item => item.selected)}
              onChange={() => {
                const allSelected = items.every(item => item.selected);
                setFeedbackItems(feedbackItems.map(item =>
                  items.find(i => i.id === item.id)
                    ? { ...item, selected: !allSelected }
                    : item
                ));
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {items.map(item => (
              <ListItem key={item.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={item.selected || false}
                    onChange={() => handleToggleSelect(item.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      {renderPositionDetails(item.location)}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Original:</strong> {item.originalText}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        <strong>Suggested:</strong> {item.suggestedText}
                      </Typography>
                    </Box>
                  }
                  secondary={`${item.reviewer} • ${new Date(item.createdAt).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  console.log('🎨 COMPONENT RENDER:', {
    feedbackItemsLength: feedbackItems.length,
    feedbackItems: feedbackItems,
    loading,
    tabValue
  });

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header with Version Control title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Version Control Feedback Processor
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {documentTitle} - {feedbackItems.length} pending | {conflicts.length} conflicts | {appliedChanges.length} applied
          </Typography>
          {currentVersion && (
            <Chip
              label={`Version ${currentVersion.versionNumber}`}
              color="primary"
              size="small"
            />
          )}
        </Stack>

        {/* Real-time status indicators */}
        {renderRealtimeStatus()}

        {/* Progress bar */}
        {processingProgress > 0 && processingProgress < 100 && (
          <LinearProgress
            variant="determinate"
            value={processingProgress}
            sx={{ mt: 2 }}
          />
        )}
      </Box>

      {/* Mode Toggle */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1">Feedback Mode:</Typography>
        <ToggleButtonGroup
          value={feedbackMode}
          exclusive
          onChange={(_, newMode) => newMode && setFeedbackMode(newMode)}
          size="small"
        >
          <ToggleButton value="manual">
            <ManualIcon sx={{ mr: 1 }} />
            Manual
          </ToggleButton>
          <ToggleButton value="ai">
            <GenerateAIIcon sx={{ mr: 1 }} />
            AI
          </ToggleButton>
          <ToggleButton value="hybrid">
            <HybridIcon sx={{ mr: 1 }} />
            Hybrid
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Generate AI Feedback Button */}
        {(feedbackMode === 'ai' || feedbackMode === 'hybrid') && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={generatingAIFeedback ? <CircularProgress size={16} /> : <GenerateAIIcon />}
            onClick={generateAIFeedback}
            disabled={generatingAIFeedback || loading}
          >
            {generatingAIFeedback ? 'Generating...' : 'Generate AI Feedback'}
          </Button>
        )}
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TrackChangesIcon />}
          onClick={() => applyFeedback()}
          disabled={loading || feedbackItems.length === 0}
        >
          Apply All
        </Button>

        <Button
          variant="outlined"
          startIcon={<BatchIcon />}
          onClick={applySelectedFeedback}
          disabled={loading || !feedbackItems.some(i => i.selected)}
        >
          Apply Selected ({feedbackItems.filter(i => i.selected).length})
        </Button>

        <Button
          variant="outlined"
          startIcon={selectAll ? <DeselectAllIcon /> : <SelectAllIcon />}
          onClick={handleSelectAll}
        >
          {selectAll ? 'Deselect All' : 'Select All'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setShowVersionHistory(true)}
        >
          Version History ({versions.length})
        </Button>

        {previewContent && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={() => saveChanges(false)}
              disabled={loading || saving}
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

        {/* Toggle switches */}
        <FormControlLabel
          control={
            <Switch
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              size="small"
            />
          }
          label="Auto-save"
        />

        <FormControlLabel
          control={
            <Switch
              checked={showPositionDetails}
              onChange={(e) => setShowPositionDetails(e.target.checked)}
              size="small"
            />
          }
          label="Position Tracking"
        />
      </Stack>

      {/* Error handling */}
      {errorDetails.length > 0 && (
        <Alert
          severity="error"
          action={
            <IconButton
              size="small"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
            >
              {showErrorDetails ? <HighlightOff /> : <BugIcon />}
            </IconButton>
          }
        >
          {errorDetails.length} errors occurred
        </Alert>
      )}
      {renderErrorDetails()}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab
          label={
            <Badge badgeContent={feedbackItems.filter(i => i.status === 'pending').length} color="primary">
              <Typography>Pending Feedback</Typography>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={conflicts.length} color="error">
              <Typography>Conflicts</Typography>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={appliedChanges.length} color="success">
              <Typography>Applied Changes</Typography>
            </Badge>
          }
        />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ minHeight: 400 }}>
        {/* Pending Feedback Tab */}
        {tabValue === 0 && (
          <Fade in={tabValue === 0}>
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : feedbackItems.length === 0 ? (
                <Alert severity="info">No feedback items available</Alert>
              ) : (
                <>
                  {renderFeedbackBySeverity('CRITICAL')}
                  {renderFeedbackBySeverity('MAJOR')}
                  {renderFeedbackBySeverity('SUBSTANTIVE')}
                  {renderFeedbackBySeverity('ADMINISTRATIVE')}
                </>
              )}
            </Box>
          </Fade>
        )}

        {/* Conflicts Tab */}
        {tabValue === 1 && (
          <Fade in={tabValue === 1}>
            <Box>
              {conflicts.length === 0 ? (
                <Alert severity="success">
                  No conflicts detected. All feedback can be applied automatically.
                </Alert>
              ) : (
                <List>
                  {conflicts.map(conflict => (
                    <Card key={conflict.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Conflict at: {renderPositionDetails(conflict.location)}
                        </Typography>

                        <Typography variant="body2" gutterBottom>
                          <strong>Original text:</strong> {conflict.originalText}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Multiple suggestions:
                        </Typography>

                        <List dense>
                          {conflict.items.map(item => (
                            <ListItem key={item.id}>
                              <Box>
                                <ListItemText
                                  primary={item.suggestedText}
                                  secondary={`${item.reviewer} • ${item.severity}`}
                                />
                                <Box sx={{ mt: 1 }}>
                                  <Chip label={item.reviewer} size="small" sx={{ mr: 1 }} />
                                  <Chip label={item.severity} size="small" />
                                </Box>
                              </Box>
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
                            Resolved: {conflict.resolution.resolvedAt}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
            </Box>
          </Fade>
        )}

        {/* Applied Changes Tab */}
        {tabValue === 2 && (
          <Fade in={tabValue === 2}>
            <Box>
              {appliedChanges.length === 0 ? (
                <Alert severity="info">No changes applied yet</Alert>
              ) : (
                <List>
                  {appliedChanges.map(change => (
                    <ListItem key={change.id}>
                      <ListItemIcon>
                        <CheckCircleOutline color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            {change.location && renderPositionDetails(change.location)}
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              "{change.originalText}" → "{change.actualAppliedText}"
                            </Typography>
                          </Box>
                        }
                        secondary={`Applied at ${change.appliedAt}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Fade>
        )}
      </Box>

      {/* Performance metrics */}
      {renderPerformanceMetrics()}

      {/* Dialogs */}
      {renderVersionHistory()}

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

export default OPRFeedbackProcessorV2Enhanced;