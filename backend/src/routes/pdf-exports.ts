import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    organizationId: string;
  };
}

// GET /api/pdf-exports - List with pagination and search
router.get('/pdf-exports', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { fileName: { contains: search, mode: 'insensitive' as const } },
        { exportType: { contains: search, mode: 'insensitive' as const } },
        { templateUsed: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.pdfExport.count({ where });

    const items = await prisma.pdfExport.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching pdf exports:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/pdf-exports/:id - Get single record
router.get('/pdf-exports/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.pdfExport.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching pdf export:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/pdf-exports - Create new record
router.post('/pdf-exports', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.pdfExport.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating pdf export:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/pdf-exports/:id - Update record
router.put('/pdf-exports/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.pdfExport.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.pdfExport.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating pdf export:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/pdf-exports/:id - Delete record
router.delete('/pdf-exports/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.pdfExport.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.pdfExport.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting pdf export:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/pdf-exports/bulk-delete - Delete multiple records
router.post('/pdf-exports/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.pdfExport.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete pdf exports:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
