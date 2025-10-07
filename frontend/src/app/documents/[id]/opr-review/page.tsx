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
    saveToHistory: historyProps.saveToHistory,
    setDocumentData,
  });

  // Helper function to renumber paragraphs after deletion
  const renumberParagraphs = (content: string, deletedParagraphNum: string): string => {
    console.log('=== RENUMBERING PARAGRAPHS ===');
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

  // Apply selected feedback
  const applySelectedFeedback = async () => {
    const selected = feedback.filter((item: any) => item.selected);
    if (selected.length === 0) {
      alert('No feedback items selected');
      return;
    }

    for (const item of selected) {
      feedbackHandlers.setSelectedFeedback(item);
      await feedbackHandlers.handleMergeFeedback();
    }
  };

  // Apply all feedback items
  const applyAllFeedback = async () => {
    const applicableFeedback = feedback.filter(f =>
      (!f.status || f.status === 'pending') &&
      f.commentType !== 'C' &&
      f.changeTo
    );

    if (applicableFeedback.length === 0) {
      const criticalCount = feedback.filter(f =>
        (!f.status || f.status === 'pending') && f.commentType === 'C'
      ).length;

      if (criticalCount > 0) {
        alert(`Cannot apply all: ${criticalCount} critical feedback item(s) require manual review.`);
      } else {
        alert('No applicable feedback items to apply');
      }
      return;
    }

    if (!confirm(`Apply all ${applicableFeedback.length} non-critical feedback items?`)) {
      return;
    }

    let updatedContent = editableContent;
    let updatedFeedbackList = [...feedback];
    const newAppliedChanges = new Map(appliedChanges);

    for (const item of applicableFeedback) {
      if (item.changeFrom && item.changeTo) {
        updatedContent = updatedContent.replace(item.changeFrom, item.changeTo);

        const changeId = `bulk_${Date.now()}`;
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

    setEditableContent(updatedContent);
    setFeedback(updatedFeedbackList);
    setAppliedChanges(newAppliedChanges);

    try {
      await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            editableContent: updatedContent,
            crmFeedback: updatedFeedbackList,
          }
        })
      });
    } catch (error) {
      console.error('Error saving bulk changes:', error);
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
        isEditingDocument={isEditingDocument}
        savingDocument={savingDocument}
        exporting={exporting}
        exportAnchorEl={exportAnchorEl}
        onEditToggle={() => setIsEditingDocument(!isEditingDocument)}
        onSaveDocument={handleSaveDocument}
        onExport={handleExport}
        onExportMenuOpen={(e) => setExportAnchorEl(e.currentTarget)}
        onExportMenuClose={() => setExportAnchorEl(null)}
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
            onSelectAll={() => setSelectAll(!selectAll)}
            onSaveDocument={handleSaveDocument}
            onShowHistory={() => setShowDetailedHistory(true)}
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
                        if (isDeletion && selectedFeedback.paragraphNumber) {
                          console.log('Attempting paragraph deletion with renumbering:', selectedFeedback.paragraphNumber);

                          // Try to find and remove the entire paragraph including number
                          // Match pattern like: <p>1.1.2.1.1.1 Communication systems...</p>
                          const paragraphNum = selectedFeedback.paragraphNumber;
                          const escapedNum = escapeRegex(paragraphNum);

                          // Try multiple patterns to match the paragraph
                          const patterns = [
                            // Pattern 1: <p>number text</p>
                            new RegExp(`<p[^>]*>\\s*${escapedNum}\\s+${escapeRegex(changeFromText.trim())}\\s*</p>`, 'i'),
                            // Pattern 2: <p>number</p><p>text</p>
                            new RegExp(`<p[^>]*>\\s*${escapedNum}\\s*</p>\\s*<p[^>]*>\\s*${escapeRegex(changeFromText.trim())}\\s*</p>`, 'i'),
                            // Pattern 3: Just the paragraph with number at start
                            new RegExp(`<p[^>]*>\\s*${escapedNum}[^<]*${escapeRegex(changeFromText.substring(0, 50))}[\\s\\S]*?</p>`, 'i'),
                          ];

                          for (const pattern of patterns) {
                            if (pattern.test(currentContent)) {
                              updatedContent = currentContent.replace(pattern, '');
                              replacementMade = true;
                              console.log('Removed paragraph with pattern match');
                              break;
                            }
                          }

                          // Fallback: Try to find just the text without paragraph tags
                          if (!replacementMade) {
                            const textPattern = new RegExp(`${escapedNum}\\s+${escapeRegex(changeFromText.trim())}`, 'i');
                            if (textPattern.test(currentContent)) {
                              updatedContent = currentContent.replace(textPattern, '');
                              replacementMade = true;
                              console.log('Removed paragraph text with number');
                            }
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

                            updatedContent = currentContent.replace(
                              changeFromText,
                              changeToText
                            );
                            replacementMade = true;
                            console.log('Replaced using exact match');
                          }
                        }
                        // Method 2: Try with regex to ignore HTML tags
                        if (!replacementMade) {
                          // Create a regex that matches the text even if it spans across HTML tags
                          const textToFind = escapeRegex(changeFromText);
                          // This regex will match the text even if there are HTML tags in between
                          const regex = new RegExp(textToFind.split(/\s+/).join('(?:\\s|<[^>]*>)*'), 'i');

                          if (regex.test(currentContent)) {
                            updatedContent = currentContent.replace(regex, changeToText);
                            replacementMade = true;
                            console.log('Replaced using regex (ignoring HTML tags)');
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

                              // Simple replacement - just replace first occurrence
                              updatedContent = currentContent.replace(
                                changeFromText,
                                changeToText
                              );
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

                          // Force re-render of the document viewer by toggling edit mode
                          setIsEditingDocument(true);
                          setTimeout(() => {
                            setIsEditingDocument(false);
                          }, 10);

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
                              console.log('Saving document and feedback to database...');

                              // Save document content and feedback status
                              const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                                method: 'PATCH',
                                body: JSON.stringify({
                                  customFields: {
                                    ...documentData?.customFields,
                                    editableContent: updatedContent,
                                    htmlContent: updatedContent,
                                    content: updatedContent,
                                    crmComments: updatedFeedback,
                                    crmFeedback: updatedFeedback,
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
                                console.log('Document and feedback saved successfully!');
                              } else {
                                console.error('Failed to save document:', response.statusText);
                              }
                            } catch (error) {
                              console.error('Error saving to database:', error);
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
            <Box sx={{ p: 1, bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="subtitle2">
                Feedback Items ({feedback.length})
              </Typography>
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
                  {feedback.map((item, index) => (
                    <ListItem
                      key={item.id || index}
                      button
                      onClick={() => setSelectedFeedback(item)}
                      selected={selectedFeedback?.id === item.id}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                        '&.Mui-selected': { bgcolor: 'action.selected' }
                      }}
                    >
                      <ListItemText
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
                feedback.filter(f => f.status === 'merged' && f.changeFrom && f.changeTo).forEach(item => {
                  const from = item.changeFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const to = item.changeTo;

                  // Replace original text with strikethrough original + highlighted new text
                  comparisonHtml = comparisonHtml.replace(
                    new RegExp(to, 'g'),
                    `<del>${item.changeFrom}</del><ins>${to}</ins>`
                  );
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
                        if (item.changeTo && item.changeFrom) {
                          const restored = editableContent.replace(item.changeTo, item.changeFrom);
                          setEditableContent(restored);
                          setDocumentContent(restored);

                          // Update feedback status
                          const updatedFeedback = feedback.map(f =>
                            f.id === item.id ? { ...f, status: 'pending' as const } : f
                          );
                          setFeedback(updatedFeedback);

                          alert('Change has been restored');
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
                        if (item.changeTo && item.changeFrom) {
                          const restored = editableContent.replace(item.changeTo, item.changeFrom);
                          setEditableContent(restored);
                          setDocumentContent(restored);
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
              if (confirm('Are you sure you want to restore all changes? This will undo all applied feedback.')) {
                // Restore all changes
                let restoredContent = editableContent;
                const mergedItems = feedback.filter(f => f.status === 'merged');

                for (const item of mergedItems) {
                  if (item.changeTo && item.changeFrom) {
                    restoredContent = restoredContent.replace(item.changeTo, item.changeFrom);
                  }
                }

                setEditableContent(restoredContent);
                setDocumentContent(restoredContent);

                // Reset all feedback to pending
                const updatedFeedback = feedback.map(f =>
                  f.status === 'merged' ? { ...f, status: 'pending' as const } : f
                );
                setFeedback(updatedFeedback);

                alert('All changes have been restored');
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