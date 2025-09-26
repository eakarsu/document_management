import React from 'react';
import {
  Box,
  Typography,
  Button,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  Warning,
  AutoFixHigh,
  GetApp,
  Refresh
} from '@mui/icons-material';
import { Document } from './types';

interface AIInsightsHeaderProps {
  criticalInsights: number;
  actionableInsights: number;
  loading: boolean;
  selectedDocumentId: string;
  documents: Document[];
  documentsLoading: boolean;
  selectedTimeRange: 'week' | 'month' | 'quarter' | 'year';
  onDocumentChange: (documentId: string) => void;
  onTimeRangeChange: (timeRange: 'week' | 'month' | 'quarter' | 'year') => void;
  onRefresh: () => void;
}

const AIInsightsHeader: React.FC<AIInsightsHeaderProps> = ({
  criticalInsights,
  actionableInsights,
  loading,
  selectedDocumentId,
  documents,
  documentsLoading,
  selectedTimeRange,
  onDocumentChange,
  onTimeRangeChange,
  onRefresh
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
        <Psychology sx={{ mr: 1, color: 'primary.main' }} />
        AI Insights Hub
        <Badge badgeContent={criticalInsights} color="error" sx={{ ml: 2 }}>
          <Warning />
        </Badge>
        <Badge badgeContent={actionableInsights} color="primary" sx={{ ml: 1 }}>
          <AutoFixHigh />
        </Badge>
        {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Document</InputLabel>
          <Select
            value={selectedDocumentId}
            label="Document"
            onChange={(e) => onDocumentChange(e.target.value)}
            disabled={documentsLoading}
          >
            {documents.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                  {doc.title}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={selectedTimeRange}
            label="Time Range"
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            disabled={!selectedDocumentId}
          >
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" startIcon={<GetApp />}>
          Export
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onRefresh}
          startIcon={<Refresh />}
          disabled={!selectedDocumentId}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

export default AIInsightsHeader;