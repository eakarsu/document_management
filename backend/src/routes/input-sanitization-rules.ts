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

// GET /api/input-sanitization-rules - List with pagination and search
router.get('/input-sanitization-rules', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { pattern: { contains: search, mode: 'insensitive' as const } },
        { fieldTarget: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.inputSanitizationRule.count({ where });

    const items = await prisma.inputSanitizationRule.findMany({
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
    console.error('Error fetching input sanitization rules:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/input-sanitization-rules/:id - Get single record
router.get('/input-sanitization-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.inputSanitizationRule.findUnique({
      where: { id: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching input sanitization rule:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST /api/input-sanitization-rules - Create new record
router.post('/input-sanitization-rules', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.inputSanitizationRule.create({
      data: req.body
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating input sanitization rule:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/input-sanitization-rules/:id - Update record
router.put('/input-sanitization-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.inputSanitizationRule.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const item = await prisma.inputSanitizationRule.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(item);
  } catch (error: any) {
    console.error('Error updating input sanitization rule:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/input-sanitization-rules/:id - Delete record
router.delete('/input-sanitization-rules/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.inputSanitizationRule.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.inputSanitizationRule.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting input sanitization rule:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/input-sanitization-rules/bulk-delete - Delete multiple records
router.post('/input-sanitization-rules/bulk-delete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.inputSanitizationRule.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      message: `Deleted ${result.count} record(s)`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in bulk delete input sanitization rules:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

export default router;
