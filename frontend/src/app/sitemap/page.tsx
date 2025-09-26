'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, List, ListItem, ListItemText } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AccountTree } from '@mui/icons-material';
import Link from 'next/link';

export default function SitemapPage() {
  const siteStructure = [
    {
      section: 'Main Pages',
      links: [
        { name: 'Home', path: '/' },
        { name: 'Features', path: '/features' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' }
      ]
    },
    {
      section: 'Product',
      links: [
        { name: 'Security', path: '/security' },
        { name: 'Roadmap', path: '/roadmap' },
        { name: 'Changelog', path: '/changelog' }
      ]
    },
    {
      section: 'Solutions',
      links: [
        { name: 'Air Force', path: '/solutions/air-force' },
        { name: 'Army', path: '/solutions/army' },
        { name: 'Navy', path: '/solutions/navy' },
        { name: 'Space Force', path: '/solutions/space-force' },
        { name: 'Joint Operations', path: '/solutions/joint-ops' }
      ]
    },
    {
      section: 'Resources',
      links: [
        { name: 'Documentation', path: '/documentation' },
        { name: 'API Reference', path: '/api-reference' },
        { name: 'Blog', path: '/blog' },
        { name: 'Webinars', path: '/webinars' },
        { name: 'Case Studies', path: '/case-studies' }
      ]
    },
    {
      section: 'Support',
      links: [
        { name: 'Help Center', path: '/help' },
        { name: 'Status', path: '/status' },
        { name: 'Demo', path: '/demo' },
        { name: 'Integrations', path: '/integrations' }
      ]
    },
    {
      section: 'Legal',
      links: [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Compliance', path: '/compliance' },
        { name: 'Accessibility', path: '/accessibility' },
        { name: 'Cookie Settings', path: '/cookies' }
      ]
    }
  ];

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AccountTree sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700 }}>Site Map</Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px' }}>
              Navigate through all pages and sections of the Mission Sync AI website.
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={4}>
            {siteStructure.map((section, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#667eea' }}>
                    {section.section}
                  </Typography>
                  <List dense>
                    {section.links.map((link, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <Link href={link.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <ListItemText 
                            primary={link.name} 
                            sx={{ 
                              '& .MuiListItemText-primary': { 
                                cursor: 'pointer',
                                '&:hover': { color: '#667eea', textDecoration: 'underline' }
                              }
                            }}
                          />
                        </Link>
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      <Footer />
    </>
  );
}