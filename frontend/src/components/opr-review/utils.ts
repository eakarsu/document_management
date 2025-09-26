export const getCommentTypeColor = (type: string) => {
  switch (type) {
    case 'C': return 'error';
    case 'M': return 'warning';
    case 'S': return 'info';
    case 'A': return 'success';
    default: return 'default';
  }
};

export const getCommentTypeLabel = (type: string) => {
  switch (type) {
    case 'C': return 'Critical';
    case 'M': return 'Major';
    case 'S': return 'Substantive';
    case 'A': return 'Administrative';
    default: return type;
  }
};

export const getStatusColor = (status?: string) => {
  switch (status) {
    case 'accepted': return 'success';
    case 'rejected': return 'error';
    case 'merged': return 'info';
    default: return 'default';
  }
};