import crypto from 'crypto';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateDocumentNumber(organizationId: string): Promise<string> {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  const orgPart = organizationId.substring(0, 4);
  return `DOC-${orgPart}-${timestamp}-${randomPart}`.toUpperCase();
}

export async function generateQRCode(documentNumber: string): Promise<string> {
  try {
    return await QRCode.toDataURL(documentNumber);
  } catch (error: any) {
    console.error('QR code generation failed:', error);
    return '';
  }
}

export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export async function checkDuplicateDocument(checksum: string) {
  return await prisma.document.findUnique({
    where: { checksum }
  });
}

export function buildDocumentSearchQuery(params: any) {
  const where: any = {
    organizationId: params.organizationId,
    status: { not: 'DELETED' }
  };

  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } },
      { tags: { has: params.query } }
    ];
  }

  if (params.category) {
    where.category = params.category;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.folderId) {
    where.folderId = params.folderId;
  }

  if (params.mimeType) {
    where.mimeType = params.mimeType;
  }

  if (params.dateRange) {
    where.createdAt = {
      gte: params.dateRange.from,
      lte: params.dateRange.to
    };
  }

  return where;
}

export function buildDocumentInclude() {
  return {
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
    versions: {
      orderBy: { versionNumber: "desc" as any },
      take: 1
    },
    _count: {
      select: {
        versions: true,
        comments: true
      }
    }
  };
}