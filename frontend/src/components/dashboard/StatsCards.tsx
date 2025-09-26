'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import {
  Description as DocumentIcon,
  AccountCircle,
  Publish as PublishIcon,
  Psychology as AIIcon
} from '@mui/icons-material';
import { DashboardData } from '@/types/dashboard';

interface StatsCardsProps {
  dashboardData: DashboardData;
  onAIWorkflowClick: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  dashboardData,
  onAIWorkflowClick
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {dashboardData.totalDocuments}
            </Typography>
            <Typography color="text.secondary">
              Total Documents
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AccountCircle sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {dashboardData.totalUsers}
            </Typography>
            <Typography color="text.secondary">
              Total Users
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <PublishIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {dashboardData.recentDocuments.filter(doc => doc.status === 'PUBLISHED').length}
            </Typography>
            <Typography color="text.secondary">
              Published Documents
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            }
          }}
          onClick={onAIWorkflowClick}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <AIIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" component="div">
              8
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
              AI Features
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Click to explore
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};