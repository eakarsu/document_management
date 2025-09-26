import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { TeamPerformanceInsights } from '@/types/team-performance';
import { usePerformanceUtils } from '../../../hooks/team-performance/usePerformanceUtils';

interface PredictiveAnalyticsPanelProps {
  insights: TeamPerformanceInsights;
}

const PredictiveAnalyticsPanel: React.FC<PredictiveAnalyticsPanelProps> = ({ insights }) => {
  const { getBurnoutRiskColor } = usePerformanceUtils();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} />
          Predictive Analytics
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Burnout Risk</Typography>
          {insights.predictiveAnalytics.burnoutRisk.map((risk, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 100 }}>
                {insights.teamMembers.find(m => m.userId === risk.userId)?.name}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={risk.riskLevel}
                color={getBurnoutRiskColor(risk.riskLevel)}
                sx={{ flexGrow: 1, mx: 1 }}
              />
              <Typography variant="caption">{risk.riskLevel}%</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>Promotion Candidates</Typography>
          {insights.predictiveAnalytics.promotionCandidates.map((userId, index) => {
            const member = insights.teamMembers.find(m => m.userId === userId);
            return (
              <Chip
                key={index}
                label={member?.name}
                color="success"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalyticsPanel;