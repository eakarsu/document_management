'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText, TextField, InputAdornment } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Book, Search, GetApp, PlayArrow, Code, Security } from '@mui/icons-material';

export default function DocumentationPage() {
  const docSections = [
    {
      icon: <PlayArrow />,
      title: 'Getting Started',
      description: 'Quick start guides and initial setup instructions',
      links: ['Installation Guide', 'First Steps', 'Basic Configuration', 'User Onboarding']
    },
    {
      icon: <Book />,
      title: 'User Guides',
      description: 'Comprehensive guides for end users and administrators',
      links: ['Document Management', 'Workflow Creation', 'User Administration', 'Advanced Features']
    },
    {
      icon: <Code />,
      title: 'API Documentation',
      description: 'Technical documentation for developers and integrators',
      links: ['REST API Reference', 'SDK Documentation', 'Integration Examples', 'Webhook Setup']
    },
    {
      icon: <Security />,
      title: 'Security & Compliance',
      description: 'Security configuration and compliance guidelines',
      links: ['Security Best Practices', 'Compliance Requirements', 'Audit Configuration', 'Access Controls']
    }
  ];

  const popularDocs = [
    'Quick Start Guide',
    'Document Workflow Setup',
    'CAC/PIV Authentication',
    'API Integration Guide',
    'Mobile App Configuration',
    'Troubleshooting Common Issues'
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
              Documentation
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Everything you need to know about Mission Sync AI - from getting started to advanced configuration and API integration.
            </Typography>
            
            {/* Search Bar */}
            <Box sx={{ maxWidth: '600px', mb: 4 }}>
              <TextField
                fullWidth
                placeholder="Search documentation..."
                variant="outlined"
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { border: 'none' },
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'grey.500' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
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
              View Quick Start Guide
            </Button>
          </Container>
        </Box>

        {/* Documentation Sections */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Documentation Sections
          </Typography>
          <Grid container spacing={4}>
            {docSections.map((section, index) => (
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
                    {React.cloneElement(section.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {section.description}
                  </Typography>
                  <List dense>
                    {section.links.map((link, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <GetApp sx={{ color: '#667eea', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={link}
                          sx={{
                            '& .MuiListItemText-primary': {
                              color: '#667eea',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Popular Documentation */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Popular Documentation
            </Typography>
            <Grid container spacing={3}>
              {popularDocs.map((doc, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: '#667eea',
                        color: 'white',
                        transform: 'translateY(-5px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Book sx={{ mr: 2, fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {doc}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Support Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
              Need Additional Help?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
              Can't find what you're looking for? Our support team is here to help.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  py: 1.5
                }}
              >
                Contact Support
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  px: 4,
                  py: 1.5
                }}
              >
                Join Community
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
}