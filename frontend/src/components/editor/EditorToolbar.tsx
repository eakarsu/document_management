'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Paper,
  Button,
  ButtonGroup,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Typography,
  Badge,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Undo,
  Redo,
  Preview as PreviewIcon,
  TrackChanges,
  Check,
  Comment as CommentIcon,
  FindReplace,
  Print,
  Download
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Change } from '@/lib/tiptap-change-tracking';
import { Comment } from '@/lib/tiptap-comments';
import { ViewMode } from '@/types/editor';
import { TableGridPicker } from './TableGridPicker';
import { TableControls } from './TableControls';

interface EditorToolbarProps {
  editor: Editor | null;
  saving: boolean;
  hasUnsavedChanges: boolean;
  trackChanges: boolean;
  changes: Change[];
  comments: Comment[];
  hasSupplements: boolean;
  viewMode: ViewMode;
  currentPage: number;
  totalPages: number;
  wordCount: number;
  charCount: number;
  fontSize: string;
  fontFamily: string;
  documentId: string;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTrackChangesToggle: (checked: boolean) => void;
  onChangesDrawerOpen: () => void;
  onCommentsOpen: () => void;
  onAdvancedSearchOpen: () => void;
  onExportDialogOpen: (format: 'pdf' | 'docx' | 'html' | 'txt') => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (family: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  saving,
  hasUnsavedChanges,
  trackChanges,
  changes,
  comments,
  hasSupplements,
  viewMode,
  currentPage,
  totalPages,
  wordCount,
  charCount,
  fontSize,
  fontFamily,
  documentId,
  onSave,
  onUndo,
  onRedo,
  onTrackChangesToggle,
  onChangesDrawerOpen,
  onCommentsOpen,
  onAdvancedSearchOpen,
  onExportDialogOpen,
  onViewModeChange,
  onFontSizeChange,
  onFontFamilyChange
}) => {
  const router = useRouter();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Paper sx={{ p: 1.5, mb: 2, boxShadow: 2 }}>
      {/* Row 1: Primary Actions & Document Tools */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5, pb: 1.5, borderBottom: '1px solid #e0e0e0' }}>

        {/* Group 1: File Operations */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges}
            sx={{ minWidth: 80, fontWeight: 600 }}
          >
            {saving ? 'Saving' : 'Save'}
          </Button>
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              onClick={onUndo}
              disabled={!editor?.can().undo()}
              title="Undo (Ctrl+Z)"
              size="small"
            >
              <Undo fontSize="small" />
            </IconButton>
            <IconButton
              onClick={onRedo}
              disabled={!editor?.can().redo()}
              title="Redo (Ctrl+Y)"
              size="small"
            >
              <Redo fontSize="small" />
            </IconButton>
          </ButtonGroup>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 2: Document Tools */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={onAdvancedSearchOpen}
            title="Find & Replace (Ctrl+F)"
            startIcon={<FindReplace fontSize="small" />}
          >
            Find
          </Button>
          <Button
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            title="Export Document"
            startIcon={<Download fontSize="small" />}
          >
            Export
          </Button>
          <Button
            onClick={() => window.print()}
            title="Print (Ctrl+P)"
          >
            <Print fontSize="small" />
          </Button>
        </ButtonGroup>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={() => { onExportDialogOpen('pdf'); setExportMenuAnchor(null); }}>
            Export as PDF
          </MenuItem>
          <MenuItem onClick={() => { onExportDialogOpen('docx'); setExportMenuAnchor(null); }}>
            Export as Word (.docx)
          </MenuItem>
          <MenuItem onClick={() => { onExportDialogOpen('html'); setExportMenuAnchor(null); }}>
            Export as HTML
          </MenuItem>
          <MenuItem onClick={() => { onExportDialogOpen('txt'); setExportMenuAnchor(null); }}>
            Export as Text
          </MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 3: Insert Table */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <TableGridPicker editor={editor} />
          <TableControls editor={editor} />
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 4: Review & Collaboration */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={trackChanges}
                onChange={(e) => onTrackChangesToggle(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Track Changes</Typography>}
            sx={{ mr: 0.5 }}
          />
          <IconButton
            size="small"
            onClick={onChangesDrawerOpen}
            title="View Changes"
            sx={{
              border: changes.length > 0 ? '2px solid #1976d2' : '1px solid #ddd',
              borderRadius: 1
            }}
          >
            <Badge badgeContent={changes.length} color="error">
              <TrackChanges fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton
            size="small"
            onClick={onCommentsOpen}
            title="Comments"
            sx={{
              border: comments.filter(c => !c.resolved).length > 0 ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: 1
            }}
          >
            <Badge badgeContent={comments.filter(c => !c.resolved).length} color="warning">
              <CommentIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 5: View Options */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/documents/${documentId}`)}
            startIcon={<PreviewIcon fontSize="small" />}
            title="Preview Document"
          >
            Preview
          </Button>
          {hasSupplements && (
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={viewMode === 'base' ? 'contained' : 'outlined'}
                onClick={() => onViewModeChange('base')}
                sx={{ minWidth: 45, fontSize: '0.75rem' }}
              >
                Base
              </Button>
              <Button
                variant={viewMode === 'integrated' ? 'contained' : 'outlined'}
                onClick={() => onViewModeChange('integrated')}
                sx={{ minWidth: 65, fontSize: '0.75rem' }}
              >
                Integrated
              </Button>
              <Button
                variant={viewMode === 'supplement' ? 'contained' : 'outlined'}
                onClick={() => onViewModeChange('supplement')}
                sx={{ minWidth: 75, fontSize: '0.75rem' }}
              >
                Supplement
              </Button>
            </ButtonGroup>
          )}
        </Box>

        {/* Status on the right - Optimized */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Save Status */}
          {hasUnsavedChanges ? (
            <Chip
              label="Unsaved"
              size="small"
              color="warning"
              variant="filled"
              sx={{ fontWeight: 'bold' }}
            />
          ) : (
            <Chip
              label="Saved"
              size="small"
              color="success"
              variant="outlined"
              icon={<Check />}
            />
          )}

          <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />

          {/* Document Stats - Compact */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Page {currentPage}/{totalPages}
            </Typography>
            <Typography variant="caption" color="text.secondary">•</Typography>
            <Typography variant="caption" color="text.secondary">
              {wordCount.toLocaleString()} words
            </Typography>
            <Typography variant="caption" color="text.secondary">•</Typography>
            <Typography variant="caption" color="text.secondary">
              {charCount.toLocaleString()} chars
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Row 2: Text Formatting */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>

        {/* Group 1: Font Controls */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <select
            value={fontFamily}
            onChange={(e) => {
              onFontFamilyChange(e.target.value);
              editor?.chain().focus().setFontFamily(e.target.value).run();
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '13px',
              minWidth: '140px',
              cursor: 'pointer'
            }}
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans Serif</option>
            <option value="monospace">Monospace</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => {
              onFontSizeChange(e.target.value);
              editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '13px',
              minWidth: '60px',
              cursor: 'pointer'
            }}
          >
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
            <option value="36px">36</option>
          </select>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 2: Text Style (Bold, Italic, Underline, Strike) */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={editor?.isActive('bold') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
            sx={{ minWidth: 36 }}
          >
            <strong>B</strong>
          </Button>
          <Button
            variant={editor?.isActive('italic') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
            sx={{ minWidth: 36 }}
          >
            <em>I</em>
          </Button>
          <Button
            variant={editor?.isActive('underline') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
            sx={{ minWidth: 36 }}
          >
            <u>U</u>
          </Button>
          <Button
            variant={editor?.isActive('strike') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            title="Strikethrough"
            sx={{ minWidth: 36 }}
          >
            <s>S</s>
          </Button>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 3: Text Effects (Subscript, Superscript) */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={editor?.isActive('subscript') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            title="Subscript"
            sx={{ minWidth: 36 }}
          >
            X<sub>2</sub>
          </Button>
          <Button
            variant={editor?.isActive('superscript') ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            title="Superscript"
            sx={{ minWidth: 36 }}
          >
            X<sup>2</sup>
          </Button>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 4: Colors */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            title="Text Color"
            style={{
              width: '36px',
              height: '32px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '2px'
            }}
          />
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            title="Highlight Color"
            style={{
              width: '36px',
              height: '32px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '2px'
            }}
          />
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

        {/* Group 5: Text Alignment */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={editor?.isActive({ textAlign: 'left' }) ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            title="Align Left"
            sx={{ minWidth: 36 }}
          >
            ⫷
          </Button>
          <Button
            variant={editor?.isActive({ textAlign: 'center' }) ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            title="Align Center"
            sx={{ minWidth: 36 }}
          >
            ≡
          </Button>
          <Button
            variant={editor?.isActive({ textAlign: 'right' }) ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            title="Align Right"
            sx={{ minWidth: 36 }}
          >
            ⫸
          </Button>
          <Button
            variant={editor?.isActive({ textAlign: 'justify' }) ? 'contained' : 'outlined'}
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            title="Justify"
            sx={{ minWidth: 36 }}
          >
            ⫼
          </Button>
        </ButtonGroup>
      </Box>
    </Paper>
  );
};