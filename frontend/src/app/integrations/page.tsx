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
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  CloudSync,
  Security,
  Api,
  Storage,
  Assessment,
  Group,
  Search,
  CheckCircle,
  ArrowForward,
  Code,
  Extension,
  Webhook,
  DataObject
} from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Integration {
  name: string;
  description: string;
  logo: string;
  category: string;
  status: 'available' | 'coming-soon' | 'beta';
  features: string[];
  setupTime: string;
}

const IntegrationsPage: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const integrations: Integration[] = [
    {
      name: 'Microsoft SharePoint',
      description: 'Seamlessly sync documents and collaborate with your existing SharePoint infrastructure.',
      logo: '/api/placeholder/80/80',
      category: 'collaboration',
      status: 'available',
      features: ['Document sync', 'Real-time collaboration', 'Permission management', 'Version control'],
      setupTime: '15 min'
    },
    {
      name: 'Slack',
      description: 'Get workflow notifications and collaborate on documents directly from Slack.',
      logo: '/api/placeholder/80/80',
      category: 'communication',
      status: 'available',
      features: ['Workflow notifications', 'Document sharing', 'Team updates', 'Bot commands'],
      setupTime: '5 min'
    },
    {
      name: 'Microsoft Teams',
      description: 'Integrate document workflows with your Teams channels and meetings.',
      logo: '/api/placeholder/80/80',
      category: 'communication',
      status: 'available',
      features: ['Channel integration', 'Meeting collaboration', 'File sharing', 'Notifications'],
      setupTime: '10 min'
    },
    {
      name: 'Active Directory',
      description: 'Single sign-on and user management with your existing AD infrastructure.',
      logo: '/api/placeholder/80/80',
      category: 'identity',
      status: 'available',
      features: ['SSO authentication', 'User provisioning', 'Group management', 'Security policies'],
      setupTime: '30 min'
    },
    {
      name: 'AWS S3',
      description: 'Store and manage documents in your AWS S3 buckets with advanced security.',
      logo: '/api/placeholder/80/80',
      category: 'storage',
      status: 'available',
      features: ['Secure storage', 'Backup & recovery', 'Access controls', 'Encryption'],
      setupTime: '20 min'
    },
    {
      name: 'Jira',
      description: 'Link documentation workflows to project management and issue tracking.',
      logo: '/api/placeholder/80/80',
      category: 'project-management',
      status: 'available',
      features: ['Issue linking', 'Project tracking', 'Workflow automation', 'Status updates'],
      setupTime: '15 min'
    },
    {
      name: 'Tableau',
      description: 'Visualize document metrics and workflow analytics in interactive dashboards.',
      logo: '/api/placeholder/80/80',
      category: 'analytics',
      status: 'beta',
      features: ['Custom dashboards', 'Real-time metrics', 'Performance tracking', 'Data export'],
      setupTime: '25 min'
    },
    {
      name: 'DocuSign',
      description: 'Digital signature integration for secure document approval workflows.',
      logo: '/api/placeholder/80/80',
      category: 'workflow',
      status: 'coming-soon',
      features: ['Digital signatures', 'Approval workflows', 'Audit trails', 'Legal compliance'],
      setupTime: '20 min'
    },
    {
      name: 'Salesforce',
      description: 'Connect document processes with customer relationship management.',
      logo: '/api/placeholder/80/80',
      category: 'crm',
      status: 'coming-soon',
      features: ['CRM integration', 'Customer documents', 'Lead tracking', 'Pipeline management'],
      setupTime: '30 min'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Integrations', count: integrations.length },
    { id: 'collaboration', label: 'Collaboration', count: integrations.filter(i => i.category === 'collaboration').length },
    { id: 'communication', label: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
    { id: 'identity', label: 'Identity & Access', count: integrations.filter(i => i.category === 'identity').length },
    { id: 'storage', label: 'Storage', count: integrations.filter(i => i.category === 'storage').length },
    { id: 'analytics', label: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
    { id: 'workflow', label: 'Workflow', count: integrations.filter(i => i.category === 'workflow').length }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'beta': return 'warning';
      case 'coming-soon': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'beta': return 'Beta';
      case 'coming-soon': return 'Coming Soon';
      default: return status;
    }
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
                label="INTEGRATIONS"
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
                Connect with Your Existing Tools
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
                Mission Sync AI integrates seamlessly with the tools your team already uses. Set up powerful integrations in minutes, not months.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
                {['50+ Integrations', 'API Access', 'Enterprise Ready', 'Secure'].map((item) => (
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

            {/* Search and Filter */}
            <Box sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
              <TextField
                fullWidth
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)'
                  }
                }}
              />
            </Box>

            {/* Category Tabs */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600
                  }
                }}
              >
                {categories.map((category) => (
                  <Tab
                    key={category.id}
                    value={category.id}
                    label={
                      <Badge badgeContent={category.count} color="primary">
                        {category.label}
                      </Badge>
                    }
                  />
                ))}
              </Tabs>
            </Box>
          </Container>
        </Box>

        {/* Integrations Grid */}
        <Box sx={{ py: 10 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {filteredIntegrations.map((integration, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <Chip
                      label={getStatusLabel(integration.status)}
                      color={getStatusColor(integration.status) as any}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 600
                      }}
                    />
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            bgcolor: alpha('#667eea', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <img
                            src={integration.logo}
                            alt={integration.name}
                            style={{ width: 40, height: 40 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {integration.name}
                          </Typography>
                          <Chip
                            label={`${integration.setupTime} setup`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#667eea', 0.1),
                              color: '#667eea',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                        {integration.description}
                      </Typography>
                      <Stack spacing={1} sx={{ mb: 3 }}>
                        {integration.features.slice(0, 3).map((feature, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle sx={{ fontSize: 16, color: '#667eea', mr: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                              {feature}
                            </Typography>
                          </Box>
                        ))}
                        {integration.features.length > 3 && (
                          <Typography variant="caption" color="primary">
                            +{integration.features.length - 3} more features
                          </Typography>
                        )}
                      </Stack>
                      <Button
                        fullWidth
                        variant={integration.status === 'available' ? 'contained' : 'outlined'}
                        disabled={integration.status === 'coming-soon'}
                        endIcon={<ArrowForward />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          ...(integration.status === 'available' && {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)'
                            }
                          })
                        }}
                      >
                        {integration.status === 'available' ? 'Configure' :
                         integration.status === 'beta' ? 'Join Beta' : 'Request Access'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredIntegrations.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No integrations found matching your search criteria.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>

        {/* API Section */}
        <Box sx={{ py: 10, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                  Build Custom Integrations
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  Don't see what you need? Our comprehensive REST API and webhook system lets you build custom integrations with any tool in your tech stack.
                </Typography>
                <Stack spacing={3} sx={{ mb: 4 }}>
                  {[
                    { icon: <Api />, title: 'REST API', desc: 'Full-featured API with comprehensive documentation' },
                    { icon: <Webhook />, title: 'Webhooks', desc: 'Real-time notifications for workflow events' },
                    { icon: <Code />, title: 'SDKs', desc: 'Official SDKs for popular programming languages' },
                    { icon: <DataObject />, title: 'GraphQL', desc: 'Query exactly the data you need with GraphQL' }
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          mr: 3
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    View API Docs
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Download SDKs
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: '#1a1a2e',
                    color: 'white',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, color: '#667eea' }}>
                    API Example
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      overflow: 'auto',
                      bgcolor: 'rgba(0,0,0,0.3)',
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(102, 126, 234, 0.3)'
                    }}
                  >
{`// Create a new document
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mission Report',
    template: 'air-force-standard',
    workflow: 'twelve-stage'
  })
});

const document = await response.json();
console.log('Created:', document.id);`}
                  </Box>
                </Card>
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
                Ready to Connect Your Tools?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Get started with our integrations today. Most setups take less than 15 minutes.
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
                  Start Free Trial
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
                  Contact Sales
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

export default IntegrationsPage;