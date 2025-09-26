'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography
} from '@mui/material';
import { DashboardData } from '@/types/dashboard';

interface SystemStatusProps {
  dashboardData: DashboardData;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ dashboardData }) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          🚀 System Status: Backend API running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} |
          Frontend running at http://localhost:{process.env.PORT || '3000'} |
          Database: {dashboardData.totalUsers} users, {dashboardData.totalDocuments} documents
        </Typography>
      </Paper>
    </Box>
  );
};