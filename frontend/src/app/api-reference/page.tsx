'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Code, Api, ExpandMore, Security, Speed, Extension } from '@mui/icons-material';

export default function ApiReferencePage() {
  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/documents',
      description: 'Retrieve all documents',
      parameters: ['limit', 'offset', 'filter']
    },
    {
      method: 'POST',
      endpoint: '/api/documents',
      description: 'Create a new document',
      parameters: ['title', 'content', 'workflow_id']
    },
    {
      method: 'PUT',
      endpoint: '/api/documents/{id}',
      description: 'Update an existing document',
      parameters: ['title', 'content', 'status']
    },
    {
      method: 'DELETE',
      endpoint: '/api/documents/{id}',
      description: 'Delete a document',
      parameters: ['force']
    },
    {
      method: 'GET',
      endpoint: '/api/workflows',
      description: 'List all workflows',
      parameters: ['type', 'status']
    },
    {
      method: 'POST',
      endpoint: '/api/workflows/{id}/execute',
      description: 'Execute a workflow',
      parameters: ['document_id', 'parameters']
    }
  ];

  const sdks = [
    {
      name: 'JavaScript/Node.js',
      description: 'Official SDK for JavaScript and Node.js applications',
      installation: 'npm install @missionsync/sdk'
    },
    {
      name: 'Python',
      description: 'Python SDK with full API coverage',
      installation: 'pip install missionsync-python'
    },
    {
      name: 'C# .NET',
      description: '.NET SDK for enterprise integrations',
      installation: 'Install-Package MissionSync.NET'
    },
    {
      name: 'Java',
      description: 'Java SDK for enterprise applications',
      installation: 'com.missionsync:java-sdk:1.0.0'
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#4caf50';
      case 'POST': return '#2196f3';
      case 'PUT': return '#ff9800';
      case 'DELETE': return '#f44336';
      default: return '#9e9e9e';
    }
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
              API Reference
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Complete API documentation for Mission Sync AI. Build powerful integrations with our RESTful APIs and SDKs.
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
                Get API Key
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
                View Examples
              </Button>
            </Box>
          </Container>
        </Box>

        {/* API Features */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            API Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Api sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  RESTful Design
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Standard HTTP methods and status codes with JSON responses for easy integration.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Security sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Secure Authentication
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  OAuth 2.0 and API key authentication with role-based access controls.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Speed sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  High Performance
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Optimized endpoints with pagination, filtering, and caching for maximum performance.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* API Endpoints */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              API Endpoints
            </Typography>
            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
              {apiEndpoints.map((endpoint, index) => (
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
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Chip
                        label={endpoint.method}
                        sx={{
                          bgcolor: getMethodColor(endpoint.method),
                          color: 'white',
                          fontWeight: 600,
                          mr: 2,
                          minWidth: '70px'
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace', flexGrow: 1 }}>
                        {endpoint.endpoint}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {endpoint.description}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Parameters:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {endpoint.parameters.map((param, idx) => (
                        <Chip
                          key={idx}
                          label={param}
                          size="small"
                          sx={{ bgcolor: 'white', fontFamily: 'monospace' }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Container>
        </Box>

        {/* SDKs Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Official SDKs
          </Typography>
          <Grid container spacing={4}>
            {sdks.map((sdk, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 30px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Code sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {sdk.name}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {sdk.description}
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                    <Typography variant="body2">
                      {sdk.installation}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
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
              Start Building Today
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Get your API key and start integrating with Mission Sync AI in minutes
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
                Get API Key
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
                View Examples
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}