'use client';

import React, { useState } from 'react';
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
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Work,
  LocationOn,
  Schedule,
  TrendingUp,
  People,
  EmojiEvents,
  HealthAndSafety,
  School,
  Home,
  FlightTakeoff,
  CheckCircle,
  ArrowForward,
  Code,
  Palette,
  Security,
  Support
} from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  level: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

const CareersPage: React.FC = () => {
  const theme = useTheme();
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const jobOpenings: JobOpening[] = [
    {
      id: '1',
      title: 'Senior Software Engineer - AI/ML',
      department: 'Engineering',
      location: 'Remote / Arlington, VA',
      type: 'Full-time',
      level: 'Senior',
      description: 'Lead development of our AI-powered document analysis and generation systems. Work on cutting-edge machine learning models for military document processing.',
      requirements: ['5+ years Python/TypeScript experience', 'ML/AI framework expertise', 'Cloud platform experience', 'Security clearance eligible'],
      benefits: ['Competitive salary', 'Equity package', 'Health insurance', 'Remote flexibility']
    },
    {
      id: '2',
      title: 'Product Manager - Enterprise',
      department: 'Product',
      location: 'Washington DC',
      type: 'Full-time',
      level: 'Mid-Senior',
      description: 'Drive product strategy for our enterprise military customers. Work closely with defense organizations to understand their unique workflow requirements.',
      requirements: ['3+ years product management', 'Enterprise B2B experience', 'Military/defense background preferred', 'Strong analytical skills'],
      benefits: ['Competitive salary', 'Equity package', 'Health insurance', 'Professional development']
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      level: 'Mid',
      description: 'Build and maintain our secure, scalable cloud infrastructure. Ensure high availability and security for mission-critical military applications.',
      requirements: ['AWS/Azure expertise', 'Kubernetes experience', 'Security best practices', 'CI/CD pipeline knowledge'],
      benefits: ['Competitive salary', 'Equity package', 'Health insurance', 'Learning budget']
    },
    {
      id: '4',
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      level: 'Mid',
      description: 'Design intuitive interfaces for complex military workflows. Create user experiences that enhance productivity for defense personnel.',
      requirements: ['3+ years UX design experience', 'Enterprise software design', 'Figma/Sketch proficiency', 'User research skills'],
      benefits: ['Competitive salary', 'Equity package', 'Health insurance', 'Design conferences']
    },
    {
      id: '5',
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      level: 'Mid',
      description: 'Ensure military organizations successfully adopt and scale Mission Sync AI. Build relationships with defense personnel and drive product adoption.',
      requirements: ['Customer success experience', 'B2B enterprise background', 'Excellent communication', 'Military experience preferred'],
      benefits: ['Competitive salary', 'Commission structure', 'Health insurance', 'Travel opportunities']
    },
    {
      id: '6',
      title: 'Security Engineer',
      department: 'Security',
      location: 'Arlington, VA',
      type: 'Full-time',
      level: 'Senior',
      description: 'Implement and maintain security controls for our military-grade platform. Ensure compliance with defense security requirements.',
      requirements: ['Security clearance required', '5+ years security experience', 'Compliance expertise', 'Penetration testing skills'],
      benefits: ['Top-tier salary', 'Security clearance bonus', 'Health insurance', 'Continuing education']
    }
  ];

  const departments = [
    { id: 'all', label: 'All Departments', icon: <Work />, count: jobOpenings.length },
    { id: 'Engineering', label: 'Engineering', icon: <Code />, count: jobOpenings.filter(j => j.department === 'Engineering').length },
    { id: 'Product', label: 'Product', icon: <TrendingUp />, count: jobOpenings.filter(j => j.department === 'Product').length },
    { id: 'Design', label: 'Design', icon: <Palette />, count: jobOpenings.filter(j => j.department === 'Design').length },
    { id: 'Security', label: 'Security', icon: <Security />, count: jobOpenings.filter(j => j.department === 'Security').length },
    { id: 'Customer Success', label: 'Customer Success', icon: <Support />, count: jobOpenings.filter(j => j.department === 'Customer Success').length }
  ];

  const benefits = [
    {
      icon: <HealthAndSafety sx={{ fontSize: 40 }} />,
      title: 'Comprehensive Health Coverage',
      description: 'Full medical, dental, and vision insurance for you and your family'
    },
    {
      icon: <Home sx={{ fontSize: 40 }} />,
      title: 'Remote-First Culture',
      description: 'Work from anywhere with flexible hours and home office stipends'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Equity Participation',
      description: 'Share in our success with competitive equity packages for all employees'
    },
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Learning & Development',
      description: '$3,000 annual budget for conferences, courses, and professional growth'
    },
    {
      icon: <FlightTakeoff sx={{ fontSize: 40 }} />,
      title: 'Unlimited PTO',
      description: 'Take the time you need to recharge with our unlimited vacation policy'
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40 }} />,
      title: 'Performance Bonuses',
      description: 'Quarterly performance bonuses and annual merit increases'
    }
  ];

  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'VP of Engineering',
      avatar: '/api/placeholder/80/80',
      background: 'Former Google, 10+ years building secure systems'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Head of Product',
      avatar: '/api/placeholder/80/80',
      background: 'Ex-military, former Microsoft PM'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'AI Research Lead',
      avatar: '/api/placeholder/80/80',
      background: 'PhD Stanford, published researcher in NLP'
    },
    {
      name: 'David Kim',
      role: 'Head of Security',
      avatar: '/api/placeholder/80/80',
      background: 'Former NSA, security clearance expert'
    }
  ];

  const filteredJobs = selectedDepartment === 'all'
    ? jobOpenings
    : jobOpenings.filter(job => job.department === selectedDepartment);

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
                label="CAREERS"
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
                Join Our Mission
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
                Help us transform how military organizations create, manage, and collaborate on critical documents. Join a team that's making a real impact on national security.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
                {['Mission-Driven', 'Remote-First', 'Competitive Benefits', 'Growth Opportunities'].map((item) => (
                  <Chip
                    key={item}
                    icon={<CheckCircle />}
                    label={item}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            {/* Stats */}
            <Grid container spacing={4} sx={{ textAlign: 'center' }}>
              {[
                { value: '50+', label: 'Team Members', icon: <People /> },
                { value: '500+', label: 'Military Customers', icon: <Security /> },
                { value: '99.9%', label: 'Uptime SLA', icon: <TrendingUp /> },
                { value: '24/7', label: 'Mission Support', icon: <Support /> }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{ p: 3 }}>
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

        {/* Job Openings */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                Open Positions
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Find your next opportunity to make an impact
              </Typography>
            </Box>

            {/* Department Filter */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 6 }}>
              {departments.map((dept) => (
                <Chip
                  key={dept.id}
                  icon={dept.icon}
                  label={`${dept.label} (${dept.count})`}
                  onClick={() => setSelectedDepartment(dept.id)}
                  variant={selectedDepartment === dept.id ? 'filled' : 'outlined'}
                  color={selectedDepartment === dept.id ? 'primary' : 'default'}
                  sx={{
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              ))}
            </Box>

            {/* Job Cards */}
            <Grid container spacing={4}>
              {filteredJobs.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <Card
                    sx={{
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
                      <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                              {job.title}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                              <Chip icon={<Work />} label={job.department} size="small" />
                              <Chip icon={<LocationOn />} label={job.location} size="small" />
                              <Chip icon={<Schedule />} label={job.type} size="small" />
                              <Chip label={job.level} size="small" color="primary" />
                            </Stack>
                          </Box>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            {job.description}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                              Key Requirements:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {job.requirements.slice(0, 3).map((req, index) => (
                                <Chip
                                  key={index}
                                  label={req}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              ))}
                              {job.requirements.length > 3 && (
                                <Chip
                                  label={`+${job.requirements.length - 3} more`}
                                  size="small"
                                  color="primary"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Button
                              variant="contained"
                              endIcon={<ArrowForward />}
                              fullWidth
                              sx={{
                                mb: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.5
                              }}
                            >
                              Apply Now
                            </Button>
                            <Button
                              variant="outlined"
                              fullWidth
                              sx={{
                                borderColor: '#667eea',
                                color: '#667eea',
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Learn More
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredJobs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No positions found in this department. Check back soon for new opportunities!
                </Typography>
              </Box>
            )}
          </Container>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                Why Join Mission Sync AI?
              </Typography>
              <Typography variant="h6" color="text.secondary">
                We believe in taking care of our team so they can take care of our mission
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {benefits.map((benefit, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 3,
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          mb: 3
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {benefit.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Team Section */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                Meet Our Leadership
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Learn from industry experts and military veterans
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {teamMembers.map((member, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
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
                        src={member.avatar}
                        sx={{
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 2,
                          border: `3px solid ${alpha('#667eea', 0.2)}`
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                        {member.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {member.background}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Culture Section */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                  Our Culture & Values
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  We're building more than just software – we're creating solutions that protect and serve our nation. Our culture reflects the values of excellence, integrity, and service.
                </Typography>
                <List>
                  {[
                    'Mission First: Every decision considers impact on national security',
                    'Excellence: We hold ourselves to the highest standards',
                    'Transparency: Open communication and honest feedback',
                    'Innovation: Embracing new technologies and approaches',
                    'Collaboration: Working together across all disciplines',
                    'Work-Life Balance: Supporting personal and professional growth'
                  ].map((value, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={value}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: 'white',
                    borderRadius: 3,
                    p: 1,
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                  }}
                >
                  <img
                    src="/api/placeholder/500/400"
                    alt="Team collaboration"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
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
                Ready to Make an Impact?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Join our mission to transform military documentation and workflow automation
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
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
                  View All Positions
                </Button>
                <Button
                  variant="outlined"
                  size="large"
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
                  Contact Recruiting
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

export default CareersPage;