'use client';

import React from 'react';
import { Box, Container } from '@mui/material';
import { WorkflowManager } from '../../components/workflow/WorkflowManager';

export default function WorkflowsPage() {
  return (
    <Container maxWidth="xl">
      <WorkflowManager />
    </Container>
  );
}