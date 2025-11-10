import { useState, useCallback } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment } from './types';

// Helper function to renumber paragraphs after deletion
const renumberParagraphsAfterDeletion = (content: string, deletedParagraphNum: string): string => {
  const parts = deletedParagraphNum.split('.').map(n => parseInt(n));
  const prefix = parts.slice(0, -1).join('.');
  const deletedNum = parts[parts.length - 1];

  console.log('Renumbering paragraphs with prefix:', prefix, 'after deleting number:', deletedNum);

  const renumberMap = new Map<string, string>();
  const pattern = new RegExp(`<p[^>]*>\\s*(?:<strong>)?(${prefix.replace(/\./g, '\\.')}\\.\\d+)(?:</strong>)?`, 'gi');

  let updatedContent = content;
  const matches = Array.from(content.matchAll(pattern));

  matches.forEach(match => {
    const fullNum = match[1];
    const numParts = fullNum.split('.').map(n => parseInt(n));
    const lastNum = numParts[numParts.length - 1];

    if (lastNum > deletedNum) {
      const newNum = lastNum - 1;
      const newFullNum = [...numParts.slice(0, -1), newNum].join('.');
      renumberMap.set(fullNum, newFullNum);
    }
  });

  renumberMap.forEach((newNum, oldNum) => {
    const escapedOld = oldNum.replace(/\./g, '\\.');
    const patterns = [
      // Match and remove optional period before </strong>
      new RegExp(`(<p[^>]*>\\s*<strong>)${escapedOld}\\.?(</strong>)`, 'gi'),
      new RegExp(`(<p[^>]*>\\s*)${escapedOld}\\.?(\\s)`, 'gi')
    ];

    patterns.forEach(pattern => {
      updatedContent = updatedContent.replace(pattern, `$1${newNum}$2`);
    });
  });

  console.log('Renumbering complete. Changed:', renumberMap.size, 'paragraphs');
  return updatedContent;
};

interface UseOPRFeedbackHandlersProps {
  documentId: string;
  feedback: CRMComment[];
  setFeedback: (feedback: CRMComment[]) => void;
  editableContent: string;
  setEditableContent: (content: string) => void;
  setDocumentContent: (content: string) => void;
  saveToHistory: (changes?: Map<string, any>) => void;
  setDocumentData: (data: any) => void;
}

