import { PrismaClient } from '@prisma/client';
import { StorageService } from './StorageService';
import { SearchService } from './SearchService';
import { BinaryDiffService } from './BinaryDiffService';
import winston from 'winston';
import { DocumentCRUD } from './document/DocumentCRUD';
import { DocumentVersioning } from './document/DocumentVersioning';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentWithRelations,
  SearchDocumentsInput,
  CreateVersionInput,
  BulkOperationInput,
  DocumentStatistics,
  AuditLogEntry
} from '../types/document/document.types';
import { buildDocumentSearchQuery, buildDocumentInclude } from '../utils/document/documentUtils';

export class DocumentService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private searchService: SearchService;
  private binaryDiffService: BinaryDiffService;
  private logger: winston.Logger;
  private crud: DocumentCRUD;
  private versioning: DocumentVersioning;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = new StorageService();
    this.searchService = new SearchService();
    this.binaryDiffService = new BinaryDiffService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.crud = new DocumentCRUD(
      this.prisma,
      this.storageService,
      this.searchService,
      this.logger
    );

    this.versioning = new DocumentVersioning(
      this.prisma,
      this.binaryDiffService,
      this.logger
    );
  }

  // Document CRUD operations
  async createDocument(
    input: CreateDocumentInput,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    const result = await this.crud.createDocument(input, userId, organizationId);
    await this.createAuditLog({
      action: 'CREATE',
      resource: 'DOCUMENT',
      resourceId: result?.id || '',
      userId,
      newValues: { title: input.title, fileName: input.fileName }
    });
    return result;
  }

  async updateDocument(
    documentId: string,
    input: UpdateDocumentInput,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    const result = await this.crud.updateDocument(documentId, input, userId, organizationId);
    await this.createAuditLog({
      action: 'UPDATE',
      resource: 'DOCUMENT',
      resourceId: documentId,
      userId,
      newValues: input
    });
    return result;
  }

  async deleteDocument(
    documentId: string,
    userId: string,
    organizationId: string,
    permanent: boolean = false
  ): Promise<boolean> {
    const result = await this.crud.deleteDocument(documentId, userId, organizationId, permanent);
    await this.createAuditLog({
      action: permanent ? 'DELETE_PERMANENT' : 'DELETE',
      resource: 'DOCUMENT',
      resourceId: documentId,
      userId
    });
    return result;
  }

  async getDocumentById(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    return this.crud.getDocumentById(documentId, userId, organizationId);
  }

  // Version management
  async createDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    input: CreateVersionInput,
    userId: string,
    organizationId: string
  ) {
    return this.versioning.createDocumentVersion(documentId, fileBuffer, input, userId, organizationId);
  }

  async getVersionHistory(
    documentId: string,
    userId: string,
    organizationId: string
  ) {
    return this.versioning.getVersionHistory(documentId, userId, organizationId);
  }

  async compareVersions(
    documentId: string,
    fromVersion: number,
    toVersion: number,
    userId: string,
    organizationId: string
  ) {
    return this.versioning.compareVersions(documentId, fromVersion, toVersion, userId, organizationId);
  }

  async restoreVersion(
    documentId: string,
    versionNumber: number,
    userId: string,
    organizationId: string
  ) {
    return this.versioning.restoreVersion(documentId, versionNumber, userId, organizationId);
  }

  // Search operations
  async searchDocuments(
    params: SearchDocumentsInput & { organizationId: string }
  ): Promise<{ documents: DocumentWithRelations[]; total: number }> {
    const where = buildDocumentSearchQuery(params);
    const include = buildDocumentInclude();

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include,
        skip: params.page ? (params.page - 1) * (params.limit || 10) : 0,
        take: params.limit || 10,
        orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder || 'desc' } : { createdAt: 'desc' }
      }),
      this.prisma.document.count({ where })
    ]);

    return {
      documents: documents as DocumentWithRelations[],
      total
    };
  }

  // Bulk operations
  async bulkOperation(
    input: BulkOperationInput,
    userId: string,
    organizationId: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const documentId of input.documentIds) {
      try {
        switch (input.operation) {
          case 'DELETE':
            await this.deleteDocument(documentId, userId, organizationId, false);
            break;
          case 'ARCHIVE':
            await this.updateDocument(documentId, { status: 'ARCHIVED' }, userId, organizationId);
            break;
          case 'RESTORE':
            await this.updateDocument(documentId, { status: 'DRAFT' }, userId, organizationId);
            break;
          case 'MOVE':
            if (input.targetFolderId) {
              await this.updateDocument(documentId, { folderId: input.targetFolderId }, userId, organizationId);
            }
            break;
        }
        success++;
      } catch (error: any) {
        this.logger.error(`Bulk operation failed for document ${documentId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Statistics
  async getDocumentStatistics(organizationId: string): Promise<DocumentStatistics> {
    const [
      totalDocuments,
      statusCounts,
      categoryCounts,
      fileSizes
    ] = await Promise.all([
      this.prisma.document.count({
        where: { organizationId, status: { not: 'DELETED' } }
      }),
      this.prisma.document.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true
      }),
      this.prisma.document.groupBy({
        by: ['category'],
        where: { organizationId, status: { not: 'DELETED' } },
        _count: true
      }),
      this.prisma.document.aggregate({
        where: { organizationId, status: { not: 'DELETED' } },
        _avg: { fileSize: true },
        _sum: { fileSize: true }
      })
    ]);

    const recentlyModified = await this.prisma.document.count({
      where: {
        organizationId,
        status: { not: 'DELETED' },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    return {
      totalDocuments,
      documentsByStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      documentsByCategory: categoryCounts.reduce((acc, item) => {
        if (item.category) acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      averageFileSize: fileSizes._avg.fileSize || 0,
      totalStorageUsed: fileSizes._sum.fileSize || 0,
      recentlyModified
    };
  }

  // Audit logging
  private async createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          userId: entry.userId,
          oldValues: entry.oldValues || {},
          newValues: entry.newValues || {},
          ipAddress: entry.ipAddress || 'unknown',
          userAgent: entry.userAgent || 'unknown'
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
  // Add missing method
  async getDocument(documentId: string): Promise<any> {
    return this.prisma.document.findUnique({
      where: { id: documentId }
    });
  }

  async getDocumentContent(documentId: string): Promise<Buffer> {
    const doc = await this.getDocument(documentId);
    if (!doc || !doc.content) {
      throw new Error('Document not found or has no content');
    }
    return Buffer.from(doc.content);
  }
}
