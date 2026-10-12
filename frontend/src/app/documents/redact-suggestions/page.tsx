'use client';

/**
 * AI Redaction Suggestions UI — pick a document, run an AI scan for sensitive
 * content, review proposed redactions before a human applies them. Also
 * supports an ad-hoc preview that scans pasted text without persisting.
 *
 * Wired to: /api/redact-suggestions (apply pass 4 mechanical backlog).
 */

import React, { useState } from 'react';
import {
  Container, Typography, Card, CardContent, TextField, Button,
  Stack, Chip, Alert, LinearProgress, Box,
} from '@mui/material';
import { Block, Visibility, PlayArrow } from '@mui/icons-material';
import { api } from '@/lib/api';
import AIResponseReport from '@/components/AIResponseReport';

const previewExamples = [
  { label: 'Personnel memo', title: 'Illustrative personnel memo', content: 'The personnel office is preparing a public release copy of a staffing memo. The draft includes a personal phone number, an employee home address, and a staffing decision that still needs approval.' },
  { label: 'Incident report', title: 'Illustrative incident report', content: 'A facilities incident report includes a witness contact number, a badge identifier, and a location description. Review each excerpt before deciding what the public version should include.' },
  { label: 'Vendor agreement', title: 'Illustrative vendor agreement', content: 'A sample vendor agreement contains a named contact, direct email address, and pricing schedule. The records team needs a proposed redaction review before external release.' },
];

interface Suggestion {
  category: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  excerpt: string;
  reason: string;
  replacement?: string;
}

interface Report {
  documentId?: string;
  suggestions: Suggestion[];
  totalFound: number;
  model?: string;
  generatedAt?: string;
}

const sevColor = (s: string): 'error' | 'warning' | 'default' =>
  s === 'CRITICAL' ? 'error' : s === 'MAJOR' ? 'warning' : 'default';

export default function RedactSuggestionsPage() {
  const [docId, setDocId] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function loadCached() {
    if (!docId) return;
    setErr(''); setBusy(true);
    try {
      const r = await api.get(`/api/redact-suggestions/${docId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || 'Lookup failed');
      if (Array.isArray(j.suggestions)) setReport(j as Report);
      else setReport(null);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runScan() {
    if (!docId) return;
    setErr(''); setReport(null); setBusy(true);
    try {
      const r = await api.post(`/api/redact-suggestions/${docId}`);
      const j = await r.json();
      if (r.status === 503) throw new Error(j.message || 'AI not configured (set OPENROUTER_API_KEY).');
      if (!r.ok) throw new Error(j.message || j.error || 'Scan failed');
      setReport(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runPreview() {
    setErr(''); setReport(null); setBusy(true);
    try {
      const r = await api.post('/api/redact-suggestions/preview', {
        title: previewTitle, content: previewContent,
      });
      const j = await r.json();
      if (r.status === 503) throw new Error(j.message || 'AI not configured (set OPENROUTER_API_KEY).');
      if (!r.ok) throw new Error(j.message || j.error || 'Preview failed');
      setReport(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Block /> AI Redaction Suggestions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Identify portions of a document that should be redacted before public release. Output is a
        draft for human review; nothing is mutated on the source document.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {busy && <LinearProgress sx={{ mb: 2 }} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Scan by Document ID</Typography>
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
            <Button variant="contained" color="warning" startIcon={<PlayArrow />} onClick={runScan} disabled={!docId || busy}>
              Run Scan
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Ad-hoc Preview (no persistence)</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">{previewExamples.map(example => <Button key={example.label} type="button" variant="outlined" disabled={busy} onClick={() => { setPreviewTitle(example.title); setPreviewContent(example.content); setReport(null); setErr(''); }}>{example.label}</Button>)}</Stack>
            <TextField
              label="Title"
              value={previewTitle}
              onChange={(e) => setPreviewTitle(e.target.value)}
            />
            <TextField
              label="Content"
              multiline
              minRows={4}
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              placeholder="Paste at least 20 characters of text"
            />
            <Box>
              <Button
                variant="contained"
                color="warning"
                startIcon={<PlayArrow />}
                onClick={runPreview}
                disabled={busy || previewContent.length < 20}
              >
                Preview Scan
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {report && <AIResponseReport value={report} title="Redaction suggestions" />}

    </Container>
  );
}
