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

// GET /api/password-changes - List with pagination and search
router.get('/password-changes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { reason: { contains: search, mode: 'insensitive' as const } },
        { ipAddress: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.passwordChange.count({ where });

    const items = await prisma.passwordChange.findMany({
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
    console.error('Error fetching password changes:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/password-changes/:id - Get single record
router.get('/password-changes/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordChange.findUnique({
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
    console.error('Error fetching password change:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/password-changes - Create new record
router.post('/password-changes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordChange.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating password change:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/password-changes/:id - Update record
router.put('/password-changes/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordChange.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.passwordChange.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating password change:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/password-changes/:id - Delete record
router.delete('/password-changes/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordChange.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.passwordChange.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting password change:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/password-changes/bulk-delete - Delete multiple records
router.post('/password-changes/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.passwordChange.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete password changes:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
