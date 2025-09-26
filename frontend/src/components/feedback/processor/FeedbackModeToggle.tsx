import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import {
  AutoAwesome as GenerateAIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon
} from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { FeedbackMode } from '@/types/feedback-processor';

interface FeedbackModeToggleProps {
  feedbackMode: FeedbackMode;
  onModeChange: (mode: FeedbackMode) => void;
  onGenerateAIFeedback: () => void;
  generatingAIFeedback: boolean;
  loading: boolean;
}

const FeedbackModeToggle: React.FC<FeedbackModeToggleProps> = ({
  feedbackMode,
  onModeChange,
  onGenerateAIFeedback,
  generatingAIFeedback,
  loading
}) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="subtitle1">Feedback Mode:</Typography>
      <ToggleButtonGroup
        value={feedbackMode}
        exclusive
        onChange={(_, newMode) => newMode && onModeChange(newMode)}
        size="small"
      >
        <ToggleButton value="manual">
          <ManualIcon sx={{ mr: 1 }} />
          Manual
        </ToggleButton>
        <ToggleButton value="ai">
          <GenerateAIIcon sx={{ mr: 1 }} />
          AI
        </ToggleButton>
        <ToggleButton value="hybrid">
          <HybridIcon sx={{ mr: 1 }} />
          Hybrid
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Generate AI Feedback Button */}
      {(feedbackMode === 'ai' || feedbackMode === 'hybrid') && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={generatingAIFeedback ? <CircularProgress size={16} /> : <GenerateAIIcon />}
          onClick={onGenerateAIFeedback}
          disabled={generatingAIFeedback || loading}
        >
          {generatingAIFeedback ? 'Generating...' : 'Generate AI Feedback'}
        </Button>
      )}
    </Box>
  );
};

export default FeedbackModeToggle;