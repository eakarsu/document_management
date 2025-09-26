import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authTokenService } from '@/lib/authTokenService';
import { DocumentData, CRMComment, WorkflowStage } from '../../types/review';

export const useDocument = (documentId: string) => {
  const router = useRouter();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [comments, setComments] = useState<CRMComment[]>([]);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('');
  const [isAIGeneratedDoc, setIsAIGeneratedDoc] = useState(false);

  useEffect(() => {
    // Fetch workflow information
    const fetchWorkflowInfo = async () => {
      try {
        const workflowResponse = await authTokenService.authenticatedFetch(`/api/workflow-instances/${documentId}`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          // Convert to string to ensure consistent comparison
          const stageId = String(workflowData.currentStageId || '');
          setWorkflowStage(stageId);
        } else {
          console.error('Failed to fetch workflow instance');
        }
      } catch (error) {
        console.error('Error fetching workflow info:', error);
      }
    };

    // Fetch document using authenticated service
    const fetchDocument = async () => {
      try {
        const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();

          // Extract the actual document from the response
          const doc = data.document || data;
          setDocumentData(doc);

          // Try multiple places for content - use editableContent to avoid header
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
            // Use description as fallback
            content = `<p>${doc.description}</p>`;
          }

          // If still no content, create some default content
          if (!content && doc.title) {
            content = `
              <h1>${doc.title}</h1>
              <p>Document ID: ${doc.id}</p>
              <p>Category: ${doc.category || 'Not specified'}</p>
              <p>Status: ${doc.status}</p>
              <p>Created: ${new Date(doc.createdAt).toLocaleDateString()}</p>
              <hr/>
              <p><em>This document does not have any content stored in the database.</em></p>
            `;
          }

          setDocumentContent(content);

          // Load feedback from database - prioritize AI-generated feedback for AI documents
          if (doc.customFields && typeof doc.customFields === 'object') {
            const customFields = doc.customFields as any;

            // Check if this is an AI-generated document
            if (customFields.aiGenerated || doc.category === 'AI_GENERATED') {
              setIsAIGeneratedDoc(true);
            }

            // Check for AI-generated feedback first (for AI-generated documents)
            if (customFields.crmFeedback && Array.isArray(customFields.crmFeedback)) {
              setComments(customFields.crmFeedback);
            }
            // Fallback to draft feedback
            else if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              setComments(customFields.draftFeedback);
            }
          }
        } else {
          console.error('Failed to fetch document');
          if (response.status === 401) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    fetchWorkflowInfo();
    fetchDocument();
  }, [documentId, router]);

  return {
    documentData,
    documentContent,
    comments,
    setComments,
    workflowStage,
    isAIGeneratedDoc
  };
};