'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, Schedule, AutoAwesome, Rocket, Analytics, Cloud } from '@mui/icons-material';

export default function RoadmapPage() {
  const roadmapItems = [
    {
      quarter: 'Q4 2024',
      status: 'completed',
      title: 'Enhanced AI Workflow Engine',
      description: 'Advanced AI-powered document processing with natural language understanding.',
      features: ['GPT-4 Integration', 'Smart Document Classification', 'Automated Routing']
    },
    {
      quarter: 'Q1 2025',
      status: 'completed',
      title: 'Advanced Security Features',
      description: 'Military-grade security enhancements and compliance certifications.',
      features: ['Zero Trust Architecture', 'Enhanced CAC/PIV Support', 'FISMA Compliance']
    },
    {
      quarter: 'Q2 2025',
      status: 'in-progress',
      title: 'Real-time Collaboration Suite',
      description: 'Enhanced collaboration tools for distributed military teams.',
      features: ['Live Co-authoring', 'Video Conferencing Integration', 'Mobile App']
    },
    {
      quarter: 'Q3 2025',
      status: 'planned',
      title: 'Advanced Analytics Platform',
      description: 'Comprehensive analytics and reporting dashboard with predictive insights.',
      features: ['Predictive Analytics', 'Custom Dashboards', 'Performance Metrics']
    },
    {
      quarter: 'Q4 2025',
      status: 'planned',
      title: 'Multi-Cloud Deployment',
      description: 'Expanded deployment options across multiple cloud providers.',
      features: ['AWS GovCloud', 'Azure Government', 'Hybrid Deployment']
    },
    {
      quarter: 'Q1 2026',
      status: 'planned',
      title: 'AI-Powered Decision Support',
      description: 'Advanced AI capabilities for strategic decision making and planning.',
      features: ['Decision Trees', 'Risk Assessment', 'Strategic Planning Tools']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'planned': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in-progress': return <Schedule />;
      case 'planned': return <Rocket />;
      default: return <Schedule />;
    }
  };

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 10
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
              Product Roadmap
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Discover what's coming next in Mission Sync AI. Our roadmap reflects our commitment to continuous innovation and military operational excellence.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Share Feedback
            </Button>
          </Container>
        </Box>

        {/* Roadmap Timeline */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Development Timeline
          </Typography>

          <Grid container spacing={3}>
            {roadmapItems.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card
                  sx={{
                    p: 3,
                    mb: 2,
                    transition: 'transform 0.3s',
                    borderLeft: `4px solid ${getStatusColor(item.status)}`,
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 30px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', bgcolor: getStatusColor(item.status), color: 'white' }}>
                      {getStatusIcon(item.status)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Chip
                        label={item.quarter}
                        sx={{
                          bgcolor: getStatusColor(item.status),
                          color: 'white',
                          fontWeight: 600,
                          mr: 2
                        }}
                      />
                      <Chip
                        label={item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {item.features.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        size="small"
                        sx={{ bgcolor: 'grey.100' }}
                      />
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Feature Categories */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Innovation Areas
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <AutoAwesome sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    AI & Machine Learning
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Advanced AI capabilities for document processing, decision support, and predictive analytics.
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Analytics sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Analytics & Insights
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Comprehensive reporting, dashboards, and business intelligence for operational excellence.
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Cloud sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Cloud & Infrastructure
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Enhanced deployment options, scalability, and performance across cloud platforms.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 8,
            textAlign: 'center'
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
              Shape Our Future
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Your feedback drives our roadmap. Let us know what features matter most to your mission.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Submit Feature Request
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Join Beta Program
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}