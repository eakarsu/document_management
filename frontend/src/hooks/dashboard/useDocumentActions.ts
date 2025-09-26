'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DeleteDialog } from '@/types/dashboard';

export const useDocumentActions = (refreshDashboardData: () => Promise<void>) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>({
    open: false,
    docId: '',
    docTitle: ''
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDocumentClick = (documentId: string) => {
    // Only navigate if not selecting
    if (selectedDocuments.size === 0) {
      router.push(`/documents/${documentId}`);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = (totalDocuments: number, documentIds: string[]) => {
    if (selectedDocuments.size === totalDocuments) {
      setSelectedDocuments(new Set());
    } else {
      const allIds = new Set(documentIds);
      setSelectedDocuments(allIds);
    }
  };

  const handleDeleteDocument = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      docId: documentId,
      docTitle: documentTitle
    });
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size > 0) {
      setBulkDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/api/documents/${deleteDialog.docId}`);

      if (response.ok) {
        await refreshDashboardData();
        setDeleteDialog({ open: false, docId: '', docTitle: '' });
      } else {
        const error = await response.json();
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, docId: '', docTitle: '' });
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected documents from database
      const deletePromises = Array.from(selectedDocuments).map(async (docId) => {
        try {
          const response = await api.delete(`/api/documents/${docId}`);
          if (!response.ok) {
            console.error(`Failed to delete document ${docId}`);
            return { success: false, docId };
          }
          return { success: true, docId };
        } catch (error) {
          console.error(`Error deleting document ${docId}:`, error);
          return { success: false, docId };
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        console.log(`Successfully deleted ${successCount} document(s)`);
      }
      if (failCount > 0) {
        console.error(`Failed to delete ${failCount} document(s)`);
      }

      await refreshDashboardData();
      setSelectedDocuments(new Set());
      setBulkDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('An error occurred while deleting documents. Please try again.');
    }
  };

  return {
    selectedDocuments,
    deleteDialog,
    bulkDeleteDialog,
    setBulkDeleteDialog,
    handleDocumentClick,
    handleSelectDocument,
    handleSelectAll,
    handleDeleteDocument,
    handleBulkDelete,
    confirmDelete,
    cancelDelete,
    confirmBulkDelete
  };
};