import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip
} from '@mui/material';
import { DecisionAnalysis } from '@/types/decision-support';

interface DecisionContextProps {
  analysis: DecisionAnalysis;
}

const DecisionContext: React.FC<DecisionContextProps> = ({ analysis }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Decision Context</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Document Type</Typography>
            <Typography variant="body2">{analysis.context.documentType}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Urgency</Typography>
            <Chip
              label={analysis.context.urgency}
              size="small"
              color={analysis.context.urgency === 'CRITICAL' ? 'error' : 'warning'}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Business Impact</Typography>
            <Typography variant="body2">{analysis.context.businessImpact}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Time to Decision</Typography>
            <Typography variant="body2" color="warning.main">
              {analysis.predictiveInsights.timeToDecision} hours
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DecisionContext;