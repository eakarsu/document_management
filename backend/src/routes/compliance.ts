/**
 * Compliance Checker — runs an AI pass over a document's content scoring it
 * against the organization's style guide / compliance rules and returning a
 * structured report with citations back to the rules.
 *
 * Endpoints:
 *   GET  /api/compliance/rules                — list active rules (paginated)
 *   POST /api/compliance/rules                — create a rule
 *   GET  /api/compliance/rules/:id            — get one
 *   PUT  /api/compliance/rules/:id            — update
 *   DELETE /api/compliance/rules/:id          — remove
 *   POST /api/compliance/check/:documentId    — run AI check, persist into Document.aiResults
 *   GET  /api/compliance/check/:documentId    — return last-cached compliance report
 *
 * "Proposed NEW custom feature #2 — Compliance checker" from audit section 5.
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

interface ComplianceFinding {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  passed: boolean;
  excerpt?: string;
  suggestion?: string;
}

interface ComplianceReport {
  documentId: string;
  score: number;             // 0-100
  totalRules: number;
  passedRules: number;
  findings: ComplianceFinding[];
  model: string;
  generatedAt: string;
}

/**
 * In-memory rule store. Persists in Document.aiResults.complianceRules of a
 * synthetic "rule book" doc identified by org. We avoid a new Prisma model so
 * this feature is drop-in without a migration; production would promote this
 * to its own table.
 */
function ruleBookKey(orgId: string) {
  return `compliance:rules:${orgId}`;
}

async function getOrgRules(organizationId: string) {
  // Stored in Organization.metadata-equivalent, here we attach to a settings doc.
  const setting = await (prisma as any).systemSetting?.findUnique?.({
    where: { key: ruleBookKey(organizationId) },
  }).catch(() => null);
  if (!setting) return [];
  try { return JSON.parse(setting.value || '[]'); } catch { return []; }
}

async function saveOrgRules(organizationId: string, rules: any[]) {
  await (prisma as any).systemSetting?.upsert?.({
    where: { key: ruleBookKey(organizationId) },
    update: { value: JSON.stringify(rules) },
    create: { key: ruleBookKey(organizationId), value: JSON.stringify(rules) },
  }).catch(() => null);
}

router.get('/rules', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
    const offset = parseInt(String(req.query.offset || '0'), 10);
    const all = await getOrgRules(orgId);
    res.json({ items: all.slice(offset, offset + limit), total: all.length, limit, offset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;
    const { name, description, severity, pattern } = req.body || {};
    if (!name || !description) return res.status(400).json({ error: 'name and description required' });
    const all = await getOrgRules(orgId);
    const rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name, description, severity: severity || 'MINOR', pattern: pattern || null,
      createdAt: new Date().toISOString(),
    };
    all.push(rule);
    await saveOrgRules(orgId, all);
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const all = await getOrgRules(req.user.organizationId);
  const r = all.find((x: any) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Rule not found' });
  res.json(r);
});

router.put('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const all = await getOrgRules(req.user.organizationId);
  const idx = all.findIndex((x: any) => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Rule not found' });
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id };
  await saveOrgRules(req.user.organizationId, all);
  res.json(all[idx]);
});

router.delete('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const all = await getOrgRules(req.user.organizationId);
  const next = all.filter((x: any) => x.id !== req.params.id);
  await saveOrgRules(req.user.organizationId, next);
  res.json({ ok: true });
});

router.get('/check/:documentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const ai = (doc as any).aiResults || {};
    res.json(ai.compliance || { documentId: doc.id, findings: [], score: null, message: 'No compliance report yet — POST to /check/:documentId to run one.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/check/:documentId', authenticateToken, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rules = await getOrgRules(req.user.organizationId);
    if (!rules.length) {
      return res.status(400).json({
        error: 'NO_RULES',
        message: 'No compliance rules configured. Add rules under /api/compliance/rules first.',
      });
    }
    const content = doc.content || (doc as any).ocrText || '';
    if (!content || content.length < 20) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Document has no extractable content.' });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI_NOT_CONFIGURED', message: 'OPENROUTER_API_KEY not set.' });
    }
    const defended = defendAIInput(content);

    const systemPrompt =
      'You are a compliance reviewer. For each rule provided, decide whether the document text passes. ' +
      'Return STRICT JSON only. Schema: ' +
      '{"score":number(0-100),"findings":[{"ruleId":string,"ruleName":string,"severity":"CRITICAL"|"MAJOR"|"MINOR","passed":boolean,"excerpt":string,"suggestion":string}]}';
    const userPrompt =
      `Document title: ${doc.title}\n\nDocument content (delimited and truncated):\n${defended.content.substring(0, 9000)}\n\n` +
      `Rules:\n${rules.map((r: any) => `- [${r.id}] [${r.severity || 'MINOR'}] ${r.name}: ${r.description}`).join('\n')}\n\n` +
      'For each rule decide passed=true/false. Score 100 = all CRITICAL+MAJOR pass. Cite a short excerpt for failed rules.';

    const aiResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
          'X-Title': 'Document Management Compliance',
        },
        timeout: 60_000,
      },
    );

    const raw = aiResp.data?.choices?.[0]?.message?.content || '';
    const usage = aiResp.data?.usage;
    const parsed = parseAIJson<{ score: number; findings: ComplianceFinding[] }>(raw, {
      fallback: { score: 0, findings: [] },
    });
    if (!parsed.ok) {
      return res.status(502).json({
        error: 'AI_PARSE_FAILED',
        message: 'Compliance model returned invalid JSON.',
        raw: parsed.raw,
      });
    }

    const findings = parsed.data?.findings || [];
    const totalRules = findings.length;
    const passedRules = findings.filter((f) => f.passed).length;
    const computedScore = totalRules ? Math.round((passedRules / totalRules) * 100) : (parsed.data?.score ?? 0);
    const report: ComplianceReport = {
      documentId: doc.id,
      score: computedScore,
      totalRules,
      passedRules,
      findings,
      model: MODEL,
      generatedAt: new Date().toISOString(),
    };

    const output = { ...report, usage };
    const artifact = await stageAIResult({ prisma, document: doc, actorId: req.user.id, feature: 'compliance', output, promptDigest: defended.digest, model: MODEL });
    res.status(202).json({ result: report, artifactId: artifact.id, reviewStatus: artifact.status, persisted: false });
  } catch (err: any) {
    console.error('compliance check failed', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
