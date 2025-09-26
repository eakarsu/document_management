import React from 'react';
import { Tabs, Tab, Box, Badge } from '@mui/material';
import {
  Description,
  Comment,
  Feedback,
  AccountTree,
  History,
  Security,
  Task
} from '@mui/icons-material';

interface DocumentTabsProps {
  activeTab: number;
  onTabChange: (newValue: number) => void;
  feedbackCount?: number;
  commentCount?: number;
  hasWorkflow?: boolean;
  hasVersions?: boolean;
  hasTasks?: boolean;
  canViewVersions?: boolean;
  canViewWorkflow?: boolean;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  activeTab,
  onTabChange,
  feedbackCount = 0,
  commentCount = 0,
  hasWorkflow = false,
  hasVersions = false,
  hasTasks = false,
  canViewVersions = false,
  canViewWorkflow = true
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="document tabs"
      >
        <Tab
          label="Content"
          icon={<Description />}
          iconPosition="start"
        />

        <Tab
          label={
            <Badge badgeContent={commentCount} color="primary">
              Comments
            </Badge>
          }
          icon={<Comment />}
          iconPosition="start"
        />

        <Tab
          label={
            <Badge badgeContent={feedbackCount} color="secondary">
              Feedback
            </Badge>
          }
          icon={<Feedback />}
          iconPosition="start"
        />

        {canViewWorkflow && hasWorkflow && (
          <Tab
            label="Workflow"
            icon={<AccountTree />}
            iconPosition="start"
          />
        )}

        {canViewVersions && hasVersions && (
          <Tab
            label="Versions"
            icon={<History />}
            iconPosition="start"
          />
        )}

        {hasTasks && (
          <Tab
            label="Tasks"
            icon={<Task />}
            iconPosition="start"
          />
        )}

        <Tab
          label="Permissions"
          icon={<Security />}
          iconPosition="start"
        />
      </Tabs>
    </Box>
  );
};

// Tab panel component for content display
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};