import { useState, useEffect, useCallback } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { DocumentData, CRMComment } from './types';

export const useOPRDocument = (documentId: string) => {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [feedback, setFeedback] = useState<CRMComment[]>([]);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocumentAndFeedback = useCallback(async () => {
    console.log('fetchDocumentAndFeedback called for document:', documentId);
    try {
      let allFeedback: CRMComment[] = [];

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
          content = doc.customFields.editableContent;
        } else if (doc.customFields?.htmlContent) {
          content = doc.customFields.htmlContent;
        } else if (doc.customFields?.content) {
          content = doc.customFields.content;
        } else if (doc.content) {
          content = doc.content;
        } else if (doc.description) {
          content = `<p>${doc.description}</p>`;
        }

        setDocumentContent(content);
        setEditableContent(content);

        // Collect feedback from all possible sources
        console.log('Checking for feedback in document customFields:', doc.customFields);

        // Check crmComments
        if (doc.customFields?.crmComments && Array.isArray(doc.customFields.crmComments)) {
          const crmComments = doc.customFields.crmComments.filter((c: any) => c && c.id);
          console.log('Found crmComments in document:', crmComments.length);
          allFeedback = [...allFeedback, ...crmComments];
        }

        // Check crmFeedback field
        if (doc.customFields?.crmFeedback && Array.isArray(doc.customFields.crmFeedback)) {
          const crmFeedback = doc.customFields.crmFeedback.filter((c: any) => c && c.id);
          console.log('Found crmFeedback in document:', crmFeedback.length);
          allFeedback = [...allFeedback, ...crmFeedback];
        }

        // Check commentMatrix field (used by Submit Review)
        if (doc.customFields?.commentMatrix && Array.isArray(doc.customFields.commentMatrix)) {
          const commentMatrix = doc.customFields.commentMatrix.filter((c: any) => c && c.id);
          console.log('Found commentMatrix in document:', commentMatrix.length);
          allFeedback = [...allFeedback, ...commentMatrix];
        }

        // Deduplicate feedback by ID
        if (allFeedback.length > 0) {
          const uniqueFeedback = Array.from(
            new Map(allFeedback.map(item => [item.id, item])).values()
          );
          console.log(`Total feedback items before deduplication: ${allFeedback.length}, after: ${uniqueFeedback.length}`);
          setFeedback(uniqueFeedback);
        }
      }

      // Also fetch OPR feedback from API endpoint and merge
      if (allFeedback.length === 0) {
        try {
          const feedbackResponse = await authTokenService.authenticatedFetch(
            `/api/documents/${documentId}/feedback`
          );

          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            console.log('Fetched feedback data from API:', feedbackData);

            // Extract CRM comments from the feedback response
            if (feedbackData && feedbackData.feedback) {
              // The feedback comes as an array of objects with feedbackData property
              const extractedComments = feedbackData.feedback.flatMap((item: any) => {
                if (item.feedbackData?.comments) {
                  return item.feedbackData.comments;
                }
                return [];
              });

              if (extractedComments.length > 0) {
                console.log('Found feedback from API:', extractedComments.length);
                allFeedback = [...allFeedback, ...extractedComments];

                // Deduplicate again
                const uniqueFeedback = Array.from(
                  new Map(allFeedback.map(item => [item.id, item])).values()
                );
                console.log(`Total feedback after API merge: ${allFeedback.length}, unique: ${uniqueFeedback.length}`);
                setFeedback(uniqueFeedback);
              }
            }
          }
        } catch (error) {
          console.log('No OPR feedback found or error fetching:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const handleSaveDocument = useCallback(async () => {
    setSavingDocument(true);
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            ...documentData?.customFields,
            editableContent,
            htmlContent: editableContent,
            lastEditedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const updatedDoc = await response.json();
        setDocumentData(updatedDoc);
        setDocumentContent(editableContent);
        alert('Document saved successfully!');
      } else {
        alert('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setSavingDocument(false);
    }
  }, [documentId, documentData, editableContent]);

  const handleExport = useCallback(async (format: string, includeTrackChanges: boolean = false) => {
    setExporting(true);
    try {
      const exportContent = includeTrackChanges
        ? `<div>${editableContent}<hr/><h2>Track Changes</h2>${JSON.stringify(feedback, null, 2)}</div>`
        : editableContent;

      const response = await authTokenService.authenticatedFetch('/api/export', {
        method: 'POST',
        body: JSON.stringify({
          content: exportContent,
          format,
          filename: `${documentData?.title || 'document'}-review.${format}`,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData?.title || 'document'}-review.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  }, [editableContent, feedback, documentData]);

  useEffect(() => {
    fetchDocumentAndFeedback();
  }, [fetchDocumentAndFeedback]);

  return {
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
    setSavingDocument,
    exporting,
    setExporting,
    loading,
    fetchDocumentAndFeedback,
    handleSaveDocument,
    handleExport,
  };
};