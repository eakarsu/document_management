import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress
} from '@mui/material';
import { Topic } from '@mui/icons-material';
import { ContentTopics } from '@/types/content-analyzer';

interface SentimentTopicsCardProps {
  topics: ContentTopics;
}

const SentimentTopicsCard: React.FC<SentimentTopicsCardProps> = ({ topics }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Topic sx={{ mr: 1 }} />
          Content Analysis
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Sentiment Analysis</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip
              label={topics.sentimentAnalysis.overall}
              color={
                topics.sentimentAnalysis.overall === 'POSITIVE' ? 'success' :
                topics.sentimentAnalysis.overall === 'NEGATIVE' ? 'error' : 'default'
              }
              sx={{ mr: 1 }}
            />
            <Typography variant="body2">
              {(topics.sentimentAnalysis.confidence * 100).toFixed(0)}% confidence
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom>Main Topics</Typography>
        {topics.mainTopics.map((topic, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{topic.topic}</Typography>
              <Typography variant="caption">{(topic.confidence * 100).toFixed(0)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={topic.confidence * 100}
              color="primary"
              sx={{ height: 4, borderRadius: 2, mb: 1 }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default SentimentTopicsCard;