/**
 * AI Version Change Summary — generate a narrative summary of how a document
 * has evolved across its version history. Whereas /api/redline gives a pair-
 * wise diff, this endpoint produces a single rolled-up "what changed across
 * all versions" narrative that's useful for stakeholders catching up.
 *
 * Endpoints:
 *   POST /api/version-summary/:documentId   — run AI summary, persist into aiResults
 *   GET  /api/version-summary/:documentId   — return last cached summary
 *
 * Apply pass 4 — mechanical backlog item from `_AUDIT_NOTE.md`.
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authenticateToken';
import { aiRateLimiter } from '../middleware/aiRateLimit';
import { parseAIJson } from '../utils/parseAIJson';

const prisma = new PrismaClient();
const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

interface VersionRecord {
  versionNumber: number;
  content: string;
  changeNote?: string | null;
  createdAt?: string;
}

interface VersionSummary {
  documentId: string;
  versionsConsidered: number[];
  narrative: string;
  themes: Array<{ label: string; description: string; firstSeenVersion: number }>;
  riskFlags: string[];
  model: string;
  generatedAt: string;
}

function lineDiff(oldText: string, newText: string) {
  const a = (oldText || '').split('\n');
  const b = (newText || '').split('\n');
  const setB = new Set(b);
  const setA = new Set(a);
  const out: Array<{ type: 'add' | 'remove' | 'context'; line: string }> = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i >= a.length) { out.push({ type: 'add', line: b[j++] }); continue; }
    if (j >= b.length) { out.push({ type: 'remove', line: a[i++] }); continue; }
    if (a[i] === b[j]) { out.push({ type: 'context', line: a[i] }); i++; j++; continue; }
    if (!setB.has(a[i])) { out.push({ type: 'remove', line: a[i++] }); continue; }
    if (!setA.has(b[j])) { out.push({ type: 'add', line: b[j++] }); continue; }
    out.push({ type: 'context', line: a[i] });
    i++; j++;
  }
  return out;
}

async function loadVersions(documentId: string): Promise<VersionRecord[]> {
  try {
    const rows = await (prisma as any).documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'asc' },
      select: { versionNumber: true, content: true, changeNote: true, createdAt: true },
    });
    if (Array.isArray(rows) && rows.length) {
      return rows.map((r: any) => ({
        versionNumber: r.versionNumber,
        content: r.content || '',
        changeNote: r.changeNote ?? null,
        createdAt: r.createdAt?.toISOString?.() || undefined,
      }));
    }
  } catch { /* documentVersion table may not have content column */ }

  // Fallback: synthesize a single-version history from the current document.
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return [];
  return [{ versionNumber: 1, content: doc.content || '', changeNote: null }];
}

router.get('/:documentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const ai = (doc as any).aiResults || {};
    res.json(ai.versionSummary || {
      documentId: doc.id,
      message: 'No version summary yet — POST to /api/version-summary/:documentId to run one.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:documentId', authenticateToken, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI_NOT_CONFIGURED', message: 'OPENROUTER_API_KEY not set.' });
    }

    const versions = await loadVersions(doc.id);
    if (!versions.length) {
      return res.status(400).json({ error: 'NO_VERSIONS', message: 'Document has no versions to summarize.' });
    }

    // Build a compact change log: per-version note + tiny diff vs. prior.
    const changeLog: string[] = [];
    let prior = '';
    for (const v of versions.slice(0, 25)) {
      const diff = lineDiff(prior, v.content);
      const compactDiff = diff
        .filter((d) => d.type !== 'context')
        .slice(0, 60)
        .map((d) => `${d.type === 'add' ? '+' : '-'} ${d.line.substring(0, 200)}`)
        .join('\n');
      changeLog.push(
        `--- v${v.versionNumber}${v.changeNote ? ` (note: ${v.changeNote})` : ''} ---\n${compactDiff || '(no textual changes detected)'}`,
      );
      prior = v.content;
    }

    const aiResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a document historian. Given a per-version change log, write a concise stakeholder-facing ' +
              'narrative summary of how the document evolved. Return STRICT JSON: ' +
              '{"narrative":string,"themes":[{"label":string,"description":string,"firstSeenVersion":number}],' +
              '"riskFlags":string[]}. narrative is a single paragraph. themes group recurring intents across versions. ' +
              'riskFlags include any apparent removal of compliance, safety, or accountability language.',
          },
          {
            role: 'user',
            content:
              `Document title: ${doc.title}\nTotal versions: ${versions.length}\n\nChange log (truncated):\n${changeLog.join('\n\n')}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
          'X-Title': 'Document Management Version Summary',
        },
        timeout: 60_000,
      },
    );

    const raw = aiResp.data?.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson<Partial<VersionSummary>>(raw, {
      fallback: { narrative: '', themes: [], riskFlags: [] },
    });
    if (!parsed.ok) {
      return res.status(502).json({ error: 'AI_PARSE_FAILED', raw: parsed.raw });
    }

    const summary: VersionSummary = {
      documentId: doc.id,
      versionsConsidered: versions.map((v) => v.versionNumber),
      narrative: parsed.data?.narrative || '',
      themes: parsed.data?.themes || [],
      riskFlags: parsed.data?.riskFlags || [],
      model: MODEL,
      generatedAt: new Date().toISOString(),
    };

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        aiResults: {
          ...((doc as any).aiResults || {}),
          versionSummary: summary,
        },
      } as any,
    });

    res.json(summary);
  } catch (err: any) {
    console.error('version-summary failed', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
