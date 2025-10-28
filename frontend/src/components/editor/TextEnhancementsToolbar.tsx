'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatClear,
  FormatPaint,
  TextFields,
  FormatLineSpacing
} from '@mui/icons-material';

interface TextEnhancementsToolbarProps {
  editor: Editor | null;
}

export const TextEnhancementsToolbar: React.FC<TextEnhancementsToolbarProps> = ({ editor }) => {
  const [copiedFormat, setCopiedFormat] = useState<any>(null);
  const [lineHeight, setLineHeight] = useState('1.5');

  // Clear all formatting
  const clearFormatting = () => {
    editor?.chain().focus().clearNodes().unsetAllMarks().run();
  };

  // Format painter - copy formatting
  const copyFormatting = () => {
    if (!editor) return;

    const { selection } = editor.state;
    const { $from } = selection;
    const marks = $from.marks();
    const node = $from.parent;

    setCopiedFormat({
      marks,
      nodeType: node.type.name,
      attrs: node.attrs,
    });
  };

  // Format painter - paste formatting
  const pasteFormatting = () => {
    if (!editor || !copiedFormat) return;

    // Apply marks
    copiedFormat.marks.forEach((mark: any) => {
      editor.chain().focus().setMark(mark.type.name, mark.attrs).run();
    });

    // Apply node attributes if same type
    if (copiedFormat.nodeType) {
      editor.chain().focus().updateAttributes(copiedFormat.nodeType, copiedFormat.attrs).run();
    }
  };

  // Case conversion
  const convertCase = (type: 'upper' | 'lower' | 'title') => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);

    let convertedText = '';
    switch (type) {
      case 'upper':
        convertedText = text.toUpperCase();
        break;
      case 'lower':
        convertedText = text.toLowerCase();
        break;
      case 'title':
        convertedText = text.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
    }

    editor.chain().focus().deleteRange({ from, to }).insertContent(convertedText).run();
  };

  // Line height
  const handleLineHeightChange = (height: string) => {
    setLineHeight(height);
    editor?.chain().focus().setLineHeight(height).run();
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      {/* Line Spacing */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Line Spacing</InputLabel>
        <Select
          value={lineHeight}
          label="Line Spacing"
          onChange={(e) => handleLineHeightChange(e.target.value)}
          startAdornment={<FormatLineSpacing fontSize="small" />}
        >
          <MenuItem value="1">Single (1.0)</MenuItem>
          <MenuItem value="1.15">1.15</MenuItem>
          <MenuItem value="1.5">1.5 (Default)</MenuItem>
          <MenuItem value="2">Double (2.0)</MenuItem>
          <MenuItem value="2.5">2.5</MenuItem>
          <MenuItem value="3">Triple (3.0)</MenuItem>
        </Select>
      </FormControl>

      <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

      {/* Indent Controls */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Increase Indent (Tab)">
          <Button onClick={() => editor?.chain().focus().indent().run()}>
            <FormatIndentIncrease />
          </Button>
        </Tooltip>
        <Tooltip title="Decrease Indent (Shift+Tab)">
          <Button onClick={() => editor?.chain().focus().outdent().run()}>
            <FormatIndentDecrease />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

      {/* Clear Formatting */}
      <Tooltip title="Clear Formatting">
        <Button
          size="small"
          variant="outlined"
          onClick={clearFormatting}
          startIcon={<FormatClear />}
          color="error"
        >
          Clear Format
        </Button>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

      {/* Format Painter */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Copy Formatting">
          <Button onClick={copyFormatting} color={copiedFormat ? 'success' : 'primary'}>
            <FormatPaint />
          </Button>
        </Tooltip>
        <Tooltip title="Paste Formatting">
          <Button onClick={pasteFormatting} disabled={!copiedFormat}>
            Apply
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

      {/* Case Conversion */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="UPPERCASE">
          <Button onClick={() => convertCase('upper')}>
            <TextFields /> AA
          </Button>
        </Tooltip>
        <Tooltip title="lowercase">
          <Button onClick={() => convertCase('lower')}>
            <TextFields /> aa
          </Button>
        </Tooltip>
        <Tooltip title="Title Case">
          <Button onClick={() => convertCase('title')}>
            <TextFields /> Aa
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};
