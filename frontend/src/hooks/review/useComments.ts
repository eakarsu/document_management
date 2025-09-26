import { useState } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment } from '../../types/review';

export const useComments = (
  documentId: string,
  isAIGeneratedDoc: boolean,
  comments: CRMComment[],
  setComments: (comments: CRMComment[]) => void
) => {
  const [selectedComment, setSelectedComment] = useState<CRMComment | null>(null);
  const [currentComment, setCurrentComment] = useState<CRMComment>({
    component: '',
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    commentType: 'S',
    page: '',
    paragraphNumber: '',
    lineNumber: '',
    coordinatorComment: '',
    changeFrom: '',
    changeTo: '',
    coordinatorJustification: ''
  });

  const handleAddComment = async () => {
    if (!currentComment.component || !currentComment.commentType) {
      alert('Please fill in required fields: Component and Comment Type');
      return;
    }

    // Add new comment
    const newComment = { ...currentComment, id: Date.now().toString() };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);

    // Save to appropriate field based on document type
    try {
      const updateFields: any = {
        lastDraftUpdate: new Date().toISOString()
      };

      // For AI-generated documents, update crmFeedback; for others, update draftFeedback
      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = updatedComments;
        updateFields.draftFeedback = updatedComments; // Also save to draft for compatibility
      } else {
        updateFields.draftFeedback = updatedComments;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (!response.ok) {
        alert('Failed to save feedback to database');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Error saving feedback to database');
    }

    // Reset form
    setCurrentComment({
      component: '',
      pocName: '',
      pocPhone: '',
      pocEmail: '',
      commentType: 'S',
      page: '',
      paragraphNumber: '',
      lineNumber: '',
      coordinatorComment: '',
      changeFrom: '',
      changeTo: '',
      coordinatorJustification: ''
    });
  };

  const handleDeleteComment = async (id: string) => {
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);

    // Save to appropriate field based on document type
    try {
      const updateFields: any = {
        lastDraftUpdate: new Date().toISOString()
      };

      // For AI-generated documents, update crmFeedback; for others, update draftFeedback
      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = updatedComments;
        updateFields.draftFeedback = updatedComments;
      } else {
        updateFields.draftFeedback = updatedComments;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (!response.ok) {
        alert('Failed to delete comment from database');
      }
    } catch (error) {
      console.error('Error updating database:', error);
      alert('Error deleting comment');
    }
  };

  const handleEditComment = (comment: CRMComment) => {
    setCurrentComment(comment);
    setSelectedComment(comment);
  };

  const handleSelectComment = (comment: CRMComment) => {
    setSelectedComment(comment);
    setCurrentComment({
      ...comment,
      id: undefined // Don't copy the ID for new comments
    });
  };

  const handleToggleSelect = (id: string) => {
    setComments(
      comments.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleClearSelectedFeedback = async () => {
    const selectedItems = comments.filter(item => item.selected);
    const selectedCount = selectedItems.length;

    if (selectedCount === 0) {
      window.alert('No feedback items selected.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCount} selected feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      // Remove selected items from local state immediately
      const remainingFeedback = comments.filter(item => !item.selected);
      setComments(remainingFeedback);

      // Clear selected feedback if it was selected
      if (selectedComment?.selected) {
        setSelectedComment(null);
      }

      // Save to database
      const updateFields: any = {
        lastModified: new Date().toISOString()
      };

      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = remainingFeedback;
        updateFields.draftFeedback = remainingFeedback;
      } else {
        updateFields.draftFeedback = remainingFeedback;
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (response.ok) {
        window.alert(`${selectedCount} feedback items deleted successfully.`);
      } else {
        window.alert('Failed to update database.');
      }
    } catch (error) {
      console.error('Error deleting selected feedback:', error);
      window.alert('Error deleting feedback. Please try again.');
    }
  };

  const handleClearAllFeedback = async () => {
    if (!confirm(`Are you sure you want to clear all ${comments.length} feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      // Clear feedback from local state
      setComments([]);
      setSelectedComment(null);

      // Clear from database
      const updateFields: any = {
        lastClearedAt: new Date().toISOString()
      };

      if (isAIGeneratedDoc) {
        updateFields.crmFeedback = [];
        updateFields.draftFeedback = [];
      } else {
        updateFields.draftFeedback = [];
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      if (response.ok) {
        window.alert('All feedback has been cleared successfully.');
      } else {
        window.alert('Failed to clear feedback from database.');
      }
    } catch (error) {
      console.error('Error clearing feedback:', error);
      window.alert('Error clearing feedback. Please try again.');
    }
  };

  return {
    selectedComment,
    currentComment,
    setCurrentComment,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleSelectComment,
    handleToggleSelect,
    handleClearSelectedFeedback,
    handleClearAllFeedback
  };
};