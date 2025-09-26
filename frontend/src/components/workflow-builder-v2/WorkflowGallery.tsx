'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Schedule as ScheduleIcon, Description as DocumentIcon } from '@mui/icons-material';
import { WorkflowTemplate } from '../../types/workflow-builder';

interface WorkflowGalleryProps {
  workflowTemplates: WorkflowTemplate[];
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const WorkflowGallery: React.FC<WorkflowGalleryProps> = ({
  workflowTemplates,
  onSelectTemplate
}) => {
  return (
    <Box>
      {/* Quick Templates */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Start Templates
        </Typography>
        <Grid container spacing={3}>
          {workflowTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => onSelectTemplate(template)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {template.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  {template.estimatedTime && (
                    <Chip
                      icon={<ScheduleIcon />}
                      label={template.estimatedTime}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Existing Workflows */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Your Workflows
        </Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <DocumentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No custom workflows created yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "New Workflow" to get started
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default WorkflowGallery;