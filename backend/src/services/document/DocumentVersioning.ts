import { PrismaClient } from '@prisma/client';
import { BinaryDiffService } from '../BinaryDiffService';
import winston from 'winston';
import { CreateVersionInput } from '../../types/document/document.types';
import { calculateChecksum } from '../../utils/document/documentUtils';
import { StorageService } from '../StorageService';

export class DocumentVersioning {
  private prisma: PrismaClient;
  private binaryDiffService: BinaryDiffService;
  private logger: winston.Logger;
  private storageService: StorageService;

  constructor(
    prisma: PrismaClient,
    binaryDiffService: BinaryDiffService,
    logger: winston.Logger
  ) {
    this.prisma = prisma;
    this.binaryDiffService = binaryDiffService;
    this.logger = logger;
    this.storageService = new StorageService();
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

      // Calculate binary diff if there's a previous version
      let diffData: Awaited<ReturnType<typeof this.binaryDiffService.generateBinaryDiff>> | null = null;
      if (latestVersion && latestVersion.storagePath) {
        try {
          // Retrieve the previous version's file from storage
          const oldBuffer = await this.storageService.downloadDocument(latestVersion.storagePath, organizationId);

          if (oldBuffer && oldBuffer.length > 0) {
            this.logger.info('Computing binary diff for new version', {
              documentId,
              fromVersion: latestVersion.versionNumber,
              toVersion: newVersionNumber,
              oldSize: oldBuffer.length,
              newSize: fileBuffer.length
            });

            diffData = await this.binaryDiffService.generateBinaryDiff(
              oldBuffer,
              fileBuffer,
              documentId,
              newVersionNumber,
              organizationId
            );

            this.logger.info('Binary diff computed successfully', {
              documentId,
              toVersion: newVersionNumber,
              diffSize: diffData.diffSize,
              compressionRatio: diffData.compressionRatio,
              changeCategory: diffData.changeAnalysis.changeCategory,
              similarity: diffData.changeAnalysis.similarity
            });
          } else {
            this.logger.warn('Could not retrieve previous version file for diff', {
              documentId,
              storagePath: latestVersion.storagePath
            });
          }
        } catch (diffError: any) {
          // Diff failure is non-fatal — log and continue without diff metrics
          this.logger.error('Binary diff generation failed (non-fatal), proceeding without diff', {
            documentId,
            toVersion: newVersionNumber,
            error: diffError instanceof Error ? diffError.message : 'Unknown error'
          });
          diffData = null;
        }
      }

      const fileName = input.fileName || document.fileName;
      const uploadResult = await this.storageService.uploadDocument(fileBuffer, {
        filename: fileName,
        originalName: fileName,
        mimeType: document.mimeType,
        size: fileSize,
        checksum,
      }, organizationId, userId);
      if (!uploadResult.success || !uploadResult.storagePath) throw new Error(`Version upload failed: ${uploadResult.error || 'missing object key'}`);

      // The database only points at the new encrypted object after upload and scan succeed.
      const newVersion = await this.prisma.$transaction(async tx => {
        const version = await tx.documentVersion.create({ data: {
          versionNumber: newVersionNumber,
          title: input.title || document.title,
          description: input.description || document.description,
          fileName,
          fileSize,
          checksum,
          storagePath: uploadResult.storagePath!,
          objectVersionId: uploadResult.storageVersionId,
          malwareScan: 'CLEAN',
          encryptedAtRest: true,
          changeNotes: input.changeNotes || '',
          changeType: input.changeType || 'MINOR',
          documentId,
          createdById: userId,
          // Binary diff metrics (populated if diff was computed)
          bytesChanged: diffData ? diffData.changeAnalysis.bytesChanged : null,
          percentChanged: diffData ? diffData.changeAnalysis.percentChanged : null,
          changeCategory: diffData ? diffData.changeAnalysis.changeCategory : null,
          similarity: diffData ? diffData.changeAnalysis.similarity : null,
          diffSize: diffData ? diffData.diffSize : null,
          compressionRatio: diffData ? diffData.compressionRatio : null,
          diffPath: diffData ? diffData.diffPath : null,
          patchAlgorithm: diffData ? diffData.patchAlgorithm : null
        }});
        await tx.document.update({ where: { id: documentId }, data: {
          currentVersion: newVersionNumber,
          fileName,
          fileSize,
          checksum,
          storagePath: uploadResult.storagePath!,
          objectVersionId: uploadResult.storageVersionId,
          updatedAt: new Date()
        }});
        return version;
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

    // Get diff between versions using actual file buffers
    let diff: { diffSize: number; diffBuffer: Buffer } = {
      diffSize: 0,
      diffBuffer: Buffer.from([])
    };

    try {
      const [oldBuffer, newBuffer] = await Promise.all([
        versionFrom.storagePath ? this.storageService.downloadDocument(versionFrom.storagePath, organizationId) : Promise.resolve(null),
        versionTo.storagePath ? this.storageService.downloadDocument(versionTo.storagePath, organizationId) : Promise.resolve(null)
      ]);

      if (oldBuffer && newBuffer) {
        diff = await this.binaryDiffService.getDiffBetweenVersions(oldBuffer, newBuffer);
        this.logger.info('Live binary diff computed for comparison', {
          documentId,
          fromVersion,
          toVersion,
          diffSize: diff.diffSize
        });
      }
    } catch (diffError: any) {
      this.logger.warn('Could not compute live diff for comparison (returning metadata only)', {
        documentId,
        fromVersion,
        toVersion,
        error: diffError instanceof Error ? diffError.message : 'Unknown error'
      });
    }

    return {
      from: versionFrom,
      to: versionTo,
      diff: { diffSize: diff.diffSize },
      changesSummary: {
        bytesChanged: versionTo.bytesChanged,
        percentChanged: versionTo.percentChanged,
        changeCategory: versionTo.changeCategory,
        similarity: versionTo.similarity,
        diffPath: versionTo.diffPath,
        compressionRatio: versionTo.compressionRatio
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
        versionNumber,
        document: { organizationId }
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
        objectVersionId: version.objectVersionId,
        malwareScan: version.malwareScan,
        encryptedAtRest: version.encryptedAtRest,
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
        objectVersionId: version.objectVersionId,
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
        versionNumber,
        document: { organizationId }
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
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organizationId }
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
            ,objectVersionId: previousVersion.objectVersionId
          }
        });
      }
    }

    return true;
  }
}
