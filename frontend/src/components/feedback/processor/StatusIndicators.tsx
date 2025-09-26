import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  CheckCircleOutline,
  HighlightOff,
  BugReport as BugIcon
} from '@mui/icons-material';
import { PerformanceMetrics, ErrorDetail } from '@/types/feedback-processor';

interface StatusIndicatorsProps {
  syncing: boolean;
  saving: boolean;
  autoSave: boolean;
  lastSyncTime: string;
  mounted: boolean;
  processingProgress: number;
  errorDetails: ErrorDetail[];
  showErrorDetails: boolean;
  performanceMetrics: PerformanceMetrics;
  onToggleErrorDetails: () => void;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  syncing,
  saving,
  autoSave,
  lastSyncTime,
  mounted,
  processingProgress,
  errorDetails,
  showErrorDetails,
  performanceMetrics,
  onToggleErrorDetails
}) => {
  // Render Real-time Status
  const renderRealtimeStatus = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {syncing && (
        <Chip
          icon={<SyncIcon />}
          label="Syncing..."
          size="small"
          color="primary"
          sx={{ animation: 'pulse 1s infinite' }}
        />
      )}
      {saving && (
        <Chip
          icon={<CloudSyncIcon />}
          label="Saving..."
          size="small"
          color="success"
        />
      )}
      {autoSave && (
        <Chip
          icon={<CheckCircleOutline />}
          label="Auto-save ON"
          size="small"
          color="success"
          variant="outlined"
        />
      )}
      {mounted && (
        <Typography variant="caption" color="text.secondary">
          Last sync: {lastSyncTime || 'Not synced'}
        </Typography>
      )}
    </Box>
  );

  // Render Performance Metrics
  const renderPerformanceMetrics = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Performance: Load {performanceMetrics.loadTime.toFixed(0)}ms |
        Process {performanceMetrics.processTime.toFixed(0)}ms |
        Save {performanceMetrics.saveTime.toFixed(0)}ms
      </Typography>
    </Box>
  );

  // Render Error Details
  const renderErrorDetails = () => (
    <Collapse in={showErrorDetails}>
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Error Log:</Typography>
        {errorDetails.slice(-5).map((error, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="caption">
              {mounted && error.timestamp ? error.timestamp.toLocaleTimeString() : 'Error'}: {error.error}
            </Typography>
          </Box>
        ))}
      </Alert>
    </Collapse>
  );

  return (
    <Box>
      {/* Real-time status indicators */}
      {renderRealtimeStatus()}

      {/* Progress bar */}
      {processingProgress > 0 && processingProgress < 100 && (
        <LinearProgress
          variant="determinate"
          value={processingProgress}
          sx={{ mt: 2 }}
        />
      )}

      {/* Error handling */}
      {errorDetails.length > 0 && (
        <Alert
          severity="error"
          action={
            <IconButton
              size="small"
              onClick={onToggleErrorDetails}
            >
              {showErrorDetails ? <HighlightOff /> : <BugIcon />}
            </IconButton>
          }
        >
          {errorDetails.length} errors occurred
        </Alert>
      )}
      {renderErrorDetails()}

      {/* Performance metrics */}
      {renderPerformanceMetrics()}
    </Box>
  );
};

export default StatusIndicators;