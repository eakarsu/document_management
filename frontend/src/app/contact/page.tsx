'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, MenuItem, Alert } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Phone, Email, LocationOn, AccessTime } from '@mui/icons-material';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const subjects = [
    'General Inquiry',
    'Request Demo',
    'Technical Support',
    'Sales Question',
    'Partnership Opportunity',
    'Other'
  ];

  const contactInfo = [
    {
      icon: <Phone />,
      title: 'Phone',
      details: ['+1 (800) 123-4567', '+1 (555) 987-6543']
    },
    {
      icon: <Email />,
      title: 'Email',
      details: ['info@missionsyncai.com', 'support@missionsyncai.com']
    },
    {
      icon: <LocationOn />,
      title: 'Headquarters',
      details: ['1600 Defense Pentagon', 'Washington, DC 20301']
    },
    {
      icon: <AccessTime />,
      title: 'Business Hours',
      details: ['Monday - Friday: 8:00 AM - 6:00 PM EST', '24/7 Emergency Support']
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
    setFormData({
      name: '',
      email: '',
      organization: '',
      subject: '',
      message: ''
    });
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
              Get in Touch
            </Typography>
            <Typography variant="h5" sx={{ mb: 4 }}>
              We're here to help with your document management needs
            </Typography>
          </Container>
        </Box>

        {/* Contact Form & Info */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
                  Send Us a Message
                </Typography>

                {showSuccess && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Thank you for your message! We'll get back to you within 24 hours.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        variant="outlined"
                      >
                        {subjects.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        multiline
                        rows={6}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{
                          px: 4,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6ed8 0%, #6b4296 100%)'
                          }
                        }}
                      >
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'sticky', top: 100 }}>
                {contactInfo.map((info, index) => (
                  <Card key={index} sx={{ mb: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ color: '#667eea', mr: 2 }}>
                        {React.cloneElement(info.icon, { sx: { fontSize: 32 } })}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {info.title}
                        </Typography>
                        {info.details.map((detail, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary">
                            {detail}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Card>
                ))}

                {/* Quick Links */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Links
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ borderColor: '#667eea', color: '#667eea' }}
                    >
                      Schedule Demo
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ borderColor: '#667eea', color: '#667eea' }}
                    >
                      View Documentation
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ borderColor: '#667eea', color: '#667eea' }}
                    >
                      Support Portal
                    </Button>
                  </Box>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Map Section */}
        <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
              Visit Our Offices
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Washington DC (HQ)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1600 Defense Pentagon<br />
                    Washington, DC 20301<br />
                    United States
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    San Antonio
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Joint Base San Antonio<br />
                    San Antonio, TX 78236<br />
                    United States
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Colorado Springs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peterson Space Force Base<br />
                    Colorado Springs, CO 80914<br />
                    United States
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}