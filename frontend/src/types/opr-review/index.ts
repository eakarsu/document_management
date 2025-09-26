export interface CommentThread {
  id: string;
  feedbackId: string;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: Date;
  }>;
}

export interface CRMComment {
  id?: string;
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  commentType: string;
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution?: string;
  originatorJustification?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'merged';
  selected?: boolean;
  threadId?: string;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: Date;
  description: string;
  content: string;
  appliedChanges: Map<string, { original: string, changed: string, feedbackId: string }>;
  type: 'manual' | 'feedback' | 'restore';
}

export interface ChangeMarker {
  id: string;
  start: number;
  end: number;
  type: 'added' | 'removed' | 'modified';
}

export interface AlertState {
  severity: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

export type MergeMode = 'manual' | 'ai' | 'hybrid';