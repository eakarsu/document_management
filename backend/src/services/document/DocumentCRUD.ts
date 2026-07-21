import { PrismaClient, DocumentStatus } from '@prisma/client';
import { StorageService } from '../StorageService';
import { SearchService } from '../SearchService';
import winston from 'winston';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentWithRelations
} from '../../types/document/document.types';
import {
  generateDocumentNumber,
  generateQRCode,
  calculateChecksum,
  checkDuplicateDocument,
  buildDocumentInclude
} from '../../utils/document/documentUtils';

export class DocumentCRUD {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private searchService: SearchService;
  private logger: winston.Logger;

  constructor(
    prisma: PrismaClient,
    storageService: StorageService,
    searchService: SearchService,
    logger: winston.Logger
  ) {
    this.prisma = prisma;
    this.storageService = storageService;
    this.searchService = searchService;
    this.logger = logger;
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

      const checksum = calculateChecksum(input.fileBuffer);
      const fileSize = input.fileBuffer.length;

      // Check for duplicate
      const existingDoc = await checkDuplicateDocument(checksum, organizationId);
      if (existingDoc) {
        return this.handleExistingDocument(existingDoc, userId, organizationId);
      }

      // Upload file
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

      // Create document
      const documentNumber = await generateDocumentNumber(organizationId);
      const qrCode = await generateQRCode(documentNumber);

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
          objectVersionId: uploadResult.storageVersionId,
          retentionUntil: new Date(Date.now() + Number(process.env.DEFAULT_RETENTION_DAYS || 2555) * 86_400_000),
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
        include: buildDocumentInclude()
      });

      // Create initial version
      await this.createInitialVersion(document.id, input, uploadResult.storagePath!, uploadResult.storageVersionId, fileSize, checksum, userId);

      // Index for search
      await this.indexDocument(document, organizationId);

      this.logger.info('Document created successfully', {
        documentId: document.id,
        documentNumber
      });

      return document as DocumentWithRelations;
    } catch (error: any) {
      this.logger.error('Document creation failed:', error);
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
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId,
          status: { not: 'DELETED' }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Merge customFields to preserve existing data
      // Metadata updates are deliberately allow-listed. Workflow/publication,
      // retention, classification, storage pointers and ownership have separate
      // governed services and must never be mass-assigned from an API payload.
      const updateData: any = { updatedAt: new Date() };
      for (const key of ['title', 'description', 'category', 'tags', 'folderId'] as const) {
        if (input[key] !== undefined) updateData[key] = input[key];
      }

      // If customFields are being updated, merge with existing customFields
      if (input.customFields) {
        updateData.customFields = {
          ...(document.customFields as any || {}),
          ...input.customFields
        };
      }

      const updated = await this.prisma.document.update({
        where: { id: documentId },
        data: updateData,
        include: buildDocumentInclude()
      });

      // Update search index
      await this.searchService.updateDocument({
        id: documentId,
        title: input.title,
        metadata: {
          category: input.category,
          tags: input.tags || [],
          mimeType: updated.mimeType,
          customFields: input.customFields
        }
      });

      return updated as DocumentWithRelations;
    } catch (error: any) {
      this.logger.error('Document update failed:', error);
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
        throw new Error('USE_GOVERNED_DELETION_JOB');
      } else {
        // Soft delete
        await this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'DELETED' }
        });
      }

      return true;
    } catch (error: any) {
      this.logger.error('Document deletion failed:', error);
      throw error;
    }
  }

  async getDocumentById(
    documentId: string,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
        status: { not: 'DELETED' }
      },
      include: buildDocumentInclude()
    });

    return document as DocumentWithRelations;
  }

  private async handleExistingDocument(
    existingDoc: any,
    userId: string,
    organizationId: string
  ): Promise<DocumentWithRelations | null> {
    if (existingDoc.status === 'DELETED') {
      await this.prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          status: 'DRAFT',
          lastAccessedAt: new Date()
        }
      });
      await this.searchService.indexDocumentWithExtraction(existingDoc.id, organizationId);
    } else {
      await this.prisma.document.update({
        where: { id: existingDoc.id },
        data: { lastAccessedAt: new Date() }
      });
    }
    return this.getDocumentById(existingDoc.id, userId, organizationId);
  }

  private async createInitialVersion(
    documentId: string,
    input: CreateDocumentInput,
    storagePath: string,
    objectVersionId: string | undefined,
    fileSize: number,
    checksum: string,
    userId: string
  ) {
    await this.prisma.documentVersion.create({
      data: {
        versionNumber: 1,
        title: input.title,
        description: input.description,
        fileName: input.fileName,
        fileSize,
        checksum,
        storagePath,
        objectVersionId,
        malwareScan: 'CLEAN',
        encryptedAtRest: true,
        changeNotes: 'Initial version',
        documentId,
        createdById: userId
      }
    });
  }

  private async indexDocument(document: any, organizationId: string) {
    await this.searchService.indexDocument({
      id: document.id,
      title: document.title,
      content: '',
      metadata: {
        category: document.category,
        tags: document.tags,
        mimeType: document.mimeType,
        customFields: document.customFields as Record<string, any>
      },
      organizationId
    });

    // Also index with text extraction
    this.searchService.indexDocumentWithExtraction(document.id, organizationId).catch(error => {
      this.logger.error('Document text extraction failed:', error);
    });
  }
}
