import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';
import { Insight } from '@/types/ai-insights';
import { getCategoryColor, getPriorityColor, getTypeIcon } from './utils';

interface InsightsTabProps {
  insights: Insight[];
  filteredInsights: Insight[];
  filterType: string;
  setFilterType: (type: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  onInsightDetail: (insight: Insight) => void;
  onExecuteAction: (insight: Insight, action: string) => void;
  loading: boolean;
}

const InsightsTab: React.FC<InsightsTabProps> = ({
  insights,
  filteredInsights,
  filterType,
  setFilterType,
  filterPriority,
  setFilterPriority,
  onInsightDetail,
  onExecuteAction,
  loading
}) => {
  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value="PERFORMANCE">Performance</MenuItem>
            <MenuItem value="EFFICIENCY">Efficiency</MenuItem>
            <MenuItem value="QUALITY">Quality</MenuItem>
            <MenuItem value="COST">Cost</MenuItem>
            <MenuItem value="PREDICTION">Prediction</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filterPriority}
            label="Priority"
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="ALL">All Priorities</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Insights List */}
      <Grid container spacing={2}>
        {filteredInsights.map((insight) => (
          <Grid item xs={12} key={insight.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1 }}>
                    <Avatar sx={{ mr: 2, bgcolor: getCategoryColor(insight.category) + '.light' }}>
                      {getTypeIcon(insight.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {insight.title}
                        </Typography>
                        <Chip
                          label={insight.priority}
                          size="small"
                          color={getPriorityColor(insight.priority) as any}
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={insight.category}
                          size="small"
                          color={getCategoryColor(insight.category) as any}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {insight.description}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Financial Impact</Typography>
                          <Typography variant="body2" color={insight.impact.financial > 0 ? 'success.main' : 'error.main'}>
                            {insight.impact.financial > 0 ? '+' : ''}${Math.abs(insight.impact.financial).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Efficiency Impact</Typography>
                          <Typography variant="body2" color={insight.impact.efficiency > 0 ? 'success.main' : 'error.main'}>
                            {insight.impact.efficiency > 0 ? '+' : ''}{insight.impact.efficiency}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Confidence</Typography>
                          <Typography variant="body2">{insight.confidence}%</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Data Points</Typography>
                          <Typography variant="body2">{insight.dataPoints}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => onInsightDetail(insight)}
                    >
                      View Details
                    </Button>
                    {insight.actionable && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AutoFixHigh />}
                        onClick={() => onExecuteAction(insight, 'implement')}
                        disabled={loading}
                      >
                        Take Action
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default InsightsTab;