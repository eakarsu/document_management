'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Security, Shield, Lock, VerifiedUser, Gavel, CloudDone } from '@mui/icons-material';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Shield />,
      title: 'End-to-End Encryption',
      description: 'All data encrypted in transit and at rest using AES-256 encryption standards.'
    },
    {
      icon: <VerifiedUser />,
      title: 'Multi-Factor Authentication',
      description: 'Secure access with CAC/PIV card integration and biometric verification.'
    },
    {
      icon: <Lock />,
      title: 'Zero Trust Architecture',
      description: 'Every request verified and authenticated, regardless of location or device.'
    },
    {
      icon: <Gavel />,
      title: 'Compliance Ready',
      description: 'Built to meet FISMA, FedRAMP, and DoD security requirements.'
    },
    {
      icon: <CloudDone />,
      title: 'Secure Deployment',
      description: 'Air-gapped deployment options for classified environments.'
    },
    {
      icon: <Security />,
      title: 'Continuous Monitoring',
      description: '24/7 security monitoring with real-time threat detection.'
    }
  ];

  const certifications = [
    'FISMA Moderate',
    'FedRAMP Ready',
    'FIPS 140-2',
    'SOC 2 Type II',
    'ISO 27001',
    'NIST 800-53'
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
              Military-Grade Security
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Built with security at its core, Mission Sync AI meets the highest standards of military and government security requirements.
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
              View Security Documentation
            </Button>
          </Container>
        </Box>

        {/* Security Features */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Comprehensive Security Features
          </Typography>
          <Grid container spacing={4}>
            {securityFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    textAlign: 'center',
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
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Certifications Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Security Certifications & Compliance
            </Typography>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Trusted by Military Organizations
                </Typography>
                <Typography variant="body1" paragraph>
                  Mission Sync AI has undergone rigorous security assessments and maintains compliance with all major government security frameworks.
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedUser sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Government Security Clearance"
                      secondary="Approved for use in classified environments"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Shield sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Continuous Compliance Monitoring"
                      secondary="Regular audits and assessments to maintain certification"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Zero Security Incidents"
                      secondary="Proven track record with 100% uptime security"
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'center'
                  }}
                >
                  {certifications.map((cert, index) => (
                    <Chip
                      key={index}
                      label={cert}
                      sx={{
                        py: 3,
                        px: 2,
                        fontSize: '1rem',
                        bgcolor: '#667eea',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#764ba2'
                        }
                      }}
                    />
                  ))}
                </Box>
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
              Ready to Secure Your Operations?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Learn more about our security measures and compliance certifications
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
                Contact Security Team
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
                Download Security Brief
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}