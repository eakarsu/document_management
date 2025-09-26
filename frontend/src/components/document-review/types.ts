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
  category: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdById: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  filePath?: string;
  content?: string;
  customFields?: any;
  fileName?: string;
}

export interface ReviewState {
  comments: CRMComment[];
  documentData: DocumentData | null;
  documentContent: string;
  showAddForm: boolean;
  showLineNumbers: boolean;
  showPageNumbers: boolean;
  selectedComment: CRMComment | null;
  generatingAIFeedback: boolean;
  isAIGeneratedDoc: boolean;
  aiFeedbackCount: number;
  workflowStage: string;
  userRole: string;
}

export interface CurrentCommentState {
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
}