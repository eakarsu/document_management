import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { authTokenService } from '@/lib/authTokenService';
import { SupplementType } from '@/types/editor';

interface UseSupplementOperationsProps {
  editor: Editor | null;
  documentId: string;
  selectedText: string;
  supplementType: SupplementType;
  supplementLevel: number;
  supplementOrganization: string;
  setAiGenerating: (generating: boolean) => void;
  setAiSuggestions: (suggestions: any[]) => void;
  setShowAiDialog: (show: boolean) => void;
  setSupplementDialogOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSupplementOperations = ({
  editor,
  documentId,
  selectedText,
  supplementType,
  supplementLevel,
  supplementOrganization,
  setAiGenerating,
  setAiSuggestions,
  setShowAiDialog,
  setSupplementDialogOpen,
  setError
}: UseSupplementOperationsProps) => {

  const handleCreateSupplementFromSelection = useCallback(() => {
    if (selectedText) {
      setSupplementDialogOpen(true);
    }
  }, [selectedText, setSupplementDialogOpen]);

  const handleAIPoweredSupplement = useCallback(async () => {
    if (!editor) return;

    setAiGenerating(true);
    setError(null);

    const textToAnalyze = selectedText || editor.state.doc.textBetween(
      0,
      editor.state.doc.content.size,
      ' '
    ).substring(0, 2000);

    try {
      const response = await authTokenService.authenticatedFetch(
        '/api/ai/supplement-suggestions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: textToAnalyze,
            supplementType: supplementType,
            organizationLevel: supplementLevel,
            context: 'Air Force Publication'
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
          setShowAiDialog(true);
        } else {
          setError('No AI suggestions available for this content.');
        }
      } else {
        const errorData = await response.text();
        console.error('AI suggestion error:', errorData);
        setError('Failed to get AI suggestions. Please try again.');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      setError('Failed to connect to AI service. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [
    editor,
    selectedText,
    supplementType,
    supplementLevel,
    setAiGenerating,
    setAiSuggestions,
    setShowAiDialog,
    setError
  ]);

  const applyAiSuggestion = useCallback((suggestion: any) => {
    if (!editor) return;

    editor.chain().focus().insertContent(suggestion.content).run();
    setShowAiDialog(false);
  }, [editor, setShowAiDialog]);

  const handleCreateSupplement = useCallback(async () => {
    if (!editor) return;

    try {
      let selectedContent = '';
      let sectionNumber = '';

      // Get selected content if any
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedNode = editor.state.doc.cut(from, to);
        selectedContent = selectedNode.textContent;

        // Try to extract section number
        const sectionMatch = selectedContent.match(/^(\d+(?:\.\d+)*)/);
        if (sectionMatch) {
          sectionNumber = sectionMatch[1];
        }
      }

      // Create supplement document
      const response = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/supplement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplementType,
          organizationLevel: supplementLevel,
          organization: supplementOrganization,
          selectedContent,
          sectionNumber
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Redirect to the new supplement document
          window.open(`/editor/${data.supplementId}`, '_blank');
          setSupplementDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error creating supplement:', error);
      setError('Failed to create supplement. Please try again.');
    }
  }, [
    editor,
    documentId,
    supplementType,
    supplementLevel,
    supplementOrganization,
    setSupplementDialogOpen,
    setError
  ]);

  return {
    handleCreateSupplementFromSelection,
    handleAIPoweredSupplement,
    applyAiSuggestion,
    handleCreateSupplement
  };
};