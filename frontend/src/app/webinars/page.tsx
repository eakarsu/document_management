'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Avatar } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PlayCircleOutline, Schedule, People, OndemandVideo } from '@mui/icons-material';

export default function WebinarsPage() {
  const upcomingWebinars = [
    {
      title: 'Advanced Workflow Automation in Military Operations',
      date: 'January 15, 2025',
      time: '2:00 PM EST',
      presenter: 'Colonel Sarah Mitchell',
      description: 'Learn how to leverage AI-powered workflows for maximum operational efficiency.',
      duration: '60 minutes',
      attendees: 156
    },
    {
      title: 'Security Best Practices for Classified Documents',
      date: 'January 22, 2025',
      time: '1:00 PM EST',
      presenter: 'Dr. Michael Chen',
      description: 'Comprehensive guide to maintaining security while improving document workflows.',
      duration: '45 minutes',
      attendees: 89
    },
    {
      title: 'Mobile Document Access for Field Operations',
      date: 'January 29, 2025',
      time: '3:00 PM EST',
      presenter: 'Major Lisa Rodriguez',
      description: 'Best practices for secure mobile access in deployment environments.',
      duration: '30 minutes',
      attendees: 234
    }
  ];

  const pastWebinars = [
    {
      title: 'Getting Started with Mission Sync AI',
      presenter: 'Product Team',
      views: 1240,
      duration: '45 minutes'
    },
    {
      title: 'API Integration Masterclass',
      presenter: 'Engineering Team',
      views: 856,
      duration: '60 minutes'
    },
    {
      title: 'Joint Operations Coordination',
      presenter: 'General Harrison',
      views: 2100,
      duration: '50 minutes'
    },
    {
      title: 'Compliance and Audit Features',
      presenter: 'Compliance Team',
      views: 672,
      duration: '40 minutes'
    }
  ];

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
              Webinars & Training
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Join our expert-led webinars to master Mission Sync AI and learn best practices from military professionals.
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
              Register for Next Webinar
            </Button>
          </Container>
        </Box>

        {/* Upcoming Webinars */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Upcoming Webinars
          </Typography>
          <Grid container spacing={4}>
            {upcomingWebinars.map((webinar, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PlayCircleOutline sx={{ color: '#667eea', fontSize: 32, mr: 1 }} />
                    <Chip 
                      label="UPCOMING" 
                      sx={{ 
                        bgcolor: '#4caf50', 
                        color: 'white', 
                        fontWeight: 600 
                      }} 
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {webinar.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {webinar.description}
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'grey.600' }} />
                      <Typography variant="body2">
                        {webinar.date} at {webinar.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <People sx={{ fontSize: 16, mr: 1, color: 'grey.600' }} />
                      <Typography variant="body2">
                        {webinar.attendees} registered
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#667eea' }}>
                      {webinar.presenter.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {webinar.presenter}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {webinar.duration}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    Register Now
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Past Webinars */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              On-Demand Webinars
            </Typography>
            <Grid container spacing={3}>
              {pastWebinars.map((webinar, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: '#667eea',
                        color: 'white',
                        transform: 'translateY(-5px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <OndemandVideo sx={{ mr: 2, fontSize: 24 }} />
                      <Chip 
                        label="ON-DEMAND" 
                        size="small"
                        sx={{ 
                          bgcolor: 'grey.200', 
                          fontSize: '0.75rem' 
                        }} 
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {webinar.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                      By {webinar.presenter}
                    </Typography>
                    <Typography variant="caption">
                      {webinar.views} views • {webinar.duration}
                    </Typography>
                  </Card>
                </Grid>
              ))}
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
              Never Miss a Session
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Subscribe to our webinar series and get notified about upcoming training sessions
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
                Subscribe to Webinars
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
                Request Custom Training
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}