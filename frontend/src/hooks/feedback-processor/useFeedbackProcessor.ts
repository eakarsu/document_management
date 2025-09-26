import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import FeedbackVersionControl from '../../services/FeedbackVersionControl';
import {
  FeedbackItem,
  ConflictGroup,
  DocumentVersion,
  FeedbackChange,
  PerformanceMetrics,
  ErrorDetail,
  FeedbackMode
} from '../../types/feedback-processor';

interface UseFeedbackProcessorProps {
  documentId: string;
  documentContent: string;
  initialFeedback?: any[];
  onUpdate?: () => void;
  onContentChange?: (newContent: string) => void;
}

export const useFeedbackProcessor = ({
  documentId,
  documentContent,
  initialFeedback,
  onUpdate,
  onContentChange
}: UseFeedbackProcessorProps) => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [versionControl] = useState(() => new FeedbackVersionControl());
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
  const [appliedChanges, setAppliedChanges] = useState<FeedbackChange[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [previewContent, setPreviewContent] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<ErrorDetail[]>([]);
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
  }, [documentId, initialFeedback]);

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
    setFeedbackItems(items => {
      const pendingItems = items.filter(item => item.status === 'pending');
      const allPendingSelected = pendingItems.every(item => item.selected);

      return items.map(item =>
        item.status === 'pending'
          ? { ...item, selected: !allPendingSelected }
          : item
      );
    });
  }, []);

  // Toggle individual item selection
  const handleToggleSelect = useCallback((id: string) => {
    setFeedbackItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  // Apply feedback with version control
  const applyFeedback = useCallback(async (itemsToApply?: FeedbackItem[]) => {
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
      }

      // Update progress
      const totalItems = items.length;
      const processedItems = result.applied.length;
      setProcessingProgress((processedItems / totalItems) * 100);

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

      return result;

    } catch (error) {
      console.error('Error applying feedback:', error);
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Apply feedback failed',
        details: error
      }]);
      throw error;
    } finally {
      setLoading(false);
      setProcessingProgress(100);
    }
  }, [feedbackItems, documentContent, versionControl]);

  // Apply selected feedback
  const applySelectedFeedback = useCallback(async () => {
    const selected = feedbackItems.filter(item => item.selected);
    if (selected.length === 0) {
      throw new Error('No feedback items selected');
    }
    return await applyFeedback(selected);
  }, [feedbackItems, applyFeedback]);

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

      // Re-apply to get updated content
      await applyFeedback();

    } catch (error) {
      console.error('Error resolving conflict:', error);
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Resolve conflict failed',
        details: error
      }]);
      throw error;
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
        setPreviewContent('');
        setConflicts([]);

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
      setErrorDetails(prev => [...prev, {
        timestamp: new Date(),
        error: 'Save failed',
        details: error
      }]);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [previewContent, appliedChanges, documentId, versions, feedbackItems, onContentChange, onUpdate, loadVersionHistory, versionControl]);

  // Revert to version
  const revertToVersion = useCallback(async (versionId: string) => {
    try {
      const revertedContent = await versionControl.revertToVersion(versionId);
      if (onContentChange) {
        onContentChange(revertedContent);
      }
      await loadVersionHistory();
    } catch (error) {
      console.error('Error reverting:', error);
      throw error;
    }
  }, [versionControl, onContentChange, loadVersionHistory]);

  // Generate AI feedback
  const generateAIFeedback = useCallback(async () => {
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
        return aiFeedbackItems.length;
      } else {
        throw new Error('Failed to generate AI feedback');
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      throw error;
    } finally {
      setGeneratingAIFeedback(false);
    }
  }, [documentId, documentContent]);

  // Auto-save setup
  const setupAutoSave = useCallback((autoSave: boolean, delay: number = 5000) => {
    if (autoSave && previewContent) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveChanges(true);
      }, delay);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [previewContent, saveChanges]);

  // Initialize on mount
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
  }, [documentId, initializeVersionControl, feedbackMode, generateAIFeedback]);

  return {
    // State
    loading,
    saving,
    syncing,
    currentVersion,
    feedbackItems,
    conflicts,
    appliedChanges,
    versions,
    previewContent,
    processingProgress,
    errorDetails,
    feedbackMode,
    generatingAIFeedback,
    performanceMetrics,
    lastSyncTime,
    mounted,

    // Actions
    setFeedbackMode,
    handleSelectAll,
    handleToggleSelect,
    applyFeedback,
    applySelectedFeedback,
    resolveConflict,
    saveChanges,
    revertToVersion,
    generateAIFeedback,
    setupAutoSave,
    loadFeedback,
    loadVersionHistory,

    // Utilities
    mapCommentTypeToSeverity
  };
};