'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PublishingDashboard from '@/components/publishing/PublishingDashboard';
import PublicationScheduler from '@/components/publishing/PublicationScheduler';
import ApprovalChainManager from '@/components/publishing/ApprovalChainManager';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
      </Paper>
    </Container>
  );
}