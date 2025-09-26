import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box
} from '@mui/material';
import { Spellcheck, CheckCircle } from '@mui/icons-material';
import { QualityIssue } from '@/types/content-analyzer';
import { getSeverityColor } from '../../../utils/content-analyzer';

interface QualityIssuesCardProps {
  qualityIssues: QualityIssue[];
}

const QualityIssuesCard: React.FC<QualityIssuesCardProps> = ({ qualityIssues }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Spellcheck sx={{ mr: 1 }} />
          Quality Issues ({qualityIssues.length})
        </Typography>

        <List dense>
          {qualityIssues.map((issue, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Chip
                  label={issue.type}
                  size="small"
                  color={getSeverityColor(issue.severity) as any}
                />
              </ListItemIcon>
              <ListItemText
                primary={issue.description}
                secondary={`Line ${issue.location.line}, Paragraph ${issue.location.paragraph}`}
              />
            </ListItem>
          ))}
        </List>

        {qualityIssues.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No quality issues detected!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QualityIssuesCard;