'use client';

import React from 'react';
import { Box, Container, Typography, Card, List, ListItem, ListItemText, Grid } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Gavel, Description, Security } from '@mui/icons-material';

export default function TermsPage() {
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
              <Gavel sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                Terms of Service
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              These terms govern your use of Mission Sync AI services. Please read them carefully before using our platform.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Last updated: December 15, 2024
            </Typography>
          </Container>
        </Box>

        {/* Terms Content */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Acceptance of Terms
                </Typography>
                <Typography variant="body1" paragraph>
                  By accessing and using Mission Sync AI, you accept and agree to be bound by the terms and provision of this agreement.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Service Agreement
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="You agree to use the service in compliance with all applicable laws and regulations" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="You are responsible for maintaining the confidentiality of your account" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="You agree not to use the service for any unauthorized or illegal purpose" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  User Responsibilities
                </Typography>
                <Typography variant="body1" paragraph>
                  As a user of Mission Sync AI, you are responsible for proper use of the platform and compliance with military and government regulations.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Your Obligations
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Protect classified and sensitive information according to established protocols" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use appropriate security clearance levels for document access" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Report any security incidents or unauthorized access immediately" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Maintain current contact and clearance information" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Service Availability
                </Typography>
                <Typography variant="body1" paragraph>
                  We strive to maintain high availability but cannot guarantee uninterrupted service due to maintenance, security updates, or unforeseen circumstances.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Service Level
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Target uptime of 99.9% with planned maintenance notifications" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Security updates may require temporary service interruptions" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Emergency maintenance may occur without advance notice" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Limitation of Liability
                </Typography>
                <Typography variant="body1" paragraph>
                  Mission Sync AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
                </Typography>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Contact Information
                </Typography>
                <Typography variant="body1" paragraph>
                  For questions about these Terms of Service, please contact our Legal Department:
                </Typography>
                
                <Card sx={{ p: 3 }}>
                  <Typography variant="body1">
                    <strong>Legal Department</strong><br />
                    Mission Sync AI<br />
                    Email: legal@missionsync.ai<br />
                    Phone: 1-800-MISSION
                  </Typography>
                </Card>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, position: 'sticky', top: 100 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Key Terms
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Description sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">Government Use</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    These terms are specifically designed for military and government use cases.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">Security First</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    All terms prioritize security and compliance with military regulations.
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Gavel sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">Regular Updates</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Terms are reviewed and updated regularly to reflect changes in regulations.
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </>
  );
}