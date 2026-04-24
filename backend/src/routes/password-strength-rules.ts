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

// GET /api/password-strength-rules - List with pagination and search
router.get('/password-strength-rules', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { errorMessage: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.passwordStrengthRule.count({ where });

    const items = await prisma.passwordStrengthRule.findMany({
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
    console.error('Error fetching password strength rules:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/password-strength-rules/:id - Get single record
router.get('/password-strength-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordStrengthRule.findUnique({
      where: { id: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching password strength rule:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/password-strength-rules - Create new record
router.post('/password-strength-rules', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.passwordStrengthRule.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating password strength rule:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/password-strength-rules/:id - Update record
router.put('/password-strength-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordStrengthRule.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.passwordStrengthRule.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating password strength rule:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/password-strength-rules/:id - Delete record
router.delete('/password-strength-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.passwordStrengthRule.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.passwordStrengthRule.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting password strength rule:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/password-strength-rules/bulk-delete - Delete multiple records
router.post('/password-strength-rules/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.passwordStrengthRule.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete password strength rules:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
