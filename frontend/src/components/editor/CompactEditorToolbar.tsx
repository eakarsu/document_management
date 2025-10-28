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
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse
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
  Download,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatColorText,
  Highlight as HighlightIcon,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  TableChart,
  InsertPhoto,
  Link as LinkIcon,
  Code,
  FormatListBulleted,
  FormatListNumbered,
  FormatSize,
  TextFields,
  ExpandMore,
  ExpandLess,
  MoreVert,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  FormatClear,
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatLineSpacing
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Change } from '@/lib/tiptap-change-tracking';
import { Comment } from '@/lib/tiptap-comments';
import { ViewMode } from '@/types/editor';
import { TableGridPicker } from './TableGridPicker';
import { TableControls } from './TableControls';

interface CompactEditorToolbarProps {
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

export const CompactEditorToolbar: React.FC<CompactEditorToolbarProps> = ({
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Menu states
  const [insertMenuAnchor, setInsertMenuAnchor] = useState<null | HTMLElement>(null);
  const [formatMenuAnchor, setFormatMenuAnchor] = useState<null | HTMLElement>(null);
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <Paper sx={{ mb: 2, boxShadow: 2 }}>
      {/* Compact Main Row - Always Visible */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1, bgcolor: '#fafafa' }}>

        {/* Essential File Operations */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon fontSize="small" />}
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges}
            sx={{ minWidth: 70, px: 1.5, py: 0.5, fontSize: '0.8rem' }}
          >
            {saving ? 'Saving' : 'Save'}
          </Button>

