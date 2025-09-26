import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import FeedbackVersionControl from '../../services/FeedbackVersionControl';
import {
  FeedbackItem,
  ConflictGroup,
  UseOPRFeedbackState,
  UseOPRFeedbackActions,
  FeedbackMode,
  PerformanceMetrics,
  DocumentVersion,
  FeedbackChange
} from './types';
import { mapCommentTypeToSeverity } from './utils';

export const useOPRFeedback = (
  documentId: string,
  documentContent: string,
  initialFeedback?: any[],
  onUpdate?: () => void,
  onContentChange?: (newContent: string) => void
): UseOPRFeedbackState & UseOPRFeedbackActions => {
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
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('ai');
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
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
  const initializeVersionControl = useCallback(async () => {
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
  }, [documentId, documentContent]);

  // Load feedback from API or use initialFeedback
  const loadFeedback = useCallback(async () => {
    try {
      setSyncing(true);

      console.log('🔍 OPRFeedback - loadFeedback called with:', {
        hasInitialFeedback: !!initialFeedback,
        initialFeedbackLength: initialFeedback?.length || 0,
        initialFeedbackData: initialFeedback
      });

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
  }, [initialFeedback, documentId]);

  // Load version history
  const loadVersionHistory = useCallback(async () => {
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
  }, [versionControl]);

  // Toggle select all
  const handleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setFeedbackItems(items =>
      items.map(item => ({ ...item, selected: newSelectAll && item.status === 'pending' }))
    );
  }, [selectAll]);

  // Toggle individual item selection
  const handleToggleSelect = useCallback((id: string) => {
    setFeedbackItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  // Apply selected feedback
  const applySelectedFeedback = useCallback(async () => {
    const selected = feedbackItems.filter(item => item.selected);
    if (selected.length === 0) {
      setErrorMessage('No feedback items selected');
      return;
    }

    await applyFeedback(selected);
  }, [feedbackItems]);

  // Apply all or selected feedback with version control
  const applyFeedback = useCallback(async (itemsToApply?: FeedbackItem[]) => {
    const startTime = performance.now();
    setLoading(true);
    setProcessingProgress(0);

    try {
      const items = itemsToApply || feedbackItems.filter(i => i.status === 'pending');

      const result = await versionControl.applyFeedback(items, documentContent);

      setAppliedChanges(prev => [...prev, ...result.applied]);

      if (result.conflicts.length > 0) {
        const newConflicts = result.conflicts.map(c => ({
          ...c,
          originalText: '',
          items: items.filter(f =>
            c.items.some(ci => ci.feedbackId === f.id)
          )
        }));
        setConflicts(prev => [...prev, ...newConflicts]);
      }

      if (result.applied.length > 0 && result.newContent) {
        setPreviewContent(result.newContent);
        setShowPreview(true);
      }

      const totalItems = items.length;
      const processedItems = result.applied.length;
      setProcessingProgress((processedItems / totalItems) * 100);

      if (result.conflicts.length > 0) {
        setTabValue(1);
        setSuccessMessage(
          `Applied ${result.applied.length} changes. ${result.conflicts.length} conflicts need resolution.`
        );
      } else {
        setSuccessMessage(`Successfully applied ${result.applied.length} feedback items!`);
      }

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
  }, [feedbackItems, versionControl, documentContent]);

  // Resolve a conflict
  const resolveConflict = useCallback(async (
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
  }, [versionControl, conflicts, applyFeedback]);

  // Save changes and create new version
  const saveChanges = useCallback(async (isAutoSave = false) => {
    if (!previewContent) return;

    const startTime = performance.now();
    setSaving(true);
    try {
      const newVersion = await versionControl.createVersion(
        previewContent,
        appliedChanges,
        `${isAutoSave ? 'Auto-saved' : 'Manual save'} - ${appliedChanges.length} changes applied`
      );

      const response = await api.put(`/api/documents/${documentId}`, {
        content: previewContent,
        customFields: {
          versions: [...versions, newVersion],
          lastVersionUpdate: new Date().toISOString()
        }
      });

      if (response.ok) {
        const remainingFeedback = feedbackItems.filter(
          item => item.status === 'pending' || item.status === 'conflicted'
        );
        setFeedbackItems(remainingFeedback);

        if (onContentChange) {
          onContentChange(previewContent);
        }

        setAppliedChanges([]);
        setShowPreview(false);
        setPreviewContent('');
        setConflicts([]);

        setSuccessMessage(`Changes ${isAutoSave ? 'auto-' : ''}saved successfully!`);

        if (onUpdate) {
          onUpdate();
        }

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
  }, [previewContent, versionControl, appliedChanges, versions, feedbackItems, onContentChange, onUpdate, loadVersionHistory, documentId]);

  // Revert to version
  const revertToVersion = useCallback(async (versionId: string) => {
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
  }, [versionControl, onContentChange, loadVersionHistory]);

  // Generate AI feedback
  const generateAIFeedback = useCallback(async () => {
    setGeneratingAIFeedback(true);
    try {
      const response = await api.post('/api/generate-ai-feedback', {
        documentId,
        documentContent,
        documentType: 'OPR'
      });

      if (response.ok) {
        const aiGeneratedFeedback = await response.json();

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
  }, [documentId, documentContent]);

  // Initialize version control
  useEffect(() => {
    setMounted(true);
    initializeVersionControl();
    setLastSyncTime(new Date().toLocaleTimeString());

    if (feedbackMode === 'ai' || feedbackMode === 'hybrid') {
      setTimeout(() => {
        generateAIFeedback();
      }, 1500);
    }
  }, [documentId, initializeVersionControl, feedbackMode, generateAIFeedback]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && previewContent) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveChanges(true);
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [previewContent, autoSave, saveChanges]);

  return {
    // State
    loading,
    saving,
    syncing,
    generatingAIFeedback,
    mounted,
    feedbackItems,
    conflicts,
    appliedChanges,
    currentVersion,
    versions,
    selectedConflict,
    tabValue,
    processingProgress,
    previewContent,
    showPreview,
    showVersionHistory,
    selectAll,
    showPositionDetails,
    autoSave,
    showErrorDetails,
    feedbackMode,
    successMessage,
    errorMessage,
    errorDetails,
    performanceMetrics,
    lastSyncTime,

    // Actions
    initializeVersionControl,
    loadFeedback,
    loadVersionHistory,
    handleSelectAll,
    handleToggleSelect,
    applySelectedFeedback,
    applyFeedback,
    resolveConflict,
    saveChanges,
    revertToVersion,
    generateAIFeedback,
    setTabValue,
    setShowVersionHistory,
    setShowPreview,
    setShowPositionDetails,
    setAutoSave,
    setShowErrorDetails,
    setFeedbackMode,
    setSuccessMessage,
    setErrorMessage
  };
};