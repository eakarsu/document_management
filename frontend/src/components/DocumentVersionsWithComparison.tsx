'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { authTokenService } from '../lib/authTokenService';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  History,
  ExpandMore,
  Person,
  CalendarToday,
  InsertDriveFile,
  Notes,
  Add,
  Remove,
  SwapHoriz,
  Refresh
} from '@mui/icons-material';

interface Change {
  type: 'addition' | 'deletion' | 'modification';
  lineNumber?: number;
  content?: string;
  oldContent?: string;
  newContent?: string;
}

interface DocumentVersion {
  id: string;
  versionNumber: number;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  changeType: 'MAJOR' | 'MINOR' | 'PATCH';
  changeNotes?: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  downloadUrl: string;
  content?: string;
  customFields?: any;
  changes?: {
    additions: number;
    deletions: number;
    modifications: number;
    summary: string;
    details?: Change[];
  };
}

interface DocumentVersionsWithComparisonProps {
  documentId: string;
  document?: {
    title: string;
    status: string;
    currentVersion: number;
    createdById: string;
  };
  currentUserId: string;
  onVersionUpdate?: () => void;
}

const DocumentVersionsWithComparison: React.FC<DocumentVersionsWithComparisonProps> = ({
  documentId,
  document: documentData,
  currentUserId,
  onVersionUpdate
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // Fetch all versions and calculate ALL changes
  const fetchVersionsWithAllChanges = async () => {
    try {
      setLoading(true);
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/versions`
      );

      if (response.ok) {
        const data = await response.json();
        const allVersions = data.versions || [];

        // Fetch detailed changes for each version compared to previous
        const versionsWithChanges = await Promise.all(
          allVersions.map(async (version: DocumentVersion, index: number) => {
            // Skip the first version as it has no previous version to compare
            if (index === allVersions.length - 1) {
              return version;
            }

            const prevVersion = allVersions[index + 1];

            try {
              // Get the actual content of both versions
              const currentContent = extractContent(version);
              const previousContent = extractContent(prevVersion);

              // Calculate all changes
              const changes = calculateDetailedChanges(previousContent, currentContent);

              return {
                ...version,
                changes
              };
            } catch (err) {
              console.error('Error calculating changes for version:', version.versionNumber, err);
              return version;
            }
          })
        );

        setVersions(versionsWithChanges);
      } else {
        throw new Error('Failed to fetch versions');
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      setError('Failed to load document versions');
    } finally {
      setLoading(false);
    }
  };

  // Extract content from version
  const extractContent = (version: DocumentVersion): string => {
    if (version.content) return version.content;
    if (version.customFields?.content) return version.customFields.content;
    if (version.customFields?.htmlContent) {
      return version.customFields.htmlContent.replace(/<[^>]*>/g, '');
    }
    if (version.customFields?.editableContent) {
      return version.customFields.editableContent.replace(/<[^>]*>/g, '');
    }
    return version.description || '';
  };

  // Calculate detailed changes between two contents
  const calculateDetailedChanges = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    const details: Change[] = [];

    // Create a map to track changes
    const changeMap = new Map<number, Change>();

    // Simple line-by-line comparison
    const maxLength = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (i >= oldLines.length && newLine) {
        // Line was added
        additions++;
        details.push({
          type: 'addition',
          lineNumber: i + 1,
          content: newLine
        });
      } else if (i >= newLines.length && oldLine) {
        // Line was deleted
        deletions++;
        details.push({
          type: 'deletion',
          lineNumber: i + 1,
          content: oldLine
        });
      } else if (oldLine !== newLine && oldLine && newLine) {
        // Line was modified
        modifications++;
        details.push({
          type: 'modification',
          lineNumber: i + 1,
          oldContent: oldLine,
          newContent: newLine
        });
      }
    }

    const totalChanges = additions + deletions + modifications;
    const summary = `${totalChanges} total changes: ${additions} additions, ${deletions} deletions, ${modifications} modifications`;

    return {
      additions,
      deletions,
      modifications,
      summary,
      details
    };
  };

  useEffect(() => {
    fetchVersionsWithAllChanges();
  }, [documentId]);

  const handleRefresh = () => {
    fetchVersionsWithAllChanges();
  };

  // Get change type color
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'MAJOR': return 'error';
      case 'MINOR': return 'warning';
      case 'PATCH': return 'info';
      default: return 'default';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!documentData) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading document information...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <History sx={{ mr: 1 }} />
          📃 Complete Version History with All Changes
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading version history and calculating all changes...
          </Typography>
        </Box>
      )}

      {/* Version List */}
      {!loading && versions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No version history available
          </Typography>
        </Paper>
      ) : (
        <List>
          {versions.map((version, index) => (
            <Accordion
              key={version.id}
              expanded={expandedVersion === version.id}
              onChange={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  bgcolor: index === 0 ? 'action.hover' : 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box sx={{ width: '100%', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Version {version.versionNumber}
                      </Typography>
                      <Chip
                        label={version.changeType}
                        size="small"
                        color={getChangeTypeColor(version.changeType) as any}
                      />
                      {index === 0 && (
                        <Chip label="Current" size="small" color="success" />
                      )}
                    </Box>

                    {version.changes && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Additions">
                          <Chip
                            icon={<Add />}
                            label={version.changes.additions}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Deletions">
                          <Chip
                            icon={<Remove />}
                            label={version.changes.deletions}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Modifications">
                          <Chip
                            icon={<SwapHoriz />}
                            label={version.changes.modifications}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {version.createdBy.firstName} {version.createdBy.lastName}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(version.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <InsertDriveFile fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(version.fileSize)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {version.changeNotes && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <Notes fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {version.changeNotes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {/* Show ALL changes with strikethrough for deleted text */}
                {version.changes && version.changes.details && version.changes.details.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      All Changes from Previous Version ({version.changes.details.length} changes):
                    </Typography>

                    <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                      {version.changes.details.map((change, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            mb: 2,
                            p: 1,
                            borderLeft: 4,
                            borderColor:
                              change.type === 'deletion' ? 'error.main' :
                              change.type === 'addition' ? 'success.main' :
                              'warning.main',
                            bgcolor: 'background.paper'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Line {change.lineNumber}:
                          </Typography>

                          {change.type === 'deletion' && (
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: 'line-through',
                                color: 'error.main',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {change.content}
                            </Typography>
                          )}

                          {change.type === 'addition' && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'success.main',
                                backgroundColor: 'success.light',
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                p: 0.5
                              }}
                            >
                              {change.content}
                            </Typography>
                          )}

                          {change.type === 'modification' && (
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: 'error.main',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  mb: 0.5
                                }}
                              >
                                {change.oldContent}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'success.main',
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  p: 0.5
                                }}
                              >
                                {change.newContent}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {(!version.changes || !version.changes.details || version.changes.details.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    {index === versions.length - 1 ? 'Initial version - no previous version to compare' : 'No changes detected from previous version'}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      )}
    </Box>
  );
};

export default DocumentVersionsWithComparison;