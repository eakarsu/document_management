'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  IconButton,
  Tooltip,
  ButtonGroup
} from '@mui/material';
import {
  DeleteOutline,
  AddCircleOutline,
  RemoveCircleOutline
} from '@mui/icons-material';

interface TableControlsProps {
  editor: Editor | null;
}

export const TableControls: React.FC<TableControlsProps> = ({ editor }) => {
  // Check if cursor is inside a table
  const isInTable = editor?.isActive('table');

  // Don't show controls if not in a table
  if (!isInTable || !editor) {
    return null;
  }

  return (
    <ButtonGroup size="small" variant="outlined" sx={{ ml: 1 }}>
      <Tooltip title="Add Column Before">
        <IconButton
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          size="small"
        >
          <AddCircleOutline fontSize="small" sx={{ transform: 'rotate(0deg)' }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Add Column After">
        <IconButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          size="small"
        >
          <AddCircleOutline fontSize="small" sx={{ transform: 'rotate(0deg)' }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Column">
        <IconButton
          onClick={() => editor.chain().focus().deleteColumn().run()}
          size="small"
          color="error"
        >
          <RemoveCircleOutline fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Add Row Before">
        <IconButton
          onClick={() => editor.chain().focus().addRowBefore().run()}
          size="small"
        >
          <AddCircleOutline fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Add Row After">
        <IconButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          size="small"
        >
          <AddCircleOutline fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Row (or Table if last row)">
        <IconButton
          onClick={() => {
            // Try to delete the row, if it fails or it's the last row, delete the table
            try {
              // Check if we can delete the row
              const canDeleteRow = editor.can().deleteRow();

              if (!canDeleteRow) {
                // Can't delete row (probably last row), delete the entire table
                console.log('Cannot delete row, deleting entire table');
                editor.chain().focus().deleteTable().run();
                return;
              }

              // Try to delete the row
              const result = editor.chain().focus().deleteRow().run();

              // If delete failed, try deleting the table
              if (!result) {
                console.log('Delete row failed, deleting entire table');
                editor.chain().focus().deleteTable().run();
              }
            } catch (error) {
              console.error('Error deleting row:', error);
              // Fallback: try to delete the table
              editor.chain().focus().deleteTable().run();
            }
          }}
          size="small"
          color="error"
        >
          <RemoveCircleOutline fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Entire Table">
        <IconButton
          onClick={() => editor.chain().focus().deleteTable().run()}
          size="small"
          color="error"
          sx={{
            borderLeft: '2px solid #e0e0e0',
            borderRadius: 0,
            ml: 1
          }}
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      </Tooltip>
    </ButtonGroup>
  );
};
