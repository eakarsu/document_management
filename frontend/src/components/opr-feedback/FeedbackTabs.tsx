import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Checkbox,
  Alert,
  Fade,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  LocationOn as LocationIcon,
  CheckCircleOutline
} from '@mui/icons-material';
import {
  FeedbackItem,
  ConflictGroup,
  FeedbackChange,
  DocumentPosition,
  FeedbackSeverity
} from './types';
import { getSeverityColor, getPositionText } from './utils';

interface FeedbackTabsProps {
  tabValue: number;
  loading: boolean;
  feedbackItems: FeedbackItem[];
  conflicts: ConflictGroup[];
  appliedChanges: FeedbackChange[];
  showPositionDetails: boolean;
  onTabChange: (value: number) => void;
  onToggleSelect: (id: string) => void;
  onApplyFeedback: (items: FeedbackItem[]) => void;
  onResolveConflict: (
    conflict: ConflictGroup,
    chosenFeedbackId?: string,
    customText?: string
  ) => void;
}

// Position Details Component
const PositionDetails: React.FC<{ location: DocumentPosition; show: boolean }> = ({
  location,
  show
}) => (
  <Fade in={show}>
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
  </Fade>
);

// Feedback by Severity Component
const FeedbackBySeverity: React.FC<{
  severity: FeedbackSeverity;
  items: FeedbackItem[];
  showPositionDetails: boolean;
  onToggleSelect: (id: string) => void;
  onApplyFeedback: (items: FeedbackItem[]) => void;
  onSeverityToggle: (items: FeedbackItem[]) => void;
}> = ({
  severity,
  items,
  showPositionDetails,
  onToggleSelect,
  onApplyFeedback,
  onSeverityToggle
}) => {
  if (items.length === 0) return null;

  const severityColor = getSeverityColor(severity);

  return (
    <Accordion key={severity}>
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Badge badgeContent={items.length} color={severityColor as any}>
            <Typography variant="subtitle1">{severity}</Typography>
          </Badge>
          <Checkbox
            size="small"
            checked={items.every(item => item.selected)}
            indeterminate={items.some(item => item.selected) && !items.every(item => item.selected)}
            onChange={() => onSeverityToggle(items)}
            onClick={(e) => e.stopPropagation()}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {items.map(item => (
            <ListItem key={item.id}>
              <ListItemIcon>
                <Checkbox
                  checked={item.selected || false}
                  onChange={() => onToggleSelect(item.id)}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <PositionDetails location={item.location} show={showPositionDetails} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Original:</strong> {item.originalText}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      <strong>Suggested:</strong> {item.suggestedText}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption">
                      {item.reviewer} • {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                    {item.status === 'pending' && (
                      <Chip label="pending" size="small" color="warning" />
                    )}
                    {item.severity === 'ADMINISTRATIVE' && (
                      <Chip label="Administrative" size="small" color="success" />
                    )}
                  </Box>
                }
              />
              {item.status === 'pending' && (
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => onApplyFeedback([item])}
                    sx={{ minWidth: 60 }}
                  >
                    Apply
                  </Button>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

// Pending Feedback Tab Panel
const PendingFeedbackPanel: React.FC<{
  loading: boolean;
  feedbackItems: FeedbackItem[];
  showPositionDetails: boolean;
  onToggleSelect: (id: string) => void;
  onApplyFeedback: (items: FeedbackItem[]) => void;
}> = ({
  loading,
  feedbackItems,
  showPositionDetails,
  onToggleSelect,
  onApplyFeedback
}) => {
  const handleSeverityToggle = (items: FeedbackItem[]) => {
    const allSelected = items.every(item => item.selected);
    items.forEach(item => {
      if (item.selected !== !allSelected) {
        onToggleSelect(item.id);
      }
    });
  };

  const renderFeedbackBySeverity = (severity: FeedbackSeverity) => {
    const items = feedbackItems.filter(item => item.severity === severity);

    return (
      <FeedbackBySeverity
        key={severity}
        severity={severity}
        items={items}
        showPositionDetails={showPositionDetails}
        onToggleSelect={onToggleSelect}
        onApplyFeedback={onApplyFeedback}
        onSeverityToggle={handleSeverityToggle}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (feedbackItems.length === 0) {
    return <Alert severity="info">No feedback items available</Alert>;
  }

  return (
    <>
      {renderFeedbackBySeverity('CRITICAL')}
      {renderFeedbackBySeverity('MAJOR')}
      {renderFeedbackBySeverity('SUBSTANTIVE')}
      {renderFeedbackBySeverity('ADMINISTRATIVE')}
    </>
  );
};

// Conflicts Tab Panel
const ConflictsPanel: React.FC<{
  conflicts: ConflictGroup[];
  showPositionDetails: boolean;
  onResolveConflict: (
    conflict: ConflictGroup,
    chosenFeedbackId?: string,
    customText?: string
  ) => void;
}> = ({
  conflicts,
  showPositionDetails,
  onResolveConflict
}) => {
  if (conflicts.length === 0) {
    return (
      <Alert severity="success">
        No conflicts detected. All feedback can be applied automatically.
      </Alert>
    );
  }

  return (
    <List>
      {conflicts.map(conflict => (
        <Card key={conflict.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conflict at: <PositionDetails location={conflict.location} show={showPositionDetails} />
            </Typography>

            <Typography variant="body2" gutterBottom>
              <strong>Original text:</strong> {conflict.originalText}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Multiple suggestions:
            </Typography>

            <List dense>
              {conflict.items.map(item => (
                <ListItem key={item.id}>
                  <Box>
                    <ListItemText
                      primary={item.suggestedText}
                      secondary={`${item.reviewer} • ${item.severity}`}
                    />
                    <Box sx={{ mt: 1 }}>
                      <Chip label={item.reviewer} size="small" sx={{ mr: 1 }} />
                      <Chip label={item.severity} size="small" />
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onResolveConflict(conflict, item.id)}
                    >
                      Use This
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {conflict.resolution && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Resolved: {conflict.resolution.resolvedAt}
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </List>
  );
};

// Applied Changes Tab Panel
const AppliedChangesPanel: React.FC<{
  appliedChanges: FeedbackChange[];
  showPositionDetails: boolean;
}> = ({
  appliedChanges,
  showPositionDetails
}) => {
  if (appliedChanges.length === 0) {
    return <Alert severity="info">No changes applied yet</Alert>;
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
                {change.location && (
                  <PositionDetails location={change.location} show={showPositionDetails} />
                )}
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

export const FeedbackTabs: React.FC<FeedbackTabsProps> = ({
  tabValue,
  loading,
  feedbackItems,
  conflicts,
  appliedChanges,
  showPositionDetails,
  onTabChange,
  onToggleSelect,
  onApplyFeedback,
  onResolveConflict
}) => {
  const pendingCount = feedbackItems.filter(i => i.status === 'pending').length;

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
            <Badge badgeContent={conflicts.length} color="error">
              <Typography>Conflicts</Typography>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={appliedChanges.length} color="success">
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
              <PendingFeedbackPanel
                loading={loading}
                feedbackItems={feedbackItems}
                showPositionDetails={showPositionDetails}
                onToggleSelect={onToggleSelect}
                onApplyFeedback={onApplyFeedback}
              />
            </Box>
          </Fade>
        )}

        {/* Conflicts Tab */}
        {tabValue === 1 && (
          <Fade in={tabValue === 1}>
            <Box>
              <ConflictsPanel
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
              <AppliedChangesPanel
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