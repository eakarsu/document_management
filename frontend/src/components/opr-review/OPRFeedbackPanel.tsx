import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
  Paper,
  Grid,
  Button,
  Stack,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Comment as CommentIcon,
  List as ListIcon,
  Merge as MergeIcon,
  Cancel,
  Visibility as ViewIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  Save as SaveIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { CRMComment, MergeMode } from '../../types/opr-review';

interface OPRFeedbackPanelProps {
  feedback: CRMComment[];
  selectedFeedback: CRMComment | null;
  selectAll: boolean;
  autoSave: boolean;
  showPositionDetails: boolean;
  savingDocument: boolean;
  mergeMode: MergeMode;
  onFeedbackClick: (feedback: CRMComment) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMergeFeedback: () => void;
  onClearSelection: () => void;
  onFindText: (text: string) => void;
  onSaveDocument: () => void;
  onShowHistory: () => void;
  onToggleAutoSave: (enabled: boolean) => void;
  onTogglePositionDetails: (show: boolean) => void;
}

const OPRFeedbackPanel: React.FC<OPRFeedbackPanelProps> = ({
  feedback,
  selectedFeedback,
  selectAll,
  autoSave,
  showPositionDetails,
  savingDocument,
  mergeMode,
  onFeedbackClick,
  onToggleSelect,
  onSelectAll,
  onMergeFeedback,
  onClearSelection,
  onFindText,
  onSaveDocument,
  onShowHistory,
  onToggleAutoSave,
  onTogglePositionDetails
}) => {
  const getCommentTypeColor = (type: string) => {
    switch(type) {
      case 'C': return 'error';
      case 'M': return 'warning';
      case 'S': return 'info';
      case 'A': return 'success';
      default: return 'default';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch(type) {
      case 'C': return 'Critical';
      case 'M': return 'Major';
      case 'S': return 'Substantive';
      case 'A': return 'Administrative';
      default: return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'merged': return 'info';
      default: return 'default';
    }
  };

  const selectedCount = feedback.filter(f => f.selected).length;

  return (
    <Box sx={{ width: '450px', overflow: 'auto', bgcolor: 'grey.50', p: 2 }}>
      {/* Additional Control Buttons */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={selectAll ? <DeselectAllIcon /> : <SelectAllIcon />}
              onClick={onSelectAll}
            >
              {selectAll ? 'Deselect' : 'Select'} All
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              onClick={onSaveDocument}
              disabled={savingDocument}
            >
              Save Changes
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={onShowHistory}
            >
              History
            </Button>
          </Grid>
        </Grid>

        {/* Settings Toggles */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSave}
                  onChange={(e) => onToggleAutoSave(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-save"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showPositionDetails}
                  onChange={(e) => onTogglePositionDetails(e.target.checked)}
                  size="small"
                />
              }
              label="Position Details"
            />
          </Stack>
        </Box>
      </Box>

      {/* Selected Feedback Details */}
      {selectedFeedback && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon />
            Selected Feedback Details
          </Typography>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">ID</Typography>
              <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.id || 'Not set'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">Type</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={getCommentTypeLabel(selectedFeedback.commentType)}
                  size="small"
                  color={getCommentTypeColor(selectedFeedback.commentType) as any}
                  sx={{ fontSize: '0.65rem' }}
                />
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">Component</Typography>
              <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.component || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={selectedFeedback.status || 'Pending'}
                  size="small"
                  variant="outlined"
                  color={getStatusColor(selectedFeedback.status) as any}
                  sx={{ fontSize: '0.65rem' }}
                />
              </Box>
            </Grid>

            {showPositionDetails && (
              <>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Page</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.page || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Paragraph</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.paragraphNumber || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Line</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.lineNumber || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">POC</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.pocName || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Phone</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.pocPhone || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Email</Typography>
                  <Typography variant="body2" fontSize="0.8rem">{selectedFeedback.pocEmail || 'Not specified'}</Typography>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">Comment</Typography>
              <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2" fontSize="0.8rem">
                  {selectedFeedback.coordinatorComment || 'No comment provided'}
                </Typography>
              </Paper>
            </Grid>

            {selectedFeedback.changeFrom && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Original Text</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'error.50', borderColor: 'error.main' }}>
                  <Typography variant="body2" fontSize="0.8rem">
                    {selectedFeedback.changeFrom}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedFeedback.changeTo && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Suggested Change</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'success.50', borderColor: 'success.main' }}>
                  <Typography variant="body2" fontSize="0.8rem">
                    {selectedFeedback.changeTo}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedFeedback.coordinatorJustification && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Coordinator Justification</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontSize="0.8rem">
                    {selectedFeedback.coordinatorJustification}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedFeedback.originatorJustification && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Originator Justification</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'info.50', borderColor: 'info.main' }}>
                  <Typography variant="body2" fontSize="0.8rem">
                    {selectedFeedback.originatorJustification}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedFeedback.resolution && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Resolution</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'warning.50', borderColor: 'warning.main' }}>
                  <Typography variant="body2" fontSize="0.8rem">
                    {selectedFeedback.resolution}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Action Buttons for Selected Feedback */}
            <Grid item xs={12}>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onMergeFeedback}
                  disabled={!selectedFeedback.changeTo}
                  startIcon={<MergeIcon />}
                  color={mergeMode === 'ai' ? 'secondary' : mergeMode === 'hybrid' ? 'warning' : 'primary'}
                >
                  {mergeMode === 'manual' ? 'Apply' :
                   mergeMode === 'ai' ? 'AI Merge' :
                   'Hybrid'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onClearSelection}
                  startIcon={<Cancel />}
                >
                  Clear
                </Button>
                {selectedFeedback.changeFrom && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onFindText(selectedFeedback.changeFrom || '')}
                    startIcon={<ViewIcon />}
                  >
                    Find
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Feedback List */}
      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ListIcon />
        Feedback Items ({feedback.length})
      </Typography>
      <Box sx={{ maxHeight: '400px', overflow: 'auto', pr: 1 }}>
        <List dense sx={{ width: '100%' }}>
          {feedback.map((item, index) => (
            <ListItem
              key={item.id || index}
              selected={selectedFeedback?.id === item.id}
              sx={{
                mb: 0.5,
                border: 1,
                borderColor: item.status === 'merged'
                  ? 'grey.300'
                  : selectedFeedback?.id === item.id
                    ? 'primary.main'
                    : 'divider',
                borderRadius: 1,
                bgcolor: item.status === 'merged'
                  ? 'grey.100'
                  : selectedFeedback?.id === item.id
                    ? 'primary.50'
                    : 'background.paper',
                cursor: item.status === 'merged' ? 'not-allowed' : 'pointer',
                opacity: item.status === 'merged' ? 0.7 : 1,
                position: 'relative',
                '&:hover': {
                  bgcolor: item.status === 'merged'
                    ? 'grey.100'
                    : selectedFeedback?.id === item.id
                      ? 'primary.100'
                      : 'grey.100'
                },
                '&::after': item.status === 'merged' ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.05)',
                  pointerEvents: 'none',
                  borderRadius: 1
                } : {}
              }}
            >
              <Checkbox
                checked={item.selected || false}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(item.id || '');
                }}
                size="small"
                disabled={item.status === 'merged'}
                sx={{ mr: 1 }}
              />
              <ListItemText
                onClick={() => onFeedbackClick(item)}
                primary={
                  <Box sx={{ opacity: item.status === 'merged' ? 0.6 : 1 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        textDecoration: item.status === 'merged' ? 'line-through' : 'none',
                        color: item.status === 'merged' ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {item.coordinatorComment || 'No comment'}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getCommentTypeLabel(item.commentType)}
                        size="small"
                        color={getCommentTypeColor(item.commentType) as any}
                        sx={{ mr: 0.5, fontSize: '0.65rem' }}
                        disabled={item.status === 'merged'}
                      />
                      {item.status && (
                        <Chip
                          label={item.status}
                          size="small"
                          variant={item.status === 'merged' ? 'filled' : 'outlined'}
                          color={getStatusColor(item.status) as any}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {item.pocName || 'Anonymous'} • Page {item.page || '?'} • Para {item.paragraphNumber || '?'} • Line {item.lineNumber || '?'} • {item.component || 'General'}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          {feedback.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">No feedback items available</Typography>
              <Typography variant="caption">Use "Generate AI Feedback" to create suggestions</Typography>
            </Box>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default OPRFeedbackPanel;