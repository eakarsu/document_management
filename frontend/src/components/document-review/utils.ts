export const getCommentTypeColor = (type: string) => {
  switch(type) {
    case 'C': return 'error';
    case 'M': return 'warning';
    case 'S': return 'info';
    case 'A': return 'success';
    default: return 'default';
  }
};

export const getCommentTypeLabel = (type: string) => {
  switch(type) {
    case 'C': return 'Critical';
    case 'M': return 'Major';
    case 'S': return 'Substantive';
    case 'A': return 'Administrative';
    default: return type;
  }
};

export const handleDocumentDownload = async (documentId: string, documentData: any) => {
  try {
    const { authTokenService } = await import('@/lib/authTokenService');
    const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/download`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentData?.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      alert('Failed to download document');
    }
  } catch (error) {
    console.error('Download error:', error);
    alert('Error downloading document');
  }
};