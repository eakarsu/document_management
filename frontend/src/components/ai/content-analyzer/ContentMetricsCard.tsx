import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Divider
} from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { ContentMetrics } from '@/types/content-analyzer';
import { getScoreColor } from '../../../utils/content-analyzer';

interface ContentMetricsCardProps {
  metrics: ContentMetrics;
}

const ContentMetricsCard: React.FC<ContentMetricsCardProps> = ({ metrics }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ mr: 1 }} />
          Content Metrics
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h4" color="primary.main">{metrics.wordCount.toLocaleString()}</Typography>
              <Typography variant="caption">Words</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h4" color="primary.main">{metrics.readingTime}</Typography>
              <Typography variant="caption">Min Read</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h4" color="primary.main">{metrics.sentenceCount}</Typography>
              <Typography variant="caption">Sentences</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h4" color="primary.main">{metrics.paragraphCount}</Typography>
              <Typography variant="caption">Paragraphs</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Complexity Score</Typography>
          <LinearProgress
            variant="determinate"
            value={metrics.complexityScore}
            color={getScoreColor(metrics.complexityScore) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary">
            {metrics.complexityScore}/100
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContentMetricsCard;