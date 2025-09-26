import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { authTokenService } from '@/lib/authTokenService';
import { DocumentDetails, EditorState } from './types';

export const useDocumentData = (documentId: string) => {
  const [documentData, setDocumentData] = useState<DocumentDetails | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    loading: true,
    saving: false,
    error: null,
    lastSaved: null,
    hasUnsavedChanges: false,
    trackChanges: true,
    showChanges: true,
    changes: [],
    changesDrawerOpen: false,
    wordCount: 0,
    charCount: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const loadDocument = useCallback(async () => {
    try {
      setEditorState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.get(`/api/documents/${documentId}`);

      if (response.ok) {
        const data = await response.json();
        const document = data.document || data;
        setDocumentData(document);

        // Calculate initial stats - use comprehensive content loading with priority to get complete document including TOC
        let content = '';
        const customFields = document.customFields as any;

        console.log('useDocumentData - Loading document:', {
          documentId,
          hasCustomFields: !!customFields,
          customFieldsKeys: customFields ? Object.keys(customFields) : [],
          hasContent: !!customFields?.content,
          contentLength: customFields?.content?.length || 0
        });

        // Priority: htmlContent (complete with TOC) > content > editableContent > document.content > description
        if (customFields?.htmlContent) {
          content = customFields.htmlContent;
          console.log('useDocumentData - Using customFields.htmlContent (complete document with TOC):', { length: content.length });
        } else if (customFields?.content) {
          content = customFields.content;
          console.log('useDocumentData - Using customFields.content:', { length: content.length });
        } else if (customFields?.editableContent) {
          content = customFields.editableContent;
          console.log('useDocumentData - Using customFields.editableContent:', { length: content.length });
        } else if (document.content) {
          content = document.content;
          console.log('useDocumentData - Using document.content:', { length: content.length });
        } else if (document.description) {
          content = `<p>${document.description}</p>`;
          console.log('useDocumentData - Using document.description as fallback');
        }

        // Check for table of contents in the loaded content
        const hasTOC = /table\s+of\s+contents/i.test(content) ||
                      content.includes('table-of-contents') ||
                      /<h[1-6][^>]*>\s*(table\s+of\s+contents|contents|toc)\s*<\/h[1-6]>/i.test(content);

        console.log('useDocumentData - Content analysis:', {
          hasTableOfContents: hasTOC,
          totalLength: content.length,
          preview: content.substring(0, 300)
        });
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = content.length;

        setEditorState(prev => ({
          ...prev,
          loading: false,
          wordCount,
          charCount,
        }));
      } else {
        throw new Error(`Failed to load document: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setEditorState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load document',
      }));
    }
  }, [documentId]);

  const saveDocument = useCallback(async (content: string, showNotification = true) => {
    try {
      setEditorState(prev => ({ ...prev, saving: true, error: null }));

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          customFields: {
            ...documentData?.customFields,
            content, // Store content in customFields as well
            lastEditedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const updatedDocument = await response.json();
        setDocumentData(updatedDocument.document || updatedDocument);

        setEditorState(prev => ({
          ...prev,
          saving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }));

        if (showNotification) {
          // Could integrate with a toast notification system here
          console.log('Document saved successfully');
        }

        return true;
      } else {
        throw new Error(`Failed to save document: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setEditorState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to save document',
      }));
      return false;
    }
  }, [documentId, documentData]);

  const updateWordCount = useCallback((content: string) => {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0);
    const chars = content.replace(/<[^>]*>/g, '').length;

    setEditorState(prev => ({
      ...prev,
      wordCount: words.length,
      charCount: chars,
      hasUnsavedChanges: true,
    }));
  }, []);

  const updatePageInfo = useCallback((currentPage: number, totalPages: number) => {
    setEditorState(prev => ({
      ...prev,
      currentPage,
      totalPages,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setEditorState(prev => ({ ...prev, error }));
  }, []);

  const setTrackChanges = useCallback((trackChanges: boolean) => {
    setEditorState(prev => ({ ...prev, trackChanges }));
  }, []);

  const setShowChanges = useCallback((showChanges: boolean) => {
    setEditorState(prev => ({ ...prev, showChanges }));
  }, []);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Auto-save functionality - DISABLED to prevent save errors
  // useEffect(() => {
  //   if (!editorState.hasUnsavedChanges || editorState.saving || !documentData) {
  //     return;
  //   }

  //   const autoSaveTimer = setTimeout(() => {
  //     saveDocument(documentData.content, false);
  //   }, 5000); // Auto-save after 5 seconds of inactivity

  //   return () => clearTimeout(autoSaveTimer);
  // }, [editorState.hasUnsavedChanges, editorState.saving, documentData, saveDocument]);

  return {
    documentData,
    setDocumentData,
    editorState,
    setEditorState,
    loadDocument,
    saveDocument,
    updateWordCount,
    updatePageInfo,
    setError,
    setTrackChanges,
    setShowChanges,
  };
};