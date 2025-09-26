'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, List, ListItem, ListItemIcon, ListItemText, Switch, FormControlLabel } from '@mui/material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, Close, Star } from '@mui/icons-material';

export default function PricingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small units and teams',
      monthlyPrice: 299,
      annualPrice: 249,
      features: [
        { name: 'Up to 10 users', included: true },
        { name: '1,000 documents/month', included: true },
        { name: 'Basic AI features', included: true },
        { name: 'Email support', included: true },
        { name: 'Standard templates', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom workflows', included: false },
        { name: 'API access', included: false },
        { name: 'Dedicated support', included: false },
        { name: 'On-premise deployment', included: false }
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for departments and squadrons',
      monthlyPrice: 799,
      annualPrice: 699,
      features: [
        { name: 'Up to 50 users', included: true },
        { name: '10,000 documents/month', included: true },
        { name: 'Full AI suite', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom templates', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom workflows', included: true },
        { name: 'API access', included: true },
        { name: 'Dedicated support', included: false },
        { name: 'On-premise deployment', included: false }
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations and bases',
      monthlyPrice: 'Custom',
      annualPrice: 'Custom',
      features: [
        { name: 'Unlimited users', included: true },
        { name: 'Unlimited documents', included: true },
        { name: 'Full AI suite + custom models', included: true },
        { name: '24/7 phone support', included: true },
        { name: 'Custom everything', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom workflows', included: true },
        { name: 'Full API access', included: true },
        { name: 'Dedicated support team', included: true },
        { name: 'On-premise deployment', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', pt: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 10,
            textAlign: 'center'
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
              Simple, Transparent Pricing
            </Typography>
            <Typography variant="h5" sx={{ mb: 4 }}>
              Choose the perfect plan for your organization's needs
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnnual}
                  onChange={() => setIsAnnual(!isAnnual)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'white'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Annual billing</Typography>
                  <Chip
                    label="Save 20%"
                    size="small"
                    sx={{ bgcolor: 'white', color: '#667eea' }}
                  />
                </Box>
              }
            />
          </Container>
        </Box>

        {/* Pricing Cards */}
        <Container maxWidth="lg" sx={{ py: 8, mt: -5 }}>
          <Grid container spacing={4}>
            {plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    boxShadow: plan.popular ? '0 20px 40px rgba(102, 126, 234, 0.3)' : '0 10px 20px rgba(0,0,0,0.1)',
                    transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                    border: plan.popular ? '2px solid #667eea' : 'none'
                  }}
                >
                  {plan.popular && (
                    <Chip
                      icon={<Star />}
                      label="Most Popular"
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#667eea',
                        color: 'white'
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {plan.description}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      {typeof plan.monthlyPrice === 'number' ? (
                        <>
                          <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                            ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            per month, billed {isAnnual ? 'annually' : 'monthly'}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                          Custom
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => router.push('/login')}
                      sx={{
                        mb: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: plan.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                        borderColor: plan.popular ? 'none' : '#667eea',
                        color: plan.popular ? 'white' : '#667eea',
                        '&:hover': {
                          background: plan.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(102, 126, 234, 0.1)',
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>

                    <List dense>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            {feature.included ? (
                              <Check sx={{ color: '#667eea' }} />
                            ) : (
                              <Close sx={{ color: 'grey.400' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.name}
                            sx={{
                              '& .MuiListItemText-primary': {
                                color: feature.included ? 'text.primary' : 'text.disabled'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* FAQ Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="md">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
              Frequently Asked Questions
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Can I change plans anytime?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Is there a free trial?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes, all plans come with a 14-day free trial. No credit card required.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Do you offer government discounts?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes, we offer special pricing for government and military organizations. Contact our sales team.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  What payment methods do you accept?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We accept all major credit cards, ACH transfers, and government purchase orders.
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Container maxWidth="md">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
              Still have questions?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Our team is here to help you choose the right plan
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Contact Sales
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  borderColor: '#667eea',
                  color: '#667eea'
                }}
              >
                View Documentation
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}