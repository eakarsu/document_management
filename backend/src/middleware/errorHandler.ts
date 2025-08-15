import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: (req as any).user?.id || 'anonymous'
  });

  // Determine status code
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (error.name === 'UnauthorizedError' || error.message.includes('token')) {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'ForbiddenError' || error.message.includes('Access denied')) {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (error.name === 'ConflictError' || error.message.includes('already exists')) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource conflict';
  } else if (error.name === 'PayloadTooLargeError') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'File too large';
  } else if (error.name === 'UnsupportedMediaTypeError') {
    statusCode = 415;
    code = 'UNSUPPORTED_MEDIA_TYPE';
    message = 'Unsupported file type';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'Rate limit exceeded';
  }

  // Prisma specific errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists';
        break;
      case 'P2025':
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }

  // MongoDB specific errors
  if (error.name === 'MongoError') {
    const mongoError = error as any;
    if (mongoError.code === 11000) {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      message = 'Duplicate entry';
    }
  }

  // Multer specific errors
  if (error.name === 'MulterError') {
    const multerError = error as any;
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413;
        code = 'FILE_TOO_LARGE';
        message = 'File size exceeds limit';
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 413;
        code = 'TOO_MANY_FILES';
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        code = 'UNEXPECTED_FILE';
        message = 'Unexpected file upload';
        break;
      default:
        statusCode = 400;
        code = 'UPLOAD_ERROR';
        message = 'File upload error';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal server error';
    code = 'INTERNAL_ERROR';
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code,
      statusCode
    },
    timestamp: new Date().toISOString()
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}