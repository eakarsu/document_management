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
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { 
            userId: user.id,
            type: 'refresh'
          },
          JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
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
          { expiresIn: '7d' }
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

    // ===== COLLABORATIVE WORKFLOW ENDPOINTS =====

    // Document version upload endpoint (for collaborative editing)
    app.post('/api/documents/:id/versions', authenticateToken, (req: any, res: any, next: any) => {
      upload.single('document')(req, res, (err: any) => {
        if (err) {
          console.error('Multer error:', err.message);
          return res.status(400).json({ 
            success: false,
            error: err.message || 'File upload error' 
          });
        }
        next();
      });
    }, async (req: any, res) => {
      try {
        const documentId = req.params.id;
        
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { changeNotes, changeType = 'MINOR' } = req.body;
        const file = req.file;

        // Find the original document
        const originalDoc = await prisma.document.findUnique({
          where: { id: documentId },
          include: { versions: true }
        });

        if (!originalDoc) {
          // Clean up uploaded file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return res.status(404).json({ error: 'Document not found' });
        }

        // Check permissions - user must have WRITE access
        const hasWriteAccess = originalDoc.createdById === req.user.id ||
                              req.user.permissions?.includes('documents:write') ||
                              req.user.permissions?.includes('*');

        if (!hasWriteAccess) {
          // Clean up uploaded file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return res.status(403).json({ error: 'Access denied. You do not have permission to modify this document.' });
        }

        // Generate checksum for change detection
        const fileBuffer = fs.readFileSync(file.path);
        const checksum = require('crypto').createHash('md5').update(fileBuffer).digest('hex');

        // Check if this version already exists
        const existingVersion = await prisma.documentVersion.findFirst({
          where: { 
            documentId,
            checksum 
          }
        });

        if (existingVersion) {
          // Clean up uploaded file
          fs.unlinkSync(file.path);
          return res.status(409).json({ 
            error: 'This version already exists',
            existingVersion
          });
        }

        // Get next version number
        const nextVersion = Math.max(...originalDoc.versions.map(v => v.versionNumber), originalDoc.currentVersion) + 1;

        // Create new document version
        const newVersion = await prisma.documentVersion.create({
          data: {
            versionNumber: nextVersion,
            title: originalDoc.title,
            description: originalDoc.description,
            fileName: file.filename,
            fileSize: file.size,
            checksum,
            storagePath: file.path,
            changeType: changeType,
            changeNotes: changeNotes || `Version ${nextVersion} updated by ${req.user.name || req.user.email}`,
            documentId,
            createdById: req.user.id
          },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        // Update document status to IN_REVIEW for collaborative workflow
        await prisma.document.update({
          where: { id: documentId },
          data: { 
            status: 'IN_REVIEW',
            updatedAt: new Date()
          }
        });

        // Note: Simplified workflow - in production you'd create proper workflow tasks
        if (originalDoc.createdById !== req.user.id) {
          console.log(`Workflow notification: ${req.user.firstName} ${req.user.lastName} uploaded new version of "${originalDoc.title}"`);
        }

        res.json({
          success: true,
          version: {
            ...newVersion,
            downloadUrl: `/api/documents/${documentId}/versions/${newVersion.id}/download`
          },
          message: `Version ${nextVersion} created successfully. Document is now in review.`
        });

      } catch (error) {
        console.error('Document version upload error:', error);
        
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
          error: 'Version upload failed',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Get document versions
    app.get('/api/documents/:id/versions', authenticateToken, async (req: any, res) => {
      try {
        const documentId = req.params.id;

        // Check if document exists and user has access
        const document = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            versions: {
              include: {
                createdBy: {
                  select: { firstName: true, lastName: true, email: true }
                }
              },
              orderBy: { versionNumber: 'desc' }
            }
          }
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Check permissions
        const hasAccess = document.createdById === req.user.id ||
                         req.user.permissions?.includes('documents:read') ||
                         req.user.permissions?.includes('*');

        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
          success: true,
          versions: document.versions.map(version => ({
            ...version,
            downloadUrl: `/api/documents/${documentId}/versions/${version.id}/download`
          }))
        });

      } catch (error) {
        console.error('Get versions error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch versions',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Download specific version
    app.get('/api/documents/:id/versions/:versionId/download', authenticateToken, async (req: any, res) => {
      try {
        const { id: documentId, versionId } = req.params;

        const version = await prisma.documentVersion.findUnique({
          where: { id: versionId },
          include: {
            document: true,
            createdBy: true
          }
        });

        if (!version || version.documentId !== documentId) {
          return res.status(404).json({ error: 'Version not found' });
        }

        // Check permissions
        const hasAccess = version.document.createdById === req.user.id ||
                         req.user.permissions?.includes('documents:read') ||
                         req.user.permissions?.includes('*');

        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Check if file exists
        if (!fs.existsSync(version.storagePath)) {
          return res.status(404).json({ error: 'Version file not found on disk' });
        }

        // Send file
        const fileName = `${version.title}-v${version.versionNumber}${path.extname(version.fileName)}`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', version.document.mimeType || 'application/octet-stream');
        res.sendFile(path.resolve(version.storagePath));

      } catch (error) {
        console.error('Version download error:', error);
        res.status(500).json({ 
          error: 'Download failed',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Approve/Reject document version
    app.post('/api/documents/:id/versions/:versionId/approve', authenticateToken, async (req: any, res) => {
      try {
        const { id: documentId, versionId } = req.params;
        const { action, comments } = req.body; // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
          return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
        }

        const version = await prisma.documentVersion.findUnique({
          where: { id: versionId },
          include: {
            document: true,
            createdBy: true
          }
        });

        if (!version || version.documentId !== documentId) {
          return res.status(404).json({ error: 'Version not found' });
        }

        // Check if user has permission to approve (document creator or admin)
        const hasApprovalAccess = version.document.createdById === req.user.id ||
                                 req.user.permissions?.includes('documents:approve') ||
                                 req.user.permissions?.includes('*');

        if (!hasApprovalAccess) {
          return res.status(403).json({ error: 'Access denied. You do not have permission to approve/reject this document.' });
        }

        if (action === 'approve') {
          // Update document to use this version and mark as approved
          await prisma.document.update({
            where: { id: documentId },
            data: {
              currentVersion: version.versionNumber,
              status: 'APPROVED',
              updatedAt: new Date()
            }
          });

          // Note: Simplified workflow - would update workflow tasks in production
          console.log(`Document ${documentId} version approved`);

        } else {
          // Reject - update document status back to draft
          await prisma.document.update({
            where: { id: documentId },
            data: {
              status: 'DRAFT',
              updatedAt: new Date()
            }
          });

          // Note: Simplified workflow - would cancel workflow tasks in production
          console.log(`Document ${documentId} version rejected`);
        }

        res.json({
          success: true,
          message: `Version ${version.versionNumber} ${action}d successfully`,
          document: {
            id: documentId,
            status: action === 'approve' ? 'APPROVED' : 'DRAFT',
            currentVersion: action === 'approve' ? version.versionNumber : version.document.currentVersion
          }
        });

      } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ 
          error: 'Approval failed',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Publish approved document (merge all approved changes)
    app.post('/api/documents/:id/publish', authenticateToken, async (req: any, res) => {
      try {
        const documentId = req.params.id;
        const { publishNotes } = req.body;

        const document = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1
            }
          }
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Check if user has permission to publish
        const hasPublishAccess = document.createdById === req.user.id ||
                                req.user.permissions?.includes('documents:publish') ||
                                req.user.permissions?.includes('*');

        if (!hasPublishAccess) {
          return res.status(403).json({ error: 'Access denied. You do not have permission to publish this document.' });
        }

        // Document must be approved before publishing
        if (document.status !== 'APPROVED') {
          return res.status(400).json({ error: 'Document must be approved before publishing' });
        }

        // Update document status to published
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'PUBLISHED',
            updatedAt: new Date()
          }
        });

        res.json({
          success: true,
          message: 'Document published successfully',
          document: {
            id: documentId,
            status: 'PUBLISHED',
            currentVersion: document.currentVersion
          }
        });

      } catch (error) {
        console.error('Publish error:', error);
        res.status(500).json({ 
          error: 'Publish failed',
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
            status: 'IN_REVIEW',
            organizationId: req.user.organizationId  // Show all documents in organization that need review
          },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        });

        // Convert documents to task format for frontend compatibility
        const tasks = documentsInReview.map(doc => ({
          id: `doc-${doc.id}`,
          title: `Review document: ${doc.title}`,
          description: `Document "${doc.title}" is pending review and approval`,
          priority: 'MEDIUM',
          stepNumber: 1,
          formData: {
            documentId: doc.id,
            versionId: doc.currentVersion
          },
          document: {
            id: doc.id,
            title: doc.title,
            status: doc.status,
            currentVersion: doc.currentVersion
          },
          createdBy: {
            firstName: doc.createdBy.firstName,
            lastName: doc.createdBy.lastName,
            email: doc.createdBy.email
          },
          createdAt: doc.updatedAt,
          status: 'PENDING'
        }));

        res.json({
          success: true,
          tasks
        });

      } catch (error) {
        console.error('Get workflow tasks error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch workflow tasks',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

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

        const newVersion = await documentService.createDocumentVersion(
          documentId,
          req.file.buffer,
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
          where: { organizationId: req.user.organizationId }
        });
        
        const userCount = await prisma.user.count({
          where: { 
            organizationId: req.user.organizationId,
            isActive: true
          }
        });
        
        const recentUploads = await prisma.document.count({
          where: { 
            organizationId: req.user.organizationId,
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
          where: { organizationId: req.user.organizationId },
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

    const PORT = process.env.PORT || 4000;
    
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