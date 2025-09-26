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
  selected?: boolean;
  status?: string;
}

export interface DocumentData {
  id: string;
  title: string;
  category?: string;
  currentVersion?: string;
  status: string;
  fileName?: string;
  createdAt: string;
  description?: string;
  content?: string;
  customFields?: {
    editableContent?: string;
    htmlContent?: string;
    content?: string;
    headerHtml?: string;
    crmFeedback?: CRMComment[];
    draftFeedback?: CRMComment[];
    aiGenerated?: boolean;
    commentMatrix?: CRMComment[];
    lastDraftUpdate?: string;
    lastCommentUpdate?: string;
    lastAIFeedbackGenerated?: string;
    lastClearedAt?: string;
    lastModified?: string;
  };
}

export type CommentType = 'C' | 'M' | 'S' | 'A';
export type UserRole = 'Coordinator' | 'Reviewer' | 'ACTION_OFFICER';
export type WorkflowStage = '3.5' | '4' | '5' | '5.5' | '6' | string;

export interface WorkflowData {
  currentStageId?: string;
  activeTasks?: Array<{
    id: string;
    status: string;
  }>;
}

export interface AIFeedbackItem {
  category?: string;
  severity?: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  page?: number;
  paragraph?: number;
  line?: number;
  comment: string;
  originalText?: string;
  suggestedText?: string;
}