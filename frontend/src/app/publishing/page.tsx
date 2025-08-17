'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Paper,
  useTheme,
  useMediaQuery,
  Typography,
  Button
} from '@mui/material';
import {
  ArrowBack,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublishingDashboard from '@/components/publishing/PublishingDashboard';
import PublicationScheduler from '@/components/publishing/PublicationScheduler';
import ApprovalChainManager from '@/components/publishing/ApprovalChainManager';
import AIWorkflowDashboard from '@/components/ai/AIWorkflowDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`publishing-tabpanel-${index}`}
      aria-labelledby={`publishing-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function PublishingPage() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <PublishIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
            Publishing Management
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Manage document publishing workflows, approvals, and scheduling
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            label="Dashboard" 
            id="publishing-tab-0"
            aria-controls="publishing-tabpanel-0"
          />
          <Tab 
            label="Publication Scheduler" 
            id="publishing-tab-1"
            aria-controls="publishing-tabpanel-1"
          />
          <Tab 
            label="Approval Management" 
            id="publishing-tab-2"
            aria-controls="publishing-tabpanel-2"
          />
          <Tab 
            label="AI Dashboard" 
            id="publishing-tab-3"
            aria-controls="publishing-tabpanel-3"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PublishingDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PublicationScheduler />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ApprovalChainManager />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AIWorkflowDashboard organizationId="cmeedfl8j0000iqen0b5uqs7u" />
        </TabPanel>
      </Paper>
    </Container>
  );
}