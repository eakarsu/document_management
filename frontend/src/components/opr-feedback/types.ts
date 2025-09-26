import {
  DocumentPosition,
  FeedbackChange,
  DocumentVersion,
  FeedbackItem as ServiceFeedbackItem,
  ApplyResult,
  FeedbackConflict
} from '../../services/FeedbackVersionControl';

// Extend the service FeedbackItem to include UI-specific properties
export interface FeedbackItem extends ServiceFeedbackItem {
  content: string;
  metadata?: any;
}

export interface ConflictGroup {
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

export interface OPRFeedbackProcessorV2EnhancedProps {
  documentId: string;
  documentTitle?: string;
  documentContent?: string;
  initialFeedback?: any[];
  onUpdate?: () => void;
  onContentChange?: (newContent: string) => void;
  onClose?: (processedFeedback?: any[]) => void;
}

export interface PerformanceMetrics {
  loadTime: number;
  processTime: number;
  saveTime: number;
}

export type FeedbackMode = 'manual' | 'ai' | 'hybrid';

export type FeedbackSeverity = 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';

export interface UseOPRFeedbackState {
  // Loading states
  loading: boolean;
  saving: boolean;
  syncing: boolean;
  generatingAIFeedback: boolean;
  mounted: boolean;

  // Feedback data
  feedbackItems: FeedbackItem[];
  conflicts: ConflictGroup[];
  appliedChanges: FeedbackChange[];
  currentVersion: DocumentVersion | null;
  versions: DocumentVersion[];

  // UI state
  selectedConflict: ConflictGroup | null;
  tabValue: number;
  processingProgress: number;
  previewContent: string;
  showPreview: boolean;
  showVersionHistory: boolean;
  selectAll: boolean;
  showPositionDetails: boolean;
  autoSave: boolean;
  showErrorDetails: boolean;
  feedbackMode: FeedbackMode;

  // Messages and metrics
  successMessage: string;
  errorMessage: string;
  errorDetails: any[];
  performanceMetrics: PerformanceMetrics;
  lastSyncTime: string;
}

export interface UseOPRFeedbackActions {
  // Data loading
  initializeVersionControl: () => Promise<void>;
  loadFeedback: () => Promise<void>;
  loadVersionHistory: () => Promise<void>;

  // Feedback management
  handleSelectAll: () => void;
  handleToggleSelect: (id: string) => void;
  applySelectedFeedback: () => Promise<void>;
  applyFeedback: (itemsToApply?: FeedbackItem[]) => Promise<void>;

  // Conflict resolution
  resolveConflict: (
    conflict: ConflictGroup,
    chosenFeedbackId?: string,
    customText?: string
  ) => Promise<void>;

  // Version control
  saveChanges: (isAutoSave?: boolean) => Promise<void>;
  revertToVersion: (versionId: string) => Promise<void>;

  // AI functionality
  generateAIFeedback: () => Promise<void>;

  // UI actions
  setTabValue: (value: number) => void;
  setShowVersionHistory: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setShowPositionDetails: (show: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setShowErrorDetails: (show: boolean) => void;
  setFeedbackMode: (mode: FeedbackMode) => void;
  setSuccessMessage: (message: string) => void;
  setErrorMessage: (message: string) => void;
}

// Export types from services for convenience
export type {
  DocumentPosition,
  FeedbackChange,
  DocumentVersion,
  ApplyResult,
  FeedbackConflict
} from '../../services/FeedbackVersionControl';