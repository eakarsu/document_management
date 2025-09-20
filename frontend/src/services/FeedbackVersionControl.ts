/**
 * Feedback Version Control Service
 * Implements Strategy 1: Track Changes with Version Control
 *
 * This service manages document feedback with automatic position tracking
 * and version control, handling multiple overlapping feedback items.
 */

export interface DocumentPosition {
  page: number;
  paragraph: number;
  line: number;
  characterOffset?: number;
}

export interface FeedbackChange {
  id: string;
  feedbackId: string;
  location: DocumentPosition;
  originalText: string;
  suggestedText: string;
  actualAppliedText?: string;
  appliedBy?: string;
  appliedAt?: string;
  status: 'pending' | 'applied' | 'rejected' | 'merged';
  conflictsWith?: string[]; // IDs of other changes at same location
}

export interface PositionDelta {
  paragraphDelta: number;
  lineDelta: number;
  characterDelta: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  changes: FeedbackChange[];
  positionMap: Map<string, PositionAdjustment>;
  content?: string;
  parentVersionId?: string;
}

export interface PositionAdjustment {
  originalPosition: DocumentPosition;
  currentPosition: DocumentPosition;
  delta: PositionDelta;
  reason: string; // Which change caused this adjustment
}

export class FeedbackVersionControl {
  private currentVersion: DocumentVersion | null = null;
  private positionTracker: Map<string, PositionAdjustment> = new Map();
  private changeHistory: FeedbackChange[] = [];

  /**
   * Initialize with current document version
   */
  async initialize(documentId: string, currentContent: string): Promise<void> {
    // Load current version from backend
    const response = await fetch(`/api/documents/${documentId}/versions/latest`);
    if (response.ok) {
      this.currentVersion = await response.json();
      this.rebuildPositionMap();
    } else {
      // Create initial version
      this.currentVersion = {
        id: `v1_${Date.now()}`,
        documentId,
        versionNumber: 1,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        changes: [],
        positionMap: new Map(),
        content: currentContent
      };
    }
  }

  /**
   * Apply feedback with automatic position tracking
   */
  async applyFeedback(
    feedbackItems: FeedbackItem[],
    documentContent: string
  ): Promise<ApplyResult> {
    // Sort feedback by position (top to bottom, left to right)
    const sorted = this.sortByPosition(feedbackItems);

    // Group overlapping feedback
    const groups = this.groupOverlappingFeedback(sorted);

    const results: ApplyResult = {
      applied: [],
      conflicts: [],
      adjustments: []
    };

    let workingContent = documentContent;

    for (const group of groups) {
      if (group.items.length === 1) {
        // Single feedback - apply directly
        const result = this.applySingleChange(
          group.items[0],
          workingContent
        );

        if (result.success) {
          results.applied.push(result.change);
          workingContent = result.newContent;

          // Update position tracking for subsequent changes
          this.updatePositionTracking(result.change);
        }
      } else {
        // Multiple feedback at same location - needs resolution
        const conflict = this.createConflict(group.items);
        results.conflicts.push(conflict);
      }
    }

    // Create new version with all changes
    if (results.applied.length > 0) {
      await this.createNewVersion(results.applied, workingContent);
    }

    return results;
  }

  /**
   * Apply a single feedback change to the document
   */
  private applySingleChange(
    feedback: FeedbackItem,
    content: string
  ): SingleChangeResult {
    // Adjust position based on previous changes
    const adjustedPosition = this.getAdjustedPosition(feedback.location);

    // Find and replace text at the adjusted position
    const lines = content.split('\n');
    const targetLine = this.getLineAtPosition(lines, adjustedPosition);

    if (!targetLine) {
      return {
        success: false,
        error: 'Could not locate target position'
      };
    }

    // Apply the change
    const newLine = targetLine.text.replace(
      feedback.originalText,
      feedback.suggestedText
    );

    lines[targetLine.index] = newLine;
    const newContent = lines.join('\n');

    const change: FeedbackChange = {
      id: `change_${Date.now()}_${Math.random()}`,
      feedbackId: feedback.id,
      location: feedback.location,
      originalText: feedback.originalText,
      suggestedText: feedback.suggestedText,
      actualAppliedText: feedback.suggestedText,
      appliedBy: feedback.reviewerId,
      appliedAt: new Date().toISOString(),
      status: 'applied'
    };

    return {
      success: true,
      change,
      newContent,
      delta: this.calculateDelta(feedback.originalText, feedback.suggestedText)
    };
  }

