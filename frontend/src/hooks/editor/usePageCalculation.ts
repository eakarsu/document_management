import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

export const usePageCalculation = (editor: Editor | null, totalPages: number) => {
  const [currentPage, setCurrentPage] = useState(1);
  const calculatePageFromCursorRef = useRef<(() => void) | null>(null);
  const calculatePageFromScrollRef = useRef<(() => void) | null>(null);

  // Calculate page based on scroll position
  const calculatePageFromScroll = useCallback(() => {
    // Check if document is ready
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      // Get scroll position - handle SSR and early renders
      const scrollTop = window.pageYOffset ||
                       (document.documentElement && document.documentElement.scrollTop) ||
                       (document.body && document.body.scrollTop) ||
                       0;
      const scrollHeight = Math.max(
        (document.documentElement && document.documentElement.scrollHeight) || 0,
        (document.body && document.body.scrollHeight) || 0,
        1
      );
      const clientHeight = window.innerHeight ||
                          (document.documentElement && document.documentElement.clientHeight) ||
                          (document.body && document.body.clientHeight) ||
                          0;

      // Avoid division by zero
      if (scrollHeight <= clientHeight || totalPages === 0) {
        // Document fits in window, use cursor position instead
        if (calculatePageFromCursorRef.current) {
          calculatePageFromCursorRef.current();
        }
        return;
      }

      // Calculate what percentage of the document we've scrolled through
      const maxScroll = scrollHeight - clientHeight;
      const scrollPercentage = Math.min(1, Math.max(0, scrollTop / maxScroll));

      // Calculate current page based on scroll position
      // Use floor and add 1 to start from page 1
      const calculatedPage = Math.max(1, Math.min(totalPages,
        Math.floor(scrollPercentage * (totalPages - 1)) + 1
      ));

      setCurrentPage(calculatedPage);
    } catch (error) {
      console.error('Error calculating page from scroll:', error);
      if (calculatePageFromCursorRef.current) {
        calculatePageFromCursorRef.current();
      }
    }
  }, [totalPages]);

  // Calculate page based on cursor position
  const calculatePageFromCursor = useCallback(() => {
    if (!editor) return;

    try {
      const { from } = editor.state.selection;
      const totalSize = editor.state.doc.content.size;

      if (totalSize === 0) {
        setCurrentPage(1);
        return;
      }

      // Calculate percentage through document
      const percentage = from / totalSize;

      // Calculate page based on position
      const calculatedPage = Math.max(1, Math.min(totalPages, Math.ceil(percentage * totalPages)));

      setCurrentPage(calculatedPage);
    } catch (error) {
      console.error('Error calculating page from cursor:', error);
      setCurrentPage(1);
    }
  }, [editor, totalPages]);

  // Store the function in ref to avoid dependency issues
  useEffect(() => {
    calculatePageFromScrollRef.current = calculatePageFromScroll;
    calculatePageFromCursorRef.current = calculatePageFromCursor;
  }, [calculatePageFromScroll, calculatePageFromCursor]);

  // Track scroll events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (calculatePageFromScrollRef.current) {
          calculatePageFromScrollRef.current();
        }
      }, 50);
    };

    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Calculate initial page position
    setTimeout(() => {
      if (calculatePageFromScrollRef.current) {
        calculatePageFromScrollRef.current();
      }
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return {
    currentPage,
    setCurrentPage,
    calculatePageFromCursor,
    calculatePageFromScroll
  };
};