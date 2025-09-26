'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DirectionsBoat, Anchor, Security, Navigation, CheckCircle, Star } from '@mui/icons-material';

export default function NavySolutionsPage() {
  const navyFeatures = [
    {
      icon: <DirectionsBoat />,
      title: 'Fleet Operations Management',
      description: 'Comprehensive document management for naval operations, ship logs, and fleet coordination.',
      benefits: ['Ship-to-shore communication', 'Maritime operational planning', 'Fleet status reporting']
    },
    {
      icon: <Navigation />,
      title: 'Navigation and Logistics',
      description: 'Streamlined processes for navigation planning, supply chain, and port operations.',
      benefits: ['Route planning integration', 'Port coordination workflows', 'Supply tracking systems']
    },
    {
      icon: <Security />,
      title: 'Maritime Security',
      description: 'Specialized security features for naval operations and classified maritime information.',
      benefits: ['Classified handling procedures', 'Maritime-specific protocols', 'Secure fleet communications']
    },
    {
      icon: <Anchor />,
      title: 'Port and Shore Operations',
      description: 'Integrated management for port operations, shore commands, and coastal facilities.',
      benefits: ['Port operation schedules', 'Shore facility management', 'Coastal surveillance reports']
    }
  ];

  const useCases = [
    'Ship Maintenance Logs',
    'Navigation Planning',
    'Personnel Duty Rosters',
    'Maritime Safety Reports',
    'Fleet Operational Orders',
    'Port Security Documentation'
  ];

  const testimonials = [
    {
      quote: "Mission Sync AI has transformed how we manage our fleet operations. The real-time coordination capabilities are exceptional.",
      author: "Captain Michael Thompson",
      position: "Commanding Officer, USS Enterprise"
    },
    {
      quote: "The maritime-specific features make this the perfect solution for Navy operations. It understands our unique requirements.",
      author: "Commander Lisa Park",
      position: "Operations Officer, Naval Surface Force Pacific"
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
                  Navy Solutions
                </Typography>
                <Typography variant="h5" sx={{ mb: 4 }}>
                  Maritime-focused document management and operational workflows designed for naval operations and fleet coordination.
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
                  <DirectionsBoat sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h6">
                    Active in 40+ Naval Commands
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Navy-Specific Features
          </Typography>
          <Grid container spacing={4}>
            {navyFeatures.map((feature, index) => (
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
              Naval Operations Use Cases
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
            Naval Leadership Testimonials
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
              Enhance Naval Operations
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Discover how Mission Sync AI can streamline your fleet operations
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
                Schedule Navy Demo
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