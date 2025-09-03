'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  TextareaAutosize,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as CriticalIcon,
  Error as MajorIcon,
  Info as SubstantiveIcon,
  CheckCircle as AdminIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';

// Comment types according to Air Force CRM guidelines
const COMMENT_TYPES = {
  C: {
    label: 'Critical',
    description: 'Violations of law/policy, safety risks, waste/abuse, unreasonable burden',
    color: 'error',
    icon: CriticalIcon
  },
  M: {
    label: 'Major',
    description: 'Factually incorrect, misunderstood policies, unfunded requirements',
    color: 'warning',
    icon: MajorIcon
  },
  S: {
    label: 'Substantive',
    description: 'Unnecessary, misleading, confusing, or inconsistent content',
    color: 'info',
    icon: SubstantiveIcon
  },
  A: {
    label: 'Administrative',
    description: 'Non-substantive (dates, symbols, format, grammar)',
    color: 'success',
    icon: AdminIcon
  }
};

const RESOLUTION_TYPES = {
  A: { label: 'Accepted', color: 'success' },
  R: { label: 'Rejected', color: 'error' },
  P: { label: 'Partially Accepted', color: 'warning' }
};

interface CRMComment {
  id: string;
  // Column 1: Component and POC
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  // Column 2: Comment Type
  commentType: 'C' | 'M' | 'S' | 'A';
  // Column 3: Page
  page: string;
  // Column 4: Paragraph Number
  paragraphNumber: string;
  // Column 5: Line Number
  lineNumber: string;
  // Column 6: Comments and Justification
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  originatorJustification?: string;
  // Column 7: Resolution
  resolution?: 'A' | 'R' | 'P';
}

interface CRMFeedbackFormProps {
  documentId: string;
  userRole: 'coordinator' | 'originator';
  onSubmit?: (comments: CRMComment[]) => void;
}

