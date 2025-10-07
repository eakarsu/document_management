'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Avatar,
  Divider,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  AccessTime as AccessTimeIcon,
  Computer as ComputerIcon,
  Public as PublicIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatar?: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
    domain: string;
  };
  createdAt: string;
  lastLogin?: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState({
    ipAddress: '',
    userAgent: '',
    browser: '',
    os: '',
    device: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    getConnectionInfo();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user || data);  // Handle both {user: ...} and direct user object
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionInfo = () => {
    // Get browser and device info
    const userAgent = navigator.userAgent;

    // Detect browser
    let browser = 'Unknown';
    if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
    else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (userAgent.indexOf('Win') > -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') > -1) os = 'macOS';
    else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
    else if (userAgent.indexOf('Android') > -1) os = 'Android';
    else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

    // Detect device type
    let device = 'Desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(userAgent)) device = 'Tablet';

    setConnectionInfo({
      ipAddress: 'Checking...',
      userAgent,
      browser,
      os,
      device
    });

    // Get IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setConnectionInfo(prev => ({ ...prev, ipAddress: data.ip }));
      })
      .catch(() => {
        setConnectionInfo(prev => ({ ...prev, ipAddress: 'Unable to detect' }));
      });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Failed to load profile</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        User Profile & Connection Details
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, margin: '0 auto', mb: 2, bgcolor: 'primary.main' }}
              src={profile.avatar}
            >
              <Typography variant="h2">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </Typography>
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{profile.username || (profile.email ? profile.email.split('@')[0] : 'user')}
            </Typography>
            <Chip
              label={profile.role?.name || 'User'}
              color="primary"
              sx={{ mt: 1 }}
            />
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                fullWidth
                onClick={() => router.push('/settings')}
              >
                Edit Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* User Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{profile.email}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Organization</Typography>
                    <Typography variant="body1">{profile.organization?.name || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Role</Typography>
                    <Typography variant="body1">{profile.role?.name || 'User'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Member Since</Typography>
                    <Typography variant="body1">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Connection Details */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ComputerIcon sx={{ mr: 1 }} />
              Current Connection Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText
                  primary="IP Address"
                  secondary={connectionInfo.ipAddress}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Browser"
                  secondary={connectionInfo.browser}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Operating System"
                  secondary={connectionInfo.os}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Device Type"
                  secondary={connectionInfo.device}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Last Login"
                  secondary={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Just now'}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Permissions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Permissions & Access
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.role?.permissions && profile.role.permissions.length > 0 ? (
                  profile.role.permissions.map((permission, index) => (
                    <Chip
                      key={index}
                      label={permission.replace(/_/g, ' ')}
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No permissions assigned
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
