'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '@/lib/authTokenService';
import CollectedFeedbackView from '@/components/workflow/CollectedFeedbackView';
import OPRFeedbackProcessorV2Enhanced from '@/components/feedback/OPRFeedbackProcessorV2Enhanced';
import OPRReviewHeader from '@/components/opr-review/OPRReviewHeader';
import DocumentViewer from '@/components/opr-review/DocumentViewer';
import FeedbackControlPanel from '@/components/opr-review/FeedbackControlPanel';
import { useOPRDocument } from '@/components/opr-review/useOPRDocument';
import { useOPRReviewHistory } from '@/components/opr-review/useOPRReviewHistory';
import { useOPRFeedbackHandlers } from '@/components/opr-review/useOPRFeedbackHandlers';
import { CRMComment, CommentThread } from '@/components/opr-review/types';
import { autoRenumberParagraphs } from '@/utils/autoRenumberParagraphs';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Checkbox,
} from '@mui/material';
import {
  Send as SendIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  AutoAwesome as GenerateAIIcon,
} from '@mui/icons-material';

const OPRReviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const [componentKey, setComponentKey] = useState(0);

  // Document state and handlers
  const {
    documentData,
    setDocumentData,
    documentContent,
    setDocumentContent,
    editableContent,
    setEditableContent,
    feedback,
    setFeedback,
    isEditingDocument,
    setIsEditingDocument,
    savingDocument,
    exporting,
    loading,
    handleSaveDocument,
    handleExport,
    fetchDocumentAndFeedback,
  } = useOPRDocument(documentId);

  // History management
  const historyProps = useOPRReviewHistory({
    documentId,
    documentData,
    setDocumentData,
    feedback,
    setFeedback,
    editableContent,
    setEditableContent,
    documentContent,
  });

  // Feedback handlers
  const feedbackHandlers = useOPRFeedbackHandlers({
    documentId,
    feedback,
    setFeedback,
    editableContent,
    setEditableContent,
    setDocumentContent,
    saveToHistory: historyProps.saveToHistory,
    setDocumentData,
  });

  // AUTO-NUMBER ALL PARAGRAPHS - Fix duplicates and renumber sequentially
  const autoNumberAllParagraphs = (content: string): string => {
    console.log('=== AUTO-NUMBERING ALL PARAGRAPHS ===');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Get all elements (headings and paragraphs) to understand structure
    const allElements = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p'));

    // Track all paragraphs with their positions in document
    interface ParagraphInfo {
      element: HTMLParagraphElement;
      position: number;
      prefix: string;
      oldNumber: string;
    }

    const paragraphGroups = new Map<string, ParagraphInfo[]>();

    allElements.forEach((elem, position) => {
      if (elem.tagName === 'P') {
        const p = elem as HTMLParagraphElement;

        // Try to find number in multiple ways:
        // 1. Inside a <strong> tag
        // 2. At the start of paragraph text (plain text)
        let num = '';
        const pText = p.textContent || '';

        // First, try to find <strong> tag
        const strong = p.querySelector('strong');
        if (strong) {
          num = strong.textContent || '';
        } else {
          // No strong tag, check if paragraph starts with a number pattern
          // Match patterns like "1.1.1.1.1.1." or "1.1.1.1.1.1 " (with dot or space after)
          const textMatch = pText.match(/^(\d+(?:\.\d+){2,})\.?\s/);
          if (textMatch) {
            num = textMatch[1] + '.';
          }
        }

        if (num) {
          // Match any valid number pattern (1.1.1, 1.1.1.1, 1.1.1.1.1, etc.)
          const match = num.match(/^(\d+(?:\.\d+)+)\.?$/);
          if (match) {
            const fullNumber = match[1];
            const parts = fullNumber.split('.');

            // Must have at least 3 levels (e.g., 1.1.1)
            if (parts.length >= 3 && parts.every(part => /^\d+$/.test(part))) {
              // Prefix is everything except the last number
              const prefix = parts.slice(0, -1).join('.');

              if (!paragraphGroups.has(prefix)) {
                paragraphGroups.set(prefix, []);
              }

              paragraphGroups.get(prefix)!.push({
                element: p,
                position: position,
                prefix: prefix,
                oldNumber: num
              });
            }
          }
        }
      }
    });

    // Renumber each group sequentially, ensuring document order
    let totalRenumbered = 0;
    paragraphGroups.forEach((paragraphs, prefix) => {
      // Sort by position to ensure document order
      paragraphs.sort((a, b) => a.position - b.position);

      paragraphs.forEach((info, idx) => {
        const p = info.element;
        const newNum = `${prefix}.${idx + 1}.`;

        // Get text content without the number
        const textWithoutNumber = p.textContent?.replace(/^[\d.]+\s*/, '').trim() || '';

        // Preserve existing style attributes
        const existingStyle = p.getAttribute('style') || '';

        // Update paragraph with new number
        p.innerHTML = `<strong>${newNum}</strong> ${textWithoutNumber}`;

        // Restore style if it existed
        if (existingStyle) {
          p.setAttribute('style', existingStyle);
        }

        if (info.oldNumber !== newNum) {
          console.log(`✓ Renumbered: ${info.oldNumber} → ${newNum}`);
          totalRenumbered++;
        }
      });
    });

    console.log(`Auto-numbering complete. Renumbered ${totalRenumbered} paragraphs.`);
    return tempDiv.innerHTML;
  };

  // Helper function to renumber paragraphs after deletion
  const renumberParagraphs = (content: string, deletedParagraphNum: string): string => {
    console.log('=== RENUMBERING PARAGRAPHS (DOWN) ===');
    console.log('Deleted paragraph number:', deletedParagraphNum);

    const deletedParts = deletedParagraphNum.split('.').map(n => parseInt(n));
    const level = deletedParts.length;
    const parentSection = deletedParts.slice(0, -1).join('.');

    console.log('Deleted:', deletedParagraphNum, 'Parent section:', parentSection);

    // Find all paragraph numbers (simple regex matching any number pattern)
    const allNumbersRegex = /(\d+(?:\.\d+)+)/g;
    let updatedContent = content;
    const matches: Array<{number: string, parts: number[]}> = [];

    let match;
    while ((match = allNumbersRegex.exec(content)) !== null) {
      const numberStr = match[1];
      const parts = numberStr.split('.').map(n => parseInt(n));
      matches.push({ number: numberStr, parts });
    }

    console.log('All paragraph numbers found:', matches.map(m => m.number));

    // Find paragraphs in the same parent section at same level
    const siblingsInSection = matches.filter(m => {
      if (m.parts.length !== level) return false;
      const mParent = m.parts.slice(0, -1).join('.');
      return mParent === parentSection;
    });

    console.log('Siblings in section', parentSection + ':', siblingsInSection.map(s => s.number));

    // Renumber all paragraphs that come AFTER the deleted one
    const renumberMap = new Map<string, string>();
    for (const m of siblingsInSection) {
      if (m.parts[level - 1] > deletedParts[level - 1]) {
        const newParts = [...m.parts];
        newParts[level - 1]--;
        const newNumber = newParts.join('.');
        renumberMap.set(m.number, newNumber);
        console.log(`✓ Renumbering: ${m.number} → ${newNumber}`);
      }
    }

    // Apply renumbering - match the number followed by whitespace or end tag
    Array.from(renumberMap.entries()).forEach(([oldNum, newNum]) => {
      const escapedOld = oldNum.replace(/\./g, '\\.');
      // Match the number in various contexts: after tag, with whitespace, etc.
      const replaceRegex = new RegExp(`\\b${escapedOld}\\b`, 'g');
      updatedContent = updatedContent.replace(replaceRegex, newNum);
    });

    console.log('Renumbering complete. Changed:', renumberMap.size, 'paragraphs');
    return updatedContent;
  };

  // Local state
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState(new Map());
  const [showEnhancedProcessor, setShowEnhancedProcessor] = useState(false);
  const [collectedFeedbackDocId, setCollectedFeedbackDocId] = useState<string | null>(null);
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [currentComment, setCurrentComment] = useState<CRMComment>({
    component: '',
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    commentType: 'S' as const,
    page: '',
    paragraphNumber: '',
    lineNumber: '',
    coordinatorComment: '',
    changeFrom: '',
    changeTo: '',
    coordinatorJustification: '',
    resolution: '',
    originatorJustification: ''
  });
  const [showProcessedFeedback, setShowProcessedFeedback] = useState(false);
  const [isGeneratingAIResponse, setIsGeneratingAIResponse] = useState(false);
  const [criticalBlockedItem, setCriticalBlockedItem] = useState<CRMComment | null>(null);
  const [criticalResolution, setCriticalResolution] = useState('');
  const [showRejectedItems, setShowRejectedItems] = useState(false);

  // Update change markers - use ALL feedback items (not just merged)
  // This allows Prev/Next navigation through all feedback locations
  useEffect(() => {
    const markers = feedback.map((f, idx) => ({
      id: f.id || `marker-${idx}`,
      start: 0,
      end: 0,
      location: f.changeFrom?.substring(0, 50) || f.changeTo?.substring(0, 50) || '',
      type: f.changeTo ? 'modification' : 'deletion',
      changeFrom: f.changeFrom || '',
      changeTo: f.changeTo || ''
    }));
    historyProps.setChangeMarkers(markers);
  }, [feedback]);

  // Toggle individual feedback selection
  const toggleFeedbackSelection = (feedbackId: string) => {
    setFeedback(feedback.map(item =>
      item.id === feedbackId ? { ...item, selected: !item.selected } : item
    ));
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setFeedback(feedback.map(item => ({ ...item, selected: newSelectAll })));
  };

  // Apply selected feedback
  const applySelectedFeedback = async () => {
    const selected = feedback.filter((item: any) => item.selected && (!item.status || item.status === 'pending'));

    let updatedContent = editableContent;
    let updatedFeedbackList = [...feedback];
    const newAppliedChanges = new Map(appliedChanges);

    console.log('[APPLY SELECTED] Processing', selected.length, 'feedback items');

    for (const item of selected) {
      const isDeletion = !item.changeTo || !item.changeTo.trim();

      if (isDeletion && item.changeFrom) {
        console.log('[APPLY SELECTED] Processing deletion for item:', item.id);

        // Create restoration marker
        const markerId = `RESTORE_${item.id || Date.now()}`;
        const encodedText = btoa(encodeURIComponent(item.changeFrom.substring(0, 500)));

        let replacementMade = false;
        let deletedParagraphHTML = '';

        // Search by TEXT CONTENT (generic approach - same as Apply All and Accept All)
        const textToFind = item.changeFrom.trim();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedContent;
        const allParagraphs = Array.from(tempDiv.querySelectorAll('p'));

        for (const p of allParagraphs) {
          const pText = p.textContent?.trim() || '';
          const pTextWithoutNumber = pText.replace(/^\d+(?:\.\d+)*\s*/, '').trim();

          if (pTextWithoutNumber === textToFind || pText.includes(textToFind)) {
            deletedParagraphHTML = p.outerHTML;
            const fullHtmlEncoded = btoa(encodeURIComponent(deletedParagraphHTML));
            const enhancedMarker = `<!--${markerId}:${fullHtmlEncoded}-->`;
            updatedContent = updatedContent.replace(deletedParagraphHTML, enhancedMarker);
            replacementMade = true;
            console.log('[APPLY SELECTED] ✅ Deleted by text content');
            break;
          }
        }

        if (replacementMade) {
          newAppliedChanges.set(item.id || String(Date.now()), {
            original: item.changeFrom,
            changed: '',
            feedbackId: item.id || ''
          });

          updatedFeedbackList = updatedFeedbackList.map(f =>
            f.id === item.id ? { ...f, status: 'merged' as const, selected: false } : f
          );
        } else {
          console.error('[APPLY SELECTED] ❌ Could not find content to delete for item:', item.id);
        }
      } else if (item.changeTo && item.changeFrom) {
        // Text replacement
        console.log('[APPLY SELECTED] Processing text change for item:', item.id);

        if (updatedContent.includes(item.changeFrom)) {
          updatedContent = updatedContent.replace(item.changeFrom, item.changeTo);

          newAppliedChanges.set(item.id || String(Date.now()), {
            original: item.changeFrom,
            changed: item.changeTo,
            feedbackId: item.id || ''
          });

          updatedFeedbackList = updatedFeedbackList.map(f =>
            f.id === item.id ? { ...f, status: 'merged' as const, selected: false } : f
          );

          console.log('[APPLY SELECTED] ✅ Applied text change for item:', item.id);
        } else {
          console.error('[APPLY SELECTED] ❌ Could not find text to replace:', item.changeFrom.substring(0, 50));
          alert(`Could not find text to replace. Item: ${item.coordinatorComment?.substring(0, 50)}`);
        }
      }
    }

    // Renumber ALL paragraphs once at the end (not after each deletion)
    console.log('[APPLY SELECTED] Renumbering all paragraphs...');
    const tempDiv2 = document.createElement('div');
    tempDiv2.innerHTML = updatedContent;
    const allParas = Array.from(tempDiv2.querySelectorAll('p'));

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

    updatedContent = tempDiv2.innerHTML;
    console.log('[APPLY SELECTED] ✅ Renumbering complete');

    // Update state
    setEditableContent(updatedContent);
    setDocumentContent(updatedContent);
    setFeedback(updatedFeedbackList);
    setAppliedChanges(newAppliedChanges);

    console.log('[APPLY SELECTED] ✅ Updated content, length:', updatedContent.length);

    // Save to database
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            editableContent: updatedContent,
            htmlContent: updatedContent,
            content: updatedContent
          }
        })
      });

      if (response.ok) {
        console.log('[APPLY SELECTED] ✅ Saved to database');
        // Save to history after successful save
        setTimeout(() => {
          historyProps.saveToHistory(newAppliedChanges);
        }, 100);
      } else {
        console.error('[APPLY SELECTED] ❌ Failed to save:', response.status);
      }
    } catch (error) {
      console.error('[APPLY SELECTED] ❌ Error saving:', error);
    }
  };

  // Restore selected rejected feedback items back to pending
  const restoreSelectedFeedback = async () => {
    const selectedRejected = feedback.filter((item: any) => item.selected && item.status === 'rejected');

    if (selectedRejected.length === 0) {
      return;
    }

    console.log('[RESTORE SELECTED] Restoring', selectedRejected.length, 'rejected items back to pending');

    // Update feedback list - restore selected rejected items to pending
    const updatedFeedback = feedback.map(f =>
      (f.selected && f.status === 'rejected') ? { ...f, status: 'pending' as const, selected: false } : f
    );

    setFeedback(updatedFeedback);

    // Save to database
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            crmComments: updatedFeedback,
            crmFeedback: updatedFeedback,
            draftFeedback: updatedFeedback,
            commentMatrix: updatedFeedback,
            lastModifiedAt: new Date().toISOString(),
          }
        })
      });

      if (response.ok) {
        console.log('[RESTORE SELECTED] ✅ Restored items saved to database');
        setDocumentData((prevData: any) => ({
          ...prevData,
          customFields: {
            ...prevData?.customFields,
            crmComments: updatedFeedback,
            crmFeedback: updatedFeedback,
            draftFeedback: updatedFeedback,
            commentMatrix: updatedFeedback,
          },
        }));
      } else {
        console.error('[RESTORE SELECTED] ❌ Failed to save restoration');
      }
    } catch (error) {
      console.error('[RESTORE SELECTED] Error:', error);
    }
  };

  // Apply all feedback items
  const applyAllFeedback = async () => {
    const applicableFeedback = feedback.filter(f =>
      (!f.status || f.status === 'pending') &&
      f.commentType !== 'C' &&
      (f.changeTo || f.changeFrom)  // Include deletions (changeFrom only)
    );

    let updatedContent = editableContent;
    let updatedFeedbackList = [...feedback];
    const newAppliedChanges = new Map(appliedChanges);

    console.log('[APPLY ALL] Processing', applicableFeedback.length, 'feedback items');
    console.log('[APPLY ALL] Current content length:', updatedContent.length);
    console.log('[APPLY ALL] Feedback items:', applicableFeedback.map(f => ({
      id: f.id,
      changeTo: f.changeTo?.substring(0, 50),
      changeFrom: f.changeFrom?.substring(0, 50),
      paragraphNumber: f.paragraphNumber
    })));

    for (const item of applicableFeedback) {
      const isDeletion = !item.changeTo || !item.changeTo.trim();

      console.log('[APPLY ALL] Item:', item.id, 'isDeletion:', isDeletion, 'hasChangeFrom:', !!item.changeFrom, 'hasChangeTo:', !!item.changeTo);

      if (isDeletion && item.changeFrom) {
        console.log('[APPLY ALL] Processing deletion for item:', item.id);
        console.log('[APPLY ALL] changeFrom:', item.changeFrom.substring(0, 100));

        // Auto-detect paragraph number if not set
        let detectedParagraphNum = item.paragraphNumber;
        if (!detectedParagraphNum) {
          const paragraphMatch = item.changeFrom.match(/^(\d+(?:\.\d+)+)/);
          if (paragraphMatch) {
            detectedParagraphNum = paragraphMatch[1];
            console.log('[APPLY ALL] Auto-detected paragraph number:', detectedParagraphNum);
          }
        }

        // Create restoration marker
        const markerId = `RESTORE_${item.id || Date.now()}`;
        const encodedText = btoa(encodeURIComponent(item.changeFrom.substring(0, 500)));

        let replacementMade = false;
        let deletedParagraphHTML = '';

        // Search by TEXT CONTENT (generic approach)
        const textToFind = item.changeFrom.trim();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedContent;
        const allParagraphs = Array.from(tempDiv.querySelectorAll('p'));

        for (const p of allParagraphs) {
          const pText = p.textContent?.trim() || '';
          const pTextWithoutNumber = pText.replace(/^\d+(?:\.\d+)*\s*/, '').trim();

          if (pTextWithoutNumber === textToFind || pText.includes(textToFind)) {
            deletedParagraphHTML = p.outerHTML;
            const fullHtmlEncoded = btoa(encodeURIComponent(deletedParagraphHTML));
            const enhancedMarker = `<!--${markerId}:${fullHtmlEncoded}-->`;
            updatedContent = updatedContent.replace(deletedParagraphHTML, enhancedMarker);
            replacementMade = true;
            console.log('[APPLY ALL] ✅ Deleted by text content');
            break;
          }
        }

        if (replacementMade) {
          const changeId = `bulk_${Date.now()}_${item.id}`;
          newAppliedChanges.set(changeId, {
            original: item.changeFrom,
            changed: '',
            feedbackId: item.id || ''
          });
        }
      } else if (item.changeFrom && item.changeTo) {
        // Handle modifications/replacements
        console.log('[APPLY ALL] Processing modification for item:', item.id);
        updatedContent = updatedContent.replace(item.changeFrom, item.changeTo);

        const changeId = `bulk_${Date.now()}_${item.id}`;
        newAppliedChanges.set(changeId, {
          original: item.changeFrom,
          changed: item.changeTo,
          feedbackId: item.id || ''
        });
      }

      updatedFeedbackList = updatedFeedbackList.map(f =>
        f.id === item.id ? { ...f, status: 'merged' as const } : f
      );
    }

    // Renumber ALL paragraphs once at the end (not after each deletion)
    console.log('[APPLY ALL] Renumbering all paragraphs...');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = updatedContent;
    const allParas = Array.from(tempDiv.querySelectorAll('p'));

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
    console.log('[APPLY ALL] ✅ Renumbering complete');

    setEditableContent(updatedContent);
    setDocumentContent(updatedContent);
    setFeedback(updatedFeedbackList);
    setAppliedChanges(newAppliedChanges);

    try {
      await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: updatedContent,  // Update main content field
          htmlContent: updatedContent,  // Update main htmlContent field
          customFields: {
            editableContent: updatedContent,
            htmlContent: updatedContent,
            content: updatedContent,
            // Update ALL feedback fields to keep them in sync
            crmFeedback: updatedFeedbackList,
            draftFeedback: updatedFeedbackList,
            crmComments: updatedFeedbackList,
            commentMatrix: updatedFeedbackList,
            lastEditedAt: new Date().toISOString()
          }
        })
      });
      console.log('[APPLY ALL] ✅ Saved to database - feedback count:', updatedFeedbackList.length);
    } catch (error) {
      console.error('[APPLY ALL] ❌ Error saving bulk changes:', error);
    }

    historyProps.saveToHistory(newAppliedChanges);
  };

  // Handle feedback processor close
  const handleFeedbackProcessorClose = (processedFeedback?: CRMComment[]) => {
    setShowEnhancedProcessor(false);
    if (processedFeedback && processedFeedback.length > 0) {
      setFeedback(processedFeedback);
      setShowProcessedFeedback(true);
    }
  };

  // Handle critical blocked confirm
  const handleCriticalBlockedConfirm = async () => {
    if (!criticalBlockedItem || !criticalResolution.trim()) return;

    const updatedFeedback = feedback.map(f =>
      f.id === criticalBlockedItem.id
        ? { ...f, resolution: criticalResolution, status: 'rejected' as const }
        : f
    );

    setFeedback(updatedFeedback);

    try {
      await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/opr-review/feedback`,
        {
          method: 'PUT',
          body: JSON.stringify({ feedback: updatedFeedback }),
        }
      );
    } catch (error) {
      console.error('Error updating critical feedback resolution:', error);
    }

    setCriticalBlockedItem(null);
    setCriticalResolution('');
  };

  // Handle submit feedback to OPR
  const handleSubmitFeedbackToOPR = async () => {
    const feedbackToSubmit = feedback.filter(f => f.status !== 'merged');

    if (feedbackToSubmit.length === 0) {
      alert('No feedback to submit. All items have been merged.');
      return;
    }

    if (!confirm(`Submit ${feedbackToSubmit.length} feedback items to OPR Workflow?`)) {
      return;
    }

    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/opr-workflow-submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            documentId,
            feedback: feedbackToSubmit,
            documentTitle: documentData?.title,
            documentContent: editableContent,
          }),
        }
      );

      if (response.ok) {
        alert('Feedback successfully submitted to OPR Workflow');
        router.push(`/documents/${documentId}`);
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  // Handle process feedback and continue
  const handleProcessFeedbackAndContinue = async () => {
    try {
      await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            ...documentData?.customFields,
            crmComments: feedback,
            crmFeedback: feedback,
            draftFeedback: feedback,
            editableContent,
            htmlContent: editableContent,
          },
        }),
      });

      const workflowResponse = await authTokenService.authenticatedFetch(
        `/api/workflow-complete-stage`,
        {
          method: 'POST',
          body: JSON.stringify({
            documentId,
            stageName: 'OPR Review',
            feedback: feedback.filter(f => f.status !== 'merged'),
            resolvedFeedback: feedback.filter(f => f.status === 'merged'),
          }),
        }
      );

      if (workflowResponse.ok) {
        alert('Feedback processed successfully. Moving to next workflow stage.');
        router.push(`/documents/${documentId}`);
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
      alert('Error processing feedback');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <OPRReviewHeader
        documentTitle={documentData?.title}
        documentId={documentId}
        isEditingDocument={isEditingDocument}
        savingDocument={savingDocument}
        exporting={exporting}
        exportAnchorEl={exportAnchorEl}
        onEditToggle={() => setIsEditingDocument(!isEditingDocument)}
        onSaveDocument={handleSaveDocument}
        onExport={handleExport}
        onExportMenuOpen={(e) => setExportAnchorEl(e.currentTarget)}
        onExportMenuClose={() => setExportAnchorEl(null)}
        onRefresh={() => {
          console.log('[REFRESH] Reloading document and feedback...');
          fetchDocumentAndFeedback();
        }}
      />

      <Box key={componentKey} sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <DocumentViewer
          documentData={documentData}
          isEditingDocument={isEditingDocument}
          editableContent={editableContent}
          documentContent={documentContent}
          showLineNumbers={showLineNumbers}
          showPageNumbers={showPageNumbers}
          onContentChange={setEditableContent}
          onLineNumbersToggle={setShowLineNumbers}
          onPageNumbersToggle={setShowPageNumbers}
        />

        {/* Right Side: Feedback Panel */}
        <Box sx={{ width: '450px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: 2, borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">
              <CommentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              OPR Feedback ({feedback.length})
            </Typography>
          </Box>


          {/* Feedback Controls */}
          <FeedbackControlPanel
            mergeMode={feedbackHandlers.mergeMode}
            historyIndex={historyProps.historyIndex}
            changeHistory={historyProps.changeHistory}
            changeMarkers={historyProps.changeMarkers}
            currentChangeIndex={historyProps.currentChangeIndex}
            feedback={feedback}
            selectAll={selectAll}
            savingDocument={savingDocument}
            showComparisonView={showComparisonView}
            onMergeModeChange={feedbackHandlers.handleMergeModeChange}
            onUndo={historyProps.handleUndo}
            onRedo={historyProps.handleRedo}
            onCompareToggle={() => setShowComparisonView(!showComparisonView)}
            onNavigatePrevious={historyProps.navigateToPreviousChange}
            onNavigateNext={historyProps.navigateToNextChange}
            onAcceptAll={feedbackHandlers.handleAcceptAllChanges}
            onRejectAll={feedbackHandlers.handleRejectAllChanges}
            onApplyAll={applyAllFeedback}
            onApplySelected={applySelectedFeedback}
            onSelectAll={handleSelectAllToggle}
            onSaveDocument={handleSaveDocument}
            onShowHistory={() => setShowDetailedHistory(true)}
            onRestoreSelected={restoreSelectedFeedback}
          />

          {/* Spacer to push feedback to bottom */}
          <Box sx={{ flex: 1, minHeight: 0 }} />

          {/* Selected Feedback Details */}
          {selectedFeedback && (
            <Box sx={{
              bgcolor: 'grey.50',
              borderTop: 1,
              borderColor: 'divider',
              flex: '0 0 auto',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Fixed Header */}
              <Box sx={{ p: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2">
                    Feedback Details:
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setSelectedFeedback(null)}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    ✕
                  </Button>
                </Box>
              </Box>

              {/* Scrollable Content */}
              <Box sx={{
                p: 2,
                pt: 1,
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: '250px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.200',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: 'grey.500',
                  }
                }
              }}>

              <Box sx={{ mb: 1 }}>
                <Chip
                  label={selectedFeedback.commentType === 'C' ? 'Critical' :
                         selectedFeedback.commentType === 'S' ? 'Substantive' :
                         selectedFeedback.commentType === 'A' ? 'Administrative' : 'Other'}
                  size="small"
                  color={selectedFeedback.commentType === 'C' ? 'error' :
                         selectedFeedback.commentType === 'S' ? 'warning' : 'default'}
                />
              </Box>

              {/* Show all fields */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Section:</strong> {selectedFeedback.component || ''}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Comment:</strong> {selectedFeedback.coordinatorComment || selectedFeedback.comment || ''}
              </Typography>

              {/* Reviewer Info */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Reviewer:</strong> {selectedFeedback.pocName || ''}
                {selectedFeedback.pocEmail ? ` (${selectedFeedback.pocEmail})` : ''}
              </Typography>

              {/* Location - Combined */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong> Page {selectedFeedback.page || '?'}
                {selectedFeedback.paragraphNumber ? `, Paragraph ${selectedFeedback.paragraphNumber}` : ''}
                {selectedFeedback.lineNumber ? `, Line ${selectedFeedback.lineNumber}` : ''}
              </Typography>

              {/* Professional Text Change Display with colored backgrounds - Always show */}
              {(() => {
                const fromText = selectedFeedback.originalText || selectedFeedback.changeFrom || '';
                const toText = selectedFeedback.recommendedText || selectedFeedback.replacementText || selectedFeedback.changeTo || '';
                return (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>From:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{
                        p: 1,
                        bgcolor: '#ffebee',
                        border: '1px solid #ffcdd2',
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}>
                        {fromText}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>To:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{
                        p: 1,
                        bgcolor: '#e8f5e9',
                        border: '1px solid #c8e6c9',
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}>
                        {toText}
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Change Type:</strong> {selectedFeedback.changeType || ''}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Rationale:</strong> {selectedFeedback.rationale || ''}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong>
                {selectedFeedback.status ? (
                  <Chip
                    label={selectedFeedback.status}
                    size="small"
                    sx={{ ml: 1 }}
                    color={selectedFeedback.status === 'merged' ? 'success' :
                           selectedFeedback.status === 'rejected' ? 'error' : 'default'}
                  />
                ) : ''}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Resolution:</strong> {selectedFeedback.resolution || ''}
              </Typography>

              {/* Only show Created date if present */}
              {selectedFeedback.createdAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Created: {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                </Typography>
              )}
              </Box>

              {/* Fixed Apply Button Section */}
              {(() => {
                const fromText = selectedFeedback.originalText || selectedFeedback.changeFrom;
                const toText = selectedFeedback.recommendedText || selectedFeedback.replacementText || selectedFeedback.changeTo;
                // Show buttons if there's fromText (even if toText is empty - it's a comment-only review)
                const hasChanges = !!(fromText && fromText.trim());
                const hasReplacementText = !!(fromText && toText && toText.trim());

                // Debug logging
                console.log('Button visibility check:', {
                  originalText: selectedFeedback.originalText,
                  changeFrom: selectedFeedback.changeFrom,
                  recommendedText: selectedFeedback.recommendedText,
                  replacementText: selectedFeedback.replacementText,
                  changeTo: selectedFeedback.changeTo,
                  fromText,
                  toText,
                  hasChanges,
                  hasReplacementText,
                  allFields: Object.keys(selectedFeedback)
                });

                return hasChanges ? (
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  p: 2,
                  borderTop: '2px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      // Apply this specific feedback change - support multiple field names
                      const changeFromText = selectedFeedback.originalText || selectedFeedback.changeFrom;
                      const changeToText = selectedFeedback.recommendedText || selectedFeedback.replacementText || selectedFeedback.changeTo || '';

                      // changeToText can be empty for deletions
                      if (changeFromText) {
                        // Get the current content - use the rendered content
                        const currentContent = editableContent || documentContent || '';

                        console.log('Applying feedback:', {
                          changeFrom: changeFromText,
                          changeTo: changeToText,
                          contentLength: currentContent.length,
                          isDeletion: !changeToText || !changeToText.trim()
                        });

                        // Function to escape special regex characters
                        const escapeRegex = (str: string) => {
                          return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        };

                        // Try to find and replace the text
                        let updatedContent = currentContent;
                        let replacementMade = false;

                        // Special handling for paragraph deletion
                        const isDeletion = !changeToText || !changeToText.trim();
                        console.log('[DELETE] Is deletion?', isDeletion);
                        console.log('[DELETE] Has paragraph number?', selectedFeedback.paragraphNumber);
                        console.log('[DELETE] Feedback item:', selectedFeedback);

                        // Try to auto-detect paragraph number if not set
                        let detectedParagraphNum = selectedFeedback.paragraphNumber;
                        if (isDeletion && !detectedParagraphNum) {
                          // Try to extract paragraph number from the beginning of changeFrom text
                          // Match patterns like: 1.1.1.1, 1.2.3, etc.
                          const paragraphMatch = changeFromText.match(/^(\d+(?:\.\d+)+)/);
                          if (paragraphMatch) {
                            detectedParagraphNum = paragraphMatch[1];
                            console.log('[DELETE] Auto-detected paragraph number from text:', detectedParagraphNum);
                          }
                        }

                        if (isDeletion && detectedParagraphNum) {
                          console.log('Attempting paragraph deletion with renumbering:', detectedParagraphNum);

                          // Create restoration marker with encoded original text for safety
                          const markerId = `RESTORE_${selectedFeedback.id || Date.now()}`;
                          const encodedText = btoa(encodeURIComponent(changeFromText.substring(0, 500))); // Store first 500 chars
                          const restorationMarker = `<!--${markerId}:${encodedText}-->`;

                          // Try to find and remove the entire paragraph including number
                          // Match pattern like: <p>1.1.2.1.1.1 Communication systems...</p>
                          const paragraphNum = detectedParagraphNum;
                          const escapedNum = escapeRegex(paragraphNum);

                          // Try multiple patterns to match the paragraph
                          const patterns = [
                            // Pattern 1: <p>number text</p> (number and text in same tag)
                            new RegExp(`<p[^>]*>\\s*${escapedNum}\\s+${escapeRegex(changeFromText.trim())}\\s*</p>`, 'i'),
                            // Pattern 2: <p>number</p><p>text</p> (number and text in separate tags)
                            new RegExp(`<p[^>]*>\\s*${escapedNum}\\s*</p>\\s*<p[^>]*>\\s*${escapeRegex(changeFromText.trim())}\\s*</p>`, 'i'),
                            // Pattern 3: <p>number...partial text...</p> (number at start with partial text match)
                            new RegExp(`<p[^>]*>\\s*${escapedNum}[^<]*${escapeRegex(changeFromText.substring(0, Math.min(50, changeFromText.length)))}[\\s\\S]*?</p>`, 'i'),
                            // Pattern 4: <p><strong>number</strong> text</p> (number in formatting tag)
                            new RegExp(`<p[^>]*>\\s*<[^>]*>\\s*${escapedNum}\\s*</[^>]*>\\s*${escapeRegex(changeFromText.trim())}\\s*</p>`, 'i'),
                            // Pattern 5: <p>number (with any content until closing tag)
                            new RegExp(`<p[^>]*>\\s*${escapedNum}\\b[\\s\\S]*?</p>`, 'i'),
                            // Pattern 6: Just find the <p> tag containing the paragraph number
                            new RegExp(`<p[^>]*>(?:[^<]|<(?!/p>))*${escapedNum}(?:[^<]|<(?!/p>))*</p>`, 'i'),
                          ];

                          let deletedParagraphHTML = '';
                          for (const pattern of patterns) {
                            const match = currentContent.match(pattern);
                            if (match) {
                              deletedParagraphHTML = match[0]; // Store the full HTML
                              // Store the full paragraph HTML in the marker's encoded data
                              const fullHtmlEncoded = btoa(encodeURIComponent(deletedParagraphHTML));
                              const enhancedMarker = `<!--${markerId}:${fullHtmlEncoded}-->`;
                              updatedContent = currentContent.replace(pattern, enhancedMarker);
                              replacementMade = true;
                              console.log('Removed paragraph with pattern match, inserted marker with full HTML:', markerId);
                              break;
                            }
                          }

                          // Fallback: Try to find just the text without paragraph tags
                          if (!replacementMade) {
                            // First try: Remove number + text together
                            const textPattern = new RegExp(`${escapedNum}\\s+${escapeRegex(changeFromText.trim())}`, 'i');
                            if (textPattern.test(currentContent)) {
                              updatedContent = currentContent.replace(textPattern, restorationMarker);
                              replacementMade = true;
                              console.log('Removed paragraph text with number, inserted marker:', markerId);
                            }
                          }

                          // Ultimate fallback: If text was removed but paragraph number remains, remove it too
                          if (!replacementMade && currentContent.includes(changeFromText)) {
                            // Remove the text first
                            updatedContent = currentContent.replace(changeFromText, restorationMarker);
                            // Then look for the paragraph number that's now orphaned
                            // Match the number followed by whitespace or tags but no substantial text
                            const orphanedNumberPattern = new RegExp(`<p[^>]*>\\s*(?:<[^>]*>)?\\s*${escapedNum}\\s*(?:</[^>]*>)?\\s*</p>`, 'gi');
                            updatedContent = updatedContent.replace(orphanedNumberPattern, '');
                            replacementMade = true;
                            console.log('Removed paragraph text and cleaned up orphaned number, inserted marker:', markerId);
                          }

                          // If paragraph was removed, renumber subsequent paragraphs
                          if (replacementMade) {
                            console.log('Paragraph removed, starting renumbering process...');
                            updatedContent = renumberParagraphs(updatedContent, paragraphNum);
                          }
                        }

                        // Standard replacement/deletion (no paragraph renumbering)
                        if (!replacementMade) {
                          // Method 1: Try exact match
                          if (currentContent.includes(changeFromText)) {
                            // Find where the text appears
                            const index = currentContent.indexOf(changeFromText);
                            console.log('Found text at position:', index);
                            console.log('Text before:', currentContent.substring(Math.max(0, index - 20), index));
                            console.log('Text after:', currentContent.substring(index + changeFromText.length, Math.min(currentContent.length, index + changeFromText.length + 20)));

                            // For deletions (empty changeTo), insert a restoration marker
                            if (isDeletion) {
                              const markerId = `RESTORE_${selectedFeedback.id || Date.now()}`;
                              const encodedText = btoa(encodeURIComponent(changeFromText.substring(0, 500))); // Store first 500 chars
                              const restorationMarker = `<!--${markerId}:${encodedText}-->`;
                              updatedContent = currentContent.replace(
                                changeFromText,
                                restorationMarker
                              );
                              console.log('Deletion: Replaced text with marker:', markerId);
                            } else {
                              // Standard replacement
                              updatedContent = currentContent.replace(
                                changeFromText,
                                changeToText
                              );
                              console.log('Replaced using exact match');
                            }
                            replacementMade = true;
                          }
                        }
                        // Method 2: Try with regex to ignore HTML tags
                        if (!replacementMade) {
                          // Create a regex that matches the text even if it spans across HTML tags
                          const textToFind = escapeRegex(changeFromText);
                          // This regex will match the text even if there are HTML tags in between
                          const regex = new RegExp(textToFind.split(/\s+/).join('(?:\\s|<[^>]*>)*'), 'i');

                          if (regex.test(currentContent)) {
                            // For deletions, insert a restoration marker
                            if (isDeletion) {
                              const markerId = `RESTORE_${selectedFeedback.id || Date.now()}`;
                              const encodedText = btoa(encodeURIComponent(changeFromText.substring(0, 500))); // Store first 500 chars
                              const restorationMarker = `<!--${markerId}:${encodedText}-->`;
                              updatedContent = currentContent.replace(regex, restorationMarker);
                              console.log('Deletion: Replaced text with marker (regex method):', markerId);
                            } else {
                              updatedContent = currentContent.replace(regex, changeToText);
                              console.log('Replaced using regex (ignoring HTML tags)');
                            }
                            replacementMade = true;
                          }
                          // Method 3: Try to find the text without considering HTML structure
                          else {
                            // Strip HTML tags from content to search
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = currentContent;
                            const textContent = tempDiv.textContent || '';

                            if (textContent.includes(changeFromText)) {
                              // Find position in text
                              const textIndex = textContent.indexOf(changeFromText);
                              console.log(`Found text at position ${textIndex} in stripped content`);

                              // For deletions, insert a restoration marker
                              if (isDeletion) {
                                const markerId = `RESTORE_${selectedFeedback.id || Date.now()}`;
                                const encodedText = btoa(encodeURIComponent(changeFromText.substring(0, 500))); // Store first 500 chars
                                const restorationMarker = `<!--${markerId}:${encodedText}-->`;
                                updatedContent = currentContent.replace(
                                  changeFromText,
                                  restorationMarker
                                );
                                console.log('Deletion: Replaced text with marker (text search method):', markerId);
                              } else {
                                // Simple replacement - just replace first occurrence
                                updatedContent = currentContent.replace(
                                  changeFromText,
                                  changeToText
                                );
                              }
                              replacementMade = true;
                            }
                          }
                        }

                        if (replacementMade && updatedContent !== currentContent) {
                          console.log('Replacement made!');
                          console.log('Old content length:', currentContent.length);
                          console.log('New content length:', updatedContent.length);

                          // Update BOTH content states to ensure the change is visible
                          setEditableContent(updatedContent);
                          setDocumentContent(updatedContent);

                          // Update feedback status to 'merged'
                          const updatedFeedback = feedback.map(f =>
                            f.id === selectedFeedback.id
                              ? { ...f, status: 'merged' as const }
                              : f
                          );
                          setFeedback(updatedFeedback);

                          console.log(`Successfully replaced: "${changeFromText}" with "${changeToText}"`);

                          // Save everything to database
                          const saveToDatabase = async () => {
                            try {
                              console.log('[APPLY] Saving document and feedback to database...');
                              console.log('[APPLY] Updated content length:', updatedContent.length);
                              console.log('[APPLY] Updated feedback count:', updatedFeedback.length);
                              console.log('[APPLY] Merged feedback count:', updatedFeedback.filter(f => f.status === 'merged').length);

                              // Save document content and feedback status
                              const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                                method: 'PATCH',
                                body: JSON.stringify({
                                  content: updatedContent,  // Update main content field
                                  htmlContent: updatedContent,  // Update main htmlContent field
                                  customFields: {
                                    ...documentData?.customFields,
                                    editableContent: updatedContent,
                                    htmlContent: updatedContent,
                                    content: updatedContent,
                                    // Update ALL 4 feedback fields to keep them in sync
                                    crmComments: updatedFeedback,
                                    crmFeedback: updatedFeedback,
                                    draftFeedback: updatedFeedback,
                                    commentMatrix: updatedFeedback,
                                    lastModifiedAt: new Date().toISOString(),
                                    feedbackAppliedAt: new Date().toISOString(),
                                    feedbackStatus: {
                                      total: updatedFeedback.length,
                                      merged: updatedFeedback.filter(f => f.status === 'merged').length,
                                      pending: updatedFeedback.filter(f => f.status === 'pending').length,
                                      rejected: updatedFeedback.filter(f => f.status === 'rejected').length,
                                    }
                                  },
                                }),
                              });

                              if (response.ok) {
                                console.log('[APPLY] ✅ Document and feedback saved successfully!');
                                const savedData = await response.json();
                                console.log('[APPLY] Saved data:', savedData);
                                alert('Feedback applied and saved to database successfully!');
                              } else {
                                const errorText = await response.text();
                                console.error('[APPLY] ❌ Failed to save document:', response.status, response.statusText);
                                console.error('[APPLY] Error response:', errorText);
                                alert(`Failed to save feedback to database!\nStatus: ${response.status}\nError: ${response.statusText}\n\nCheck console for details.`);
                              }
                            } catch (error) {
                              console.error('[APPLY] ❌ Error saving to database:', error);
                              alert(`Error saving feedback to database: ${error}\n\nCheck console for details.`);
                            }
                          };

                          // Execute save
                          saveToDatabase();

                          // Clear selection
                          setSelectedFeedback(null);
                        } else {
                          // Show more detailed error with document preview
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = currentContent;
                          const textContent = tempDiv.textContent || '';
                          const preview = textContent.substring(0, 500);

                          console.error('Text not found in document');
                          console.error('Searching for:', changeFromText);
                          console.error('Document starts with:', preview);

                          alert(`Could not find the text to delete/replace.\n\nSearching for:\n"${changeFromText.substring(0, 200)}..."\n\nThis text may:\n- Include formatting/paragraph numbers that aren't in the original\n- Have already been changed\n- Be wrapped in HTML tags\n\nCheck the browser console for more details.`);
                        }
                      }
                    }}
                    disabled={selectedFeedback.status === 'merged'}
                  >
                    {selectedFeedback.status === 'merged' ? 'Already Applied' :
                     !hasReplacementText ? 'Delete Text' :
                     'Apply This Change'}
                  </Button>

                  {selectedFeedback.status === 'merged' && (
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      onClick={async () => {
                        // Reset status to pending and save to database
                        const updatedFeedback = feedback.map(f =>
                          f.id === selectedFeedback.id
                            ? { ...f, status: 'pending' as const }
                            : f
                        );
                        setFeedback(updatedFeedback);
                        setSelectedFeedback({ ...selectedFeedback, status: 'pending' });

                        console.log('[RESET] Resetting feedback status to pending:', selectedFeedback.id);

                        // Save to database
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                              customFields: {
                                ...documentData?.customFields,
                                crmComments: updatedFeedback,
                                crmFeedback: updatedFeedback,
                                draftFeedback: updatedFeedback,
                                commentMatrix: updatedFeedback,
                              }
                            })
                          });

                          if (response.ok) {
                            console.log('[RESET] ✅ Status reset and saved to database');
                            alert('Feedback status has been reset to pending');
                          } else {
                            console.error('[RESET] ❌ Failed to save status');
                          }
                        } catch (error) {
                          console.error('[RESET] Error:', error);
                        }
                      }}
                    >
                      Reset to Pending
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={async () => {
                      // Reject this feedback
                      const updatedFeedback = feedback.map(f =>
                        f.id === selectedFeedback.id
                          ? { ...f, status: 'rejected' as const }
                          : f
                      );
                      setFeedback(updatedFeedback);

                      // Save feedback status to database
                      try {
                        console.log('Saving rejected feedback status to database...');
                        const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            customFields: {
                              ...documentData?.customFields,
                              crmComments: updatedFeedback,
                              crmFeedback: updatedFeedback,
                              lastModifiedAt: new Date().toISOString(),
                              feedbackStatus: {
                                total: updatedFeedback.length,
                                merged: updatedFeedback.filter(f => f.status === 'merged').length,
                                pending: updatedFeedback.filter(f => f.status === 'pending').length,
                                rejected: updatedFeedback.filter(f => f.status === 'rejected').length,
                              }
                            },
                          }),
                        });

                        if (response.ok) {
                          console.log('Feedback rejection saved successfully!');
                        } else {
                          console.error('Failed to save rejection:', response.statusText);
                        }
                      } catch (error) {
                        console.error('Error saving rejection:', error);
                      }

                      setSelectedFeedback(null);
                    }}
                    disabled={selectedFeedback.status === 'rejected'}
                  >
                    {selectedFeedback.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </Button>

                  {selectedFeedback.status === 'rejected' && (
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={async () => {
                        // Restore rejected feedback back to pending
                        const updatedFeedback = feedback.map(f =>
                          f.id === selectedFeedback.id
                            ? { ...f, status: 'pending' as const }
                            : f
                        );
                        setFeedback(updatedFeedback);
                        setSelectedFeedback({ ...selectedFeedback, status: 'pending' });

                        console.log('[RESTORE] Restoring rejected feedback to pending:', selectedFeedback.id);

                        // Save to database
                        try {
                          const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                              customFields: {
                                ...documentData?.customFields,
                                crmComments: updatedFeedback,
                                crmFeedback: updatedFeedback,
                                draftFeedback: updatedFeedback,
                                lastModifiedAt: new Date().toISOString(),
                              }
                            })
                          });

                          if (response.ok) {
                            console.log('[RESTORE] ✅ Feedback restored to pending and saved to database');
                          } else {
                            console.error('[RESTORE] ❌ Failed to save restoration');
                          }
                        } catch (error) {
                          console.error('[RESTORE] Error:', error);
                        }
                      }}
                    >
                      Restore to Pending
                    </Button>
                  )}
                </Box>
                ) : null;
              })()}
            </Box>
          )}

          {/* Feedback List at Bottom */}
          <Box sx={{
            flex: '0 0 auto',
            borderTop: 2,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '350px'
          }}>
            <Box sx={{ p: 1, bgcolor: 'primary.dark', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                Feedback Items ({feedback.filter(f => f.status !== 'rejected').length})
              </Typography>
              {feedback.filter(f => f.status === 'rejected').length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    fontSize: '0.7rem',
                    py: 0.25,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                  onClick={() => setShowRejectedItems(!showRejectedItems)}
                >
                  {showRejectedItems ? 'Hide' : 'Show'} Rejected ({feedback.filter(f => f.status === 'rejected').length})
                </Button>
              )}
            </Box>
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              bgcolor: 'background.paper',
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'grey.200',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'primary.main',
                borderRadius: '5px',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }
            }}>
              {feedback && feedback.length > 0 ? (
                <List dense sx={{ py: 0 }}>
                  {feedback.filter(item => showRejectedItems || item.status !== 'rejected').map((item, index) => (
                    <ListItem
                      key={item.id || index}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedFeedback?.id === item.id ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Checkbox
                        checked={!!item.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleFeedbackSelection(item.id);
                        }}
                        sx={{
                          mr: 1,
                          opacity: item.status === 'rejected' ? 0.6 : 1
                        }}
                      />
                      <ListItemText
                        onClick={() => setSelectedFeedback(item)}
                        sx={{ cursor: 'pointer' }}
                        primaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={item.commentType === 'C' ? 'C' :
                                     item.commentType === 'S' ? 'S' :
                                     item.commentType === 'A' ? 'A' : '?'}
                              size="small"
                              color={item.commentType === 'C' ? 'error' :
                                     item.commentType === 'S' ? 'warning' : 'default'}
                              sx={{ minWidth: 24, height: 20 }}
                            />
                            {item.status === 'rejected' && (
                              <Chip
                                label="REJECTED"
                                size="small"
                                sx={{
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            )}
                            <Typography variant="body2" noWrap>
                              {item.component || 'General'}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" noWrap>
                            {item.coordinatorComment || 'No comment'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    No feedback items
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Submit Actions */}
          <Box sx={{ p: 2, borderTop: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleProcessFeedbackAndContinue}
              sx={{ mb: 1 }}
            >
              Process Feedback & Continue
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSubmitFeedbackToOPR}
            >
              Submit to OPR Workflow
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Enhanced Processor Dialog */}
      <Dialog
        open={showEnhancedProcessor}
        onClose={() => setShowEnhancedProcessor(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0, height: '80vh' }}>
          <OPRFeedbackProcessorV2Enhanced
            documentId={documentId}
            onClose={handleFeedbackProcessorClose}
          />
        </DialogContent>
      </Dialog>

      {/* Critical Item Resolution Dialog */}
      <Dialog
        open={!!criticalBlockedItem}
        onClose={() => {
          setCriticalBlockedItem(null);
          setCriticalResolution('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Provide Resolution for Critical Feedback</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Critical feedback items cannot be automatically applied and require manual resolution.
          </Alert>
          {criticalBlockedItem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Feedback:</Typography>
              <Typography variant="body2">{criticalBlockedItem.coordinatorComment}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution"
            value={criticalResolution}
            onChange={(e) => setCriticalResolution(e.target.value)}
            placeholder="Explain why this critical feedback cannot be applied or how it will be addressed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCriticalBlockedItem(null);
            setCriticalResolution('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleCriticalBlockedConfirm}
            variant="contained"
            disabled={!criticalResolution.trim()}
          >
            Submit Resolution
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collected Feedback View Dialog */}
      {collectedFeedbackDocId && (
        <Dialog
          open={!!collectedFeedbackDocId}
          onClose={() => setCollectedFeedbackDocId(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Collected Feedback</DialogTitle>
          <DialogContent>
            <CollectedFeedbackView
              documentId={collectedFeedbackDocId}
              onClose={() => setCollectedFeedbackDocId(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Comparison View Dialog */}
      <Dialog
        open={showComparisonView}
        onClose={() => setShowComparisonView(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Document Comparison View
          <Button
            onClick={() => setShowComparisonView(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ✕
          </Button>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <span style={{ textDecoration: 'line-through', backgroundColor: '#ffcdd2' }}>Original text</span> will be crossed out and{' '}
              <span style={{ backgroundColor: '#c8e6c9', fontWeight: 'bold' }}>new text</span> will replace it
            </Typography>
          </Alert>

          <Box sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            maxHeight: '60vh',
            overflow: 'auto',
            '& del': {
              backgroundColor: '#ffcdd2',
              textDecoration: 'line-through',
              color: '#b71c1c',
              padding: '2px 4px',
              borderRadius: '2px'
            },
            '& ins': {
              backgroundColor: '#c8e6c9',
              textDecoration: 'none',
              color: '#1b5e20',
              fontWeight: 'bold',
              padding: '2px 4px',
              borderRadius: '2px',
              marginLeft: '4px'
            }
          }}>
            <div dangerouslySetInnerHTML={{
              __html: (() => {
                let comparisonHtml = editableContent;

                // Apply all merged changes to show strikethrough and replacements
                feedback.filter(f => f.status === 'merged').forEach(item => {
                  const isDeletion = !item.changeTo || !item.changeTo.trim();
                  const isAddition = !item.changeFrom || !item.changeFrom.trim();

                  if (isDeletion && item.changeFrom) {
                    // For deletions, look for the restoration marker
                    const markerId = `RESTORE_${item.id}`;
                    const markerRegex = new RegExp(`<!--${markerId}:([^>]+)-->`, 'g');

                    // Show the deletion as strikethrough at the marker location
                    comparisonHtml = comparisonHtml.replace(
                      markerRegex,
                      `<del style="display: block; margin: 8px 0;">${item.changeFrom}</del>`
                    );
                  } else if (isAddition && item.changeTo) {
                    // For additions, show the new text as highlighted
                    const to = item.changeTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    comparisonHtml = comparisonHtml.replace(
                      new RegExp(to, 'g'),
                      `<ins>${item.changeTo}</ins>`
                    );
                  } else if (item.changeFrom && item.changeTo) {
                    // For modifications, replace with strikethrough + highlighted new text
                    const to = item.changeTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    comparisonHtml = comparisonHtml.replace(
                      new RegExp(to, 'g'),
                      `<del>${item.changeFrom}</del><ins>${item.changeTo}</ins>`
                    );
                  }
                });

                return comparisonHtml;
              })()
            }} />
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Summary of Changes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total changes applied: {feedback.filter(f => f.status === 'merged').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending changes: {feedback.filter(f => f.status === 'pending').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rejected changes: {feedback.filter(f => f.status === 'rejected').length}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={showDetailedHistory}
        onClose={() => setShowDetailedHistory(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '70vh' } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Change History
          <Button
            onClick={() => setShowDetailedHistory(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ✕
          </Button>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Total Changes Applied: {feedback.filter(f => f.status === 'merged').length}
            </Alert>
          </Box>

          <List sx={{ width: '100%' }}>
            {feedback.filter(f => f.status === 'merged').map((item, index) => (
              <Box key={item.id || index}>
                <ListItem sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  mb: 1
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Change #{index + 1} - {item.component || 'General'}
                    </Typography>
                    <Chip
                      label={item.commentType === 'C' ? 'Critical' :
                             item.commentType === 'S' ? 'Substantive' : 'Administrative'}
                      size="small"
                      color={item.commentType === 'C' ? 'error' :
                             item.commentType === 'S' ? 'warning' : 'default'}
                    />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">From:</Typography>
                    <Typography variant="body2" sx={{
                      p: 0.5,
                      bgcolor: '#ffebee',
                      borderRadius: 0.5,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}>
                      {item.changeFrom || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">To:</Typography>
                    <Typography variant="body2" sx={{
                      p: 0.5,
                      bgcolor: '#e8f5e9',
                      borderRadius: 0.5,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}>
                      {item.changeTo || 'N/A'}
                    </Typography>
                  </Box>

                  {item.coordinatorComment && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Comment:</Typography>
                      <Typography variant="body2">{item.coordinatorComment}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Restore this specific change
                        let restored = editableContent;
                        let restorationMade = false;

                        if (item.changeFrom) {
                          // First, try to find restoration marker (for deletions)
                          const markerId = `RESTORE_${item.id}`;

                          // Try new marker format with encoded text
                          const markerRegex = new RegExp(`<!--${markerId}:([^>]+)-->`, 'g');
                          const markerMatch = editableContent.match(markerRegex);

                          if (markerMatch && markerMatch[0]) {
                            console.log('[RESTORE] Found enhanced marker:', markerId);
                            // Extract the encoded HTML from the marker
                            const encodedMatch = markerMatch[0].match(/<!--RESTORE_[^:]+:([^>]+)-->/);
                            let restoredText = item.changeFrom;

                            if (encodedMatch && encodedMatch[1]) {
                              try {
                                // Decode the full HTML structure (with indentation)
                                const decodedHTML = decodeURIComponent(atob(encodedMatch[1]));
                                restoredText = decodedHTML;
                                console.log('[RESTORE] Restored full paragraph HTML with indentation');
                              } catch (e) {
                                console.warn('[RESTORE] Failed to decode HTML, using fallback');
                                // Fallback: reconstruct simple paragraph
                                if (item.paragraphNumber) {
                                  restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                                }
                              }
                            } else if (item.paragraphNumber) {
                              // Fallback: Restore as a paragraph with number but no indentation
                              restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                              console.log('[RESTORE] Restoring paragraph with number (no indentation data):', item.paragraphNumber);
                            }

                            // Replace marker with original text from feedback item
                            restored = editableContent.replace(markerMatch[0], restoredText);
                            restorationMade = true;
                            console.log('[RESTORE] Restored deletion using enhanced marker');
                          }
                          // Fallback: Try old marker format (for backward compatibility)
                          else if (editableContent.includes(`<!--${markerId}-->`)) {
                            const oldMarkerPattern = `<!--${markerId}-->`;
                            console.log('[RESTORE] Found old marker:', markerId);
                            // Reconstruct paragraph with number if this was a paragraph deletion
                            let restoredText = item.changeFrom;
                            if (item.paragraphNumber) {
                              // Restore as a paragraph with number
                              restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                              console.log('[RESTORE] Restoring paragraph with number:', item.paragraphNumber);
                            }
                            // Replace marker with original text
                            restored = editableContent.replace(oldMarkerPattern, restoredText);
                            restorationMade = true;
                            console.log('[RESTORE] Restored deletion using old marker format');
                          }
                          // Fallback: Standard text replacement (for modifications)
                          else if (item.changeTo) {
                            if (editableContent.includes(item.changeTo)) {
                              restored = editableContent.replace(item.changeTo, item.changeFrom);
                              restorationMade = true;
                              console.log('[RESTORE] Restored modification using text replacement');
                            } else {
                              console.error('[RESTORE] Could not find text to restore:', item.changeTo);
                              alert('Could not find the changed text to restore. It may have been modified again.');
                              return;
                            }
                          } else {
                            // Fallback for old deletions without markers
                            console.warn('[RESTORE] No marker found, attempting paragraph insertion fallback');

                            if (item.paragraphNumber && item.changeFrom) {
                              // Find where to insert by looking for adjacent paragraph
                              const paragraphNum = item.paragraphNumber;
                              const parts = paragraphNum.split('.').map(n => parseInt(n));

                              console.log('[RESTORE] Looking for location to insert paragraph:', paragraphNum);
                              console.log('[RESTORE] Current document has', (editableContent.match(/<p[^>]*>\s*\d+(?:\.\d+)+/g) || []).length, 'numbered paragraphs');

                              // Show all paragraph numbers in document for debugging
                              const allParaNumbers = editableContent.match(/<p[^>]*>\s*(\d+(?:\.\d+)+)/g);
                              if (allParaNumbers) {
                                const numbers = allParaNumbers.map(m => m.match(/(\d+(?:\.\d+)+)/)?.[1]).filter(Boolean);
                                console.log('[RESTORE] Existing paragraph numbers:', numbers.join(', '));
                              }

                              // Try to find the next paragraph number (e.g., if deleting 1.1.1.2, look for 1.1.1.2 or 1.1.1.3)
                              const nextParts = [...parts];
                              nextParts[nextParts.length - 1]++; // Increment last number
                              const nextNum = nextParts.join('.');
                              console.log('[RESTORE] Looking for next paragraph:', nextNum);

                              // Try to find a paragraph with the next number
                              const nextParagraphRegex = new RegExp(`<p[^>]*>\\s*${nextNum.replace(/\./g, '\\.')}\\b`, 'i');
                              const matchNext = editableContent.match(nextParagraphRegex);

                              if (matchNext) {
                                // Insert before the next paragraph
                                const insertPosition = editableContent.indexOf(matchNext[0]);
                                const restoredParagraph = `<p>${paragraphNum} ${item.changeFrom}</p>\n`;
                                restored = editableContent.slice(0, insertPosition) + restoredParagraph + editableContent.slice(insertPosition);
                                restorationMade = true;
                                console.log('[RESTORE] Inserted paragraph using adjacent paragraph method');
                              } else {
                                // Try to find previous paragraph and insert after it
                                const prevParts = [...parts];
                                prevParts[prevParts.length - 1]--; // Decrement last number
                                if (prevParts[prevParts.length - 1] > 0) {
                                  const prevNum = prevParts.join('.');
                                  const prevParagraphRegex = new RegExp(`<p[^>]*>\\s*${prevNum.replace(/\./g, '\\.')}\\b[\\s\\S]*?</p>`, 'i');
                                  const matchPrev = editableContent.match(prevParagraphRegex);

                                  if (matchPrev) {
                                    // Insert after the previous paragraph
                                    const insertPosition = editableContent.indexOf(matchPrev[0]) + matchPrev[0].length;
                                    const restoredParagraph = `\n<p>${paragraphNum} ${item.changeFrom}</p>`;
                                    restored = editableContent.slice(0, insertPosition) + restoredParagraph + editableContent.slice(insertPosition);
                                    restorationMade = true;
                                    console.log('[RESTORE] Inserted paragraph using previous paragraph method');
                                  }
                                }
                              }

                              if (!restorationMade) {
                                console.warn('[RESTORE] Could not find adjacent paragraphs, trying end of document fallback');
                                // Ultimate fallback: Just append at the end of the document
                                const restoredParagraph = item.paragraphNumber
                                  ? `\n<p>${item.paragraphNumber} ${item.changeFrom}</p>`
                                  : `\n<p>${item.changeFrom}</p>`;
                                restored = editableContent + restoredParagraph;
                                restorationMade = true;
                                console.log('[RESTORE] Appended paragraph at end of document');
                                alert('Restored paragraph at the end of the document.\n\nUse the editor\'s Auto button to renumber if needed.');
                              }
                            } else {
                              console.error('[RESTORE] No marker found and no changeTo text available');
                              alert('Cannot restore: This deletion was made before marker tracking was enabled and has no paragraph number.');
                              return;
                            }
                          }

                          if (restorationMade) {
                            // Auto-number all paragraphs after restore
                            restored = autoNumberAllParagraphs(restored);
                            console.log('[RESTORE] Auto-numbered paragraphs after restore');

                            setEditableContent(restored);
                            setDocumentContent(restored);

                            // Update feedback status
                            const updatedFeedback = feedback.map(f =>
                              f.id === item.id ? { ...f, status: 'pending' as const } : f
                            );
                            setFeedback(updatedFeedback);

                            // Save to database
                            authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                              method: 'PATCH',
                              body: JSON.stringify({
                                content: restored,  // Update main content field
                                htmlContent: restored,  // Update main htmlContent field
                                customFields: {
                                  ...documentData?.customFields,
                                  editableContent: restored,
                                  htmlContent: restored,
                                  content: restored,
                                  // Update all feedback fields
                                  crmComments: updatedFeedback,
                                  crmFeedback: updatedFeedback,
                                  draftFeedback: updatedFeedback,
                                  commentMatrix: updatedFeedback,
                                  lastEditedAt: new Date().toISOString()
                                }
                              })
                            }).then(response => {
                              if (response.ok) {
                                console.log('[RESTORE] ✅ Individual change saved to database');
                                alert('Change has been restored and saved successfully!');
                              } else {
                                console.error('[RESTORE] ❌ Failed to save');
                                alert('Change restored in view but failed to save to database');
                              }
                            }).catch(error => {
                              console.error('[RESTORE] ❌ Error saving:', error);
                              alert(`Error saving restore to database: ${error}`);
                            });
                          }
                        }
                      }}
                    >
                      Restore Original
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        // Mark as rejected
                        const updatedFeedback = feedback.map(f =>
                          f.id === item.id ? { ...f, status: 'rejected' as const } : f
                        );
                        setFeedback(updatedFeedback);

                        // Restore original text
                        let restored = editableContent;
                        if (item.changeFrom) {
                          // First, try to find restoration marker (for deletions)
                          const markerId = `RESTORE_${item.id}`;

                          // Try new marker format with encoded text
                          const markerRegex = new RegExp(`<!--${markerId}:([^>]+)-->`, 'g');
                          const markerMatch = editableContent.match(markerRegex);

                          if (markerMatch && markerMatch[0]) {
                            console.log('[REJECT & RESTORE] Found enhanced marker:', markerId);
                            // Extract the encoded HTML from the marker
                            const encodedMatch = markerMatch[0].match(/<!--RESTORE_[^:]+:([^>]+)-->/);
                            let restoredText = item.changeFrom;

                            if (encodedMatch && encodedMatch[1]) {
                              try {
                                // Decode the full HTML structure (with indentation)
                                const decodedHTML = decodeURIComponent(atob(encodedMatch[1]));
                                restoredText = decodedHTML;
                                console.log('[REJECT & RESTORE] Restored full paragraph HTML with indentation');
                              } catch (e) {
                                console.warn('[REJECT & RESTORE] Failed to decode HTML, using fallback');
                                if (item.paragraphNumber) {
                                  restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                                }
                              }
                            } else if (item.paragraphNumber) {
                              restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                              console.log('[REJECT & RESTORE] Restoring paragraph with number:', item.paragraphNumber);
                            }

                            restored = editableContent.replace(markerMatch[0], restoredText);
                            console.log('[REJECT & RESTORE] Restored deletion using enhanced marker');
                          }
                          // Fallback: Try old marker format (for backward compatibility)
                          else if (editableContent.includes(`<!--${markerId}-->`)) {
                            const oldMarkerPattern = `<!--${markerId}-->`;
                            console.log('[REJECT & RESTORE] Found old marker:', markerId);
                            // Reconstruct paragraph with number if this was a paragraph deletion
                            let restoredText = item.changeFrom;
                            if (item.paragraphNumber) {
                              // Restore as a paragraph with number
                              restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                              console.log('[REJECT & RESTORE] Restoring paragraph with number:', item.paragraphNumber);
                            }
                            restored = editableContent.replace(oldMarkerPattern, restoredText);
                            console.log('[REJECT & RESTORE] Restored deletion using old marker');
                          }
                          // Fallback: Standard text replacement (for modifications)
                          else if (item.changeTo && editableContent.includes(item.changeTo)) {
                            restored = editableContent.replace(item.changeTo, item.changeFrom);
                            console.log('[REJECT & RESTORE] Restored modification using text replacement');
                          }

                          // Auto-number all paragraphs after restore
                          restored = autoNumberAllParagraphs(restored);
                          console.log('[REJECT & RESTORE] Auto-numbered paragraphs after restore');

                          setEditableContent(restored);
                          setDocumentContent(restored);

                          // Save to database
                          authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                              content: restored,  // Update main content field
                              htmlContent: restored,  // Update main htmlContent field
                              customFields: {
                                ...documentData?.customFields,
                                editableContent: restored,
                                htmlContent: restored,
                                content: restored,
                                // Update all feedback fields
                                crmComments: updatedFeedback,
                                crmFeedback: updatedFeedback,
                                draftFeedback: updatedFeedback,
                                commentMatrix: updatedFeedback,
                                lastEditedAt: new Date().toISOString()
                              }
                            })
                          }).then(response => {
                            if (response.ok) {
                              console.log('[REJECT & RESTORE] ✅ Saved to database');
                              alert('Change has been rejected and original text restored successfully!');
                            } else {
                              console.error('[REJECT & RESTORE] ❌ Failed to save');
                              alert('Change rejected and restored in view but failed to save to database');
                            }
                          }).catch(error => {
                            console.error('[REJECT & RESTORE] ❌ Error saving:', error);
                            alert(`Error saving restore to database: ${error}`);
                          });
                        }
                      }}
                    >
                      Reject & Restore
                    </Button>
                  </Box>
                </ListItem>
              </Box>
            ))}

            {feedback.filter(f => f.status === 'merged').length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No changes have been applied yet
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowDetailedHistory(false)}>Close</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              console.log('[RESTORE ALL] Button clicked');
              console.log('[RESTORE ALL] Total feedback:', feedback.length);
              console.log('[RESTORE ALL] Feedback statuses:', feedback.map(f => ({ id: f.id, status: f.status })));

              const mergedItems = feedback.filter(f => f.status === 'merged');
              console.log('[RESTORE ALL] Merged items to restore:', mergedItems.length);

              if (mergedItems.length === 0) {
                alert('No changes have been applied yet. There is nothing to restore.');
                return;
              }

              if (confirm('Are you sure you want to restore all changes? This will undo all applied feedback.')) {
                console.log('[RESTORE ALL] User confirmed, restoring...');
                // Restore all changes
                let restoredContent = editableContent;
                let restoredCount = 0;

                for (const item of mergedItems) {
                  if (item.changeFrom) {
                    // First, try to find restoration marker (for deletions)
                    const markerId = `RESTORE_${item.id}`;

                    // Try new marker format with encoded text
                    const markerRegex = new RegExp(`<!--${markerId}:([^>]+)-->`, 'g');
                    const markerMatch = restoredContent.match(markerRegex);

                    if (markerMatch && markerMatch[0]) {
                      console.log('[RESTORE ALL] Found enhanced marker for item:', item.id);
                      // Extract the encoded HTML from the marker
                      const encodedMatch = markerMatch[0].match(/<!--RESTORE_[^:]+:([^>]+)-->/);
                      let restoredText = item.changeFrom;

                      if (encodedMatch && encodedMatch[1]) {
                        try {
                          // Decode the full HTML structure (with indentation)
                          const decodedHTML = decodeURIComponent(atob(encodedMatch[1]));
                          restoredText = decodedHTML;
                          console.log('[RESTORE ALL] Restored full paragraph HTML with indentation');
                        } catch (e) {
                          console.warn('[RESTORE ALL] Failed to decode HTML, using fallback');
                          if (item.paragraphNumber) {
                            restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                          }
                        }
                      } else if (item.paragraphNumber) {
                        restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                        console.log('[RESTORE ALL] Restoring paragraph with number:', item.paragraphNumber);
                      }

                      restoredContent = restoredContent.replace(markerMatch[0], restoredText);
                      restoredCount++;
                      console.log('[RESTORE ALL] Restored deletion using enhanced marker:', item.id);
                    }
                    // Fallback: Try old marker format (for backward compatibility)
                    else if (restoredContent.includes(`<!--${markerId}-->`)) {
                      const oldMarkerPattern = `<!--${markerId}-->`;
                      console.log('[RESTORE ALL] Found old marker for item:', item.id);
                      // Reconstruct paragraph with number if this was a paragraph deletion
                      let restoredText = item.changeFrom;
                      if (item.paragraphNumber) {
                        // Restore as a paragraph with number
                        restoredText = `<p>${item.paragraphNumber} ${item.changeFrom}</p>`;
                        console.log('[RESTORE ALL] Restoring paragraph with number:', item.paragraphNumber);
                      }
                      restoredContent = restoredContent.replace(oldMarkerPattern, restoredText);
                      restoredCount++;
                      console.log('[RESTORE ALL] Restored deletion using old marker:', item.id);
                    }
                    // Fallback: Standard text replacement (for modifications)
                    else if (item.changeTo && restoredContent.includes(item.changeTo)) {
                      restoredContent = restoredContent.replace(item.changeTo, item.changeFrom);
                      restoredCount++;
                      console.log('[RESTORE ALL] Restored modification:', item.id);
                    }
                    // Fallback for old deletions without markers
                    else if (item.paragraphNumber && item.changeFrom && !item.changeTo) {
                      console.warn('[RESTORE ALL] No marker found for item', item.id, 'attempting paragraph insertion fallback');
                      const paragraphNum = item.paragraphNumber;
                      const parts = paragraphNum.split('.').map(n => parseInt(n));

                      // Try to find the next paragraph
                      const nextParts = [...parts];
                      nextParts[nextParts.length - 1]++;
                      const nextNum = nextParts.join('.');
                      const nextParagraphRegex = new RegExp(`<p[^>]*>\\s*${nextNum.replace(/\./g, '\\.')}\\b`, 'i');
                      const matchNext = restoredContent.match(nextParagraphRegex);

                      if (matchNext) {
                        const insertPosition = restoredContent.indexOf(matchNext[0]);
                        const restoredParagraph = `<p>${paragraphNum} ${item.changeFrom}</p>\n`;
                        restoredContent = restoredContent.slice(0, insertPosition) + restoredParagraph + restoredContent.slice(insertPosition);
                        restoredCount++;
                        console.log('[RESTORE ALL] Inserted paragraph using adjacent method:', item.id);
                      } else {
                        // Try previous paragraph
                        const prevParts = [...parts];
                        prevParts[prevParts.length - 1]--;
                        if (prevParts[prevParts.length - 1] > 0) {
                          const prevNum = prevParts.join('.');
                          const prevParagraphRegex = new RegExp(`<p[^>]*>\\s*${prevNum.replace(/\./g, '\\.')}\\b[\\s\\S]*?</p>`, 'i');
                          const matchPrev = restoredContent.match(prevParagraphRegex);

                          if (matchPrev) {
                            const insertPosition = restoredContent.indexOf(matchPrev[0]) + matchPrev[0].length;
                            const restoredParagraph = `\n<p>${paragraphNum} ${item.changeFrom}</p>`;
                            restoredContent = restoredContent.slice(0, insertPosition) + restoredParagraph + restoredContent.slice(insertPosition);
                            restoredCount++;
                            console.log('[RESTORE ALL] Inserted paragraph using previous paragraph method:', item.id);
                          } else {
                            // Ultimate fallback: append at end
                            console.warn('[RESTORE ALL] Could not find adjacent paragraphs, appending at end for item:', item.id);
                            const restoredParagraph = `\n<p>${paragraphNum} ${item.changeFrom}</p>`;
                            restoredContent = restoredContent + restoredParagraph;
                            restoredCount++;
                            console.log('[RESTORE ALL] Appended paragraph at end of document:', item.id);
                          }
                        } else {
                          // Ultimate fallback: append at end
                          console.warn('[RESTORE ALL] Could not find previous paragraph, appending at end for item:', item.id);
                          const restoredParagraph = `\n<p>${paragraphNum} ${item.changeFrom}</p>`;
                          restoredContent = restoredContent + restoredParagraph;
                          restoredCount++;
                          console.log('[RESTORE ALL] Appended paragraph at end of document:', item.id);
                        }
                      }
                    }
                    else {
                      console.warn('[RESTORE ALL] Could not restore item:', item.id, '- marker or changeTo not found');
                    }
                  }
                }

                console.log('[RESTORE ALL] Restored', restoredCount, 'out of', mergedItems.length, 'items');

                // Auto-number all paragraphs after restore
                restoredContent = autoNumberAllParagraphs(restoredContent);
                console.log('[RESTORE ALL] Auto-numbered paragraphs after restore');

                setEditableContent(restoredContent);
                setDocumentContent(restoredContent);

                // Reset all feedback to pending
                const updatedFeedback = feedback.map(f =>
                  f.status === 'merged' ? { ...f, status: 'pending' as const } : f
                );
                setFeedback(updatedFeedback);

                // Save the restored content to database
                authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    content: restoredContent,  // Update main content field
                    htmlContent: restoredContent,  // Update main htmlContent field
                    customFields: {
                      ...documentData?.customFields,
                      editableContent: restoredContent,
                      htmlContent: restoredContent,
                      content: restoredContent,
                      // Update all feedback fields
                      crmComments: updatedFeedback,
                      crmFeedback: updatedFeedback,
                      draftFeedback: updatedFeedback,
                      commentMatrix: updatedFeedback,
                      lastEditedAt: new Date().toISOString()
                    }
                  })
                }).then(response => {
                  if (response.ok) {
                    console.log('[RESTORE ALL] ✅ Content saved to database');
                    alert(`All changes have been restored and saved successfully!\n\nRestored: ${restoredCount}/${mergedItems.length} items`);
                  } else {
                    console.error('[RESTORE ALL] ❌ Failed to save content');
                    alert('Changes restored in view but failed to save to database');
                  }
                }).catch(error => {
                  console.error('[RESTORE ALL] ❌ Error saving:', error);
                  alert(`Error saving restore to database: ${error}`);
                });

                setShowDetailedHistory(false);
              }
            }}
          >
            Restore All Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OPRReviewPage;