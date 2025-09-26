import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Alert,
  IconButton,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  CheckCircleOutline,
  HighlightOff,
  BugReport as BugIcon
} from '@mui/icons-material';
import { PerformanceMetrics } from './types';
import { formatPerformanceTime } from './utils';

interface StatusIndicatorsProps {
  // Loading states
  syncing: boolean;
  saving: boolean;
  autoSave: boolean;
  mounted: boolean;

  // Progress
  processingProgress: number;

  // Time and performance
  lastSyncTime: string;
  performanceMetrics: PerformanceMetrics;

  // Error handling
  errorDetails: any[];
  showErrorDetails: boolean;
  onToggleErrorDetails: () => void;
}

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  syncing,
  saving,
  autoSave,
  mounted,
  processingProgress,
  lastSyncTime,
  performanceMetrics,
  errorDetails,
  showErrorDetails,
  onToggleErrorDetails
}) => {
  // Real-time status indicators
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

  // Performance metrics display
  const renderPerformanceMetrics = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Performance: Load {formatPerformanceTime(performanceMetrics.loadTime)} |
        Process {formatPerformanceTime(performanceMetrics.processTime)} |
        Save {formatPerformanceTime(performanceMetrics.saveTime)}
      </Typography>
    </Box>
  );

  // Error details display
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
    <Stack spacing={2}>
      {/* Real-time status indicators */}
      {renderRealtimeStatus()}

      {/* Progress bar */}
      {processingProgress > 0 && processingProgress < 100 && (
        <LinearProgress
          variant="determinate"
          value={processingProgress}
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
    </Stack>
  );
};