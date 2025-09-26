import { Document, DocumentStatus, DocumentVersion } from '@prisma/client';

export interface CreateDocumentInput {
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileBuffer: Buffer;
  category?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  folderId?: string;
  parentDocumentId?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  status?: DocumentStatus;
  folderId?: string;
}

export interface DocumentWithRelations extends Document {
  versions: DocumentVersion[];
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
    fullPath: string;
  };
  parentDocument?: {
    id: string;
    title: string;
  };
  childDocuments: {
    id: string;
    title: string;
  }[];
  _count: {
    versions: number;
    comments: number;
  };
}

export interface SearchDocumentsInput {
  query?: string;
  category?: string;
  tags?: string[];
  status?: DocumentStatus;
  folderId?: string;
  mimeType?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateVersionInput {
  title?: string;
  description?: string;
  fileName?: string;
  changeNotes?: string;
  changeType?: 'MAJOR' | 'MINOR' | 'PATCH';
}

export interface BulkOperationInput {
  documentIds: string[];
  operation: 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'MOVE';
  targetFolderId?: string;
  targetStatus?: DocumentStatus;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId: string;
  permission: 'READ' | 'WRITE' | 'ADMIN';
}

export interface DocumentExportOptions {
  format: 'PDF' | 'DOCX' | 'HTML' | 'JSON';
  includeMetadata?: boolean;
  includeVersionHistory?: boolean;
  includeComments?: boolean;
  watermark?: string;
}

export interface DocumentStatistics {
  totalDocuments: number;
  documentsByStatus: Record<DocumentStatus, number>;
  documentsByCategory: Record<string, number>;
  averageFileSize: number;
  totalStorageUsed: number;
  recentlyModified: number;
}

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}