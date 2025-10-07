import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { authTokenService } from '@/lib/authTokenService';

export interface DocumentData {
  id: string;
  title: string;
  description?: string;
  content?: string;
  version: number;
  status: string;
  classificationLevel: string;
  organization?: string;
  createdBy?: any;
  updatedAt?: string;
  createdAt?: string;
  tags?: string[];
  documentPermissions?: any[];
  versions?: any[];
  feedbackCount?: number;
  hasActiveTasks?: boolean;
  canEdit?: boolean;
  canComment?: boolean;
  canViewVersions?: boolean;
}

export interface DocumentComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WorkflowStatus {
  active: boolean;
  workflowId?: string;
  currentStageId?: string;
  currentStageName?: string;
  currentStageType?: string;
  history?: any[];
}

interface UseDocumentDataProps {
  documentId: string;
  userRole?: string;
}

export const useDocumentData = ({ documentId, userRole }: UseDocumentDataProps) => {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load document data
  const loadDocument = useCallback(async () => {
    try {
      const response = await api.get(`/api/documents/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const data = await response.json();

      // Also fetch the document content
      let content = '';
      try {
        const contentResponse = await api.get(`/api/documents/${documentId}/update-content`);
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          content = contentData.content || '';
        }
      } catch (err) {
        console.log('Could not fetch document content:', err);
      }

      // Check permissions (simplified without getUserId)
      const canEdit = userRole === 'Admin' ||
                     userRole === 'Coordinator' ||
                     data.documentPermissions?.some((p: any) =>
                       (p.permission === 'WRITE' || p.permission === 'ADMIN')
                     );

      const canComment = canEdit ||
                        userRole === 'SUB_REVIEWER' ||
                        data.documentPermissions?.some((p: any) =>
                          p.permission === 'READ'
                        );

      setDocument({
        ...data,
        content,
        canEdit,
        canComment,
        canViewVersions: canEdit || userRole === 'Admin'
      });
    } catch (err) {
      console.error('Error loading document:', err);
      throw err;
    }
  }, [documentId, userRole]);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else if (response.status === 404) {
        // Comments endpoint doesn't exist yet, set empty array
        setComments([]);
        // Don't log 404s as they're expected when no comments exist
        return;
      }
    } catch (err) {
      // Only log non-404 errors
      if (!err || !(err instanceof Response) || err.status !== 404) {
        console.error('Error loading comments:', err);
      }
      setComments([]);
    }
  }, [documentId]);

  // Load feedback
  const loadFeedback = useCallback(async () => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/feedback`
      );
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      } else if (response.status === 404) {
        // Feedback endpoint doesn't exist yet, set empty array
        setFeedback([]);
        // Don't log 404s as they're expected when no feedback exists
        return;
      }
    } catch (err) {
      // Only log non-404 errors
      if (!err || !(err instanceof Response) || err.status !== 404) {
        console.error('Error loading feedback:', err);
      }
      setFeedback([]);
    }
  }, [documentId]);

  // Load workflow status
  const loadWorkflowStatus = useCallback(async () => {
    try {
      // Use POST with documentId in body to avoid Next.js route issues
      // Call backend directly since nginx routes /api/ to backend
      const response = await api.get(`/api/workflow-instances/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowStatus(data);
      }
    } catch (err) {
      console.error('Error loading workflow status:', err);
    }
  }, [documentId]);

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadDocument(),
        loadComments(),
        loadFeedback(),
        loadWorkflowStatus()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document data');
    } finally {
      setLoading(false);
    }
  }, [loadDocument, loadComments, loadFeedback, loadWorkflowStatus]);

  // Add comment
  const addComment = useCallback(async (content: string) => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, [documentId]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/documents/${documentId}/comments/${commentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }, [documentId]);

  // Refresh data
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshKey]);

  return {
    document,
    comments,
    feedback,
    workflowStatus,
    loading,
    error,
    addComment,
    deleteComment,
    refresh,
    setDocument,
    setComments,
    setFeedback,
    setWorkflowStatus
  };
};