import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Typography,
  Fade,
  CircularProgress,
  Alert
} from '@mui/material';
import { FeedbackItem, ConflictGroup, FeedbackChange } from '@/types/feedback-processor';
import PendingFeedbackTab from './PendingFeedbackTab';
import ConflictsTab from './ConflictsTab';
import AppliedChangesTab from './AppliedChangesTab';

interface FeedbackTabsProps {
  tabValue: number;
  onTabChange: (newValue: number) => void;
  loading: boolean;
  feedbackItems: FeedbackItem[];
  conflicts: ConflictGroup[];
  appliedChanges: FeedbackChange[];
  showPositionDetails: boolean;
  onToggleSelect: (id: string) => void;
  onApplyFeedback: (items: FeedbackItem[]) => void;
  onResolveConflict: (conflict: ConflictGroup, chosenFeedbackId?: string, customText?: string) => void;
}

const FeedbackTabs: React.FC<FeedbackTabsProps> = ({
  tabValue,
  onTabChange,
  loading,
  feedbackItems,
  conflicts,
  appliedChanges,
  showPositionDetails,
  onToggleSelect,
  onApplyFeedback,
  onResolveConflict
}) => {
  const pendingCount = feedbackItems.filter(i => i.status === 'pending').length;
  const conflictsCount = conflicts.length;
  const appliedCount = appliedChanges.length;

  return (
    <>
      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => onTabChange(v)} sx={{ mb: 2 }}>
        <Tab
          label={
            <Badge badgeContent={pendingCount} color="primary">
              <Typography>Pending Feedback</Typography>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={conflictsCount} color="error">
              <Typography>Conflicts</Typography>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={appliedCount} color="success">
              <Typography>Applied Changes</Typography>
            </Badge>
          }
        />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ minHeight: 400 }}>
        {/* Pending Feedback Tab */}
        {tabValue === 0 && (
          <Fade in={tabValue === 0}>
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : feedbackItems.length === 0 ? (
                <Alert severity="info">No feedback items available</Alert>
              ) : (
                <PendingFeedbackTab
                  feedbackItems={feedbackItems}
                  showPositionDetails={showPositionDetails}
                  onToggleSelect={onToggleSelect}
                  onApplyFeedback={onApplyFeedback}
                />
              )}
            </Box>
          </Fade>
        )}

        {/* Conflicts Tab */}
        {tabValue === 1 && (
          <Fade in={tabValue === 1}>
            <Box>
              <ConflictsTab
                conflicts={conflicts}
                showPositionDetails={showPositionDetails}
                onResolveConflict={onResolveConflict}
              />
            </Box>
          </Fade>
        )}

        {/* Applied Changes Tab */}
        {tabValue === 2 && (
          <Fade in={tabValue === 2}>
            <Box>
              <AppliedChangesTab
                appliedChanges={appliedChanges}
                showPositionDetails={showPositionDetails}
              />
            </Box>
          </Fade>
        )}
      </Box>
    </>
  );
};

export default FeedbackTabs;