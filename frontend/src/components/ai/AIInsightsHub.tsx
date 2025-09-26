'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Alert,
  Button,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Analytics,
  Insights,
  Timeline,
  CompareArrows
} from '@mui/icons-material';

// Import types and components
import { AIInsightsHubProps, Insight } from '../ai-insights/types';
import { useAIInsights } from '../ai-insights/useAIInsights';
import DocumentSelector from '../ai-insights/DocumentSelector';
import AIInsightsHeader from '../ai-insights/AIInsightsHeader';
import PerformanceMetricsGrid from '../ai-insights/PerformanceMetricsGrid';
import InsightsList from '../ai-insights/InsightsList';
import PredictiveAnalyticsGrid from '../ai-insights/PredictiveAnalyticsGrid';
import BenchmarksGrid from '../ai-insights/BenchmarksGrid';
import InsightDetailDialog from '../ai-insights/InsightDetailDialog';

const AIInsightsHub: React.FC<AIInsightsHubProps> = ({
  organizationId,
  timeRange = 'month',
  onInsightAction
}) => {
  const { state, actions } = useAIInsights(organizationId, onInsightAction);

  // Wrapper function to adapt the signature for components that expect (insight, action)
  const handleExecuteAction = (insight: Insight, action: string) => {
    actions.executeInsightAction(insight, action);
  };

  // Wrapper function for components that expect only (insight)
  const handleExecuteActionSingle = (insight: Insight) => {
    actions.executeInsightAction(insight, 'implement');
  };

  const filteredInsights = actions.getFilteredInsights();
  const criticalInsights = state.insights.filter(i => i.priority === 'CRITICAL').length;
  const actionableInsights = state.insights.filter(i => i.actionable).length;

  // Loading state
  if (state.loading && !state.insights.length) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            Loading AI insights...
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={actions.generateInsights}>
              Retry
            </Button>
          }>
            {state.error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Document selector state
  if (!state.selectedDocumentId) {
    return (
      <DocumentSelector
        selectedDocumentId={state.selectedDocumentId}
        documents={state.documents}
        documentsLoading={state.documentsLoading}
        onDocumentChange={actions.handleDocumentChange}
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <AIInsightsHeader
        criticalInsights={criticalInsights}
        actionableInsights={actionableInsights}
        loading={state.loading}
        selectedDocumentId={state.selectedDocumentId}
        documents={state.documents}
        documentsLoading={state.documentsLoading}
        selectedTimeRange={state.selectedTimeRange}
        onDocumentChange={actions.handleDocumentChange}
        onTimeRangeChange={actions.setSelectedTimeRange}
        onRefresh={actions.generateInsights}
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={state.selectedTab} onChange={(e, newValue) => actions.setSelectedTab(newValue)}>
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Insights" icon={<Insights />} />
          <Tab label="Predictions" icon={<Timeline />} />
          <Tab label="Benchmarks" icon={<CompareArrows />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {state.selectedTab === 0 && state.performanceMetrics && (
        <PerformanceMetricsGrid performanceMetrics={state.performanceMetrics} />
      )}

      {state.selectedTab === 1 && (
        <InsightsList
          insights={filteredInsights}
          filterType={state.filterType}
          filterPriority={state.filterPriority}
          loading={state.loading}
          onFilterTypeChange={actions.setFilterType}
          onFilterPriorityChange={actions.setFilterPriority}
          onViewDetails={(insight) => {
            actions.setSelectedInsight(insight);
            actions.setDetailDialogOpen(true);
          }}
          onExecuteAction={handleExecuteActionSingle}
        />
      )}

      {state.selectedTab === 2 && state.predictiveAnalytics && (
        <PredictiveAnalyticsGrid predictiveAnalytics={state.predictiveAnalytics} />
      )}

      {state.selectedTab === 3 && state.benchmarkData && (
        <BenchmarksGrid
          benchmarkData={state.benchmarkData}
          performanceMetrics={state.performanceMetrics}
        />
      )}

      {/* Insight Detail Dialog */}
      <InsightDetailDialog
        open={state.detailDialogOpen}
        insight={state.selectedInsight}
        loading={state.loading}
        onClose={() => actions.setDetailDialogOpen(false)}
        onExecuteAction={handleExecuteActionSingle}
      />
    </Box>
  );
};

export default AIInsightsHub;