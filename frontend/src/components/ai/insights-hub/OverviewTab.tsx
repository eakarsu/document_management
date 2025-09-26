import React from 'react';
import { Grid } from '@mui/material';
import { PerformanceMetrics } from '@/types/ai-insights';
import PerformanceMetricsCard from './PerformanceMetricsCard';

interface OverviewTabProps {
  performanceMetrics: PerformanceMetrics;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ performanceMetrics }) => {
  return (
    <Grid container spacing={3}>
      {/* Performance Metrics Cards */}
      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="Workflow Efficiency"
          metric={performanceMetrics.workflowEfficiency}
          unit="%"
          positive={true}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="Avg Processing Time"
          metric={performanceMetrics.averageProcessingTime}
          unit="h"
          positive={false}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="Quality Score"
          metric={performanceMetrics.qualityScore}
          unit="%"
          positive={true}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="User Satisfaction"
          metric={performanceMetrics.userSatisfaction}
          unit="/5"
          positive={true}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="Cost per Workflow"
          metric={performanceMetrics.costPerWorkflow}
          unit="$"
          positive={false}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PerformanceMetricsCard
          title="Automation Rate"
          metric={performanceMetrics.automationRate}
          unit="%"
          positive={true}
        />
      </Grid>
    </Grid>
  );
};

export default OverviewTab;