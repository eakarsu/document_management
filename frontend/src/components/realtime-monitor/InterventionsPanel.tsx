import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress
} from '@mui/material';
import { PlayArrow, Done } from '@mui/icons-material';
import { InterventionSuggestion } from './types';

interface InterventionsPanelProps {
  interventions: InterventionSuggestion[];
  onImplementIntervention: (intervention: InterventionSuggestion) => void;
  loading: boolean;
}

export const InterventionsPanel: React.FC<InterventionsPanelProps> = ({
  interventions,
  onImplementIntervention,
  loading
}) => {
  return (
    <Grid container spacing={2}>
      {interventions.map((intervention) => (
        <Grid item xs={12} md={6} key={intervention.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{intervention.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {intervention.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Chip
                    label={intervention.urgency}
                    size="small"
                    color={intervention.urgency === 'HIGH' ? 'error' : 'warning'}
                  />
                  <Typography variant="caption" align="center">
                    {intervention.confidence}% confidence
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Expected Outcome:</strong> {intervention.expectedOutcome}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Implementation Steps:</Typography>
              <List dense>
                {intervention.implementation.steps.map((step, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Typography variant="caption" sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}>
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Est. time: {intervention.implementation.estimatedTime} minutes
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={() => onImplementIntervention(intervention)}
                  disabled={loading}
                >
                  Implement
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {interventions.length === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Done sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Interventions Needed
            </Typography>
            <Typography color="text.secondary">
              All workflows are performing optimally
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};