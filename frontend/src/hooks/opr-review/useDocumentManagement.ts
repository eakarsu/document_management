import { useState, useEffect, useRef } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment, ChangeHistoryEntry, AlertState } from '../../types/opr-review';

export const useDocumentManagement = (documentId: string) => {
  const [documentData, setDocumentData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [feedback, setFeedback] = useState<CRMComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [appliedChanges, setAppliedChanges] = useState<Map<string, { original: string, changed: string, feedbackId: string }>>(new Map());
  const changeHistoryRef = useRef<typeof changeHistory>([]);

  const fetchDocumentAndFeedback = async () => {
    try {
      setLoading(true);
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
      setAlert({ open: true, severity: 'error', message: 'Failed to load document' });
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async (content: string) => {
    try {
      setSavingDocument(true);

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customFields: {
            ...documentData?.customFields,
            editableContent: content,
            htmlContent: content
          }
        }),
      });

      if (response.ok) {
        setAlert({ open: true, severity: 'success', message: 'Document saved successfully' });
        setDocumentContent(content);
        setEditableContent(content);
        // Update document data to reflect saved state
        setDocumentData(prev => ({
          ...prev,
          customFields: {
            ...prev?.customFields,
            editableContent: content,
            htmlContent: content
          }
        }));
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setAlert({ open: true, severity: 'error', message: 'Failed to save document' });
    } finally {
      setSavingDocument(false);
    }
  };

  // Initialize history when document is loaded
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
    }
  }, [documentData, documentContent, historyInitialized]);

  return {
    documentData,
    documentContent,
    editableContent,
    setEditableContent,
    feedback,
    setFeedback,
    loading,
    savingDocument,
    alert,
    setAlert,
    changeHistory,
    setChangeHistory,
    historyIndex,
    setHistoryIndex,
    appliedChanges,
    setAppliedChanges,
    changeHistoryRef,
    fetchDocumentAndFeedback,
    saveDocument
  };
};