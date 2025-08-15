import { PrismaClient, Document, DocumentStatus, DocumentVersion } from '@prisma/client';
import { StorageService } from './StorageService';
import { SearchService } from './SearchService';
import { BinaryDiffService } from './BinaryDiffService';
import crypto from 'crypto';
import winston from 'winston';
import QRCode from 'qrcode';

interface CreateDocumentInput {
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

interface UpdateDocumentInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  status?: DocumentStatus;
  folderId?: string;
}

interface DocumentWithRelations extends Document {
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

interface SearchDocumentsInput {
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

export class DocumentService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private searchService: SearchService;
  private binaryDiffService: BinaryDiffService;
  private logger: winston.Logger;

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
  }

  async createDocument(
    input: CreateDocumentInput,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    try {
      this.logger.info('Creating document', {
        title: input.title,
        fileName: input.fileName,
        userId,
        organizationId
      });

      // Calculate file checksum and size
      const checksum = crypto.createHash('sha256').update(input.fileBuffer).digest('hex');
      const fileSize = input.fileBuffer.length;

      // Check for duplicate document
      const existingDoc = await this.prisma.document.findUnique({
        where: { checksum }
      });

      if (existingDoc) {
        this.logger.warn('Document with same checksum already exists', { 
          checksum, 
          existingDocId: existingDoc.id 
        });
        
        // If the existing document is deleted, reactivate it
        if (existingDoc.status === 'DELETED') {
          this.logger.info('Reactivating deleted document with same checksum', {
            documentId: existingDoc.id,
            checksum
          });
          
          await this.prisma.document.update({
            where: { id: existingDoc.id },
            data: {
              status: 'DRAFT',
              lastAccessedAt: new Date()
            }
          });
          
          // Re-index the document in Elasticsearch since it was deleted
          await this.searchService.indexDocumentWithExtraction(existingDoc.id, organizationId);
        } else {
          // Just update lastAccessedAt for active documents
          await this.prisma.document.update({
            where: { id: existingDoc.id },
            data: {
              lastAccessedAt: new Date()
            }
          });
        }
        
        // Return existing document (now reactivated if it was deleted)
        return this.getDocumentById(existingDoc.id, userId, organizationId);
      }

      // Upload file to storage
      const uploadResult = await this.storageService.uploadDocument(
        input.fileBuffer,
        {
          filename: input.fileName,
          originalName: input.originalName,
          mimeType: input.mimeType,
          size: fileSize,
          checksum
        },
        organizationId,
        userId
      );

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Generate document number and QR code
      const documentNumber = await this.generateDocumentNumber(organizationId);
      const qrCode = await this.generateQRCode(documentNumber);

      // Create document in database
      const document = await this.prisma.document.create({
        data: {
          title: input.title,
          description: input.description,
          fileName: input.fileName,
          originalName: input.originalName,
          mimeType: input.mimeType,
          fileSize,
          checksum,
          storagePath: uploadResult.storagePath!,
          storageProvider: 'minio',
          status: DocumentStatus.DRAFT,
          category: input.category,
          tags: input.tags || [],
          customFields: input.customFields || {},
          documentNumber,
          qrCode,
          createdById: userId,
          organizationId,
          folderId: input.folderId,
          parentDocumentId: input.parentDocumentId,
          currentVersion: 1
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          folder: {
            select: {
              id: true,
              name: true,
              fullPath: true
            }
          },
          parentDocument: {
            select: {
              id: true,
              title: true
            }
          },
          childDocuments: {
            select: {
              id: true,
              title: true
            }
          },
          versions: true,
          _count: {
            select: {
              versions: true,
              comments: true
            }
          }
        }
      });

      // Create initial version
      await this.prisma.documentVersion.create({
        data: {
          versionNumber: 1,
          title: input.title,
          description: input.description,
          fileName: input.fileName,
          fileSize,
          checksum,
          storagePath: uploadResult.storagePath!,
          changeNotes: 'Initial version',
          documentId: document.id,
          createdById: userId
        }
      });

      // Index document for search
      await this.searchService.indexDocument({
        id: document.id,
        title: document.title,
        content: '', // Will be populated by AI/OCR processing
        metadata: {
          category: document.category || undefined,
          tags: document.tags,
          mimeType: document.mimeType,
          customFields: document.customFields as Record<string, any> || undefined
        },
        organizationId
      });

      // Log audit trail
      await this.createAuditLog({
        action: 'CREATE',
        resource: 'DOCUMENT',
        resourceId: document.id,
        userId,
        newValues: {
          title: document.title,
          fileName: document.fileName,
          status: document.status
        }
      });

      this.logger.info('Document created successfully', {
        documentId: document.id,
        title: document.title,
        documentNumber: document.documentNumber
      });

      // Automatically index document in Elasticsearch with text extraction
      try {
        this.logger.info('Indexing uploaded document in Elasticsearch with text extraction', { 
          documentId: document.id,
          mimeType: document.mimeType 
        });
        
        // Use the new efficient method that extracts text content during indexing
        await this.searchService.indexDocumentWithExtraction(document.id, document.organizationId);
        
        this.logger.info('Document indexed successfully in Elasticsearch with full text content', { 
          documentId: document.id 
        });
      } catch (indexError) {
        // Log error but don't fail document creation
        this.logger.error('Failed to index document in Elasticsearch:', {
          documentId: document.id,
          error: indexError
        });
      }

      return document as DocumentWithRelations;

    } catch (error) {
      this.logger.error('Failed to create document:', error);
      throw error;
    }
  }

