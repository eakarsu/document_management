'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  useTheme,
  alpha,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Divider
} from '@mui/material';
import {
  Search,
  CalendarToday,
  Person,
  TrendingUp,
  Security,
  CloudSync,
  Psychology,
  ArrowForward,
  BookmarkBorder,
  Share
} from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  image: string;
}

const BlogPage: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of Military Document Management: AI-Powered Workflows',
      excerpt: 'Explore how artificial intelligence is transforming military documentation processes, from automated compliance checking to intelligent workflow routing.',
      content: 'Full article content...',
      author: {
        name: 'Dr. Sarah Chen',
        avatar: '/api/placeholder/50/50',
        title: 'VP of Engineering'
      },
      publishDate: '2024-03-15',
      readTime: '8 min read',
      category: 'AI & Technology',
      tags: ['AI', 'Workflows', 'Military', 'Automation'],
      featured: true,
      image: '/api/placeholder/600/400'
    },
    {
      id: '2',
      title: 'Securing Sensitive Documents: Best Practices for Defense Organizations',
      excerpt: 'Learn about the latest security protocols and encryption methods that keep classified military documents safe in the digital age.',
      content: 'Full article content...',
      author: {
        name: 'Col. Michael Torres',
        avatar: '/api/placeholder/50/50',
        title: 'Security Advisor'
      },
      publishDate: '2024-03-10',
      readTime: '12 min read',
      category: 'Security',
      tags: ['Security', 'Encryption', 'Compliance', 'Defense'],
      featured: true,
      image: '/api/placeholder/600/400'
    },
    {
      id: '3',
      title: 'Case Study: How Air Force Base Alpha Reduced Processing Time by 75%',
      excerpt: 'A detailed look at how one Air Force base implemented Mission Sync AI to dramatically improve their documentation workflows.',
      content: 'Full article content...',
      author: {
        name: 'Jessica Wang',
        avatar: '/api/placeholder/50/50',
        title: 'Customer Success Manager'
      },
      publishDate: '2024-03-05',
      readTime: '6 min read',
      category: 'Case Studies',
      tags: ['Case Study', 'Air Force', 'Efficiency', 'ROI'],
      featured: false,
      image: '/api/placeholder/600/400'
    },
    {
      id: '4',
      title: 'Understanding Military Document Compliance: A Complete Guide',
      excerpt: 'Navigate the complex world of military document compliance with our comprehensive guide to regulations and best practices.',
      content: 'Full article content...',
      author: {
        name: 'Lt. Col. David Park',
        avatar: '/api/placeholder/50/50',
        title: 'Compliance Officer'
      },
      publishDate: '2024-02-28',
      readTime: '15 min read',
      category: 'Compliance',
      tags: ['Compliance', 'Regulations', 'Military', 'Guide'],
      featured: false,
      image: '/api/placeholder/600/400'
    },
    {
      id: '5',
      title: 'The Power of Collaborative Workflows in Defense Operations',
      excerpt: 'Discover how collaborative document workflows are improving communication and efficiency across military organizations.',
      content: 'Full article content...',
      author: {
        name: 'Emily Rodriguez',
        avatar: '/api/placeholder/50/50',
        title: 'Product Manager'
      },
      publishDate: '2024-02-20',
      readTime: '10 min read',
      category: 'Collaboration',
      tags: ['Collaboration', 'Workflows', 'Teamwork', 'Efficiency'],
      featured: false,
      image: '/api/placeholder/600/400'
    },
    {
      id: '6',
      title: 'Integration Spotlight: Connecting Mission Sync AI with Your Tech Stack',
      excerpt: 'Learn how to seamlessly integrate Mission Sync AI with your existing tools and systems for maximum productivity.',
      content: 'Full article content...',
      author: {
        name: 'Alex Johnson',
        avatar: '/api/placeholder/50/50',
        title: 'Solutions Architect'
      },
      publishDate: '2024-02-15',
      readTime: '7 min read',
      category: 'Integrations',
      tags: ['Integrations', 'APIs', 'Tech Stack', 'Productivity'],
      featured: false,
      image: '/api/placeholder/600/400'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Posts', count: blogPosts.length },
    { id: 'AI & Technology', label: 'AI & Technology', count: blogPosts.filter(p => p.category === 'AI & Technology').length },
    { id: 'Security', label: 'Security', count: blogPosts.filter(p => p.category === 'Security').length },
    { id: 'Case Studies', label: 'Case Studies', count: blogPosts.filter(p => p.category === 'Case Studies').length },
    { id: 'Compliance', label: 'Compliance', count: blogPosts.filter(p => p.category === 'Compliance').length },
    { id: 'Collaboration', label: 'Collaboration', count: blogPosts.filter(p => p.category === 'Collaboration').length }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                label="BLOG"
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
                Insights & Updates
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
                Stay informed with the latest insights on military document management, AI technology, security best practices, and industry trends.
              </Typography>
            </Box>

            {/* Search and Filter */}
            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
              <TextField
                fullWidth
                placeholder="Search articles..."
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

            {/* Category Filter */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={`${category.label} (${category.count})`}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                  color={selectedCategory === category.id ? 'primary' : 'default'}
                  sx={{
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              ))}
            </Box>
          </Container>
        </Box>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <Box sx={{ py: 10 }}>
            <Container maxWidth="lg">
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Featured Articles
              </Typography>
              <Grid container spacing={4}>
                {featuredPosts.map((post) => (
                  <Grid item xs={12} md={6} key={post.id}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="240"
                        image={post.image}
                        alt={post.title}
                      />
                      <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip label={post.category} size="small" color="primary" />
                          <Chip label="Featured" size="small" sx={{ bgcolor: '#ff9800', color: 'white' }} />
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3 }}>
                          {post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                          {post.excerpt}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={post.author.avatar} sx={{ width: 32, height: 32, mr: 1 }} />
                            <Box>
                              <Typography variant="caption" fontWeight={600}>
                                {post.author.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {post.author.title}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                              <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                              {formatDate(post.publishDate)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {post.readTime}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            endIcon={<ArrowForward />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              color: '#667eea'
                            }}
                          >
                            Read More
                          </Button>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" sx={{ minWidth: 'auto', p: 1 }}>
                              <BookmarkBorder fontSize="small" />
                            </Button>
                            <Button size="small" sx={{ minWidth: 'auto', p: 1 }}>
                              <Share fontSize="small" />
                            </Button>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        )}

        {/* Regular Posts */}
        <Box sx={{ py: featuredPosts.length > 0 ? 5 : 10, bgcolor: featuredPosts.length > 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent' }}>
          <Container maxWidth="lg">
            {featuredPosts.length > 0 && (
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Latest Articles
              </Typography>
            )}
            <Grid container spacing={4}>
              {regularPosts.map((post) => (
                <Grid item xs={12} md={6} lg={4} key={post.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.image}
                      alt={post.title}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Chip label={post.category} size="small" color="primary" sx={{ mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3 }}>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                        {post.excerpt.substring(0, 120)}...
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={post.author.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                          <Typography variant="caption" fontWeight={600}>
                            {post.author.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {post.readTime}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" sx={{ mb: 2 }}>
                        <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                        {formatDate(post.publishDate)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
                        {post.tags.slice(0, 2).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                      </Stack>
                      <Button
                        fullWidth
                        endIcon={<ArrowForward />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: '#667eea',
                          borderColor: '#667eea'
                        }}
                        variant="outlined"
                      >
                        Read Article
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredPosts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No articles found matching your search criteria.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>

        {/* Newsletter Signup */}
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
                Stay Updated
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Subscribe to our newsletter for the latest insights on military document management and AI technology
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, maxWidth: 400, mx: 'auto', mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Enter your email"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: 2
                    }
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Subscribe
                </Button>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Weekly updates • No spam • Unsubscribe anytime
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default BlogPage;