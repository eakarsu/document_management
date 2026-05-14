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

      {report && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Suggestions ({report.totalFound ?? report.suggestions?.length ?? 0})
            </Typography>
            {!report.suggestions?.length ? (
              <Typography color="text.secondary">No redactions suggested.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {report.suggestions.map((s, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      borderLeft: '4px solid',
                      borderColor: s.severity === 'CRITICAL' ? 'error.main'
                        : s.severity === 'MAJOR' ? 'warning.main' : 'grey.400',
                      bgcolor: '#fafafa',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip label={s.severity} size="small" color={sevColor(s.severity)} />
                      <Chip label={s.category} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2"><em>Excerpt:</em> {s.excerpt}</Typography>
                    <Typography variant="body2"><em>Reason:</em> {s.reason}</Typography>
                    {s.replacement && (
                      <Typography variant="body2"><em>Suggested replacement:</em> {s.replacement}</Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
            {report.model && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Model: {report.model}{report.generatedAt ? ` · ${report.generatedAt}` : ''}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
