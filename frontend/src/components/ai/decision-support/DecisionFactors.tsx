import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Balance,
  ExpandMore,
  Info,
  Lightbulb
} from '@mui/icons-material';
import { DecisionFactor } from '@/types/decision-support';

interface DecisionFactorsProps {
  factors: DecisionFactor[];
}

const DecisionFactors: React.FC<DecisionFactorsProps> = ({ factors }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RISK': return 'error';
      case 'COMPLIANCE': return 'warning';
      case 'QUALITY': return 'success';
      case 'BUSINESS': return 'primary';
      case 'TECHNICAL': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Balance sx={{ mr: 1 }} />
          Decision Factors
        </Typography>

        {factors.map((factor) => (
          <Accordion key={factor.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">{factor.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Chip
                      label={factor.category}
                      size="small"
                      color={getCategoryColor(factor.category) as any}
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={factor.importance}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color={factor.impact > 0 ? 'success.main' : 'error.main'}>
                    {factor.impact > 0 ? '+' : ''}{factor.impact}
                  </Typography>
                  <Typography variant="caption">
                    {factor.confidence}% confidence
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {factor.description}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Evidence:</Typography>
              <List dense>
                {factor.evidence.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Info fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
              <List dense>
                {factor.recommendations.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Lightbulb fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

export default DecisionFactors;