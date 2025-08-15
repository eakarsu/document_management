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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        {/* Demo Users */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Demo Users
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                👑 <strong>Admin:</strong> admin@richmond-dms.com / admin123
              </Typography>
              <Typography variant="body2">
                👔 <strong>Manager:</strong> manager@richmond-dms.com / manager123
              </Typography>
              <Typography variant="body2">
                👤 <strong>User:</strong> user@richmond-dms.com / user123
              </Typography>
            </Stack>
          </CardContent>
        </Card>

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