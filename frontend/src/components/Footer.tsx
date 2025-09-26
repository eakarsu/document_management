'use client';

import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Divider } from '@mui/material';
import { Facebook, Twitter, LinkedIn, YouTube, Instagram } from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';

export const Footer: React.FC = () => {
  const footerLinkStyle = {
    color: '#9CA3AF',
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'block',
    marginBottom: '8px',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#667eea'
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a1a2e',
        color: 'white',
        pt: 8,
        pb: 4,
        mt: 'auto'
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} lg={3}>
            <Box sx={{ mb: 2 }}>
              <Image
                src="/images/missionsync/logo-professional.svg"
                alt="Mission Sync AI"
                width={200}
                height={50}
              />
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'grey.400' }}>
              Empowering military organizations with AI-driven document management and workflow automation solutions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white', '&:hover': { color: '#667eea' } }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white', '&:hover': { color: '#667eea' } }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white', '&:hover': { color: '#667eea' } }}>
                <LinkedIn />
              </IconButton>
              <IconButton sx={{ color: 'white', '&:hover': { color: '#667eea' } }}>
                <YouTube />
              </IconButton>
              <IconButton sx={{ color: 'white', '&:hover': { color: '#667eea' } }}>
                <Instagram />
              </IconButton>
            </Box>
          </Grid>

          {/* Product */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Product
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/features" style={footerLinkStyle}>Features</Link>
              <Link href="/pricing" style={footerLinkStyle}>Pricing</Link>
              <Link href="/security" style={footerLinkStyle}>Security</Link>
              <Link href="/roadmap" style={footerLinkStyle}>Roadmap</Link>
              <Link href="/changelog" style={footerLinkStyle}>Changelog</Link>
            </Box>
          </Grid>

          {/* Solutions */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Solutions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/solutions/air-force" style={footerLinkStyle}>Air Force</Link>
              <Link href="/solutions/army" style={footerLinkStyle}>Army</Link>
              <Link href="/solutions/navy" style={footerLinkStyle}>Navy</Link>
              <Link href="/solutions/space-force" style={footerLinkStyle}>Space Force</Link>
              <Link href="/solutions/joint-ops" style={footerLinkStyle}>Joint Ops</Link>
            </Box>
          </Grid>

          {/* Resources */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/documentation" style={footerLinkStyle}>Documentation</Link>
              <Link href="/api-reference" style={footerLinkStyle}>API Reference</Link>
              <Link href="/blog" style={footerLinkStyle}>Blog</Link>
              <Link href="/webinars" style={footerLinkStyle}>Webinars</Link>
              <Link href="/case-studies" style={footerLinkStyle}>Case Studies</Link>
            </Box>
          </Grid>

          {/* Company */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/about" style={footerLinkStyle}>About</Link>
              <Link href="/careers" style={footerLinkStyle}>Careers</Link>
              <Link href="/partners" style={footerLinkStyle}>Partners</Link>
              <Link href="/press" style={footerLinkStyle}>Press</Link>
              <Link href="/contact" style={footerLinkStyle}>Contact</Link>
            </Box>
          </Grid>

          {/* Support */}
          <Grid item xs={6} sm={4} md={1}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/help" style={footerLinkStyle}>Help Center</Link>
              <Link href="/status" style={footerLinkStyle}>Status</Link>
              <Link href="/demo" style={footerLinkStyle}>Demo</Link>
              <Link href="/integrations" style={footerLinkStyle}>Integrations</Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

        {/* Bottom Section */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              © 2024 Mission Sync AI. All rights reserved.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Link href="/privacy" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Privacy Policy
              </Link>
              <Link href="/terms" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Terms of Service
              </Link>
              <Link href="/compliance" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Compliance
              </Link>
              <Link href="/sitemap" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Sitemap
              </Link>
              <Link href="/accessibility" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Accessibility
              </Link>
              <Link href="/cookies" style={{ ...footerLinkStyle, marginBottom: 0, display: 'inline' }}>
                Cookie Settings
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;