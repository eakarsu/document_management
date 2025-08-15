'use client';

import React, { useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const ClearAuthPage: React.FC = () => {
  const router = useRouter();

  const clearAuthData = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    alert('Authentication data cleared! Redirecting to login...');
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  useEffect(() => {
    // Auto-clear on page load
    clearAuthData();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Clearing Authentication Data
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          This will clear all stored authentication tokens and redirect you to the login page.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={clearAuthData}
          size="large"
        >
          Clear Auth Data
        </Button>
      </Box>
    </Container>
  );
};

export default ClearAuthPage;