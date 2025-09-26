export interface DocumentDetails {
  id: string;
  title: string;
  content?: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AirForceHeader {
  hasHeader: boolean;
  headerHtml?: string;
  documentStyles?: string;
  editableContent?: string;
}

export type ViewMode = 'base' | 'integrated' | 'supplement';
export type SupplementType = 'MAJCOM' | 'FIELD' | 'LOCAL';
export type ExportFormat = 'html' | 'pdf' | 'docx' | 'txt';

export interface SelectionButtonPosition {
  top: number;
  left: number;
}

export interface EditorState {
  // Document state
  documentData: DocumentDetails | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Editor state
  fontSize: string;
  fontFamily: string;
  currentPage: number;
  totalPages: number;
  wordCount: number;
  charCount: number;

  // Change tracking
  trackChanges: boolean;
  showChanges: boolean;
  changesDrawerOpen: boolean;

  // Supplements
  supplementDialogOpen: boolean;
  supplementType: SupplementType;
  supplementLevel: number;
  supplementOrganization: string;
  viewMode: ViewMode;
  hasSupplements: boolean;
  isSupplementDocument: boolean;
  documentOrganization: string;

  // Search and replace
  findReplaceOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  advancedSearchOpen: boolean;

  // Selection and AI
  showSelectionButton: boolean;
  selectionButtonPosition: SelectionButtonPosition;
  selectedText: string;
  aiGenerating: boolean;
  aiSuggestions: any[];
  showAiDialog: boolean;

  // Export
  exportDialogOpen: boolean;
  exportFormat: ExportFormat;

  // Comments and footnotes
  commentsOpen: boolean;

  // Air Force header
  airForceHeader: AirForceHeader;
}

// Additional types for editor components
import { Editor } from '@tiptap/react';

export interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  content: string;
  position?: number;
  timestamp: Date;
  userId: string;
  userName?: string;
  accepted?: boolean;
  rejected?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  position: number;
  createdAt: Date;
  userId: string;
  userName?: string;
  resolved?: boolean;
  replies?: Comment[];
}

export interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showComments?: boolean;
  showChanges?: boolean;
}

export interface DocumentHeaderProps {
  title: string;
  status?: string;
  lastSaved?: Date;
  onTitleChange?: (title: string) => void;
  actions?: React.ReactNode;
}

export interface EditorToolbarProps {
  editor: Editor | null;
  onFormatChange?: (format: string) => void;
  onAction?: (action: string) => void;
  disabled?: boolean;
}

export interface SupplementSectionManagerProps {
  documentId: string;
  editor: Editor;
  documentOrganization?: string;
  isSupplementDocument?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  isOpen?: boolean;
  onClose?: () => void;
  supplementType?: string;
  supplementLevel?: number;
  organization?: string;
}

export interface DocumentStructureToolbarProps {
  documentId?: string;
  editor: Editor;
  isSupplementDocument?: boolean;
  documentOrganization: string;
  hasSupplements: boolean;
  onAddSupplement: () => void;
  onSupplementsChange: (value: boolean) => void;
}

export interface CommentsPanelProps {
  open?: boolean;
  onClose?: () => void;
  comments: Comment[];
  editor: Editor;
  documentId?: string;
  onCommentsChange?: (comments: Comment[]) => void;
  onCommentAdd?: (comment: any) => void;
}

export interface AdvancedSearchReplaceProps {
  open: boolean;
  onClose: () => void;
  editor: Editor;
  searchTerm?: string;
  replaceTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onReplaceTermChange?: (term: string) => void;
}

export interface SupplementableSectionMarkerProps {
  documentId: string;
  editor: Editor;
  onSupplementCreate?: () => void;
}

export interface AppendixFormatterProps {
  documentId?: string;
  editor: Editor;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface JsonWorkflowDisplayProps {
  documentId: string;
  userRole: string;
  onResetRef?: (resetFn: any) => void;
  onWorkflowChange?: (instance: any) => void;
}