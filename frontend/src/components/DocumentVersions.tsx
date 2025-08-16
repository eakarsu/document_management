'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Cancel,
  Visibility,
  History,
  Publish,
  Compare,
  Analytics,
  TrendingUp,
  TrendingDown,
  DataUsage
} from '@mui/icons-material';

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
  // Binary diff fields
  diffSize?: number;
  compressionRatio?: number;
  patchAlgorithm?: string;
  bytesChanged?: number;
  percentChanged?: number;
  changeCategory?: 'MINOR' | 'MAJOR' | 'STRUCTURAL';
  similarity?: number;
}

interface DocumentVersionsProps {
  documentId: string;
  document: {
    title: string;
    status: string;
    currentVersion: number;
    createdById: string;
  };
  currentUserId: string;
  onVersionUpdate?: () => void;
}

const DocumentVersions: React.FC<DocumentVersionsProps> = ({
  documentId,
  document: documentData,
  currentUserId,
  onVersionUpdate
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [changeType, setChangeType] = useState<'MAJOR' | 'MINOR' | 'PATCH'>('MINOR');
  const [approvalComments, setApprovalComments] = useState('');
  const [publishNotes, setPublishNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/documents/${documentId}/versions`);

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
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

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const handleUploadVersion = async () => {
    if (!uploadFile) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting file upload...', {
        documentId,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        changeType,
        changeNotes
      });

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('changeNotes', changeNotes);
      formData.append('changeType', changeType);

      const response = await api.post(`/api/documents/${documentId}/versions`, formData);
      
      console.log('Upload response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        
        // Close dialog and reset form
        setUploadDialogOpen(false);
        setUploadFile(null);
        setChangeNotes('');
        setChangeType('MINOR');
        
        // Show success message briefly
        setSuccess('New version uploaded successfully! Binary diff analytics are being calculated...');
        setTimeout(() => setSuccess(null), 5000);
        
        // Refresh data
        await fetchVersions();
        if (onVersionUpdate) onVersionUpdate();
        
        setError(null);
      } else {
        // Handle error response
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `Upload failed (${response.status}): ${response.statusText}`;
        }
        console.error('Upload failed:', response.status, errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      
      // Don't close dialog on error, but stop loading
      // User can see error and try again or cancel
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedVersion) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/documents/${documentId}/versions/${selectedVersion.id}/approve`, {
        action,
        comments: approvalComments
      });

      if (response.ok) {
        setApprovalDialogOpen(false);
        setSelectedVersion(null);
        setApprovalComments('');
        await fetchVersions();
        if (onVersionUpdate) onVersionUpdate();
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval failed:', error);
      setError(error instanceof Error ? error.message : 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      
      // Use the same working API that the publishing page uses
      const publishData = {
        documentId: documentId,
        workflowId: 'cmeeihgpy0008x9uorr9oqsgf', // Standard Publishing Process workflow
        publishingNotes: publishNotes || 'Quick publish from document page',
        urgencyLevel: 'NORMAL',
        isEmergencyPublish: false,
        destinations: [
          {
            destinationType: 'WEB_PORTAL',
            destinationName: 'Internal Portal',
            destinationConfig: {}
          }
        ]
      };
      
      const response = await api.post('/api/publishing/submit', publishData);

      if (response.ok) {
        setPublishDialogOpen(false);
        setPublishNotes('');
        if (onVersionUpdate) onVersionUpdate();
        setError(null);
        // Show success message
        alert('Document submitted for publishing successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Publish failed');
      }
    } catch (error) {
      console.error('Publish failed:', error);
      setError(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'IN_REVIEW': return 'warning';
      case 'APPROVED': return 'success';
      case 'PUBLISHED': return 'primary';
      default: return 'default';
    }
  };

  const canUploadVersion = documentData.status !== 'PUBLISHED';
  const canApprove = documentData.status === 'IN_REVIEW' && (documentData.createdById === currentUserId);
  const canPublish = documentData.status === 'APPROVED' && (documentData.createdById === currentUserId);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <History sx={{ mr: 1 }} />
          Document Versions
          <Chip 
            label={documentData.status} 
            color={getStatusColor(documentData.status)} 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canUploadVersion && (
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
              disabled={loading}
            >
              Upload New Version
            </Button>
          )}
          
          {canPublish && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Publish />}
              onClick={() => setPublishDialogOpen(true)}
              disabled={loading}
            >
              Publish
            </Button>
          )}
        </Box>
      </Box>

      {/* Versions List */}
      <Paper>
        {loading && versions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {versions.map((version, index) => (
              <React.Fragment key={version.id}>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: version.versionNumber === documentData.currentVersion ? 'primary.main' : 'grey.400' }}>
                    v{version.versionNumber}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          Version {version.versionNumber}
                        </Typography>
                        <Chip 
                          label={version.changeType} 
                          size="small" 
                          variant="outlined"
                          color={version.changeType === 'MAJOR' ? 'error' : version.changeType === 'MINOR' ? 'warning' : 'info'}
                        />
                        {version.versionNumber === documentData.currentVersion && (
                          <Chip label="Current" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
                          By {version.createdBy.firstName} {version.createdBy.lastName} • {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                        
                        {version.changeNotes && (
                          <span style={{ 
                            display: 'block', 
                            fontStyle: 'italic', 
                            marginTop: '4px',
                            color: 'rgba(0, 0, 0, 0.6)',
                            fontSize: '0.875rem'
                          }}>
                            "{version.changeNotes}"
                          </span>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={async () => {
                          try {
                            const response = await api.get(version.downloadUrl);
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = version.fileName;
                              document.body.appendChild(link);
                              link.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(link);
                            } else {
                              setError('Failed to download version');
                            }
                          } catch (err) {
                            setError('Download error occurred');
                          }
                        }}
                      >
                        Download
                      </Button>

                      {version.versionNumber > 1 && version.bytesChanged && (
                        <Button
                          size="small"
                          startIcon={<Compare />}
                          onClick={() => {
                            alert(`Version ${version.versionNumber} vs ${version.versionNumber - 1}:\n\n` +
                              `• Change Category: ${version.changeCategory}\n` +
                              `• Bytes Changed: ${(version.bytesChanged! / 1024).toFixed(1)}KB\n` +
                              `• Percent Changed: ${version.percentChanged?.toFixed(1)}%\n` +
                              `• Similarity: ${version.similarity?.toFixed(0)}%\n` +
                              `• Compression Ratio: ${((version.compressionRatio || 0) * 100).toFixed(0)}%\n\n` +
                              `Diff Algorithm: ${version.patchAlgorithm || 'bsdiff'}`);
                          }}
                          color="info"
                        >
                          Compare
                        </Button>
                      )}
                      
                      {canApprove && documentData.status === 'IN_REVIEW' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => {
                              setSelectedVersion(version);
                              setApprovalDialogOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => {
                              setSelectedVersion(version);
                              setApprovalDialogOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            
            {versions.length === 0 && !loading && (
              <ListItem>
                <ListItemText
                  primary="No versions found"
                  secondary="Upload a new version to start collaborative editing"
                />
              </ListItem>
            )}
          </List>
        )}
      </Paper>

      {/* Upload Version Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Version</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html' }}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                  setUploadFile(target.files[0]);
                }
              }}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Change Type</InputLabel>
              <Select
                value={changeType}
                label="Change Type"
                onChange={(e) => setChangeType(e.target.value as 'MAJOR' | 'MINOR' | 'PATCH')}
              >
                <MenuItem value="PATCH">Patch (Bug fixes, typos)</MenuItem>
                <MenuItem value="MINOR">Minor (Small improvements, additions)</MenuItem>
                <MenuItem value="MAJOR">Major (Significant changes, restructuring)</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Change Notes"
              placeholder="Describe what you changed in this version..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadVersion} 
            variant="contained" 
            disabled={!uploadFile || loading}
          >
            Upload Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Version {selectedVersion?.versionNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the changes and approve or reject this version.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (Optional)"
            placeholder="Add comments about this version..."
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleApprovalAction('reject')} 
            color="error"
            disabled={loading}
          >
            Reject
          </Button>
          <Button 
            onClick={() => handleApprovalAction('approve')} 
            variant="contained" 
            color="success"
            disabled={loading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Publishing will make this document officially available with all approved changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Publish Notes (Optional)"
            placeholder="Add notes about this publication..."
            value={publishNotes}
            onChange={(e) => setPublishNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePublish} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Publish Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentVersions;