import { useState, useRef, useCallback } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment, HistoryEntry, DocumentData, ChangeMarker } from './types';

interface UseOPRReviewHistoryProps {
  documentId: string;
  documentData: DocumentData | null;
  setDocumentData: (data: DocumentData | null | ((prev: DocumentData | null) => DocumentData | null)) => void;
  feedback: CRMComment[];
  setFeedback: (feedback: CRMComment[]) => void;
  editableContent: string;
  setEditableContent: (content: string) => void;
  documentContent: string;
}

export const useOPRReviewHistory = ({
  documentId,
  documentData,
  setDocumentData,
  feedback,
  setFeedback,
  editableContent,
  setEditableContent,
  documentContent,
}: UseOPRReviewHistoryProps) => {
  const [changeHistory, setChangeHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [changeMarkers, setChangeMarkers] = useState<ChangeMarker[]>([]);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const changeHistoryRef = useRef<HistoryEntry[]>([]);

  const saveToHistory = useCallback(async (
    newAppliedChanges?: Map<string, { original: string, changed: string, feedbackId: string }>
  ) => {
    const changesToSave = newAppliedChanges || new Map();
    const currentHistoryFromRef = changeHistoryRef.current;

    let updatedHistory: HistoryEntry[] = [];

    setChangeHistory(currentHistory => {
      let historyToUpdate = [...currentHistoryFromRef];

      if (historyToUpdate.length === 0) {
        const originalVersion = {
          content: documentContent || editableContent,
          feedback: feedback.filter(f => f.status !== 'merged'),
          timestamp: new Date(),
          changes: {
            applied: 0,
            merged: 0,
            details: []
          }
        };
        historyToUpdate = [originalVersion];
      }

      const newHistoryEntry = {
        content: editableContent,
        feedback: [...feedback],
        timestamp: new Date(),
        changes: {
          applied: changesToSave.size,
          merged: feedback.filter(f => f.status === 'merged').length,
          details: Array.from(changesToSave.entries()).map(([id, change]) => ({
            id,
            original: change.original,
            changed: change.changed,
            feedbackId: change.feedbackId
          }))
        }
      };

      const newHistory = [...historyToUpdate, newHistoryEntry];
      setHistoryIndex(newHistory.length - 1);
      console.log('History updated:', currentHistory.length, '->', newHistory.length);

      updatedHistory = newHistory;
      return newHistory;
    });

    try {
      console.log('Saving version history to database. History length:', updatedHistory.length);
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            ...documentData?.customFields,
            versionHistory: updatedHistory,
            lastHistorySave: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('Version history saved successfully');
        setDocumentData(prevData => ({
          ...prevData!,
          customFields: {
            ...prevData?.customFields,
            versionHistory: updatedHistory,
            lastHistorySave: new Date().toISOString()
          }
        }));
      } else {
        console.error('Failed to save version history:', response.status);
      }
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  }, [documentId, documentData, documentContent, editableContent, feedback, setDocumentData]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = changeHistory[historyIndex - 1];
      setEditableContent(prevState.content);
      setFeedback(prevState.feedback);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, changeHistory, setEditableContent, setFeedback]);

  const handleRedo = useCallback(() => {
    if (historyIndex < changeHistory.length - 1) {
      const nextState = changeHistory[historyIndex + 1];
      setEditableContent(nextState.content);
      setFeedback(nextState.feedback);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, changeHistory, setEditableContent, setFeedback]);

  const scrollToChange = useCallback((marker: ChangeMarker) => {
    const element = document.getElementById(`change-${marker.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'pulse 2s';
      setTimeout(() => {
        element.style.animation = '';
      }, 2000);
    }
  }, []);

  const navigateToNextChange = useCallback(() => {
    if (changeMarkers.length > 0) {
      const nextIndex = (currentChangeIndex + 1) % changeMarkers.length;
      setCurrentChangeIndex(nextIndex);
      scrollToChange(changeMarkers[nextIndex]);
    }
  }, [changeMarkers, currentChangeIndex, scrollToChange]);

  const navigateToPreviousChange = useCallback(() => {
    if (changeMarkers.length > 0) {
      const prevIndex = currentChangeIndex === 0 ? changeMarkers.length - 1 : currentChangeIndex - 1;
      setCurrentChangeIndex(prevIndex);
      scrollToChange(changeMarkers[prevIndex]);
    }
  }, [changeMarkers, currentChangeIndex, scrollToChange]);

  return {
    changeHistory,
    setChangeHistory,
    historyIndex,
    setHistoryIndex,
    changeMarkers,
    setChangeMarkers,
    currentChangeIndex,
    setCurrentChangeIndex,
    saveToHistory,
    handleUndo,
    handleRedo,
    navigateToNextChange,
    navigateToPreviousChange,
    changeHistoryRef,
  };
};