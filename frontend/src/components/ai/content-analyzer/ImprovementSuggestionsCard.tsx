import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { ExpandMore, Lightbulb, AutoFixHigh } from '@mui/icons-material';
import { ImprovementSuggestion } from '@/types/content-analyzer';

interface ImprovementSuggestionsCardProps {
  improvements: ImprovementSuggestion[];
}

const ImprovementSuggestionsCard: React.FC<ImprovementSuggestionsCardProps> = ({ improvements }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Lightbulb sx={{ mr: 1 }} />
          AI Improvement Suggestions
        </Typography>

        {improvements.map((suggestion, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {suggestion.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={suggestion.priority}
                    size="small"
                    color={
                      suggestion.priority === 'HIGH' ? 'error' :
                      suggestion.priority === 'MEDIUM' ? 'warning' : 'success'
                    }
                  />
                  <Chip label={suggestion.category} size="small" variant="outlined" />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {suggestion.description}
              </Typography>

              {suggestion.examples && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Examples:</Typography>
                  <List dense>
                    {suggestion.examples.map((example, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <AutoFixHigh color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={example} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Chip
                label={`${suggestion.impact} Impact`}
                size="small"
                color={
                  suggestion.impact === 'SIGNIFICANT' ? 'success' :
                  suggestion.impact === 'MODERATE' ? 'warning' : 'default'
                }
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

export default ImprovementSuggestionsCard;