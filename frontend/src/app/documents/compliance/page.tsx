'use client';

/**
 * Compliance Checker UI — manage org-level rules and run AI checks against
 * a chosen document. Pairs with /api/compliance backend route.
 *
 * Wired to: NEW custom feature #2 from the audit.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Alert,
  Pagination,
  IconButton,
} from '@mui/material';
import { Delete, PlayArrow } from '@mui/icons-material';
import { api } from '@/lib/api';

interface Rule {
  id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
}

interface Finding {
  ruleId: string;
  ruleName: string;
  severity: string;
  passed: boolean;
  excerpt?: string;
  suggestion?: string;
}

interface Report {
  documentId: string;
  score: number;
  totalRules: number;
  passedRules: number;
  findings: Finding[];
  model?: string;
  generatedAt?: string;
}

const PAGE_SIZE = 20;

export default function ComplianceCheckerPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ name: '', description: '', severity: 'MINOR' as Rule['severity'] });
  const [docId, setDocId] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page]);

  async function loadRules() {
    try {
      const r = await api.get(`/api/compliance/rules?limit=${PAGE_SIZE}&offset=${offset}`);
      const j = await r.json();
      setRules(j.items || []);
      setTotal(j.total || 0);
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => { loadRules(); /* eslint-disable-next-line */ }, [page]);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.post('/api/compliance/rules', draft);
      if (!r.ok) throw new Error((await r.json()).error || 'Failed to add rule');
      setDraft({ name: '', description: '', severity: 'MINOR' });
      loadRules();
    } catch (e: any) { setErr(e.message); }
  }

  async function delRule(id: string) {
    setErr('');
    try {
      await api.delete(`/api/compliance/rules/${id}`);
      loadRules();
    } catch (e: any) { setErr(e.message); }
  }

  async function runCheck() {
    if (!docId) return;
    setBusy(true); setErr('');
    try {
      const r = await api.post(`/api/compliance/check/${docId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || 'Check failed');
      setReport(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>AI Compliance Checker</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Score documents against your org rule book. Findings are persisted to
        Document.aiResults JSONB so they survive page reloads.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Add Rule</Typography>
          <Box component="form" onSubmit={addRule} sx={{ display: 'grid', gridTemplateColumns: '2fr 4fr 1fr 1fr', gap: 2 }}>
            <TextField label="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label="Description" required value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <TextField select label="Severity" value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as any })}>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="MAJOR">Major</MenuItem>
              <MenuItem value="MINOR">Minor</MenuItem>
            </TextField>
            <Button type="submit" variant="contained">Add</Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Rules ({total})</Typography>
          <Stack spacing={1}>
            {rules.map((r) => (
              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                <Chip
                  label={r.severity}
                  color={r.severity === 'CRITICAL' ? 'error' : r.severity === 'MAJOR' ? 'warning' : 'default'}
                  size="small"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{r.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.description}</Typography>
                </Box>
                <IconButton aria-label="delete" onClick={() => delRule(r.id)}><Delete /></IconButton>
              </Box>
            ))}
            {!rules.length && <Typography color="text.secondary">No rules yet.</Typography>}
          </Stack>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              page={page}
              onChange={(_, p) => setPage(p)}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Check Document</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth label="Document ID" value={docId} onChange={(e) => setDocId(e.target.value)} />
            <Button variant="contained" startIcon={<PlayArrow />} disabled={!docId || busy} onClick={runCheck}>
              Run Check
            </Button>
          </Box>
          {busy && <LinearProgress sx={{ mb: 2 }} />}
          {report && (
            <Box>
              <Typography variant="subtitle1">
                Score: {report.score} ({report.passedRules}/{report.totalRules} rules passed)
              </Typography>
              {report.model && <Typography variant="caption" color="text.secondary">Model: {report.model}</Typography>}
              <Stack spacing={1} sx={{ mt: 2 }}>
                {report.findings.map((f, idx) => (
                  <Box key={idx} sx={{ p: 1.5, borderLeft: '4px solid', borderColor: f.passed ? 'success.main' : 'error.main', bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2">
                      {f.passed ? '✓' : '✗'} {f.ruleName} [{f.severity}]
                    </Typography>
                    {f.excerpt && <Typography variant="body2"><em>Excerpt:</em> {f.excerpt}</Typography>}
                    {f.suggestion && <Typography variant="body2"><em>Suggestion:</em> {f.suggestion}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
