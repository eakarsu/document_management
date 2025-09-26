'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Group, Hub, Sync, Security, CheckCircle, Star } from '@mui/icons-material';

export default function JointOpsSolutionsPage() {
  const jointOpsFeatures = [
    {
      icon: <Hub />,
      title: 'Multi-Service Integration',
      description: 'Seamless coordination across all military branches with unified document workflows.',
      benefits: ['Cross-service compatibility', 'Unified command structure', 'Standardized procedures']
    },
    {
      icon: <Sync />,
      title: 'Real-Time Coordination',
      description: 'Live synchronization and communication tools for joint operations and exercises.',
      benefits: ['Real-time updates', 'Multi-branch chat', 'Status synchronization']
    },
    {
      icon: <Security />,
      title: 'Multi-Level Security',
      description: 'Advanced security protocols supporting different classification levels across services.',
      benefits: ['Multi-domain security', 'Cross-service authentication', 'Compartmented access']
    },
    {
      icon: <Group />,
      title: 'Coalition Support',
      description: 'Extended capabilities for international coalition operations and NATO partnerships.',
      benefits: ['International standards', 'Coalition workflows', 'Multi-language support']
    }
  ];

  const useCases = [
    'Joint Exercise Planning',
    'Multi-Service Operations',
    'Coalition Mission Coordination',
    'Joint Training Documentation',
    'Combined Arms Planning',
    'Inter-Service Communication'
  ];

  const testimonials = [
    {
      quote: "Mission Sync AI is the only platform that truly understands joint operations. It bridges the gap between all our services seamlessly.",
      author: "General Mark Harrison",
      position: "Director, Joint Staff Operations"
    },
    {
      quote: "For NATO exercises, this platform has been invaluable. The coalition support features work exactly as advertised.",
      author: "Admiral Catherine Lee",
      position: "Joint Operations Commander, EUCOM"
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
                  Joint Operations Solutions
                </Typography>
                <Typography variant="h5" sx={{ mb: 4 }}>
                  Unified document management and workflow coordination for multi-service operations, joint exercises, and coalition missions.
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
                  <Hub sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h6">
                    Coordinating 25+ Joint Commands
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Joint Operations Features
          </Typography>
          <Grid container spacing={4}>
            {jointOpsFeatures.map((feature, index) => (
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
              Joint Operations Use Cases
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
            Joint Leadership Testimonials
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
              Unify Your Operations
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Experience seamless coordination across all military services and coalition partners
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
                Schedule Joint Ops Demo
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