          <IconButton size="small" onClick={onUndo} disabled={!editor?.can().undo()} title="Undo">
            <Undo fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onRedo} disabled={!editor?.can().redo()} title="Redo">
            <Redo fontSize="small" />
          </IconButton>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

        {/* Font Controls - Compact */}
        <select
          value={fontFamily}
          onChange={(e) => {
            onFontFamilyChange(e.target.value);
            editor?.chain().focus().setFontFamily(e.target.value).run();
          }}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '12px',
            minWidth: '110px',
            height: '28px'
          }}
        >
          <option value="Times New Roman">Times New Roman</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
        </select>

        <select
          value={fontSize}
          onChange={(e) => {
            onFontSizeChange(e.target.value);
            editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
          }}
          style={{
            padding: '4px 6px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '12px',
            minWidth: '50px',
            height: '28px'
          }}
        >
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
        </select>

        <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

        {/* Essential Formatting - Compact */}
        <ButtonGroup size="small" variant="outlined">
          <IconButton
            size="small"
            color={editor?.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Bold"
            sx={{ width: 32, height: 28 }}
          >
            <FormatBold fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={editor?.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Italic"
            sx={{ width: 32, height: 28 }}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={editor?.isActive('underline') ? 'primary' : 'default'}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline"
            sx={{ width: 32, height: 28 }}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

        {/* Menus for Advanced Features */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            size="small"
            onClick={(e) => setInsertMenuAnchor(e.currentTarget)}
            sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, height: 28 }}
          >
            Insert
          </Button>
          <Button
            size="small"
            onClick={(e) => setFormatMenuAnchor(e.currentTarget)}
            sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, height: 28 }}
          >
            Format
          </Button>
          <Button
            size="small"
            onClick={(e) => setToolsMenuAnchor(e.currentTarget)}
            sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, height: 28 }}
          >
            Tools
          </Button>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

        {/* Review Controls - Compact */}
        <IconButton
          size="small"
          onClick={onChangesDrawerOpen}
          title={`View Changes (${changes.length})`}
          sx={{ width: 32, height: 28 }}
        >
          <Badge badgeContent={changes.length} color="error">
            <TrackChanges fontSize="small" />
          </Badge>
        </IconButton>

        <IconButton
          size="small"
          onClick={onCommentsOpen}
          title={`Comments (${comments.filter(c => !c.resolved).length})`}
          sx={{ width: 32, height: 28 }}
        >
          <Badge badgeContent={comments.filter(c => !c.resolved).length} color="warning">
            <CommentIcon fontSize="small" />
          </Badge>
        </IconButton>

        {/* More Options */}
        <IconButton
          size="small"
          onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
          title="More options"
          sx={{ width: 32, height: 28 }}
        >
          <MoreVert fontSize="small" />
        </IconButton>

        {/* Status - Compact */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasUnsavedChanges ? (
            <Chip label="Unsaved" size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
          ) : (
            <Chip label="Saved" size="small" color="success" variant="outlined" icon={<Check />} sx={{ height: 22, fontSize: '0.7rem' }} />
          )}

          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            P{currentPage}/{totalPages} • {wordCount}w • {charCount}c
          </Typography>
        </Box>

        {/* Expand/Collapse Toggle */}
        <IconButton
          size="small"
          onClick={toggleExpanded}
          title={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
          sx={{ width: 28, height: 28 }}
        >
          {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      {/* Expanded Formatting Row - Collapsible */}
      <Collapse in={isExpanded}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1, pt: 0.5, borderTop: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>

          {/* Text Alignment */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              size="small"
              color={editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              title="Align Left"
              sx={{ width: 32, height: 28 }}
            >
              <FormatAlignLeft fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              title="Align Center"
              sx={{ width: 32, height: 28 }}
            >
              <FormatAlignCenter fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              title="Align Right"
              sx={{ width: 32, height: 28 }}
            >
              <FormatAlignRight fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
              title="Justify"
              sx={{ width: 32, height: 28 }}
            >
              <FormatAlignJustify fontSize="small" />
            </IconButton>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          {/* Lists */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              size="small"
              color={editor?.isActive('bulletList') ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet List"
              sx={{ width: 32, height: 28 }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive('orderedList') ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              sx={{ width: 32, height: 28 }}
            >
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          {/* Colors - Compact */}
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            title="Text Color"
            style={{
              width: '32px',
              height: '28px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '2px'
            }}
          />
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            title="Highlight"
            style={{
              width: '32px',
              height: '28px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '2px'
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          {/* Additional Formatting */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              size="small"
              color={editor?.isActive('strike') ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              sx={{ width: 32, height: 28 }}
            >
              <FormatStrikethrough fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive('subscript') ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().toggleSubscript().run()}
              title="Subscript"
              sx={{ width: 32, height: 28 }}
            >
              <SubscriptIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={editor?.isActive('superscript') ? 'primary' : 'default'}
              onClick={() => editor?.chain().focus().toggleSuperscript().run()}
              title="Superscript"
              sx={{ width: 32, height: 28 }}
            >
              <SuperscriptIcon fontSize="small" />
            </IconButton>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          {/* Track Changes */}
          <FormControlLabel
            control={
              <Switch
                checked={trackChanges}
                onChange={(e) => onTrackChangesToggle(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Track Changes</Typography>}
            sx={{ mr: 0 }}
          />
        </Box>
      </Collapse>

      {/* Insert Menu */}
      <Menu
        anchorEl={insertMenuAnchor}
        open={Boolean(insertMenuAnchor)}
        onClose={() => setInsertMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setInsertMenuAnchor(null); }}>
          <ListItemIcon><TableChart fontSize="small" /></ListItemIcon>
          <ListItemText>Table</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setInsertMenuAnchor(null); }}>
          <ListItemIcon><InsertPhoto fontSize="small" /></ListItemIcon>
          <ListItemText>Image</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setInsertMenuAnchor(null); }}>
          <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setInsertMenuAnchor(null); }}>
          <ListItemIcon><Code fontSize="small" /></ListItemIcon>
          <ListItemText>Code Block</ListItemText>
        </MenuItem>
      </Menu>

      {/* Format Menu */}
      <Menu
        anchorEl={formatMenuAnchor}
        open={Boolean(formatMenuAnchor)}
        onClose={() => setFormatMenuAnchor(null)}
      >
        <MenuItem onClick={() => { editor?.chain().focus().clearNodes().unsetAllMarks().run(); setFormatMenuAnchor(null); }}>
          <ListItemIcon><FormatClear fontSize="small" /></ListItemIcon>
          <ListItemText>Clear Formatting</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { editor?.chain().focus().indent().run(); setFormatMenuAnchor(null); }}>
          <ListItemIcon><FormatIndentIncrease fontSize="small" /></ListItemIcon>
          <ListItemText>Increase Indent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { editor?.chain().focus().outdent().run(); setFormatMenuAnchor(null); }}>
          <ListItemIcon><FormatIndentDecrease fontSize="small" /></ListItemIcon>
          <ListItemText>Decrease Indent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setFormatMenuAnchor(null); }}>
          <ListItemIcon><FormatLineSpacing fontSize="small" /></ListItemIcon>
          <ListItemText>Line Spacing</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setFormatMenuAnchor(null); }}>
          <ListItemIcon><TextFields fontSize="small" /></ListItemIcon>
          <ListItemText>Text Case</ListItemText>
        </MenuItem>
      </Menu>

      {/* Tools Menu */}
      <Menu
        anchorEl={toolsMenuAnchor}
        open={Boolean(toolsMenuAnchor)}
        onClose={() => setToolsMenuAnchor(null)}
      >
        <MenuItem onClick={() => { onAdvancedSearchOpen(); setToolsMenuAnchor(null); }}>
          <ListItemIcon><FindReplace fontSize="small" /></ListItemIcon>
          <ListItemText>Find & Replace</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => { setExportMenuAnchor(e.currentTarget); }}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>Export...</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { window.print(); setToolsMenuAnchor(null); }}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/documents/${documentId}`); setToolsMenuAnchor(null); }}>
          <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Preview Document</ListItemText>
        </MenuItem>
      </Menu>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { onExportDialogOpen('pdf'); setExportMenuAnchor(null); setToolsMenuAnchor(null); }}>
          Export as PDF
        </MenuItem>
        <MenuItem onClick={() => { onExportDialogOpen('docx'); setExportMenuAnchor(null); setToolsMenuAnchor(null); }}>
          Export as Word (.docx)
        </MenuItem>
        <MenuItem onClick={() => { onExportDialogOpen('html'); setExportMenuAnchor(null); setToolsMenuAnchor(null); }}>
          Export as HTML
        </MenuItem>
        <MenuItem onClick={() => { onExportDialogOpen('txt'); setExportMenuAnchor(null); setToolsMenuAnchor(null); }}>
          Export as Text
        </MenuItem>
      </Menu>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        {hasSupplements && (
          <>
            <MenuItem onClick={() => { onViewModeChange('base'); setMoreMenuAnchor(null); }}>
              <ListItemText>View: Base Only</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onViewModeChange('integrated'); setMoreMenuAnchor(null); }}>
              <ListItemText>View: Integrated</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onViewModeChange('supplement'); setMoreMenuAnchor(null); }}>
              <ListItemText>View: Supplement Only</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem onClick={() => { router.push(`/documents/${documentId}`); setMoreMenuAnchor(null); }}>
          <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Preview Document</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};
