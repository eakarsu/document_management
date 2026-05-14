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
  Stack, Chip, Alert, LinearProgress, Box, Divider,
} from '@mui/material';
import { Category, Visibility, PlayArrow } from '@mui/icons-material';
import { api } from '@/lib/api';

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

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Result</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip label={result.primaryType} color="primary" />
                {result.subType && <Chip label={result.subType} variant="outlined" />}
                <Typography variant="caption" color="text.secondary">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </Typography>
              </Box>
              {result.topics?.length ? (
                <Box>
                  <Typography variant="subtitle2">Topics</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {result.topics.map((t, i) => <Chip key={i} label={t} size="small" />)}
                  </Stack>
                </Box>
              ) : null}
              {result.tags?.length ? (
                <Box>
                  <Typography variant="subtitle2">Tags</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {result.tags.map((t, i) => <Chip key={i} label={t} size="small" variant="outlined" />)}
                  </Stack>
                </Box>
              ) : null}
              {result.rationale && (
                <>
                  <Divider />
                  <Typography variant="body2"><em>Rationale:</em> {result.rationale}</Typography>
                </>
              )}
              {result.model && (
                <Typography variant="caption" color="text.secondary">
                  Model: {result.model}{result.generatedAt ? ` · ${result.generatedAt}` : ''}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
