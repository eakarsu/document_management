'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  useTheme,
  alpha,
  Button,
  Divider,
  Avatar
} from '@mui/material';
import {
  Article,
  Download,
  Email,
  CalendarToday,
  TrendingUp,
  EmojiEvents,
  Business,
  CheckCircle
} from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PressPage: React.FC = () => {
  const theme = useTheme();

  const pressReleases = [
    {
      id: '1',
      title: 'Mission Sync AI Secures $50M Series B to Accelerate Military AI Adoption',
      date: '2024-03-15',
      excerpt: 'Leading defense technology company raises significant funding to expand AI-powered document management solutions for military organizations.',
      category: 'Funding',
      featured: true
    },
    {
      id: '2',
      title: 'U.S. Air Force Selects Mission Sync AI for Multi-Base Documentation Platform',
      date: '2024-02-28',
      excerpt: 'Multi-million dollar contract will streamline document workflows across 15 Air Force installations nationwide.',
      category: 'Partnerships',
      featured: true
    },
    {
      id: '3',
      title: 'Mission Sync AI Achieves FedRAMP Moderate Authorization',
      date: '2024-02-15',
      excerpt: 'Security milestone enables expanded deployment across federal agencies and defense organizations.',
      category: 'Security',
      featured: false
    },
    {
      id: '4',
      title: 'Company Named to Defense Innovation Unit\'s Commercial Solutions Opening',
      date: '2024-01-30',
      excerpt: 'Recognition highlights Mission Sync AI\'s contribution to military modernization efforts.',
      category: 'Awards',
      featured: false
    },
    {
      id: '5',
      title: 'Mission Sync AI Partners with Major Defense Contractors for Integrated Solutions',
      date: '2024-01-10',
      excerpt: 'Strategic partnerships with Lockheed Martin and Raytheon expand platform capabilities.',
      category: 'Partnerships',
      featured: false
    }
  ];

  const mediaKit = [
    {
      title: 'Company Logo Package',
      description: 'High-resolution logos in various formats (PNG, SVG, EPS)',
      size: '2.4 MB',
      type: 'ZIP'
    },
    {
      title: 'Executive Headshots',
      description: 'Professional photos of leadership team',
      size: '8.7 MB',
      type: 'ZIP'
    },
    {
      title: 'Product Screenshots',
      description: 'Platform interface and feature demonstrations',
      size: '15.2 MB',
      type: 'ZIP'
    },
    {
      title: 'Company Fact Sheet',
      description: 'Key statistics, timeline, and company overview',
      size: '1.1 MB',
      type: 'PDF'
    }
  ];

  const awards = [
    {
      year: '2024',
      title: 'Defense Innovation Award',
      organization: 'National Defense Industrial Association',
      description: 'Recognition for advancing military document automation'
    },
    {
      year: '2023',
      title: 'Federal 100 Award',
      organization: 'Federal Computer Week',
      description: 'Honoring technology leaders who impact federal IT'
    },
    {
      year: '2023',
      title: 'GovTech 100',
      organization: 'Government Technology Magazine',
      description: 'Listed among top companies serving government sector'
    },
    {
      year: '2022',
      title: 'Emerging Technology Company',
      organization: 'Defense Technology Review',
      description: 'Recognized for innovative AI applications in defense'
    }
  ];

  const leadership = [
    {
      name: 'Sarah Chen',
      title: 'CEO & Co-Founder',
      bio: 'Former Google VP with 15+ years in enterprise software and AI',
      avatar: '/api/placeholder/80/80'
    },
    {
      name: 'Col. Michael Torres (Ret.)',
      title: 'CTO & Co-Founder',
      bio: '20-year Air Force veteran and former Pentagon technology advisor',
      avatar: '/api/placeholder/80/80'
    },
    {
      name: 'Dr. Jennifer Walsh',
      title: 'VP of AI Research',
      bio: 'Former Stanford professor and DARPA researcher in machine learning',
      avatar: '/api/placeholder/80/80'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Header />
      <Box sx={{ pt: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            py: 10,
            background: `linear-gradient(135deg,
              ${alpha(theme.palette.primary.main, 0.03)} 0%,
              ${alpha('#667eea', 0.05)} 50%,
              ${alpha('#764ba2', 0.03)} 100%)`
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip
                label="PRESS & MEDIA"
                sx={{
                  mb: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Press & Media Center
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
                Stay informed about Mission Sync AI's latest news, announcements, and media resources. For press inquiries, please contact our media relations team.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Email />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5
                }}
              >
                Contact Media Relations
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Press Releases */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>
              Latest Press Releases
            </Typography>
            <Grid container spacing={4}>
              {pressReleases.map((release) => (
                <Grid item xs={12} md={release.featured ? 6 : 4} key={release.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      position: 'relative',
                      ...(release.featured && {
                        border: `2px solid ${theme.palette.primary.main}`,
                      }),
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    {release.featured && (
                      <Chip
                        label="Featured"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          fontWeight: 600
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 4 }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip label={release.category} size="small" variant="outlined" />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                          {formatDate(release.date)}
                        </Typography>
                      </Stack>
                      <Typography variant={release.featured ? "h5" : "h6"} sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3 }}>
                        {release.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                        {release.excerpt}
                      </Typography>
                      <Button
                        variant="outlined"
                        endIcon={<Article />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#667eea',
                          color: '#667eea'
                        }}
                      >
                        Read Full Release
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Company Stats */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>
              Mission Sync AI by the Numbers
            </Typography>
            <Grid container spacing={4}>
              {[
                { value: '$50M', label: 'Series B Funding Raised', icon: <TrendingUp /> },
                { value: '500+', label: 'Military Organizations', icon: <Business /> },
                { value: '1M+', label: 'Documents Processed', icon: <Article /> },
                { value: '99.9%', label: 'Uptime SLA', icon: <CheckCircle /> },
                { value: '150+', label: 'Team Members', icon: <Business /> },
                { value: '15+', label: 'Patents Filed', icon: <EmojiEvents /> }
              ].map((stat, index) => (
                <Grid item xs={6} md={2} key={index}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ color: '#667eea', mb: 2 }}>{stat.icon}</Box>
                    <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Media Kit */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                  Media Kit & Resources
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  Download high-resolution assets, company information, and executive materials for your stories and coverage.
                </Typography>
                <Stack spacing={3}>
                  {mediaKit.map((item, index) => (
                    <Card key={index} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {item.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.type} • {item.size}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            sx={{
                              ml: 2,
                              borderColor: '#667eea',
                              color: '#667eea',
                              textTransform: 'none'
                            }}
                          >
                            Download
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    Media Contacts
                  </Typography>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        General Media Inquiries
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        press@missionsync.ai
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        +1 (555) 123-4567
                      </Typography>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Product & Technology
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        tech-press@missionsync.ai
                      </Typography>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Executive Interviews
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        executives@missionsync.ai
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Awards & Recognition */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>
              Awards & Recognition
            </Typography>
            <Grid container spacing={4}>
              {awards.map((award, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EmojiEvents sx={{ color: '#667eea', mr: 2, fontSize: 32 }} />
                        <Chip label={award.year} color="primary" />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {award.title}
                      </Typography>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                        {award.organization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {award.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Leadership */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>
              Leadership Team
            </Typography>
            <Grid container spacing={4}>
              {leadership.map((leader, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Avatar
                        src={leader.avatar}
                        sx={{
                          width: 100,
                          height: 100,
                          mx: 'auto',
                          mb: 3,
                          border: `3px solid ${alpha('#667eea', 0.2)}`
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {leader.name}
                      </Typography>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                        {leader.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {leader.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Contact CTA */}
        <Box
          sx={{
            py: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                Ready to Cover Our Story?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                We're always happy to speak with journalists and provide additional information about our mission to transform military documentation.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Email />}
                  sx={{
                    py: 2,
                    px: 4,
                    bgcolor: 'white',
                    color: '#667eea',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Contact Media Team
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Download />}
                  sx={{
                    py: 2,
                    px: 4,
                    borderColor: 'white',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Download Media Kit
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default PressPage;