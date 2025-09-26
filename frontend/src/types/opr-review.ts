export interface OPRReviewData {
  id: string;
  documentId: string;
  reviewerId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  comments: OPRComment[];
  feedback: OPRFeedback[];
  createdAt: Date;
  updatedAt: Date;
}

// CRMComment is the primary comment type with all fields
export interface CRMComment {
  id: string;
  component?: string;
  pocName?: string;
  pocPhone?: string;
  pocEmail?: string;
  commentType?: string;
  page?: string;
  paragraphNumber?: string;
  lineNumber?: string;
  coordinatorComment?: string;
  changeFrom?: string;
  changeTo?: string;
  coordinatorJustification?: string;
  originatorJustification?: string;
  resolution?: string;
  selected?: boolean;
  status?: 'pending' | 'accepted' | 'rejected' | 'deferred' | 'merged';
  // OPR-specific fields
  text?: string;
  author?: string;
  timestamp?: Date;
  resolved?: boolean;
  parentId?: string;
}

// Alias for backward compatibility
export type OPRComment = CRMComment;

export interface OPRFeedback {
  id: string;
  type: 'approval' | 'rejection' | 'request_changes';
  message: string;
  reviewer: string;
  timestamp: Date;
  addressed: boolean;
}

export interface OPRReviewWorkflow {
  currentStage: number;
  totalStages: number;
  stages: OPRReviewStage[];
}

export interface OPRReviewStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  assignedTo: string[];
  dueDate?: Date;
  actions: string[];
}


export type MergeMode = 'auto' | 'manual' | 'review' | 'ai' | 'hybrid';

export interface ChangeMarker {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  position: number;
  author: string;
  timestamp: Date;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details: string;
  documentVersion?: number;
  description?: string;
  type?: string;
  content?: string;
}

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// CommentThread type for threading support
export interface CommentThread {
  id: string;
  comments: CRMComment[];
  resolved: boolean;
}