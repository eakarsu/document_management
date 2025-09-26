'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, Button, Switch, FormControlLabel } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Cookie } from '@mui/icons-material';

export default function CookiesPage() {
  const [analytics, setAnalytics] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);
  const [functional, setFunctional] = React.useState(true);

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Cookie sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>Cookie Settings</Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Manage your cookie preferences and learn how we use cookies to improve your experience.
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>Cookie Preferences</Typography>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Essential Cookies</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>Required for basic site functionality and security.</Typography>
                <FormControlLabel control={<Switch checked disabled />} label="Always Active" />
              </Card>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Analytics Cookies</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>Help us understand how you use our site to improve performance.</Typography>
                <FormControlLabel 
                  control={<Switch checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />} 
                  label={analytics ? "Enabled" : "Disabled"} 
                />
              </Card>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Marketing Cookies</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>Used to deliver relevant content and advertisements.</Typography>
                <FormControlLabel 
                  control={<Switch checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />} 
                  label={marketing ? "Enabled" : "Disabled"} 
                />
              </Card>
              <Card sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Functional Cookies</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>Enable enhanced functionality and personalization.</Typography>
                <FormControlLabel 
                  control={<Switch checked={functional} onChange={(e) => setFunctional(e.target.checked)} />} 
                  label={functional ? "Enabled" : "Disabled"} 
                />
              </Card>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Save Preferences</Button>
                <Button variant="outlined" sx={{ borderColor: '#667eea', color: '#667eea' }}>Accept All</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>About Cookies</Typography>
                <Typography variant="body1" paragraph>
                  Cookies are small text files stored on your device that help us provide and improve our services.
                </Typography>
                <Typography variant="body1">
                  You can manage your cookie preferences at any time by returning to this page.
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