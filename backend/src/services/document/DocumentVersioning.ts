import { PrismaClient } from '@prisma/client';
import { BinaryDiffService } from '../BinaryDiffService';
import winston from 'winston';
import { CreateVersionInput } from '../../types/document/document.types';
import { calculateChecksum } from '../../utils/document/documentUtils';

export class DocumentVersioning {
  private prisma: PrismaClient;
  private binaryDiffService: BinaryDiffService;
  private logger: winston.Logger;

  constructor(
    prisma: PrismaClient,
    binaryDiffService: BinaryDiffService,
    logger: winston.Logger
  ) {
    this.prisma = prisma;
    this.binaryDiffService = binaryDiffService;
    this.logger = logger;
  }

  async createDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    input: CreateVersionInput,
    userId: string,
    organizationId: string
  ) {
    try {
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" as any },
            take: 1
          }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const latestVersion = document.versions[0];
      const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
      const checksum = calculateChecksum(fileBuffer);
      const fileSize = fileBuffer.length;

      // Calculate diff if there's a previous version
      let diffData = null;
      if (latestVersion && latestVersion.storagePath) {
        // For now, skip diff calculation as it needs Buffer retrieval
        // TODO: Implement proper diff calculation with file retrieval
        diffData = null;
      }

      // Create new version
      const newVersion = await this.prisma.documentVersion.create({
        data: {
          versionNumber: newVersionNumber,
          title: input.title || document.title,
          description: input.description || document.description,
          fileName: input.fileName || document.fileName,
          fileSize,
          checksum,
          storagePath: '', // Will be updated after upload
          changeNotes: input.changeNotes || '',
          changeType: input.changeType || 'MINOR',
          documentId,
          createdById: userId,
          // Binary diff metrics (will be null for now)
          bytesChanged: null,
          percentChanged: null,
          changeCategory: null,
          similarity: null,
          diffSize: null,
          compressionRatio: null
        }
      });

      // Update document
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          currentVersion: newVersionNumber,
          updatedAt: new Date()
        }
      });

      this.logger.info('Document version created', {
        documentId,
        versionNumber: newVersionNumber,
        changeType: input.changeType
      });

      return newVersion;
    } catch (error: any) {
      this.logger.error('Version creation failed:', error);
      throw error;
    }
  }

  async getVersionHistory(
    documentId: string,
    userId: string,
    organizationId: string
  ) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return await this.prisma.documentVersion.findMany({
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
      orderBy: { versionNumber: "desc" as any }
    });
  }

  async compareVersions(
    documentId: string,
    fromVersion: number,
    toVersion: number,
    userId: string,
    organizationId: string
  ) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const [versionFrom, versionTo] = await Promise.all([
      this.prisma.documentVersion.findFirst({
        where: {
          documentId,
          versionNumber: fromVersion
        }
      }),
      this.prisma.documentVersion.findFirst({
        where: {
          documentId,
          versionNumber: toVersion
        }
      })
    ]);

    if (!versionFrom || !versionTo) {
      throw new Error('One or both versions not found');
    }

    // Get diff between versions
    // TODO: Need to retrieve actual file buffers from storage
    // For now, return a placeholder diff
    const diff = {
      diffSize: 0,
      diffBuffer: Buffer.from([])
    };

    return {
      from: versionFrom,
      to: versionTo,
      diff,
      changesSummary: {
        bytesChanged: versionTo.bytesChanged,
        percentChanged: versionTo.percentChanged,
        changeCategory: versionTo.changeCategory
      }
    };
  }

  async restoreVersion(
    documentId: string,
    versionNumber: number,
    userId: string,
    organizationId: string
  ) {
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionNumber
      }
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Create a new version that's a copy of the restored version
    const latestVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" as any }
    });

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const restoredVersion = await this.prisma.documentVersion.create({
      data: {
        versionNumber: newVersionNumber,
        title: version.title,
        description: version.description,
        fileName: version.fileName,
        fileSize: version.fileSize,
        checksum: version.checksum,
        storagePath: version.storagePath,
        changeNotes: `Restored from version ${versionNumber}`,
        changeType: 'MAJOR',
        documentId,
        createdById: userId
      }
    });

    // Update document
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: version.title,
        description: version.description,
        fileName: version.fileName,
        fileSize: version.fileSize,
        checksum: version.checksum,
        storagePath: version.storagePath,
        currentVersion: newVersionNumber
      }
    });

    return restoredVersion;
  }

  async deleteVersion(
    documentId: string,
    versionNumber: number,
    userId: string,
    organizationId: string
  ) {
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionNumber
      }
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Don't allow deleting the only version
    const versionCount = await this.prisma.documentVersion.count({
      where: { documentId }
    });

    if (versionCount <= 1) {
      throw new Error('Cannot delete the only version');
    }

    // Delete the version
    await this.prisma.documentVersion.delete({
      where: { id: version.id }
    });

    // If this was the current version, update to the previous version
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });

    if (document?.currentVersion === versionNumber) {
      const previousVersion = await this.prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: "desc" as any }
      });

      if (previousVersion) {
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            currentVersion: previousVersion.versionNumber,
            title: previousVersion.title,
            description: previousVersion.description,
            fileName: previousVersion.fileName,
            fileSize: previousVersion.fileSize,
            checksum: previousVersion.checksum,
            storagePath: previousVersion.storagePath
          }
        });
      }
    }

    return true;
  }
}