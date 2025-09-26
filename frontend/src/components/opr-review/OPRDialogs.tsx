import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { CRMComment, ChangeHistoryEntry } from '../../types/opr-review';

interface OPRDialogsProps {
  // Merge Dialog
  showMergeDialog: boolean;
  mergeResult: string;
  mergeResultContent: string;
  onCloseMergeDialog: () => void;
  onAcceptMerge: () => void;
  onRejectMerge: () => void;

  // Critical Blocked Dialog
  showCriticalBlockedDialog: boolean;
  phoneCallMade: boolean;
  setPhoneCallMade: (made: boolean) => void;
  downgradedType: string;
  setDowngradedType: (type: string) => void;
  phoneCallNotes: string;
  setPhoneCallNotes: (notes: string) => void;
  onCloseCriticalDialog: () => void;
  onProceedWithCritical: () => void;

  // Version History Dialog
  showVersionHistory: boolean;
  changeHistory: ChangeHistoryEntry[];
  onCloseVersionHistory: () => void;

  // Preview Dialog
  showPreview: boolean;
  editableContent: string;
  onClosePreview: () => void;

  // Comment Dialog
  showCommentDialog: boolean;
  currentComment: CRMComment;
  newComment: string;
  setNewComment: (comment: string) => void;
  onCloseCommentDialog: () => void;
  onSaveComment: () => void;

  // Detailed History Dialog
  showDetailedHistory: boolean;
  onCloseDetailedHistory: () => void;
}

const OPRDialogs: React.FC<OPRDialogsProps> = ({
  showMergeDialog,
  mergeResult,
  mergeResultContent,
  onCloseMergeDialog,
  onAcceptMerge,
  onRejectMerge,
  showCriticalBlockedDialog,
  phoneCallMade,
  setPhoneCallMade,
  downgradedType,
  setDowngradedType,
  phoneCallNotes,
  setPhoneCallNotes,
  onCloseCriticalDialog,
  onProceedWithCritical,
  showVersionHistory,
  changeHistory,
  onCloseVersionHistory,
  showPreview,
  editableContent,
  onClosePreview,
  showCommentDialog,
  currentComment,
  newComment,
  setNewComment,
  onCloseCommentDialog,
  onSaveComment,
  showDetailedHistory,
  onCloseDetailedHistory
}) => {
  return (
    <>
      {/* Merge Result Dialog */}
      <Dialog open={showMergeDialog} onClose={onCloseMergeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Merge Result</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            AI has processed the feedback and generated the following merge result:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="body2" component="div">
              <div dangerouslySetInnerHTML={{ __html: mergeResult || mergeResultContent }} />
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={onRejectMerge} color="error">
            Reject
          </Button>
          <Button onClick={onAcceptMerge} variant="contained" color="primary">
            Accept & Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Critical Blocked Dialog */}
      <Dialog open={showCriticalBlockedDialog} onClose={onCloseCriticalDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Critical Comment Detected
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography gutterBottom>
            This feedback item contains a <strong>Critical (C)</strong> comment that requires special handling.
            According to regulations, critical comments must be resolved through direct coordination.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Required Actions:</Typography>

          <Box sx={{ mb: 3 }}>
            <label>
              <input
                type="checkbox"
                checked={phoneCallMade}
                onChange={(e) => setPhoneCallMade(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Phone call made to POC for coordination
            </label>
          </Box>

          <TextField
            fullWidth
            label="Phone Call Notes"
            multiline
            rows={3}
            value={phoneCallNotes}
            onChange={(e) => setPhoneCallNotes(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Document the coordination discussion..."
          />

          <TextField
            select
            fullWidth
            label="If downgraded, new comment type"
            value={downgradedType}
            onChange={(e) => setDowngradedType(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="M">Major (M)</option>
            <option value="S">Substantive (S)</option>
            <option value="A">Administrative (A)</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCriticalDialog}>
            Cancel
          </Button>
          <Button
            onClick={onProceedWithCritical}
            variant="contained"
            disabled={!phoneCallMade || !phoneCallNotes.trim()}
          >
            Proceed with Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onClose={onCloseVersionHistory} maxWidth="md" fullWidth>
        <DialogTitle>Document Version History</DialogTitle>
        <DialogContent>
          <List>
            {changeHistory.map((entry, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`Version ${index + 1}: ${entry.description || 'Document change'}`}
                  secondary={`${entry.timestamp?.toLocaleString()} - Type: ${entry.type}`}
                />
              </ListItem>
            ))}
            {changeHistory.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No version history available
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseVersionHistory}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={onClosePreview} maxWidth="lg" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <div dangerouslySetInnerHTML={{ __html: editableContent }} />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onClose={onCloseCommentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Comment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Feedback: {currentComment?.coordinatorComment}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add your comment here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCommentDialog}>Cancel</Button>
          <Button onClick={onSaveComment} variant="contained" disabled={!newComment.trim()}>
            Save Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detailed History Dialog */}
      <Dialog open={showDetailedHistory} onClose={onCloseDetailedHistory} maxWidth="lg" fullWidth>
        <DialogTitle>Detailed Change History</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" gutterBottom>
            Track all changes made to the document during this review session.
          </Typography>
          {changeHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No detailed history available
              </Typography>
            </Box>
          ) : (
            <List>
              {changeHistory.map((entry, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          Version {index + 1}
                        </Typography>
                        <Chip
                          size="small"
                          label={entry.type}
                          color={entry.type === 'feedback' ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {entry.timestamp?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          {entry.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDetailedHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OPRDialogs;