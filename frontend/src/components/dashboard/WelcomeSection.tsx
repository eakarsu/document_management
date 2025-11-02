'use client';

import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import { Psychology as AIIcon } from '@mui/icons-material';

export const WelcomeSection: React.FC = () => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to PubOne by MissionSynchAI
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Your enterprise document management system with AI-powered workflow automation is ready to use
      </Typography>

      {/* AI Features Highlight */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
        <AIIcon sx={{ mr: 2, color: 'primary.main', fontSize: 30 }} />
        <Box>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            🚀 NEW: AI Workflow Assistant Available!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access 8 powerful AI features including smart recommendations, real-time monitoring,
            decision support, and predictive analytics. Click the AI Features card or button to explore.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};