  /**
   * Calculate position adjustment based on text change
   */
  private calculateDelta(originalText: string, newText: string): PositionDelta {
    const originalLines = originalText.split('\n');
    const newLines = newText.split('\n');

    return {
      paragraphDelta: 0, // Paragraphs typically don't change from inline edits
      lineDelta: newLines.length - originalLines.length,
      characterDelta: newText.length - originalText.length
    };
  }

  /**
   * Update position tracking after applying a change
   */
  private updatePositionTracking(change: FeedbackChange): void {
    const delta = this.calculateDelta(change.originalText, change.suggestedText || '');

    // Update all positions that come after this change
    for (const [key, adjustment] of this.positionTracker.entries()) {
      const pos = adjustment.currentPosition;

      // If position is after the change, adjust it
      if (this.isPositionAfter(pos, change.location)) {
        if (pos.paragraph === change.location.paragraph) {
          // Same paragraph - adjust line and character
          adjustment.currentPosition.line += delta.lineDelta;
          adjustment.currentPosition.characterOffset =
            (adjustment.currentPosition.characterOffset || 0) + delta.characterDelta;
        } else if (pos.paragraph > change.location.paragraph && delta.lineDelta !== 0) {
          // Different paragraph but lines changed - may affect paragraph boundaries
          adjustment.currentPosition.line += delta.lineDelta;
        }

        adjustment.delta = {
          paragraphDelta: adjustment.currentPosition.paragraph - adjustment.originalPosition.paragraph,
          lineDelta: adjustment.currentPosition.line - adjustment.originalPosition.line,
          characterDelta: (adjustment.currentPosition.characterOffset || 0) -
                         (adjustment.originalPosition.characterOffset || 0)
        };
      }
    }
  }

  /**
   * Get adjusted position based on previous changes
   */
  private getAdjustedPosition(originalPosition: DocumentPosition): DocumentPosition {
    const key = this.getPositionKey(originalPosition);
    const adjustment = this.positionTracker.get(key);

    if (adjustment) {
      return adjustment.currentPosition;
    }

    // No adjustment needed - return original
    return { ...originalPosition };
  }

  /**
   * Create a position key for tracking
   */
  private getPositionKey(position: DocumentPosition): string {
    return `p${position.page}_para${position.paragraph}_l${position.line}`;
  }

  /**
   * Check if position A is after position B
   */
  private isPositionAfter(a: DocumentPosition, b: DocumentPosition): boolean {
    if (a.page !== b.page) return a.page > b.page;
    if (a.paragraph !== b.paragraph) return a.paragraph > b.paragraph;
    if (a.line !== b.line) return a.line > b.line;
    return (a.characterOffset || 0) > (b.characterOffset || 0);
  }

  /**
   * Sort feedback items by position
   */
  private sortByPosition(items: FeedbackItem[]): FeedbackItem[] {
    return [...items].sort((a, b) => {
      if (a.location.page !== b.location.page) {
        return a.location.page - b.location.page;
      }
      if (a.location.paragraph !== b.location.paragraph) {
        return a.location.paragraph - b.location.paragraph;
      }
      if (a.location.line !== b.location.line) {
        return a.location.line - b.location.line;
      }
      return (a.location.characterOffset || 0) - (b.location.characterOffset || 0);
    });
  }

  /**
   * Group feedback items that affect overlapping text
   */
  private groupOverlappingFeedback(items: FeedbackItem[]): FeedbackGroup[] {
    const groups: FeedbackGroup[] = [];
    let currentGroup: FeedbackGroup | null = null;

    for (const item of items) {
      if (!currentGroup || !this.isOverlapping(currentGroup, item)) {
        // Start new group
        currentGroup = {
          location: item.location,
          items: [item],
          span: {
            start: item.location,
            end: this.calculateEndPosition(item)
          }
        };
        groups.push(currentGroup);
      } else {
        // Add to current group
        currentGroup.items.push(item);
        // Update span
        const itemEnd = this.calculateEndPosition(item);
        if (this.isPositionAfter(itemEnd, currentGroup.span.end)) {
          currentGroup.span.end = itemEnd;
        }
      }
    }

    return groups;
  }

