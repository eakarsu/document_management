'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Popover,
  IconButton,
  Typography,
  Tooltip
} from '@mui/material';
import { TableChart } from '@mui/icons-material';

interface TableGridPickerProps {
  editor: Editor | null;
}

export const TableGridPicker: React.FC<TableGridPickerProps> = ({ editor }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const maxRows = 10;
  const maxCols = 10;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setHoveredCell(null);
  };

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
  };

  const handleCellClick = (rows: number, cols: number) => {
    console.log('🔵 Cell clicked! Rows:', rows, 'Cols:', cols);
    console.log('🔵 Editor exists?', !!editor);

    if (editor) {
      console.log('🔵 Inserting table:', rows, 'rows x', cols, 'cols');
      const result = editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
      console.log('🔵 Table inserted result:', result);

      // Force editor to update
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    } else {
      console.error('❌ Editor is null!');
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Insert Table">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: open ? 'primary.main' : 'inherit',
            bgcolor: open ? 'action.selected' : 'transparent'
          }}
        >
          <TableChart />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {hoveredCell
              ? `${hoveredCell.row} × ${hoveredCell.col} Table`
              : 'Select table size'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
              gap: '2px',
              bgcolor: '#f5f5f5',
              p: 0.5,
              borderRadius: 1
            }}
          >
            {Array.from({ length: maxRows * maxCols }, (_, index) => {
              const row = Math.floor(index / maxCols) + 1;
              const col = (index % maxCols) + 1;
              const isHovered = hoveredCell && row <= hoveredCell.row && col <= hoveredCell.col;

              return (
                <Box
                  key={index}
                  onMouseEnter={() => handleCellHover(row, col)}
                  onClick={() => handleCellClick(row, col)}
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: isHovered ? '#667eea' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    '&:hover': {
                      bgcolor: '#667eea',
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              );
            })}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            Click to insert table
          </Typography>
        </Box>
      </Popover>
    </>
  );
};
