'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '../../../../lib/authTokenService';
import DocumentNumbering from '../../../../components/DocumentNumbering';
import CollectedFeedbackView from '../../../../components/workflow/CollectedFeedbackView';
import OPRFeedbackProcessorV2Enhanced from '../../../../components/feedback/OPRFeedbackProcessorV2Enhanced';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Menu,
  Checkbox,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Delete as DeleteIcon,
  Send as SendIcon,
  Description as DocumentIcon,
  Comment as CommentIcon,
  Merge as MergeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  Code as HtmlIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Cancel,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  BatchPrediction as BatchIcon,
  History as HistoryIcon,
  NavigateNext,
  TrackChanges as TrackChangesIcon,
  AutoAwesome as GenerateAIIcon,
  Build,
  List as ListIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Compare as CompareIcon,
  CheckCircleOutline as AcceptAllIcon,
  HighlightOff as RejectAllIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface CommentThread {
  id: string;
  feedbackId: string;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: Date;
  }>;
}

interface CRMComment {
  id?: string;
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  commentType: string;
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution?: string;
  originatorJustification?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'merged';
  selected?: boolean;
  threadId?: string;
}

const OPRReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [documentData, setDocumentData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [feedback, setFeedback] = useState<CRMComment[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<CRMComment | null>(null);
  const [mergeMode, setMergeMode] = useState<'manual' | 'ai' | 'hybrid'>('manual');
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [processingMerge, setProcessingMerge] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [showPositionDetails, setShowPositionDetails] = useState(true);
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeResult, setMergeResult] = useState<string>('');
  const [processingWorkflow, setProcessingWorkflow] = useState(false);
  const [mergeResultContent, setMergeResultContent] = useState<string>('');
  const [highlightedText, setHighlightedText] = useState<string>(''); // Store text to highlight // Store actual content separately
  const [loading, setLoading] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showCriticalBlockedDialog, setShowCriticalBlockedDialog] = useState(false);
  const [phoneCallMade, setPhoneCallMade] = useState(false);
  const [downgradedType, setDowngradedType] = useState<string>('M');
  const [phoneCallNotes, setPhoneCallNotes] = useState<string>('');
  const [alert, setAlert] = useState<{ severity: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);

  // Track changes state management
  const [changeHistory, setChangeHistory] = useState<Array<{
    content: string,
    feedback: CRMComment[],
    timestamp: Date,
    changes?: {
      applied: number,
      merged: number,
      details: Array<{
        id: string,
        original: string,
        changed: string,
        feedbackId: string
      }>
    }
  }>>([]);
  const changeHistoryRef = useRef<typeof changeHistory>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [appliedChanges, setAppliedChanges] = useState<Map<string, { original: string, changed: string, feedbackId: string }>>(new Map());
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [changeMarkers, setChangeMarkers] = useState<Array<{ id: string, start: number, end: number, type: 'added' | 'removed' | 'modified' }>>([])
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [componentKey, setComponentKey] = useState(0); // Force re-render key

  // Keep ref in sync with state
  useEffect(() => {
    changeHistoryRef.current = changeHistory;
    console.log('History ref updated, now has', changeHistory.length, 'versions');
  }, [changeHistory]);

  // Helper function to save to history and database
  const saveToHistory = async (newAppliedChanges?: Map<string, { original: string, changed: string, feedbackId: string }>) => {
    // Use provided changes or current state
    const changesToSave = newAppliedChanges || appliedChanges;

    // Get the latest history state from the ref to avoid stale closures
    const currentHistoryFromRef = changeHistoryRef.current;
    console.log('saveToHistory using ref - current history length:', currentHistoryFromRef.length);

    // Get the latest history state to ensure we're not missing updates
    let updatedHistory: any[] = [];

    setChangeHistory(currentHistory => {
      // Use the ref value as the source of truth
      let historyToUpdate = [...currentHistoryFromRef];

      // If this is the first history entry, create the original version first
      if (historyToUpdate.length === 0) {
        // Create the original version (before any changes)
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
      console.log('History updated in saveToHistory:', currentHistory.length, '->', newHistory.length);

      // Store for database save
      updatedHistory = newHistory;
      return newHistory;
    });

    // Save to database with the updated history
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
        console.log('Version history saved to database successfully');
        // Update local documentData to keep it in sync
        setDocumentData(prevData => ({
          ...prevData,
          customFields: {
            ...prevData?.customFields,
            versionHistory: updatedHistory,
            lastHistorySave: new Date().toISOString()
          }
        }));
      } else {
        console.error('Failed to save version history. Response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = changeHistory[historyIndex - 1];
      setEditableContent(prevState.content);
      setFeedback(prevState.feedback);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < changeHistory.length - 1) {
      const nextState = changeHistory[historyIndex + 1];
      setEditableContent(nextState.content);
      setFeedback(nextState.feedback);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Navigate to next change
  const navigateToNextChange = () => {
    if (changeMarkers.length > 0) {
      const nextIndex = (currentChangeIndex + 1) % changeMarkers.length;
      setCurrentChangeIndex(nextIndex);
      scrollToChange(changeMarkers[nextIndex]);
    }
  };

  // Navigate to previous change
  const navigateToPreviousChange = () => {
    if (changeMarkers.length > 0) {
      const prevIndex = currentChangeIndex === 0 ? changeMarkers.length - 1 : currentChangeIndex - 1;
      setCurrentChangeIndex(prevIndex);
      scrollToChange(changeMarkers[prevIndex]);
    }
  };

  // Scroll to a specific change
  const scrollToChange = (marker: { id: string, start: number, end: number }) => {
    const element = document.getElementById(`change-${marker.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'pulse 2s';
      setTimeout(() => {
        element.style.animation = '';
      }, 2000);
    }
  };

  // Accept all changes
  const handleAcceptAllChanges = async () => {
    if (confirm('Accept all pending changes? This will apply all feedback items.')) {
      for (const item of feedback) {
        if (item.status === 'pending' && item.changeTo) {
          setSelectedFeedback(item);
          await handleMergeFeedback();
        }
      }
      saveToHistory();
    }
  };

  // Reject all changes
  const handleRejectAllChanges = () => {
    if (confirm('Reject all pending changes? This will remove all pending feedback items.')) {
      const acceptedFeedback = feedback.filter(f => f.status !== 'pending');
      setFeedback(acceptedFeedback);
      saveToHistory();
    }
  };

  // OPR response fields
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
    coordinatorJustification: '',
    resolution: '',
    originatorJustification: ''
  });

  // Define fetchDocumentAndFeedback function before useEffect
  const fetchDocumentAndFeedback = async () => {
    try {
      let hasFeedbackFromDoc = false;

      // Fetch document
      const docResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
      if (docResponse.ok) {
        const data = await docResponse.json();
        const doc = data.document || data;
        setDocumentData(doc);
        console.log('Loaded document. Has version history?', !!(doc.customFields?.versionHistory),
                    'History length:', doc.customFields?.versionHistory?.length || 0);

        // Get content - use editableContent to avoid duplicate header
        let content = '';
        if (doc.customFields?.editableContent) {
        // Use editable content (has styles but no header)
        content = doc.customFields.editableContent;
        } else if (doc.customFields?.htmlContent) {
        // Fallback to full HTML if no editableContent
        content = doc.customFields.htmlContent;
        } else if (doc.customFields?.content) {
          // Fallback to plain text content (no styles)
          content = doc.customFields.content;
        } else if (doc.content) {
          content = doc.content;
        } else if (doc.description) {
          content = `<p>${doc.description}</p>`;
        }
        
        // Check for duplicates WHEN LOADING
        const h1CountOnLoad = (content.match(/<h1>/g) || []).length;
        const sectionICountOnLoad = (content.match(/SECTION I - INTRODUCTION/g) || []).length;
        
        setDocumentContent(content);
        setEditableContent(content);
        
        // DEBUG: Log what we're loading
        console.log('🔍 OPR PAGE - Loading document content:', {
          hasInlineStyles: content.includes('style='),
          styleCount: (content.match(/style="/g) || []).length,
          firstStyle: content.indexOf('style=') > -1 ? content.substring(content.indexOf('style='), content.indexOf('style=') + 150) : 'NO STYLES FOUND',
          contentLength: content.length,
          hasContent: !!content,
          contentSource: doc.customFields?.content ? 'customFields.content' : 
                        doc.content ? 'content' : 
                        doc.description ? 'description' : 'unknown',
          first100: content.substring(0, 100),
          rawCustomFieldsLength: doc.customFields?.content?.length || 0,
          fullDocSize: JSON.stringify(doc).length,
          h1Count: h1CountOnLoad,
          sectionICount: sectionICountOnLoad,
          hasDuplicates: h1CountOnLoad > 1 || sectionICountOnLoad > 1 ? '❌ YES' : '✅ NO'
        });
        
        if (h1CountOnLoad > 1 || sectionICountOnLoad > 1) {
          console.error('❌ CRITICAL: Document loaded from database ALREADY HAS DUPLICATES!');
          console.error('  - H1 headers:', h1CountOnLoad);
          console.error('  - Section I occurrences:', sectionICountOnLoad);
        }
        
        // Load feedback from document's customFields
        if (doc.customFields && typeof doc.customFields === 'object') {
          const customFields = doc.customFields as any;
          
          // Check for draftFeedback (from Review & CRM page)
          if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
            setFeedback(customFields.draftFeedback);
            console.log('Loaded', customFields.draftFeedback.length, 'draft feedback items from database');
            hasFeedbackFromDoc = true;
          } 
          // Check for CRM feedback (from AI generated documents)
          else if (customFields.crmFeedback && Array.isArray(customFields.crmFeedback)) {
            setFeedback(customFields.crmFeedback);
            console.log('Loaded', customFields.crmFeedback.length, 'CRM feedback items from database');
            hasFeedbackFromDoc = true;
          }
          // Also check for submitted feedback
          else if (customFields.feedback && Array.isArray(customFields.feedback)) {
            setFeedback(customFields.feedback);
            console.log('Loaded', customFields.feedback.length, 'feedback items from database');
            hasFeedbackFromDoc = true;
          }
          // Check for comments
          else if (customFields.comments && Array.isArray(customFields.comments)) {
            setFeedback(customFields.comments);
            console.log('Loaded', customFields.comments.length, 'comments from database');
            hasFeedbackFromDoc = true;
          } else {
            console.log('No feedback found in database customFields');
          }
        }

        // Also try to fetch from feedback endpoint (for submitted feedback)
        // Only if we haven't found any feedback in customFields
        if (!hasFeedbackFromDoc) {
          try {
            const feedbackResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/feedback`);
            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              if (feedbackData.feedback && Array.isArray(feedbackData.feedback)) {
                setFeedback(feedbackData.feedback);
                console.log('Loaded feedback from API endpoint');
              } else if (feedbackData.comments && Array.isArray(feedbackData.comments)) {
                setFeedback(feedbackData.comments);
                console.log('Loaded comments from API endpoint');
              }
            }
          } catch (error) {
            console.log('Could not fetch from feedback endpoint:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching document or feedback:', error);
    }
  };

  useEffect(() => {
    fetchDocumentAndFeedback();
  }, [documentId, router]);

  // Track if history has been initialized
  const [historyInitialized, setHistoryInitialized] = useState(false);

  // Initialize history when document is loaded - load from database only
  useEffect(() => {
    if (documentData && documentContent && !historyInitialized) {
      // Load existing history from database
      if (documentData.customFields?.versionHistory && documentData.customFields.versionHistory.length > 0) {
        // Convert stored dates back to Date objects
        const loadedHistory = documentData.customFields.versionHistory.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setChangeHistory(loadedHistory);
        setHistoryIndex(loadedHistory.length - 1);
        setHistoryInitialized(true);

        // Also restore applied changes from the latest version
        if (loadedHistory.length > 0) {
          const latestVersion = loadedHistory[loadedHistory.length - 1];
          if (latestVersion.changes && latestVersion.changes.details) {
            const restoredChanges = new Map();
            latestVersion.changes.details.forEach(change => {
              restoredChanges.set(change.id, {
                original: change.original,
                changed: change.changed,
                feedbackId: change.feedbackId
              });
            });
            setAppliedChanges(restoredChanges);
          }
        }

        console.log('Loaded version history from database:', loadedHistory.length, 'versions');
      } else {
        console.log('No version history found in database');
        setHistoryInitialized(true);
      }
      // Don't create initial version automatically - only create when feedback is applied
    }
  }, [documentData, documentContent, historyInitialized]);

  // Effect to handle highlighting when text needs to be highlighted
  useEffect(() => {
    if (highlightedText && !showMergeDialog) {
      // Wait for editor to be ready and content to be rendered
      const attemptHighlight = () => {
        const editorElement = document.querySelector('.ck-editor__editable');
        if (editorElement) {
          // Strip HTML tags from the text to search
          const searchText = highlightedText.replace(/<[^>]*>/g, '').trim();
          
          if (searchText) {
            // Create a tree walker to find the text node
            const walker = document.createTreeWalker(
              editorElement,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let node;
            let found = false;
            
            while (node = walker.nextNode()) {
              const textNode = node as Text;
              const nodeText = textNode.textContent || '';
              
              if (nodeText.includes(searchText)) {
                // Found the text, create a range to select it
                const range = document.createRange();
                const startIndex = nodeText.indexOf(searchText);
                
                range.setStart(textNode, startIndex);
                range.setEnd(textNode, startIndex + searchText.length);
                
                // Create highlight element
                const highlightSpan = document.createElement('span');
                highlightSpan.style.backgroundColor = '#ffeb3b';
                highlightSpan.style.padding = '2px 4px';
                highlightSpan.style.borderRadius = '3px';
                highlightSpan.style.transition = 'all 0.3s ease';
                highlightSpan.className = 'merge-highlight';
                
                try {
                  // Wrap the text in highlight span
                  range.surroundContents(highlightSpan);
                  
                  // Scroll to the highlighted text
                  highlightSpan.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                  
                  // Also focus the editor
                  if (editorElement instanceof HTMLElement) {
                    editorElement.focus();
                  }
                  
                  // Remove highlight after 5 seconds
                  setTimeout(() => {
                    highlightSpan.style.backgroundColor = 'transparent';
                    
                    setTimeout(() => {
                      // Unwrap the span
                      const parent = highlightSpan.parentNode;
                      while (highlightSpan.firstChild) {
                        parent?.insertBefore(highlightSpan.firstChild, highlightSpan);
                      }
                      parent?.removeChild(highlightSpan);
                    }, 300);
                  }, 5000);
                  
                  found = true;
                  break;
                } catch (e) {
                  console.log('Could not wrap text, trying alternative method');
                  
                  // Alternative: Just scroll to the position
                  const rect = range.getBoundingClientRect();
                  window.scrollTo({
                    top: window.scrollY + rect.top - window.innerHeight / 2,
                    behavior: 'smooth'
                  });
                  
                  found = true;
                  break;
                }
              }
            }
            
            if (!found) {
              console.log('Text not found in editor:', searchText);
            }
          }
          
          // Clear the highlighted text state
          setHighlightedText('');
        }
      };
      
      // Try multiple times with delays to ensure content is rendered
      setTimeout(attemptHighlight, 100);
      setTimeout(attemptHighlight, 500);
      setTimeout(attemptHighlight, 1000);
    }
  }, [highlightedText, showMergeDialog]);

  const handleFeedbackClick = (comment: CRMComment) => {
    setSelectedFeedback(comment);
    // Note: Don't set currentComment here as it's used for form editing, not viewing
  };

  // Toggle select all feedback items
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setFeedback(items =>
      items.map(item => ({ ...item, selected: newSelectAll }))
    );
  };

  // Toggle individual item selection
  const handleToggleSelect = (id: string) => {
    setFeedback(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Apply selected feedback items
  const applySelectedFeedback = async () => {
    const selected = feedback.filter(item => item.selected);
    if (selected.length === 0) {
      window.alert('No feedback items selected');
      return;
    }

    // Apply each selected item
    for (const item of selected) {
      setSelectedFeedback(item);
      await handleMergeFeedback();
    }
  };

  // Apply all feedback items
  const applyAllFeedback = async () => {
    // Filter for pending, non-critical feedback that has changes to apply
    const applicableFeedback = feedback.filter(f =>
      (!f.status || f.status === 'pending') &&
      f.commentType !== 'C' &&  // Skip critical feedback
      f.changeTo  // Only items with actual changes
    );

    if (applicableFeedback.length === 0) {
      // Check if there are critical items
      const criticalCount = feedback.filter(f =>
        (!f.status || f.status === 'pending') && f.commentType === 'C'
      ).length;

      if (criticalCount > 0) {
        window.alert(`Cannot apply all: ${criticalCount} critical feedback item(s) require manual review. Non-critical items: ${applicableFeedback.length}`);
      } else {
        window.alert('No applicable feedback items to apply');
      }
      return;
    }

    if (!confirm(`Apply all ${applicableFeedback.length} non-critical feedback items? (Critical items will be skipped)`)) {
      return;
    }

    let successCount = 0;
    setLoading(true);
    let updatedContent = editableContent;
    let updatedFeedbackList = [...feedback];
    const newAppliedChanges = new Map(appliedChanges);

    try {
      // Apply each non-critical pending feedback item
      for (const item of applicableFeedback) {
        console.log(`Applying feedback ${successCount + 1}/${applicableFeedback.length}: ${item.id}`);

        // Apply the change to content
        if (item.changeFrom && item.changeTo) {
          updatedContent = updatedContent.replace(item.changeFrom, item.changeTo);

          // Track this change in appliedChanges map for comparison view
          const changeId = `bulk_${Date.now()}_${successCount}`;
          newAppliedChanges.set(changeId, {
            original: item.changeFrom,
            changed: item.changeTo,
            feedbackId: item.id || ''
          });
        }

        // Mark this specific feedback as merged in our list
        updatedFeedbackList = updatedFeedbackList.map(f =>
          f.id === item.id ? { ...f, status: 'merged' as const } : f
        );

        successCount++;

        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Update all states at once
      setEditableContent(updatedContent);
      setFeedback(updatedFeedbackList);
      setAppliedChanges(newAppliedChanges);

      if (documentData) {
        setDocumentData(prevData => ({
          ...prevData,
          customFields: {
            ...prevData.customFields,
            crmFeedback: updatedFeedbackList,
            draftFeedback: updatedFeedbackList,
            content: updatedContent,
            editableContent: updatedContent
          }
        }));
      }

      // Final save to ensure all changes are persisted
      try {
        console.log('Saving final state after applying all feedback');
        const finalResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customFields: {
              crmFeedback: updatedFeedbackList,
              draftFeedback: updatedFeedbackList,
              content: updatedContent,
              editableContent: updatedContent,
              lastBulkApply: new Date().toISOString()
            }
          })
        });

        if (!finalResponse.ok) {
          console.error('Final save failed:', finalResponse.status);
        } else {
          console.log('Final state saved successfully');
        }
      } catch (saveError) {
        console.error('Error saving final state:', saveError);
      }

      window.alert(`✅ Successfully applied ${successCount} feedback items. All applied items are now disabled and saved to database.`);
    } catch (error) {
      console.error('Error applying feedback:', error);
      window.alert(`Applied ${successCount} of ${applicableFeedback.length} items before error occurred.`);
    } finally {
      setLoading(false);
      setSelectedFeedback(null);
    }
  };

  // Generate AI feedback
  const generateAIFeedback = async () => {
    setGeneratingAIFeedback(true);
    try {
      const response = await authTokenService.authenticatedFetch('/api/generate-ai-feedback', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          documentContent: editableContent,
          documentType: 'OPR'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Convert AI feedback to CRM format
        const aiFeedback = result.feedback.map((item: any, index: number) => ({
          id: `ai_${Date.now()}_${index}`,
          component: item.category || 'AI Generated',
          pocName: 'AI Assistant',
          pocPhone: '',
          pocEmail: '',
          commentType: item.severity === 'CRITICAL' ? 'C' :
                      item.severity === 'MAJOR' ? 'M' :
                      item.severity === 'SUBSTANTIVE' ? 'S' : 'A',
          page: item.page?.toString() || '1',
          paragraphNumber: item.paragraph?.toString() || '1',
          lineNumber: item.line?.toString() || '1',
          coordinatorComment: item.comment,
          changeFrom: item.originalText || '',
          changeTo: item.suggestedText || '',
          coordinatorJustification: `AI Analysis: ${item.category}`,
          status: 'pending' as const,
          selected: false
        }));

        setFeedback(prev => [...prev, ...aiFeedback]);

        // Save the AI feedback to database
        const allFeedback = [...feedback, ...aiFeedback];
        console.log('Saving AI feedback to database:', {
          documentId,
          feedbackCount: allFeedback.length,
          newFeedbackCount: aiFeedback.length
        });

        const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            customFields: {
              crmFeedback: allFeedback,
              lastAIFeedbackGenerated: new Date().toISOString()
            }
          })
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('Failed to save feedback to database:', errorText);
          window.alert(`Generated ${aiFeedback.length} AI feedback items but failed to save to database`);
        } else {
          console.log('AI feedback saved successfully to database');
          window.alert(`Generated ${aiFeedback.length} AI feedback items and saved to database`);
        }
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      window.alert('Failed to generate AI feedback');
    } finally {
      setGeneratingAIFeedback(false);
    }
  };

  const handleMergeModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'manual' | 'ai' | 'hybrid' | null) => {
    if (newMode !== null) {
      setMergeMode(newMode);
    }
  };

  const handleClearSelectedFeedback = async () => {
    const selectedItems = feedback.filter(item => item.selected);
    const selectedCount = selectedItems.length;

    if (selectedCount === 0) {
      window.alert('No feedback items selected.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCount} selected feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Delete Selected: Starting deletion for', selectedCount, 'items');

      // Get the IDs of selected items
      const idsToDelete = selectedItems.map(item => item.id).filter(id => id);

      console.log('Delete Selected: IDs to delete:', idsToDelete);

      // Remove selected items from local state immediately
      const remainingFeedback = feedback.filter(item => !item.selected);
      setFeedback(remainingFeedback);

      // Clear selected feedback if it was selected
      if (selectedFeedback?.selected) {
        setSelectedFeedback(null);
      }

      // Delete selected feedback from database
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/feedback`, {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackIdsToDelete: idsToDelete
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Delete Selected: Success response:', result);

        // Also update documentData
        if (documentData) {
          setDocumentData((prevData: any) => ({
            ...prevData,
            customFields: {
              ...prevData.customFields,
              crmFeedback: remainingFeedback,
              draftFeedback: remainingFeedback
            }
          }));
        }

        window.alert(`${result.deletedCount || selectedCount} feedback items deleted successfully from database.`);
      } else {
        const errorData = await response.json();
        console.error('Delete Selected: Error response:', errorData);
        window.alert(`Failed to delete feedback: ${errorData.error || 'Unknown error'}`);
        // Reload feedback in case of failure
        await fetchDocumentAndFeedback();
      }
    } catch (error) {
      console.error('Error deleting selected feedback:', error);
      window.alert('Error deleting feedback. Please try again.');
      // Reload feedback in case of error
      await fetchDocumentAndFeedback();
    }
  };

  const handleClearAllFeedback = async () => {
    if (!confirm(`Are you sure you want to clear all ${feedback.length} feedback items? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Clear All: Starting clear operation for document:', documentId);
      console.log('Clear All: Current feedback count:', feedback.length);

      // Clear feedback from local state first
      setFeedback([]);
      setSelectedFeedback(null);

      console.log('Clear All: Calling DELETE endpoint to clear all feedback from database');

      // Call the DELETE endpoint to clear all feedback from database
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/feedback`, {
        method: 'DELETE'
      });

      console.log('Clear All: Response status:', response.status);
      console.log('Clear All: Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Clear All: Success response:', result);

        // Also update documentData to clear feedback
        if (documentData) {
          setDocumentData((prevData: any) => ({
            ...prevData,
            customFields: {
              ...prevData.customFields,
              draftFeedback: [],
              crmFeedback: [],
              feedback: [],
              comments: []
            }
          }));
        }

        window.alert('All feedback has been cleared successfully from the database.');
      } else {
        const errorData = await response.json();
        console.error('Clear All: Error response:', errorData);
        window.alert(`Failed to clear feedback: ${errorData.error || 'Unknown error'}`);
        // Reload feedback in case of failure
        await fetchDocumentAndFeedback();
      }
    } catch (error) {
      console.error('Error clearing feedback:', error);
      window.alert('Error clearing feedback. Please try again.');
      // Reload feedback in case of error
      await fetchDocumentAndFeedback();
    }
  };

  const handleMergeFeedback = async () => {
    if (!selectedFeedback) return;

    // Track the change FIRST, before saving to history
    const changeId = `change_${Date.now()}`;

    // Create a map with ONLY the current change for this version
    const currentVersionChanges = new Map();
    currentVersionChanges.set(changeId, {
      original: selectedFeedback.changeFrom || '',
      changed: selectedFeedback.changeTo || '',
      feedbackId: selectedFeedback.id || ''
    });

    // Update the cumulative applied changes
    const newAppliedChanges = new Map(appliedChanges);
    newAppliedChanges.set(changeId, {
      original: selectedFeedback.changeFrom || '',
      changed: selectedFeedback.changeTo || '',
      feedbackId: selectedFeedback.id || ''
    });
    setAppliedChanges(newAppliedChanges);

    // Save to history with ONLY the current version's changes
    console.log('Saving to history - current history length:', changeHistoryRef.current.length);
    await saveToHistory(currentVersionChanges);
    console.log('After saving - new history length:', changeHistoryRef.current.length);

    // Add change marker
    const newMarker = {
      id: changeId,
      start: editableContent.indexOf(selectedFeedback.changeFrom || ''),
      end: editableContent.indexOf(selectedFeedback.changeFrom || '') + (selectedFeedback.changeTo?.length || 0),
      type: 'modified' as const
    };
    setChangeMarkers([...changeMarkers, newMarker]);

    // Check if this is critical feedback - critical feedback cannot be merged without resolution
    if (selectedFeedback.commentType === 'C') {
      const pocInfo = selectedFeedback.pocName ? 
        `${selectedFeedback.pocName}${selectedFeedback.pocPhone ? ' at ' + selectedFeedback.pocPhone : ''}` : 
        'the feedback submitter';
      window.window.alert(`Critical feedback cannot be merged without proper resolution.\n\nYou must either:\n1. Provide a resolution in the OPR Response Form, OR\n2. Make a phone call to ${pocInfo} to discuss the issue, then downgrade the feedback type.\n\nThe system will require confirmation of the phone call and notes from your discussion.`);
      return;
    }
    
    console.log('=== FRONTEND MERGE DEBUG ===');
    console.log('Selected Feedback:', selectedFeedback);
    console.log('Merge Mode:', mergeMode);
    console.log('Document Content Length:', editableContent.length);
    
    setProcessingMerge(true);
    setShowMergeDialog(true);
    
    try {
      // Get the numbered HTML from the DocumentNumbering component
      // We need to get the processed HTML with data-paragraph attributes
      // For now, we'll send the raw content but the API will process it
      // CRITICAL FIX: Always send the current editableContent which has all previous merges
      // The editableContent is the source of truth for the current state
      const documentContentToSend = editableContent;
      
      // Check document BEFORE sending to backend
      const h1CountBefore = (documentContentToSend.match(/<h1>/g) || []).length;
      const sectionICountBefore = (documentContentToSend.match(/SECTION I - INTRODUCTION/g) || []).length;
      console.log('BEFORE SENDING TO BACKEND:');
      console.log('  - H1 count:', h1CountBefore, h1CountBefore > 1 ? '❌ ALREADY HAS DUPLICATES!' : '✅');
      console.log('  - Section I count:', sectionICountBefore, sectionICountBefore > 1 ? '❌ ALREADY HAS DUPLICATES!' : '✅');
      
      if (h1CountBefore > 1 || sectionICountBefore > 1) {
        console.error('❌ CRITICAL: Sending corrupted content to backend!');
        console.error('The editableContent already has duplicates before merge!');
      }
      
      console.log('Sending to backend:', {
        mode: mergeMode,
        hasChangeFrom: !!selectedFeedback.changeFrom,
        hasChangeTo: !!selectedFeedback.changeTo,
        page: selectedFeedback.page,
        paragraph: selectedFeedback.paragraphNumber,
        line: selectedFeedback.lineNumber,
        contentSource: 'editable (current state)',
        contentLength: documentContentToSend.length,
        documentDataContentLength: documentData?.customFields?.content?.length || 0,
        editableContentLength: editableContent.length
      });
      
      if (mergeMode === 'ai') {
        // AI merge - Call the BACKEND endpoint through our proxy
        console.log('🤖 AI MERGE DEBUG - Starting AI merge');
        console.log('  - Feedback ID:', selectedFeedback.id);
        console.log('  - Current content length:', documentContentToSend.length);
        console.log('  - Current feedback count:', feedback.length);
        console.log('  - Change From:', selectedFeedback.changeFrom);
        console.log('  - Change To:', selectedFeedback.changeTo);
        
        // Create a simple proxy endpoint that just forwards to backend
        const response = await authTokenService.authenticatedFetch('/api/backend-proxy/feedback-processor/merge', {
          method: 'POST',
          body: JSON.stringify({
            documentContent: documentContentToSend,
            feedback: selectedFeedback,
            mode: 'ai'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('AI Merge Response:', result);
          console.log('  - Merged content length:', result.mergedContent?.length);
          console.log('  - Content changed:', result.mergedContent !== documentContentToSend);
          
          // Check for duplicates in the merged content
          const h1CountAfter = (result.mergedContent.match(/<h1>/g) || []).length;
          const sectionICountAfter = (result.mergedContent.match(/SECTION I - INTRODUCTION/g) || []).length;
          console.log('  - AFTER MERGE - H1 count:', h1CountAfter, 'Section I count:', sectionICountAfter);
          
          if (h1CountAfter > 1 || sectionICountAfter > 1) {
            console.error('❌ DUPLICATE SECTIONS DETECTED IN MERGED CONTENT!');
            console.error('  - H1 headers:', h1CountAfter);
            console.error('  - Section I occurrences:', sectionICountAfter);
            console.error('  - This means the backend returned corrupted content');
          }
          
          // CRITICAL: Update BOTH editableContent AND documentData.customFields.content
          // This ensures the next merge uses the updated content, just like automated tests
          setEditableContent(result.mergedContent);
          console.log('  - Updated editableContent');
          
          // Update the document data with merged content for next merge
          if (documentData) {
            console.log('  - Updating documentData state');
            setDocumentData(prevData => ({
              ...prevData,
              customFields: {
                ...prevData.customFields,
                content: result.mergedContent  // This is critical for subsequent merges
              }
            }));
          }
          
          // Save to database immediately to ensure consistency
          // MUST save the updated feedback list too!
          const remainingFeedback = feedback.filter(f => f.id !== selectedFeedback.id);
          console.log('  - Remaining feedback count:', remainingFeedback.length);
          console.log('  - Saving to database with updated feedback list');
          
          try {
            const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customFields: {
                  content: result.mergedContent,
                  draftFeedback: remainingFeedback,
                  crmFeedback: remainingFeedback,
                  lastAIMerge: new Date().toISOString()
                }
              })
            });

            if (!saveResponse.ok) {
              console.error('Failed to save AI merge to database:', saveResponse.status);
            } else {
              console.log('  - AI merge saved to database successfully');
            }
          } catch (error) {
            console.error('Error saving AI merge to database:', error);
          }
          
          console.log('  - AI merge completed successfully');
          setMergeResult('✅ AI merge completed successfully. The document has been updated with the improved content.');
          
          // Save to database like automated test does
          // Note: Frontend doesn't have a document update endpoint, so we'll skip this for now
          // The automated tests save directly via Prisma, but frontend can't do that
          console.log('Note: Document save skipped - frontend API route not available');
          // In production, you'd implement a proper update endpoint or save on final submit
        } else {
          console.error('AI Merge failed:', response.status, response.statusText);
        }
      } else if (mergeMode === 'hybrid') {
        // Hybrid merge - AI suggestion with manual review
        // Use the backend proxy to avoid HTML corruption
        const response = await authTokenService.authenticatedFetch('/api/backend-proxy/feedback-processor/merge', {
          method: 'POST',
          body: JSON.stringify({
            documentContent: documentContentToSend,
            feedback: selectedFeedback,
            mode: 'hybrid'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Store the actual merged content for later application
          setMergeResultContent(result.suggestedContent || result.mergedContent);
          // Show a user-friendly message in the dialog
          setMergeResult('🤖 Hybrid AI suggestion generated successfully. The AI has analyzed the feedback and created an improved version. Click "Apply Suggestion" below to update the document.');
        }
      } else {
        // Manual merge
        console.log('🔧 MANUAL MERGE DEBUG - Starting manual merge');
        console.log('  - Feedback ID:', selectedFeedback.id);
        console.log('  - Change From:', selectedFeedback.changeFrom);
        console.log('  - Change To:', selectedFeedback.changeTo);
        console.log('  - Current content length:', editableContent.length);
        console.log('  - Current feedback count:', feedback.length);
        
        if (selectedFeedback.changeTo) {
          const occurrences = (editableContent.match(new RegExp(selectedFeedback.changeFrom?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '', 'g')) || []).length;
          console.log('  - Occurrences found:', occurrences);
          
          const newContent = editableContent.replaceAll(
            selectedFeedback.changeFrom || '',
            selectedFeedback.changeTo
          );
          console.log('  - New content length:', newContent.length);
          console.log('  - Content changed:', newContent !== editableContent);
          
          setEditableContent(newContent);
          
          // Update the document data with merged content for next merge
          if (documentData) {
            console.log('  - Updating documentData state');
            setDocumentData(prevData => ({
              ...prevData,
              customFields: {
                ...prevData.customFields,
                content: newContent  // Keep documentData in sync
              }
            }));
          }
          
          // Get the updated feedback list (removing current item)
          const updatedFeedback = feedback.filter(f => f.id !== selectedFeedback.id);
          console.log('  - Updated feedback count:', updatedFeedback.length);
          
          // Also save to database immediately to persist the change AND update feedback list
          console.log('  - Saving to database with updated feedback list');
          try {
            const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customFields: {
                  content: newContent,
                  crmFeedback: updatedFeedback,  // Save the updated feedback list as crmFeedback
                  draftFeedback: updatedFeedback, // Also save as draftFeedback for compatibility
                  lastManualMerge: new Date().toISOString()
                }
              })
            });

            if (!saveResponse.ok) {
              console.error('Failed to save to database:', saveResponse.status);
              // Don't throw error, just log it - the merge still worked locally
            } else {
              console.log('  - Successfully saved to database');
            }
          } catch (error) {
            console.error('Error saving to database:', error);
            // Don't throw - continue with local changes
          }
          
          console.log('  - Manual merge completed successfully');
          setMergeResult('✅ Manual merge completed successfully.');
        } else {
          console.log('  - No changeTo value, skipping merge');
        }
      }
      
      // Mark feedback as merged instead of removing it
      if (mergeMode !== 'hybrid') {
        // Mark the feedback as 'merged' instead of removing it
        console.log('📝 MARKING FEEDBACK AS MERGED');
        console.log('  - Feedback ID:', selectedFeedback.id);
        console.log('  - Current feedback count:', feedback.length);

        const updatedFeedback = feedback.map(f => {
          if (f.id === selectedFeedback.id) {
            console.log('  - Found matching feedback, updating status to merged');
            return { ...f, status: 'merged' as const };
          }
          return f;
        });

        console.log('  - Updated feedback:', updatedFeedback.find(f => f.id === selectedFeedback.id));
        setFeedback(updatedFeedback);

        // Clear selected feedback after marking as merged
        setSelectedFeedback(null);

        // Also update documentData locally
        if (documentData) {
          console.log('  - Updating documentData.customFields locally');
          setDocumentData(prevData => ({
            ...prevData,
            customFields: {
              ...prevData.customFields,
              crmFeedback: updatedFeedback,
              draftFeedback: updatedFeedback,
              content: editableContent,
              editableContent: editableContent
            }
          }));
        }

        // Save the entire state to database
        try {
          console.log('  - Saving merged feedback and content to database');
          const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              customFields: {
                ...documentData?.customFields,
                crmFeedback: updatedFeedback,
                draftFeedback: updatedFeedback,
                content: editableContent,
                editableContent: editableContent,
                versionHistory: changeHistory,
                lastMergeUpdate: new Date().toISOString()
              }
            })
          });

          if (!saveResponse.ok) {
            console.error('Failed to save merged state to database:', saveResponse.status);
          } else {
            console.log('  - Successfully saved to database');
          }
        } catch (error) {
          console.error('Error saving merged state:', error);
        }
      } else {
        console.log('📝 HYBRID MODE - Not removing feedback yet, waiting for user decision');
      }
      
    } catch (error) {
      console.error('Error merging feedback:', error);
      setMergeResult('Error merging feedback');
    } finally {
      setProcessingMerge(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedFeedback) return;
    
    // Check if this is critical feedback without resolution (blocked)
    if (currentComment.commentType === 'C' && !currentComment.resolution) {
      setShowCriticalBlockedDialog(true);
      return;
    }
    
    try {
      // Update feedback with OPR response
      const updatedFeedback = {
        ...currentComment,
        id: selectedFeedback.id,
        status: currentComment.resolution ? 'accepted' : 'pending'
      };
      
      // Update local state
      const updatedList = feedback.map(f => 
        f.id === selectedFeedback.id ? updatedFeedback : f
      );
      setFeedback(updatedList as CRMComment[]);
      setSelectedFeedback(updatedFeedback as CRMComment);
      
      // Save to database
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            draftFeedback: updatedList,
            lastOPRUpdate: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        window.window.alert('Response saved successfully');
      }
    } catch (error) {
      console.error('Error saving response:', error);
      window.alert('Failed to save response');
    }
  };

  const handleCriticalBlockedConfirm = async () => {
    if (!phoneCallMade) {
      window.alert('You must confirm that you have made a phone call to discuss this critical feedback.');
      return;
    }
    
    if (!phoneCallNotes.trim()) {
      window.alert('Please provide notes from your phone call discussion.');
      return;
    }
    
    // Update the feedback with downgraded type and phone call notes
    const updatedComment = {
      ...currentComment,
      commentType: downgradedType,
      resolution: `[DOWNGRADED FROM CRITICAL] Phone call made. Notes: ${phoneCallNotes}. Original issue could not be resolved as critical.`,
      originatorJustification: phoneCallNotes
    };
    
    setCurrentComment(updatedComment);
    
    // Update local state
    const updatedList = feedback.map(f => 
      f.id === selectedFeedback?.id ? updatedComment : f
    );
    setFeedback(updatedList);
    setSelectedFeedback(updatedComment);
    
    // Save to database
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            draftFeedback: updatedList,
            lastOPRUpdate: new Date().toISOString(),
            criticalDowngrades: [
              ...(documentData?.customFields?.criticalDowngrades || []),
              {
                feedbackId: selectedFeedback?.id,
                originalType: 'C',
                newType: downgradedType,
                phoneCallNotes,
                downgradedAt: new Date().toISOString(),
                downgradedBy: 'OPR'
              }
            ]
          }
        })
      });
      
      if (response.ok) {
        window.alert('Critical feedback has been downgraded and saved successfully.');
        setShowCriticalBlockedDialog(false);
        setPhoneCallMade(false);
        setPhoneCallNotes('');
        setDowngradedType('M');
      }
    } catch (error) {
      console.error('Error saving downgraded feedback:', error);
      window.alert('Failed to save downgraded feedback');
    }
  };

  const handleExport = async (format: string, includeTrackChanges: boolean = false) => {
    setExporting(true);
    setExportAnchorEl(null);

    try {
      let contentToExport = editableContent;

      // If including track changes, add markup to show changes
      if (includeTrackChanges) {
        // Apply track changes markup
        for (const [id, change] of Array.from(appliedChanges.entries())) {
          const originalMarkup = `<del style="color: red; text-decoration: line-through;">${change.original}</del>`;
          const changedMarkup = `<ins style="color: green; text-decoration: underline;">${change.changed}</ins>`;
          contentToExport = contentToExport.replace(
            change.changed,
            `${originalMarkup}${changedMarkup}`
          );
        }

        // Add pending feedback as comments
        const pendingFeedback = feedback.filter(f => f.status === 'pending');
        if (pendingFeedback.length > 0) {
          let commentsSection = '<div style="page-break-before: always; margin-top: 40px;"><h2>Pending Feedback Comments</h2><ul>';
          pendingFeedback.forEach((item, index) => {
            commentsSection += `<li style="margin-bottom: 10px;">
              <strong>[${index + 1}] ${getCommentTypeLabel(item.commentType)} - Page ${item.page}, Para ${item.paragraphNumber}</strong><br/>
              <em>From: ${item.pocName || 'Anonymous'}</em><br/>
              Comment: ${item.coordinatorComment}<br/>
              ${item.changeFrom ? `<span style="color: red;">Original: ${item.changeFrom}</span><br/>` : ''}
              ${item.changeTo ? `<span style="color: green;">Suggested: ${item.changeTo}</span>` : ''}
            </li>`;
          });
          commentsSection += '</ul></div>';
          contentToExport += commentsSection;
        }
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/export`, {
        method: 'POST',
        body: JSON.stringify({
          format,
          includeNumbering: false,
          content: contentToExport,
          includeTrackChanges
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Set filename based on format and track changes
        const trackChangesSuffix = includeTrackChanges ? '_with_changes' : '';
        const filename = `${documentData?.title?.replace(/[^a-z0-9]/gi, '_') || 'document'}${trackChangesSuffix}.${format}`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        window.alert('Failed to export document');
      }
    } catch (error) {
      console.error('Export error:', error);
      window.alert('Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  // Add comment to thread
  const addCommentToThread = (feedbackId: string) => {
    const thread = commentThreads.find(t => t.feedbackId === feedbackId);
    if (thread) {
      setCurrentThreadId(thread.id);
    } else {
      const newThread: CommentThread = {
        id: `thread_${Date.now()}`,
        feedbackId,
        comments: []
      };
      setCommentThreads([...commentThreads, newThread]);
      setCurrentThreadId(newThread.id);
    }
    setShowCommentDialog(true);
  };

  // Save comment to thread
  const saveComment = () => {
    if (!currentThreadId || !newComment.trim()) return;

    const updatedThreads = commentThreads.map(thread => {
      if (thread.id === currentThreadId) {
        return {
          ...thread,
          comments: [...thread.comments, {
            id: `comment_${Date.now()}`,
            author: 'Current User',
            text: newComment,
            timestamp: new Date()
          }]
        };
      }
      return thread;
    });

    setCommentThreads(updatedThreads);
    setNewComment('');
    setShowCommentDialog(false);
  };

  const handleSubmitFeedbackToOPR = async () => {
    try {
      setLoading(true);
      setAlert(null);

      // Get the current task ID from the workflow
      const tasksResponse = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`
        }
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await tasksResponse.json();
      const currentTask = tasks.find((t: any) =>
        t.formData?.documentId === documentId &&
        t.status === 'PENDING'
      );

      if (!currentTask) {
        setAlert({ severity: 'warning', message: 'No active review task found' });
        return;
      }

      // Complete the task and submit feedback
      const completeResponse = await fetch(`/api/tasks/${currentTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          feedback: feedback,
          reviewNotes: 'Feedback submitted to OPR',
          reviewDate: new Date().toISOString()
        })
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to submit feedback');
      }

      setAlert({
        severity: 'success',
        message: 'Feedback successfully submitted to OPR! Redirecting to dashboard...'
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setAlert({
        severity: 'error',
        message: 'Failed to submit feedback to OPR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFeedbackAndContinue = async () => {
    setProcessingWorkflow(true);

    try {
      // Save any pending changes first
      if (isEditingDocument && editableContent !== documentContent) {
        const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            customFields: {
              content: editableContent,
              lastOPRUpdate: new Date().toISOString()
            }
          })
        });

        if (!saveResponse.ok) {
          setAlert({
            severity: 'error',
            message: 'Failed to save document changes before continuing workflow'
          });
          setProcessingWorkflow(false);
          return;
        }
      }

      // Transition to the next workflow stage (from Stage 3.5 to Stage 4)
      // This completes the review collection phase and moves to OPR Feedback Incorporation
      const transitionResponse = await fetch('/api/workflow-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'advance',
          workflowId: documentId,
          fromStage: '3.5',
          toStage: '4',
          requiredRole: 'Coordinator'
        })
      });

      if (transitionResponse.ok) {
        setAlert({
          severity: 'success',
          message: 'Review collection phase complete! Workflow has advanced to Stage 4: OPR Feedback Incorporation. The Action Officer can now process the feedback.'
        });

        // Redirect back to the main document page after a short delay
        setTimeout(() => {
          router.push(`/documents/${documentId}`);
        }, 3000);
      } else {
        const error = await transitionResponse.text();
        setAlert({
          severity: 'error',
          message: `Failed to advance workflow: ${error}`
        });
      }
    } catch (error) {
      console.error('Error processing workflow:', error);
      setAlert({
        severity: 'error',
        message: 'Error processing workflow. Please try again.'
      });
    } finally {
      setProcessingWorkflow(false);
    }
  };

  const handleSaveDocument = async () => {
    setSavingDocument(true);

    try {
      // First save to history if there are unsaved changes
      if (appliedChanges.size > 0 || feedback.some(f => f.status === 'merged')) {
        await saveToHistory(appliedChanges);
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            ...documentData?.customFields,
            content: editableContent,
            editableContent: editableContent,
            draftFeedback: feedback,
            crmFeedback: feedback,
            versionHistory: changeHistory,
            appliedChanges: Array.from(appliedChanges.entries()).map(([id, change]) => ({
              id,
              ...change
            })),
            lastOPRUpdate: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setDocumentContent(editableContent);
        setIsEditingDocument(false);
        window.alert('Document and version history saved successfully');
      } else {
        window.alert('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      window.alert('Error saving document');
    } finally {
      setSavingDocument(false);
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch(type) {
      case 'C': return 'error';
      case 'M': return 'warning';
      case 'S': return 'info';
      case 'A': return 'success';
      default: return 'default';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch(type) {
      case 'C': return 'Critical';
      case 'M': return 'Major';
      case 'S': return 'Substantive';
      case 'A': return 'Administrative';
      default: return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'merged': return 'info';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OPR Review: {documentData?.title || 'Loading...'}
          </Typography>
          <Button 
            color="inherit" 
            variant={isEditingDocument ? "contained" : "outlined"}
            onClick={() => setIsEditingDocument(!isEditingDocument)}
            startIcon={<EditIcon />}
            sx={{ mr: 2 }}
          >
            {isEditingDocument ? 'View Mode' : 'Edit Document'}
          </Button>
          {isEditingDocument && (
            <Button 
              color="inherit" 
              variant="contained"
              onClick={handleSaveDocument}
              disabled={savingDocument}
              startIcon={savingDocument ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ mr: 2 }}
            >
              Save Document
            </Button>
          )}
          <Button
            color="inherit"
            variant="outlined"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PdfIcon sx={{ mr: 1 }} /> Export as PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('pdf', true)}>
              <PdfIcon sx={{ mr: 1, color: 'warning.main' }} /> Export PDF with Track Changes
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExport('docx')}>
              <DocumentIcon sx={{ mr: 1 }} /> Export as Word
            </MenuItem>
            <MenuItem onClick={() => handleExport('docx', true)}>
              <DocumentIcon sx={{ mr: 1, color: 'warning.main' }} /> Export Word with Track Changes
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExport('txt')}>
              <TextIcon sx={{ mr: 1 }} /> Export as Text
            </MenuItem>
            <MenuItem onClick={() => handleExport('html')}>
              <HtmlIcon sx={{ mr: 1 }} /> Export as HTML
            </MenuItem>
            <MenuItem onClick={() => handleExport('html', true)}>
              <HtmlIcon sx={{ mr: 1, color: 'warning.main' }} /> Export HTML with Track Changes
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box key={componentKey} sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Side: Document Viewer/Editor */}
        <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Paper sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)' }}>
            {documentData ? (
              <>
                <Typography variant="h4" gutterBottom color="primary">
                  {documentData.title}
                </Typography>
                <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Category:</Typography>
                      <Typography variant="body2">{documentData.category || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Version:</Typography>
                      <Typography variant="body2">{documentData.currentVersion || '1'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Status:</Typography>
                      <Typography variant="body2">{documentData.status}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Numbering Controls */}
                {!isEditingDocument && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Document Numbering for Feedback Reference:
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showLineNumbers}
                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Line Numbers"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showPageNumbers}
                            onChange={(e) => setShowPageNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Page Numbers"
                      />
                    </FormGroup>
                  </Box>
                )}
                
                {/* Document Content */}
                {isEditingDocument ? (
                  <>
                    {/* Document Tools for Edit Mode */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          // Generate Table of Contents from headers
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = editableContent;
                          const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');
                          
                          let toc = '<div class="table-of-contents">\n<h2>Table of Contents</h2>\n<ul>\n';
                          headers.forEach((header) => {
                            const level = parseInt(header.tagName.charAt(1));
                            const text = header.textContent || '';
                            const indent = '  '.repeat(level - 1);
                            toc += `${indent}<li>${text}</li>\n`;
                          });
                          toc += '</ul>\n</div>\n\n';
                          
                          // Insert TOC at the beginning
                          setEditableContent(toc + editableContent);
                        }}
                      >
                        Generate TOC
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          // Auto-number chapters and sections
                          let content = editableContent;
                          
                          // Add chapter numbers to H1
                          let chapterNum = 0;
                          content = content.replace(/<h1>(?!Chapter \d+:)(.*?)<\/h1>/gi, (match, title) => {
                            chapterNum++;
                            return `<h1>Chapter ${chapterNum}: ${title}</h1>`;
                          });
                          
                          // Add section numbers to H2
                          let sectionNum = 0;
                          let currentChapter = 0;
                          content = content.replace(/<h([1-2])>(.*?)<\/h\1>/gi, (match, level, title) => {
                            if (level === '1') {
                              currentChapter++;
                              sectionNum = 0;
                              return match; // Already processed H1s
                            } else if (level === '2' && !title.match(/^\d+\.\d+/)) {
                              sectionNum++;
                              return `<h2>${currentChapter}.${sectionNum} ${title}</h2>`;
                            }
                            return match;
                          });
                          
                          setEditableContent(content);
                        }}
                      >
                        Number Chapters
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Format as standard document structure
                          const structure = `<h1>Executive Summary</h1>
<p>[Provide a brief overview of the document]</p>

<h1>Chapter 1: Introduction</h1>
<p>[Introduction content]</p>

<h2>1.1 Background</h2>
<p>[Background information]</p>

<h2>1.2 Objectives</h2>
<p>[Document objectives]</p>

<h2>1.3 Scope</h2>
<p>[Scope of the document]</p>

<h1>Chapter 2: Main Content</h1>
<p>[Main content goes here]</p>

<h2>2.1 Section One</h2>
<p>[Section content]</p>

<h2>2.2 Section Two</h2>
<p>[Section content]</p>

<h1>Chapter 3: Conclusion</h1>
<p>[Conclusions and recommendations]</p>

<h1>References</h1>
<p>[List of references]</p>

<h1>Appendices</h1>
<p>[Additional materials]</p>`;
                          
                          // Ask user if they want to replace or append
                          if (editableContent.trim() && !confirm('This will replace the current content with a standard document template. Continue?')) {
                            return;
                          }
                          setEditableContent(structure);
                        }}
                      >
                        Document Template
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Add page breaks for printing
                          let content = editableContent;
                          // Add page break before each H1 (except the first)
                          let isFirst = true;
                          content = content.replace(/<h1>/gi, (match) => {
                            if (isFirst) {
                              isFirst = false;
                              return match;
                            }
                            return '<div style="page-break-before: always;"></div>' + match;
                          });
                          setEditableContent(content);
                        }}
                      >
                        Add Page Breaks
                      </Button>
                    </Box>
                    
                    <TextField
                      fullWidth
                      multiline
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      variant="outlined"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </>
                ) : (
                  <>
                    {/* Display Air Force header if it exists */}
                    {documentData?.customFields?.headerHtml && (
                      <Box
                        sx={{ mb: 3 }}
                        dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
                      />
                    )}

                    <DocumentNumbering
                      content={editableContent}
                      enableLineNumbers={showLineNumbers}
                      enablePageNumbers={showPageNumbers}
                      linesPerPage={50}
                    />
                  </>
                )}
              </>
            ) : (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>Loading document...</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right Side: Feedback Management Panel */}
        <Box sx={{ width: '450px', overflow: 'auto', bgcolor: 'grey.50', p: 2 }}>
          {/* Professional Controls Layout */}
          <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build />
                Feedback Management
              </Typography>

              {/* Merge Strategy Selection */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>Strategy:</Typography>
                <ToggleButtonGroup
                  value={mergeMode}
                  exclusive
                  onChange={handleMergeModeChange}
                  size="small"
                  sx={{ mb: 1 }}
                >
                  <ToggleButton value="manual">
                    <ManualIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Manual
                  </ToggleButton>
                  <ToggleButton value="ai">
                    <AIIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    AI
                  </ToggleButton>
                  <ToggleButton value="hybrid">
                    <HybridIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Hybrid
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Track Changes Controls */}
              <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Track Changes:</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Undo last change"
                  >
                    Undo
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RedoIcon />}
                    onClick={handleRedo}
                    disabled={historyIndex >= changeHistory.length - 1}
                    title="Redo last undone change"
                  >
                    Redo
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CompareIcon />}
                    onClick={() => setShowComparisonView(!showComparisonView)}
                    color={showComparisonView ? 'primary' : 'inherit'}
                    title="Toggle side-by-side comparison"
                  >
                    Compare
                  </Button>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrevIcon />}
                    onClick={navigateToPreviousChange}
                    disabled={changeMarkers.length === 0}
                    title="Go to previous change"
                  >
                    Prev
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<NextIcon />}
                    onClick={navigateToNextChange}
                    disabled={changeMarkers.length === 0}
                    title="Go to next change"
                  >
                    Next
                  </Button>
                  <Chip
                    size="small"
                    label={`${currentChangeIndex + 1}/${changeMarkers.length}`}
                    sx={{ ml: 1 }}
                  />
                </Stack>
              </Box>

              {/* Batch Operations */}
              <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Batch Operations:</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<AcceptAllIcon />}
                    onClick={handleAcceptAllChanges}
                    disabled={feedback.filter(f => f.status === 'pending').length === 0}
                  >
                    Accept All
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<RejectAllIcon />}
                    onClick={handleRejectAllChanges}
                    disabled={feedback.filter(f => f.status === 'pending').length === 0}
                  >
                    Reject All
                  </Button>
                </Stack>
              </Box>

              {/* Action Buttons Grid */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<TrackChangesIcon />}
                    onClick={applyAllFeedback}
                    disabled={feedback.filter(f => (!f.status || f.status === 'pending') && f.commentType !== 'C' && f.changeTo).length === 0}
                    title="Apply all non-critical feedback items"
                  >
                    Apply All ({feedback.filter(f => (!f.status || f.status === 'pending') && f.commentType !== 'C').length})
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<BatchIcon />}
                    onClick={applySelectedFeedback}
                    disabled={!feedback.some(i => i.selected)}
                  >
                    Selected ({feedback.filter(i => i.selected).length})
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={selectAll ? <DeselectAllIcon /> : <SelectAllIcon />}
                    onClick={handleSelectAll}
                  >
                    {selectAll ? 'Deselect' : 'Select'} All
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDocument}
                    disabled={savingDocument}
                  >
                    Save Changes
                  </Button>
                </Grid>


                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={() => setShowDetailedHistory(true)}
                  >
                    History
                  </Button>

                  {/* TEMPORARY TEST BUTTONS */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    color="secondary"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      const testEntry = {
                        content: editableContent,
                        feedback: feedback,
                        timestamp: new Date(),
                        changes: {
                          applied: 0,
                          merged: 0,
                          details: []
                        }
                      };
                      setChangeHistory([...changeHistory, testEntry]);
                      window.alert(`Added test version ${changeHistory.length + 1} to history`);
                    }}
                  >
                    Add Test Version
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    color="error"
                    sx={{ mt: 1 }}
                    onClick={async () => {
                      // Clear local state
                      setChangeHistory([]);
                      changeHistoryRef.current = []; // Clear ref immediately
                      setHistoryIndex(-1);
                      setAppliedChanges(new Map());
                      setHistoryInitialized(false); // Reset this so it can reload from DB if needed
                      setComponentKey(prev => prev + 1); // Force re-render of all components

                      // Reset all feedback items to pending (re-enable them)
                      const resetFeedback = feedback.map(f => ({
                        ...f,
                        status: 'pending' as const
                      }));
                      setFeedback(resetFeedback);

                      // Clear history in database and reset feedback statuses
                      try {
                        const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            customFields: {
                              ...documentData?.customFields,
                              versionHistory: [],
                              draftFeedback: resetFeedback,
                              crmFeedback: resetFeedback,
                              appliedChanges: [],
                              lastHistoryClear: new Date().toISOString()
                            }
                          })
                        });

                        if (response.ok) {
                          // Update local documentData to keep it in sync
                          setDocumentData(prevData => ({
                            ...prevData,
                            customFields: {
                              ...prevData?.customFields,
                              versionHistory: [],
                              draftFeedback: resetFeedback,
                              crmFeedback: resetFeedback,
                              appliedChanges: [],
                              lastHistoryClear: new Date().toISOString()
                            }
                          }));
                          window.alert('History cleared and feedback items re-enabled');
                        } else {
                          window.alert('Failed to clear history from database');
                        }
                      } catch (error) {
                        console.error('Error clearing history:', error);
                        window.alert('Error clearing history from database');
                      }
                    }}
                  >
                    Clear History (Test)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    Preview
                  </Button>
                </Grid>

              </Grid>

              {/* Settings Toggles */}
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={<Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} size="small" />}
                    label="Auto-save"
                  />
                  <FormControlLabel
                    control={<Switch checked={showPositionDetails} onChange={(e) => setShowPositionDetails(e.target.checked)} size="small" />}
                    label="Position Details"
                  />
                </Stack>
              </Box>
            </Paper>

            {/* Selected Feedback Details */}
            {selectedFeedback && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon />
                  Selected Feedback Details
                </Typography>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {/* Basic Information */}
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">ID</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.id || 'Not set'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Type</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getCommentTypeLabel(selectedFeedback.commentType)}
                        size="small"
                        color={getCommentTypeColor(selectedFeedback.commentType) as any}
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Component</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.component || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedFeedback.status || 'Pending'}
                        size="small"
                        variant="outlined"
                        color={getStatusColor(selectedFeedback.status) as any}
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Reviewer</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.pocName || 'Anonymous'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Contact</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.pocEmail || selectedFeedback.pocPhone || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Page</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.page || '?'}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Paragraph</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.paragraphNumber || '?'}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Line</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.lineNumber || '?'}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Component</Typography>
                    <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.component || 'General'}</Typography>
                  </Grid>

                  {/* Comment */}
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Comment</Typography>
                    <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.coordinatorComment || 'No comment provided'}</Typography>
                    </Paper>
                  </Grid>

                  {/* Text Changes */}
                  {selectedFeedback.changeFrom && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Original Text</Typography>
                      <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'error.50', borderColor: 'error.main' }}>
                        <Typography variant="body2" fontSize="0.8rem" color="error.main">{selectedFeedback.changeFrom}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {selectedFeedback.changeTo && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Suggested Text</Typography>
                      <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'success.50', borderColor: 'success.main' }}>
                        <Typography variant="body2" fontSize="0.8rem" color="success.main">{selectedFeedback.changeTo}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Justification */}
                  {selectedFeedback.coordinatorJustification && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Justification</Typography>
                      <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.coordinatorJustification}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Resolution */}
                  {selectedFeedback.resolution && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Resolution</Typography>
                      <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'info.50', borderColor: 'info.main' }}>
                        <Typography variant="body2" fontSize="0.8rem" color="info.main">{selectedFeedback.resolution}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Originator Justification */}
                  {selectedFeedback.originatorJustification && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Originator Response</Typography>
                      <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'warning.50', borderColor: 'warning.main' }}>
                        <Typography variant="body2" fontSize="0.8rem" color="warning.main">{selectedFeedback.originatorJustification}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Action Buttons for Selected Feedback */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleMergeFeedback}
                        disabled={!selectedFeedback.changeTo}
                        startIcon={<MergeIcon />}
                        color={mergeMode === 'ai' ? 'secondary' : mergeMode === 'hybrid' ? 'warning' : 'primary'}
                      >
                        {mergeMode === 'manual' ? 'Apply' :
                         mergeMode === 'ai' ? 'AI Merge' :
                         'Hybrid'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedFeedback(null)}
                        startIcon={<Cancel />}
                      >
                        Clear
                      </Button>
                      {selectedFeedback.changeFrom && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setHighlightedText(selectedFeedback.changeFrom || '');
                          }}
                          startIcon={<ViewIcon />}
                        >
                          Find
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Feedback List */}
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ListIcon />
              Feedback Items ({feedback.length})
            </Typography>
            <Box sx={{ maxHeight: '400px', overflow: 'auto', pr: 1 }}>
              <List dense sx={{ width: '100%' }}>
                {feedback.map((item, index) => (
                  <ListItem
                    key={item.id || index}
                    selected={selectedFeedback?.id === item.id}
                    sx={{
                      mb: 0.5,
                      border: 1,
                      borderColor: item.status === 'merged'
                        ? 'grey.300'
                        : selectedFeedback?.id === item.id
                          ? 'primary.main'
                          : 'divider',
                      borderRadius: 1,
                      bgcolor: item.status === 'merged'
                        ? 'grey.100'
                        : selectedFeedback?.id === item.id
                          ? 'primary.50'
                          : 'background.paper',
                      cursor: item.status === 'merged' ? 'not-allowed' : 'pointer',
                      opacity: item.status === 'merged' ? 0.7 : 1,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: item.status === 'merged'
                          ? 'grey.100'
                          : selectedFeedback?.id === item.id
                            ? 'primary.100'
                            : 'grey.100'
                      },
                      '&::after': item.status === 'merged' ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.05)',
                        pointerEvents: 'none',
                        borderRadius: 1
                      } : {}
                    }}
                  >
                    <Checkbox
                      checked={item.selected || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(item.id || '');
                      }}
                      size="small"
                      disabled={item.status === 'merged'}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      onClick={() => handleFeedbackClick(item)}
                      primary={
                        <Box sx={{ opacity: item.status === 'merged' ? 0.6 : 1 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              textDecoration: item.status === 'merged' ? 'line-through' : 'none',
                              color: item.status === 'merged' ? 'text.secondary' : 'text.primary'
                            }}
                          >
                            {item.coordinatorComment || 'No comment'}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={getCommentTypeLabel(item.commentType)}
                              size="small"
                              color={getCommentTypeColor(item.commentType) as any}
                              sx={{ mr: 0.5, fontSize: '0.65rem' }}
                              disabled={item.status === 'merged'}
                            />
                            {item.status && (
                              <Chip
                                label={item.status}
                                size="small"
                                variant={item.status === 'merged' ? 'filled' : 'outlined'}
                                color={getStatusColor(item.status) as any}
                                sx={{ fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.pocName || 'Anonymous'} • Page {item.page || '?'} • Para {item.paragraphNumber || '?'} • Line {item.lineNumber || '?'} • {item.component || 'General'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {feedback.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="body2">No feedback items available</Typography>
                    <Typography variant="caption">Use "Generate AI Feedback" to create suggestions</Typography>
                  </Box>
                )}
              </List>
            </Box>
        </Box>
      </Box>

      {/* Merge Result Dialog */}
      <Dialog open={showMergeDialog} onClose={() => setShowMergeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Merge Result</DialogTitle>
        <DialogContent>
          {processingMerge ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Processing merge...</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1">{mergeResult}</Typography>
              {mergeMode === 'hybrid' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This is an AI suggestion. Please review and modify as needed in the document editor.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {mergeMode === 'hybrid' && !processingMerge && mergeResultContent ? (
            <>
              <Button 
                onClick={() => {
                  // Reject - just close without applying
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                }}
                color="error"
              >
                Reject
              </Button>
              <Button 
                onClick={async () => {
                  // Apply to editor
                  setEditableContent(mergeResultContent);
                  
                  // Store what we need to find and highlight
                  // For hybrid mode with AI changes, we need to search for the AI-improved text
                  // which is in mergeResultContent, not the original changeTo
                  let searchForText = '';
                  
                  if (mergeMode === 'hybrid' && mergeResultContent) {
                    // Extract the actual changed text from the AI result
                    // The AI returns the improved version, so we need to find what was actually changed
                    if (selectedFeedback?.changeFrom) {
                      // Find where the change was made in the result
                      const startIdx = mergeResultContent.indexOf(selectedFeedback.changeFrom);
                      if (startIdx >= 0) {
                        // The AI replaced this text, so find what it was replaced with
                        // Look for text around the same position
                        const beforeText = mergeResultContent.substring(Math.max(0, startIdx - 100), startIdx);
                        const afterText = mergeResultContent.substring(startIdx, Math.min(mergeResultContent.length, startIdx + 200));
                        searchForText = afterText || selectedFeedback.changeTo || '';
                      } else {
                        // The AI might have significantly changed the text
                        // Try to find any part of the changeTo text
                        searchForText = selectedFeedback.changeTo || '';
                      }
                    } else {
                      searchForText = selectedFeedback.changeTo || '';
                    }
                  } else {
                    searchForText = selectedFeedback?.changeTo || selectedFeedback?.changeFrom || '';
                  }
                  
                  const feedbackLocation = {
                    paragraph: selectedFeedback?.paragraphNumber,
                    line: selectedFeedback?.lineNumber,
                    page: selectedFeedback?.page
                  };
                  
                  console.log('Edit in Document - Search Info:', {
                    mode: mergeMode,
                    searchForText: searchForText.substring(0, 50),
                    location: feedbackLocation,
                    hasAIContent: !!mergeResultContent
                  });
                  
                  // Close dialog
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                  
                  // Function to highlight and scroll
                  const performHighlightAndScroll = () => {
                    // Find the DocumentNumbering container or text editor
                    let editorElement = document.querySelector('[data-document-content]') as HTMLElement;
                    
                    // If not found, try other selectors
                    if (!editorElement) {
                      // Look for the DocumentNumbering component's container
                      const docNumberingBox = document.querySelector('.MuiBox-root');
                      if (docNumberingBox && docNumberingBox.innerHTML.includes('<h1') || docNumberingBox?.innerHTML.includes('<p')) {
                        editorElement = docNumberingBox as HTMLElement;
                      }
                    }
                    
                    // If still not found, look for any element with document content
                    if (!editorElement) {
                      const allDivs = Array.from(document.querySelectorAll('div'));
                      for (const div of allDivs) {
                        if (div.innerHTML.includes('AIR FORCE') || 
                            div.innerHTML.includes('SECTION') ||
                            (selectedFeedback?.changeFrom && div.textContent?.includes(selectedFeedback.changeFrom))) {
                          editorElement = div as HTMLElement;
                          break;
                        }
                      }
                    }
                    
                    if (!editorElement) {
                      console.log('Editor/Document element not found');
                      return false;
                    }
                    
                    console.log('Found editor element:', editorElement.className || 'no-class');
                    
                    // Remove any existing highlights first
                    const existingHighlights = editorElement.querySelectorAll('.merge-highlight-mark');
                    existingHighlights.forEach(el => {
                      const parent = el.parentNode;
                      while (el.firstChild) {
                        parent?.insertBefore(el.firstChild, el);
                      }
                      parent?.removeChild(el);
                    });
                    
                    // Clean search text
                    const cleanSearchText = searchForText.replace(/<[^>]*>/g, '').trim();
                    if (!cleanSearchText || cleanSearchText.length < 3) {
                      console.log('Search text too short or empty');
                      return false;
                    }
                    
                    // Try multiple search strategies
                    const searchStrategies = [
                      cleanSearchText, // Full text
                      cleanSearchText.substring(0, 50), // First 50 chars
                      cleanSearchText.substring(0, 30), // First 30 chars
                      cleanSearchText.split('.')[0], // First sentence
                      cleanSearchText.split(' ').slice(0, 10).join(' '), // First 10 words
                      cleanSearchText.split(' ').slice(0, 5).join(' '), // First 5 words
                      cleanSearchText.split(' ').slice(0, 3).join(' '), // First 3 words
                      // Also try from the end in case AI added text at the beginning
                      cleanSearchText.split(' ').slice(-10).join(' '), // Last 10 words
                      cleanSearchText.split(' ').slice(-5).join(' '), // Last 5 words
                    ].filter(str => str && str.length >= 3); // Filter out empty or too short strings
                    
                    console.log('Search strategies to try:', searchStrategies.length);
                    
                    for (const searchStr of searchStrategies) {
                      if (!searchStr || searchStr.length < 3) continue;
                      
                      console.log('Trying search strategy:', searchStr.substring(0, Math.min(30, searchStr.length)) + (searchStr.length > 30 ? '...' : ''));
                      
                      // Walk through all text nodes
                      const walker = document.createTreeWalker(
                        editorElement,
                        NodeFilter.SHOW_TEXT,
                        {
                          acceptNode: (node) => {
                            // Skip empty text nodes
                            return node.textContent && node.textContent.trim() 
                              ? NodeFilter.FILTER_ACCEPT 
                              : NodeFilter.FILTER_SKIP;
                          }
                        }
                      );
                      
                      let textNode;
                      let found = false;
                      
                      while (textNode = walker.nextNode()) {
                        const nodeText = textNode.textContent || '';
                        const searchIndex = nodeText.toLowerCase().indexOf(searchStr.toLowerCase());
                        
                        if (searchIndex >= 0) {
                          console.log('Found text in node!');
                          
                          try {
                            // Create range for the found text
                            const range = document.createRange();
                            const endIndex = Math.min(searchIndex + searchStr.length, nodeText.length);
                            
                            range.setStart(textNode, searchIndex);
                            range.setEnd(textNode, endIndex);
                            
                            // Create highlight element
                            const highlightMark = document.createElement('mark');
                            highlightMark.className = 'merge-highlight-mark';
                            highlightMark.style.cssText = `
                              background-color: #ffeb3b !important;
                              padding: 2px 4px !important;
                              border-radius: 3px !important;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                              animation: pulse 1s ease-in-out !important;
                            `;
                            
                            // Add CSS animation
                            if (!document.querySelector('#merge-highlight-styles')) {
                              const style = document.createElement('style');
                              style.id = 'merge-highlight-styles';
                              style.textContent = `
                                @keyframes pulse {
                                  0% { transform: scale(1); }
                                  50% { transform: scale(1.05); }
                                  100% { transform: scale(1); }
                                }
                              `;
                              document.head.appendChild(style);
                            }
                            
                            // Wrap the found text
                            range.surroundContents(highlightMark);
                            
                            // Scroll to the highlighted text with offset for better visibility
                            setTimeout(() => {
                              const rect = highlightMark.getBoundingClientRect();
                              const absoluteTop = window.scrollY + rect.top;
                              const targetScroll = absoluteTop - (window.innerHeight / 3); // Position at 1/3 from top
                              
                              window.scrollTo({
                                top: targetScroll,
                                behavior: 'smooth'
                              });
                              
                              // Also ensure horizontal scroll if needed
                              if (rect.left < 0 || rect.right > window.innerWidth) {
                                highlightMark.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center',
                                  inline: 'center'
                                });
                              }
                            }, 100);
                            
                            // Focus the editor and position cursor near the highlight
                            if (editorElement instanceof HTMLElement) {
                              editorElement.focus();
                              
                              // Try to position cursor at the highlighted text
                              const selection = window.getSelection();
                              selection?.removeAllRanges();
                              const newRange = document.createRange();
                              newRange.selectNodeContents(highlightMark);
                              newRange.collapse(false); // Collapse to end
                              selection?.addRange(newRange);
                            }
                            
                            // Fade out highlight after 5 seconds
                            setTimeout(() => {
                              highlightMark.style.transition = 'background-color 2s ease-out';
                              highlightMark.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                              
                              setTimeout(() => {
                                highlightMark.style.backgroundColor = 'transparent';
                                
                                // Remove the mark element after fade
                                setTimeout(() => {
                                  const parent = highlightMark.parentNode;
                                  while (highlightMark.firstChild) {
                                    parent?.insertBefore(highlightMark.firstChild, highlightMark);
                                  }
                                  parent?.removeChild(highlightMark);
                                }, 2000);
                              }, 3000);
                            }, 5000);
                            
                            found = true;
                            return true;
                          } catch (e) {
                            console.error('Error highlighting text:', e);
                            
                            // Fallback: at least scroll to the general area
                            try {
                              const tempRange = document.createRange();
                              tempRange.selectNode(textNode);
                              const rect = tempRange.getBoundingClientRect();
                              
                              window.scrollTo({
                                top: window.scrollY + rect.top - window.innerHeight / 3,
                                behavior: 'smooth'
                              });
                              
                              found = true;
                            } catch (scrollError) {
                              console.error('Error scrolling:', scrollError);
                            }
                          }
                          
                          break;
                        }
                      }
                      
                      if (found) {
                        console.log('Successfully found and highlighted text');
                        return true;
                      }
                    }
                    
                    console.log('Text not found with any strategy');
                    
                    // Last resort: scroll to paragraph/line number if available
                    if (feedbackLocation.paragraph || feedbackLocation.line) {
                      console.log('Falling back to paragraph/line number scroll:', feedbackLocation);
                      
                      // Try to find the paragraph by data-paragraph attribute first
                      let targetElement = null;
                      
                      if (feedbackLocation.paragraph) {
                        // Look for elements with matching data-paragraph attribute
                        targetElement = editorElement.querySelector(`[data-paragraph="${feedbackLocation.paragraph}"]`);
                        
                        if (!targetElement) {
                          // Try partial match (e.g., "1.2.3" might be stored as "1.2.3.1")
                          const allParas = Array.from(editorElement.querySelectorAll('[data-paragraph]'));
                          for (const para of allParas) {
                            const paraNum = para.getAttribute('data-paragraph');
                            if (paraNum && paraNum.startsWith(feedbackLocation.paragraph)) {
                              targetElement = para;
                              break;
                            }
                          }
                        }
                      }
                      
                      // If still not found, try by index
                      if (!targetElement) {
                        const paragraphs = editorElement.querySelectorAll('p, .numbered-paragraph');
                        const targetIndex = parseInt(feedbackLocation.line || '1') - 1;
                        if (paragraphs[targetIndex]) {
                          targetElement = paragraphs[targetIndex];
                        }
                      }
                      
                      if (targetElement) {
                        console.log('Found element to scroll to by paragraph/line number');
                        targetElement.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                        
                        // Add a temporary border to show the paragraph
                        const elem = targetElement as HTMLElement;
                        elem.style.border = '3px solid #ffeb3b';
                        elem.style.borderRadius = '4px';
                        elem.style.padding = '8px';
                        elem.style.backgroundColor = 'rgba(255, 235, 59, 0.1)';
                        
                        setTimeout(() => {
                          elem.style.transition = 'all 1s ease-out';
                          elem.style.border = 'none';
                          elem.style.padding = '0';
                          elem.style.backgroundColor = 'transparent';
                        }, 3000);
                        
                        // Return false because we didn't actually find and highlight the text
                        // This is just a fallback scroll
                        console.log('Scrolled to paragraph/line but text not highlighted');
                        return false;
                      }
                    }
                    
                    console.log('Could not find element to scroll to');
                    return false;
                  };
                  
                  // Try multiple times to ensure content is loaded
                  let attempts = 0;
                  const maxAttempts = 5;
                  
                  const attemptHighlight = () => {
                    attempts++;
                    console.log(`Highlight attempt ${attempts}/${maxAttempts}`);
                    
                    if (performHighlightAndScroll()) {
                      console.log('Successfully highlighted on attempt', attempts);
                    } else if (attempts < maxAttempts) {
                      setTimeout(attemptHighlight, 500 * attempts); // Exponential backoff
                    } else {
                      console.log('Could not find text after', maxAttempts, 'attempts');
                      
                      // Final fallback: just focus the document area
                      const docArea = document.querySelector('[data-document-content]') || 
                                      document.querySelector('.MuiBox-root');
                      if (docArea instanceof HTMLElement) {
                        docArea.focus();
                        // Scroll to top of document
                        docArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  };
                  
                  // Start attempting after a short delay for editor to update
                  setTimeout(attemptHighlight, 300);
                }}
              >
                Edit in Document
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  // Apply and save
                  setEditableContent(mergeResultContent);
                  
                  // Also remove the feedback from the list and save to database
                  const updatedFeedback = feedback.filter(f => f.id !== selectedFeedback?.id);
                  setFeedback(updatedFeedback);
                  
                  // Save to database
                  authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                      customFields: {
                        content: mergeResultContent,
                        draftFeedback: updatedFeedback,
                        lastHybridMerge: new Date().toISOString()
                      }
                    })
                  });
                  
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                }}
                color="success"
              >
                Apply & Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowMergeDialog(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Critical Feedback Blocked Dialog */}
      <Dialog open={showCriticalBlockedDialog} onClose={() => setShowCriticalBlockedDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          ⚠️ Critical Feedback Cannot Be Blocked
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Critical feedback cannot remain unresolved. You must:
            <ol>
              <li>Call the person who submitted this feedback</li>
              <li>Discuss the issue to find a resolution</li>
              <li>Downgrade to a lower priority if it cannot be resolved as critical</li>
            </ol>
          </Alert>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Contact Information:
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {currentComment.pocName || 'Not provided'}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {currentComment.pocPhone || 'Not provided'}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {currentComment.pocEmail || 'Not provided'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={phoneCallMade}
                onChange={(e) => setPhoneCallMade(e.target.checked)}
                color="primary"
              />
            }
            label="I have called and discussed this feedback with the submitter"
          />

          {phoneCallMade && (
            <>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Phone Call Notes *"
                value={phoneCallNotes}
                onChange={(e) => setPhoneCallNotes(e.target.value)}
                placeholder="Summarize the discussion and reason for downgrade..."
                sx={{ mt: 2, mb: 2 }}
              />

              <FormControl fullWidth required>
                <InputLabel>Downgrade To *</InputLabel>
                <Select
                  value={downgradedType}
                  onChange={(e) => setDowngradedType(e.target.value)}
                  label="Downgrade To *"
                >
                  <MenuItem value="M">🟠 Major (Significant issue)</MenuItem>
                  <MenuItem value="S">🔵 Substantive (Important)</MenuItem>
                  <MenuItem value="A">🟢 Administrative (Minor)</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mt: 2 }}>
                This action will be logged and tracked. The feedback will be marked as downgraded from Critical 
                with your phone call notes attached.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCriticalBlockedDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCriticalBlockedConfirm}
            variant="contained"
            color="warning"
            disabled={!phoneCallMade || !phoneCallNotes.trim()}
          >
            Confirm Downgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Side-by-side Comparison View */}
      {showComparisonView && (
        <Dialog open={showComparisonView} onClose={() => setShowComparisonView(false)} maxWidth="xl" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Document Comparison View</Typography>
              <IconButton onClick={() => setShowComparisonView(false)}>
                <Cancel />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    Original Document
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box dangerouslySetInnerHTML={{ __html: documentContent }} />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    Current Document (with changes)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    {(() => {
                      let htmlWithHighlights = editableContent;
                      let changesApplied = false;

                      // Process ALL feedback items that have been applied (merged, accepted, or any with changeTo)
                      const allFeedback = feedback.filter(f =>
                        (f.status === 'merged' || f.status === 'accepted' || !f.status) &&
                        (f.changeTo || f.changeFrom)
                      );

                      console.log('Compare View - Processing feedback:', allFeedback.length, 'items');

                      // Show all changes with strikethrough and new text
                      for (const item of allFeedback) {
                        if (item.changeFrom && item.changeTo) {
                          // Both changeFrom and changeTo exist - show full change
                          if (htmlWithHighlights.includes(item.changeTo)) {
                            changesApplied = true;
                            const escapedChangeTo = item.changeTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            htmlWithHighlights = htmlWithHighlights.replace(
                              new RegExp(escapedChangeTo, 'g'),
                              `<span style="text-decoration: line-through; color: red; background-color: #ffcccc; padding: 2px;">${item.changeFrom}</span> <span style="background-color: #c8e6c9; color: green; font-weight: bold; padding: 2px;">${item.changeTo}</span>`
                            );
                          } else if (htmlWithHighlights.includes(item.changeFrom)) {
                            // Original text still exists - replace it with both
                            changesApplied = true;
                            const escapedChangeFrom = item.changeFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            htmlWithHighlights = htmlWithHighlights.replace(
                              new RegExp(escapedChangeFrom, 'g'),
                              `<span style="text-decoration: line-through; color: red; background-color: #ffcccc; padding: 2px;">${item.changeFrom}</span> <span style="background-color: #c8e6c9; color: green; font-weight: bold; padding: 2px;">${item.changeTo}</span>`
                            );
                          }
                        } else if (item.changeTo) {
                          // Only changeTo exists - just highlight it
                          if (htmlWithHighlights.includes(item.changeTo)) {
                            changesApplied = true;
                            const escapedChangeTo = item.changeTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            htmlWithHighlights = htmlWithHighlights.replace(
                              new RegExp(escapedChangeTo, 'g'),
                              `<span style="background-color: #c8e6c9; color: green; font-weight: bold; padding: 2px 4px; border-radius: 3px;">${item.changeTo}</span>`
                            );
                          }
                        }
                      }

                      // If no changes from feedback, highlight any text differences
                      if (!changesApplied && documentContent !== editableContent) {
                        // Simple highlighting of any differences
                        const words = editableContent.split(/\s+/);
                        const originalWords = documentContent.split(/\s+/);

                        // Mark first 5 different words
                        let differencesFound = 0;
                        for (let i = 0; i < words.length && differencesFound < 5; i++) {
                          if (words[i] !== originalWords[i] && words[i]) {
                            const escapedWord = words[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            htmlWithHighlights = htmlWithHighlights.replace(
                              new RegExp(`\\b${escapedWord}\\b`, 'g'),
                              `<span style="background-color: #c8e6c9; color: green; font-weight: bold; padding: 1px 3px; border-radius: 2px;">${words[i]}</span>`
                            );
                            differencesFound++;
                          }
                        }
                      }

                      return <div dangerouslySetInnerHTML={{ __html: htmlWithHighlights }} />;
                    })()}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Change Summary:</Typography>
              <Typography variant="body2">
                • Total changes applied: {appliedChanges.size}<br />
                • Pending feedback items: {feedback.filter(f => f.status === 'pending' || !f.status).length}<br />
                • Merged changes: {feedback.filter(f => f.status === 'merged').length}<br />
                • Accepted changes: {feedback.filter(f => f.status === 'accepted').length}<br />
                • Rejected changes: {feedback.filter(f => f.status === 'rejected').length}
              </Typography>

              {appliedChanges.size > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Applied Changes:</Typography>
                  {Array.from(appliedChanges.entries()).map(([id, change]) => {
                    const feedbackItem = feedback.find(f => f.id === change.feedbackId);
                    return (
                      <Box key={id} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {feedbackItem?.pocName || 'Unknown'} - {feedbackItem?.commentType ? getCommentTypeLabel(feedbackItem.commentType) : ''}
                        </Typography>
                        <Typography variant="body2">
                          <span style={{ color: 'red', textDecoration: 'line-through' }}>{change.original}</span>
                          {' → '}
                          <span style={{ color: 'green', fontWeight: 'bold' }}>{change.changed}</span>
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Detailed Revision History Dialog - TEMPORARILY EMPTY FOR TESTING */}
      <Dialog open={showDetailedHistory} onClose={() => setShowDetailedHistory(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            <Typography variant="h6">Detailed Revision History</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {changeHistory.map((entry, index) => (
              <ListItem key={`version-${index}-${entry.timestamp}`} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, bgcolor: index === changeHistory.length - 1 ? 'action.selected' : 'transparent' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Version {index + 1} {index === changeHistory.length - 1 && '(Current)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.timestamp.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Content: {entry.content.length} characters
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Feedback items: {entry.feedback.length}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      const isCurrentVersion = (index === changeHistory.length - 1);
                      console.log('=== RESTORE DEBUG ===');
                      console.log('Restoring version:', index + 1);
                      console.log('Is current version:', isCurrentVersion);
                      console.log('Total versions:', changeHistory.length);

                      // For current version, we need to force UI refresh
                      if (isCurrentVersion) {
                        // Close and reopen dialog to force refresh
                        setShowDetailedHistory(false);

                        // Force state updates with new array instances
                        const refreshedHistory = [...changeHistory];
                        setChangeHistory(refreshedHistory);
                        setEditableContent(entry.content);
                        setDocumentContent(entry.content);
                        setFeedback(entry.feedback || []);

                        // Reopen dialog after a small delay
                        setTimeout(() => {
                          setShowDetailedHistory(true);
                        }, 100);

                        return; // No database update needed for current version
                      }

                      // For non-current versions, truncate history
                      const newHistory = changeHistory.slice(0, index + 1);
                      console.log('Truncating history from', changeHistory.length, 'to', newHistory.length, 'versions');

                      try {
                        // Save to database FIRST
                        const existingCustomFields = documentData?.customFields || {};
                        delete existingCustomFields.versionHistory;

                        const payload = {
                          content: entry.content,
                          customFields: {
                            ...existingCustomFields,
                            content: entry.content,
                            editableContent: entry.content,
                            draftFeedback: entry.feedback || [],
                            crmFeedback: entry.feedback || [],
                            versionHistory: newHistory
                          }
                        };

                        console.log('Sending to database - versionHistory length:', newHistory.length);
                        const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                          method: 'PATCH',
                          body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                          console.log('Database updated successfully');

                          // Update local state AFTER successful database save
                          setChangeHistory(newHistory);
                          changeHistoryRef.current = newHistory; // Update ref immediately
                          setEditableContent(entry.content);
                          setDocumentContent(entry.content);
                          setFeedback(entry.feedback || []);
                          setAppliedChanges(new Map());
                          setHistoryIndex(newHistory.length - 1); // Update history index

                          // Update documentData to match what we saved
                          setDocumentData(prev => ({
                            ...prev,
                            customFields: {
                              ...prev?.customFields,
                              versionHistory: newHistory,
                              content: entry.content,
                              editableContent: entry.content,
                              draftFeedback: entry.feedback || [],
                              crmFeedback: entry.feedback || []
                            }
                          }));

                          console.log('Local state updated - history now has', newHistory.length, 'versions');
                          console.log('Ref also updated to', changeHistoryRef.current.length, 'versions');

                          // Force re-render of all components to get fresh handlers
                          setComponentKey(prev => prev + 1);

                          // Force a small delay to ensure all state updates propagate
                          await new Promise(resolve => setTimeout(resolve, 100));
                        } else {
                          console.error('Failed to restore version');
                          window.alert('Failed to restore version');
                        }
                      } catch (error) {
                        console.error('Error restoring version:', error);
                        window.alert('Error restoring version');
                      }
                    }}
                  >
                    Restore This Version
                  </Button>
                </Box>

                {/* Show changes if available */}
                {entry.changes && entry.changes.details && entry.changes.details.length > 0 && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Changes Applied ({entry.changes.details.length}):
                    </Typography>
                    <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
                      {entry.changes.details.map((change, i) => (
                        <Box key={i} sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                          {change.original && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: 'error.main',
                                  textDecoration: 'line-through',
                                  bgcolor: '#ffebee',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 0.5,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {change.original}
                              </Typography>
                            </Box>
                          )}
                          {change.changed && (
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: 'success.main',
                                  bgcolor: '#e8f5e9',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 0.5,
                                  fontWeight: 'bold',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {change.changed}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </ListItem>
            ))}
            {changeHistory.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No history yet - apply some feedback to create history
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailedHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* OLD HISTORY CODE REMOVED */}
      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onClose={() => setShowVersionHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Document Version History</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText
                primary="Version 1.0 - Initial Document"
                secondary={`Created: ${documentData?.createdAt ? new Date(documentData.createdAt).toLocaleString() : 'Unknown'}`}
              />
            </ListItem>
            {documentData?.lastDraftUpdate && (
              <ListItem>
                <ListItemText
                  primary="Draft Feedback Added"
                  secondary={`Updated: ${new Date(documentData.lastDraftUpdate).toLocaleString()}`}
                />
              </ListItem>
            )}
            {documentData?.lastAIFeedbackGenerated && (
              <ListItem>
                <ListItemText
                  primary="AI Feedback Generated"
                  secondary={`Generated: ${new Date(documentData.lastAIFeedbackGenerated).toLocaleString()}`}
                />
              </ListItem>
            )}
            {documentData?.updatedAt && (
              <ListItem>
                <ListItemText
                  primary="Last Modified"
                  secondary={`Updated: ${new Date(documentData.updatedAt).toLocaleString()}`}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Comment Thread Dialog */}
      <Dialog open={showCommentDialog} onClose={() => setShowCommentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon />
            <Typography variant="h6">Comment Thread</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentThreadId && (
            <>
              <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {commentThreads.find(t => t.id === currentThreadId)?.comments.map(comment => (
                  <ListItem key={comment.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="primary" fontWeight="bold">
                      {comment.author}
                    </Typography>
                    <Typography variant="body2">
                      {comment.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.timestamp.toLocaleString()}
                    </Typography>
                  </ListItem>
                )) || (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No comments yet. Be the first to comment!
                  </Typography>
                )}
              </List>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                label="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment here..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCommentDialog(false);
            setNewComment('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveComment}
            disabled={!newComment.trim()}
            startIcon={<SendIcon />}
          >
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h5" gutterBottom>
              {documentData?.title || 'Document Preview'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box dangerouslySetInnerHTML={{ __html: documentContent || '<p>No content to preview</p>' }} />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OPRReviewPage;