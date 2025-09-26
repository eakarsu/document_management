import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Rating
} from '@mui/material';
import {
  Speed,
  AutoFixHigh,
  Assignment,
  Schedule,
  Star,
  Group,
  Lightbulb,
  PlayArrow
} from '@mui/icons-material';
import { Recommendation, PriorityColor, ComplexityColor } from '@/types/recommendation-engine';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onViewDetails: (recommendation: Recommendation) => void;
  onImplement: (recommendation: Recommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onViewDetails,
  onImplement
}) => {
  const getPriorityColor = (priority: string): PriorityColor => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: string): ComplexityColor => {
    switch (complexity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROCESS_OPTIMIZATION': return <Speed />;
      case 'WORKFLOW_AUTOMATION': return <AutoFixHigh />;
      case 'REVIEWER_ASSIGNMENT': return <Assignment />;
      case 'DEADLINE_MANAGEMENT': return <Schedule />;
      case 'QUALITY_IMPROVEMENT': return <Star />;
      case 'COLLABORATION_ENHANCEMENT': return <Group />;
      default: return <Lightbulb />;
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
              {getTypeIcon(recommendation.type)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                {recommendation.title}
                {recommendation.applicableToCurrentContext && (
                  <Chip label="Contextual" size="small" color="success" sx={{ ml: 1 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recommendation.description}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label={recommendation.priority}
              size="small"
              color={getPriorityColor(recommendation.priority)}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ mr: 0.5 }}>Confidence:</Typography>
              <Rating value={recommendation.confidence / 20} readOnly size="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {recommendation.confidence}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Efficiency Gain</Typography>
            <Typography variant="body2" color="success.main">
              +{recommendation.impact.efficiency}%
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Time Reduction</Typography>
            <Typography variant="body2" color="info.main">
              {recommendation.impact.timeReduction}h
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Implementation</Typography>
            <Chip
              label={recommendation.implementationComplexity}
              size="small"
              color={getComplexityColor(recommendation.implementationComplexity)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Success Rate</Typography>
            <Typography variant="body2">
              {recommendation.historicalSuccessRate}%
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {recommendation.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
          <Box>
            <Button
              size="small"
              onClick={() => onViewDetails(recommendation)}
              sx={{ mr: 1 }}
            >
              View Details
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={() => onImplement(recommendation)}
            >
              Implement
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;