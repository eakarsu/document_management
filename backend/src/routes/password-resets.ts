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

// GET /api/password-resets - List with pagination and search
router.get('/password-resets', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { token: { contains: search, mode: 'insensitive' as const } },
        { ipAddress: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.passwordReset.count({ where });

    const items = await prisma.passwordReset.findMany({
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
    console.error('Error fetching password resets:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/password-resets/:id - Get single record
router.get('/password-resets/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordReset.findUnique({
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
    console.error('Error fetching password reset:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/password-resets - Create new record
router.post('/password-resets', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordReset.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating password reset:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/password-resets/:id - Update record
router.put('/password-resets/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordReset.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.passwordReset.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating password reset:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/password-resets/:id - Delete record
router.delete('/password-resets/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordReset.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.passwordReset.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting password reset:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/password-resets/bulk-delete - Delete multiple records
router.post('/password-resets/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.passwordReset.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete password resets:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
