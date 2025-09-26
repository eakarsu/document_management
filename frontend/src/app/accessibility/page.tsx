'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, List, ListItem, ListItemText } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Accessibility } from '@mui/icons-material';

export default function AccessibilityPage() {
  const accessibilityFeatures = [
    'WCAG 2.1 AA compliance',
    'Keyboard navigation support',
    'Screen reader compatibility',
    'High contrast mode',
    'Font size adjustment',
    'Focus indicators',
    'Alt text for images',
    'Semantic HTML structure'
  ];

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Accessibility sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>Accessibility</Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Mission Sync AI is committed to ensuring digital accessibility for people with disabilities.
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>Our Commitment</Typography>
              <Typography variant="body1" paragraph>
                We are committed to ensuring that Mission Sync AI is accessible to all users, including those with disabilities. Our platform complies with WCAG 2.1 AA standards.
              </Typography>
              <Card sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Accessibility Features</Typography>
                <List>
                  {accessibilityFeatures.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Contact Us</Typography>
                <Typography variant="body1" paragraph>
                  If you experience any accessibility issues, please contact our support team:
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> accessibility@missionsync.ai<br />
                  <strong>Phone:</strong> 1-800-MISSION
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </>
  );
}