import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app = express();
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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// JWT middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  // Try to get token from Authorization header first, then from query parameters
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try query parameter for iframe/image requests
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions: user.role.permissions,
      organizationId: user.organizationId
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware
const optionalAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          permissions: user.role.permissions,
          organizationId: user.organizationId
        };
      }
    } catch (error) {
      // Continue without auth
    }
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Richmond Document Management System Backend' 
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const docCount = await prisma.document.count();
    res.json({ 
      status: 'connected', 
      users: userCount,
      documents: docCount 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all users (for testing)
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all documents (for testing)
app.get('/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: { createdBy: { select: { firstName: true, lastName: true, email: true } } }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Simple auth endpoint for demo
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
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Create JWT tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        organizationId: user.organizationId
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

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

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
                          req.user.permissions.includes('documents:write') ||
                          req.user.permissions.includes('*');

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
        changeNotes: changeNotes || `Version ${nextVersion} updated by ${req.user.firstName} ${req.user.lastName}`,
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

    // Create workflow task for approval (assign to document creator if different user)
    if (originalDoc.createdById !== req.user.id) {
      // Find or create an approval workflow
      let approvalWorkflow = await prisma.workflow.findFirst({
        where: {
          organizationId: req.user.organizationId,
          name: 'Document Approval'
        }
      });

      if (!approvalWorkflow) {
        approvalWorkflow = await prisma.workflow.create({
          data: {
            name: 'Document Approval',
            description: 'Standard document approval workflow',
            definition: {
              steps: [
                { step: 1, name: 'Review Changes', type: 'approval' },
                { step: 2, name: 'Publish', type: 'system' }
              ]
            },
            organizationId: req.user.organizationId
          }
        });
      }

      // Create document workflow instance
      const docWorkflow = await prisma.documentWorkflow.create({
        data: {
          documentId,
          workflowId: approvalWorkflow.id,
          currentStep: 1,
          totalSteps: 2
        }
      });

      // Create approval task
      await prisma.workflowTask.create({
        data: {
          title: `Review changes to "${originalDoc.title}"`,
          description: `${req.user.firstName} ${req.user.lastName} has uploaded a new version of this document. Please review and approve/reject the changes.`,
          stepNumber: 1,
          workflowId: approvalWorkflow.id,
          assignedToId: originalDoc.createdById,
          createdById: req.user.id,
          formData: {
            documentId,
            versionId: newVersion.id,
            changeNotes: changeNotes
          }
        }
      });
    }

    // Log the version creation
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_VERSION',
        resource: 'DOCUMENT',
        resourceId: documentId,
        newValues: {
          versionNumber: nextVersion,
          changeType,
          changeNotes
        },
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail version creation if audit log fails

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

// Document upload endpoint with multer error handling
app.post('/api/documents/upload', authenticateToken, (req: any, res: any, next: any) => {
  upload.single('document')(req, res, (err: any) => {
    if (err) {
      // Handle multer errors
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
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, category, folderId } = req.body;
    const file = req.file;

    // Generate checksum for duplicate detection
    const fileBuffer = fs.readFileSync(file.path);
    const checksum = require('crypto').createHash('md5').update(fileBuffer).digest('hex');

    // Check for existing document with same checksum
    const existingDoc = await prisma.document.findUnique({
      where: { checksum }
    });

    if (existingDoc) {
      // Remove uploaded file
      fs.unlinkSync(file.path);
      return res.status(409).json({ 
        error: 'Document with this content already exists',
        existingDocument: existingDoc
      });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: title || file.originalname,
        description: description || null,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        storagePath: file.path,
        category: category || 'General',
        status: 'PUBLISHED',
        createdById: req.user.id,
        organizationId: req.user.organizationId,
        folderId: folderId || null
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        folder: {
          select: { name: true, fullPath: true }
        }
      }
    });

    res.json({
      success: true,
      document: {
        ...document,
        downloadUrl: `/uploads/${file.filename}`
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Document upload failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Document delete endpoint
app.delete('/api/documents/:id', authenticateToken, async (req: any, res) => {
  try {
    const documentId = req.params.id;

    // Find the document first to check permissions and get file info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
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

    // Check permissions - user must be the creator or have delete permissions
    const hasDeleteAccess = document.createdById === req.user.id ||
                           document.permissions.some(p => ['DELETE', 'ADMIN'].includes(p.permission)) ||
                           req.user.permissions.includes('documents:delete') ||
                           req.user.permissions.includes('*');

    if (!hasDeleteAccess) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete this document.' });
    }

    // Delete the physical file from storage
    if (document.storagePath && fs.existsSync(document.storagePath)) {
      try {
        fs.unlinkSync(document.storagePath);
      } catch (fileError) {
        console.error('Failed to delete physical file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the document record from database
    await prisma.document.delete({
      where: { id: documentId }
    });

    // Log the deletion for audit purposes
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'DOCUMENT',
        resourceId: documentId,
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail deletion if audit log fails

    res.json({
      success: true,
      message: `Document "${document.title}" has been deleted successfully`
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ 
      error: 'Document deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Document view/preview endpoint (displays in browser)
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
                     req.user.permissions.includes('documents:read') ||
                     req.user.permissions.includes('*');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.storagePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
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
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.resolve(document.storagePath));

  } catch (error) {
    console.error('Document view error:', error);
    res.status(500).json({ 
      error: 'View failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Document search endpoint (must come before :id route)
app.get('/api/documents/search', authenticateToken, async (req: any, res) => {
  try {
    const { 
      q, 
      category, 
      status, 
      folderId, 
      createdBy, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    let where: any = {};

    // Organization filter (always applied for authenticated users)
    where.organizationId = req.user.organizationId;

    // Search query
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { originalName: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    // Filters
    if (category) where.category = category;
    if (status) where.status = status;
    if (folderId) where.folderId = folderId;
    if (createdBy) where.createdById = createdBy;

    // Get total count
    const total = await prisma.document.count({ where });

    // Get documents
    const documents = await prisma.document.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        folder: {
          select: { name: true, fullPath: true }
        },
        _count: {
          select: { comments: true, versions: true }
        }
      }
    });

    res.json({
      success: true,
      documents: documents.map(doc => ({
        ...doc,
        downloadUrl: `/api/documents/${doc.id}/download`,
        previewUrl: `/uploads/${doc.fileName}`,
        commentsCount: doc._count.comments,
        versionsCount: doc._count.versions
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
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
                     req.user.permissions.includes('documents:read') ||
                     req.user.permissions.includes('*');

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
                     req.user.permissions.includes('documents:read') ||
                     req.user.permissions.includes('*');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(version.storagePath)) {
      return res.status(404).json({ error: 'Version file not found on disk' });
    }

    // Log download activity
    await prisma.auditLog.create({
      data: {
        action: 'DOWNLOAD_VERSION',
        resource: 'DOCUMENT',
        resourceId: documentId,
        newValues: { versionId: version.id, versionNumber: version.versionNumber },
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail download if audit log fails

    // Send file
    const fileName = `${version.title}-v${version.versionNumber}${path.extname(version.fileName)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', version.document.mimeType);
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
        document: {
          include: {
            workflows: {
              include: { workflow: true }
            }
          }
        },
        createdBy: true
      }
    });

    if (!version || version.documentId !== documentId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Check if user has permission to approve (document creator or admin)
    const hasApprovalAccess = version.document.createdById === req.user.id ||
                             req.user.permissions.includes('documents:approve') ||
                             req.user.permissions.includes('*');

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

      // Complete any active workflow tasks
      await prisma.workflowTask.updateMany({
        where: {
          formData: { path: ['documentId'], equals: documentId },
          status: 'PENDING'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Update workflow status
      await prisma.documentWorkflow.updateMany({
        where: { 
          documentId,
          status: 'IN_PROGRESS'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

    } else {
      // Reject - update document status back to draft
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'DRAFT',
          updatedAt: new Date()
        }
      });

      // Mark workflow tasks as cancelled
      await prisma.workflowTask.updateMany({
        where: {
          formData: { path: ['documentId'], equals: documentId },
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      });

      // Update workflow status
      await prisma.documentWorkflow.updateMany({
        where: { 
          documentId,
          status: 'IN_PROGRESS'
        },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      });
    }

    // Add comment if provided
    if (comments) {
      await prisma.comment.create({
        data: {
          content: `${action === 'approve' ? 'Approved' : 'Rejected'} version ${version.versionNumber}: ${comments}`,
          documentId,
          authorId: req.user.id
        }
      });
    }

    // Log the approval/rejection
    await prisma.auditLog.create({
      data: {
        action: action.toUpperCase() + '_VERSION',
        resource: 'DOCUMENT',
        resourceId: documentId,
        newValues: {
          versionId: version.id,
          versionNumber: version.versionNumber,
          action,
          comments
        },
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail approval if audit log fails

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
                            req.user.permissions.includes('documents:publish') ||
                            req.user.permissions.includes('*');

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

    // Log the publication
    await prisma.auditLog.create({
      data: {
        action: 'PUBLISH',
        resource: 'DOCUMENT',
        resourceId: documentId,
        newValues: {
          publishNotes,
          currentVersion: document.currentVersion
        },
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail publication if audit log fails

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

// Document details endpoint
app.get('/api/documents/:id', authenticateToken, async (req: any, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        folder: {
          select: { name: true, fullPath: true }
        },
        _count: {
          select: { comments: true, versions: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    const hasAccess = document.createdById === req.user.id ||
                     req.user.permissions.includes('documents:read') ||
                     req.user.permissions.includes('*');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      document: {
        ...document,
        downloadUrl: `/api/documents/${document.id}/download`,
        viewUrl: `/api/documents/${document.id}/view`,
        commentsCount: document._count.comments,
        versionsCount: document._count.versions
      }
    });

  } catch (error) {
    console.error('Document details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document details',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Document download endpoint
app.get('/api/documents/:id/download', authenticateToken, async (req: any, res) => {
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
                     req.user.permissions.includes('documents:read') ||
                     req.user.permissions.includes('*');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.storagePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Log download activity
    await prisma.auditLog.create({
      data: {
        action: 'DOWNLOAD',
        resource: 'DOCUMENT',
        resourceId: document.id,
        userId: req.user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    }).catch(() => {}); // Don't fail download if audit log fails

    // Update last accessed
    await prisma.document.update({
      where: { id: document.id },
      data: { lastAccessedAt: new Date() }
    }).catch(() => {}); // Don't fail download if update fails

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(path.resolve(document.storagePath));

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ 
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
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

    // Create or find organization
    let organization;
    if (organizationName) {
      organization = await prisma.organization.findFirst({
        where: { name: organizationName }
      });

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: organizationName,
            domain: email.split('@')[1] || 'unknown.com'
          }
        });

        // Create default roles for new organization
        await prisma.role.createMany({
          data: [
            {
              name: 'Admin',
              description: 'Full system access',
              permissions: ['*'],
              organizationId: organization.id,
              isSystem: true
            },
            {
              name: 'Manager',
              description: 'Document management access',
              permissions: ['documents:*', 'users:read', 'folders:*'],
              organizationId: organization.id,
              isSystem: true
            },
            {
              name: 'User',
              description: 'Basic document access',
              permissions: ['documents:read', 'documents:create', 'folders:read'],
              organizationId: organization.id,
              isSystem: true
            }
          ]
        });
      }
    } else {
      // Use default organization
      organization = await prisma.organization.findFirst({
        where: { domain: 'richmond-dms.com' }
      });

      if (!organization) {
        throw new Error('Default organization not found');
      }
    }

    // Get default role (User)
    const defaultRole = await prisma.role.findFirst({
      where: {
        organizationId: organization.id,
        name: 'User'
      }
    });

    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId: defaultRole.id,
        organizationId: organization.id,
        emailVerified: true // Auto-verify for demo
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    });

    // Create tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        organizationId: user.organizationId
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
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
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
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
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
        organizationId: user.organizationId
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// User profile endpoint
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: user.role.permissions,
        organization: user.organization,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req: any, res) => {
  try {
    // In a real implementation, you'd blacklist the token
    // For now, we'll just return success
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get user's workflow tasks (pending approvals)
app.get('/api/workflow/tasks', authenticateToken, async (req: any, res) => {
  try {
    const tasks = await prisma.workflowTask.findMany({
      where: {
        assignedToId: req.user.id,
        status: 'PENDING'
      },
      include: {
        workflow: true,
        assignedTo: {
          select: { firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich tasks with document information if available
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.formData && typeof task.formData === 'object' && 'documentId' in task.formData) {
          const document = await prisma.document.findUnique({
            where: { id: task.formData.documentId as string },
            select: {
              id: true,
              title: true,
              status: true,
              currentVersion: true
            }
          });
          return { ...task, document };
        }
        return task;
      })
    );

    res.json({
      success: true,
      tasks: enrichedTasks
    });

  } catch (error) {
    console.error('Get workflow tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflow tasks',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
  try {
    const [documentCount, userCount, folderCount, recentActivity] = await Promise.all([
      prisma.document.count({
        where: { organizationId: req.user.organizationId }
      }),
      prisma.user.count({
        where: { organizationId: req.user.organizationId }
      }),
      prisma.folder.count({
        where: { organizationId: req.user.organizationId }
      }),
      prisma.auditLog.findMany({
        where: { 
          user: { organizationId: req.user.organizationId }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        documents: documentCount,
        users: userCount,
        folders: folderCount,
        systemHealth: 98.5
      },
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Simple Richmond DMS Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database test: http://localhost:${PORT}/test-db`);
  console.log(`👥 Users: http://localhost:${PORT}/users`);
  console.log(`📄 Documents: http://localhost:${PORT}/documents`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});