import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Comment as CommentIcon,
  Reply,
  Check,
  Delete,
  Edit,
  MoreVert,
  Close,
  AddComment
} from '@mui/icons-material';
import { Comment } from '../../lib/tiptap-comments';

interface CommentsPanelProps {
  editor: any;
  comments: Comment[];
  currentUser: {
    id: string;
    name: string;
  };
  onAddComment: (comment: Omit<Comment, 'id'>) => void;
  onUpdateComment: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onReplyToComment: (commentId: string, reply: Omit<Comment, 'id'>) => void;
  open: boolean;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  editor,
  comments,
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onReplyToComment,
  open,
  onClose
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showReplyField, setShowReplyField] = useState<{ [key: string]: boolean }>({});
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null);

  // Listen for comment clicks in the editor
  useEffect(() => {
    const handleCommentClick = (event: any) => {
      const { comment } = event.detail;
      setHighlightedComment(comment.id);
      // Scroll to comment in panel
      const commentElement = document.getElementById(`comment-${comment.id}`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    document.addEventListener('comment-clicked', handleCommentClick);
    return () => {
      document.removeEventListener('comment-clicked', handleCommentClick);
    };
  }, []);

  const handleAddComment = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!newCommentText.trim() || from === to) {
      alert('Please select text and enter a comment');
      return;
    }

    onAddComment({
      content: newCommentText,
      author: currentUser.name,
      authorId: currentUser.id,
      timestamp: new Date(),
      resolved: false,
      selection: { from, to }
    });

    setNewCommentText('');
  };

  const handleReply = (commentId: string) => {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim()) return;

    onReplyToComment(commentId, {
      content: replyText,
      author: currentUser.name,
      authorId: currentUser.id,
      timestamp: new Date(),
      resolved: false
    });

    setReplyTexts({ ...replyTexts, [commentId]: '' });
    setShowReplyField({ ...showReplyField, [commentId]: false });
  };

  const handleResolve = (comment: Comment) => {
    onUpdateComment({
      ...comment,
      resolved: !comment.resolved
    });
  };

  const handleEdit = (comment: Comment) => {
    if (editingComment === comment.id) {
      onUpdateComment({
        ...comment,
        content: editText
      });
      setEditingComment(null);
      setEditText('');
    } else {
      setEditingComment(comment.id);
      setEditText(comment.content);
    }
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDeleteComment(commentId);
      editor.commands.removeComment(commentId);
    }
    setAnchorEl(null);
  };

  const goToComment = (comment: Comment) => {
    if (comment.selection) {
      editor.chain().focus().setTextSelection(comment.selection).run();
      setHighlightedComment(comment.id);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 400 }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Comments
          <Badge badgeContent={activeComments.length} color="primary" sx={{ ml: 2 }}>
            <CommentIcon />
          </Badge>
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Add new comment section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Add Comment
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Select text and add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddComment />}
          onClick={handleAddComment}
          disabled={!newCommentText.trim()}
        >
          Add Comment
        </Button>
      </Box>

      {/* Comments list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {activeComments.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Comments ({activeComments.length})
            </Typography>
            <List>
              {activeComments.map((comment) => (
                <Paper
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: highlightedComment === comment.id ? 'action.hover' : 'background.paper',
                    cursor: 'pointer'
                  }}
                  onClick={() => goToComment(comment)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                      {comment.author.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {comment.author}
                        </Typography>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(comment.timestamp)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnchorEl(e.currentTarget);
                              setSelectedComment(comment.id);
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {editingComment === comment.id ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Box sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(comment);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingComment(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {comment.content}
                        </Typography>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          {comment.replies.map((reply, idx) => (
                            <Box key={idx} sx={{ display: 'flex', mb: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                {reply.author.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="caption" fontWeight="bold">
                                  {reply.author}
                                </Typography>
                                <Typography variant="caption" sx={{ ml: 1 }}>
                                  {reply.content}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Reply field */}
                      {showReplyField[comment.id] && (
                        <Box sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Write a reply..."
                            value={replyTexts[comment.id] || ''}
                            onChange={(e) => setReplyTexts({
                              ...replyTexts,
                              [comment.id]: e.target.value
                            })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(comment.id);
                              }
                            }}
                          />
                        </Box>
                      )}

                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Reply />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReplyField({
                              ...showReplyField,
                              [comment.id]: !showReplyField[comment.id]
                            });
                          }}
                        >
                          Reply
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Check />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(comment);
                          }}
                        >
                          Resolve
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          </Box>
        )}

        {resolvedComments.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Resolved Comments ({resolvedComments.length})
            </Typography>
            <List>
              {resolvedComments.map((comment) => (
                <Paper
                  key={comment.id}
                  sx={{
                    mb: 1,
                    p: 1,
                    opacity: 0.7,
                    backgroundColor: 'action.disabledBackground'
                  }}
                >
                  <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                    {comment.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {comment.author} - Resolved
                  </Typography>
                </Paper>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          const comment = comments.find(c => c.id === selectedComment);
          if (comment && comment.authorId === currentUser.id) {
            handleEdit(comment);
          }
          setAnchorEl(null);
        }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedComment) {
            handleDelete(selectedComment);
          }
        }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Drawer>
  );
};

export default CommentsPanel;