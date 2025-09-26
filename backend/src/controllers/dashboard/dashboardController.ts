import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';

const prisma = new PrismaClient();

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response) {
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

    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const dashboardController = new DashboardController();