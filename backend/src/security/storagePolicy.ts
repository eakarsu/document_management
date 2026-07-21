import path from 'path';

const allowed: Record<string, (buffer: Buffer) => boolean> = {
  'application/pdf': (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': zip,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': zip,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': zip,
  'application/zip': zip,
  'application/x-bsdiff': (buffer) => buffer.subarray(0, 8).toString('ascii') === 'BSDIFF40',
  'image/png': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9,
  'text/plain': text,
  'text/csv': text,
  'text/html': text,
};

function zip(buffer: Buffer) { return buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3]); }
function text(buffer: Buffer) { return !buffer.includes(0) && buffer.toString('utf8').includes('\ufffd') === false; }

export function validateUpload(buffer: Buffer, metadata: { filename: string; mimeType: string; size: number }, maximum = 50 * 1024 * 1024) {
  if (!buffer.length || buffer.length !== metadata.size) return { accepted: false, reason: 'SIZE_MISMATCH' };
  if (buffer.length > maximum) return { accepted: false, reason: 'FILE_TOO_LARGE' };
  const detector = allowed[metadata.mimeType];
  if (!detector) return { accepted: false, reason: 'MIME_NOT_ALLOWED' };
  if (!detector(buffer)) return { accepted: false, reason: 'MAGIC_TYPE_MISMATCH' };
  const extension = path.extname(metadata.filename).toLowerCase();
  if (!extension || metadata.filename.includes('\0') || metadata.filename.includes('/') || metadata.filename.includes('\\')) return { accepted: false, reason: 'UNSAFE_FILENAME' };
  return { accepted: true as const };
}

export function safeObjectKey(organizationId: string, storageId: string, filename: string) {
  const extension = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!/^[a-zA-Z0-9_-]+$/.test(organizationId) || !/^[a-f0-9]{32}$/.test(storageId)) throw new Error('UNSAFE_OBJECT_IDENTITY');
  return `organizations/${organizationId}/documents/${storageId}${extension}`;
}

export function objectBelongsToOrganization(key: string, organizationId: string) {
  return key.startsWith(`organizations/${organizationId}/`) && !key.includes('..') && !key.startsWith('/');
}
