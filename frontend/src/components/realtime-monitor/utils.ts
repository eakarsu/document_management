export const getHealthColor = (health: string) => {
  switch (health) {
    case 'HEALTHY': return 'success';
    case 'WARNING': return 'warning';
    case 'CRITICAL': return 'error';
    default: return 'default';
  }
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const getParticipantStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'IDLE': return 'warning';
    case 'OFFLINE': return 'error';
    default: return 'default';
  }
};

export const formatTimeAgo = (timestamp: Date): string => {
  const minutes = Math.round((Date.now() - timestamp.getTime()) / (1000 * 60));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const formatEstimatedCompletion = (date: Date): string => {
  return date.toLocaleDateString();
};

export const calculateCriticalAlertsCount = (alerts: any[]): number => {
  return alerts.filter(alert => alert.severity === 'CRITICAL').length;
};

export const calculateHighAlertsCount = (alerts: any[]): number => {
  return alerts.filter(alert => alert.severity === 'HIGH').length;
};