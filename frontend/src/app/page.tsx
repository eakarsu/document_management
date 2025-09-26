'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  TextField,
  Stack,
  Chip,
  useTheme,
  alpha,
  Divider,
  Avatar,
  Rating,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Grow,
  Slide,
  useMediaQuery,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  AutoAwesome,
  Description,
  Security,
  Speed,
  Group,
  CheckCircle,
  ArrowForward,
  Email,
  LinkedIn,
  Twitter,
  GitHub,
  WorkspacePremium,
  Psychology,
  CloudSync,
  TrendingUp,
  AccessTime,
  CheckCircleOutline,
  Star,
  FormatQuote,
  PlayCircle,
  Menu as MenuIcon,
  Close,
  KeyboardArrowDown,
  Rocket,
  Shield,
  Analytics,
  Support,
  Language,
  DarkMode,
  LightMode,
  ArrowUpward
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import AnimatedHeroSection from '@/components/AnimatedHeroSection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Custom hook for dark mode
const useColorMode = () => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleColorMode = () => setDarkMode(!darkMode);
  return { darkMode, toggleColorMode };
};

const ProfessionalLandingPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productMenuAnchor, setProductMenuAnchor] = useState<null | HTMLElement>(null);
  const [solutionsMenuAnchor, setSolutionsMenuAnchor] = useState<null | HTMLElement>(null);
  const { darkMode, toggleColorMode } = useColorMode();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection observers for animations
  const [statsRef, statsInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [testimonialsRef, testimonialsInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Intelligence',
      description: 'Advanced machine learning algorithms generate, analyze, and optimize military documents with 99.9% accuracy.',
      stats: '10x faster'
    },
    {
      icon: <Shield sx={{ fontSize: 40 }} />,
      title: 'Military-Grade Security',
      description: 'AES-256 encryption, SOC 2 Type II certified, and full compliance with DoD security requirements.',
      stats: 'Zero breaches'
    },
    {
      icon: <Rocket sx={{ fontSize: 40 }} />,
      title: 'Rapid Deployment',
      description: 'Get up and running in minutes with our cloud-native architecture and intuitive onboarding.',
      stats: '< 5 min setup'
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Real-Time Analytics',
      description: 'Monitor document workflows, track performance metrics, and gain actionable insights instantly.',
      stats: '100+ metrics'
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'Intelligent Automation',
      description: 'Automate repetitive tasks, streamline approvals, and reduce manual work by 85%.',
      stats: '85% automation'
    },
    {
      icon: <CloudSync sx={{ fontSize: 40 }} />,
      title: 'Seamless Integration',
      description: 'Native integrations with existing military systems, SharePoint, and collaboration tools.',
      stats: '50+ integrations'
    }
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Documents Processed', icon: <Description /> },
    { value: 99.9, suffix: '%', label: 'Uptime SLA', icon: <TrendingUp /> },
    { value: 500, suffix: '+', label: 'Military Units', icon: <Shield /> },
    { value: 24, suffix: '/7', label: 'Support Available', icon: <Support /> }
  ];

  const testimonials = [
    {
      name: 'Col. Sarah Mitchell',
      role: 'Operations Director, USAF',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      text: 'Mission Sync AI transformed our documentation process. What used to take weeks now takes hours. The AI-powered compliance checking alone saved us countless review cycles.',
      organization: 'Air Force Base Command'
    },
    {
      name: 'Lt. Col. James Rodriguez',
      role: 'Chief Information Officer',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      text: 'The 12-stage workflow automation is exactly what we needed. Every stakeholder knows their role, and nothing falls through the cracks. Outstanding platform.',
      organization: 'Space Force Operations'
    },
    {
      name: 'Maj. Emily Chen',
      role: 'Legal Affairs Director',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      text: 'Compliance has never been easier. The system automatically flags potential issues and ensures all documents meet regulatory standards. A game-changer for military documentation.',
      organization: 'Joint Base Legal Office'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 299,
      period: 'per month',
      description: 'Perfect for small units',
      features: [
        'Up to 10 users',
        '100 documents/month',
        'Basic templates',
        'Email support',
        '99.9% uptime SLA'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 899,
      period: 'per month',
      description: 'For growing organizations',
      features: [
        'Up to 50 users',
        'Unlimited documents',
        'All templates',
        'Priority support',
        'Advanced analytics',
        'API access',
        'Custom workflows'
      ],
      highlighted: true,
      badge: 'Most Popular'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large deployments',
      features: [
        'Unlimited users',
        'Unlimited documents',
        'Custom templates',
        'Dedicated support',
        'On-premise option',
        'Custom integrations',
        'Training included',
        'SLA customization'
      ],
      highlighted: false
    }
  ];

  const NavMenu = () => (
    <>
      {/* Product Dropdown */}
      <Button
        color="inherit"
        endIcon={<KeyboardArrowDown />}
        onClick={(e) => setProductMenuAnchor(e.currentTarget)}
        sx={{ mx: 1, textTransform: 'none' }}
      >
        Product
      </Button>
      <Menu
        anchorEl={productMenuAnchor}
        open={Boolean(productMenuAnchor)}
        onClose={() => setProductMenuAnchor(null)}
        PaperProps={{
          sx: { mt: 1, minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => { setProductMenuAnchor(null); }}>Features</MenuItem>
        <MenuItem onClick={() => { setProductMenuAnchor(null); }}>Workflows</MenuItem>
        <MenuItem onClick={() => { setProductMenuAnchor(null); }}>Templates</MenuItem>
        <MenuItem onClick={() => { setProductMenuAnchor(null); }}>Integrations</MenuItem>
        <MenuItem onClick={() => { setProductMenuAnchor(null); }}>Security</MenuItem>
      </Menu>

      {/* Solutions Dropdown */}
      <Button
        color="inherit"
        endIcon={<KeyboardArrowDown />}
        onClick={(e) => setSolutionsMenuAnchor(e.currentTarget)}
        sx={{ mx: 1, textTransform: 'none' }}
      >
        Solutions
      </Button>
      <Menu
        anchorEl={solutionsMenuAnchor}
        open={Boolean(solutionsMenuAnchor)}
        onClose={() => setSolutionsMenuAnchor(null)}
        PaperProps={{
          sx: { mt: 1, minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => { setSolutionsMenuAnchor(null); }}>Air Force</MenuItem>
        <MenuItem onClick={() => { setSolutionsMenuAnchor(null); }}>Army</MenuItem>
        <MenuItem onClick={() => { setSolutionsMenuAnchor(null); }}>Navy</MenuItem>
        <MenuItem onClick={() => { setSolutionsMenuAnchor(null); }}>Space Force</MenuItem>
        <MenuItem onClick={() => { setSolutionsMenuAnchor(null); }}>Joint Operations</MenuItem>
      </Menu>

      <Button color="inherit" sx={{ mx: 1, textTransform: 'none' }}>Pricing</Button>
      <Button color="inherit" sx={{ mx: 1, textTransform: 'none' }}>Resources</Button>
      <Button color="inherit" sx={{ mx: 1, textTransform: 'none' }}>Company</Button>
    </>
  );

  return (
    <>
      <Header />
      <Box sx={{
        minHeight: '100vh',
        bgcolor: darkMode ? 'grey.900' : 'background.default',
        color: darkMode ? 'grey.100' : 'text.primary'
      }}>
        {/* AppBar removed - using Header component */}
        {/* <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          bgcolor: scrolled
            ? (darkMode ? alpha(theme.palette.grey[900], 0.95) : alpha(theme.palette.background.default, 0.95))
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}` : 'none',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => router.push('/')}
          >
            <img
              src="/images/missionsync/logo.png"
              alt="Mission Sync AI"
              style={{
                height: 60,
                width: 'auto'
              }}
            />
          </Box>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <NavMenu />
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {!isMobile && (
            <>
              <IconButton onClick={toggleColorMode} sx={{ mx: 1 }}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
              {process.env.NEXT_PUBLIC_ENABLE_LOGIN === 'true' ? (
                <>
                  <Button
                    color="inherit"
                    sx={{ mx: 1, textTransform: 'none' }}
                    onClick={() => router.push('/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      ml: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
                      }
                    }}
                    onClick={() => router.push('/login')}
                  >
                    Start Free Trial
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  sx={{
                    ml: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
                    }
                  }}
                  onClick={() => router.push('/contact')}
                >
                  Request Demo
                </Button>
              )}
            </>
          )}

          {isMobile && (
            <IconButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <Close /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar> */}

      {/* Animated Hero Section */}
      <AnimatedHeroSection />

      {/* Image Showcase Section */}
      <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Trusted by Military Personnel Worldwide
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See how Mission Sync AI is transforming military documentation
            </Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={10}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                <img
                  src="/images/missionsync/pilot-reading.png"
                  alt="Military pilot using Mission Sync AI"
                  style={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Pilots & Aircrew
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access critical documentation instantly from any device
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={10}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                <img
                  src="/images/missionsync/airmen-flightline.png"
                  alt="Airmen on flightline"
                  style={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Ground Operations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Streamline maintenance and operations documentation
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={10}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                <img
                  src="/images/missionsync/mobile-mockup.png"
                  alt="Mobile interface"
                  style={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Mobile Ready
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access documents anywhere with our mobile platform
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box ref={statsRef} sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Fade in={statsInView} timeout={1000 + index * 200}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: darkMode
                        ? alpha(theme.palette.grey[800], 0.5)
                        : 'white',
                      borderRadius: 3,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ color: '#667eea', mb: 2 }}>{stat.icon}</Box>
                    <Typography variant="h3" fontWeight={800}>
                      {statsInView && (
                        <CountUp
                          end={stat.value}
                          duration={2.5}
                          decimals={stat.value % 1 !== 0 ? 1 : 0}
                          suffix={stat.suffix}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {stat.label}
                    </Typography>
                  </Paper>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Advanced Features Section */}
      <Box ref={featuresRef} sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="CAPABILITIES" sx={{ mb: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Enterprise Features That Scale
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              Built from the ground up for military organizations, with security, compliance, and performance at its core
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Grow in={featuresInView} timeout={1000 + index * 100}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      background: darkMode
                        ? alpha(theme.palette.grey[800], 0.3)
                        : 'white',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        borderColor: '#667eea',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        className="feature-icon"
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 3,
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          mb: 3,
                          transition: 'all 0.3s'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Chip
                        label={feature.stats}
                        size="small"
                        sx={{
                          mb: 2,
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          fontWeight: 600
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box ref={testimonialsRef} sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="TESTIMONIALS" sx={{ mb: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Trusted by Military Leaders
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See what our customers have to say about Mission Sync AI
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Slide direction="up" in={testimonialsInView} timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      p: 3,
                      background: darkMode
                        ? alpha(theme.palette.grey[800], 0.3)
                        : 'white',
                      position: 'relative',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardContent>
                      <FormatQuote
                        sx={{
                          fontSize: 40,
                          color: alpha('#667eea', 0.3),
                          mb: 2
                        }}
                      />
                      <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
                        "{testimonial.text}"
                      </Typography>
                      <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                        <Avatar
                          src={testimonial.avatar}
                          sx={{
                            mr: 2,
                            width: 56,
                            height: 56,
                            border: `2px solid ${alpha('#667eea', 0.2)}`
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.role}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {testimonial.organization}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="PRICING" sx={{ mb: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Simple, Transparent Pricing
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Choose the plan that fits your organization's needs
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="stretch">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    position: 'relative',
                    border: plan.highlighted
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    transform: plan.highlighted ? 'scale(1.05)' : 'none',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: plan.highlighted ? 'scale(1.08)' : 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  {plan.badge && (
                    <Chip
                      label={plan.badge}
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {plan.description}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" fontWeight={800} component="span">
                        {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                      </Typography>
                      {plan.period && (
                        <Typography variant="body1" component="span" color="text.secondary">
                          {' '}{plan.period}
                        </Typography>
                      )}
                    </Box>
                    <List>
                      {plan.features.map((feature, i) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleOutline color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      fullWidth
                      variant={plan.highlighted ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => router.push('/login')}
                      sx={{
                        mt: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        ...(plan.highlighted && {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                          '&:hover': {
                            boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
                          }
                        })
                      }}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, color: 'white' }}>
              Ready to Transform Your Documentation?
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, color: 'rgba(255,255,255,0.9)' }}>
              Join 500+ military organizations already using Mission Sync AI
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => router.push('/login')}
                sx={{
                  py: 2,
                  px: 5,
                  bgcolor: 'white',
                  color: '#667eea',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Start Your Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  py: 2,
                  px: 5,
                  borderColor: 'white',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  borderWidth: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Schedule Demo
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 3, color: 'rgba(255,255,255,0.8)' }}>
              ✓ No credit card required ✓ 14-day free trial ✓ Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>


      {/* Scroll to Top Button */}
      <Fade in={showScrollTop}>
        <Box
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            zIndex: 1000
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          >
            <ArrowUpward />
          </IconButton>
        </Box>
      </Fade>
    </Box>
    <Footer />
    </>
  );
};

export default ProfessionalLandingPage;