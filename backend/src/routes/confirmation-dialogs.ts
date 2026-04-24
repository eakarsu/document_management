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

// GET /api/confirmation-dialogs - List with pagination and search
router.get('/confirmation-dialogs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { title: { contains: search, mode: 'insensitive' as const } },
        { message: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.confirmationDialog.count({ where });

    const items = await prisma.confirmationDialog.findMany({
      where,
      skip,
      take: limit,
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
    console.error('Error fetching confirmation dialogs:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/confirmation-dialogs/:id - Get single record
router.get('/confirmation-dialogs/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.confirmationDialog.findUnique({
      where: { id: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching confirmation dialog:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/confirmation-dialogs - Create new record
router.post('/confirmation-dialogs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.confirmationDialog.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating confirmation dialog:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/confirmation-dialogs/:id - Update record
router.put('/confirmation-dialogs/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.confirmationDialog.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.confirmationDialog.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating confirmation dialog:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/confirmation-dialogs/:id - Delete record
router.delete('/confirmation-dialogs/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.confirmationDialog.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.confirmationDialog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting confirmation dialog:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/confirmation-dialogs/bulk-delete - Delete multiple records
router.post('/confirmation-dialogs/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.confirmationDialog.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete confirmation dialogs:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
