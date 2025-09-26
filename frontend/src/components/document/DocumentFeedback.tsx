import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Button,
  Stack
} from '@mui/material';
import { Feedback, RateReview } from '@mui/icons-material';

interface FeedbackItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  stage?: string;
  type?: string;
}

interface DocumentFeedbackProps {
  feedback: FeedbackItem[];
  canViewFeedback?: boolean;
  onViewOPRReview?: () => void;
  onViewCRMFeedback?: () => void;
}

export const DocumentFeedback: React.FC<DocumentFeedbackProps> = ({
  feedback,
  canViewFeedback,
  onViewOPRReview,
  onViewCRMFeedback
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'just now' : `${minutes} minutes ago`;
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (days === 1) {
      return 'yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFeedbackTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'legal':
        return 'warning.main';
      case 'coordination':
        return 'info.main';
      case 'technical':
        return 'success.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Feedback sx={{ mr: 1, verticalAlign: 'middle' }} />
        Document Feedback
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {onViewOPRReview && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<RateReview />}
            onClick={onViewOPRReview}
          >
            OPR Review
          </Button>
        )}
        {onViewCRMFeedback && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Feedback />}
            onClick={onViewCRMFeedback}
          >
            CRM Feedback
          </Button>
        )}
      </Stack>

      {/* Feedback List */}
      {feedback.length > 0 ? (
        <List>
          {feedback.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {`${item.user.firstName} ${item.user.lastName}`}
                      </Typography>
                      {item.stage && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: getFeedbackTypeColor(item.type),
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}
                        >
                          {item.stage}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                    >
                      {item.content}
                    </Typography>
                  }
                />
              </ListItem>
              {index < feedback.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No feedback available for this document.
          </Typography>
          {canViewFeedback && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Feedback will appear here as reviewers provide input during the workflow process.
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};