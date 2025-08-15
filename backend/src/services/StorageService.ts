import crypto from 'crypto';
import path from 'path';
import winston from 'winston';

interface UploadResult {
  success: boolean;
  storageId?: string;
  storagePath?: string;
  checksum?: string;
  thumbnailPath?: string;
  error?: string;
}

interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
}

export class StorageService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.logger.info('StorageService initialized for filesystem-only operations');
  }

  async uploadDocument(
    fileBuffer: Buffer,
    metadata: FileMetadata,
    organizationId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      this.logger.info('Starting filesystem document upload', {
        filename: metadata.filename,
        size: metadata.size,
        mimeType: metadata.mimeType
      });

      const fs = require('fs');
      const path = require('path');

      // Generate checksum
      const checksum = this.calculateChecksum(fileBuffer);

      // Generate storage path for filesystem
      const storageId = this.generateStorageId();
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        this.logger.info('Created uploads directory', { uploadsDir });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000000);
      const extension = path.extname(metadata.filename);
      const uniqueFilename = `document-${timestamp}-${random}${extension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Store the full path for the database
      const storagePath = filePath;

      // Write file to filesystem
      fs.writeFileSync(filePath, fileBuffer);
      this.logger.info('File written to filesystem', { filePath, size: fileBuffer.length });

      this.logger.info('Document uploaded successfully to filesystem', {
        storageId,
        storagePath,
        checksum
      });

      return {
        success: true,
        storageId,
        storagePath,
        checksum
      };

    } catch (error) {
      this.logger.error('Filesystem document upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async downloadDocument(storagePath: string): Promise<Buffer | null> {
    try {
      this.logger.info('Downloading document from filesystem', { storagePath });

      const fs = require('fs');
      const path = require('path');

      // Handle different storage path formats
      let filePath: string;
      
      if (storagePath.startsWith('/')) {
        // Absolute path - use as is
        filePath = storagePath;
      } else if (storagePath.includes('/')) {
        // Relative path - store in uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, storagePath);
      } else {
        // Just a filename - look in uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, storagePath);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        this.logger.warn('File not found on filesystem', { filePath });
        return null;
      }

      // Read and return file content
      const fileBuffer = fs.readFileSync(filePath);
      this.logger.info('File loaded successfully from filesystem', { 
        filePath, 
        size: fileBuffer.length 
      });
      
      return fileBuffer;

    } catch (error) {
      this.logger.error('Filesystem document download failed:', error);
      return null;
    }
  }

  async deleteDocument(storagePath: string, storageId?: string): Promise<boolean> {
    try {
      this.logger.info('Deleting document from filesystem', { storagePath });

      const fs = require('fs');
      const path = require('path');

      // Handle different storage path formats
      let filePath: string;
      
      if (storagePath.startsWith('/')) {
        // Absolute path - use as is
        filePath = storagePath;
      } else if (storagePath.includes('/')) {
        // Relative path - look in uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, storagePath);
      } else {
        // Just a filename - look in uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, storagePath);
      }

      // Check if file exists before trying to delete
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.info('File deleted successfully from filesystem', { filePath });
      } else {
        this.logger.warn('File not found for deletion, treating as successful', { filePath });
      }

      return true;

    } catch (error) {
      this.logger.error('Filesystem document deletion failed:', error);
      return false;
    }
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateStorageId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async getDocumentUrl(storagePath: string, expirySeconds: number = 3600): Promise<string | null> {
    // For filesystem storage, return null - use direct file serving instead
    return null;
  }

  async getThumbnailUrl(storagePath: string, expirySeconds: number = 3600): Promise<string | null> {
    // For filesystem storage, return null - thumbnails not implemented
    return null;
  }
}