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
  commentType: 'C' | 'M' | 'S' | 'A';
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution: string;
  originatorJustification: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'merged';
}

export interface ChangeMarker {
  id: string;
  start: number;
  end: number;
}

export interface HistoryEntry {
  content: string;
  feedback: CRMComment[];
  timestamp: Date;
  changes: {
    applied: number;
    merged: number;
    details: Array<{
      id: string;
      original: string;
      changed: string;
      feedbackId: string;
    }>;
  };
}

export interface DocumentData {
  id: string;
  title: string;
  content?: string;
  description?: string;
  customFields?: {
    content?: string;
    htmlContent?: string;
    editableContent?: string;
    versionHistory?: HistoryEntry[];
    lastHistorySave?: string;
  };
}