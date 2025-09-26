'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  useTheme,
  alpha,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  PlayCircle,
  CheckCircle,
  Schedule,
  Security,
  Group,
  CloudSync,
  Analytics,
  Support
} from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DemoPage: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    organizationType: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Demo request submitted:', formData);
    setSubmitted(true);
  };

  const features = [
    {
      icon: <PlayCircle sx={{ fontSize: 40 }} />,
      title: 'Live Demo Session',
      description: 'See Mission Sync AI in action with a personalized 30-minute demonstration'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      title: 'Custom Use Cases',
      description: 'We\'ll showcase features specific to your organization\'s needs'
    },
    {
      icon: <Schedule sx={{ fontSize: 40 }} />,
      title: 'Flexible Scheduling',
      description: 'Choose a time that works for your team across multiple time zones'
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: 'Expert Guidance',
      description: 'Get answers from our military documentation specialists'
    }
  ];

  const benefits = [
    'See real-time collaborative workflows in action',
    'Experience AI-powered document generation',
    'Learn about military compliance features',
    'Understand integration capabilities',
    'Discover automation opportunities',
    'Get answers to your specific questions'
  ];

  return (
    <>
      <Header />
      <Box sx={{ pt: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            py: 10,
            background: `linear-gradient(135deg,
              ${alpha(theme.palette.primary.main, 0.03)} 0%,
              ${alpha('#667eea', 0.05)} 50%,
              ${alpha('#764ba2', 0.03)} 100%)`
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Chip
                  label="LIVE DEMONSTRATION"
                  sx={{
                    mb: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  See Mission Sync AI in Action
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  Schedule a personalized demo to see how Mission Sync AI can transform your military documentation workflows. Our experts will show you real-world use cases tailored to your organization's needs.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                  {['30-Min Demo', 'No Commitment', 'Expert-Led'].map((item) => (
                    <Chip
                      key={item}
                      icon={<CheckCircle />}
                      label={item}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: 'white',
                    borderRadius: 3,
                    p: 1,
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                  }}
                >
                  <img
                    src="/api/placeholder/600/400"
                    alt="Mission Sync AI Demo"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      bgcolor: 'rgba(102, 126, 234, 0.9)',
                      borderRadius: '50%',
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translate(-50%, -50%) scale(1.1)'
                      }
                    }}
                  >
                    <PlayCircle sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                What You'll Experience
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Our demo is designed to showcase the full power of Mission Sync AI
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 3,
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          mb: 3
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Demo Form Section */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                Request Your Demo
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Fill out the form below and we'll get back to you within 24 hours
              </Typography>
            </Box>

            {submitted ? (
              <Alert
                severity="success"
                sx={{
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  py: 2
                }}
              >
                Thank you for your demo request! Our team will contact you within 24 hours to schedule your personalized demonstration.
              </Alert>
            ) : (
              <Card sx={{ borderRadius: 3, boxShadow: '0 20px 40px rgba(102, 126, 234, 0.1)' }}>
                <CardContent sx={{ p: 4 }}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={formData.firstName}
                          onChange={handleChange('firstName')}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={formData.lastName}
                          onChange={handleChange('lastName')}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Work Email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange('email')}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={formData.phone}
                          onChange={handleChange('phone')}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Organization"
                          value={formData.company}
                          onChange={handleChange('company')}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Organization Type</InputLabel>
                          <Select
                            value={formData.organizationType}
                            onChange={handleChange('organizationType')}
                            label="Organization Type"
                          >
                            <MenuItem value="air-force">Air Force</MenuItem>
                            <MenuItem value="army">Army</MenuItem>
                            <MenuItem value="navy">Navy</MenuItem>
                            <MenuItem value="marines">Marines</MenuItem>
                            <MenuItem value="space-force">Space Force</MenuItem>
                            <MenuItem value="joint-operations">Joint Operations</MenuItem>
                            <MenuItem value="government">Government Agency</MenuItem>
                            <MenuItem value="contractor">Defense Contractor</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Job Title"
                          value={formData.jobTitle}
                          onChange={handleChange('jobTitle')}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Tell us about your documentation challenges"
                          value={formData.message}
                          onChange={handleChange('message')}
                          variant="outlined"
                          placeholder="What specific workflow challenges are you facing? How many team members would use the system?"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          sx={{
                            py: 2,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)'
                            }
                          }}
                        >
                          Request Demo
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            )}
          </Container>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                  What You'll Learn
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  Our demo is comprehensive and tailored to your organization's specific needs. You'll see firsthand how Mission Sync AI can streamline your documentation processes.
                </Typography>
                <Stack spacing={2}>
                  {benefits.map((benefit, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: '#667eea', mr: 2 }} />
                      <Typography variant="body1">{benefit}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                      <Security sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Secure
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Military-grade security
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                      <CloudSync sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Integrated
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Works with existing systems
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                      <Analytics sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Real-time insights
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                      <Group sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Collaborative
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Team-focused workflows
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            py: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                Ready to Transform Your Workflows?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Join 500+ military organizations already using Mission Sync AI
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    py: 2,
                    px: 4,
                    bgcolor: 'white',
                    color: '#667eea',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Schedule Demo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    py: 2,
                    px: 4,
                    borderColor: 'white',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Start Free Trial
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default DemoPage;