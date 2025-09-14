import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import winston from 'winston';
import expressWinston from 'express-winston';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

import { config } from './config/database';
import { typeDefs } from './resolvers/typeDefs';
import { resolvers } from './resolvers';
import { authMiddleware, graphqlAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { documentsRouter } from './routes/documents';
import { publishingRouter } from './routes/publishing';
import { aiWorkflowRouter } from './routes/aiWorkflow';
import eightStageWorkflowRouter from './routes/eightStageWorkflow';
import editorRouter from './routes/editor';
import feedbackProcessorRouter from './routes/feedbackProcessor';
import oprWorkflowFeedbackRouter from './routes/oprWorkflowFeedback';
import exportRouter from './routes/export';
import exportPerfectRouter from './routes/export-perfect';
import aiDocumentGeneratorRouter from './routes/ai-document-generator';
import workflowRouter from './routes/workflow';
import workflowsRouter from './routes/workflows';
import usersRouter from './routes/users';
import { DocumentService } from './services/DocumentService';
import { AuthService } from './services/AuthService';
import { SearchService } from './services/SearchService';
import { StorageService } from './services/StorageService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'richmond-dms-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'richmond-dms-refresh-secret';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/html',
      'text/xml',
      'application/xml',
      'application/json',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream' // For various file types
    ];
    
    // Also allow files based on extension if mimetype is generic
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.html', '.htm', '.xml', '.json', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.zip'];
    const fileExtension = require('path').extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Supported types: ${allowedExtensions.join(', ')}`));
    }
  }
});


// JWT authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  // Try to get token from Authorization header first, then from query parameters
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try query parameter for iframe/image requests
  if (!token && req.query.token) {
    token = req.query.token;
    console.log('Using query parameter token:', token.substring(0, 20) + '...');
  }

  if (!token) {
    console.log('No token found in headers or query parameters');
    return res.status(401).json({ error: 'Access token required' });
  }

  console.log('Token found, proceeding with verification...');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        organizationId: true,
        roleId: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dms-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          frameSrc: ["'self'", "http://localhost:4000", "https://localhost:4000"],
          frameAncestors: ["'self'", "http://localhost:3000", "https://localhost:3000"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    app.use('/graphql', limiter);

    // CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }));

    // Request logging
    app.use(expressWinston.logger({
      winstonInstance: logger,
      meta: true,
      msg: "HTTP {{req.method}} {{req.url}}",
      expressFormat: true,
      colorize: false,
    }));

    // Body parsing
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health check route
    app.use('/health', healthRouter);
    
    // Document routes
    app.use('/api/documents', documentsRouter);
    
    // Publishing routes
    app.use('/api/publishing', publishingRouter);
    
    // AI Workflow routes
    app.use('/api/ai-workflow', aiWorkflowRouter);
    
    // 8-Stage Workflow routes
    app.use('/api/workflow/8-stage', eightStageWorkflowRouter);
    
    // Editor routes
    app.use('/api/editor', editorRouter);
    
    // Export routes (PDF, DOCX, etc.)
    app.use('/api/export', exportRouter);
    app.use('/api/export-perfect', exportPerfectRouter);
    
    // AI Document Generator route
    app.use('/api/ai-document-generator', aiDocumentGeneratorRouter);
    
    // Feedback Processor routes (OpenRouter AI)
    app.use('/api/feedback-processor', feedbackProcessorRouter);
    
    // OPR Workflow Feedback routes (Stage 3 & 7 feedback)
    app.use('/api/opr-workflow-feedback', oprWorkflowFeedbackRouter);
    
    // Pluggable Workflow System routes
    app.use('/api/workflow', workflowRouter);
    
    // Register JSON workflows route
    app.use('/api', workflowsRouter);

    // User management routes
    app.use('/api', usersRouter);

    // ===== AUTHENTICATION ENDPOINTS =====
    
    // User login endpoint
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
          });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { 
            id: true, 
            email: true, 
            firstName: true, 
            lastName: true, 
            passwordHash: true,
            roleId: true,
            organizationId: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }

        // Check password
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }

        // Generate tokens
        const accessToken = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
            organizationId: user.organizationId,
            type: 'access'
          },
          JWT_SECRET,
          { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h' } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
          { 
            userId: user.id,
            type: 'refresh'
          },
          JWT_REFRESH_SECRET,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        // Return user data and tokens
        const userData = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          organizationId: user.organizationId
        };

        res.json({
          success: true,
          user: userData,
          accessToken,
          refreshToken
        });

      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Login failed' 
        });
      }
    });

    // User registration endpoint
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, firstName, lastName, organizationName } = req.body;
        if (!email || !password || !firstName || !lastName) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email, password, first name, and last name are required' 
          });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (existingUser) {
          return res.status(409).json({ 
            success: false, 
            error: 'User with this email already exists' 
          });
        }

        // Find or create organization
        let organization;
        if (organizationName) {
          organization = await prisma.organization.findFirst({
            where: { name: organizationName }
          });
          if (!organization) {
            organization = await prisma.organization.create({
              data: { 
                name: organizationName,
                domain: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.local'
              }
            });
          }
        } else {
          // Use default organization
          organization = await prisma.organization.findFirst();
          if (!organization) {
            organization = await prisma.organization.create({
              data: { 
                name: 'Default Organization',
                domain: 'default.local'
              }
            });
          }
        }

        // Find default user role
        let userRole = await prisma.role.findFirst({
          where: { 
            name: 'USER',
            organizationId: organization.id
          }
        });
        if (!userRole) {
          userRole = await prisma.role.create({
            data: { 
              name: 'USER',
              organizationId: organization.id,
              permissions: ['documents:read', 'documents:write'] 
            }
          });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: hashedPassword,
            firstName,
            lastName,
            roleId: userRole.id,
            organizationId: organization.id,
            isActive: true
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleId: true,
            organizationId: true
          }
        });

        // Generate tokens
        const accessToken = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
            organizationId: user.organizationId,
            type: 'access'
          },
          JWT_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { 
            userId: user.id,
            type: 'refresh'
          },
          JWT_REFRESH_SECRET,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        res.status(201).json({
          success: true,
          user,
          accessToken,
          refreshToken
        });

      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Registration failed' 
        });
      }
    });

    // Token refresh endpoint
    app.post('/api/auth/refresh', async (req, res) => {
      try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
        
        if (decoded.type !== 'refresh') {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = await prisma.user.findUnique({
          where: { 
            id: decoded.userId,
            isActive: true 
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleId: true,
            organizationId: true
          }
        });

        if (!user) {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new access token
        const accessToken = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
            organizationId: user.organizationId,
            type: 'access'
          },
          JWT_SECRET,
          { expiresIn: '15m' }
        );

        res.json({
          success: true,
          accessToken,
          user
        });

      } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
      }
    });

    // User logout endpoint
    app.post('/api/auth/logout', authenticateToken, async (req: any, res) => {
      try {
        // In a real implementation, you'd blacklist the token
        // For now, we'll just return success
        res.json({ success: true, message: 'Logged out successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
      }
    });

    // Get current user endpoint
    app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleId: true,
            organizationId: true,
            isActive: true,
            role: {
              select: {
                name: true,
                permissions: true
              }
            },
            organization: {
              select: {
                name: true,
                domain: true
              }
            }
          }
        });

        if (!user || !user.isActive) {
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        res.json({
          success: true,
          user
        });
      } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user information' });
      }
    });

    // ===== BINARY DIFF DOCUMENT VERSIONING ENDPOINTS =====

    // Create new document version with binary diff tracking
    app.post('/api/documents/:id/versions', upload.single('file'), async (req: any, res) => {
      try {
        const documentId = req.params.id;
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded'
          });
        }

        const { title, description, changeNotes, changeType } = req.body;

        // Read file from disk since we're using disk storage
        const fileBuffer = require('fs').readFileSync(req.file.path);

        const newVersion = await documentService.createDocumentVersion(
          documentId,
          fileBuffer,
          {
            title,
            description,
            fileName: req.file.originalname,
            changeNotes,
            changeType: changeType as 'MAJOR' | 'MINOR' | 'PATCH'
          },
          req.user.id,
          req.user.organizationId
        );

        if (!newVersion) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create document version'
          });
        }

        res.json({
          success: true,
          version: newVersion,
          message: `Version ${newVersion.versionNumber} created successfully with binary diff tracking`
        });

      } catch (error) {
        console.error('Version creation failed:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Version creation failed'
        });
      }
    });

    // Get document version history with diff information
    app.get('/api/documents/:id/versions', async (req: any, res) => {
      try {
        const documentId = req.params.id;

        const versions = await documentService.getVersionHistory(
          documentId,
          req.user.id,
          req.user.organizationId
        );

        res.json({
          success: true,
          versions,
          totalVersions: versions.length
        });

      } catch (error) {
        console.error('Failed to get version history:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get version history'
        });
      }
    });

    // Compare two document versions
    app.get('/api/documents/:id/versions/:from/compare/:to', async (req: any, res) => {
      try {
        const { id: documentId, from, to } = req.params;
        const fromVersion = parseInt(from);
        const toVersion = parseInt(to);

        if (isNaN(fromVersion) || isNaN(toVersion)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid version numbers'
          });
        }

        const comparison = await documentService.compareVersions(
          documentId,
          fromVersion,
          toVersion,
          req.user.id,
          req.user.organizationId
        );

        res.json({
          success: true,
          comparison
        });

      } catch (error) {
        console.error('Version comparison failed:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Version comparison failed'
        });
      }
    });

    // Get detailed version information
    app.get('/api/documents/:id/versions/:versionNumber', async (req: any, res) => {
      try {
        const { id: documentId, versionNumber } = req.params;
        const versionNum = parseInt(versionNumber);

        if (isNaN(versionNum)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid version number'
          });
        }

        const version = await prisma.documentVersion.findFirst({
          where: {
            documentId,
            versionNumber: versionNum
          },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        if (!version) {
          return res.status(404).json({
            success: false,
            error: 'Version not found'
          });
        }

        // Check permissions
        const document = await prisma.document.findFirst({
          where: { id: documentId, organizationId: req.user.organizationId }
        });

        if (!document) {
          return res.status(404).json({
            success: false,
            error: 'Document not found'
          });
        }

        res.json({
          success: true,
          version: {
            ...version,
            hasChangeSummary: !!(version.bytesChanged && version.percentChanged),
            changeSummary: version.bytesChanged ? {
              bytesChanged: version.bytesChanged,
              percentChanged: version.percentChanged,
              changeCategory: version.changeCategory,
              similarity: version.similarity,
              diffSize: version.diffSize,
              compressionRatio: version.compressionRatio
            } : null
          }
        });

      } catch (error) {
        console.error('Failed to get version details:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get version details'
        });
      }
    });

    // Set document status to IN_REVIEW (for creating approval tasks)
    app.put('/api/documents/:id/status/:status', authenticateToken, async (req: any, res) => {
      try {
        const { id, status } = req.params;
        const validStatuses = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];
        
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
          });
        }

        const document = await prisma.document.update({
          where: { 
            id: id,
            organizationId: req.user.organizationId
          },
          data: { status: status },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        res.json({
          success: true,
          message: `Document status updated to ${status}`,
          document
        });
      } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update document status'
        });
      }
    });

    // Document view endpoint (inline preview)
    app.get('/api/documents/:id/view', authenticateToken, async (req: any, res) => {
      try {
        const document = await prisma.document.findUnique({
          where: { id: req.params.id },
          include: {
            createdBy: true,
            permissions: {
              where: { userId: req.user.id }
            }
          }
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Check permissions
        const hasAccess = document.createdById === req.user.id ||
                         document.permissions.some(p => ['READ', 'WRITE', 'ADMIN'].includes(p.permission)) ||
                         req.user.permissions?.includes('documents:read') ||
                         req.user.permissions?.includes('*');

        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get file content from storage
        const { StorageService } = require('./services/StorageService');
        const storageService = new StorageService();
        const fileContent = await storageService.downloadDocument(document.storagePath);

        if (!fileContent) {
          return res.status(404).json({ error: 'File not found in storage' });
        }

        // Log view activity
        await prisma.auditLog.create({
          data: {
            action: 'VIEW',
            resource: 'DOCUMENT',
            resourceId: document.id,
            userId: req.user.id,
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        }).catch(() => {}); // Don't fail view if audit log fails

        // Update last accessed
        await prisma.document.update({
          where: { id: document.id },
          data: { lastAccessedAt: new Date() }
        }).catch(() => {}); // Don't fail view if update fails

        // Send file for inline viewing (browser decides how to display)
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Length', fileContent.length.toString());
        res.setHeader('Cache-Control', 'no-cache');
        res.send(fileContent);

      } catch (error) {
        console.error('Document view error:', error);
        res.status(500).json({ 
          error: 'View failed',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Dashboard stats endpoint
    app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
      try {
        // Get dashboard statistics from database
        const documentCount = await prisma.document.count({
          where: { 
            organizationId: req.user.organizationId,
            status: { not: 'DELETED' }
          }
        });
        
        const userCount = await prisma.user.count({
          where: {
            organizationId: req.user.organizationId
          }
        });
        
        const recentUploads = await prisma.document.count({
          where: { 
            organizationId: req.user.organizationId,
            status: { not: 'DELETED' },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        });

        const pendingTasks = await prisma.document.count({
          where: {
            organizationId: req.user.organizationId,
            status: 'IN_REVIEW'
          }
        });

        // Calculate storage used (in bytes)
        const documentsWithSize = await prisma.document.findMany({
          where: { 
            organizationId: req.user.organizationId,
            status: { not: 'DELETED' }
          },
          select: { fileSize: true }
        });
        
        const storageUsed = documentsWithSize.reduce((total, doc) => total + doc.fileSize, 0);

        res.json({
          success: true,
          stats: {
            totalDocuments: documentCount,
            totalUsers: userCount,
            recentUploads,
            storageUsed,
            pendingTasks
          }
        });

      } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch dashboard stats',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Get user's workflow tasks (pending approvals)
    app.get('/api/workflow/tasks', authenticateToken, async (req: any, res) => {
      try {
        // Simplified workflow tasks - in production this would query workflowTask table
        // Show all documents in review status within the user's organization that need approval
        const documentsInReview = await prisma.document.findMany({
          where: {
            organizationId: req.user.organizationId,
            status: 'IN_REVIEW',
            NOT: {
              createdById: req.user.id // Don't show user's own documents for approval
            }
          },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1
            }
          }
        });

        const tasks = documentsInReview.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          status: doc.status,
          createdBy: doc.createdBy,
          updatedAt: doc.updatedAt,
          currentVersion: doc.currentVersion,
          latestVersion: doc.versions[0]?.versionNumber || 1,
          taskType: 'APPROVAL_REQUIRED'
        }));

        res.json({
          success: true,
          tasks,
          totalTasks: tasks.length
        });

      } catch (error) {
        console.error('Workflow tasks error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch workflow tasks',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // ===== SEARCH ENDPOINTS =====
    
    
    // Search suggestions endpoint
    app.get('/api/search/suggest', authenticateToken, async (req: any, res) => {
      try {
        const { q: query, field = 'title' } = req.query;
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Query parameter is required'
          });
        }
        
        if (!['title', 'tags', 'category'].includes(field)) {
          return res.status(400).json({
            success: false,
            error: 'Field must be one of: title, tags, category'
          });
        }
        
        const suggestions = await searchService.suggest(
          req.user.organizationId,
          query.trim(),
          field as 'title' | 'tags' | 'category'
        );
        
        res.json({
          success: true,
          suggestions,
          query: query.trim(),
          field
        });
        
      } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get search suggestions',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Search statistics endpoint
    app.get('/api/search/stats', authenticateToken, async (req: any, res) => {
      try {
        const stats = await searchService.getSearchStats(req.user.organizationId);
        
        res.json({
          success: true,
          stats
        });
        
      } catch (error) {
        console.error('Search stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get search statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Search health check endpoint
    app.get('/api/search/health', async (req, res) => {
      try {
        const isHealthy = await searchService.healthCheck();
        
        res.status(isHealthy ? 200 : 503).json({
          success: true,
          status: isHealthy ? 'healthy' : 'unhealthy',
          service: 'elasticsearch',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Search health check error:', error);
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          service: 'elasticsearch',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Document reindexing endpoint
    app.post('/api/search/reindex', authenticateToken, async (req: any, res) => {
      try {
        // Check if user has admin permissions (optional - you can add role check here)
        // For now, any authenticated user can trigger reindexing
        
        const { organizationOnly = true } = req.body;
        
        // Start reindexing in the background
        const organizationId = organizationOnly ? req.user.organizationId : undefined;
        
        // Run reindexing asynchronously
        searchService.reindexAllDocuments(organizationId)
          .then(() => {
            console.log('Document reindexing completed successfully');
          })
          .catch((error) => {
            console.error('Document reindexing failed:', error);
          });
        
        res.json({
          success: true,
          message: 'Document reindexing started',
          organizationOnly,
          organizationId: organizationId || 'all'
        });
        
      } catch (error) {
        console.error('Reindex initiation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to start document reindexing',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Initialize services
    const documentService = new DocumentService();
    const authService = new AuthService();
    const searchService = new SearchService();
    const storageService = new StorageService();

    // Create GraphQL schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    // Create Apollo Server
    const apolloServer = new ApolloServer({
      schema,
      introspection: process.env.NODE_ENV === 'development',
      plugins: [
        {
          async requestDidStart() {
            return {
              async didEncounterErrors(ctx: any) {
                logger.error('GraphQL Error:', ctx.errors);
              },
            };
          },
        },
      ],
    });

    await apolloServer.start();

    // GraphQL endpoint with smart authentication
    app.use('/graphql', 
      graphqlAuthMiddleware,
      expressMiddleware(apolloServer, {
        context: async ({ req }: { req: any }) => ({
          user: req.user,
          req: req,
          services: {
            document: documentService,
            auth: authService,
            search: searchService,
            storage: storageService,
          },
        }),
      })
    );

    // WebSocket server for real-time features
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    useServer({ schema }, wsServer);

    // Error handling middleware
    app.use(errorHandler);

    // Error logging
    app.use(expressWinston.errorLogger({
      winstonInstance: logger,
    }));

    const PORT = process.env.BACKEND_PORT || 4000;
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
      logger.info(`🚀 GraphQL endpoint at http://localhost:${PORT}/graphql`);
      logger.info(`🚀 WebSocket server at ws://localhost:${PORT}/graphql`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer();