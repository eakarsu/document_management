'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Rocket, Satellite, Security, Science, CheckCircle, Star } from '@mui/icons-material';

export default function SpaceForceSolutionsPage() {
  const spaceForceFeatures = [
    {
      icon: <Satellite />,
      title: 'Space Operations Management',
      description: 'Specialized tools for satellite operations, space mission planning, and orbital tracking.',
      benefits: ['Satellite tracking integration', 'Mission planning tools', 'Orbital debris monitoring']
    },
    {
      icon: <Science />,
      title: 'Advanced Technology Integration',
      description: 'Cutting-edge document workflows for space technology development and testing.',
      benefits: ['R&D documentation', 'Technology transfer protocols', 'Innovation tracking']
    },
    {
      icon: <Security />,
      title: 'Space Domain Security',
      description: 'Specialized security protocols for space-related classified information and operations.',
      benefits: ['Space-specific classifications', 'Secure satellite communications', 'Threat assessment documentation']
    },
    {
      icon: <Rocket />,
      title: 'Launch Operations',
      description: 'Comprehensive support for launch operations, pre-flight checks, and mission control.',
      benefits: ['Launch sequence documentation', 'Pre-flight checklists', 'Mission control workflows']
    }
  ];

  const useCases = [
    'Satellite Mission Planning',
    'Space Technology Development',
    'Launch Operation Procedures',
    'Space Threat Assessments',
    'Orbital Maintenance Logs',
    'Space Domain Awareness Reports'
  ];

  const testimonials = [
    {
      quote: "Mission Sync AI understands the unique requirements of space operations. It's been invaluable for our satellite mission management.",
      author: "Colonel Jennifer Adams",
      position: "Director of Space Operations, Space Systems Command"
    },
    {
      quote: "The security features are perfectly suited for our classified space programs. Finally, a solution built for the Space Force.",
      author: "Major David Kim",
      position: "Chief Technology Officer, 45th Weather Squadron"
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
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
                  Space Force Solutions
                </Typography>
                <Typography variant="h5" sx={{ mb: 4 }}>
                  Next-generation document management for space operations, satellite missions, and the final frontier of military operations.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    Request Demo
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
                    Learn More
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Rocket sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h6">
                    Supporting 15+ Space Force Deltas
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Space Force-Specific Features
          </Typography>
          <Grid container spacing={4}>
            {spaceForceFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
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
                  <Box sx={{ color: '#667eea', mb: 2 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {feature.description}
                  </Typography>
                  <List dense>
                    {feature.benefits.map((benefit, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckCircle sx={{ color: '#667eea', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Use Cases Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Space Operations Use Cases
            </Typography>
            <Grid container spacing={2}>
              {useCases.map((useCase, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Chip
                    label={useCase}
                    sx={{
                      width: '100%',
                      py: 2,
                      px: 3,
                      fontSize: '1rem',
                      bgcolor: 'white',
                      border: '2px solid #667eea',
                      '&:hover': {
                        bgcolor: '#667eea',
                        color: 'white'
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Testimonials Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Space Force Leadership Testimonials
          </Typography>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    position: 'relative',
                    '&:before': {
                      content: '"""',
                      position: 'absolute',
                      top: 10,
                      left: 20,
                      fontSize: '4rem',
                      color: '#667eea',
                      fontFamily: 'serif'
                    }
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 3, mt: 2, fontStyle: 'italic' }}>
                    {testimonial.quote}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ color: '#667eea', mr: 1 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {testimonial.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.position}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

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
              Reach for the Stars
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              See how Mission Sync AI can support your space operations and missions
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
                Schedule Space Force Demo
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