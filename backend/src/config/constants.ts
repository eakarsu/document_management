function requiredSecret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must be configured with at least 32 characters`);
  return value;
}

export const JWT_SECRET = requiredSecret('JWT_SECRET');
export const JWT_REFRESH_SECRET = requiredSecret('JWT_REFRESH_SECRET');
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '8h';
const parsedBackendPort = Number(process.env.BACKEND_PORT);
if (!Number.isInteger(parsedBackendPort) || parsedBackendPort < 1024 || parsedBackendPort > 65535) throw new Error('BACKEND_PORT must be an explicit integer between 1024 and 65535');
export const BACKEND_PORT = parsedBackendPort;
export const FRONTEND_URL = process.env.FRONTEND_URL || '';
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];
export const FILE_UPLOAD_LIMITS = { fileSize: 50 * 1024 * 1024 };
export const RATE_LIMIT_CONFIG = { windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests from this IP, please try again later.' };
export const ALLOWED_MIME_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv', 'text/html', 'image/jpeg', 'image/png', 'application/zip'];
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.html', '.jpg', '.jpeg', '.png', '.zip'];
