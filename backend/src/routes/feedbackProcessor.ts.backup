import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get count of critical feedback for a document
 * GET /api/feedback-processor/feedback/critical/:documentId
 */
router.get('/feedback/critical/:documentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    // Get all publishings for this document
    const publishings = await prisma.document_publishings.findMany({
      where: { documentId },
      include: {
        approvals: {
          include: {
            reviewer_feedback: true
          }
        }
      }
    });

    if (!publishings || publishings.length === 0) {
      return res.json({ count: 0, documentId });
    }

    // Count critical feedback across all approvals
    let criticalCount = 0;

    for (const publishing of publishings) {
      for (const approval of publishing.approvals) {
        for (const feedback of approval.reviewer_feedback) {
          const sectionFeedback = feedback.sectionFeedback as any;

          // Check if feedback is critical (type 'C' or severity 'CRITICAL')
          if (
            sectionFeedback?.type === 'C' ||
            sectionFeedback?.severity === 'CRITICAL'
          ) {
            criticalCount++;
          }
        }
      }
    }

    res.json({
      count: criticalCount,
      documentId,
      message: `Found ${criticalCount} critical feedback item(s)`
    });
  } catch (error: any) {
    console.error('Error fetching critical feedback count:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch critical feedback count',
      count: 0
    });
  }
});

/**
 * Get all feedback for a document, optionally grouped by location
 * GET /api/feedback-processor/document/:documentId/feedback?groupByLocation=true
 */
router.get('/document/:documentId/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const groupByLocation = req.query.groupByLocation === 'true';

    // Get all publishings for this document
    const publishings = await prisma.document_publishings.findMany({
      where: { documentId },
      include: {
        approvals: {
          include: {
            reviewer_feedback: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!publishings || publishings.length === 0) {
      return res.json({
        feedback: [],
        grouped: [],
        total: 0,
        documentId
      });
    }

    // Collect all feedback items
    const allFeedback: any[] = [];

    for (const publishing of publishings) {
      for (const approval of publishing.approvals) {
        for (const feedback of approval.reviewer_feedback) {
          const sectionFeedback = feedback.sectionFeedback as any;

          allFeedback.push({
            id: feedback.id,
            approvalId: feedback.approvalId,
            reviewer: {
              id: feedback.users.id,
              name: `${feedback.users.firstName} ${feedback.users.lastName}`,
              email: feedback.users.email
            },
            type: sectionFeedback?.type || feedback.feedbackType,
            severity: sectionFeedback?.severity || 'NORMAL',
            page: sectionFeedback?.page || 1,
            line: sectionFeedback?.line || 0,
            paragraph: sectionFeedback?.paragraph || null,
            section: sectionFeedback?.section || null,
            originalPhrase: sectionFeedback?.originalPhrase || '',
            improvedPhrase: sectionFeedback?.improvedPhrase || '',
            comment: feedback.detailedComments || feedback.summary || '',
            justification: sectionFeedback?.justification || '',
            poc: sectionFeedback?.poc || null,
            component: sectionFeedback?.component || null,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt
          });
        }
      }
    }

    // If grouping by location, organize feedback by page
    if (groupByLocation) {
      const grouped = new Map<number, any[]>();

      for (const item of allFeedback) {
        const page = item.page || 1;
        if (!grouped.has(page)) {
          grouped.set(page, []);
        }
        grouped.get(page)!.push(item);
      }

      // Sort feedback within each page by line number
      for (const [page, items] of grouped.entries()) {
        items.sort((a, b) => (a.line || 0) - (b.line || 0));
      }

      // Convert to array format
      const groupedArray = Array.from(grouped.entries())
        .map(([page, items]) => ({
          page,
          count: items.length,
          feedback: items
        }))
        .sort((a, b) => a.page - b.page);

      return res.json({
        grouped: groupedArray,
        total: allFeedback.length,
        documentId,
        pages: groupedArray.length
      });
    }

    // Return flat list, sorted by page and line
    allFeedback.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return (a.line || 0) - (b.line || 0);
    });

    res.json({
      feedback: allFeedback,
      total: allFeedback.length,
      documentId
    });
  } catch (error: any) {
    console.error('Error fetching document feedback:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch document feedback',
      feedback: [],
      grouped: [],
      total: 0
    });
  }
});

export default router;
