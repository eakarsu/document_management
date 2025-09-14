'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip
} from '@mui/material';
import {
  AutoAwesome,
  Code,
  Rocket,
  School,
  EmojiObjects,
  Speed,
  Engineering
} from '@mui/icons-material';
import SimpleWorkflowBuilder from '@/components/workflow/SimpleWorkflowBuilder';
import dynamic from 'next/dynamic';

// Dynamically import the advanced builder to avoid SSR issues with React Flow
const AdvancedWorkflowBuilder = dynamic(
  () => import('../workflow-builder/page'),
  { ssr: false }
);

export default function WorkflowDesignerPage() {
  const [mode, setMode] = useState<'welcome' | 'simple' | 'advanced'>('welcome');

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode) {
      setMode(newMode as 'welcome' | 'simple' | 'advanced');
    }
  };

  if (mode === 'simple') {
    return (
      <Box>
        <Box sx={{ 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3,
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rocket color="primary" />
              Simple Workflow Designer
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setMode('advanced')}
              startIcon={<Engineering />}
            >
              Switch to Advanced Mode
            </Button>
          </Box>
        </Box>
        <SimpleWorkflowBuilder />
      </Box>
    );
  }

  if (mode === 'advanced') {
    return (
      <Box>
        <Box sx={{ 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3,
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Engineering color="primary" />
              Advanced Workflow Builder
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setMode('simple')}
              startIcon={<Rocket />}
            >
              Switch to Simple Mode
            </Button>
          </Box>
        </Box>
        <AdvancedWorkflowBuilder />
      </Box>
    );
  }

  // Welcome screen
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          🎯 Workflow Designer
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Create powerful document workflows without any coding
        </Typography>

        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', my: 3 }}>
          <Typography variant="body2">
            <strong>New to workflows?</strong> Start with Simple Mode for a guided experience.
            <br />
            <strong>Power user?</strong> Jump into Advanced Mode for full control.
          </Typography>
        </Alert>

        <Grid container spacing={3} sx={{ mt: 2, maxWidth: 900, mx: 'auto' }}>
          {/* Simple Mode Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardActionArea 
                onClick={() => setMode('simple')}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Rocket sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h4" gutterBottom>
                    Simple Mode
                  </Typography>
                  <Chip 
                    label="RECOMMENDED FOR BEGINNERS" 
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      mb: 2
                    }}
                  />
                  <Typography variant="body1" paragraph>
                    Perfect for first-time users! Build workflows in 3 easy steps with pre-made templates.
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      ✨ Features:
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                      • Step-by-step wizard
                      <br />
                      • Pre-built templates
                      <br />
                      • Simple form-based editing
                      <br />
                      • Automatic validation
                      <br />
                      • One-click export
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip icon={<Speed />} label="Quick" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                    <Chip icon={<School />} label="Easy" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                    <Chip icon={<AutoAwesome />} label="AI Help" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Advanced Mode Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}
            >
              <CardActionArea 
                onClick={() => setMode('advanced')}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Engineering sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h4" gutterBottom>
                    Advanced Mode
                  </Typography>
                  <Chip 
                    label="FOR POWER USERS" 
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      mb: 2
                    }}
                  />
                  <Typography variant="body1" paragraph>
                    Full visual workflow designer with drag-and-drop canvas for complex workflows.
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      🚀 Features:
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                      • Visual drag-and-drop canvas
                      <br />
                      • Complex branching logic
                      <br />
                      • Custom conditions & rules
                      <br />
                      • Real-time preview
                      <br />
                      • Advanced permissions
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip icon={<Code />} label="Powerful" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                    <Chip icon={<Engineering />} label="Flexible" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                    <Chip icon={<EmojiObjects />} label="Creative" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Start Examples */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom>
            Popular Workflow Types
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <Typography variant="body2">📋 Purchase Order</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <Typography variant="body2">📄 Contract Review</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <Typography variant="body2">💼 Expense Approval</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <Typography variant="body2">🎓 Leave Request</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}