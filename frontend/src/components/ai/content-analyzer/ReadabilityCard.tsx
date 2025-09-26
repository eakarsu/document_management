import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { ReadabilityScores } from '@/types/content-analyzer';
import { getReadabilityDescription } from '../../../utils/content-analyzer';

interface ReadabilityCardProps {
  readability: ReadabilityScores;
}

const ReadabilityCard: React.FC<ReadabilityCardProps> = ({ readability }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Readability Analysis
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Chip
            label={getReadabilityDescription(readability.readabilityCategory)}
            color={readability.fleschReadingEase > 60 ? 'success' : 'warning'}
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Grade Level: {readability.averageGradeLevel}
          </Typography>
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption">Flesch Reading Ease</Typography>
            <Typography variant="body2">{readability.fleschReadingEase}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Flesch-Kincaid</Typography>
            <Typography variant="body2">{readability.fleschKincaid}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Coleman-Liau</Typography>
            <Typography variant="body2">{readability.colemanLiau}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">ARI</Typography>
            <Typography variant="body2">{readability.automatedReadabilityIndex}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ReadabilityCard;