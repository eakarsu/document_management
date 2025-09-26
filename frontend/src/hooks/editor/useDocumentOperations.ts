import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { api } from '@/lib/api';
import { authTokenService } from '@/lib/authTokenService';
import { DocumentDetails, AirForceHeader } from '@/types/editor';

interface UseDocumentOperationsProps {
  documentId: string;
  editor: Editor | null;
  setDocumentData: (data: DocumentDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setIsSupplementDocument: (isSupp: boolean) => void;
  setDocumentOrganization: (org: string) => void;
  setAirForceHeader: (header: AirForceHeader) => void;
  setTotalPages: (pages: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLastSaved: (date: Date) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  isSupplementRef: React.MutableRefObject<boolean>;
  calculatePageFromScroll: () => void;
  removeAllColors: (htmlContent: string) => string;
}

export const useDocumentOperations = ({
  documentId,
  editor,
  setDocumentData,
  setLoading,
  setIsSupplementDocument,
  setDocumentOrganization,
  setAirForceHeader,
  setTotalPages,
  setHasUnsavedChanges,
  setLastSaved,
  setSaving,
  setError,
  isSupplementRef,
  calculatePageFromScroll,
  removeAllColors
}: UseDocumentOperationsProps) => {

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);

      // Wait a bit for editor to be ready
      if (!editor) {
        setTimeout(() => loadDocument(), 100);
        return;
      }

      // First get basic document info
      const docResponse = await api.get(`/api/documents/${documentId}`);

      if (docResponse.ok) {
        const docData = await docResponse.json();
        setDocumentData(docData.document);

        // Check if this is a supplement document
        const isSupplement = docData.document.metadata?.supplementType ||
                            docData.document.title?.includes('SUP') ||
                            docData.document.category === 'SUPPLEMENT';

        if (isSupplement) {
          setIsSupplementDocument(true);
          isSupplementRef.current = true;
          setDocumentOrganization(docData.document.metadata?.organization || 'test');
        } else {
          isSupplementRef.current = false;
        }

        // Then get the editable content
        const contentResponse = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/content`, {
          method: 'GET'
        });

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();

          if (contentData.success && contentData.document.content) {
            let content = contentData.document.content;
            const customFields = contentData.document.customFields || {};

            // Check if this is an Air Force document
            const isAirForceDoc = content && (
              content.includes('UNCLASSIFIED') ||
              content.includes('TABLE OF CONTENTS') ||
              content.includes('AIR FORCE') ||
              docData.document.title?.includes('AIR FORCE') ||
              docData.document.category === 'ADMINISTRATION'
            );

            const hasCustomHeader = contentData.document.hasCustomHeader || customFields.hasCustomHeader;
            const headerHtml = contentData.document.headerHtml || customFields.headerHtml;
            const documentStyles = contentData.document.documentStyles || customFields.documentStyles;
            const editableContent = contentData.document.content || customFields.editableContent || content;

            if (hasCustomHeader && headerHtml) {
              setAirForceHeader({
                hasHeader: true,
                headerHtml: headerHtml,
                documentStyles: documentStyles || '',
                editableContent: editableContent
              });

              // Extract content for existing documents that still have header/TOC
              if (editableContent.includes('UNCLASSIFIED') || editableContent.includes('TABLE OF CONTENTS')) {
                content = extractEditableContent(editableContent);
              } else {
                content = editableContent;
              }
            } else {
              setAirForceHeader({ hasHeader: false });
            }

            // Convert plain text to HTML if needed
            if (!content.includes('<') && !content.includes('>')) {
              content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
            }

            const cleanedContent = removeAllColors(content);
            editor.commands.setContent(cleanedContent);
            calculatePages();
          } else if (docData.document.content) {
            // Fallback to basic document content
            let content = docData.document.content;

            if (!content.includes('<') && !content.includes('>')) {
              content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
            }

            const cleanedContent = removeAllColors(content);
            editor.commands.setContent(cleanedContent);
            calculatePages();
          } else {
            console.warn('No content found for document');
            editor.commands.setContent('<p>No content available</p>');
            setTotalPages(1);
          }
        } else {
          throw new Error(`Failed to fetch content: ${contentResponse.status}`);
        }
      } else {
        throw new Error(`Failed to fetch document: ${docResponse.status}`);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setError(error instanceof Error ? error.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId, editor]);

  const handleSave = useCallback(async (showNotification = true) => {
    if (!editor || !documentId) return;

    try {
      setSaving(true);
      const content = editor.getHTML();

      const response = await authTokenService.authenticatedFetch(`/api/editor/documents/${documentId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setError(null);

        if (showNotification) {
          // Could implement notification system here
          console.log('Document saved successfully');
        }
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  }, [editor, documentId]);

  const calculatePages = useCallback(() => {
    if (!editor) return;

    setTimeout(() => {
      const chars = editor.storage.characterCount.characters();
      const words = editor.storage.characterCount.words();
      const doc = editor.state.doc;
      let blockCount = 0;
      doc.descendants((node) => {
        if (node.isBlock) {
          blockCount++;
        }
      });

      // Count actual page divs first
      const html = editor.getHTML();
      const pageMatches = html.match(/data-page="/g);
      const pageCount = pageMatches ? pageMatches.length : 0;

      if (pageCount > 0) {
        setTotalPages(pageCount);
      } else {
        // Fall back to estimation
        const pagesByWords = Math.ceil(words / 250);
        const pagesByChars = Math.ceil(chars / 1500);
        const pagesByBlocks = Math.ceil(blockCount / 25);
        const pages = Math.max(1, Math.max(pagesByWords, pagesByChars, pagesByBlocks));
        setTotalPages(pages);
      }
      calculatePageFromScroll();
    }, 500);
  }, [editor, calculatePageFromScroll]);

  const extractEditableContent = (content: string): string => {
    let extractedContent = content;

    // Remove TABLE OF CONTENTS section
    const tocPattern = /TABLE OF CONTENTS[\s\S]*?(?=<h2[^>]*>1\.\s+[A-Z])/;
    const tocMatch = extractedContent.match(tocPattern);

    if (tocMatch) {
      extractedContent = extractedContent.replace(tocPattern, '');
    }

    // Remove TOC in h2 format
    if (extractedContent.includes('TABLE OF CONTENTS')) {
      const h2TocPattern = /<h2[^>]*>TABLE OF CONTENTS<\/h2>[\s\S]*?(?=<h2[^>]*>[^T])/;
      const h2Match = extractedContent.match(h2TocPattern);

      if (h2Match) {
        extractedContent = extractedContent.replace(h2TocPattern, '');
      }

      // Fallback removal
      if (extractedContent.includes('TABLE OF CONTENTS')) {
        const tocStart = extractedContent.indexOf('TABLE OF CONTENTS');
        const sectionPattern = /<h2[^>]*>1\.\s+[A-Z]/;
        const sectionMatch = extractedContent.match(sectionPattern);

        if (tocStart !== -1 && sectionMatch && sectionMatch.index) {
          if (sectionMatch.index > tocStart) {
            extractedContent = extractedContent.substring(0, tocStart) + extractedContent.substring(sectionMatch.index);
          }
        }
      }
    }

    // Final cleanup: Remove header content before first main section
    if (extractedContent.includes('UNCLASSIFIED') || extractedContent.includes('BY ORDER OF')) {
      const firstMainSection = extractedContent.match(/<h2[^>]*>1\.\s+[A-Z]/);
      if (firstMainSection && firstMainSection.index) {
        extractedContent = extractedContent.substring(firstMainSection.index);
      }
    }

    return extractedContent;
  };

  return {
    loadDocument,
    handleSave,
    calculatePages
  };
};