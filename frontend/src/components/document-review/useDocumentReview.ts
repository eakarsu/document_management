import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment, DocumentData, ReviewState, CurrentCommentState } from './types';

export const useDocumentReview = (documentId: string) => {
  const router = useRouter();

  const [state, setState] = useState<ReviewState>({
    comments: [],
    documentData: null,
    documentContent: '',
    showAddForm: true,
    showLineNumbers: true,
    showPageNumbers: true,
    selectedComment: null,
    generatingAIFeedback: false,
    isAIGeneratedDoc: false,
    aiFeedbackCount: 10,
    workflowStage: '',
    userRole: ''
  });

  const [currentComment, setCurrentComment] = useState<CurrentCommentState>({
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
    coordinatorJustification: ''
  });

  const determineUserRole = useCallback(() => {
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('userEmail');

    if (username === 'coordinator1' || userEmail === 'coordinator1@airforce.mil' ||
        (username && username.toLowerCase().includes('coordinator')) ||
        (userEmail && userEmail.toLowerCase().includes('coordinator'))) {
      return 'Coordinator';
    } else if (username === 'reviewer1' || username === 'reviewer2' ||
               userEmail === 'reviewer1@airforce.mil' || userEmail === 'reviewer2@airforce.mil' ||
               (username && username.toLowerCase().includes('reviewer')) ||
               (userEmail && userEmail.toLowerCase().includes('reviewer'))) {
      return 'Reviewer';
    } else if (username === 'ao1' || userEmail === 'ao1@airforce.mil' ||
               (username && username.toLowerCase().includes('action'))) {
      return 'ACTION_OFFICER';
    }
    return 'Reviewer';
  }, []);

  const fetchWorkflowInfo = useCallback(async () => {
    try {
      // Use the new POST endpoint to avoid Next.js routing issues
      const workflowResponse = await authTokenService.authenticatedFetch('/api/workflow-instances-by-id', {
        method: 'POST',
        body: JSON.stringify({ documentId })
      });
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        const stageId = String(workflowData.currentStageId || '');
        setState(prev => ({ ...prev, workflowStage: stageId }));
      }

      const storedRole = localStorage.getItem('userRole');
      const userInfo = localStorage.getItem('userInfo');
      let role = determineUserRole();

      if (storedRole) {
        role = storedRole;
      } else if (userInfo) {
        try {
          const userData = JSON.parse(userInfo);
          if (userData.role) {
            role = userData.role;
          }
        } catch (e) {
          // Keep determined role
        }
      }

      setState(prev => ({ ...prev, userRole: role }));
    } catch (error) {
      console.error('Error fetching workflow info:', error);
    }
  }, [documentId, determineUserRole]);

  const fetchDocument = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        const doc = data.document || data;

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

        let isAIDoc = false;
        let comments: CRMComment[] = [];

        if (doc.customFields && typeof doc.customFields === 'object') {
          const customFields = doc.customFields as any;

          if (customFields.aiGenerated || doc.category === 'AI_GENERATED') {
            isAIDoc = true;
          }

          console.log('[LOAD FEEDBACK] Document customFields:', {
            isAIDoc,
            hasCrmFeedback: !!customFields.crmFeedback,
            crmFeedbackCount: customFields.crmFeedback?.length || 0,
            hasDraftFeedback: !!customFields.draftFeedback,
            draftFeedbackCount: customFields.draftFeedback?.length || 0,
            customFieldsKeys: Object.keys(customFields)
          });

          // Load feedback matching save logic:
          // - AI docs: saved to BOTH crmFeedback and draftFeedback (use crmFeedback or fallback)
          // - Non-AI docs: saved to draftFeedback ONLY (always use draftFeedback)
          if (isAIDoc) {
            // For AI docs, try crmFeedback first, then draftFeedback
            if (customFields.crmFeedback && Array.isArray(customFields.crmFeedback)) {
              comments = customFields.crmFeedback;
              console.log('[LOAD FEEDBACK] AI doc - Loaded from crmFeedback:', comments.length);
            } else if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              comments = customFields.draftFeedback;
              console.log('[LOAD FEEDBACK] AI doc - Loaded from draftFeedback:', comments.length);
            }
          } else {
            // For non-AI docs, ONLY use draftFeedback (this is where saves go)
            if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              comments = customFields.draftFeedback;
              console.log('[LOAD FEEDBACK] Non-AI doc - Loaded from draftFeedback:', comments.length);
            }
          }
        }

        console.log('[LOAD FEEDBACK] Final comments count:', comments.length);

        setState(prev => ({
          ...prev,
          documentData: doc,
          documentContent: content,
          isAIGeneratedDoc: isAIDoc,
          comments
        }));
      } else {
        console.error('Failed to fetch document');
        if (response.status === 401) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  }, [documentId, router]);

  const saveComments = useCallback(async (updatedComments: CRMComment[]) => {
    try {
      const updateFields: any = {
        lastDraftUpdate: new Date().toISOString()
      };

      // Update ALL feedback fields to keep them in sync and clear stale data
      if (state.isAIGeneratedDoc) {
        updateFields.crmFeedback = updatedComments;
        updateFields.draftFeedback = updatedComments;
        updateFields.crmComments = updatedComments;
        updateFields.commentMatrix = updatedComments;
      } else {
        updateFields.draftFeedback = updatedComments;
        updateFields.crmFeedback = updatedComments; // Clear stale crmFeedback
        updateFields.crmComments = updatedComments; // Clear stale crmComments
        updateFields.commentMatrix = updatedComments; // Clear stale commentMatrix
      }

      console.log('[SAVE FEEDBACK] Saving comments:', {
        documentId,
        count: updatedComments.length,
        isAIDoc: state.isAIGeneratedDoc,
        updateFields
      });

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: updateFields
        })
      });

      console.log('[SAVE FEEDBACK] Response status:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[SAVE FEEDBACK] Save successful:', data);
      } else {
        const errorText = await response.text();
        console.error('[SAVE FEEDBACK] Save failed:', response.status, errorText);
      }

      return response.ok;
    } catch (error) {
      console.error('[SAVE FEEDBACK] Error saving comments:', error);
      return false;
    }
  }, [documentId, state.isAIGeneratedDoc]);

  const handleAddComment = useCallback(async () => {
    if (!currentComment.commentType) {
      alert('Please fill in required field: Comment Type');
      return;
    }

    const newComment = { ...currentComment, id: Date.now().toString() };
    const updatedComments = [...state.comments, newComment];

    setState(prev => ({ ...prev, comments: updatedComments }));

    const saved = await saveComments(updatedComments);
    if (!saved) {
      alert('Failed to save feedback to database');
    }

    setCurrentComment({
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
      coordinatorJustification: ''
    });
  }, [currentComment, state.comments, saveComments]);

  const handleDeleteComment = useCallback(async (id: string) => {
    const updatedComments = state.comments.filter(c => c.id !== id);
    setState(prev => ({ ...prev, comments: updatedComments }));

    const saved = await saveComments(updatedComments);
    if (!saved) {
      alert('Failed to delete comment from database');
    }
  }, [state.comments, saveComments]);

  const handleToggleSelect = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    }));
  }, []);

  const handleSelectComment = useCallback((comment: CRMComment) => {
    setState(prev => ({ ...prev, selectedComment: comment, showAddForm: true }));
    setCurrentComment({
      ...comment,
      id: undefined
    });
  }, []);

  const generateAIFeedback = useCallback(async () => {
    if (state.aiFeedbackCount < 1 || state.aiFeedbackCount > 50) {
      window.alert('Please enter a number between 1 and 50 for feedback count');
      return;
    }

    setState(prev => ({ ...prev, generatingAIFeedback: true }));

    try {
      const response = await authTokenService.authenticatedFetch('/api/generate-ai-feedback', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          documentContent: state.documentContent,
          documentType: 'Review',
          feedbackCount: state.aiFeedbackCount
        })
      });

      if (response.ok) {
        const result = await response.json();
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
          selected: false
        }));

        const allFeedback = [...state.comments, ...aiFeedback];
        setState(prev => ({ ...prev, comments: allFeedback }));

        const saved = await saveComments(allFeedback);
        const message = saved
          ? `Generated ${aiFeedback.length} AI feedback items and saved to database`
          : `Generated ${aiFeedback.length} AI feedback items but failed to save to database`;
        window.alert(message);
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      window.alert('Failed to generate AI feedback');
    } finally {
      setState(prev => ({ ...prev, generatingAIFeedback: false }));
    }
  }, [documentId, state.documentContent, state.aiFeedbackCount, state.comments, saveComments]);

  const handleClearSelectedFeedback = useCallback(async () => {
    const selectedCount = state.comments.filter(item => item.selected).length;

    if (selectedCount === 0) {
      window.alert('No feedback items selected.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCount} selected feedback items? This action cannot be undone.`)) {
      return;
    }

    const remainingFeedback = state.comments.filter(item => !item.selected);
    setState(prev => ({
      ...prev,
      comments: remainingFeedback,
      selectedComment: prev.selectedComment?.selected ? null : prev.selectedComment
    }));

    const saved = await saveComments(remainingFeedback);
    const message = saved
      ? `${selectedCount} feedback items deleted successfully.`
      : 'Failed to update database.';
    window.alert(message);
  }, [state.comments, state.selectedComment, saveComments]);

  const handleClearAllFeedback = useCallback(async () => {
    setState(prev => ({ ...prev, comments: [], selectedComment: null }));
    await saveComments([]);
  }, [saveComments]);

  const handleSubmitFeedbackToOPR = useCallback(async () => {
    if (state.comments.length === 0) {
      alert('Please add at least one comment before submitting');
      return;
    }

    try {
      const patchResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            commentMatrix: state.comments,
            lastCommentUpdate: new Date().toISOString()
          }
        })
      });

      if (!patchResponse.ok) {
        alert('Failed to save feedback');
        return;
      }

      const taskResponse = await authTokenService.authenticatedFetch(`/api/workflow-instances/${documentId}`);
      if (taskResponse.ok) {
        const workflowData = await taskResponse.json();
        const activeTask = workflowData.activeTasks?.find((task: any) =>
          task.status === 'active' || task.status === 'pending'
        );

        if (activeTask) {
          const completeResponse = await authTokenService.authenticatedFetch(
            `/api/workflow-instances/${documentId}/tasks/${activeTask.id}/complete`,
            {
              method: 'POST',
              body: JSON.stringify({
                decision: 'approved',
                comments: `Submitted ${state.comments.length} feedback item(s) for OPR review`
              })
            }
          );

          const message = completeResponse.ok
            ? 'Feedback successfully submitted to OPR!'
            : 'Feedback saved but could not complete workflow task';
          alert(message);
        } else {
          alert('Feedback saved successfully!');
        }
      } else {
        alert('Feedback saved successfully!');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback to OPR');
    }
  }, [documentId, state.comments, router]);

  const handleSubmitForSecondCoordination = useCallback(async () => {
    try {
      const response = await fetch('/api/workflow-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'advance',
          workflowId: documentId,
          fromStage: '4',
          toStage: '5',
          requiredRole: 'ACTION_OFFICER'
        })
      });

      if (response.ok) {
        alert('Successfully submitted for second coordination!');
        router.push('/dashboard');
      } else {
        alert('Failed to submit for second coordination');
      }
    } catch (error) {
      console.error('Error submitting for second coordination:', error);
      alert('Error submitting for second coordination');
    }
  }, [documentId, router]);

  useEffect(() => {
    if (documentId) {
      fetchWorkflowInfo();
      fetchDocument();
    }
  }, [documentId, fetchWorkflowInfo, fetchDocument]);

  useEffect(() => {
    setState(prev => ({ ...prev, userRole: determineUserRole() }));
  }, [determineUserRole]);

  return {
    state,
    setState,
    currentComment,
    setCurrentComment,
    handleAddComment,
    handleDeleteComment,
    handleToggleSelect,
    handleSelectComment,
    generateAIFeedback,
    handleClearSelectedFeedback,
    handleClearAllFeedback,
    handleSubmitFeedbackToOPR,
    handleSubmitForSecondCoordination
  };
};