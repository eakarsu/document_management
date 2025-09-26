export const getScoreColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const getReadabilityDescription = (category: string) => {
  switch (category) {
    case 'VERY_EASY': return 'Very Easy to Read';
    case 'EASY': return 'Easy to Read';
    case 'FAIRLY_EASY': return 'Fairly Easy to Read';
    case 'STANDARD': return 'Standard Difficulty';
    case 'FAIRLY_DIFFICULT': return 'Fairly Difficult';
    case 'DIFFICULT': return 'Difficult to Read';
    case 'VERY_DIFFICULT': return 'Very Difficult to Read';
    default: return 'Unknown';
  }
};