/**
 * AI Redline Diff Viewer — fetch two document versions, generate a textual
 * unified diff client-side or here, then ask the AI to summarize "what
 * changed and why" with bullet points the reviewer can scan.
 *
 * Endpoints:
 *   GET  /api/redline/:documentId/:fromVersion/:toVersion           — raw diff
 *   POST /api/redline/:documentId/:fromVersion/:toVersion/summary   — AI summary
 *
 * "Proposed NEW custom feature #1 — AI redline diff viewer".
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

/**
 * Compute a simple line-level diff. Returns an array of { type, line } where
 * type is 'add' | 'remove' | 'context'. Good enough for AI to reason about,
 * even though Myers-style diffs would produce smaller deltas.
 */
function lineDiff(oldText: string, newText: string) {
  const a = (oldText || '').split('\n');
  const b = (newText || '').split('\n');
  const setB = new Set(b);
  const setA = new Set(a);
  const out: Array<{ type: 'add' | 'remove' | 'context'; line: string }> = [];
  // Walk both with naive interleave — common lines kept once.
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i >= a.length) { out.push({ type: 'add', line: b[j++] }); continue; }
    if (j >= b.length) { out.push({ type: 'remove', line: a[i++] }); continue; }
    if (a[i] === b[j]) { out.push({ type: 'context', line: a[i] }); i++; j++; continue; }
    if (!setB.has(a[i])) { out.push({ type: 'remove', line: a[i++] }); continue; }
    if (!setA.has(b[j])) { out.push({ type: 'add', line: b[j++] }); continue; }
    // Both sides have each other elsewhere — skip both as context to avoid loop.
    out.push({ type: 'context', line: a[i] });
    i++; j++;
  }
  return out;
}

async function loadVersionContent(documentId: string, versionNumber: number): Promise<string> {
  // Try DocumentVersion table first; fall back to current document content.
  try {
    const v = await (prisma as any).documentVersion.findFirst({
      where: { documentId, versionNumber },
      select: { content: true },
    });
    if (v?.content) return v.content;
  } catch { /* table may not have content column on this schema */ }
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  return doc?.content || '';
}

router.get('/:documentId/:fromVersion/:toVersion', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, fromVersion, toVersion } = req.params;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const from = await loadVersionContent(documentId, parseInt(fromVersion, 10));
    const to = await loadVersionContent(documentId, parseInt(toVersion, 10));
    const diff = lineDiff(from, to);
    const stats = diff.reduce((acc, d) => {
      if (d.type === 'add') acc.added++;
      else if (d.type === 'remove') acc.removed++;
      return acc;
    }, { added: 0, removed: 0 });
    res.json({ documentId, fromVersion: +fromVersion, toVersion: +toVersion, diff, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:documentId/:fromVersion/:toVersion/summary', authenticateToken, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, fromVersion, toVersion } = req.params;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI_NOT_CONFIGURED', message: 'OPENROUTER_API_KEY not set.' });
    }

    const from = await loadVersionContent(documentId, parseInt(fromVersion, 10));
    const to = await loadVersionContent(documentId, parseInt(toVersion, 10));
    const diff = lineDiff(from, to);
    // Compact the diff for the prompt — keep only changed lines + small context.
    const compact = diff
      .filter((d) => d.type !== 'context')
      .slice(0, 400)
      .map((d) => `${d.type === 'add' ? '+' : '-'} ${d.line}`)
      .join('\n');

    const aiResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a document reviewer. Given a unified-style diff, return STRICT JSON: ' +
              '{"summary":string,"categories":[{"label":string,"changes":string[]}],"riskFlags":string[]}. ' +
              'Group changes by intent (e.g. "Clarification", "New requirement", "Removed scope"). ' +
              'Mark riskFlags for any deletion of compliance/safety language.',
          },
          {
            role: 'user',
            content:
              `Document: ${doc.title}\nFrom version ${fromVersion} to ${toVersion}.\n\nDiff (truncated):\n${compact}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
          'X-Title': 'Document Management Redline Diff',
        },
        timeout: 60_000,
      },
    );

    const raw = aiResp.data?.choices?.[0]?.message?.content || '';
    const usage = aiResp.data?.usage;
    const parsed = parseAIJson<any>(raw, { fallback: { summary: '', categories: [], riskFlags: [] } });
    if (!parsed.ok) {
      return res.status(502).json({ error: 'AI_PARSE_FAILED', raw: parsed.raw });
    }

    // Persist into Document.aiResults so the UI can show the latest summary.
    await prisma.document.update({
      where: { id: documentId },
      data: {
        aiResults: {
          ...((doc as any).aiResults || {}),
          redlineSummary: {
            ...parsed.data,
            fromVersion: +fromVersion,
            toVersion: +toVersion,
            model: MODEL,
            usage,
            generatedAt: new Date().toISOString(),
          },
        },
      } as any,
    });

    res.json({ ...parsed.data, model: MODEL, usage });
  } catch (err: any) {
    console.error('redline summary failed', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
