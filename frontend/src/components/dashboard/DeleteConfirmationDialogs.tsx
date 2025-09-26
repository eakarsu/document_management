'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button
} from '@mui/material';
import { DeleteDialog } from '@/types/dashboard';

interface DeleteConfirmationDialogsProps {
  deleteDialog: DeleteDialog;
  bulkDeleteDialog: boolean;
  selectedDocumentsCount: number;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onConfirmBulkDelete: () => void;
  onCancelBulkDelete: () => void;
}

export const DeleteConfirmationDialogs: React.FC<DeleteConfirmationDialogsProps> = ({
  deleteDialog,
  bulkDeleteDialog,
  selectedDocumentsCount,
  onConfirmDelete,
  onCancelDelete,
  onConfirmBulkDelete,
  onCancelBulkDelete
}) => {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={onCancelDelete}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.docTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={onConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onClose={onCancelBulkDelete}
      >
        <DialogTitle>Delete Multiple Documents</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedDocumentsCount} selected document{selectedDocumentsCount > 1 ? 's' : ''}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelBulkDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={onConfirmBulkDelete} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};