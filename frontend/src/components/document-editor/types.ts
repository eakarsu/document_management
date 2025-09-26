import { Change } from '@/lib/tiptap-change-tracking';
import { Comment } from '@/lib/tiptap-comments';
import { Footnote } from '@/lib/tiptap-footnotes';

export interface DocumentDetails {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  status: string;
  publishedVersion?: number;
  publishedAt?: string;
  currentVersion?: string;
  organization?: string;
  isSupplementDocument?: boolean;
  supplementType?: string;
  supplementLevel?: number;
  parentDocumentId?: string;
  supplements?: any[];
  customFields?: {
    supplements?: any[];
    supplementedSections?: any[];
  };
}

export interface EditorState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  trackChanges: boolean;
  showChanges: boolean;
  changes: Change[];
  changesDrawerOpen: boolean;
  wordCount: number;
  charCount: number;
  currentPage: number;
  totalPages: number;
}

export interface EditorUI {
  fontSize: string;
  fontFamily: string;
  findReplaceOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  commentsDrawerOpen: boolean;
  comments: Comment[];
  appendixDrawerOpen: boolean;
  showHeader: boolean;
  footnotes: Footnote[];
  footnotesOpen: boolean;
  previewMode: boolean;
  historyOpen: boolean;
  spellCheck: boolean;
  versionsOpen: boolean;
  findOpen: boolean;
  formulaOpen: boolean;
  tableOpen: boolean;
  smartComplete: boolean;
}

export interface SupplementConfig {
  dialogOpen: boolean;
  type: string;
  level: number;
  organization: string;
}

export interface ViewMode {
  mode: 'base' | 'integrated' | 'supplement';
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface PageDimensions {
  width: number;
  height: number;
  margin: number;
}

export const PAGE_DIMENSIONS: PageDimensions = {
  width: 816,
  height: 1056,
  margin: 48,
};