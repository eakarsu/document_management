'use client';

/**
 * AI Document Classification UI — pick a document, run a classification,
 * inspect primaryType / topics / tags. Also supports an ad-hoc preview that
 * classifies pasted text without persisting.
 *
 * Wired to: /api/classification (apply pass 4 mechanical backlog).
 */

import React, { useState } from 'react';
import {
  Container, Typography, Card, CardContent, TextField, Button,
  Stack, Alert, LinearProgress, Box,
} from '@mui/material';
import { Category, Visibility, PlayArrow } from '@mui/icons-material';
import { api } from '@/lib/api';
import AIResponseReport from '@/components/AIResponseReport';

const previewExamples = [
  { label: 'Policy memo', title: 'Quarterly records retention policy', content: 'This policy memo sets retention responsibilities for the records office. Owners review schedules quarterly, document exceptions, and send unresolved questions to the compliance lead before archiving.' },
  { label: 'Meeting minutes', title: 'Operations review meeting minutes', content: 'The operations team reviewed open requests on Tuesday. Three items need owner approval, two have missing attachments, and the coordinator will circulate an updated action list by Friday.' },
  { label: 'Technical report', title: 'Network equipment inspection report', content: 'The inspection found two switches with outdated firmware and one failed backup test. The engineering lead will verify the remediation plan and schedule a follow-up inspection.' },
];

interface Classification {
  primaryType: string;
  subType?: string;
  topics: string[];
  tags: string[];
  confidence: number;
  rationale?: string;
  model?: string;
  generatedAt?: string;
}

export default function ClassificationPage() {
  const [docId, setDocId] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [result, setResult] = useState<Classification | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function loadCached() {
    if (!docId) return;
    setErr(''); setBusy(true);
    try {
      const r = await api.get(`/api/classification/${docId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || 'Lookup failed');
      if (j.primaryType) setResult(j as Classification);
      else setResult(null);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runClassify() {
    if (!docId) return;
    setErr(''); setResult(null); setBusy(true);
    try {
      const r = await api.post(`/api/classification/${docId}`);
      const j = await r.json();
      if (r.status === 503) throw new Error(j.message || 'AI not configured (set OPENROUTER_API_KEY).');
      if (!r.ok) throw new Error(j.message || j.error || 'Classification failed');
      setResult(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runPreview() {
    setErr(''); setResult(null); setBusy(true);
    try {
      const r = await api.post('/api/classification/preview', {
        title: previewTitle, content: previewContent,
      });
      const j = await r.json();
      if (r.status === 503) throw new Error(j.message || 'AI not configured (set OPENROUTER_API_KEY).');
      if (!r.ok) throw new Error(j.message || j.error || 'Preview failed');
      setResult(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Category /> AI Document Classification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Classify a document by type, topic, and tags. Results are persisted into Document.aiResults
        so subsequent loads return the cached result.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {busy && <LinearProgress sx={{ mb: 2 }} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Classify by Document ID</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter an existing document ID. Examples cannot select a document for you.</Typography>
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
            <Button variant="contained" startIcon={<PlayArrow />} onClick={runClassify} disabled={!docId || busy}>
              Run Classification
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Ad-hoc Preview (no persistence)</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">{previewExamples.map((example) => <Button key={example.label} type="button" variant="outlined" disabled={busy} onClick={() => { setPreviewTitle(example.title); setPreviewContent(example.content); setResult(null); setErr(''); }}>{example.label}</Button>)}</Stack>
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
                startIcon={<PlayArrow />}
                onClick={runPreview}
                disabled={busy || previewContent.length < 20}
              >
                Preview Classification
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {result && <AIResponseReport value={result} title="Document classification" />}
    </Container>
  );
}
