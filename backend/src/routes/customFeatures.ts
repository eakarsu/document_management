// Custom feature endpoints (batch_09 audit suggestions)
import { Router, Response } from 'express';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authenticateToken';
import { parseAIJson } from '../utils/parseAIJson';

const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callLLM(system: string, user: string, maxTokens = 2000, temperature = 0.3) {
  if (!OPENROUTER_API_KEY) {
    const e: any = new Error('OPENROUTER_API_KEY not configured'); e.statusCode = 503; throw e;
  }
  const r = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_tokens: maxTokens,
    temperature,
  }, { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  return { content: r.data?.choices?.[0]?.message?.content || '', model: r.data?.model };
}

function err(res: Response, e: any, label: string) {
  if (e.statusCode === 503) return res.status(503).json({ error: e.message });
  console.error(`${label} error:`, e?.message || e);
  res.status(500).json({ error: e?.message || 'internal error' });
}

// 1. Automated tagging beyond classification
router.post('/auto-tagging/:documentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId } = req.params;
    const { excerpt } = req.body || {};
    if (!excerpt) return res.status(400).json({ error: 'excerpt required' });
    const ai = await callLLM(
      'You produce rich semantic tags (entities, topics, jurisdictions, sentiment) for a document. JSON only.',
      `DOCUMENT_ID: ${documentId}\nEXCERPT: ${String(excerpt).slice(0, 4000)}\nReturn JSON {"entities":[""],"topics":[""],"jurisdictions":[""],"sentiment":"neutral|positive|negative","language":"","confidence":0}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'auto-tagging', documentId, result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'auto-tagging'); }
});

// 2. Compliance risk detection in contracts
router.post('/compliance-risk/:documentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId } = req.params;
    const { excerpt, framework = 'general' } = req.body || {};
    if (!excerpt) return res.status(400).json({ error: 'excerpt required' });
    const ai = await callLLM(
      `You flag compliance risks in contract text. Framework: ${framework}. JSON only.`,
      `DOCUMENT_ID: ${documentId}\nEXCERPT: ${String(excerpt).slice(0, 4000)}\nReturn JSON {"risk_findings":[{"clause":"","risk":"","severity":"low|med|high","reference":""}],"overall_risk":"low|med|high","recommended_redlines":[""]}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'compliance-risk', documentId, result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'compliance-risk'); }
});

// 3. Version change summarization in plain English
router.post('/version-plain-english/:documentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId } = req.params;
    const { from_version, to_version, diff_text } = req.body || {};
    if (!diff_text) return res.status(400).json({ error: 'diff_text required' });
    const ai = await callLLM(
      'You translate a version diff into a friendly plain-English changelog. JSON only.',
      `DOC: ${documentId}\nFROM: ${from_version || 'prev'} TO: ${to_version || 'curr'}\nDIFF: ${String(diff_text).slice(0, 5000)}\nReturn JSON {"summary":"","material_changes":[""],"non_material_changes":[""],"reviewer_questions":[""]}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'version-plain-english', documentId, result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'version-plain-english'); }
});

// 4. Redaction policy editor with rule preview
router.post('/redaction-policy/preview', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { policy_rules, sample_text } = req.body || {};
    if (!Array.isArray(policy_rules) || !sample_text) return res.status(400).json({ error: 'policy_rules and sample_text required' });
    const ai = await callLLM(
      'You apply a redaction policy to sample text and show what would be removed. JSON only.',
      `POLICY: ${JSON.stringify(policy_rules)}\nSAMPLE: ${String(sample_text).slice(0, 4000)}\nReturn JSON {"redacted_preview":"","applied_rules":[{"rule":"","matches":0}],"warnings":[""]}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'redaction-policy', result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'redaction-policy'); }
});

// 5. Workflow bottleneck prediction
router.post('/workflow-bottlenecks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { workflow_runs } = req.body || {};
    if (!Array.isArray(workflow_runs)) return res.status(400).json({ error: 'workflow_runs array required' });
    const ai = await callLLM(
      'You identify bottleneck steps in document workflow runs. JSON only.',
      `RUNS: ${JSON.stringify(workflow_runs.slice(0, 40))}\nReturn JSON {"bottleneck_steps":[{"step":"","avg_wait_hours":0,"frequency":0}],"throughput_trend":"up|flat|down","recommendations":[""]}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'workflow-bottlenecks', result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'workflow-bottlenecks'); }
});

// 6. Bulk OCR ingestion from scanned documents
// TODO: configure credentials for OCR_API_KEY (Textract / Vision).
router.post('/bulk-ocr', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { batch } = req.body || {};
    if (!Array.isArray(batch)) return res.status(400).json({ error: 'batch array required' });
    const ai = await callLLM(
      `You build an OCR ingestion plan. OCR API set: ${Boolean(process.env.OCR_API_KEY)}. JSON only.`,
      `BATCH: ${JSON.stringify(batch.slice(0, 30))}\nReturn JSON {"plan":[{"document_id":"","engine":"","pages":0,"estimated_seconds":0}],"total_seconds":0,"failures_likely":[""]}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'bulk-ocr', result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'bulk-ocr'); }
});

// 7. Predictive retention deletion flagging
router.post('/retention-flag', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { documents } = req.body || {};
    if (!Array.isArray(documents)) return res.status(400).json({ error: 'documents array required' });
    const ai = await callLLM(
      'You predict which documents will reach retention end date and flag for review. JSON only.',
      `DOCS: ${JSON.stringify(documents.slice(0, 40))}\nReturn JSON {"flagged":[{"id":"","action":"delete|review|extend","reason":"","by_date":""}],"upcoming_30d_count":0}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'retention-flag', result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'retention-flag'); }
});

// 8. E-sign provider integration
// TODO: configure credentials for ESIGN_API_KEY (DocuSign / HelloSign).
router.post('/esign/send', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, signers, subject } = req.body || {};
    if (!documentId || !Array.isArray(signers)) return res.status(400).json({ error: 'documentId and signers array required' });
    const ai = await callLLM(
      `You compose an e-sign envelope plan. E-sign API set: ${Boolean(process.env.ESIGN_API_KEY)}. JSON only.`,
      `DOC: ${documentId}\nSIGNERS: ${JSON.stringify(signers)}\nSUBJECT: ${subject || 'Please sign'}\nReturn JSON {"envelope":{"subject":"","reminder_after_days":0,"expires_in_days":0,"order":[""]},"projected_completion_days":0}`
    );
    const parsed = parseAIJson(ai.content).data || { raw: ai.content };
    res.json({ type: 'esign/send', envelope_provider_configured: Boolean(process.env.ESIGN_API_KEY), result: parsed, model: ai.model });
  } catch (e: any) { err(res, e, 'esign/send'); }
});

export default router;
