import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { ExpandMore, ThumbUp, ThumbDown } from '@mui/icons-material';
import { DecisionOption } from './types';
import { calculateWeightedScore, getComplianceColor, getComplexityColor, getRiskColor } from './utils';

interface DecisionOptionCardProps {
  option: DecisionOption;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
}

export const DecisionOptionCard: React.FC<DecisionOptionCardProps> = ({
  option,
  isSelected,
  isRecommended,
  onSelect
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              {option.title}
              {isRecommended && (
                <Chip label="Recommended" size="small" color="success" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {option.description}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main">
              {calculateWeightedScore(option).toFixed(0)}
            </Typography>
            <Typography variant="caption">Overall Score</Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Confidence</Typography>
            <LinearProgress
              variant="determinate"
              value={option.confidence}
              color="primary"
              sx={{ mt: 0.5 }}
            />
            <Typography variant="caption">{option.confidence}%</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Complexity</Typography>
            <Chip
              label={option.implementation.complexity}
              size="small"
              color={getComplexityColor(option.implementation.complexity) as any}
            />
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Compliance</Typography>
            <Chip
              label={option.compliance.status}
              size="small"
              color={getComplianceColor(option.compliance.status) as any}
            />
          </Grid>
        </Grid>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">View Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="success.main">Pros</Typography>
                <List dense>
                  {option.pros.map((pro, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ThumbUp fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={pro} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="error.main">Cons</Typography>
                <List dense>
                  {option.cons.map((con, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ThumbDown fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary={con} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>Risks</Typography>
            {option.risks.map((risk, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={risk.level}
                    size="small"
                    color={getRiskColor(risk.level) as any}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {risk.type}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {risk.description}
                </Typography>
                <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                  Mitigation: {risk.mitigation}
                </Typography>
              </Box>
            ))}

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Implementation Steps</Typography>
            <List dense>
              {option.implementation.steps.map((step, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Typography variant="caption" sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {index + 1}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};