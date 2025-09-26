import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Rating
} from '@mui/material';
import { ContentAnalysis } from '@/types/content-analyzer';

interface OverallScoreCardProps {
  analysis: ContentAnalysis;
}

const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ analysis }) => {
  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {analysis.overallScore}
              </Typography>
              <Typography variant="subtitle1">Overall Content Score</Typography>
              <Rating value={analysis.overallScore / 20} readOnly sx={{ mt: 1, color: 'yellow' }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>Content Summary</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {analysis.summary}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OverallScoreCard;