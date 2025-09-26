import { useCallback } from 'react';

export const useEditorUtils = () => {
  // Helper function to remove all color styling from content
  const removeAllColors = useCallback((htmlContent: string): string => {
    return htmlContent
      // Remove color property from any style attribute
      .replace(/style="([^"]*)"/gi, (match, styles) => {
        const newStyles = styles
          .split(';')
          .filter((s: string) => !s.trim().toLowerCase().startsWith('color:'))
          .join(';')
          .trim();

        return newStyles ? `style="${newStyles}"` : '';
      })
      // Remove any standalone color attributes
      .replace(/\scolor="[^"]*"/gi, '')
      // Clean up empty style attributes
      .replace(/\sstyle="[\s;]*"/gi, '')
      // Remove spans that now have no attributes
      .replace(/<span>([^<]*)<\/span>/gi, '$1');
  }, []);

  const handleUndo = useCallback((editor: any) => {
    if (editor?.can().undo()) {
      editor.chain().focus().undo().run();
    }
  }, []);

  const handleRedo = useCallback((editor: any) => {
    if (editor?.can().redo()) {
      editor.chain().focus().redo().run();
    }
  }, []);

  return {
    removeAllColors,
    handleUndo,
    handleRedo
  };
};