import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import { Send, Delete, Person } from '@mui/icons-material';
import { DocumentComment } from '@/hooks/useDocumentData';

interface DocumentCommentsProps {
  comments: DocumentComment[];
  canComment?: boolean;
  currentUserId?: string;
  onAddComment?: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const DocumentComments: React.FC<DocumentCommentsProps> = ({
  comments,
  canComment,
  currentUserId,
  onAddComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Comments
        {comments.length > 0 && (
          <Chip
            label={comments.length}
            size="small"
            sx={{ ml: 1 }}
            color="primary"
          />
        )}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Comment Input */}
      {canComment && onAddComment && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmitComment();
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              endIcon={<Send />}
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              Post Comment
            </Button>
          </Box>
        </Box>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper' }}>
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  currentUserId === comment.user.id && onDeleteComment && (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => onDeleteComment(comment.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {comment.user.firstName && comment.user.lastName
                      ? getInitials(comment.user.firstName, comment.user.lastName)
                      : <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {`${comment.user.firstName} ${comment.user.lastName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(comment.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                    >
                      {comment.content}
                    </Typography>
                  }
                />
              </ListItem>
              {index < comments.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No comments yet. {canComment ? 'Be the first to comment!' : ''}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};