import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip
} from '@mui/material';
import { Lightbulb, PlayArrow } from '@mui/icons-material';
import { OptimizationSuggestion } from '@/types/workflow-optimizer';

interface QuickWinsCardProps {
  quickWins: OptimizationSuggestion[];
  onToggleSuggestion: (suggestionId: string) => void;
}

export const QuickWinsCard: React.FC<QuickWinsCardProps> = ({ quickWins, onToggleSuggestion }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Lightbulb sx={{ mr: 1 }} />
          Quick Wins
        </Typography>

        {(quickWins || []).map((suggestion) => (
          <Box key={suggestion.id} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">{suggestion.title}</Typography>
              <Chip
                label={`${suggestion.impact.timeReduction}% faster`}
                size="small"
                color="success"
                sx={{ ml: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {suggestion.description}
            </Typography>
            <Button
              size="small"
              startIcon={<PlayArrow />}
              onClick={() => onToggleSuggestion(suggestion.id)}
              sx={{ mt: 1 }}
            >
              Apply Quick Fix
            </Button>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickWinsCard;