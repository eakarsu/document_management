'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemText, useTheme, alpha } from '@mui/material';
import { Menu as MenuIcon, Close } from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';

export const Header: React.FC = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Image
              src="/images/missionsync/logo-professional.svg"
              alt="Mission Sync AI"
              width={180}
              height={45}
              style={{ marginRight: '10px' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <Button
                  sx={{
                    color: 'text.primary',
                    fontWeight: 500,
                    '&:hover': {
                      color: '#667eea',
                      background: alpha('#667eea', 0.1)
                    }
                  }}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/demo" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: alpha('#667eea', 0.1)
                  }
                }}
              >
                Request Demo
              </Button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                Get Started
              </Button>
            </Link>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{ display: { md: 'none' }, color: '#667eea' }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': { width: 280 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ ml: 'auto', display: 'block' }}
          >
            <Close />
          </IconButton>
          <List>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <ListItem button onClick={handleDrawerToggle}>
                  <ListItemText
                    primary={item.label}
                    sx={{ color: 'text.primary' }}
                  />
                </ListItem>
              </Link>
            ))}
            <Link href="/demo" style={{ textDecoration: 'none' }}>
              <ListItem>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea'
                  }}
                >
                  Request Demo
                </Button>
              </ListItem>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <ListItem>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Get Started
                </Button>
              </ListItem>
            </Link>
          </List>
        </Box>
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
};

export default Header;