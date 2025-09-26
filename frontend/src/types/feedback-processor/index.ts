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
  documentTitle: string;
  documentContent: string;
  initialFeedback?: any[];
  onUpdate?: () => void;
  onContentChange?: (newContent: string) => void;
}

export interface PerformanceMetrics {
  loadTime: number;
  processTime: number;
  saveTime: number;
}

export type FeedbackMode = 'manual' | 'ai' | 'hybrid';

export interface ErrorDetail {
  timestamp: Date;
  error: string;
  details: any;
}

// Re-export types from the service
export type {
  DocumentPosition,
  FeedbackChange,
  DocumentVersion,
  ApplyResult,
  FeedbackConflict
};