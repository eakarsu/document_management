import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { ConflictGroup, DocumentPosition } from '@/types/feedback-processor';

interface ConflictsTabProps {
  conflicts: ConflictGroup[];
  showPositionDetails: boolean;
  onResolveConflict: (conflict: ConflictGroup, chosenFeedbackId?: string, customText?: string) => void;
}

const ConflictsTab: React.FC<ConflictsTabProps> = ({
  conflicts,
  showPositionDetails,
  onResolveConflict
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

  if (conflicts.length === 0) {
    return (
      <Alert severity="success">
        No conflicts detected. All feedback can be applied automatically.
      </Alert>
    );
  }

  return (
    <List>
      {conflicts.map(conflict => (
        <Card key={conflict.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conflict at: {renderPositionDetails(conflict.location)}
            </Typography>

            <Typography variant="body2" gutterBottom>
              <strong>Original text:</strong> {conflict.originalText}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Multiple suggestions:
            </Typography>

            <List dense>
              {conflict.items.map(item => (
                <ListItem key={item.id}>
                  <Box>
                    <ListItemText
                      primary={item.suggestedText}
                      secondary={`${item.reviewer} • ${item.severity}`}
                    />
                    <Box sx={{ mt: 1 }}>
                      <Chip label={item.reviewer} size="small" sx={{ mr: 1 }} />
                      <Chip label={item.severity} size="small" />
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onResolveConflict(conflict, item.id)}
                    >
                      Use This
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {conflict.resolution && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Resolved: {conflict.resolution.resolvedAt}
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </List>
  );
};

export default ConflictsTab;