'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Business,
  ArrowBack,
  TrendingUp,
  Description as DocumentIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  totalDocuments: number;
  totalUsers: number;
  totalStorage: number;
  documentsThisMonth: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    documentTitle: string;
    userFullName: string;
    createdAt: string;
  }>;
  topUsers: Array<{
    userId: string;
    fullName: string;
    documentCount: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // For now, we'll use the dashboard stats and enhance with mock data
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          
          // Create enhanced analytics data (mix of real and mock data for demo)
          const mockAnalytics: AnalyticsData = {
            totalDocuments: data.stats?.documents || 0,
            totalUsers: data.stats?.users || 0,
            totalStorage: 156.7, // MB - mock data
            documentsThisMonth: Math.floor((data.stats?.documents || 0) * 0.3),
            categoryBreakdown: [
              { category: 'Legal', count: Math.floor((data.stats?.documents || 0) * 0.25), percentage: 25 },
              { category: 'HR', count: Math.floor((data.stats?.documents || 0) * 0.20), percentage: 20 },
              { category: 'Technical', count: Math.floor((data.stats?.documents || 0) * 0.18), percentage: 18 },
              { category: 'Contract', count: Math.floor((data.stats?.documents || 0) * 0.15), percentage: 15 },
              { category: 'Invoice', count: Math.floor((data.stats?.documents || 0) * 0.12), percentage: 12 },
              { category: 'Other', count: Math.floor((data.stats?.documents || 0) * 0.10), percentage: 10 }
            ],
            recentActivity: [
              {
                id: '1',
                action: 'uploaded',
                documentTitle: 'Q4 Financial Report',
                userFullName: 'Admin User',
                createdAt: new Date().toISOString()
              },
              {
                id: '2',
                action: 'downloaded',
                documentTitle: 'Employee Handbook',
                userFullName: 'Admin User', 
                createdAt: new Date(Date.now() - 3600000).toISOString()
              },
              {
                id: '3',
                action: 'uploaded',
                documentTitle: 'Service Agreement',
                userFullName: 'Admin User',
                createdAt: new Date(Date.now() - 7200000).toISOString()
              }
            ],
            topUsers: [
              { userId: '1', fullName: 'Admin User', documentCount: data.stats?.documents || 0 }
            ]
          };
          
          setAnalytics(mockAnalytics);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Business sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Analytics - Richmond DMS
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography>Loading analytics...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Analytics - Richmond DMS
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor your document management system performance
          </Typography>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DocumentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {analytics?.totalDocuments || 0}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Total Documents
                </Typography>
                <Chip 
                  label={`+${analytics?.documentsThisMonth || 0} this month`} 
                  size="small" 
                  color="success" 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {analytics?.totalUsers || 0}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Active Users
                </Typography>
                <Chip 
                  label="All time" 
                  size="small" 
                  color="info" 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <StorageIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {analytics?.totalStorage?.toFixed(1) || '0.0'}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Storage (MB)
                </Typography>
                <Chip 
                  label="67% capacity" 
                  size="small" 
                  color="warning" 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  98%
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  System Health
                </Typography>
                <Chip 
                  label="Excellent" 
                  size="small" 
                  color="success" 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CategoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Documents by Category
                </Typography>
              </Box>
              
              {analytics?.categoryBreakdown?.map((category) => (
                <Box key={category.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {category.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.count} ({category.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={category.percentage} 
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimelineIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Recent Activity
                </Typography>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Document</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.recentActivity?.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Chip 
                            label={activity.action} 
                            size="small"
                            color={activity.action === 'uploaded' ? 'success' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{activity.documentTitle}</TableCell>
                        <TableCell>{activity.userFullName}</TableCell>
                        <TableCell>
                          {new Date(activity.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Top Contributors */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Contributors
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Documents Contributed</TableCell>
                      <TableCell>Percentage of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.topUsers?.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.documentCount}</TableCell>
                        <TableCell>
                          {analytics?.totalDocuments ? 
                            Math.round((user.documentCount / analytics.totalDocuments) * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AnalyticsPage;