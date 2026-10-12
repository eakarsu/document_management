'use client';

/**
 * Redline Diff Viewer — pick a document + two version numbers, view the
 * line-level diff and ask the AI for a categorized summary of changes.
 *
 * Wired to: NEW custom feature #1 (AI redline diff viewer).
 */

import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Card, CardContent,
  Stack, Alert, LinearProgress, Chip, Box,
} from '@mui/material';
import { Compare, Psychology } from '@mui/icons-material';
import { api } from '@/lib/api';
import AIResponseReport from '@/components/AIResponseReport';

interface DiffLine { type: 'add' | 'remove' | 'context'; line: string }
interface Diff { stats: { added: number; removed: number }; diff: DiffLine[] }
interface Summary {
  summary: string;
  categories: Array<{ label: string; changes: string[] }>;
  riskFlags: string[];
  model?: string;
}

export default function RedlineDiffPage() {
  const [docId, setDocId] = useState('');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('2');
  const [diff, setDiff] = useState<Diff | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function loadDiff() {
    setErr(''); setSummary(null);
    if (!docId) return;
    try {
      const r = await api.get(`/api/redline/${docId}/${from}/${to}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load diff');
      setDiff(j);
    } catch (e: any) { setErr(e.message); }
  }

  async function aiSummary() {
    setBusy(true); setErr('');
    try {
      const r = await api.post(`/api/redline/${docId}/${from}/${to}/summary`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || j.message || 'Failed to summarize');
      setSummary(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>AI Redline Diff Viewer</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Compare two versions of a document and have the AI summarize the
        intent of the changes. Risk flags fire on deletions of compliance/safety language.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose an existing document and two real version numbers; examples cannot supply record references.</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField label="Document ID" value={docId} onChange={(e) => setDocId(e.target.value)} />
            <TextField label="From v#" type="number" value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField label="To v#" type="number" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button variant="outlined" startIcon={<Compare />} onClick={loadDiff} disabled={!docId}>Diff</Button>
            <Button variant="contained" startIcon={<Psychology />} onClick={aiSummary} disabled={!docId || busy}>AI Summary</Button>
          </Box>
        </CardContent>
      </Card>

      {busy && <LinearProgress sx={{ mb: 2 }} />}

      {diff && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {diff.stats.added} added, {diff.stats.removed} removed
            </Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: 12, maxHeight: 400, overflow: 'auto', bgcolor: '#f6f8fa', p: 2, borderRadius: 1 }}>
              {diff.diff.slice(0, 800).map((d, i) => (
                <Box key={i} sx={{
                  bgcolor: d.type === 'add' ? '#e6ffec' : d.type === 'remove' ? '#ffebe9' : 'transparent',
                  color: d.type === 'add' ? '#1a7f37' : d.type === 'remove' ? '#cf222e' : 'inherit',
                  whiteSpace: 'pre-wrap',
                }}>
                  {d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  '}{d.line}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {summary && <AIResponseReport value={summary} title="Redline summary" />}
    </Container>
  );
}