const CRMFeedbackForm: React.FC<CRMFeedbackFormProps> = ({
  documentId,
  userRole,
  onSubmit
}) => {
  const [comments, setComments] = useState<CRMComment[]>([]);
  const [editingComment, setEditingComment] = useState<CRMComment | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CRMComment>>({
    component: '',
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    commentType: 'A',
    page: '',
    paragraphNumber: '',
    lineNumber: '',
    coordinatorComment: '',
    changeFrom: '',
    changeTo: '',
    coordinatorJustification: '',
    originatorJustification: '',
    resolution: undefined
  });

  const handleAddComment = () => {
    setEditingComment(null);
    setFormData({
      component: '',
      pocName: '',
      pocPhone: '',
      pocEmail: '',
      commentType: 'A',
      page: '',
      paragraphNumber: '',
      lineNumber: '',
      coordinatorComment: '',
      changeFrom: '',
      changeTo: '',
      coordinatorJustification: '',
      originatorJustification: '',
      resolution: undefined
    });
    setShowDialog(true);
  };

  const handleEditComment = (comment: CRMComment) => {
    setEditingComment(comment);
    setFormData(comment);
    setShowDialog(true);
  };

  const handleSaveComment = () => {
    if (editingComment) {
      setComments(comments.map(c => 
        c.id === editingComment.id ? { ...formData, id: editingComment.id } as CRMComment : c
      ));
    } else {
      const newComment: CRMComment = {
        ...formData,
        id: Date.now().toString()
      } as CRMComment;
      setComments([...comments, newComment]);
    }
    setShowDialog(false);
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(comments);
    }
  };

  const getCriticalCount = () => comments.filter(c => c.commentType === 'C').length;
  const getMajorCount = () => comments.filter(c => c.commentType === 'M').length;

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Comment Resolution Matrix (CRM) - {userRole === 'coordinator' ? 'Coordinator' : 'Originator'} View
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {userRole === 'coordinator' 
            ? 'As a coordinator, provide comments for the originator. Complete columns 1-6 and initial justification.'
            : 'As an originator, review and resolve all comments. Complete resolution (A/R/P) and originator justification.'}
        </Alert>

        {/* Summary Stats */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Chip 
            icon={<CriticalIcon />} 
            label={`Critical: ${getCriticalCount()}`} 
            color="error" 
            variant={getCriticalCount() > 0 ? 'filled' : 'outlined'}
          />
          <Chip 
            icon={<MajorIcon />} 
            label={`Major: ${getMajorCount()}`} 
            color="warning" 
            variant={getMajorCount() > 0 ? 'filled' : 'outlined'}
          />
          <Chip 
            label={`Total Comments: ${comments.length}`} 
            color="primary" 
          />
          {getCriticalCount() > 0 && (
            <Alert severity="error" sx={{ py: 0, px: 1 }}>
              Auto Non-Concur (Critical comments present)
            </Alert>
          )}
        </Box>

        {/* CRM Input Form - Always visible for coordinators */}
        {userRole === 'coordinator' && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Add New CRM Comment
            </Typography>
            <Grid container spacing={2}>
              {/* Column 1: Component and POC */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Component (Col 1)"
                  placeholder="AF/A1 Personnel"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="POC Name"
                  placeholder="Col Smith"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="POC Phone"
                  placeholder="555-0100"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="POC Email"
                  placeholder="smith@af.mil"
                  size="small"
                />
              </Grid>

              {/* Column 2: Comment Type */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type (Col 2)</InputLabel>
                  <Select label="Type (Col 2)" defaultValue="S">
                    <MenuItem value="C">Critical</MenuItem>
                    <MenuItem value="M">Major</MenuItem>
                    <MenuItem value="S">Substantive</MenuItem>
                    <MenuItem value="A">Administrative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Columns 3-5: Location */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Page (Col 3)"
                  placeholder="12"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Para (Col 4)"
                  placeholder="3.2.1"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Line (Col 5)"
                  placeholder="15-18"
                  size="small"
                />
              </Grid>

              {/* Column 6: Comments */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Comment (Col 6)"
                  placeholder="Describe the issue"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Change From"
                  placeholder="Current text"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Change To"
                  placeholder="Suggested text"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Justification"
                  placeholder="Explain why this change is necessary"
                  size="small"
                />
              </Grid>

              {/* Column 7: Resolution (for Originators) */}
              {userRole === 'originator' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resolution (Col 7)</InputLabel>
                    <Select label="Resolution (Col 7)" defaultValue="">
                      <MenuItem value="A">Accepted</MenuItem>
                      <MenuItem value="R">Rejected</MenuItem>
                      <MenuItem value="P">Partially Accepted</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddComment}
                >
                  Add to Matrix
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Comments Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Component/POC</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Comment</TableCell>
                {userRole === 'originator' && <TableCell align="center">Resolution</TableCell>}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map((comment) => {
                const CommentIcon = COMMENT_TYPES[comment.commentType].icon;
                return (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {comment.component}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {comment.pocName}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {comment.pocEmail}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<CommentIcon fontSize="small" />}
                        label={comment.commentType}
                        color={COMMENT_TYPES[comment.commentType].color as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        Page: {comment.page}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Para: {comment.paragraphNumber}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Line: {comment.lineNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {comment.coordinatorComment}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" gutterBottom>
                            <strong>Change from:</strong> {comment.changeFrom}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>To:</strong> {comment.changeTo}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Coordinator Justification:</strong> {comment.coordinatorJustification}
                          </Typography>
                          {comment.originatorJustification && (
                            <Typography variant="body2">
                              <strong>Originator Justification:</strong> {comment.originatorJustification}
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                    {userRole === 'originator' && (
                      <TableCell align="center">
                        {comment.resolution ? (
                          <Chip
                            label={RESOLUTION_TYPES[comment.resolution].label}
                            color={RESOLUTION_TYPES[comment.resolution].color as any}
                            size="small"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Pending
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditComment(comment)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {userRole === 'coordinator' && (
                        <IconButton size="small" onClick={() => handleDeleteComment(comment.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {comments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={userRole === 'originator' ? 6 : 5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No comments added yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" startIcon={<SaveIcon />}>
            Save Draft
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={comments.length === 0}
          >
            Submit {userRole === 'coordinator' ? 'Comments' : 'Resolutions'}
          </Button>
        </Box>
      </Paper>

      {/* Comment Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingComment ? 'Edit Comment' : 'Add New Comment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Column 1: Component and POC */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Column 1: Component and POC Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Component"
                value={formData.component}
                onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="POC Name"
                value={formData.pocName}
                onChange={(e) => setFormData({ ...formData, pocName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="POC Phone"
                value={formData.pocPhone}
                onChange={(e) => setFormData({ ...formData, pocPhone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="POC Email"
                type="email"
                value={formData.pocEmail}
                onChange={(e) => setFormData({ ...formData, pocEmail: e.target.value })}
                required
              />
            </Grid>

            {/* Column 2: Comment Type */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Column 2: Comment Type
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Comment Type</InputLabel>
                <Select
                  value={formData.commentType}
                  onChange={(e) => setFormData({ ...formData, commentType: e.target.value as any })}
                  label="Comment Type"
                >
                  {Object.entries(COMMENT_TYPES).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <type.icon fontSize="small" />
                        <Box>
                          <Typography variant="body2">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Columns 3-5: Location */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Columns 3-5: Document Location
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Page"
                value={formData.page}
                onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Paragraph Number"
                value={formData.paragraphNumber}
                onChange={(e) => setFormData({ ...formData, paragraphNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Line Number"
                value={formData.lineNumber}
                onChange={(e) => setFormData({ ...formData, lineNumber: e.target.value })}
              />
            </Grid>

            {/* Column 6: Comments and Justification */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Column 6: Comments and Justification
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Coordinator Comment"
                value={formData.coordinatorComment}
                onChange={(e) => setFormData({ ...formData, coordinatorComment: e.target.value })}
                required
                disabled={userRole === 'originator'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Change the following"
                value={formData.changeFrom}
                onChange={(e) => setFormData({ ...formData, changeFrom: e.target.value })}
                disabled={userRole === 'originator'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="To Read"
                value={formData.changeTo}
                onChange={(e) => setFormData({ ...formData, changeTo: e.target.value })}
                disabled={userRole === 'originator'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Coordinator Justification"
                value={formData.coordinatorJustification}
                onChange={(e) => setFormData({ ...formData, coordinatorJustification: e.target.value })}
                required
                disabled={userRole === 'originator'}
              />
            </Grid>

            {/* Column 7: Resolution (Originator Only) */}
            {userRole === 'originator' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Column 7: Resolution
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Resolution</InputLabel>
                    <Select
                      value={formData.resolution || ''}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value as any })}
                      label="Resolution"
                    >
                      {Object.entries(RESOLUTION_TYPES).map(([key, type]) => (
                        <MenuItem key={key} value={key}>
                          <Chip
                            label={type.label}
                            color={type.color as any}
                            size="small"
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Originator Resolution and Justification"
                    value={formData.originatorJustification}
                    onChange={(e) => setFormData({ ...formData, originatorJustification: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveComment} variant="contained">
            Save Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CRMFeedbackForm;