export const calculateWeightedScore = (option: any) => {
  // Simplified weighted scoring based on criteria
  const baseScore = option.overallScore;
  const confidenceAdjustment = (option.confidence - 50) / 10; // -5 to +5
  return Math.max(0, Math.min(100, baseScore + confidenceAdjustment));
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'RISK': return 'error';
    case 'COMPLIANCE': return 'warning';
    case 'QUALITY': return 'success';
    case 'BUSINESS': return 'primary';
    case 'TECHNICAL': return 'info';
    default: return 'default';
  }
};

export const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const getComplianceColor = (status: string) => {
  switch (status) {
    case 'COMPLIANT': return 'success';
    case 'REQUIRES_REVIEW': return 'warning';
    case 'NON_COMPLIANT': return 'error';
    default: return 'default';
  }
};

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'default';
  }
};