  /**
   * Check if a feedback item overlaps with a group
   */
  private isOverlapping(group: FeedbackGroup, item: FeedbackItem): boolean {
    const itemStart = item.location;
    const itemEnd = this.calculateEndPosition(item);

    // Check if item's range overlaps with group's span
    return !(this.isPositionAfter(itemStart, group.span.end) ||
             this.isPositionAfter(group.span.start, itemEnd));
  }

  /**
   * Calculate end position based on original text length
   */
  private calculateEndPosition(item: FeedbackItem): DocumentPosition {
    // Simplified - in reality would calculate based on text length
    return {
      ...item.location,
      characterOffset: (item.location.characterOffset || 0) + item.originalText.length
    };
  }

  /**
   * Create a conflict record for overlapping changes
   */
  private createConflict(items: FeedbackItem[]): FeedbackConflict {
    return {
      id: `conflict_${Date.now()}`,
      location: items[0].location,
      items: items.map(item => ({
        feedbackId: item.id,
        reviewer: item.reviewer,
        suggestedText: item.suggestedText,
        severity: item.severity
      })),
      needsResolution: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create a new document version with applied changes
   */
  private async createNewVersion(
    changes: FeedbackChange[],
    newContent: string
  ): Promise<DocumentVersion> {
    const newVersion: DocumentVersion = {
      id: `v${(this.currentVersion?.versionNumber || 0) + 1}_${Date.now()}`,
      documentId: this.currentVersion?.documentId || '',
      versionNumber: (this.currentVersion?.versionNumber || 0) + 1,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user', // Would get from auth context
      changes,
      positionMap: new Map(this.positionTracker),
      content: newContent,
      parentVersionId: this.currentVersion?.id
    };

    // Save to backend
    await fetch(`/api/documents/${newVersion.documentId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVersion)
    });

    this.currentVersion = newVersion;
    this.changeHistory.push(...changes);

    return newVersion;
  }

  /**
   * Rebuild position map from version history
   */
  private rebuildPositionMap(): void {
    this.positionTracker.clear();

    if (!this.currentVersion) return;

    // Replay all changes to rebuild position adjustments
    for (const change of this.currentVersion.changes) {
      this.updatePositionTracking(change);
    }
  }

  /**
   * Get line at adjusted position
   */
  private getLineAtPosition(
    lines: string[],
    position: DocumentPosition
  ): { text: string; index: number } | null {
    // Simplified - would need proper paragraph/line mapping
    let currentParagraph = 0;
    let paragraphLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '') {
        currentParagraph++;
        paragraphLine = 0;
      } else {
        paragraphLine++;

        if (currentParagraph === position.paragraph &&
            paragraphLine === position.line) {
          return { text: lines[i], index: i };
        }
      }
    }

    return null;
  }

  /**
   * Resolve a conflict by choosing one of the suggestions
   */
  async resolveConflict(
    conflictId: string,
    chosenFeedbackId: string,
    customText?: string
  ): Promise<void> {
    // Implementation for conflict resolution
    // Would apply the chosen change and mark others as superseded
  }

  /**
   * Get version comparison/diff
   */
  async getVersionDiff(
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff> {
    // Implementation for showing differences between versions
    return {
      added: [],
      removed: [],
      modified: []
    };
  }
}

// Type definitions
interface FeedbackItem {
  id: string;
  location: DocumentPosition;
  originalText: string;
  suggestedText: string;
  severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  reviewer: string;
  reviewerId: string;
  createdAt: string;
}

interface FeedbackGroup {
  location: DocumentPosition;
  items: FeedbackItem[];
  span: {
    start: DocumentPosition;
    end: DocumentPosition;
  };
}

interface SingleChangeResult {
  success: boolean;
  change?: FeedbackChange;
  newContent?: string;
  delta?: PositionDelta;
  error?: string;
}

interface ApplyResult {
  applied: FeedbackChange[];
  conflicts: FeedbackConflict[];
  adjustments: PositionAdjustment[];
}

interface FeedbackConflict {
  id: string;
  location: DocumentPosition;
  items: Array<{
    feedbackId: string;
    reviewer: string;
    suggestedText: string;
    severity: string;
  }>;
  needsResolution: boolean;
  createdAt: string;
}

interface VersionDiff {
  added: FeedbackChange[];
  removed: FeedbackChange[];
  modified: FeedbackChange[];
}

export default FeedbackVersionControl;