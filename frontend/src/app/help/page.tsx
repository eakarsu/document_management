'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, TextField, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, ExpandMore, HelpOutline, Chat, Email, Phone } from '@mui/icons-material';

export default function HelpPage() {
  const helpCategories = [
    {
      title: 'Getting Started',
      articles: [
        'How to create your first document',
        'Setting up user accounts and permissions',
        'Basic workflow configuration',
        'Mobile app installation guide'
      ]
    },
    {
      title: 'Document Management',
      articles: [
        'Creating and editing documents',
        'Version control and history',
        'Document sharing and collaboration',
        'Advanced formatting options'
      ]
    },
    {
      title: 'Workflow Management',
      articles: [
        'Building custom workflows',
        'Approval processes and routing',
        'Automated notifications',
        'Workflow troubleshooting'
      ]
    },
    {
      title: 'Security & Compliance',
      articles: [
        'CAC/PIV authentication setup',
        'Classification marking guidelines',
        'Audit logging and reporting',
        'Data encryption and protection'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page, or contact your system administrator for assistance.'
    },
    {
      question: 'Can I access Mission Sync AI on mobile devices?',
      answer: 'Yes, Mission Sync AI has a mobile app available for iOS and Android, as well as a mobile-responsive web interface.'
    },
    {
      question: 'How do I configure CAC/PIV authentication?',
      answer: 'CAC/PIV authentication is configured by your system administrator. Contact your IT support team for assistance with card reader setup.'
    },
    {
      question: 'What file formats are supported for document upload?',
      answer: 'Mission Sync AI supports common formats including PDF, DOCX, XLSX, PPTX, TXT, and image formats (JPG, PNG, GIF).'
    },
    {
      question: 'How do I create a new workflow?',
      answer: 'Navigate to the Workflow Builder from your dashboard, select "Create New Workflow," and follow the step-by-step wizard to configure your process.'
    },
    {
      question: 'Is my data secure and compliant?',
      answer: 'Yes, Mission Sync AI meets FISMA, FedRAMP, and DoD security requirements with end-to-end encryption and comprehensive audit logging.'
    }
  ];

  const supportChannels = [
    {
      icon: <Chat />,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: '24/7 Support',
      action: 'Start Chat'
    },
    {
      icon: <Email />,
      title: 'Email Support',
      description: 'Send us a detailed message about your issue',
      availability: 'Response within 2 hours',
      action: 'Send Email'
    },
    {
      icon: <Phone />,
      title: 'Phone Support',
      description: 'Speak directly with a support specialist',
      availability: 'Mon-Fri 8AM-8PM EST',
      action: 'Call Now'
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
              Help Center
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Find answers to your questions, get help with common tasks, and connect with our support team.
            </Typography>
            
            {/* Search Bar */}
            <Box sx={{ maxWidth: '600px', mb: 4 }}>
              <TextField
                fullWidth
                placeholder="Search for help articles..."
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
              Browse All Articles
            </Button>
          </Container>
        </Box>

        {/* Help Categories */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Browse by Category
          </Typography>
          <Grid container spacing={4}>
            {helpCategories.map((category, index) => (
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
                  <HelpOutline sx={{ color: '#667eea', fontSize: 48, mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    {category.title}
                  </Typography>
                  <Box>
                    {category.articles.map((article, idx) => (
                      <Typography
                        key={idx}
                        variant="body1"
                        sx={{
                          color: '#667eea',
                          cursor: 'pointer',
                          mb: 1,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {article}
                      </Typography>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* FAQs */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Frequently Asked Questions
            </Typography>
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3, bgcolor: 'white' }}>
                    <Typography variant="body1">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Support Channels */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Need More Help?
          </Typography>
          <Grid container spacing={4}>
            {supportChannels.map((channel, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 30px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ color: '#667eea', mb: 2 }}>
                    {React.cloneElement(channel.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {channel.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {channel.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: '#667eea', fontWeight: 600 }}>
                    {channel.availability}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      px: 3,
                      py: 1
                    }}
                  >
                    {channel.action}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Community Section */}
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
              Join Our Community
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Connect with other Mission Sync AI users, share best practices, and get peer support
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
                Join Community Forum
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
                Request Training
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}