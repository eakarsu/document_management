import { useState, useRef, useCallback } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment, HistoryEntry, DocumentData, ChangeMarker } from './types';

// Helper to show change tooltip
const showChangeTooltip = (element: HTMLElement, changeFrom: string, changeTo: string) => {
  // Remove any existing tooltip
  const existingTooltip = document.getElementById('change-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'change-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.backgroundColor = '#333';
  tooltip.style.color = 'white';
  tooltip.style.padding = '12px 16px';
  tooltip.style.borderRadius = '8px';
  tooltip.style.maxWidth = '400px';
  tooltip.style.zIndex = '10000';
  tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  tooltip.style.fontSize = '13px';
  tooltip.style.lineHeight = '1.5';

  // Create content
  const isDeletion = !changeTo || !changeTo.trim();
  tooltip.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong style="color: #ff6b6b;">${isDeletion ? 'Delete:' : 'Original:'}</strong><br/>
      <span style="background-color: rgba(255,107,107,0.2); padding: 2px 4px; border-radius: 3px;">${changeFrom || '(empty)'}</span>
    </div>
    ${!isDeletion ? `
    <div>
      <strong style="color: #51cf66;">Change to:</strong><br/>
      <span style="background-color: rgba(81,207,102,0.2); padding: 2px 4px; border-radius: 3px;">${changeTo}</span>
    </div>
    ` : ''}
  `;

  // Position tooltip near the element
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom + 10}px`;

  document.body.appendChild(tooltip);

  // Remove tooltip after 5 seconds
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.remove();
    }
  }, 5000);
};

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
            // ONLY send versionHistory and lastHistorySave - do NOT spread all customFields
            // to avoid overwriting other fields with stale data
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
    // Find and show inline diff: strikethrough original + highlighted new text
    if (marker.location && marker.changeFrom) {
      const paragraphs = document.querySelectorAll('p');
      for (const p of paragraphs) {
        const text = p.textContent?.trim() || '';
        if (text.includes(marker.location)) {
          // Scroll to the paragraph
          p.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Find the specific text node containing the change
          const walker = document.createTreeWalker(
            p,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while (node = walker.nextNode()) {
            const nodeText = node.textContent || '';
            const changeFromText = marker.changeFrom || '';

            if (nodeText.includes(changeFromText)) {
              const parentElement = node.parentElement;

              if (parentElement) {
                const startIndex = nodeText.indexOf(changeFromText);
                if (startIndex !== -1) {
                  const range = document.createRange();
                  range.setStart(node, startIndex);
                  range.setEnd(node, startIndex + changeFromText.length);

                  // Create container for the diff visualization
                  const container = document.createElement('span');
                  container.className = 'change-diff-container';

                  const isDeletion = !marker.changeTo || !marker.changeTo.trim();

                  if (isDeletion) {
                    // Show only strikethrough for deletion
                    container.innerHTML = `<span style="background-color: #ffe0e0; text-decoration: line-through; color: #d32f2f; padding: 2px 4px; border-radius: 3px;">${changeFromText}</span>`;
                  } else {
                    // Show strikethrough original + green new text
                    container.innerHTML = `<span style="background-color: #ffe0e0; text-decoration: line-through; color: #d32f2f; padding: 2px 4px; border-radius: 3px; margin-right: 4px;">${changeFromText}</span><span style="background-color: #c8f0c8; color: #2e7d32; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${marker.changeTo}</span>`;
                  }

                  range.deleteContents();
                  range.insertNode(container);

                  // Remove diff visualization after 5 seconds
                  setTimeout(() => {
                    if (container.parentNode) {
                      const parent = container.parentNode;

                      if (isDeletion) {
                        // For deletion, restore original text
                        const textNode = document.createTextNode(changeFromText);
                        parent.insertBefore(textNode, container);
                      } else {
                        // For modification, restore original text
                        const textNode = document.createTextNode(changeFromText);
                        parent.insertBefore(textNode, container);
                      }

                      parent.removeChild(container);
                      parent.normalize();
                    }
                  }, 5000);

                  return;
                }
              }
            }
          }

          // Fallback: highlight whole paragraph if specific text not found
          (p as HTMLElement).style.backgroundColor = '#ffeb3b';
          (p as HTMLElement).style.transition = 'background-color 2s';
          setTimeout(() => {
            (p as HTMLElement).style.backgroundColor = '';
          }, 2000);
          return;
        }
      }
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