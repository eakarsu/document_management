'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, AutoAwesome, Speed, Security, CloudSync, Analytics, Group, Extension } from '@mui/icons-material';

export default function FeaturesPage() {
  const features = [
    {
      icon: <AutoAwesome />,
      title: 'AI-Powered Automation',
      description: 'Intelligent document processing with machine learning',
      benefits: [
        'Auto-categorization of documents',
        'Smart content extraction',
        'Predictive workflow routing',
        'Anomaly detection'
      ]
    },
    {
      icon: <Speed />,
      title: 'Rapid Deployment',
      description: 'Get up and running in minutes, not months',
      benefits: [
        'One-click deployment',
        'Pre-configured templates',
        'Instant scalability',
        'Zero downtime updates'
      ]
    },
    {
      icon: <Security />,
      title: 'Military-Grade Security',
      description: 'Built to meet the highest security standards',
      benefits: [
        'End-to-end encryption',
        'FIPS 140-2 compliance',
        'CAC/PIV authentication',
        'Audit logging'
      ]
    },
    {
      icon: <CloudSync />,
      title: 'Cloud & On-Premise',
      description: 'Flexible deployment options for any environment',
      benefits: [
        'Hybrid cloud support',
        'Air-gapped deployment',
        'Multi-region backup',
        'Disaster recovery'
      ]
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Real-time insights and reporting',
      benefits: [
        'Custom dashboards',
        'Predictive analytics',
        'Performance metrics',
        'Trend analysis'
      ]
    },
    {
      icon: <Group />,
      title: 'Collaboration Tools',
      description: 'Work together seamlessly across units',
      benefits: [
        'Real-time co-authoring',
        'Version control',
        'Comment threads',
        'Task assignment'
      ]
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
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
              Powerful Features for Modern Military Operations
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Every feature designed with military precision and operational excellence in mind
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Start Free Trial
            </Button>
          </Container>
        </Box>

        {/* Features Grid */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
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
                          <Check sx={{ color: '#667eea', fontSize: 20 }} />
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

        {/* Integration Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Seamless Integrations
            </Typography>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Connect with Your Existing Systems
                </Typography>
                <Typography variant="body1" paragraph>
                  Mission Sync AI integrates seamlessly with military and enterprise systems you already use.
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Extension sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Microsoft Office 365"
                      secondary="Full integration with Word, Excel, and SharePoint"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Extension sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="CAC/PIV Systems"
                      secondary="Native support for military authentication"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Extension sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="SIPR Network"
                      secondary="Secure deployment on classified networks"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Extension sx={{ color: '#667eea' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Custom APIs"
                      secondary="RESTful APIs for custom integrations"
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
                  <Chip label="SharePoint" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="Office 365" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="Active Directory" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="Oracle" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="SAP" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="Salesforce" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="AWS GovCloud" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
                  <Chip label="Azure Government" sx={{ py: 3, px: 2, fontSize: '1rem' }} />
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
              Ready to Transform Your Document Workflow?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Join hundreds of military organizations already using Mission Sync AI
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
                Start Free Trial
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
                Schedule Demo
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}