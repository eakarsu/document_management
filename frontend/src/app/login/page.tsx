'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Login as LoginIcon
} from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const submitRef = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Check if already authenticated
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [router]);

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const quickLogin = (email: string, password: string) => {
    console.log('🔄 Quick login button clicked for:', email);

    // If already loading, don't do anything
    if (isLoading || submitRef.current) {
      console.log('⚠️ Login already in progress, ignoring quick login');
      return;
    }

    // Clear any existing session first to prevent cached user issues
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Just populate the form fields, don't login automatically
    setFormData({ email, password });

    // Clear any existing errors
    setError('');
  };

  const clearSession = () => {
    // Clear all stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear form and reload page
    setFormData({ email: '', password: '' });
    setError('');
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Prevent multiple submissions using ref
    if (submitRef.current || isLoading) {
      console.log(`🚫 [${new Date().toISOString()}] Login already in progress, blocking duplicate submission`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Set both ref and state to prevent any double submission
    submitRef.current = true;
    setIsLoading(true);
    console.log(`✅ [${new Date().toISOString()}] Starting login for: ${formData.email}`);

    // Clear ALL cached data before login
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    try {
      console.log('🔍 LOGIN DEBUG: Submitting login ONCE with:', formData);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        // Store tokens in localStorage
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Set cookies for middleware
        document.cookie = `accessToken=${data.accessToken}; path=/; samesite=strict`;
        document.cookie = `refreshToken=${data.refreshToken}; path=/; samesite=strict`;

        // Store user data
        const userData = {
          ...data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Also store email and username separately for easy access
        localStorage.setItem('userEmail', data.user.email || formData.email);
        localStorage.setItem('username', data.user.username || data.user.email || formData.email);

        // Wait a bit for localStorage to sync, then do a hard redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use window.location for hard redirect to ensure AuthProvider loads fresh state
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        window.location.href = redirect;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      submitRef.current = false;
    }
  };

  return (
    <Container maxWidth="md" sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Business sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Richmond DMS
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Document Management System
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              variant="outlined"
              required
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              variant="outlined"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: formData.email && formData.password ? '#2e7d32' : undefined,
                '&:hover': {
                  backgroundColor: formData.email && formData.password ? '#1b5e20' : undefined,
                }
              }}
            >
              {isLoading ? 'Signing In...' : (formData.email && formData.password ? 'Proceed to Login' : 'Sign In')}
            </Button>
          </Stack>
        </Box>

        {/* Only show test users in development mode */}
        {process.env.NEXT_PUBLIC_APP_MODE === 'development' && (
          <>
            <Divider sx={{ my: 3 }} />

            {/* Hierarchical Distributed Workflow Test Users */}
            <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🎯 Hierarchical Distributed Review Workflow (10 Stages)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All test accounts use password: <strong>testpass123</strong>
            </Typography>

            {/* Stage 1: Action Officers */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📝 Stage 1: Initial Draft - Action Officers
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => quickLogin('ao1@airforce.mil', 'testpass123')}
                    disabled={isLoading}
                    sx={{ fontSize: '0.70rem', py: 0.3, px: 1, mr: 1 }}
                  >
                    ao1@airforce.mil (Primary AO)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => quickLogin('ao2@airforce.mil', 'testpass123')}
                    disabled={isLoading}
                    sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
                  >
                    ao2@airforce.mil (Secondary AO)
                  </Button>
                </Box>
              </Stack>
            </Box>

            {/* Stage 2: PCM */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🔍 Stage 2: PCM Review (OPR Gatekeeper)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => quickLogin('pcm@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
              >
                pcm@airforce.mil (Program Control Manager)
              </Button>
            </Box>

            {/* Stages 3 & 5: Coordination */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f3e5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🤝 Stages 3 & 5: Coordination Phases
              </Typography>

              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mt: 1, mb: 0.5 }}>
                Coordinator:
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => quickLogin('coordinator1@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1, mb: 2 }}
              >
                coordinator1@airforce.mil
              </Button>

              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mt: 1, mb: 0.5 }}>
                Front Office Gatekeepers:
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => quickLogin('ops.frontoffice@airforce.mil', 'testpass123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5 }}
                >
                  🏢 ops.frontoffice@airforce.mil
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => quickLogin('log.frontoffice@airforce.mil', 'testpass123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5 }}
                >
                  📦 log.frontoffice@airforce.mil
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => quickLogin('fin.frontoffice@airforce.mil', 'testpass123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5 }}
                >
                  💰 fin.frontoffice@airforce.mil
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => quickLogin('per.frontoffice@airforce.mil', 'testpass123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5 }}
                >
                  👥 per.frontoffice@airforce.mil
                </Button>
              </Stack>

              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                Sub-Reviewers (Password: reviewer123):
              </Typography>
              <Stack spacing={0.5}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('john.doe.ops@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  🏢 john.doe.ops@airforce.mil (Operations)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('david.brown.ops@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  🏢 david.brown.ops@airforce.mil (Operations)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('jane.smith.log@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  📦 jane.smith.log@airforce.mil (Logistics)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('lisa.davis.log@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  📦 lisa.davis.log@airforce.mil (Logistics)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('mike.johnson.fin@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  💰 mike.johnson.fin@airforce.mil (Finance)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('robert.miller.fin@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  💰 robert.miller.fin@airforce.mil (Finance)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('sarah.williams.per@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  👥 sarah.williams.per@airforce.mil (Personnel)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => quickLogin('emily.wilson.per@airforce.mil', 'reviewer123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.65rem', py: 0.2, px: 0.5, justifyContent: 'flex-start' }}
                >
                  👥 emily.wilson.per@airforce.mil (Personnel)
                </Button>
              </Stack>
            </Box>

            {/* Stage 7: Legal */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                ⚖️ Stage 7: Legal Review & Approval
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => quickLogin('legal.reviewer@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
              >
                legal.reviewer@airforce.mil (Legal Compliance Officer)
              </Button>
            </Box>

            {/* Stage 9: Leadership */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#fce4ec', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                👑 Stage 9: OPR Leadership Signature
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => quickLogin('opr.leadership@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
              >
                opr.leadership@airforce.mil (OPR Commander)
              </Button>
            </Box>

            {/* Stage 10: AFDPO */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#e0f2f1', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🏛️ Stage 10: AFDPO Publication
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => quickLogin('afdpo.publisher@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
              >
                afdpo.publisher@airforce.mil (AFDPO Publisher)
              </Button>
            </Box>

            {/* Admin */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🛠️ System Administration
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => quickLogin('admin@airforce.mil', 'testpass123')}
                disabled={isLoading}
                sx={{ fontSize: '0.70rem', py: 0.3, px: 1 }}
              >
                admin@airforce.mil (Workflow Administrator)
              </Button>
            </Box>

            {/* Workflow Stages Info */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                🔄 Workflow Stages Overview:
              </Typography>
              <Typography variant="caption" component="div" sx={{ lineHeight: 1.8 }}>
                <strong>1.</strong> Initial Draft (AO) →
                <strong>2.</strong> PCM Review →
                <strong>3.</strong> First Coordination →
                <strong>4.</strong> OPR Feedback Inc. →
                <strong>5.</strong> Second Coordination →
                <strong>6.</strong> OPR Second Update →
                <strong>7.</strong> Legal Review →
                <strong>8.</strong> Post-Legal Update →
                <strong>9.</strong> Leadership Signature →
                <strong>10.</strong> AFDPO Publication
              </Typography>
            </Box>

            {/* Key Features */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e1f5fe', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                ⚡ Key Features:
              </Typography>
              <Typography variant="caption" display="block">
                • Ownership transfer between Action Officers
              </Typography>
              <Typography variant="caption" display="block">
                • PCM gatekeeper at OPR level
              </Typography>
              <Typography variant="caption" display="block">
                • Front Office gatekeepers at organization level
              </Typography>
              <Typography variant="caption" display="block">
                • Two coordination rounds with feedback incorporation
              </Typography>
              <Typography variant="caption" display="block">
                • Legal review with post-legal update
              </Typography>
              <Typography variant="caption" display="block">
                • Leadership signature requirement
              </Typography>
              <Typography variant="caption" display="block">
                • Reset to start functionality
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Clear Session Button */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={clearSession}
            sx={{ mb: 2 }}
          >
            🗑️ Clear Session & Logout
          </Button>
        </Box>
          </>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;