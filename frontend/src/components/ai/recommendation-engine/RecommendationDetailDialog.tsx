import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  TrendingUp,
  PlayArrow,
  Speed,
  AutoFixHigh,
  Assignment,
  Schedule,
  Star,
  Group,
  Lightbulb
} from '@mui/icons-material';
import { Recommendation } from '@/types/recommendation-engine';

interface RecommendationDetailDialogProps {
  open: boolean;
  recommendation: Recommendation | null;
  onClose: () => void;
  onImplement: () => void;
}

const RecommendationDetailDialog: React.FC<RecommendationDetailDialogProps> = ({
  open,
  recommendation,
  onClose,
  onImplement
}) => {
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

  if (!recommendation) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getTypeIcon(recommendation.type)}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {recommendation.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="body1" paragraph>
            {recommendation.description}
          </Typography>

          <Typography variant="h6" gutterBottom>Rationale</Typography>
          <Typography variant="body2" paragraph>
            {recommendation.rationale}
          </Typography>

          <Typography variant="h6" gutterBottom>Implementation Steps</Typography>
          <List dense>
            {recommendation.steps.map((step, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6" gutterBottom>Risk Factors</Typography>
          <List dense>
            {recommendation.riskFactors.map((risk, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText primary={risk} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6" gutterBottom>Success Metrics</Typography>
          <List dense>
            {recommendation.successMetrics.map((metric, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <TrendingUp color="success" />
                </ListItemIcon>
                <ListItemText primary={metric} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={onImplement}
          startIcon={<PlayArrow />}
        >
          Implement
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecommendationDetailDialog;