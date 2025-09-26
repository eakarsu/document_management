'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Button } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Security, Speed, Group, EmojiEvents } from '@mui/icons-material';

export default function AboutPage() {
  const values = [
    {
      icon: <Security />,
      title: 'Security First',
      description: 'Military-grade security and compliance built into every feature'
    },
    {
      icon: <Speed />,
      title: 'Speed & Efficiency',
      description: 'Streamline document workflows and reduce processing time by 70%'
    },
    {
      icon: <Group />,
      title: 'Collaboration',
      description: 'Enable seamless teamwork across units and departments'
    },
    {
      icon: <EmojiEvents />,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality solutions'
    }
  ];

  const team = [
    {
      name: 'Col. James Mitchell',
      role: 'CEO & Founder',
      image: '/api/placeholder/150/150',
      bio: '20+ years in Air Force operations'
    },
    {
      name: 'Dr. Sarah Chen',
      role: 'CTO',
      image: '/api/placeholder/150/150',
      bio: 'AI & Machine Learning Expert'
    },
    {
      name: 'Maj. Robert Williams',
      role: 'VP of Operations',
      image: '/api/placeholder/150/150',
      bio: '15+ years in military logistics'
    },
    {
      name: 'Lisa Anderson',
      role: 'VP of Product',
      image: '/api/placeholder/150/150',
      bio: 'Enterprise software specialist'
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
              About Mission Sync AI
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Revolutionizing military document management with cutting-edge AI technology and decades of operational expertise
            </Typography>
          </Container>
        </Box>

        {/* Mission Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                Our Mission
              </Typography>
              <Typography variant="body1" paragraph>
                Mission Sync AI was founded by veterans who understand the unique challenges of military documentation.
                We're on a mission to transform how military organizations create, manage, and distribute critical documents.
              </Typography>
              <Typography variant="body1" paragraph>
                Our AI-powered platform streamlines workflows, ensures compliance with military standards, and enables
                rapid decision-making through intelligent document processing.
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Learn More About Our Technology
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/images/missionsync/airmen-flightline.png"
                alt="Mission"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              />
            </Grid>
          </Grid>
        </Container>

        {/* Values Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Our Core Values
            </Typography>
            <Grid container spacing={4}>
              {values.map((value, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                    <Box sx={{ color: '#667eea', mb: 2 }}>
                      {React.cloneElement(value.icon, { sx: { fontSize: 48 } })}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value.description}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Team Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Leadership Team
          </Typography>
          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    src={member.image}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Stats Section */}
        <Box sx={{ bgcolor: '#1a1a2e', color: 'white', py: 8 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} textAlign="center">
              <Grid item xs={6} md={3}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  500+
                </Typography>
                <Typography variant="h6">Military Organizations</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  10M+
                </Typography>
                <Typography variant="h6">Documents Processed</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  99.9%
                </Typography>
                <Typography variant="h6">Uptime</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  24/7
                </Typography>
                <Typography variant="h6">Support</Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}