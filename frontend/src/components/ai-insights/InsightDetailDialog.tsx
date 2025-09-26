import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip
} from '@mui/material';
import {
  AutoFixHigh,
  ExpandMore,
  Info,
  Lightbulb
} from '@mui/icons-material';
import { Insight } from './types';
import { getTypeIcon } from './utils';

interface InsightDetailDialogProps {
  open: boolean;
  insight: Insight | null;
  loading: boolean;
  onClose: () => void;
  onExecuteAction: (insight: Insight) => void;
}

const InsightDetailDialog: React.FC<InsightDetailDialogProps> = ({
  open,
  insight,
  loading,
  onClose,
  onExecuteAction
}) => {
  if (!insight) return null;

  const TypeIcon = getTypeIcon(insight.type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TypeIcon />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {insight.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="body1" paragraph>
            {insight.description}
          </Typography>

          <Typography variant="h6" gutterBottom>Key Findings</Typography>
          <List dense>
            {insight.findings.map((finding, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Info color="primary" />
                </ListItemIcon>
                <ListItemText primary={finding} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6" gutterBottom>Recommendations</Typography>
          <List dense>
            {insight.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Lightbulb color="primary" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>

          {insight.suggestedActions.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Suggested Actions</Typography>
              {insight.suggestedActions.map((action, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">{action.action}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Effort</Typography>
                        <Chip label={action.effort} size="small" />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Timeline</Typography>
                        <Typography variant="body2">{action.timeline}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Expected Outcome</Typography>
                        <Typography variant="body2">{action.expectedOutcome}</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {insight.actionable && (
          <Button
            variant="contained"
            onClick={() => {
              onExecuteAction(insight);
              onClose();
            }}
            startIcon={<AutoFixHigh />}
            disabled={loading}
          >
            {loading ? 'Implementing...' : 'Take Action'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InsightDetailDialog;