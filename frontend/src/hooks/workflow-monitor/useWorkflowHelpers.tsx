import {
  Assignment,
  CheckCircle,
  Error,
  Person,
  PriorityHigh,
  Chat,
  Schedule,
  Info,
  HourglassEmpty,
  Warning,
  Flag,
  Notifications
} from '@mui/icons-material';

export const useWorkflowHelpers = () => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'success';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'SUBMITTED': return <Assignment />;
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Error color="error" />;
      case 'REASSIGNED': return <Person />;
      case 'ESCALATED': return <PriorityHigh color="warning" />;
      case 'COMMENT_ADDED': return <Chat />;
      case 'DEADLINE_UPDATED': return <Schedule />;
      default: return <Info />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'DELAY_RISK': return <HourglassEmpty />;
      case 'BOTTLENECK': return <Warning />;
      case 'CONFLICT': return <Error />;
      case 'DEADLINE_APPROACHING': return <Schedule />;
      case 'QUALITY_ISSUE': return <Flag />;
      case 'PARTICIPANT_UNAVAILABLE': return <Person />;
      default: return <Notifications />;
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'IDLE': return 'warning';
      case 'OFFLINE': return 'error';
      default: return 'default';
    }
  };

  return {
    getHealthColor,
    getSeverityColor,
    getActivityIcon,
    getAlertIcon,
    getParticipantStatusColor
  };
};