import { useState } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment } from '../../types/opr-review';

export const useExport = (documentId: string) => {
  const [exporting, setExporting] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  const getCommentTypeLabel = (type: string) => {
    const types = {
      'C': 'Critical',
      'S': 'Substantive',
      'A': 'Administrative',
      'N': 'NAIC',
      'E': 'Editorial',
      'T': 'Technical'
    };
    return types[type] || type;
  };

  const handleExport = async (
    format: string,
    includeTrackChanges: boolean = false,
    editableContent: string,
    appliedChanges: Map<string, { original: string, changed: string, feedbackId: string }>,
    feedback: CRMComment[],
    documentData: any
  ) => {
    setExporting(true);
    setExportAnchorEl(null);

    try {
      let contentToExport = editableContent;

      // If including track changes, add markup to show changes
      if (includeTrackChanges) {
        // Apply track changes markup
        for (const [id, change] of Array.from(appliedChanges.entries())) {
          const originalMarkup = `<del style="color: red; text-decoration: line-through;">${change.original}</del>`;
          const changedMarkup = `<ins style="color: green; text-decoration: underline;">${change.changed}</ins>`;
          contentToExport = contentToExport.replace(
            change.changed,
            `${originalMarkup}${changedMarkup}`
          );
        }

        // Add pending feedback as comments
        const pendingFeedback = feedback.filter(f => f.status === 'pending');
        if (pendingFeedback.length > 0) {
          let commentsSection = '<div style="page-break-before: always; margin-top: 40px;"><h2>Pending Feedback Comments</h2><ul>';
          pendingFeedback.forEach((item, index) => {
            commentsSection += `<li style="margin-bottom: 10px;">
              <strong>[${index + 1}] ${getCommentTypeLabel(item.commentType)} - Page ${item.page}, Para ${item.paragraphNumber}</strong><br/>
              <em>From: ${item.pocName || 'Anonymous'}</em><br/>
              Comment: ${item.coordinatorComment}<br/>
              ${item.changeFrom ? `<span style="color: red;">Original: ${item.changeFrom}</span><br/>` : ''}
              ${item.changeTo ? `<span style="color: green;">Suggested: ${item.changeTo}</span>` : ''}
            </li>`;
          });
          commentsSection += '</ul></div>';
          contentToExport += commentsSection;
        }
      }

      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/export`, {
        method: 'POST',
        body: JSON.stringify({
          format,
          includeNumbering: false,
          content: contentToExport,
          includeTrackChanges
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Set filename based on format and track changes
        const trackChangesSuffix = includeTrackChanges ? '_with_changes' : '';
        const filename = `${documentData?.title?.replace(/[^a-z0-9]/gi, '_') || 'document'}${trackChangesSuffix}.${format}`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        window.alert('Failed to export document');
      }
    } catch (error) {
      console.error('Export error:', error);
      window.alert('Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportAnchorEl,
    setExportAnchorEl,
    handleExport
  };
};