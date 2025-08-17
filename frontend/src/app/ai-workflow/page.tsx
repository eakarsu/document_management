'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  Badge,
  Button
} from '@mui/material';
import {
  AccountCircle,
  Business,
  Logout as LogoutIcon,
  Psychology as AIIcon,
  Insights as InsightsIcon,
  BarChart as AnalyticsIcon,
  Timeline as MonitorIcon,
  Lightbulb as RecommendIcon,
  Gavel as DecisionIcon,
  Assessment as ContentIcon,
  Group as TeamIcon,
  Speed as OptimizeIcon,
  ArrowBack
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '../../components/ErrorBoundary';
import AIWorkflowDashboard from '../../components/ai/AIWorkflowDashboard';
import SmartRecommendationEngine from '../../components/ai/SmartRecommendationEngine';
import AIDecisionSupport from '../../components/ai/AIDecisionSupport';
import RealtimeWorkflowMonitor from '../../components/ai/RealtimeWorkflowMonitor';
import AIInsightsHub from '../../components/ai/AIInsightsHub';
import AIWorkflowOptimizer from '../../components/ai/AIWorkflowOptimizer';
import AIContentAnalyzer from '../../components/ai/AIContentAnalyzer';
import AITeamPerformanceDashboard from '../../components/ai/AITeamPerformanceDashboard';
import { api } from '../../lib/api';

const AIWorkflowPage: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const response = await api.post('/api/auth/logout');
      if (response.ok) {
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // TabPanel component for AI tabs
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
        id={`ai-tabpanel-${index}`}
        aria-labelledby={`ai-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Richmond Document Management System - AI Workflow Assistant
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
              <AIIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
              AI Workflow Assistant
              <Badge badgeContent="AI" color="primary" sx={{ ml: 2 }} />
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Intelligent automation and insights for your document workflows
          </Typography>
        </Box>

        {/* AI Features */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              scrollButtons="auto"
              variant="scrollable"
            >
              <Tab label="Dashboard" icon={<InsightsIcon />} />
              <Tab label="Recommendations" icon={<RecommendIcon />} />
              <Tab label="Decision Support" icon={<DecisionIcon />} />
              <Tab label="Real-time Monitor" icon={<MonitorIcon />} />
              <Tab label="Insights Hub" icon={<AnalyticsIcon />} />
              <Tab label="Optimizer" icon={<OptimizeIcon />} />
              <Tab label="Content Analysis" icon={<ContentIcon />} />
              <Tab label="Team Performance" icon={<TeamIcon />} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <ErrorBoundary fallback={<Typography color="error">Error loading AI Dashboard</Typography>}>
              <AIWorkflowDashboard organizationId="cmeedfl8j0000iqen0b5uqs7u" />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Smart Recommendations</Typography>}>
              <SmartRecommendationEngine 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
                currentContext={{
                  userId: "current-user",
                  workflowId: "active-workflow"
                }}
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Decision Support</Typography>}>
              <AIDecisionSupport 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
                currentStep="review"
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Real-time Monitor</Typography>}>
              <RealtimeWorkflowMonitor 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Insights Hub</Typography>}>
              <AIInsightsHub 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
                timeRange="month"
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Workflow Optimizer</Typography>}>
              <AIWorkflowOptimizer 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={6}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Content Analyzer</Typography>}>
              <AIContentAnalyzer />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={7}>
            <ErrorBoundary fallback={<Typography color="error">Error loading Team Performance</Typography>}>
              <AITeamPerformanceDashboard 
                organizationId="cmeedfl8j0000iqen0b5uqs7u"
                timeRange="month"
              />
            </ErrorBoundary>
          </TabPanel>
        </Paper>

        {/* API Status */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              🤖 AI Workflow Assistant: Active | 
              Backend API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} | 
              8 AI Features Available
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AIWorkflowPage;