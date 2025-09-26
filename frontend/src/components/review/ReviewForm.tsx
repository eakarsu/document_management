'use client';

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AutoAwesome as GenerateAIIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { CRMComment } from '../../types/review';

interface ReviewFormProps {
  selectedComment: CRMComment | null;
  currentComment: CRMComment;
  setCurrentComment: (comment: CRMComment) => void;
  handleAddComment: () => void;
  generatingAIFeedback: boolean;
  aiFeedbackCount: number;
  setAiFeedbackCount: (count: number) => void;
  generateAIFeedback: () => void;
  handleClearSelectedFeedback: () => void;
  handleClearAllFeedback: () => void;
  comments: CRMComment[];
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  selectedComment,
  currentComment,
  setCurrentComment,
  handleAddComment,
  generatingAIFeedback,
  aiFeedbackCount,
  setAiFeedbackCount,
  generateAIFeedback,
  handleClearSelectedFeedback,
  handleClearAllFeedback,
  comments
}) => {
  const [showAddForm, setShowAddForm] = useState(true);

  return (
    <Paper sx={{ p: 2, mb: 2, border: selectedComment ? 2 : 1, borderColor: selectedComment ? 'primary.main' : 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, color: selectedComment ? 'primary.main' : 'text.primary' }}>
          {selectedComment ? 'Selected Feedback Details' : 'Add CRM Comment'}
        </Typography>
        <IconButton onClick={() => setShowAddForm(!showAddForm)} size="small">
          {showAddForm ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      {showAddForm && (
        <Grid container spacing={2}>
          {/* Show selected feedback details if any */}
          {selectedComment && (
            <>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: 'blue.50', borderRadius: 1, border: 1, borderColor: 'blue.200', mb: 2 }}>
                  <Typography variant="caption" color="primary" fontWeight="bold">Current Selection:</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedComment.component} - {selectedComment.coordinatorComment}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}

          {/* Column 1: Component and POC */}
          <Grid item xs={12}>
            <Typography variant="caption" color="primary">
              COLUMN 1: Component & POC
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Component *"
              value={currentComment.component}
              onChange={(e) => setCurrentComment({ ...currentComment, component: e.target.value })}
              placeholder="AF/A1"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="POC Name"
              value={currentComment.pocName}
              onChange={(e) => setCurrentComment({ ...currentComment, pocName: e.target.value })}
              placeholder="Col Smith"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="POC Phone"
              value={currentComment.pocPhone}
              onChange={(e) => setCurrentComment({ ...currentComment, pocPhone: e.target.value })}
              placeholder="555-0100"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="POC Email"
              value={currentComment.pocEmail}
              onChange={(e) => setCurrentComment({ ...currentComment, pocEmail: e.target.value })}
              placeholder="smith@af.mil"
            />
          </Grid>

          {/* Column 2: Comment Type */}
          <Grid item xs={12}>
            <Typography variant="caption" color="primary">
              COLUMN 2: Comment Type
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Type *</InputLabel>
              <Select
                value={currentComment.commentType}
                onChange={(e) => setCurrentComment({ ...currentComment, commentType: e.target.value })}
                label="Type *"
              >
                <MenuItem value="C">🔴 Critical (Non-concur if not resolved)</MenuItem>
                <MenuItem value="M">🟠 Major (Significant issue)</MenuItem>
                <MenuItem value="S">🔵 Substantive (Important)</MenuItem>
                <MenuItem value="A">🟢 Administrative (Minor)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Columns 3-5: Location */}
          <Grid item xs={12}>
            <Typography variant="caption" color="primary">
              COLUMNS 3-5: Location in Document
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Page"
              value={currentComment.page}
              onChange={(e) => setCurrentComment({ ...currentComment, page: e.target.value })}
              placeholder="12"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Paragraph"
              value={currentComment.paragraphNumber}
              onChange={(e) => setCurrentComment({ ...currentComment, paragraphNumber: e.target.value })}
              placeholder="3.2.1"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Line"
              value={currentComment.lineNumber}
              onChange={(e) => setCurrentComment({ ...currentComment, lineNumber: e.target.value })}
              placeholder="15-18"
            />
          </Grid>

          {/* Column 6: Comments */}
          <Grid item xs={12}>
            <Typography variant="caption" color="primary">
              COLUMN 6: Comments & Justification
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Comment/Issue"
              value={currentComment.coordinatorComment}
              onChange={(e) => setCurrentComment({ ...currentComment, coordinatorComment: e.target.value })}
              placeholder="Describe the issue..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Change From"
              value={currentComment.changeFrom}
              onChange={(e) => setCurrentComment({ ...currentComment, changeFrom: e.target.value })}
              placeholder="Current text..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Change To"
              value={currentComment.changeTo}
              onChange={(e) => setCurrentComment({ ...currentComment, changeTo: e.target.value })}
              placeholder="Suggested text..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Justification"
              value={currentComment.coordinatorJustification}
              onChange={(e) => setCurrentComment({ ...currentComment, coordinatorJustification: e.target.value })}
              placeholder="Why this change is needed..."
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleAddComment}
            >
              Add to Comment Matrix
            </Button>
          </Grid>

          {/* AI Feedback Management Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                AI FEEDBACK GENERATOR
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Number of Feedback Items"
              value={aiFeedbackCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setAiFeedbackCount(Math.min(50, Math.max(1, value)));
              }}
              inputProps={{ min: 1, max: 50 }}
              helperText="Enter 1-50"
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={generatingAIFeedback ? <CircularProgress size={16} /> : <GenerateAIIcon />}
              onClick={generateAIFeedback}
              disabled={generatingAIFeedback}
              fullWidth
            >
              {generatingAIFeedback ? 'Generating AI Feedback...' : 'Generate AI Feedback'}
            </Button>
          </Grid>

          {/* Feedback Management Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearSelectedFeedback}
                disabled={!comments.some(c => c.selected)}
              >
                Delete Selected
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ClearIcon />}
                onClick={handleClearAllFeedback}
                disabled={comments.length === 0}
              >
                Clear All
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default ReviewForm;