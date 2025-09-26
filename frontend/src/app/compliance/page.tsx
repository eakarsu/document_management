'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, Chip } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { VerifiedUser, Security, Shield } from '@mui/icons-material';

export default function CompliancePage() {
  const certifications = [
    { name: 'FISMA Moderate', description: 'Federal Information Security Management Act compliance' },
    { name: 'FedRAMP Ready', description: 'Federal Risk and Authorization Management Program' },
    { name: 'FIPS 140-2', description: 'Federal Information Processing Standards' },
    { name: 'SOC 2 Type II', description: 'Service Organization Control 2 compliance' },
    { name: 'ISO 27001', description: 'International information security management' },
    { name: 'NIST 800-53', description: 'National Institute of Standards and Technology' }
  ];

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <VerifiedUser sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>Compliance & Certifications</Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Mission Sync AI meets the highest standards of government and military compliance requirements.
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>Security Certifications</Typography>
          <Grid container spacing={3}>
            {certifications.map((cert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Chip label={cert.name} sx={{ bgcolor: '#667eea', color: 'white', mb: 2 }} />
                  <Typography variant="body1">{cert.description}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      <Footer />
    </>
  );
}