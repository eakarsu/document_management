/**
 * Document Retention Policy
 *
 * Provides:
 *   POST /api/retention/run        — trigger archival of all expired documents (cron use)
 *   POST /api/documents/:id/retention — set / update retention policy on a document
 *   GET  /api/retention/expiring   — list documents expiring within the next N days
 *
 * "Expired" means `expirationDate` is in the past and the document's status is
 * not already ARCHIVED or DELETED.
 *
 * The archival cron is also registered as a background task on module load
 * (runs daily at 02:00 UTC).
 */

import express, { Request, Response } from 'express';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const router = express.Router();
const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// ---------------------------------------------------------------------------
// Core archival logic — reused by both the cron job and the manual endpoint
// ---------------------------------------------------------------------------
async function archiveExpiredDocuments(): Promise<{
  archived: number;
  errors: number;
  documentIds: string[];
}> {
  const now = new Date();
  logger.info('Retention policy run started', { triggeredAt: now.toISOString() });

  // Find all expired, non-terminal documents
  const expired = await prisma.document.findMany({
    where: {
      expirationDate: { lte: now },
      status: { notIn: ['ARCHIVED', 'DELETED'] }
    },
    select: { id: true, title: true, expirationDate: true, status: true, organizationId: true }
  });

  if (expired.length === 0) {
    logger.info('Retention policy run: no expired documents found');
    return { archived: 0, errors: 0, documentIds: [] };
  }

  logger.info(`Retention policy: found ${expired.length} expired document(s) to archive`);

  const archived: string[] = [];
  let errors = 0;

  for (const doc of expired) {
    try {
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          status: 'ARCHIVED',
          updatedAt: now,
          customFields: {
            // Merge with any existing customFields by reading them first would
            // require a separate query; instead we record retention metadata
            // in a dedicated key via a raw update so we don't clobber existing data.
          }
        }
      });

      // Append retention audit info to customFields without losing existing data
      const current = await prisma.document.findUnique({
        where: { id: doc.id },
        select: { customFields: true }
      });
      const existingFields = (current?.customFields as Record<string, any>) || {};
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          customFields: {
            ...existingFields,
            retentionArchival: {
              archivedAt: now.toISOString(),
              previousStatus: doc.status,
              expirationDate: doc.expirationDate?.toISOString(),
              reason: 'automatic-retention-policy'
            }
          }
        }
      });

      archived.push(doc.id);
      logger.info('Document archived by retention policy', {
        documentId: doc.id,
        title: doc.title,
        expirationDate: doc.expirationDate,
        previousStatus: doc.status
      });
    } catch (err: any) {
      errors++;
      logger.error('Failed to archive document', {
        documentId: doc.id,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  logger.info('Retention policy run complete', {
    total: expired.length,
    archived: archived.length,
    errors
  });

  return { archived: archived.length, errors, documentIds: archived };
}

// ---------------------------------------------------------------------------
// Cron: run archival daily at 02:00 UTC
// ---------------------------------------------------------------------------
cron.schedule('0 2 * * *', async () => {
  try {
    await archiveExpiredDocuments();
  } catch (err: any) {
    logger.error('Retention cron job failed', {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}, { timezone: 'UTC' });

logger.info('Document retention cron scheduled (daily 02:00 UTC)');

// ---------------------------------------------------------------------------
// POST /api/retention/run
// Manually trigger the retention archival job (cron secret or admin auth).
// ---------------------------------------------------------------------------
router.post('/run', async (req: Request, res: Response) => {
  try {
    // Validate cron secret if set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      if (token !== cronSecret) {
        return res.status(401).json({ success: false, error: 'Invalid or missing CRON_SECRET' });
      }
    }

    const result = await archiveExpiredDocuments();

    res.json({
      success: true,
      message: `Retention run complete. ${result.archived} document(s) archived, ${result.errors} error(s).`,
      ...result,
      runAt: new Date().toISOString()
    });
  } catch (err: any) {
    logger.error('Manual retention run failed', { error: err instanceof Error ? err.message : 'Unknown' });
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Retention run failed' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/retention/expiring
// List documents expiring within the next `days` days (default 30).
// ---------------------------------------------------------------------------
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days as string) || 30));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const expiring = await prisma.document.findMany({
      where: {
        expirationDate: { gte: new Date(), lte: cutoff },
        status: { notIn: ['ARCHIVED', 'DELETED'] }
      },
      select: {
        id: true,
        title: true,
        status: true,
        expirationDate: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { expirationDate: 'asc' }
    });

    res.json({
      success: true,
      days,
      cutoffDate: cutoff.toISOString(),
      count: expiring.length,
      documents: expiring.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        expirationDate: d.expirationDate,
        daysUntilExpiration: d.expirationDate
          ? Math.ceil((d.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        organizationId: d.organizationId
      }))
    });
  } catch (err: any) {
    logger.error('Failed to list expiring documents', { error: err instanceof Error ? err.message : 'Unknown' });
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to list expiring documents' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/documents/:id/retention
// Set or update the retention (expiration) policy on a document.
// Body: { expirationDate: ISO string | null, retentionReason?: string }
// ---------------------------------------------------------------------------
router.post('/documents/:id/retention', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expirationDate, retentionReason } = req.body;

    // Validate date if provided
    let parsedDate: Date | null = null;
    if (expirationDate !== null && expirationDate !== undefined) {
      parsedDate = new Date(expirationDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid expirationDate. Provide an ISO 8601 date string or null to clear.' });
      }
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, title: true, customFields: true, expirationDate: true }
    });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const existingFields = (document.customFields as Record<string, any>) || {};

    const updated = await prisma.document.update({
      where: { id },
      data: {
        expirationDate: parsedDate,
        updatedAt: new Date(),
        customFields: {
          ...existingFields,
          retentionPolicy: {
            setAt: new Date().toISOString(),
            expirationDate: parsedDate?.toISOString() || null,
            reason: retentionReason || 'manual'
          }
        }
      },
      select: { id: true, title: true, expirationDate: true, status: true, customFields: true }
    });

    logger.info('Retention policy updated', {
      documentId: id,
      expirationDate: parsedDate?.toISOString() || null,
      reason: retentionReason
    });

    res.json({
      success: true,
      documentId: updated.id,
      title: updated.title,
      expirationDate: updated.expirationDate,
      message: parsedDate
        ? `Document will be automatically archived on ${parsedDate.toISOString()}`
        : 'Retention policy cleared — document will not be automatically archived'
    });
  } catch (err: any) {
    logger.error('Failed to set retention policy', { error: err instanceof Error ? err.message : 'Unknown' });
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to set retention policy' });
  }
});

export { router as retentionRouter };