export const useOPRFeedbackHandlers = ({
  documentId,
  feedback,
  setFeedback,
  editableContent,
  setEditableContent,
  setDocumentContent,
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
    if (!selectedFeedback) return;

    const appliedChanges = new Map();
    const isDeletion = !selectedFeedback.changeTo || !selectedFeedback.changeTo.trim();

    if (mergeMode === 'manual') {
      let updatedContent = editableContent;

      // Handle deletions with markers and renumbering
      if (isDeletion && selectedFeedback.changeFrom) {
        console.log('[MERGE] Processing deletion for:', selectedFeedback.id);

        // Auto-detect paragraph number if not set
        let detectedParagraphNum = selectedFeedback.paragraphNumber;
        if (!detectedParagraphNum) {
          const paragraphMatch = selectedFeedback.changeFrom.match(/^(\d+(?:\.\d+)+)/);
          if (paragraphMatch) {
            detectedParagraphNum = paragraphMatch[1];
            console.log('[MERGE] Auto-detected paragraph number:', detectedParagraphNum);
          }
        }

        // Create restoration marker
        const markerId = `RESTORE_${selectedFeedback.id || Date.now()}`;
        let replacementMade = false;

        // Try to find and delete the paragraph
        if (detectedParagraphNum) {
          const escapedNum = detectedParagraphNum.replace(/\./g, '\\.');
          const patterns = [
            new RegExp(`<p[^>]*>\\s*<strong>${escapedNum}</strong>\\s*[\\s\\S]*?</p>`, 'i'),
            new RegExp(`<p[^>]*>\\s*<strong>${escapedNum}\\.?</strong>\\s*[\\s\\S]*?</p>`, 'i'),
            new RegExp(`<p[^>]*>\\s*${escapedNum}\\s+[\\s\\S]*?</p>`, 'i')
          ];

          for (const pattern of patterns) {
            const match = updatedContent.match(pattern);
            if (match) {
              const deletedParagraphHTML = match[0];
              const fullHtmlEncoded = btoa(encodeURIComponent(deletedParagraphHTML));
              const enhancedMarker = `<!--${markerId}:${fullHtmlEncoded}-->`;
              updatedContent = updatedContent.replace(pattern, enhancedMarker);
              replacementMade = true;
              console.log('[MERGE] Deleted paragraph and inserted marker');
              break;
            }
          }

          if (replacementMade) {
            // Renumber paragraphs after deletion
            updatedContent = renumberParagraphsAfterDeletion(updatedContent, detectedParagraphNum);
            console.log('[MERGE] Renumbered paragraphs after deletion');
          }
        }

        if (replacementMade) {
          setEditableContent(updatedContent);
          setDocumentContent(updatedContent);
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
                  content: updatedContent,
                  htmlContent: updatedContent,
                  customFields: {
                    editableContent: updatedContent,
                    htmlContent: updatedContent,
                    content: updatedContent,
                    crmFeedback: updatedFeedback,
                    draftFeedback: updatedFeedback,
                    crmComments: updatedFeedback,
                    commentMatrix: updatedFeedback,
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
              console.log('[MERGE] ✅ Deletion saved to database');
            }
          } catch (error) {
            console.error('[MERGE] Error saving deletion:', error);
          }
        }

        setSelectedFeedback(null);
        saveToHistory(appliedChanges);
        return;
      }

      // Handle modifications/replacements

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
        setDocumentContent(updatedContent);
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
            setDocumentContent(enhancedContent);
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
    console.log('[ACCEPT ALL] Total feedback items:', feedback.length);
    console.log('[ACCEPT ALL] Feedback status breakdown:', feedback.map(f => ({ id: f.id, status: f.status, changeFrom: f.changeFrom?.substring(0, 50) })));

    // Process ALL non-critical items that are pending
    const applicableItems = feedback.filter(f =>
      f.commentType !== 'C' && (!f.status || f.status === 'pending')
    );
    const criticalCount = feedback.filter(f => f.commentType === 'C').length;

    console.log('[ACCEPT ALL] Applicable items count:', applicableItems.length);
    console.log('[ACCEPT ALL] Critical count:', criticalCount);

    if (criticalCount > 0) {
      console.log('[ACCEPT ALL] Warning: Skipping', criticalCount, 'critical items');
    }

    console.log('[ACCEPT ALL] Processing', applicableItems.length, 'feedback items');

    let updatedContent = editableContent;
    let updatedFeedbackList = [...feedback];
    let processedCount = 0;

    for (const item of applicableItems) {
      const isDeletion = !item.changeTo || !item.changeTo.trim();

      if (isDeletion && item.changeFrom) {
        console.log('[ACCEPT ALL] Processing deletion for item:', item.id);
        console.log('[ACCEPT ALL] changeFrom:', item.changeFrom?.substring(0, 100));
        console.log('[ACCEPT ALL] paragraphNumber field:', item.paragraphNumber);

        // Auto-detect paragraph number if not set
        let detectedParagraphNum = item.paragraphNumber;
        if (!detectedParagraphNum) {
          const paragraphMatch = item.changeFrom.match(/^(\d+(?:\.\d+)+)/);
          if (paragraphMatch) {
            detectedParagraphNum = paragraphMatch[1];
            console.log('[ACCEPT ALL] Auto-detected paragraph number from changeFrom:', detectedParagraphNum);
          } else {
            // Try to find the text in the document and extract the paragraph number
            console.log('[ACCEPT ALL] Attempting to find paragraph number by searching for text in document...');
            const textToFind = item.changeFrom.trim();
            const textIndex = updatedContent.indexOf(textToFind);
            if (textIndex !== -1) {
              // Found the text, now look backwards to find the paragraph number
              const beforeText = updatedContent.substring(Math.max(0, textIndex - 300), textIndex);
              // Look for pattern like <strong>1.1.1.4</strong> or <strong>1.1.1.4 </strong>
              const strongMatch = beforeText.match(/<strong>(\d+(?:\.\d+)+)\s*<\/strong>\s*$/);
              if (strongMatch) {
                detectedParagraphNum = strongMatch[1];
                console.log('[ACCEPT ALL] ✅ Auto-detected paragraph number by searching document:', detectedParagraphNum);
              } else {
                console.log('[ACCEPT ALL] ❌ Found text but could not extract paragraph number from surrounding HTML');
              }
            } else {
              console.log('[ACCEPT ALL] ❌ Could not find text in document');
            }
          }
        } else {
          console.log('[ACCEPT ALL] Using paragraph number from field:', detectedParagraphNum);
        }

        // Create restoration marker
        const markerId = `RESTORE_${item.id || Date.now()}`;
        let replacementMade = false;

        // SEARCH BY TEXT CONTENT, NOT PARAGRAPH NUMBER
        // Paragraph numbers change after each deletion due to renumbering
        const textToFind = item.changeFrom.trim();
        console.log('[ACCEPT ALL] Searching for text:', textToFind.substring(0, 50));

        // Find the paragraph containing this text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedContent;
        const allParagraphs = tempDiv.querySelectorAll('p');

        for (const p of allParagraphs) {
          const pText = p.textContent?.trim() || '';
          // Remove the paragraph number from the text for comparison
          const pTextWithoutNumber = pText.replace(/^\d+(?:\.\d+)*\s*/, '').trim();

          if (pTextWithoutNumber === textToFind || pText.includes(textToFind)) {
            const deletedParagraphHTML = p.outerHTML;
            const fullHtmlEncoded = btoa(encodeURIComponent(deletedParagraphHTML));
            const enhancedMarker = `<!--${markerId}:${fullHtmlEncoded}-->`;
            updatedContent = updatedContent.replace(deletedParagraphHTML, enhancedMarker);
            replacementMade = true;
            console.log('[ACCEPT ALL] ✅ Deleted paragraph by text content');
            processedCount++;
            // DON'T renumber here - will do it once at the end for all deletions
            break;
          }
        }

        if (!replacementMade) {
          console.log('[ACCEPT ALL] ❌ Could not find text in any paragraph');
        }

        // Mark as merged
        updatedFeedbackList = updatedFeedbackList.map(f =>
          f.id === item.id ? { ...f, status: 'merged' as const } : f
        );
      } else if (item.changeFrom && item.changeTo) {
        // Handle modifications/replacements
        console.log('[ACCEPT ALL] Processing modification for item:', item.id);
        updatedContent = updatedContent.replace(item.changeFrom, item.changeTo);
        processedCount++;

        // Mark as merged
        updatedFeedbackList = updatedFeedbackList.map(f =>
          f.id === item.id ? { ...f, status: 'merged' as const } : f
        );
      }
    }

    // Renumber ALL paragraphs once at the end (not after each deletion)
    // Use the autoRenumberParagraphs utility for clean renumbering
    console.log('[ACCEPT ALL] Renumbering all paragraphs...');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = updatedContent;
    const allParas = tempDiv.querySelectorAll('p');

    // Group paragraphs by prefix
    const paraGroups = new Map<string, Array<{elem: HTMLParagraphElement, idx: number}>>();
    allParas.forEach((p, idx) => {
      const strong = p.querySelector('strong');
      if (strong) {
        // Extract only the digits and dots, ignore any other characters
        const rawNum = (strong.textContent || '').trim();
        const cleanedNum = rawNum.replace(/[^\d.]/g, '').replace(/\.+$/, ''); // Remove trailing periods and non-numeric chars
        const match = cleanedNum.match(/^(\d+(?:\.\d+)+)$/);
        if (match) {
          const parts = match[1].split('.');
          if (parts.length >= 3) {
            const prefix = parts.slice(0, -1).join('.');
            if (!paraGroups.has(prefix)) paraGroups.set(prefix, []);
            paraGroups.get(prefix)!.push({elem: p as HTMLParagraphElement, idx});
          }
        }
      }
    });

    // Renumber each group
    paraGroups.forEach((paras, prefix) => {
      paras.forEach((info, newIdx) => {
        const newNum = `${prefix}.${newIdx + 1}`;
        const text = info.elem.textContent?.replace(/^[\d.\s]+/, '').trim() || '';
        const style = info.elem.getAttribute('style') || '';
        info.elem.innerHTML = `<strong>${newNum}</strong> ${text}`;
        if (style) info.elem.setAttribute('style', style);
      });
    });

    updatedContent = tempDiv.innerHTML;
    console.log('[ACCEPT ALL] ✅ Renumbering complete');

    // Update state immediately - IMPORTANT: Update BOTH editableContent AND documentContent!
    // DocumentViewer uses documentContent as first priority, so we must update both
    setEditableContent(updatedContent);
    setDocumentContent(updatedContent);
    setFeedback(updatedFeedbackList);

    console.log('[ACCEPT ALL] ✅ Updated UI state with new content, length:', updatedContent.length);
    console.log('[ACCEPT ALL] ✅ Both editableContent and documentContent updated');

    // Save to database
    try {
      const payloadToSave = {
        customFields: {
          editableContent: updatedContent,
          htmlContent: updatedContent,
          content: updatedContent,
          crmFeedback: updatedFeedbackList,
          draftFeedback: updatedFeedbackList,
          crmComments: updatedFeedbackList,
          commentMatrix: updatedFeedbackList,
          lastEditedAt: new Date().toISOString()
        },
      };

      console.log('[ACCEPT ALL] 📤 Saving to database...');
      console.log('[ACCEPT ALL] 📤 Payload customFields keys:', Object.keys(payloadToSave.customFields));
      console.log('[ACCEPT ALL] 📤 Content length:', updatedContent.length);
      console.log('[ACCEPT ALL] 📤 Content preview (first 200 chars):', updatedContent.substring(0, 200));
      console.log('[ACCEPT ALL] 📤 Feedback count:', updatedFeedbackList.length);

      const saveResponse = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payloadToSave),
        }
      );

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        console.log('[ACCEPT ALL] ✅ Saved to database, response:', savedData);

        // Update document data with new content
        setDocumentData((prevData: any) => ({
          ...prevData,
          customFields: {
            ...prevData?.customFields,
            editableContent: updatedContent,
            htmlContent: updatedContent,
            content: updatedContent,
            crmFeedback: updatedFeedbackList,
            draftFeedback: updatedFeedbackList,
            crmComments: updatedFeedbackList,
            commentMatrix: updatedFeedbackList,
          },
        }));

        console.log('[ACCEPT ALL] ✅ UI state updated with new content and feedback');

        // Save to history AFTER successful database save (not before)
        // This ensures version history doesn't overwrite the changes
        setTimeout(() => {
          saveToHistory();
        }, 100);
      } else {
        const errorText = await saveResponse.text();
        console.error('[ACCEPT ALL] ❌ Failed to save, status:', saveResponse.status, 'error:', errorText);
        alert('Changes applied but failed to save to database');
      }
    } catch (error) {
      console.error('[ACCEPT ALL] Error saving:', error);
      alert('Error saving changes to database');
    }
  }, [feedback, editableContent, setEditableContent, setFeedback, documentId, setDocumentData, saveToHistory]);

  const handleRejectAllChanges = useCallback(async () => {
    console.log('[REJECT ALL] Starting. Total feedback items:', feedback.length);
    console.log('[REJECT ALL] Current statuses:', feedback.map(f => ({ id: f.id, status: f.status || 'no-status' })));

    // Mark all pending items as rejected (don't remove them, just change status)
    const updatedFeedback = feedback.map(f => {
      const isRejectable = !f.status || f.status === 'pending';
      console.log(`[REJECT ALL] Item ${f.id}: status="${f.status}", isRejectable=${isRejectable}`);
      return isRejectable ? { ...f, status: 'rejected' as const } : f;
    });

    console.log('[REJECT ALL] After update:', updatedFeedback.map(f => ({ id: f.id, status: f.status })));
    console.log('[REJECT ALL] Rejected count:', updatedFeedback.filter(f => f.status === 'rejected').length);

    setFeedback(updatedFeedback);

    // Save to database
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            crmFeedback: updatedFeedback,
            draftFeedback: updatedFeedback,
            crmComments: updatedFeedback,
            commentMatrix: updatedFeedback,
            lastEditedAt: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('[REJECT ALL] ✅ Saved to database');
        setDocumentData((prevData: any) => ({
          ...prevData,
          customFields: {
            ...prevData?.customFields,
            crmFeedback: updatedFeedback,
            draftFeedback: updatedFeedback,
            crmComments: updatedFeedback,
            commentMatrix: updatedFeedback,
          },
        }));
      } else {
        console.error('[REJECT ALL] ❌ Failed to save to database');
      }
    } catch (error) {
      console.error('[REJECT ALL] Error saving:', error);
    }

    saveToHistory();
  }, [feedback, setFeedback, documentId, setDocumentData, saveToHistory]);

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