  async getDocumentById(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'READ');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          folder: {
            select: {
              id: true,
              name: true,
              fullPath: true
            }
          },
          parentDocument: {
            select: {
              id: true,
              title: true
            }
          },
          childDocuments: {
            select: {
              id: true,
              title: true
            }
          },
          versions: {
            orderBy: {
              versionNumber: 'desc'
            },
            take: 5 // Latest 5 versions
          },
          _count: {
            select: {
              versions: true,
              comments: true
            }
          }
        }
      });

      if (document) {
        // Update last accessed timestamp
        await this.prisma.document.update({
          where: { id: documentId },
          data: { lastAccessedAt: new Date() }
        });

        // Log access
        await this.createAuditLog({
          action: 'VIEW',
          resource: 'DOCUMENT',
          resourceId: documentId,
          userId
        });
      }

      return document as DocumentWithRelations;

    } catch (error) {
      this.logger.error('Failed to get document:', error);
      throw error;
    }
  }

  async updateDocument(
    documentId: string,
    input: UpdateDocumentInput,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'WRITE');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get current document
      const currentDoc = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        }
      });

      if (!currentDoc) {
        throw new Error('Document not found');
      }

      // Update document
      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ...input,
          updatedAt: new Date()
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          folder: {
            select: {
              id: true,
              name: true,
              fullPath: true
            }
          },
          parentDocument: {
            select: {
              id: true,
              title: true
            }
          },
          childDocuments: {
            select: {
              id: true,
              title: true
            }
          },
          versions: {
            orderBy: {
              versionNumber: 'desc'
            },
            take: 5
          },
          _count: {
            select: {
              versions: true,
              comments: true
            }
          }
        }
      });

      // Update search index
      await this.searchService.updateDocument({
        id: documentId,
        title: updatedDocument.title,
        metadata: {
          category: updatedDocument.category || undefined,
          tags: updatedDocument.tags,
          mimeType: updatedDocument.mimeType,
          customFields: updatedDocument.customFields as Record<string, any> || undefined
        }
      });

      // Log audit trail
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'DOCUMENT',
        resourceId: documentId,
        userId,
        oldValues: {
          title: currentDoc.title,
          status: currentDoc.status,
          category: currentDoc.category
        },
        newValues: {
          title: updatedDocument.title,
          status: updatedDocument.status,
          category: updatedDocument.category
        }
      });

      this.logger.info('Document updated successfully', {
        documentId,
        title: updatedDocument.title
      });

      return updatedDocument as DocumentWithRelations;

    } catch (error) {
      this.logger.error('Failed to update document:', error);
      throw error;
    }
  }

  async deleteDocument(
    documentId: string,
    userId: string,
    organizationId: string,
    permanent: boolean = false
  ): Promise<boolean> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'DELETE');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      if (permanent) {
        // Permanent deletion
        // Delete from storage
        await this.storageService.deleteDocument(document.storagePath);

        // Delete from database (cascade will handle versions, etc.)
        await this.prisma.document.delete({
          where: { id: documentId }
        });

        // Remove from search index
        await this.searchService.deleteDocument(documentId);

        this.logger.info('Document permanently deleted', { documentId });
      } else {
        // Soft deletion
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.DELETED,
            updatedAt: new Date()
          }
        });

        this.logger.info('Document soft deleted', { documentId });
      }

      // Log audit trail
      await this.createAuditLog({
        action: permanent ? 'DELETE_PERMANENT' : 'DELETE_SOFT',
        resource: 'DOCUMENT',
        resourceId: documentId,
        userId,
        oldValues: {
          title: document.title,
          status: document.status
        }
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to delete document:', error);
      throw error;
    }
  }

  async searchDocuments(
    input: SearchDocumentsInput,
    userId: string,
    organizationId: string
  ): Promise<{
    documents: DocumentWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = Math.max(1, input.page || 1);
      const limit = Math.min(100, Math.max(1, input.limit || 20));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        organizationId,
        status: {
          not: DocumentStatus.DELETED
        }
      };

      if (input.category) {
        where.category = input.category;
      }

      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags
        };
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.folderId) {
        where.folderId = input.folderId;
      }

      if (input.mimeType) {
        where.mimeType = input.mimeType;
      }

      if (input.dateRange) {
        where.createdAt = {
          gte: input.dateRange.from,
          lte: input.dateRange.to
        };
      }

      if (input.query) {
        where.OR = [
          { title: { contains: input.query, mode: 'insensitive' } },
          { description: { contains: input.query, mode: 'insensitive' } },
          { originalName: { contains: input.query, mode: 'insensitive' } },
          { tags: { hasSome: [input.query] } }
        ];
      }

      // Build order by
      const orderBy: any = {};
      const sortBy = input.sortBy || 'updatedAt';
      const sortOrder = input.sortOrder || 'desc';
      orderBy[sortBy] = sortOrder;

      // Execute queries
      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            folder: {
              select: {
                id: true,
                name: true,
                fullPath: true
              }
            },
            parentDocument: {
              select: {
                id: true,
                title: true
              }
            },
            childDocuments: {
              select: {
                id: true,
                title: true
              }
            },
            versions: {
              orderBy: {
                versionNumber: 'desc'
              },
              take: 1
            },
            _count: {
              select: {
                versions: true,
                comments: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.document.count({ where })
      ]);

      // Filter based on user permissions
      const accessibleDocuments = await this.filterDocumentsByAccess(
        documents as DocumentWithRelations[],
        userId,
        'READ'
      );

      const totalPages = Math.ceil(total / limit);

      return {
        documents: accessibleDocuments,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error) {
      this.logger.error('Failed to search documents:', error);
      throw error;
    }
  }

  async getDocumentContent(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<Buffer | null> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'READ');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        }
      });

      if (!document) {
        return null;
      }

      const content = await this.storageService.downloadDocument(document.storagePath);

      // Log download
      await this.createAuditLog({
        action: 'DOWNLOAD',
        resource: 'DOCUMENT',
        resourceId: documentId,
        userId
      });

      return content;

    } catch (error) {
      this.logger.error('Failed to get document content:', error);
      throw error;
    }
  }

  /**
   * Create a new document version with binary diff tracking
   */
  async createDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    input: {
      title?: string;
      description?: string;
      fileName: string;
      changeNotes?: string;
      changeType?: 'MAJOR' | 'MINOR' | 'PATCH';
    },
    userId: string,
    organizationId: string
  ): Promise<DocumentVersion | null> {
    try {
      this.logger.info('Creating document version with binary diff', {
        documentId,
        fileName: input.fileName,
        fileSize: fileBuffer.length,
        userId
      });

      // Get current document and latest version
      const currentDoc = await this.prisma.document.findFirst({
        where: { id: documentId, organizationId },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      });

      if (!currentDoc) {
        throw new Error('Document not found');
      }

      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'WRITE');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Calculate file checksum and next version number
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const nextVersion = (currentDoc.versions[0]?.versionNumber || 0) + 1;

      // Upload new file to storage
      const uploadResult = await this.storageService.uploadDocument(
        fileBuffer,
        {
          filename: input.fileName,
          originalName: input.fileName,
          mimeType: currentDoc.mimeType,
          size: fileBuffer.length,
          checksum
        },
        organizationId,
        userId
      );

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      // Generate binary diff if there's a previous version
      let diffData = null;
      if (currentDoc.versions.length > 0) {
        try {
          const previousVersion = currentDoc.versions[0];
          const previousFileBuffer = await this.storageService.downloadDocument(previousVersion.storagePath);
          
          if (!previousFileBuffer) {
            throw new Error('Could not download previous version for diff comparison');
          }
          
          // Generate binary diff
          const binaryDiffResult = await this.binaryDiffService.generateBinaryDiff(
            previousFileBuffer,
            fileBuffer,
            documentId,
            nextVersion,
            organizationId
          );

          diffData = {
            diffPath: binaryDiffResult.diffPath,
            diffSize: binaryDiffResult.diffSize,
            compressionRatio: binaryDiffResult.compressionRatio,
            patchAlgorithm: binaryDiffResult.patchAlgorithm,
            bytesChanged: binaryDiffResult.changeAnalysis.bytesChanged,
            percentChanged: binaryDiffResult.changeAnalysis.percentChanged,
            changeCategory: binaryDiffResult.changeAnalysis.changeCategory,
            similarity: binaryDiffResult.changeAnalysis.similarity
          };

          this.logger.info('Binary diff generated', {
            documentId,
            version: nextVersion,
            diffSize: diffData.diffSize,
            compressionRatio: diffData.compressionRatio,
            changeCategory: diffData.changeCategory
          });
        } catch (diffError) {
          this.logger.warn('Failed to generate binary diff, continuing without diff tracking', {
            documentId,
            version: nextVersion,
            error: diffError instanceof Error ? diffError.message : 'Unknown error'
          });
        }
      }

      // Create new version record
      const newVersion = await this.prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersion,
          title: input.title || currentDoc.title,
          description: input.description,
          fileName: input.fileName,
          fileSize: fileBuffer.length,
          checksum,
          storagePath: uploadResult.storagePath!,
          changeType: input.changeType || 'MINOR',
          changeNotes: input.changeNotes,
          createdById: userId,
          // Binary diff data
          diffPath: diffData?.diffPath,
          diffSize: diffData?.diffSize,
          compressionRatio: diffData?.compressionRatio,
          patchAlgorithm: diffData?.patchAlgorithm,
          bytesChanged: diffData?.bytesChanged,
          percentChanged: diffData?.percentChanged,
          changeCategory: diffData?.changeCategory,
          similarity: diffData?.similarity
        }
      });

      // Update document with new current version and set to IN_REVIEW
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          currentVersion: nextVersion,
          status: DocumentStatus.IN_REVIEW,
          updatedAt: new Date()
        }
      });

      // Log audit trail
      await this.createAuditLog({
        action: 'CREATE_VERSION',
        resource: 'DOCUMENT_VERSION',
        resourceId: newVersion.id,
        userId,
        newValues: {
          documentId,
          versionNumber: nextVersion,
          fileSize: fileBuffer.length,
          changeCategory: diffData?.changeCategory,
          similarity: diffData?.similarity
        }
      });

      this.logger.info('Document version created successfully', {
        documentId,
        versionId: newVersion.id,
        versionNumber: nextVersion,
        hasDiff: !!diffData
      });

      return newVersion;

    } catch (error) {
      this.logger.error('Failed to create document version:', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get detailed version history with diff information
   */
  async getVersionHistory(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<DocumentVersion[]> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'READ');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const versions = await this.prisma.documentVersion.findMany({
        where: { documentId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { versionNumber: 'desc' }
      });

      return versions;
    } catch (error) {
      this.logger.error('Failed to get version history:', error);
      throw error;
    }
  }

  /**
   * Compare two versions and return diff information
   */
  async compareVersions(
    documentId: string,
    fromVersion: number,
    toVersion: number,
    userId: string,
    organizationId: string
  ): Promise<{
    fromVersion: DocumentVersion;
    toVersion: DocumentVersion;
    diffSummary: {
      bytesChanged: number;
      percentChanged: number;
      changeCategory: string;
      similarity: number;
    } | null;
  }> {
    try {
      // Check permissions
      const hasAccess = await this.checkDocumentAccess(documentId, userId, 'READ');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const [fromVersionRecord, toVersionRecord] = await Promise.all([
        this.prisma.documentVersion.findFirst({
          where: { documentId, versionNumber: fromVersion },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }),
        this.prisma.documentVersion.findFirst({
          where: { documentId, versionNumber: toVersion },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        })
      ]);

      if (!fromVersionRecord || !toVersionRecord) {
        throw new Error('Version not found');
      }

      const diffSummary = toVersionRecord.bytesChanged ? {
        bytesChanged: toVersionRecord.bytesChanged,
        percentChanged: toVersionRecord.percentChanged || 0,
        changeCategory: toVersionRecord.changeCategory || 'UNKNOWN',
        similarity: toVersionRecord.similarity || 0
      } : null;

      return {
        fromVersion: fromVersionRecord,
        toVersion: toVersionRecord,
        diffSummary
      };
    } catch (error) {
      this.logger.error('Failed to compare versions:', error);
      throw error;
    }
  }

  private async generateDocumentNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.document.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    });

    return `DOC-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateQRCode(documentNumber: string): Promise<string> {
    try {
      return await QRCode.toDataURL(documentNumber);
    } catch (error) {
      this.logger.error('Failed to generate QR code:', error);
      return '';
    }
  }

  private async checkDocumentAccess(
    documentId: string,
    userId: string,
    permission: 'READ' | 'WRITE' | 'DELETE'
  ): Promise<boolean> {
    try {
      // Check if user has specific document permission
      const docPermission = await this.prisma.documentPermission.findFirst({
        where: {
          documentId,
          userId,
          permission: permission.toUpperCase() as any
        }
      });

      if (docPermission) {
        return true;
      }

      // Check if user is the creator
      const document = await this.prisma.document.findFirst({
        where: { id: documentId },
        select: { createdById: true }
      });

      if (document?.createdById === userId) {
        return true;
      }

      // Check folder permissions
      // TODO: Implement folder-based permissions

      // Check role permissions
      // TODO: Implement role-based permissions

      return false;

    } catch (error) {
      this.logger.error('Failed to check document access:', error);
      return false;
    }
  }

  private async filterDocumentsByAccess(
    documents: DocumentWithRelations[],
    userId: string,
    permission: 'READ' | 'WRITE' | 'DELETE'
  ): Promise<DocumentWithRelations[]> {
    const accessibleDocuments: DocumentWithRelations[] = [];

    for (const doc of documents) {
      const hasAccess = await this.checkDocumentAccess(doc.id, userId, permission);
      if (hasAccess) {
        accessibleDocuments.push(doc);
      }
    }

    return accessibleDocuments;
  }

  private async createAuditLog(logData: {
    action: string;
    resource: string;
    resourceId: string;
    userId: string;
    oldValues?: any;
    newValues?: any;
  }): Promise<void> {
    try {
      // Get user's IP and user agent from request context
      // This would typically come from the request context
      const ipAddress = '0.0.0.0'; // TODO: Get from request
      const userAgent = 'Unknown'; // TODO: Get from request

      await this.prisma.auditLog.create({
        data: {
          action: logData.action,
          resource: logData.resource,
          resourceId: logData.resourceId,
          oldValues: logData.oldValues,
          newValues: logData.newValues,
          ipAddress,
          userAgent,
          userId: logData.userId
        }
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}