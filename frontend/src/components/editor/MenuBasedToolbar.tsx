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
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Undo,
  Redo,
  TrackChanges,
  Check,
  Comment as CommentIcon,
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
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  FormatClear,
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatLineSpacing,
  FindReplace,
  Print,
  Download,
  Preview as PreviewIcon,
  FormatPaint,
  ContentCopy,
  ContentPaste,
  Accessibility
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Change } from '@/lib/tiptap-change-tracking';
import { Comment } from '@/lib/tiptap-comments';
import { ViewMode } from '@/types/editor';

interface MenuBasedToolbarProps {
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

export const MenuBasedToolbar: React.FC<MenuBasedToolbarProps> = ({
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
  const [activeMenu, setActiveMenu] = useState(0); // 0=Home, 1=Insert, 2=Format, 3=Review, 4=View, 5=Advanced
  const [lineSpacing, setLineSpacing] = useState('1.5');

  return (
    <Paper sx={{ mb: 2, boxShadow: 2 }}>
      {/* Menu Tabs - Like Word's ribbon tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
        <Tabs
          value={activeMenu}
          onChange={(e, newValue) => setActiveMenu(newValue)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              px: 2,
              fontSize: '0.875rem',
              textTransform: 'none'
            }
          }}
        >
          <Tab label="Home" />
          <Tab label="Insert" />
          <Tab label="Format" />
          <Tab label="Review" />
          <Tab label="View" />
          <Tab label="Advanced" />
        </Tabs>
      </Box>

      {/* Menu Content - Changes based on active tab */}
      <Box sx={{ p: 1.5, bgcolor: '#fafafa', minHeight: 60, maxHeight: 300, overflowX: 'auto', overflowY: 'auto' }}>

        {/* HOME TAB */}
        {activeMenu === 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Clipboard Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Clipboard
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Undo (Ctrl+Z)">
                  <span>
                    <IconButton size="small" onClick={onUndo} disabled={!editor?.can().undo()}>
                      <Undo fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Y)">
                  <span>
                    <IconButton size="small" onClick={onRedo} disabled={!editor?.can().redo()}>
                      <Redo fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Copy Format">
                  <IconButton size="small">
                    <FormatPaint fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Font Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Font
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    onFontFamilyChange(e.target.value);
                    editor?.chain().focus().setFontFamily(e.target.value).run();
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '12px',
                    minWidth: '130px',
                    height: '32px'
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
                    padding: '5px 6px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '12px',
                    minWidth: '55px',
                    height: '32px'
                  }}
                >
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="18px">18</option>
                  <option value="20px">20</option>
                  <option value="24px">24</option>
                </select>

                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Bold (Ctrl+B)">
                    <IconButton
                      size="small"
                      color={editor?.isActive('bold') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                      <FormatBold fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic (Ctrl+I)">
                    <IconButton
                      size="small"
                      color={editor?.isActive('italic') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                      <FormatItalic fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Underline (Ctrl+U)">
                    <IconButton
                      size="small"
                      color={editor?.isActive('underline') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    >
                      <FormatUnderlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Strikethrough">
                    <IconButton
                      size="small"
                      color={editor?.isActive('strike') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                    >
                      <FormatStrikethrough fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Subscript">
                    <IconButton
                      size="small"
                      color={editor?.isActive('subscript') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleSubscript().run()}
                    >
                      <SubscriptIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Superscript">
                    <IconButton
                      size="small"
                      color={editor?.isActive('superscript') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                    >
                      <SuperscriptIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>

                <Tooltip title="Text Color">
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  />
                </Tooltip>

                <Tooltip title="Highlight">
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Paragraph Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Paragraph
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Bullet List">
                    <IconButton
                      size="small"
                      color={editor?.isActive('bulletList') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                      <FormatListBulleted fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Numbered List">
                    <IconButton
                      size="small"
                      color={editor?.isActive('orderedList') ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    >
                      <FormatListNumbered fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Decrease Indent">
                    <IconButton size="small" onClick={() => editor?.chain().focus().outdent().run()}>
                      <FormatIndentDecrease fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Increase Indent">
                    <IconButton size="small" onClick={() => editor?.chain().focus().indent().run()}>
                      <FormatIndentIncrease fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Align Left">
                    <IconButton
                      size="small"
                      color={editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    >
                      <FormatAlignLeft fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Align Center">
                    <IconButton
                      size="small"
                      color={editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    >
                      <FormatAlignCenter fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Align Right">
                    <IconButton
                      size="small"
                      color={editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    >
                      <FormatAlignRight fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Justify">
                    <IconButton
                      size="small"
                      color={editor?.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
                      onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                    >
                      <FormatAlignJustify fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Status */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                P{currentPage}/{totalPages} • {wordCount}w • {charCount}c
              </Typography>
              {hasUnsavedChanges ? (
                <Chip label="Unsaved" size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
              ) : (
                <Chip label="Saved" size="small" color="success" variant="outlined" icon={<Check />} sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>
        )}

        {/* INSERT TAB */}
        {activeMenu === 1 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Tables Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Tables
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                  startIcon={<TableChart fontSize="small" />}
                >
                  Table
                </Button>
                <Button
                  onClick={() => editor?.can().addColumnAfter() && editor?.chain().focus().addColumnAfter().run()}
                  disabled={!editor?.can().addColumnAfter()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  +Col
                </Button>
                <Button
                  onClick={() => editor?.can().addRowAfter() && editor?.chain().focus().addRowAfter().run()}
                  disabled={!editor?.can().addRowAfter()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  +Row
                </Button>
                <Button
                  onClick={() => editor?.can().deleteTable() && editor?.chain().focus().deleteTable().run()}
                  disabled={!editor?.can().deleteTable()}
                  sx={{ fontSize: '0.7rem' }}
                  color="error"
                >
                  ×Table
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Illustrations Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Illustrations
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  component="label"
                  startIcon={<InsertPhoto fontSize="small" />}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const src = event.target?.result as string;
                          editor?.chain().focus().setImage({ src }).run();
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                <Button
                  onClick={() => {
                    const url = window.prompt('Enter image URL:');
                    if (url) editor?.chain().focus().setImage({ src: url }).run();
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  URL
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Links & Bookmarks Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Links & References
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) editor?.chain().focus().setLink({ href: url }).run();
                  }}
                  startIcon={<LinkIcon fontSize="small" />}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Link
                </Button>
                <Button sx={{ fontSize: '0.7rem' }}>Bookmark</Button>
                <Button sx={{ fontSize: '0.7rem' }}>Cross-Ref</Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Special Elements Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Special Elements
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Blockquote">
                  <Button
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    variant={editor?.isActive('blockquote') ? 'contained' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    " Quote
                  </Button>
                </Tooltip>
                <Tooltip title="Code Block">
                  <Button
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    variant={editor?.isActive('codeBlock') ? 'contained' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {'</>'}
                  </Button>
                </Tooltip>
                <Tooltip title="Horizontal Rule">
                  <Button
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    ―
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Symbols & Emoji Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Symbols
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => {
                    const emojis = ['😀', '😎', '👍', '❤️', '✅', '⭐', '🔥', '💡', '📌', '⚠️'];
                    const selected = window.prompt(`Select emoji: ${emojis.join(' ')}`);
                    if (selected) editor?.chain().focus().insertContent(selected).run();
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  😀 Emoji
                </Button>
                <Button
                  onClick={() => {
                    const symbols = ['©', '®', '™', '°', '±', '×', '÷', '≠', '≤', '≥', '§', '¶'];
                    const selected = window.prompt(`Symbol: ${symbols.join(' ')}`);
                    if (selected) editor?.chain().focus().insertContent(selected).run();
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  © Symbol
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        )}

        {/* FORMAT TAB */}
        {activeMenu === 2 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Headings Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Headings & Styles
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={editor?.isActive('heading', { level: 1 }) ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  H1
                </Button>
                <Button
                  variant={editor?.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  H2
                </Button>
                <Button
                  variant={editor?.isActive('heading', { level: 3 }) ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  H3
                </Button>
                <Button
                  variant={editor?.isActive('heading', { level: 4 }) ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  H4
                </Button>
                <Button
                  variant={editor?.isActive('paragraph') ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  P
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Lists Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Lists
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={editor?.isActive('bulletList') ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  • List
                </Button>
                <Button
                  variant={editor?.isActive('orderedList') ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  1. List
                </Button>
                <Button
                  variant={editor?.isActive('taskList') ? 'contained' : 'outlined'}
                  onClick={() => editor?.chain().focus().toggleTaskList().run()}
                  sx={{ fontSize: '0.7rem' }}
                >
                  ☐ Tasks
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Text Formatting Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Format Tools
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Clear Formatting">
                  <Button
                    onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
                    startIcon={<FormatClear fontSize="small" />}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Clear
                  </Button>
                </Tooltip>
                <Tooltip title="Format Painter">
                  <Button
                    startIcon={<FormatPaint fontSize="small" />}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Copy Format
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Indent Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Indentation
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => editor?.chain().focus().outdent().run()}
                  startIcon={<FormatIndentDecrease fontSize="small" />}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Decrease
                </Button>
                <Button
                  onClick={() => editor?.chain().focus().indent().run()}
                  startIcon={<FormatIndentIncrease fontSize="small" />}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Increase
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Document Tools */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Document
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => {
                    // TOC Generation logic
                    const html = editor?.getHTML();
                    if (!html) return;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');
                    if (headers.length === 0) {
                      alert('No headings found');
                      return;
                    }
                    let toc = '<div class="toc"><h2>Table of Contents</h2><ul>';
                    headers.forEach((h, i) => {
                      const level = parseInt(h.tagName.charAt(1));
                      const text = h.textContent || '';
                      const indent = '&nbsp;&nbsp;'.repeat(level - 1);
                      toc += `<li>${indent}${text}</li>`;
                    });
                    toc += '</ul></div>';
                    editor?.commands.focus('start');
                    editor?.chain().insertContent(toc).run();
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  TOC
                </Button>
                <Button
                  onClick={() => {
                    const template = '<h1>Introduction</h1><p>Content...</p><h2>Section 1</h2><p>Details...</p>';
                    editor?.commands.setContent(template);
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Template
                </Button>
                <Button
                  onClick={() => {
                    // Clear all colors
                    editor?.chain().focus().unsetColor().run();
                  }}
                  sx={{ fontSize: '0.7rem', bgcolor: '#ffebee' }}
                  title="Remove All Text Colors"
                >
                  Clear Colors
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        )}

        {/* REVIEW TAB */}
        {activeMenu === 3 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Tracking Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Tracking
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={trackChanges}
                      onChange={(e) => onTrackChangesToggle(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Track Changes</Typography>}
                />
                <IconButton size="small" onClick={onChangesDrawerOpen} title="View Changes">
                  <Badge badgeContent={changes.length} color="error">
                    <TrackChanges fontSize="small" />
                  </Badge>
                </IconButton>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Comments Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Comments
              </Typography>
              <IconButton size="small" onClick={onCommentsOpen} title="Comments">
                <Badge badgeContent={comments.filter(c => !c.resolved).length} color="warning">
                  <CommentIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Tools Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Tools
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FindReplace fontSize="small" />}
                onClick={onAdvancedSearchOpen}
              >
                Find & Replace
              </Button>
            </Box>
          </Box>
        )}

        {/* VIEW TAB */}
        {activeMenu === 4 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Document Views Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Document Views
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => router.push(`/documents/${documentId}`)}
                  startIcon={<PreviewIcon fontSize="small" />}
                >
                  Preview
                </Button>
                <Button
                  onClick={() => window.print()}
                  startIcon={<Print fontSize="small" />}
                >
                  Print
                </Button>
              </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Export Group */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                Export
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => onExportDialogOpen('pdf')}
                  startIcon={<Download fontSize="small" />}
                >
                  PDF
                </Button>
                <Button onClick={() => onExportDialogOpen('docx')}>
                  Word
                </Button>
                <Button onClick={() => onExportDialogOpen('html')}>
                  HTML
                </Button>
              </ButtonGroup>
            </Box>

            {hasSupplements && (
              <>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                    View Mode
                  </Typography>
                  <ButtonGroup size="small" variant="outlined">
                    <Button
                      variant={viewMode === 'base' ? 'contained' : 'outlined'}
                      onClick={() => onViewModeChange('base')}
                    >
                      Base
                    </Button>
                    <Button
                      variant={viewMode === 'integrated' ? 'contained' : 'outlined'}
                      onClick={() => onViewModeChange('integrated')}
                    >
                      Integrated
                    </Button>
                    <Button
                      variant={viewMode === 'supplement' ? 'contained' : 'outlined'}
                      onClick={() => onViewModeChange('supplement')}
                    >
                      Supplement
                    </Button>
                  </ButtonGroup>
                </Box>
              </>
            )}
          </Box>
        )}

        {/* ADVANCED TAB - All 8 Advanced Features */}
        {activeMenu === 5 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Header showing 8 features available */}
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>
              ✨ 8 Advanced Features Available
            </Typography>

            {/* Row 1: Line Spacing, Paragraph Spacing, Special Indents */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {/* 1. Line Spacing Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  1️⃣ Line Spacing
                </Typography>
                <select
                  value={lineSpacing}
                  onChange={(e) => {
                    setLineSpacing(e.target.value);
                    editor?.chain().focus().setLineHeight(e.target.value).run();
                  }}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '11px',
                    minWidth: '100px',
                    height: '28px'
                  }}
                >
                  <option value="1">Single (1.0)</option>
                  <option value="1.15">1.15</option>
                  <option value="1.5">1.5 (Default)</option>
                  <option value="2">Double (2.0)</option>
                  <option value="2.5">2.5</option>
                  <option value="3">Triple (3.0)</option>
                </select>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 2. Paragraph Spacing Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  2️⃣ Paragraph Spacing
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Spacing Before">
                    <Button onClick={() => editor?.chain().focus().setParagraphSpacingBefore('12pt').run()} sx={{ fontSize: '0.7rem' }}>
                      Before
                    </Button>
                  </Tooltip>
                  <Tooltip title="Spacing After">
                    <Button onClick={() => editor?.chain().focus().setParagraphSpacingAfter('12pt').run()} sx={{ fontSize: '0.7rem' }}>
                      After
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 3. Special Indents Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  3️⃣ Special Indents
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="First Line Indent">
                    <Button onClick={() => editor?.chain().focus().setFirstLineIndent('40px').run()} sx={{ fontSize: '0.7rem' }}>
                      First Line
                    </Button>
                  </Tooltip>
                  <Tooltip title="Hanging Indent">
                    <Button onClick={() => editor?.chain().focus().setHangingIndent('40px').run()} sx={{ fontSize: '0.7rem' }}>
                      Hanging
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 4. Text Case Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  4️⃣ Change Case
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="UPPERCASE">
                    <Button onClick={() => {
                      const { from, to } = editor?.state.selection || {};
                      if (from !== undefined && to !== undefined && editor) {
                        const text = editor.state.doc.textBetween(from, to);
                        editor.chain().focus().deleteRange({ from, to }).insertContent(text.toUpperCase()).run();
                      }
                    }} sx={{ fontSize: '0.7rem', minWidth: '35px' }}>
                      AA
                    </Button>
                  </Tooltip>
                  <Tooltip title="lowercase">
                    <Button onClick={() => {
                      const { from, to } = editor?.state.selection || {};
                      if (from !== undefined && to !== undefined && editor) {
                        const text = editor.state.doc.textBetween(from, to);
                        editor.chain().focus().deleteRange({ from, to }).insertContent(text.toLowerCase()).run();
                      }
                    }} sx={{ fontSize: '0.7rem', minWidth: '35px' }}>
                      aa
                    </Button>
                  </Tooltip>
                  <Tooltip title="Title Case">
                    <Button onClick={() => {
                      const { from, to } = editor?.state.selection || {};
                      if (from !== undefined && to !== undefined && editor) {
                        const text = editor.state.doc.textBetween(from, to);
                        const titleCase = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                        editor.chain().focus().deleteRange({ from, to }).insertContent(titleCase).run();
                      }
                    }} sx={{ fontSize: '0.7rem', minWidth: '35px' }}>
                      Aa
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>
            </Box>

            {/* Row 2: Lists, Tables, Document Stats, Page Breaks */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {/* 5. Lists Advanced Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  5️⃣ Lists
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Restart Numbering at 1">
                    <Button onClick={() => editor?.chain().focus().updateAttributes('orderedList', { start: 1 }).run()} sx={{ fontSize: '0.7rem' }}>
                      Restart
                    </Button>
                  </Tooltip>
                  <Tooltip title="Continue Numbering">
                    <Button onClick={() => editor?.chain().focus().updateAttributes('orderedList', { start: null }).run()} sx={{ fontSize: '0.7rem' }}>
                      Continue
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 6. Tables Advanced Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  6️⃣ Table Tools
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Merge Cells">
                    <Button onClick={() => editor?.chain().focus().mergeCells().run()} sx={{ fontSize: '0.7rem' }}>
                      Merge
                    </Button>
                  </Tooltip>
                  <Tooltip title="Split Cell">
                    <Button onClick={() => editor?.chain().focus().splitCell().run()} sx={{ fontSize: '0.7rem' }}>
                      Split
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 7. Word Count & Reading Time Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  7️⃣ Document Stats
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={`${wordCount} words`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 22 }}
                  />
                  <Chip
                    label={`${Math.ceil(wordCount / 200)} min read`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 22 }}
                  />
                </Box>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* 8. Page Breaks & Paragraph Control Group */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  8️⃣ Page Breaks & Control
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Insert Page Break">
                    <Button
                      onClick={() => editor?.chain().focus().setHardBreak().run()}
                      sx={{ fontSize: '0.7rem' }}
                    >
                      Break
                    </Button>
                  </Tooltip>
                </ButtonGroup>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        onChange={(e) => editor?.chain().focus().setKeepWithNext(e.target.checked).run()}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Keep with Next</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        onChange={(e) => editor?.chain().focus().setPageBreakBefore(e.target.checked).run()}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Page Break Before</Typography>}
                  />
                </Box>
              </Box>
            </Box>

            {/* Row 3: Additional Advanced Features */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
              {/* Collaboration Tools */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Collaboration
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Button sx={{ fontSize: '0.7rem' }}>@Mention</Button>
                  <Button sx={{ fontSize: '0.7rem' }}>History</Button>
                  <Button sx={{ fontSize: '0.7rem' }}>Compare</Button>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* Productivity Tools */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Productivity
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Button sx={{ fontSize: '0.7rem' }}>Shortcuts</Button>
                  <Button sx={{ fontSize: '0.7rem' }}>Focus Mode</Button>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* Accessibility Tools */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Accessibility
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Button sx={{ fontSize: '0.7rem' }}>High Contrast</Button>
                  <Button sx={{ fontSize: '0.7rem' }}>Alt Text</Button>
                  <Button sx={{ fontSize: '0.7rem' }}>Check A11y</Button>
                </ButtonGroup>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* Table Cell Background */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Table Cell
                </Typography>
                <Tooltip title="Cell Background Color">
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().setCellAttribute('backgroundColor', e.target.value).run()}
                    style={{
                      width: '32px',
                      height: '28px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
