import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  AutoFixHigh,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import { OptimizationSuggestion } from '@/types/workflow-optimizer';

interface OptimizationSuggestionsCardProps {
  suggestions: OptimizationSuggestion[];
  selectedSuggestions: Set<string>;
  onToggleSuggestion: (suggestionId: string) => void;
}

export const OptimizationSuggestionsCard: React.FC<OptimizationSuggestionsCardProps> = ({
  suggestions,
  selectedSuggestions,
  onToggleSuggestion
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return <CheckCircle color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      case 'HIGH': return <Error color="error" />;
      default: return <Info />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoFixHigh sx={{ mr: 1 }} />
          Optimization Suggestions
        </Typography>

        {(suggestions || []).map((suggestion) => (
          <Accordion key={suggestion.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSuggestion(suggestion.id);
                    }}
                    color={selectedSuggestions.has(suggestion.id) ? 'primary' : 'default'}
                  >
                    <CheckCircle />
                  </IconButton>
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    {suggestion.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={suggestion.priority}
                    size="small"
                    color={getPriorityColor(suggestion.priority) as any}
                  />
                  <Tooltip title={`Complexity: ${suggestion.complexity}`}>
                    {getComplexityIcon(suggestion.complexity)}
                  </Tooltip>
                  <Chip
                    label={`${suggestion.impact.timeReduction}% faster`}
                    size="small"
                    color="success"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" paragraph>
                    {suggestion.description}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>Benefits:</Typography>
                  <List dense>
                    {(suggestion.benefits || []).map((benefit, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>Impact Metrics:</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption">Time Reduction</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={suggestion.impact.timeReduction}
                      color="success"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption">Efficiency Gain: +{suggestion.impact.efficiencyGain}%</Typography>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>Implementation:</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Est. time: {suggestion.estimatedImplementationTime}h
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

export default OptimizationSuggestionsCard;