'use client';

import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Login as LoginIcon
} from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const router = useRouter();
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Clear ALL cached data before login
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    try {
      console.log('🔍 LOGIN DEBUG: Submitting login with:', formData);
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
        
        // Redirect to dashboard
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        router.push(redirect);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
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
              sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* OPR Workflow Test Users */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🎯 OPR Workflow Test Users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              8-Stage Air Force Document Review Workflow - Role-Based Access Control
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📝 <strong>OPR (Office of Primary Responsibility):</strong> opr@demo.mil
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Can act on stages: 1, 3, 5, 7 (Initial Draft, Review & Revision, Final Revision, Pre-Publication)
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => quickLogin('opr@demo.mil', 'password123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Quick Login as OPR
                </Button>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🤝 <strong>Coordinator:</strong> coordinator.test@af.mil
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Can act on stages: 2, 4 (First & Second Coordination Review)
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => quickLogin('coordinator.test@af.mil', 'password123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Quick Login as Coordinator
                </Button>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ⚖️ <strong>Legal Reviewer:</strong> legal@demo.mil
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Can act on stage: 6 (Legal Review & Approval)
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => quickLogin('legal@demo.mil', 'password123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Quick Login as Legal
                </Button>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🏛️ <strong>AFDPO (Air Force Publishing Office):</strong> afdpo.analyst@demo.mil
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Can act on stage: 8 (AFDPO Publication Review)
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => quickLogin('afdpo.analyst@demo.mil', 'password123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Quick Login as AFDPO
                </Button>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  👑 <strong>Workflow Admin:</strong> admin@demo.mil
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Can override any stage (1-8) with red admin buttons
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                  onClick={() => quickLogin('admin@demo.mil', 'password123')}
                  disabled={isLoading}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Quick Login as Admin
                </Button>
              </Box>
            </Stack>
            
            {/* Workflow Stages Info */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                🔄 OPR Workflow Stages:
              </Typography>
              <Typography variant="caption" display="block" sx={{ lineHeight: 1.4 }}>
                1→ Initial Draft Preparation → 2→ First Coordination Review → 3→ OPR Review & Revision → 4→ Second Coordination Review → 
                5→ OPR Final Revision → 6→ Legal Review & Approval → 7→ OPR Pre-Publication Review → 8→ AFDPO Publication Review (Complete)
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                💡 Each user sees different buttons and capabilities based on their role and current workflow stage
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