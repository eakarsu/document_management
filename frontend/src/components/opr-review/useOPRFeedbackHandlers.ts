import { useState, useCallback } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment } from './types';

interface UseOPRFeedbackHandlersProps {
  documentId: string;
  feedback: CRMComment[];
  setFeedback: (feedback: CRMComment[]) => void;
  editableContent: string;
  setEditableContent: (content: string) => void;
  saveToHistory: (changes?: Map<string, any>) => void;
  setDocumentData: (data: any) => void;
}

export const useOPRFeedbackHandlers = ({
  documentId,
  feedback,
  setFeedback,
  editableContent,
  setEditableContent,
  saveToHistory,
  setDocumentData,
}: UseOPRFeedbackHandlersProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<CRMComment | null>(null);
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<Set<string>>(new Set());
  const [mergeMode, setMergeMode] = useState<'manual' | 'ai' | 'hybrid'>('manual');

  const handleFeedbackClick = useCallback((comment: CRMComment) => {
    setSelectedFeedback(comment);
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(feedback.map(f => f.id).filter(Boolean) as string[]);
    setSelectedFeedbackIds(allIds);
  }, [feedback]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedFeedbackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleMergeModeChange = useCallback((
    event: React.MouseEvent<HTMLElement>,
    newMode: 'manual' | 'ai' | 'hybrid' | null
  ) => {
    if (newMode) {
      setMergeMode(newMode);
    }
  }, []);

  const handleClearSelectedFeedback = useCallback(async () => {
    const feedbackToClear = Array.from(selectedFeedbackIds);
    const updatedFeedback = feedback.filter(f => !feedbackToClear.includes(f.id || ''));
    setFeedback(updatedFeedback);
    setSelectedFeedbackIds(new Set());

    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/opr-review/feedback`,
        {
          method: 'PUT',
          body: JSON.stringify({ feedback: updatedFeedback }),
        }
      );

      if (!response.ok) {
        console.error('Failed to clear selected feedback');
      }
    } catch (error) {
      console.error('Error clearing selected feedback:', error);
    }

    saveToHistory();
  }, [documentId, feedback, selectedFeedbackIds, setFeedback, saveToHistory]);

  const handleClearAllFeedback = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all feedback? This action cannot be undone.')) {
      return;
    }

    setFeedback([]);
    setSelectedFeedbackIds(new Set());

    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/opr-review/feedback`,
        {
          method: 'PUT',
          body: JSON.stringify({ feedback: [] }),
        }
      );

      if (!response.ok) {
        console.error('Failed to clear all feedback');
      }
    } catch (error) {
      console.error('Error clearing all feedback:', error);
    }

    saveToHistory();
  }, [documentId, setFeedback, saveToHistory]);

  const handleMergeFeedback = useCallback(async () => {
    if (!selectedFeedback || !selectedFeedback.changeTo) return;

    const appliedChanges = new Map();

    if (mergeMode === 'manual') {
      let updatedContent = editableContent;

      // Use paragraph number to locate and replace text
      if (selectedFeedback.paragraphNumber) {
        console.log('Using paragraph number for replacement:', selectedFeedback.paragraphNumber);

        // Find paragraph by number in the document
        const paragraphRegex = new RegExp(
          `(${selectedFeedback.paragraphNumber.replace(/\./g, '\\.')}\\s+.*?)(?=\\d+(?:\\.\\d+)+\\s+|$)`,
          's'
        );

        const match = editableContent.match(paragraphRegex);

        if (match && match[0].includes(selectedFeedback.changeFrom)) {
          // Replace text only within this paragraph
          const updatedParagraph = match[0].replace(
            selectedFeedback.changeFrom,
            selectedFeedback.changeTo
          );
          updatedContent = editableContent.replace(match[0], updatedParagraph);
          console.log('✓ Replaced text in paragraph', selectedFeedback.paragraphNumber);
        } else {
          console.warn('Could not find text in paragraph', selectedFeedback.paragraphNumber, '- falling back to simple replace');
          // Fallback to simple replace if paragraph not found
          updatedContent = editableContent.replace(
            selectedFeedback.changeFrom,
            selectedFeedback.changeTo
          );
        }
      } else {
        console.warn('No paragraph number available - using simple text replace');
        // Fallback to simple replace if no paragraph number
        updatedContent = editableContent.replace(
          selectedFeedback.changeFrom,
          selectedFeedback.changeTo
        );
      }

      if (updatedContent !== editableContent) {
        appliedChanges.set(`change-${Date.now()}`, {
          original: selectedFeedback.changeFrom,
          changed: selectedFeedback.changeTo,
          feedbackId: selectedFeedback.id || '',
          paragraphNumber: selectedFeedback.paragraphNumber,
        });

        setEditableContent(updatedContent);
        const updatedFeedback = feedback.map((f) =>
          f.id === selectedFeedback.id ? { ...f, status: 'merged' as const } : f
        );
        setFeedback(updatedFeedback);

        try {
          const saveResponse = await authTokenService.authenticatedFetch(
            `/api/documents/${documentId}`,
            {
              method: 'PATCH',
              body: JSON.stringify({
                customFields: {
                  editableContent: updatedContent,
                },
              }),
            }
          );

          if (saveResponse.ok) {
            setDocumentData((prevData: any) => ({
              ...prevData,
              customFields: {
                ...prevData?.customFields,
                editableContent: updatedContent,
              },
            }));
          }
        } catch (error) {
          console.error('Error saving merged content:', error);
        }
      }
    } else if (mergeMode === 'ai' || mergeMode === 'hybrid') {
      const changesText = `Please apply the following change to the document:
Change from: "${selectedFeedback.changeFrom}"
Change to: "${selectedFeedback.changeTo}"
Coordinator Comment: ${selectedFeedback.coordinatorComment}
Justification: ${selectedFeedback.coordinatorJustification}`;

      try {
        const response = await authTokenService.authenticatedFetch(
          '/api/ai-workflow/enhance-content',
          {
            method: 'POST',
            body: JSON.stringify({
              content: editableContent,
              prompt: changesText,
              documentType: 'DAF Form',
            }),
          }
        );

        if (response.ok) {
          const { enhancedContent } = await response.json();
          if (enhancedContent && enhancedContent !== editableContent) {
            appliedChanges.set(`change-${Date.now()}`, {
              original: selectedFeedback.changeFrom,
              changed: selectedFeedback.changeTo,
              feedbackId: selectedFeedback.id || '',
            });

            setEditableContent(enhancedContent);
            const updatedFeedback = feedback.map((f) =>
              f.id === selectedFeedback.id ? { ...f, status: 'merged' as const } : f
            );
            setFeedback(updatedFeedback);

            const saveResponse = await authTokenService.authenticatedFetch(
              `/api/documents/${documentId}`,
              {
                method: 'PATCH',
                body: JSON.stringify({
                  customFields: {
                    editableContent: enhancedContent,
                  },
                }),
              }
            );

            if (saveResponse.ok) {
              setDocumentData((prevData: any) => ({
                ...prevData,
                customFields: {
                  ...prevData?.customFields,
                  editableContent: enhancedContent,
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error('AI merge failed, falling back to manual:', error);
        return handleMergeFeedback();
      }
    }

    saveToHistory(appliedChanges);
    setSelectedFeedback(null);
  }, [
    selectedFeedback,
    mergeMode,
    editableContent,
    feedback,
    documentId,
    setEditableContent,
    setFeedback,
    setDocumentData,
    saveToHistory,
  ]);

  const handleAcceptAllChanges = useCallback(async () => {
    if (confirm('Accept all pending changes? This will apply all feedback items.')) {
      for (const item of feedback) {
        if (item.status === 'pending' && item.changeTo) {
          setSelectedFeedback(item);
          await handleMergeFeedback();
        }
      }
      saveToHistory();
    }
  }, [feedback, handleMergeFeedback, saveToHistory]);

  const handleRejectAllChanges = useCallback(() => {
    if (confirm('Reject all pending changes? This will remove all pending feedback items.')) {
      const acceptedFeedback = feedback.filter(f => f.status !== 'pending');
      setFeedback(acceptedFeedback);
      saveToHistory();
    }
  }, [feedback, setFeedback, saveToHistory]);

  return {
    selectedFeedback,
    setSelectedFeedback,
    selectedFeedbackIds,
    setSelectedFeedbackIds,
    mergeMode,
    setMergeMode,
    handleFeedbackClick,
    handleSelectAll,
    handleToggleSelect,
    handleMergeModeChange,
    handleClearSelectedFeedback,
    handleClearAllFeedback,
    handleMergeFeedback,
    handleAcceptAllChanges,
    handleRejectAllChanges,
  };
};