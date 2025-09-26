// @ts-ignore - node-bsdiff doesn't have types
import { bsdiff, bspatch } from 'node-bsdiff';
import { StorageService } from './StorageService';
import crypto from 'crypto';
import winston from 'winston';

interface BinaryDiffResult {
  diffPath: string;
  diffSize: number;
  compressionRatio: number;
  patchAlgorithm: string;
  changeAnalysis: {
    bytesChanged: number;
    percentChanged: number;
    changeCategory: 'MINOR' | 'MAJOR' | 'STRUCTURAL';
    similarity: number;
  };
}

interface DiffMetadata {
  documentId: string;
  fromVersion: number;
  toVersion: number;
  algorithm: string;
  createdAt: Date;
}

export class BinaryDiffService {
  private storageService: StorageService;
  private logger: winston.Logger;

  constructor() {
    this.storageService = new StorageService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Generate binary diff between two file buffers
   */
  async generateBinaryDiff(
    oldBuffer: Buffer,
    newBuffer: Buffer,
    documentId: string,
    toVersion: number,
    organizationId: string
  ): Promise<BinaryDiffResult> {
    try {
      this.logger.info('Generating binary diff', {
        documentId,
        toVersion,
        oldSize: oldBuffer.length,
        newSize: newBuffer.length
      });

      // Generate binary diff using bsdiff
      const diffBuffer = await this.createBinaryDiff(oldBuffer, newBuffer);
      
      // Calculate compression ratio and change analysis
      const compressionRatio = 1 - (diffBuffer.length / newBuffer.length);
      const changeAnalysis = this.analyzeChanges(oldBuffer, newBuffer, diffBuffer);

      // Store diff file in storage
      const diffPath = await this.storeDiffFile(
        diffBuffer,
        documentId,
        toVersion,
        organizationId
      );

      this.logger.info('Binary diff generated successfully', {
        documentId,
        toVersion,
        diffSize: diffBuffer.length,
        compressionRatio,
        changeCategory: changeAnalysis.changeCategory
      });

      return {
        diffPath,
        diffSize: diffBuffer.length,
        compressionRatio,
        patchAlgorithm: 'bsdiff',
        changeAnalysis
      };

    } catch (error: any) {
      this.logger.error('Failed to generate binary diff:', {
        documentId,
        toVersion,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Apply binary diff to reconstruct a file
   */
  async applyBinaryDiff(
    baseBuffer: Buffer,
    diffPath: string
  ): Promise<Buffer> {
    try {
      // Download diff file from storage
      const diffBuffer = await this.storageService.downloadDocument(diffPath);
      
      if (!diffBuffer) {
        throw new Error('Could not download diff file');
      }
      
      // Apply binary patch
      const reconstructedBuffer = await this.applyBinaryPatch(baseBuffer, diffBuffer);
      
      return reconstructedBuffer;

    } catch (error: any) {
      this.logger.error('Failed to apply binary diff:', {
        diffPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Reconstruct any version by applying sequential diffs
   */
  async reconstructVersion(
    baseBuffer: Buffer,
    diffPaths: string[]
  ): Promise<Buffer> {
    let currentBuffer = baseBuffer;

    for (const diffPath of diffPaths) {
      currentBuffer = await this.applyBinaryDiff(currentBuffer, diffPath);
    }

    return currentBuffer;
  }

  /**
   * Get diff statistics for a document version
   */
  async getDiffStatistics(diffPath: string): Promise<{
    diffSize: number;
    checksum: string;
  }> {
    try {
      const diffBuffer = await this.storageService.downloadDocument(diffPath);
      
      if (!diffBuffer) {
        throw new Error('Could not download diff file for statistics');
      }
      
      const checksum = crypto.createHash('sha256').update(diffBuffer).digest('hex');
      
      return {
        diffSize: diffBuffer.length,
        checksum
      };
    } catch (error: any) {
      this.logger.error('Failed to get diff statistics:', error);
      throw error;
    }
  }

  /**
   * Validate diff integrity
   */
  async validateDiff(
    oldBuffer: Buffer,
    newBuffer: Buffer,
    diffPath: string
  ): Promise<boolean> {
    try {
      const reconstructedBuffer = await this.applyBinaryDiff(oldBuffer, diffPath);
      const reconstructedChecksum = crypto.createHash('sha256').update(reconstructedBuffer).digest('hex');
      const originalChecksum = crypto.createHash('sha256').update(newBuffer).digest('hex');
      
      return reconstructedChecksum === originalChecksum;
    } catch (error: any) {
      this.logger.error('Diff validation failed:', error);
      return false;
    }
  }

  /**
   * Create binary diff using bsdiff algorithm
   */
  private async createBinaryDiff(oldBuffer: Buffer, newBuffer: Buffer): Promise<Buffer> {
    try {
      const diffBuffer = await bsdiff(oldBuffer, newBuffer);
      return diffBuffer;
    } catch (error: any) {
      // If bsdiff fails, log and rethrow
      this.logger.error('bsdiff operation failed:', error);
      throw new Error(`Binary diff generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply binary patch using bspatch algorithm
   */
  private async applyBinaryPatch(baseBuffer: Buffer, diffBuffer: Buffer): Promise<Buffer> {
    try {
      const patchedBuffer = await bspatch(baseBuffer, diffBuffer);
      return patchedBuffer;
    } catch (error: any) {
      this.logger.error('bspatch operation failed:', error);
      throw new Error(`Binary patch application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store diff file in storage with proper naming convention
   */
  private async storeDiffFile(
    diffBuffer: Buffer,
    documentId: string,
    toVersion: number,
    organizationId: string
  ): Promise<string> {
    const diffFileName = `${documentId}_v${toVersion}.bsdiff`;
    const diffPath = `diffs/${organizationId}/${diffFileName}`;
    
    const uploadResult = await this.storageService.uploadDocument(
      diffBuffer,
      {
        filename: diffFileName,
        originalName: diffFileName,
        mimeType: 'application/octet-stream',
        size: diffBuffer.length,
        checksum: crypto.createHash('sha256').update(diffBuffer).digest('hex')
      },
      organizationId,
      'system' // System user for diff files
    );

    if (!uploadResult.success) {
      throw new Error(`Failed to store diff file: ${uploadResult.error}`);
    }

    return uploadResult.storagePath!;
  }

  /**
   * Analyze changes between two files
   */
  private analyzeChanges(
    oldBuffer: Buffer,
    newBuffer: Buffer,
    diffBuffer: Buffer
  ): {
    bytesChanged: number;
    percentChanged: number;
    changeCategory: 'MINOR' | 'MAJOR' | 'STRUCTURAL';
    similarity: number;
  } {
    const bytesChanged = diffBuffer.length;
    const percentChanged = (bytesChanged / Math.max(oldBuffer.length, newBuffer.length)) * 100;
    
    // Calculate similarity (inverse of percentage changed)
    const similarity = Math.max(0, 100 - percentChanged);
    
    // Categorize changes
    let changeCategory: 'MINOR' | 'MAJOR' | 'STRUCTURAL';
    if (percentChanged < 5) {
      changeCategory = 'MINOR';
    } else if (percentChanged < 25) {
      changeCategory = 'MAJOR';
    } else {
      changeCategory = 'STRUCTURAL';
    }

    return {
      bytesChanged,
      percentChanged: Math.round(percentChanged * 100) / 100,
      changeCategory,
      similarity: Math.round(similarity * 100) / 100
    };
  }

  /**
   * Clean up old diff files (for maintenance)
   */
  async cleanupOldDiffs(
    documentId: string,
    keepVersions: number = 10
  ): Promise<void> {
    try {
      // This would implement cleanup logic for old diff files
      // to prevent storage bloat over time
      this.logger.info('Diff cleanup not yet implemented', { documentId, keepVersions });
    } catch (error: any) {
      this.logger.error('Failed to cleanup old diffs:', error);
    }
  }

  /**
   * Calculate diff between two buffers (alias for generateBinaryDiff with minimal params)
   */
  async calculateDiff(
    oldBuffer: Buffer,
    newBuffer: Buffer
  ): Promise<Buffer> {
    try {
      return await this.createBinaryDiff(oldBuffer, newBuffer);
    } catch (error: any) {
      this.logger.error('Failed to calculate diff:', error);
      throw error;
    }
  }

  /**
   * Get diff between two specific versions
   */
  async getDiffBetweenVersions(
    oldBuffer: Buffer,
    newBuffer: Buffer
  ): Promise<{ diffSize: number; diffBuffer: Buffer }> {
    try {
      const diffBuffer = await this.createBinaryDiff(oldBuffer, newBuffer);
      return {
        diffSize: diffBuffer.length,
        diffBuffer
      };
    } catch (error: any) {
      this.logger.error('Failed to get diff between versions:', error);
      throw error;
    }
  }
}
