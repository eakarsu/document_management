/**
 * AI Redaction Suggestions — scan a document for sensitive content and
 * propose redactions with severity and offsets. The output is a draft for a
 * human reviewer; nothing is mutated on the source document.
 *
 * Endpoints:
 *   POST /api/redact-suggestions/:documentId   — run AI scan, persist into aiResults
 *   GET  /api/redact-suggestions/:documentId   — return last cached suggestions
 *   POST /api/redact-suggestions/preview       — scan ad-hoc text (no persist)
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

interface RedactionSuggestion {
  category: 'PII' | 'PHI' | 'FINANCIAL' | 'CREDENTIAL' | 'CLASSIFIED' | 'OTHER';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  excerpt: string;
  reason: string;
  replacement?: string;
}

interface RedactionReport {
  documentId?: string;
  suggestions: RedactionSuggestion[];
  totalFound: number;
  model: string;
  generatedAt: string;
}

const SYSTEM_PROMPT =
  'You are a redaction assistant. Identify portions of the supplied document text that should be redacted ' +
  'before public release. Cover PII (names+addresses, SSNs, DOB), PHI (medical), FINANCIAL (account/card numbers), ' +
  'CREDENTIAL (passwords, API keys), CLASSIFIED markings, and OTHER sensitive items. ' +
  'Return STRICT JSON only matching: {"suggestions":[{"category":"PII|PHI|FINANCIAL|CREDENTIAL|CLASSIFIED|OTHER",' +
  '"severity":"CRITICAL|MAJOR|MINOR","excerpt":string,"reason":string,"replacement":string}]}. ' +
  'excerpt MUST be a substring copied verbatim from the document. replacement is the proposed redaction text ' +
  '(e.g., "[REDACTED-PII]"). Return at most 50 suggestions, ordered by severity.';

async function scanText(title: string, content: string): Promise<RedactionReport> {
  const userPrompt =
    `Document title: ${title}\n\nDocument content (truncated):\n${content.substring(0, 8000)}`;
  const aiResp = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': 'Document Management Redaction',
      },
      timeout: 60_000,
    },
  );

  const raw = aiResp.data?.choices?.[0]?.message?.content || '';
  const parsed = parseAIJson<{ suggestions: RedactionSuggestion[] }>(raw, {
    fallback: { suggestions: [] },
  });
  if (!parsed.ok) {
    throw new Error('AI returned invalid JSON for redaction suggestions');
  }
  const suggestions = (parsed.data?.suggestions || []).slice(0, 50);
  return {
    suggestions,
    totalFound: suggestions.length,
    model: MODEL,
    generatedAt: new Date().toISOString(),
  };
}

router.get('/:documentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const ai = (doc as any).aiResults || {};
    res.json(ai.redactSuggestions || {
      documentId: doc.id,
      message: 'No redaction scan yet — POST to /api/redact-suggestions/:documentId to run one.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/preview', authenticateToken, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content } = req.body || {};
    if (!content || String(content).length < 20) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'content required (min 20 chars)' });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI_NOT_CONFIGURED', message: 'OPENROUTER_API_KEY not set.' });
    }
    const report = await scanText(title || 'Untitled', String(content));
    res.json(report);
  } catch (err: any) {
    console.error('redact-suggestions preview failed', err?.response?.data || err.message);
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
    const content = doc.content || (doc as any).ocrText || '';
    if (!content || content.length < 20) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Document has no extractable content.' });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI_NOT_CONFIGURED', message: 'OPENROUTER_API_KEY not set.' });
    }

    const report = await scanText(doc.title, content);
    const persisted: RedactionReport = { ...report, documentId: doc.id };

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        aiResults: {
          ...((doc as any).aiResults || {}),
          redactSuggestions: persisted,
        },
      } as any,
    });

    res.json(persisted);
  } catch (err: any) {
    console.error('redact-suggestions failed', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
