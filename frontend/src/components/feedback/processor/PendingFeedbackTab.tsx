import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Checkbox,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { FeedbackItem, DocumentPosition } from '@/types/feedback-processor';

interface PendingFeedbackTabProps {
  feedbackItems: FeedbackItem[];
  showPositionDetails: boolean;
  onToggleSelect: (id: string) => void;
  onApplyFeedback: (items: FeedbackItem[]) => void;
}

const PendingFeedbackTab: React.FC<PendingFeedbackTabProps> = ({
  feedbackItems,
  showPositionDetails,
  onToggleSelect,
  onApplyFeedback
}) => {
  // Render Position Details
  const renderPositionDetails = (location: DocumentPosition) => (
    showPositionDetails && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LocationIcon fontSize="small" color="action" />
        <Chip
          label={`Page ${location.page}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`¶ ${location.paragraph}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Line ${location.line}`}
          size="small"
          variant="outlined"
        />
      </Box>
    )
  );

  // Render feedback by severity with enhancements
  const renderFeedbackBySeverity = (severity: string) => {
    const items = feedbackItems.filter(
      item => item.severity === severity
    );

    console.log(`🔍 Rendering ${severity} feedback:`, {
      severity,
      itemsFound: items.length,
      allSeverities: feedbackItems.map(i => i.severity),
      items: items
    });

    const severityColors = {
      CRITICAL: 'error',
      MAJOR: 'warning',
      SUBSTANTIVE: 'info',
      ADMINISTRATIVE: 'success'
    };

    return (
      <Accordion key={severity}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge badgeContent={items.length} color={severityColors[severity as keyof typeof severityColors] as any}>
              <Typography variant="subtitle1">{severity}</Typography>
            </Badge>
            <Checkbox
              size="small"
              checked={items.every(item => item.selected)}
              indeterminate={items.some(item => item.selected) && !items.every(item => item.selected)}
              onChange={() => {
                const allSelected = items.every(item => item.selected);
                items.forEach(item => {
                  if (item.selected === allSelected) {
                    onToggleSelect(item.id);
                  }
                });
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {items.map(item => (
              <ListItem key={item.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={item.selected || false}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      {renderPositionDetails(item.location)}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Original:</strong> {item.originalText}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        <strong>Suggested:</strong> {item.suggestedText}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption">
                        {item.reviewer} • {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                      {item.status === 'pending' && (
                        <Chip label="pending" size="small" color="warning" />
                      )}
                      {item.severity === 'ADMINISTRATIVE' && (
                        <Chip label="Administrative" size="small" color="success" />
                      )}
                    </Box>
                  }
                />
                {item.status === 'pending' && (
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => onApplyFeedback([item])}
                      sx={{ minWidth: 60 }}
                    >
                      Apply
                    </Button>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <>
      {renderFeedbackBySeverity('CRITICAL')}
      {renderFeedbackBySeverity('MAJOR')}
      {renderFeedbackBySeverity('SUBSTANTIVE')}
      {renderFeedbackBySeverity('ADMINISTRATIVE')}
    </>
  );
};

export default PendingFeedbackTab;