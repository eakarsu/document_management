export interface DocumentDetails {
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
}

export interface UserRole {
  role: string;
  roleType: string;
  email?: string;
}

export interface WorkflowState {
  active: boolean;
  stage: string;
  id: string;
  processing: boolean;
  history: any[];
  currentWorkflow: any;
  canMoveBackward: boolean;
  buttonRenderKey: number;
}

export interface FeedbackState {
  coordinatorInput: string;
  legalInput: string;
  actualCoordinatorFeedback: string | null;
  actualLegalFeedback: string | null;
  documentContentInput: string;
  savedDocumentContent: string | null;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  statusMenuAnchor: HTMLElement | null;
  isDocumentPublished: boolean;
}