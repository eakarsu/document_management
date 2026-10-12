'use client';

/**
 * AI Version Change Summary UI — for a given document, generate a narrative
 * "what changed across all versions" summary. Differs from Redline (which is
 * pairwise) by giving a single rolled-up evolution story.
 *
 * Wired to: /api/version-summary (apply pass 4 mechanical backlog).
 */

import React, { useState } from 'react';
import {
  Container, Typography, Card, CardContent, TextField, Button,
  Alert, LinearProgress, Box,
} from '@mui/material';
import { History, Visibility, PlayArrow } from '@mui/icons-material';
import { api } from '@/lib/api';
import AIResponseReport from '@/components/AIResponseReport';

interface Theme { label: string; description: string; firstSeenVersion: number }

interface VersionSummary {
  documentId: string;
  versionsConsidered?: number[];
  narrative: string;
  themes: Theme[];
  riskFlags: string[];
  model?: string;
  generatedAt?: string;
}

export default function VersionSummaryPage() {
  const [docId, setDocId] = useState('');
  const [summary, setSummary] = useState<VersionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function loadCached() {
    if (!docId) return;
    setErr(''); setBusy(true);
    try {
      const r = await api.get(`/api/version-summary/${docId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || 'Lookup failed');
      if (j.narrative !== undefined) setSummary(j as VersionSummary);
      else setSummary(null);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runSummary() {
    if (!docId) return;
    setErr(''); setSummary(null); setBusy(true);
    try {
      const r = await api.post(`/api/version-summary/${docId}`);
      const j = await r.json();
      if (r.status === 503) throw new Error(j.message || 'AI not configured (set OPENROUTER_API_KEY).');
      if (!r.ok) throw new Error(j.message || j.error || 'Summary failed');
      setSummary(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <History /> AI Version Change Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate a stakeholder-facing narrative of how a document has evolved across all of its
        versions. Ideal for reviewers catching up on a long-running document.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {busy && <LinearProgress sx={{ mb: 2 }} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Summarize Versions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter an existing document ID with version history. No sample can supply a real record.</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              label="Document ID"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              sx={{ flex: 1, minWidth: 240 }}
            />
            <Button variant="outlined" startIcon={<Visibility />} onClick={loadCached} disabled={!docId || busy}>
              Load Cached
            </Button>
            <Button variant="contained" startIcon={<PlayArrow />} onClick={runSummary} disabled={!docId || busy}>
              Generate Summary
            </Button>
          </Box>
        </CardContent>
      </Card>

      {summary && <AIResponseReport value={summary} title="Version change summary" />}
    </Container>
  );
}
