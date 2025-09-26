'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Security, Shield, Lock } from '@mui/icons-material';

export default function PrivacyPage() {
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
              <Shield sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                Privacy Policy
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Your privacy and data security are our top priorities. Learn how we collect, use, and protect your information.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Last updated: December 15, 2024
            </Typography>
          </Container>
        </Box>

        {/* Privacy Content */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Information We Collect
                </Typography>
                <Typography variant="body1" paragraph>
                  Mission Sync AI collects information necessary to provide our document management and workflow services to military and government organizations.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Personal Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Account information (name, email, military ID)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Professional information (rank, unit, clearance level)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Document access and usage data" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="System logs and security information" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  How We Use Your Information
                </Typography>
                <Typography variant="body1" paragraph>
                  We use collected information solely for providing and improving our services, ensuring security, and maintaining compliance with military and government regulations.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Primary Uses
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Service delivery and platform functionality" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Security monitoring and threat detection" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Compliance with government regulations" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Technical support and troubleshooting" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Data Security
                </Typography>
                <Typography variant="body1" paragraph>
                  We implement military-grade security measures to protect your information, including end-to-end encryption, access controls, and continuous monitoring.
                </Typography>
                
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Security Measures
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="AES-256 encryption for data at rest and in transit" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Multi-factor authentication and CAC/PIV integration" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Regular security audits and penetration testing" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="FISMA and FedRAMP compliance" />
                    </ListItem>
                  </List>
                </Card>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                  Contact Information
                </Typography>
                <Typography variant="body1" paragraph>
                  For questions about this Privacy Policy or our data practices, please contact our Privacy Officer:
                </Typography>
                
                <Card sx={{ p: 3 }}>
                  <Typography variant="body1">
                    <strong>Privacy Officer</strong><br />
                    Mission Sync AI<br />
                    Email: privacy@missionsync.ai<br />
                    Phone: 1-800-MISSION
                  </Typography>
                </Card>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, position: 'sticky', top: 100 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Privacy Highlights
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">Military-Grade Security</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your data is protected with the same security standards used by the Department of Defense.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Lock sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">No Data Sales</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    We never sell, rent, or share your personal information with third parties for marketing purposes.
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Shield sx={{ color: '#667eea', mr: 2 }} />
                    <Typography variant="h6">Compliance Ready</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Our privacy practices meet all government and military compliance requirements.
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