'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHorizOutlined as ReplaceIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  AddCircleOutline,
  RemoveCircleOutline,
  ChangeCircleOutlined,
  SwapHorizOutlined,
  NoteAdd
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface SupplementToolbarProps {
  documentId: string;
  selectedText: string;
  selectedElement?: HTMLElement;
  position?: { x: number; y: number };
  onClose: () => void;
  onSupplementSaved?: () => void;
}

type SupplementType = 'ADD' | 'REPLACE' | 'DELETE' | 'MODIFY';
type SupplementLevel = 'MAJCOM' | 'BASE' | 'UNIT' | 'INTERIM_CHANGE';

const SupplementToolbar: React.FC<SupplementToolbarProps> = ({
  documentId,
  selectedText,
  selectedElement,
  position,
  onClose,
  onSupplementSaved
}) => {
  const [open, setOpen] = useState(false);
  const [supplementType, setSupplementType] = useState<SupplementType>('ADD');
  const [supplementLevel, setSupplementLevel] = useState<SupplementLevel>('BASE');
  const [rationale, setRationale] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract section number from selected element
  const extractSectionNumber = (): string => {
    if (!selectedElement) return '';

    // Try to find section number from element text or parent elements
    const elementText = selectedElement.textContent || '';
    const sectionMatch = elementText.match(/^(\d+(?:\.\d+)*(?:\.\d+)?)/);

    if (sectionMatch) {
      return sectionMatch[1];
    }

    // Look for section number in parent elements
    let parent = selectedElement.parentElement;
    while (parent && parent !== document.body) {
      const parentText = parent.textContent || '';
      const parentMatch = parentText.match(/^(\d+(?:\.\d+)*(?:\.\d+)?)/);
      if (parentMatch) {
        return parentMatch[1];
      }
      parent = parent.parentElement;
    }

    return '';
  };

  const handleSaveSupplement = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const sectionNumber = extractSectionNumber();

      const supplementData = {
        sectionNumber: sectionNumber || 'N/A',
        originalContent: selectedText,
        newContent: supplementType === 'DELETE' ? '' : (newContent || selectedText),
        supplementType,
        supplementLevel,
        rationale,
        effectiveDate: new Date().toISOString()
      };

      const response = await api.post(`/editor/documents/${documentId}/supplement/section`, supplementData) as any;

      if (response.data) {
        setSuccess(true);

        // Add visual indicator to the supplemented section
        if (selectedElement) {
          selectedElement.classList.add('supplemented-section');
          selectedElement.setAttribute('data-supplement-type', supplementType);
          selectedElement.setAttribute('data-supplement-id', response.data.id);

          // Add visual badge
          const badge = document.createElement('span');
          badge.className = 'supplement-badge';
          badge.textContent = supplementType;
          badge.style.cssText = `
            background-color: ${getSupplementColor(supplementType)};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            margin-left: 8px;
            font-weight: bold;
            vertical-align: super;
          `;

          if (selectedElement.firstChild) {
            selectedElement.insertBefore(badge, selectedElement.firstChild.nextSibling);
          }
        }

        setTimeout(() => {
          setOpen(false);
          onClose();
          if (onSupplementSaved) {
            onSupplementSaved();
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving supplement:', err);
      setError(err.response?.data?.error || 'Failed to save supplement');
    } finally {
      setSaving(false);
    }
  };

  const getSupplementColor = (type: SupplementType): string => {
    switch (type) {
      case 'ADD': return '#4caf50';
      case 'DELETE': return '#f44336';
      case 'REPLACE': return '#ff9800';
      case 'MODIFY': return '#2196f3';
      default: return '#757575';
    }
  };

  const getSupplementIcon = (type: SupplementType) => {
    switch (type) {
      case 'ADD': return <AddCircleOutline />;
      case 'DELETE': return <RemoveCircleOutline />;
      case 'REPLACE': return <SwapHorizOutlined />;
      case 'MODIFY': return <ChangeCircleOutlined />;
      default: return <NoteAdd />;
    }
  };

  return (
    <>
      {/* Floating Toolbar */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: position?.y || 100,
          left: position?.x || 100,
          zIndex: 9999,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" sx={{ ml: 1, mr: 1 }}>
          Mark as Supplement:
        </Typography>

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Add new content">
            <Button
              startIcon={<AddCircleOutline />}
              onClick={() => {
                setSupplementType('ADD');
                setOpen(true);
              }}
              color="success"
            >
              Add
            </Button>
          </Tooltip>

          <Tooltip title="Replace content">
            <Button
              startIcon={<SwapHorizOutlined />}
              onClick={() => {
                setSupplementType('REPLACE');
                setOpen(true);
              }}
              color="warning"
            >
              Replace
            </Button>
          </Tooltip>

          <Tooltip title="Delete content">
            <Button
              startIcon={<RemoveCircleOutline />}
              onClick={() => {
                setSupplementType('DELETE');
                setOpen(true);
              }}
              color="error"
            >
              Delete
            </Button>
          </Tooltip>

          <Tooltip title="Modify content">
            <Button
              startIcon={<ChangeCircleOutlined />}
              onClick={() => {
                setSupplementType('MODIFY');
                setOpen(true);
              }}
              color="info"
            >
              Modify
            </Button>
          </Tooltip>
        </ButtonGroup>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Supplement Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getSupplementIcon(supplementType)}
            <Typography variant="h6">
              Create {supplementType} Supplement
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Selected Text Preview */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected Text:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {selectedText.substring(0, 200)}
                  {selectedText.length > 200 && '...'}
                </Typography>
              </Paper>
            </Box>

            {/* Supplement Type */}
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Supplement Type:
              </Typography>
              <RadioGroup
                row
                value={supplementType}
                onChange={(e) => setSupplementType(e.target.value as SupplementType)}
              >
                <FormControlLabel
                  value="ADD"
                  control={<Radio color="success" />}
                  label={
                    <Chip
                      icon={<AddCircleOutline />}
                      label="Add"
                      color="success"
                      variant={supplementType === 'ADD' ? 'filled' : 'outlined'}
                      size="small"
                    />
                  }
                />
                <FormControlLabel
                  value="REPLACE"
                  control={<Radio color="warning" />}
                  label={
                    <Chip
                      icon={<SwapHorizOutlined />}
                      label="Replace"
                      color="warning"
                      variant={supplementType === 'REPLACE' ? 'filled' : 'outlined'}
                      size="small"
                    />
                  }
                />
                <FormControlLabel
                  value="DELETE"
                  control={<Radio color="error" />}
                  label={
                    <Chip
                      icon={<RemoveCircleOutline />}
                      label="Delete"
                      color="error"
                      variant={supplementType === 'DELETE' ? 'filled' : 'outlined'}
                      size="small"
                    />
                  }
                />
                <FormControlLabel
                  value="MODIFY"
                  control={<Radio color="info" />}
                  label={
                    <Chip
                      icon={<ChangeCircleOutlined />}
                      label="Modify"
                      color="info"
                      variant={supplementType === 'MODIFY' ? 'filled' : 'outlined'}
                      size="small"
                    />
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* Supplement Level */}
            <FormControl fullWidth>
              <InputLabel>Supplement Level</InputLabel>
              <Select
                value={supplementLevel}
                onChange={(e) => setSupplementLevel(e.target.value as SupplementLevel)}
                label="Supplement Level"
              >
                <MenuItem value="MAJCOM">MAJCOM</MenuItem>
                <MenuItem value="BASE">BASE</MenuItem>
                <MenuItem value="UNIT">UNIT</MenuItem>
                <MenuItem value="INTERIM_CHANGE">INTERIM_CHANGE</MenuItem>
              </Select>
            </FormControl>

            {/* New Content (for ADD, REPLACE, MODIFY) */}
            {supplementType !== 'DELETE' && (
              <TextField
                label={supplementType === 'ADD' ? 'New Content to Add' : 'Replacement/Modified Content'}
                multiline
                rows={4}
                fullWidth
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={supplementType === 'ADD'
                  ? 'Enter the new content to add...'
                  : 'Enter the replacement or modified content...'}
              />
            )}

            {/* Rationale */}
            <TextField
              label="Rationale for Supplement"
              multiline
              rows={3}
              fullWidth
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              required
              placeholder="Explain why this supplement is necessary..."
            />

            {/* Error/Success Messages */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success">
                Supplement saved successfully!
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSupplement}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving || !rationale || (supplementType !== 'DELETE' && !newContent)}
          >
            {saving ? 'Saving...' : 'Save Supplement'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SupplementToolbar;