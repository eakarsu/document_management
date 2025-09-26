'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, LinearProgress } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, Warning, Error, Schedule, Cloud, Security, Speed } from '@mui/icons-material';

export default function StatusPage() {
  const systemStatus = [
    {
      service: 'Core Platform',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '145ms',
      lastIncident: 'None in the last 30 days'
    },
    {
      service: 'Document Storage',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '89ms',
      lastIncident: 'None in the last 30 days'
    },
    {
      service: 'Workflow Engine',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '201ms',
      lastIncident: 'None in the last 30 days'
    },
    {
      service: 'Authentication Service',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '67ms',
      lastIncident: 'None in the last 30 days'
    },
    {
      service: 'API Gateway',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '112ms',
      lastIncident: 'None in the last 30 days'
    },
    {
      service: 'Mobile App Services',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '178ms',
      lastIncident: 'None in the last 30 days'
    }
  ];

  const recentIncidents = [
    {
      date: 'December 10, 2024',
      title: 'Scheduled Maintenance - Authentication Service',
      status: 'resolved',
      duration: '2 hours',
      description: 'Routine security updates and performance optimizations were applied to the authentication service.'
    },
    {
      date: 'November 28, 2024',
      title: 'Intermittent API Gateway Delays',
      status: 'resolved',
      duration: '45 minutes',
      description: 'Some users experienced slower response times due to increased traffic. Issue resolved by scaling infrastructure.'
    },
    {
      date: 'November 15, 2024',
      title: 'Mobile App Sync Issues',
      status: 'resolved',
      duration: '1.5 hours',
      description: 'Mobile app users experienced synchronization delays. Fixed with a server-side configuration update.'
    }
  ];

  const upcomingMaintenance = [
    {
      date: 'January 20, 2025',
      time: '2:00 AM - 4:00 AM EST',
      service: 'Core Platform',
      description: 'Routine security updates and performance enhancements'
    },
    {
      date: 'February 1, 2025',
      time: '1:00 AM - 3:00 AM EST',
      service: 'Document Storage',
      description: 'Infrastructure upgrade for improved performance'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'degraded': return <Warning sx={{ color: '#ff9800' }} />;
      case 'outage': return <Error sx={{ color: '#f44336' }} />;
      default: return <Schedule sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'outage': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded Performance';
      case 'outage': return 'Service Outage';
      default: return 'Unknown';
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                All Systems Operational
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Monitor the real-time status of Mission Sync AI services and get updates on any incidents or maintenance.
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

        {/* Overall System Health */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                  99.98%
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Uptime
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Speed sx={{ fontSize: 48, color: '#2196f3', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3', mb: 1 }}>
                  132ms
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Average Response Time
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Security sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                  0
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Security Incidents (30 days)
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* Service Status */}
        <Container maxWidth="lg" sx={{ pb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Service Status
          </Typography>
          <Grid container spacing={3}>
            {systemStatus.map((service, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ p: 3 }}>
                  <Grid container alignItems="center" spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(service.status)}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {service.service}
                          </Typography>
                          <Chip
                            label={getStatusText(service.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(service.status),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {service.uptime}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Response Time
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {service.responseTime}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Typography variant="body2" color="text.secondary">
                        Last Incident
                      </Typography>
                      <Typography variant="body1">
                        {service.lastIncident}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Recent Incidents */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Recent Incidents
            </Typography>
            <Grid container spacing={3}>
              {recentIncidents.map((incident, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircle sx={{ color: '#4caf50', mr: 2 }} />
                      <Chip
                        label="RESOLVED"
                        size="small"
                        sx={{
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                          mr: 2
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {incident.date}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {incident.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Duration: {incident.duration}
                    </Typography>
                    <Typography variant="body1">
                      {incident.description}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Upcoming Maintenance */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
            Scheduled Maintenance
          </Typography>
          <Grid container spacing={3}>
            {upcomingMaintenance.map((maintenance, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ color: '#ff9800', mr: 2 }} />
                    <Chip
                      label="SCHEDULED"
                      size="small"
                      sx={{
                        bgcolor: '#ff9800',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {maintenance.service} Maintenance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {maintenance.date} • {maintenance.time}
                  </Typography>
                  <Typography variant="body1">
                    {maintenance.description}
                  </Typography>
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
              Stay Informed
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Subscribe to status updates and get notified about any incidents or maintenance
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
                Report an Issue
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}