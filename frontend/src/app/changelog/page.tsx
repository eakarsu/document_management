'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ExpandMore, NewReleases, BugReport, TipsAndUpdates, Security } from '@mui/icons-material';

export default function ChangelogPage() {
  const releases = [
    {
      version: 'v2.4.0',
      date: 'December 15, 2024',
      type: 'major',
      changes: [
        { type: 'feature', description: 'Enhanced AI workflow engine with GPT-4 integration' },
        { type: 'feature', description: 'New real-time collaboration features' },
        { type: 'feature', description: 'Advanced document classification system' },
        { type: 'improvement', description: 'Improved mobile responsiveness across all pages' },
        { type: 'security', description: 'Enhanced encryption for data in transit' },
        { type: 'fix', description: 'Fixed issue with document export formatting' }
      ]
    },
    {
      version: 'v2.3.2',
      date: 'November 28, 2024',
      type: 'patch',
      changes: [
        { type: 'fix', description: 'Resolved authentication timeout issues' },
        { type: 'fix', description: 'Fixed CAC/PIV card reader compatibility' },
        { type: 'improvement', description: 'Performance optimizations for large documents' }
      ]
    },
    {
      version: 'v2.3.1',
      date: 'November 15, 2024',
      type: 'patch',
      changes: [
        { type: 'fix', description: 'Fixed workflow approval notification delays' },
        { type: 'fix', description: 'Corrected timezone display in audit logs' },
        { type: 'improvement', description: 'Updated security certificates' }
      ]
    },
    {
      version: 'v2.3.0',
      date: 'October 30, 2024',
      type: 'minor',
      changes: [
        { type: 'feature', description: 'New analytics dashboard with custom metrics' },
        { type: 'feature', description: 'Bulk document processing capabilities' },
        { type: 'improvement', description: 'Enhanced search functionality with filters' },
        { type: 'improvement', description: 'Updated user interface with Material Design 3' },
        { type: 'security', description: 'Implemented additional FISMA compliance measures' }
      ]
    },
    {
      version: 'v2.2.1',
      date: 'October 10, 2024',
      type: 'patch',
      changes: [
        { type: 'fix', description: 'Resolved PDF export formatting issues' },
        { type: 'fix', description: 'Fixed drag-and-drop file upload on Safari' },
        { type: 'improvement', description: 'Optimized database queries for better performance' }
      ]
    },
    {
      version: 'v2.2.0',
      date: 'September 25, 2024',
      type: 'minor',
      changes: [
        { type: 'feature', description: 'Integration with Microsoft Office 365' },
        { type: 'feature', description: 'Advanced workflow templates library' },
        { type: 'improvement', description: 'Enhanced document version control' },
        { type: 'security', description: 'Multi-factor authentication improvements' }
      ]
    }
  ];

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major': return '#f44336';
      case 'minor': return '#ff9800';
      case 'patch': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <NewReleases sx={{ color: '#4caf50' }} />;
      case 'improvement': return <TipsAndUpdates sx={{ color: '#2196f3' }} />;
      case 'fix': return <BugReport sx={{ color: '#ff9800' }} />;
      case 'security': return <Security sx={{ color: '#f44336' }} />;
      default: return <NewReleases />;
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'New Feature';
      case 'improvement': return 'Improvement';
      case 'fix': return 'Bug Fix';
      case 'security': return 'Security';
      default: return type;
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
              Changelog
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Stay up to date with the latest features, improvements, and fixes in Mission Sync AI.
            </Typography>
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
              Subscribe to Updates
            </Button>
          </Container>
        </Box>

        {/* Release History */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Release History
          </Typography>

          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
            {releases.map((release, index) => (
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
                    bgcolor: 'grey.50',
                    borderRadius: '8px 8px 0 0',
                    '&.Mui-expanded': {
                      borderRadius: '8px 8px 0 0'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Chip
                      label={release.version}
                      sx={{
                        bgcolor: getVersionTypeColor(release.type),
                        color: 'white',
                        fontWeight: 600,
                        mr: 2
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                      {release.date}
                    </Typography>
                    <Chip
                      label={`${release.changes.length} changes`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    {release.changes.map((change, changeIndex) => (
                      <Grid item xs={12} key={changeIndex}>
                        <Card
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'grey.100',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#667eea',
                              transform: 'translateX(5px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 2 }}>
                              {getChangeTypeIcon(change.type)}
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Chip
                                  label={getChangeTypeLabel(change.type)}
                                  size="small"
                                  sx={{ mr: 1, fontSize: '0.75rem' }}
                                />
                              </Box>
                              <Typography variant="body1">
                                {change.description}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>

        {/* Stats Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Development Statistics
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                    24
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Releases This Year
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                    156
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    New Features
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                    89
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Bug Fixes
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#f44336', mb: 1 }}>
                    12
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Security Updates
                  </Typography>
                </Card>
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
              Stay Updated
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Get notified about new releases, features, and important updates
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
                Subscribe to Updates
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
                View Roadmap
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}