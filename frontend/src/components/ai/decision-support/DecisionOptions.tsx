import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
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
import {
  Compare,
  EmojiObjects,
  ExpandMore,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import { DecisionAnalysis, DecisionOption } from '@/types/decision-support';

interface DecisionOptionsProps {
  analysis: DecisionAnalysis;
  selectedOption: string | null;
  onOptionSelect: (optionId: string) => void;
  calculateWeightedScore: (option: DecisionOption) => number;
}

const DecisionOptions: React.FC<DecisionOptionsProps> = ({
  analysis,
  selectedOption,
  onOptionSelect,
  calculateWeightedScore
}) => {
  const sortedOptions = [...analysis.options].sort((a, b) =>
    calculateWeightedScore(b) - calculateWeightedScore(a)
  );

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'success';
      case 'REQUIRES_REVIEW': return 'warning';
      case 'NON_COMPLIANT': return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Compare sx={{ mr: 1 }} />
          Decision Options
        </Typography>

        {/* AI Recommendation */}
        {analysis.recommendation && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            icon={<EmojiObjects />}
          >
            <Typography variant="subtitle2" gutterBottom>AI Recommendation</Typography>
            <Typography variant="body2">
              {analysis.recommendation.reasoning}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`${analysis.recommendation.confidence}% confidence`}
                size="small"
                color="info"
              />
            </Box>
          </Alert>
        )}

        {sortedOptions.map((option) => (
          <Card
            key={option.id}
            variant="outlined"
            sx={{
              mb: 2,
              border: selectedOption === option.id ? 2 : 1,
              borderColor: selectedOption === option.id ? 'primary.main' : 'divider',
              cursor: 'pointer'
            }}
            onClick={() => onOptionSelect(option.id)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    {option.title}
                    {analysis.recommendation.optionId === option.id && (
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
                    color={option.implementation.complexity === 'LOW' ? 'success' : 'warning'}
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
        ))}
      </CardContent>
    </Card>
  );
};

export default DecisionOptions;