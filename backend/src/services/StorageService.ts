import crypto from 'crypto';
import { Client } from 'minio';
import winston from 'winston';
import { objectBelongsToOrganization, safeObjectKey, validateUpload } from '../security/storagePolicy';

interface UploadResult {
  success: boolean;
  storageId?: string;
  storagePath?: string;
  storageVersionId?: string;
  checksum?: string;
  malwareScan?: 'CLEAN';
  error?: string;
}

interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export class StorageService {
  private logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
  private client: Client;
  private bucket: string;

  constructor(client?: Client) {
    this.bucket = process.env.OBJECT_STORAGE_BUCKET || 'dms-documents';
    if (client) { this.client = client; return; }
    const endpoint = required('OBJECT_STORAGE_ENDPOINT');
    const parsed = new URL(endpoint);
    this.client = new Client({
      endPoint: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80,
      useSSL: parsed.protocol === 'https:',
      accessKey: required('OBJECT_STORAGE_ACCESS_KEY'),
      secretKey: required('OBJECT_STORAGE_SECRET_KEY'),
      region: process.env.OBJECT_STORAGE_REGION || 'us-east-1',
    });
  }

  private async ensureBucket() {
    if (!(await this.client.bucketExists(this.bucket))) await this.client.makeBucket(this.bucket, process.env.OBJECT_STORAGE_REGION || 'us-east-1');
    await this.client.setBucketVersioning(this.bucket, { Status: 'Enabled' });
  }

  private async scan(buffer: Buffer) {
    const scanner = process.env.MALWARE_SCANNER_URL;
    if (!scanner) throw new Error('MALWARE_SCANNER_URL is required; uploads fail closed');
    const response = await fetch(scanner, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: new Uint8Array(buffer) });
    if (!response.ok) throw new Error('MALWARE_SCANNER_UNAVAILABLE');
    const result = await response.json() as { clean?: boolean; signature?: string };
    if (!result.clean) throw new Error(`MALWARE_DETECTED${result.signature ? `:${result.signature}` : ''}`);
  }

  async uploadDocument(fileBuffer: Buffer, metadata: FileMetadata, organizationId: string, userId: string): Promise<UploadResult> {
    try {
      const validation = validateUpload(fileBuffer, metadata);
      if (!validation.accepted) throw new Error(validation.reason);
      await this.scan(fileBuffer);
      await this.ensureBucket();
      const storageId = crypto.randomBytes(16).toString('hex');
      const storagePath = safeObjectKey(organizationId, storageId, metadata.filename);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const result = await this.client.putObject(this.bucket, storagePath, fileBuffer, fileBuffer.length, {
        'Content-Type': metadata.mimeType,
        'x-amz-server-side-encryption': 'AES256',
        'x-amz-meta-sha256': checksum,
        'x-amz-meta-uploader': userId,
        'x-amz-meta-original-name': Buffer.from(metadata.originalName, 'utf8').toString('base64'),
      });
      this.logger.info('Encrypted object stored', { organizationId, storageId, size: fileBuffer.length, checksum, versionId: result.versionId });
      return { success: true, storageId, storagePath, storageVersionId: result.versionId ?? undefined, checksum, malwareScan: 'CLEAN' };
    } catch (error) {
      this.logger.error('Object upload failed', { reason: error instanceof Error ? error.message : 'unknown' });
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async downloadDocument(storagePath: string, organizationId: string): Promise<Buffer | null> {
    if (!organizationId || !objectBelongsToOrganization(storagePath, organizationId)) return null;
    if (storagePath.includes('..') || storagePath.startsWith('/')) return null;
    try {
      const stream = await this.client.getObject(this.bucket, storagePath);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks);
    } catch { return null; }
  }

  async deleteDocument(storagePath: string, _storageId?: string): Promise<boolean> {
    if (storagePath.includes('..') || storagePath.startsWith('/')) return false;
    try {
      // A plain delete on a versioned bucket only creates a delete marker. For
      // approved records destruction, remove every concrete object version and
      // delete marker for this exact tenant key.
      const entries: Array<{ name: string; versionId?: string }> = [];
      const stream = this.client.listObjects(this.bucket, storagePath, true, { IncludeVersion: true });
      for await (const value of stream as any) {
        const item = value as { name?: string; key?: string; versionId?: string; VersionId?: string };
        const name = item.name || item.key;
        const versionId = item.versionId || item.VersionId;
        if (name === storagePath) entries.push({ name, ...(versionId && { versionId }) });
      }
      if (!entries.length) {
        await this.client.removeObject(this.bucket, storagePath);
        return true;
      }
      const results = await this.client.removeObjects(this.bucket, entries);
      return results.every(result => !result?.Error);
    }
    catch (error) { this.logger.error('Object deletion failed', { reason: error instanceof Error ? error.message : 'unknown' }); return false; }
  }

  async deleteDocumentForOrganization(storagePath: string, organizationId: string): Promise<boolean> {
    if (!objectBelongsToOrganization(storagePath, organizationId)) return false;
    return this.deleteDocument(storagePath);
  }

  async getDocumentUrl(storagePath: string, expirySeconds: number, organizationId: string): Promise<string | null> {
    if (!organizationId || !objectBelongsToOrganization(storagePath, organizationId)) return null;
    if (storagePath.includes('..') || storagePath.startsWith('/')) return null;
    return this.client.presignedGetObject(this.bucket, storagePath, Math.min(expirySeconds, 900));
  }

  async getThumbnailUrl(_storagePath?: string): Promise<string | null> { return null; }

  async healthCheck(): Promise<boolean> {
    try { return await this.client.bucketExists(this.bucket); }
    catch { return false; }
  }
}
