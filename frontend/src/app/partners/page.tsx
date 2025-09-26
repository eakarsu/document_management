'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Avatar } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Business, Handshake, Star, CheckCircle } from '@mui/icons-material';

export default function PartnersPage() {
  const partnerTiers = [
    {
      tier: 'Technology Partners',
      description: 'Leading technology companies that enhance our platform capabilities',
      partners: [
        { name: 'Microsoft', category: 'Cloud Services', logo: 'MS' },
        { name: 'Amazon Web Services', category: 'Government Cloud', logo: 'AWS' },
        { name: 'Oracle', category: 'Database Solutions', logo: 'ORC' },
        { name: 'Salesforce', category: 'CRM Integration', logo: 'SF' }
      ]
    },
    {
      tier: 'System Integrators',
      description: 'Certified partners that implement and customize Mission Sync AI',
      partners: [
        { name: 'Booz Allen Hamilton', category: 'Defense Consulting', logo: 'BAH' },
        { name: 'Raytheon Technologies', category: 'Defense Systems', logo: 'RTX' },
        { name: 'CACI', category: 'IT Solutions', logo: 'CACI' },
        { name: 'SAIC', category: 'Government Services', logo: 'SAIC' }
      ]
    },
    {
      tier: 'Reseller Partners',
      description: 'Authorized resellers and distributors of Mission Sync AI',
      partners: [
        { name: 'Carahsoft', category: 'Government Reseller', logo: 'CRS' },
        { name: 'CDW-G', category: 'Technology Reseller', logo: 'CDW' },
        { name: 'GTSI', category: 'Federal Solutions', logo: 'GTSI' },
        { name: 'Immix Group', category: 'Channel Partner', logo: 'IMX' }
      ]
    }
  ];

  const partnerProgram = [
    {
      title: 'Certification Program',
      description: 'Comprehensive training and certification for technical teams',
      benefits: ['Technical certification', 'Sales training', 'Marketing support', 'Lead generation']
    },
    {
      title: 'Integration Support',
      description: 'Technical resources and support for complex integrations',
      benefits: ['API documentation', 'Technical consultation', 'Custom development', 'Testing environment']
    },
    {
      title: 'Go-to-Market Support',
      description: 'Marketing and sales resources to accelerate partner success',
      benefits: ['Joint marketing campaigns', 'Sales collateral', 'Co-branded materials', 'Event participation']
    }
  ];

  const partnerBenefits = [
    'Access to exclusive partner portal',
    'Priority technical support',
    'Joint go-to-market opportunities',
    'Revenue sharing programs',
    'Early access to new features',
    'Dedicated partner success manager'
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
              Partner Ecosystem
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Join our growing network of trusted partners who help organizations worldwide implement and optimize Mission Sync AI.
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
                Become a Partner
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
                Partner Portal
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Partner Tiers */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Our Partner Network
          </Typography>
          {partnerTiers.map((tier, tierIndex) => (
            <Box key={tierIndex} sx={{ mb: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                {tier.tier}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {tier.description}
              </Typography>
              <Grid container spacing={3}>
                {tier.partners.map((partner, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 15px 30px rgba(102, 126, 234, 0.2)'
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: '#667eea',
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {partner.logo}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {partner.name}
                      </Typography>
                      <Chip
                        label={partner.category}
                        size="small"
                        sx={{ bgcolor: 'grey.100' }}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Container>

        {/* Partner Program */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Partner Program Benefits
            </Typography>
            <Grid container spacing={4}>
              {partnerProgram.map((program, index) => (
                <Grid item xs={12} md={4} key={index}>
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
                    <Handshake sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {program.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {program.description}
                    </Typography>
                    <Box>
                      {program.benefits.map((benefit, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircle sx={{ color: '#4caf50', fontSize: 16, mr: 1 }} />
                          <Typography variant="body2">
                            {benefit}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Partnership Benefits */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                Why Partner with Mission Sync AI?
              </Typography>
              <Typography variant="body1" paragraph>
                Join a thriving ecosystem of partners who are transforming military operations worldwide. Our comprehensive partner program provides the tools, training, and support you need to succeed.
              </Typography>
              <Box sx={{ mb: 4 }}>
                {partnerBenefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="body1">
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  py: 1.5
                }}
              >
                Apply to Become a Partner
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Business sx={{ fontSize: 120, color: '#667eea', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  200+
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Trusted Partners Worldwide
                </Typography>
              </Box>
            </Grid>
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
              Ready to Partner with Us?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Join our partner ecosystem and help organizations worldwide modernize their operations
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
                Start Partnership Application
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
                Contact Partner Team
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}