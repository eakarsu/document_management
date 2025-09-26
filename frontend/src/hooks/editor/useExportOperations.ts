import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { DocumentDetails, AirForceHeader, ExportFormat } from '@/types/editor';

interface UseExportOperationsProps {
  editor: Editor | null;
  documentData: DocumentDetails | null;
  airForceHeader: AirForceHeader;
}

export const useExportOperations = ({
  editor,
  documentData,
  airForceHeader
}: UseExportOperationsProps) => {

  const handleExport = useCallback(async (exportFormat: ExportFormat) => {
    if (!editor || !documentData) return;

    const content = editor.getHTML();
    const title = documentData.title || 'document';

    switch (exportFormat) {
      case 'html':
        // Export as HTML with Air Force header if present
        let htmlContent = content;
        if (airForceHeader.hasHeader && airForceHeader.headerHtml) {
          htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${airForceHeader.documentStyles || ''}
</head>
<body>
  ${airForceHeader.headerHtml}
  <div style="margin-top: 20px;">
    ${content}
  </div>
</body>
</html>`;
        } else {
          htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  ${content}
</body>
</html>`;
        }
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const htmlLink = document.createElement('a');
        htmlLink.href = htmlUrl;
        htmlLink.download = `${title}.html`;
        htmlLink.click();
        URL.revokeObjectURL(htmlUrl);
        break;

      case 'txt':
        // Convert HTML to plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const txtBlob = new Blob([textContent], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);
        const txtLink = document.createElement('a');
        txtLink.href = txtUrl;
        txtLink.download = `${title}.txt`;
        txtLink.click();
        URL.revokeObjectURL(txtUrl);
        break;

      case 'pdf':
        // Generate PDF using export-pdf endpoint
        try {
          const fullHtmlContent = createFullHtmlDocument(content, title, airForceHeader);

          const response = await fetch('/api/export-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: fullHtmlContent,
              title: title
            })
          });

          if (response.ok) {
            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            const pdfLink = document.createElement('a');
            pdfLink.href = pdfUrl;
            pdfLink.download = `${title}.pdf`;
            pdfLink.click();
            URL.revokeObjectURL(pdfUrl);
          } else {
            alert('Failed to generate PDF. Please try again.');
          }
        } catch (error) {
          console.error('PDF export error:', error);
          alert('Failed to generate PDF. Please try again.');
        }
        break;

      case 'docx':
        // Generate DOCX using export-docx endpoint
        try {
          const fullDocxContent = createFullHtmlDocument(content, title, airForceHeader);

          const response = await fetch('/api/export-docx', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: fullDocxContent,
              title: title
            })
          });

          if (response.ok) {
            const blob = await response.blob();
            const docUrl = URL.createObjectURL(blob);
            const docLink = document.createElement('a');
            docLink.href = docUrl;
            docLink.download = `${title}.docx`;
            docLink.click();
            URL.revokeObjectURL(docUrl);
          } else {
            alert('Failed to generate Word document. Please try again.');
          }
        } catch (error) {
          console.error('DOCX export error:', error);
          alert('Failed to generate Word document. Please try again.');
        }
        break;
    }
  }, [editor, documentData, airForceHeader]);

  const createFullHtmlDocument = (content: string, title: string, airForceHeader: AirForceHeader): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; }
    h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    h2 { font-size: 12pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
    h3 { font-size: 12pt; font-weight: bold; font-style: italic; }
    p { margin-bottom: 12pt; text-align: justify; }
    .air-force-document-header { text-align: center; margin-bottom: 30px; }
    .by-order, .secretary { font-weight: bold; font-size: 14pt; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    table td, table th { border: 1px solid black; padding: 6pt; }
    table th { background-color: #f0f0f0; font-weight: bold; }
  </style>
  ${airForceHeader.documentStyles || ''}
</head>
<body>
  ${airForceHeader.hasHeader && airForceHeader.headerHtml ? airForceHeader.headerHtml : ''}
  <div style="margin-top: 20px;">
    ${content}
  </div>
</body>
</html>`;
  };

  return {
    handleExport
  };
};