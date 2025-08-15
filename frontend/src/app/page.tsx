'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { Business } from '@mui/icons-material';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    const timer = setTimeout(() => {
      if (user && accessToken) {
        // User is authenticated, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container maxWidth="sm" className="full-height center-content">
      <Box sx={{ textAlign: 'center' }}>
        <Business sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Richmond Document Management System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Checking authentication...
        </Typography>
        <CircularProgress />
      </Box>
    </Container>
  );
}