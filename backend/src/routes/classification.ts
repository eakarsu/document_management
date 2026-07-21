/**
 * AI Document Classification — given a document id (or raw text), classify it
 * by type / topic / tags using the OpenRouter LLM. Mirrors the compliance
 * route's pattern: lazy persistence into Document.aiResults JSONB so no Prisma
 * migration is required.
 *
 * Endpoints:
 *   POST /api/classification/:documentId   — run AI classification, persist
 *   GET  /api/classification/:documentId   — return last cached classification
 *   POST /api/classification/preview       — classify ad-hoc text (no persist)
 *
 * Apply pass 4 — mechanical backlog item from `_AUDIT_NOTE.md`.
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authenticateToken';
import { aiRateLimiter } from '../middleware/aiRateLimit';
import { parseAIJson } from '../utils/parseAIJson';
import { defendAIInput, stageAIResult } from '../security/aiGovernance';

const prisma = new PrismaClient();
const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

interface Classification {
  primaryType: string;
  subType?: string;
  topics: string[];
  tags: string[];
  confidence: number;       // 0-1
  rationale?: string;
  model: string;
  generatedAt: string;
}

const SYSTEM_PROMPT =
  'You are a document classifier. Read the supplied document text and return STRICT JSON only matching: ' +
  '{"primaryType":string,"subType":string,"topics":string[],"tags":string[],"confidence":number,"rationale":string}. ' +
  'primaryType is one of: POLICY, REGULATION, INSTRUCTION, MEMO, REPORT, CONTRACT, MANUAL, MEETING_NOTES, OTHER. ' +
  'topics is up to 6 short noun phrases describing the subject matter. tags is up to 8 lowercase keyword tags. ' +
  'confidence is your overall confidence in primaryType (0..1).';

async function classifyText(title: string, content: string): Promise<Classification> {
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
      temperature: 0.1,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': 'Document Management Classification',
      },
      timeout: 60_000,
    },
  );

  const raw = aiResp.data?.choices?.[0]?.message?.content || '';
  const parsed = parseAIJson<Partial<Classification>>(raw, {
    fallback: { primaryType: 'OTHER', topics: [], tags: [], confidence: 0 },
  });
  if (!parsed.ok) {
    throw new Error('AI returned invalid JSON for classification');
  }
  const data = parsed.data || {};
  return {
    primaryType: data.primaryType || 'OTHER',
    subType: data.subType,
    topics: Array.isArray(data.topics) ? data.topics.slice(0, 6) : [],
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    rationale: data.rationale,
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
    res.json(ai.classification || {
      documentId: doc.id,
      message: 'No classification yet — POST to /api/classification/:documentId to run one.',
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
    const defended = defendAIInput(String(content));
    const classification = await classifyText(title || 'Untitled', defended.content);
    res.json(classification);
  } catch (err: any) {
    console.error('classification preview failed', err?.response?.data || err.message);
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

    const defended = defendAIInput(content);
    const classification = await classifyText(doc.title, defended.content);
    const artifact = await stageAIResult({ prisma, document: doc, actorId: req.user.id, feature: 'classification', output: classification, promptDigest: defended.digest, model: classification.model });
    res.status(202).json({ result: classification, artifactId: artifact.id, reviewStatus: artifact.status, persisted: false });
  } catch (err: any) {
    console.error('classification failed', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
