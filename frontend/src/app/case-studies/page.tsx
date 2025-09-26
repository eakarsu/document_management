'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Avatar } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TrendingUp, Schedule, Group, CheckCircle } from '@mui/icons-material';

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      title: '15th Wing Reduces Document Processing Time by 75%',
      organization: 'U.S. Air Force 15th Wing',
      category: 'Process Optimization',
      readTime: '8 min read',
      summary: 'How the 15th Wing streamlined their operational planning workflows and achieved significant time savings.',
      results: [
        '75% reduction in document processing time',
        '90% improvement in workflow efficiency',
        '$2.3M annual cost savings',
        '99.9% uptime reliability'
      ],
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Joint Task Force Enhances Multi-Service Coordination',
      organization: 'Joint Task Force Alpha',
      category: 'Joint Operations',
      readTime: '12 min read',
      summary: 'A case study on how Mission Sync AI enabled seamless coordination across Army, Navy, and Air Force units.',
      results: [
        '60% faster decision-making process',
        '100% visibility across all units',
        '45% reduction in communication delays',
        'Zero security incidents'
      ],
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Space Force Implements Satellite Operations Management',
      organization: 'U.S. Space Force Delta 2',
      category: 'Space Operations',
      readTime: '10 min read',
      summary: 'Revolutionary approach to satellite mission planning and space domain awareness documentation.',
      results: [
        '85% improvement in mission planning',
        '50% reduction in manual tasks',
        '100% compliance with space protocols',
        '30% increase in operational capacity'
      ],
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Navy Fleet Optimizes Maritime Operations',
      organization: 'U.S. Navy Pacific Fleet',
      category: 'Fleet Management',
      readTime: '15 min read',
      summary: 'Comprehensive fleet-wide implementation resulting in enhanced operational readiness and coordination.',
      results: [
        '70% faster fleet coordination',
        '95% reduction in paperwork',
        '$5M operational cost savings',
        '99% crew satisfaction rate'
      ],
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Army Brigade Enhances Field Operations',
      organization: '1st Armored Division',
      category: 'Field Operations',
      readTime: '9 min read',
      summary: 'Mobile-first deployment enabling real-time documentation and coordination in challenging environments.',
      results: [
        '80% improvement in field reporting',
        '65% faster deployment readiness',
        '100% mobile accessibility',
        '40% reduction in admin overhead'
      ],
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Coalition Forces Implement Unified Document System',
      organization: 'NATO Joint Forces Command',
      category: 'International Cooperation',
      readTime: '11 min read',
      summary: 'Multi-national implementation supporting coalition operations with enhanced security and coordination.',
      results: [
        '90% improvement in coalition coordination',
        '100% multi-language support',
        '99.99% security compliance',
        '25 nations successfully integrated'
      ],
      image: '/api/placeholder/400/250'
    }
  ];

  const categories = ['All', 'Process Optimization', 'Joint Operations', 'Space Operations', 'Fleet Management', 'Field Operations', 'International Cooperation'];

  const getCategoryColor = (category: string) => {
    const colors = {
      'Process Optimization': '#4caf50',
      'Joint Operations': '#2196f3',
      'Space Operations': '#9c27b0',
      'Fleet Management': '#00bcd4',
      'Field Operations': '#ff9800',
      'International Cooperation': '#f44336'
    };
    return colors[category] || '#667eea';
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
              Success Stories
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Discover how military organizations worldwide are transforming their operations with Mission Sync AI.
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
              Download All Case Studies
            </Button>
          </Container>
        </Box>

        {/* Filter Buttons */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map((category, index) => (
              <Chip
                key={index}
                label={category}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: '0.9rem',
                  bgcolor: index === 0 ? '#667eea' : 'grey.100',
                  color: index === 0 ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: '#667eea',
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
        </Container>

        {/* Case Studies Grid */}
        <Container maxWidth="lg" sx={{ pb: 8 }}>
          <Grid container spacing={4}>
            {caseStudies.map((study, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <Typography variant="h6" color="grey.600">
                      Case Study Image
                    </Typography>
                    <Chip
                      label={study.category}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: getCategoryColor(study.category),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {study.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Group sx={{ fontSize: 16, mr: 1, color: 'grey.600' }} />
                      <Typography variant="body2" color="text.secondary">
                        {study.organization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {study.readTime}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {study.summary}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Key Results:
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {study.results.slice(0, 2).map((result, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircle sx={{ color: '#4caf50', fontSize: 16, mr: 1 }} />
                          <Typography variant="body2">
                            {result}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#764ba2',
                          bgcolor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      Read Full Case Study
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Stats Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Proven Results Across All Services
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                    150+
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Military Units
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                    75%
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Average Time Savings
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                    $50M+
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Total Cost Savings
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#f44336', mb: 1 }}>
                    99.9%
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Customer Satisfaction
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
              Ready to Join These Success Stories?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              See how Mission Sync AI can transform your organization's operations
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
                Schedule Your Demo
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
                Contact Sales
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}