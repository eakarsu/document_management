import React from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import {
  CheckCircleOutline,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { FeedbackChange, DocumentPosition } from '@/types/feedback-processor';

interface AppliedChangesTabProps {
  appliedChanges: FeedbackChange[];
  showPositionDetails: boolean;
}

const AppliedChangesTab: React.FC<AppliedChangesTabProps> = ({
  appliedChanges,
  showPositionDetails
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

  if (appliedChanges.length === 0) {
    return (
      <Alert severity="info">No changes applied yet</Alert>
    );
  }

  return (
    <List>
      {appliedChanges.map(change => (
        <ListItem key={change.id}>
          <ListItemIcon>
            <CheckCircleOutline color="success" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                {change.location && renderPositionDetails(change.location)}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  "{change.originalText}" → "{change.actualAppliedText}"
                </Typography>
              </Box>
            }
            secondary={`Applied at ${change.appliedAt}`}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default AppliedChangesTab;