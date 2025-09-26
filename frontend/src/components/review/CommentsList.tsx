'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  IconButton,
  Chip,
  Alert,
  Checkbox
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AutoAwesome as GenerateAIIcon
} from '@mui/icons-material';
import { CRMComment, CommentType } from '../../types/review';

interface CommentsListProps {
  comments: CRMComment[];
  isAIGeneratedDoc: boolean;
  handleSelectComment: (comment: CRMComment) => void;
  handleDeleteComment: (id: string) => void;
  handleToggleSelect: (id: string) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  isAIGeneratedDoc,
  handleSelectComment,
  handleDeleteComment,
  handleToggleSelect
}) => {
  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'C': return 'error';
      case 'M': return 'warning';
      case 'S': return 'info';
      case 'A': return 'success';
      default: return 'default';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'C': return 'Critical';
      case 'M': return 'Major';
      case 'S': return 'Substantive';
      case 'A': return 'Administrative';
      default: return type;
    }
  };

  return (
    <Paper sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Comment Matrix ({comments.length})
        </Typography>
        {isAIGeneratedDoc && comments.length > 0 && (
          <Chip
            label="AI-Generated Feedback"
            color="primary"
            variant="outlined"
            icon={<GenerateAIIcon />}
            size="small"
          />
        )}
      </Box>

      {comments.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No comments added yet. Add your first comment above.
        </Box>
      ) : (
        <List sx={{ pt: 0 }}>
          {comments.map((comment, index) => (
            <ListItem
              key={comment.id}
              sx={{
                mb: 1,
                border: 1,
                borderColor: comment.commentType === 'C' ? 'error.main' : 'divider',
                borderRadius: 1,
                display: 'block',
                p: 0,
                bgcolor: comment.commentType === 'C' ? 'error.50' : 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 2
                }
              }}
            >
              {/* Header - Always Visible */}
              <Box
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'grey.50'
                  }
                }}
                onClick={() => handleSelectComment(comment)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={comment.selected || false}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(comment.id!);
                    }}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    #{index + 1} - {comment.component}
                  </Typography>
                  <Chip
                    label={getCommentTypeLabel(comment.commentType)}
                    color={getCommentTypeColor(comment.commentType) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteComment(comment.id!);
                    }}
                    title="Delete Comment"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Summary Line - Always Visible */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, ml: 5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    📍 Page {comment.page || '-'}, Para {comment.paragraphNumber || '-'}, Line {comment.lineNumber || '-'}
                  </Typography>
                  {comment.coordinatorComment && (
                    <Typography
                      variant="body2"
                      sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      {comment.coordinatorComment}
                    </Typography>
                  )}
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {/* Critical Warning */}
      {comments.some(c => c.commentType === 'C') && (
        <Alert severity="error" sx={{ mt: 2 }}>
          ⚠️ Critical comments will result in NON-CONCUR if not resolved
        </Alert>
      )}
    </Paper>
  );
};

export default CommentsList;