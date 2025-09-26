import { FeedbackItem, FeedbackSeverity, DocumentPosition } from './types';

// Map comment type to severity
export const mapCommentTypeToSeverity = (type: string): FeedbackSeverity => {
  switch(type) {
    case 'C': return 'CRITICAL';
    case 'M': return 'MAJOR';
    case 'S': return 'SUBSTANTIVE';
    case 'A': return 'ADMINISTRATIVE';
    default: return 'ADMINISTRATIVE';
  }
};

// Get severity color for UI components
export const getSeverityColor = (severity: FeedbackSeverity) => {
  const severityColors = {
    CRITICAL: 'error',
    MAJOR: 'warning',
    SUBSTANTIVE: 'info',
    ADMINISTRATIVE: 'success'
  } as const;

  return severityColors[severity] || 'default';
};

// Format performance metrics
export const formatPerformanceTime = (milliseconds: number): string => {
  return `${milliseconds.toFixed(0)}ms`;
};

// Generate unique ID for components
export const generateUniqueId = (prefix: string = 'item'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format date for display
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

// Format time for display
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString();
};

// Format date and time for display
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Check if feedback item is AI generated
export const isAIGenerated = (item: FeedbackItem): boolean => {
  return item.metadata?.source === 'ai-generated' || item.reviewerId === 'ai-system';
};

// Get position display text
export const getPositionText = (location: DocumentPosition): string => {
  return `Page ${location.page}, ¶${location.paragraph}, Line ${location.line}`;
};

// Sort feedback items by severity and position
export const sortFeedbackItems = (items: FeedbackItem[]): FeedbackItem[] => {
  const severityOrder = { CRITICAL: 0, MAJOR: 1, SUBSTANTIVE: 2, ADMINISTRATIVE: 3 };

  return [...items].sort((a, b) => {
    // First sort by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by page
    const pageDiff = a.location.page - b.location.page;
    if (pageDiff !== 0) return pageDiff;

    // Then by paragraph
    const paragraphDiff = a.location.paragraph - b.location.paragraph;
    if (paragraphDiff !== 0) return paragraphDiff;

    // Finally by line
    return a.location.line - b.location.line;
  });
};

// Filter feedback items by status
export const filterByStatus = (items: FeedbackItem[], status: string): FeedbackItem[] => {
  return items.filter(item => item.status === status);
};

// Filter feedback items by severity
export const filterBySeverity = (items: FeedbackItem[], severity: FeedbackSeverity): FeedbackItem[] => {
  return items.filter(item => item.severity === severity);
};

// Get selected feedback items
export const getSelectedItems = (items: FeedbackItem[]): FeedbackItem[] => {
  return items.filter(item => item.selected);
};

// Count items by status
export const countByStatus = (items: FeedbackItem[]): Record<string, number> => {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

// Count items by severity
export const countBySeverity = (items: FeedbackItem[]): Record<FeedbackSeverity, number> => {
  return items.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, {} as Record<FeedbackSeverity, number>);
};

// Validate feedback item
export const validateFeedbackItem = (item: Partial<FeedbackItem>): string[] => {
  const errors: string[] = [];

  if (!item.content?.trim()) {
    errors.push('Content is required');
  }

  if (!item.reviewer?.trim()) {
    errors.push('Reviewer is required');
  }

  if (!item.location) {
    errors.push('Location is required');
  } else {
    if (!item.location.page || item.location.page < 1) {
      errors.push('Valid page number is required');
    }
    if (!item.location.paragraph || item.location.paragraph < 1) {
      errors.push('Valid paragraph number is required');
    }
    if (!item.location.line || item.location.line < 1) {
      errors.push('Valid line number is required');
    }
  }

  return errors;
};

// Check if two positions are equal
export const arePositionsEqual = (pos1: DocumentPosition, pos2: DocumentPosition): boolean => {
  return pos1.page === pos2.page &&
         pos1.paragraph === pos2.paragraph &&
         pos1.line === pos2.line;
};

// Check if position is within range
export const isPositionInRange = (
  position: DocumentPosition,
  start: DocumentPosition,
  end: DocumentPosition
): boolean => {
  // Convert position to a comparable number (page * 1000000 + paragraph * 1000 + line)
  const posNum = position.page * 1000000 + position.paragraph * 1000 + position.line;
  const startNum = start.page * 1000000 + start.paragraph * 1000 + start.line;
  const endNum = end.page * 1000000 + end.paragraph * 1000 + end.line;

  return posNum >= startNum && posNum <= endNum;
};

// Create a deep copy of feedback items (useful for state management)
export const cloneFeedbackItems = (items: FeedbackItem[]): FeedbackItem[] => {
  return items.map(item => ({
    ...item,
    location: { ...item.location },
    metadata: item.metadata ? { ...item.metadata } : undefined
  }));
};

// Calculate statistics for feedback processing
export const calculateFeedbackStats = (items: FeedbackItem[]) => {
  const total = items.length;
  const byStatus = countByStatus(items);
  const bySeverity = countBySeverity(items);
  const selected = getSelectedItems(items).length;
  const aiGenerated = items.filter(isAIGenerated).length;

  return {
    total,
    selected,
    aiGenerated,
    byStatus,
    bySeverity,
    pending: byStatus.pending || 0,
    applied: byStatus.applied || 0,
    conflicted: byStatus.conflicted || 0,
    critical: bySeverity.CRITICAL || 0,
    major: bySeverity.MAJOR || 0,
    substantive: bySeverity.SUBSTANTIVE || 0,
    administrative: bySeverity.ADMINISTRATIVE || 0
  };
};