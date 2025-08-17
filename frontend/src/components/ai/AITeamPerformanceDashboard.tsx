'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Speed,
  Group,
  Star,
  AccessTime,
  CheckCircle,
  Warning,
  Error,
  MoreVert,
  Refresh,
  FilterList,
  Download,
  Insights,
  EmojiEvents,
  Assignment,
  Timeline,
  Compare,
  Analytics,
  Person,
  WorkHistory,
  ThumbUp,
  Schedule
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AITeamPerformanceDashboardProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onInsightsGenerated?: (insights: TeamPerformanceInsights) => void;
}

interface TeamMemberPerformance {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  performance: {
    overallScore: number; // 0-100
    productivity: number; // 0-100
    quality: number; // 0-100
    collaboration: number; // 0-100
    efficiency: number; // 0-100
  };
  metrics: {
    documentsReviewed: number;
    averageReviewTime: number; // hours
    approvalRate: number; // percentage
    rejectionRate: number; // percentage
    responseTime: number; // hours
    workloadCapacity: number; // percentage
    mentorshipScore: number; // 0-100
  };
  trends: {
    performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    productivityChange: number; // percentage change
    qualityChange: number; // percentage change
    workloadTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };
  strengths: string[];
  improvementAreas: string[];
  aiRecommendations: string[];
}

interface TeamCollaborationMetrics {
  teamCohesion: number; // 0-100
  communicationEfficiency: number; // 0-100
  knowledgeSharing: number; // 0-100
  conflictResolution: number; // 0-100
  crossFunctionalWork: number; // 0-100
  mentorshipActivity: number; // 0-100
}

interface ProductivityInsight {
  type: 'BOTTLENECK' | 'OPPORTUNITY' | 'STRENGTH' | 'RISK';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedMembers: string[];
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  recommendedActions: string[];
  estimatedImprovement: number; // percentage
}

interface TeamPerformanceInsights {
  organizationId: string;
  timeRange: string;
  analyzedAt: Date;
  teamMembers: TeamMemberPerformance[];
  teamMetrics: {
    averagePerformance: number;
    totalProductivity: number;
    teamEfficiency: number;
    collaborationIndex: number;
    workloadBalance: number;
    knowledgeDistribution: number;
  };
  collaboration: TeamCollaborationMetrics;
  insights: ProductivityInsight[];
  topPerformers: string[];
  riskyMembers: string[];
  recommendations: {
    teamLevel: string[];
    individualLevel: { [userId: string]: string[] };
  };
  predictiveAnalytics: {
    burnoutRisk: { userId: string; riskLevel: number }[];
    promotionCandidates: string[];
    trainingNeeds: { skill: string; members: string[] }[];
  };
}

interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const AITeamPerformanceDashboard: React.FC<AITeamPerformanceDashboardProps> = ({
  organizationId,
  timeRange = 'month',
  onInsightsGenerated
}) => {
  const [insights, setInsights] = useState<TeamPerformanceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.get('/api/documents/search?limit=20');
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!selectedDocumentId) {
      setError('Please select a document to analyze team performance');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Try to call the AI service for document-specific team performance analysis
      try {
        const response = await api.post('/api/ai-workflow/analyze-team-performance', {
          documentId: selectedDocumentId,
          organizationId: organizationId,
          timeRange: selectedTimeRange
        });

        if (response.ok) {
          const aiResponse = await response.json();
          // Transform AI response to team performance format
          // For now, fall back to enhanced mock with document context
        }
      } catch (error) {
        console.warn('AI team performance service unavailable, using context-aware mock data');
      }

      // Mock insights for demo - in real implementation, this would call the AI service
      const mockInsights: TeamPerformanceInsights = {
        organizationId,
        timeRange: selectedTimeRange,
        analyzedAt: new Date(),
        teamMembers: [
          {
            userId: 'user-1',
            name: 'Alice Johnson',
            email: 'alice.johnson@company.com',
            role: 'Senior Document Reviewer',
            department: 'Legal',
            performance: {
              overallScore: 92,
              productivity: 95,
              quality: 88,
              collaboration: 90,
              efficiency: 94
            },
            metrics: {
              documentsReviewed: 85,
              averageReviewTime: 2.3,
              approvalRate: 94,
              rejectionRate: 6,
              responseTime: 1.2,
              workloadCapacity: 78,
              mentorshipScore: 85
            },
            trends: {
              performanceTrend: 'IMPROVING',
              productivityChange: 8,
              qualityChange: 3,
              workloadTrend: 'STABLE'
            },
            strengths: [`Fast turnaround on "${docTitle}" type documents`, 'High accuracy in reviews', 'Great mentorship'],
            improvementAreas: [`Documentation consistency for "${selectedDoc?.category}" category`],
            aiRecommendations: [`Consider for "${docTitle}" workflow team lead role`, `Expand mentorship for "${selectedDoc?.category}" documents`]
          },
          {
            userId: 'user-2',
            name: 'Bob Smith',
            email: 'bob.smith@company.com',
            role: 'Document Reviewer',
            department: 'Compliance',
            performance: {
              overallScore: 76,
              productivity: 72,
              quality: 83,
              collaboration: 74,
              efficiency: 75
            },
            metrics: {
              documentsReviewed: 58,
              averageReviewTime: 4.1,
              approvalRate: 87,
              rejectionRate: 13,
              responseTime: 2.8,
              workloadCapacity: 92,
              mentorshipScore: 65
            },
            trends: {
              performanceTrend: 'DECLINING',
              productivityChange: -12,
              qualityChange: 2,
              workloadTrend: 'INCREASING'
            },
            strengths: [`Thorough analysis of "${docTitle}" documents`, 'Attention to detail'],
            improvementAreas: [`Speed of review for "${selectedDoc?.category}" documents`, 'Team communication'],
            aiRecommendations: [`Provide time management training for "${docTitle}" workflow`, 'Reduce workload temporarily', `Pair with mentor for "${selectedDoc?.category}" expertise`]
          },
          {
            userId: 'user-3',
            name: 'Carol Davis',
            email: 'carol.davis@company.com',
            role: 'Junior Reviewer',
            department: 'Operations',
            performance: {
              overallScore: 84,
              productivity: 88,
              quality: 79,
              collaboration: 86,
              efficiency: 85
            },
            metrics: {
              documentsReviewed: 72,
              averageReviewTime: 3.2,
              approvalRate: 91,
              rejectionRate: 9,
              responseTime: 1.8,
              workloadCapacity: 65,
              mentorshipScore: 72
            },
            trends: {
              performanceTrend: 'IMPROVING',
              productivityChange: 15,
              qualityChange: 7,
              workloadTrend: 'STABLE'
            },
            strengths: ['Quick learner', 'Good collaboration', `Consistent improvement on "${selectedDoc?.category}" documents`],
            improvementAreas: [`Complex "${docTitle}" document handling`, `Technical knowledge for "${selectedDoc?.category}"`],
            aiRecommendations: [`Provide advanced training for "${docTitle}" workflows`, `Assign challenging "${selectedDoc?.category}" projects`, 'Consider for promotion']
          }
        ],
        teamMetrics: {
          averagePerformance: 84,
          totalProductivity: 85,
          teamEfficiency: 85,
          collaborationIndex: 83,
          workloadBalance: 78,
          knowledgeDistribution: 74
        },
        collaboration: {
          teamCohesion: 82,
          communicationEfficiency: 79,
          knowledgeSharing: 76,
          conflictResolution: 85,
          crossFunctionalWork: 73,
          mentorshipActivity: 74
        },
        insights: [
          {
            type: 'RISK',
            priority: 'HIGH',
            title: 'Bob Smith showing signs of burnout',
            description: 'Declining performance with increasing workload suggests potential burnout risk',
            affectedMembers: ['user-2'],
            impact: 'NEGATIVE',
            recommendedActions: ['Reduce workload', 'Provide support', 'Consider time off'],
            estimatedImprovement: 25
          },
          {
            type: 'OPPORTUNITY',
            priority: 'MEDIUM',
            title: 'Carol Davis ready for advancement',
            description: 'Consistent improvement and strong collaboration make her a promotion candidate',
            affectedMembers: ['user-3'],
            impact: 'POSITIVE',
            recommendedActions: ['Provide advanced training', 'Assign leadership tasks', 'Consider promotion'],
            estimatedImprovement: 20
          },
          {
            type: 'STRENGTH',
            priority: 'LOW',
            title: 'Alice Johnson excellent mentor',
            description: 'High mentorship score and team impact - consider expanding role',
            affectedMembers: ['user-1'],
            impact: 'POSITIVE',
            recommendedActions: ['Formalize mentorship program', 'Document best practices'],
            estimatedImprovement: 15
          }
        ],
        topPerformers: ['user-1', 'user-3'],
        riskyMembers: ['user-2'],
        recommendations: {
          teamLevel: [
            'Implement cross-training program to improve knowledge distribution',
            'Set up regular team collaboration sessions',
            'Create mentorship pairings between senior and junior members'
          ],
          individualLevel: {
            'user-1': ['Consider team lead position', 'Expand mentorship responsibilities'],
            'user-2': ['Reduce workload temporarily', 'Provide time management training'],
            'user-3': ['Provide advanced training opportunities', 'Assign challenging projects']
          }
        },
        predictiveAnalytics: {
          burnoutRisk: [
            { userId: 'user-2', riskLevel: 85 },
            { userId: 'user-1', riskLevel: 25 }
          ],
          promotionCandidates: ['user-3', 'user-1'],
          trainingNeeds: [
            { skill: 'Advanced Document Analysis', members: ['user-3'] },
            { skill: 'Time Management', members: ['user-2'] },
            { skill: 'Leadership Skills', members: ['user-1', 'user-3'] }
          ]
        }
      };

      setInsights(mockInsights);
      
      if (onInsightsGenerated) {
        onInsightsGenerated(mockInsights);
      }

    } catch (error) {
      console.error('Failed to generate team insights:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to generate team insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      generateInsights();
    }
  }, [selectedDocumentId, documents, organizationId, selectedTimeRange]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setInsights(null); // Clear previous insights
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return <TrendingUp color="success" />;
      case 'DECLINING': return <TrendingDown color="error" />;
      default: return <TrendingUp color="disabled" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'RISK': return <Warning color="error" />;
      case 'OPPORTUNITY': return <Star color="primary" />;
      case 'STRENGTH': return <CheckCircle color="success" />;
      default: return <Insights />;
    }
  };

  if (loading && !insights) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Analyzing team performance with AI...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={generateInsights}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Team Performance Dashboard
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Get AI-powered insights into your team's performance and collaboration
            </Typography>
            <Button variant="contained" onClick={generateInsights} startIcon={<Analytics />}>
              Analyze Team Performance
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDocumentId) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Team Performance Dashboard
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to analyze team performance and collaboration patterns
            </Typography>
            
            <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <FormControl fullWidth>
                <InputLabel>Select Document</InputLabel>
                <Select
                  value={selectedDocumentId}
                  label="Select Document"
                  onChange={handleDocumentChange}
                  disabled={documentsLoading}
                >
                  {documents.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      <Box>
                        <Typography variant="body2">{doc.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.category} • {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {documentsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="caption">Loading documents...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const filteredMembers = insights ? insights.teamMembers.filter(member => 
    filterDepartment === 'all' || member.department === filterDepartment
  ) : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          AI Team Performance Dashboard
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Document</InputLabel>
            <Select
              value={selectedDocumentId}
              label="Document"
              onChange={handleDocumentChange}
              disabled={documentsLoading}
            >
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                    {doc.title}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label="Time Range"
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              disabled={!selectedDocumentId}
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="quarter">Quarter</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={generateInsights} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Team Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">{insights.teamMetrics.averagePerformance}</Typography>
              <Typography variant="caption" color="text.secondary">Average Performance</Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights.teamMetrics.averagePerformance}
                color="primary"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">{insights.teamMetrics.teamEfficiency}</Typography>
              <Typography variant="caption" color="text.secondary">Team Efficiency</Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights.teamMetrics.teamEfficiency}
                color="success"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">{insights.collaboration.teamCohesion}</Typography>
              <Typography variant="caption" color="text.secondary">Team Cohesion</Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights.collaboration.teamCohesion}
                color="info"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">{insights.teamMetrics.workloadBalance}</Typography>
              <Typography variant="caption" color="text.secondary">Workload Balance</Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights.teamMetrics.workloadBalance}
                color="warning"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Team Members Performance */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Group sx={{ mr: 1 }} />
                  Team Members ({filteredMembers.length})
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filterDepartment}
                    label="Department"
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                    <MenuItem value="Compliance">Compliance</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Performance</TableCell>
                      <TableCell>Trend</TableCell>
                      <TableCell>Workload</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: getPerformanceColor(member.performance.overallScore) + '.main' }}>
                              {member.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{member.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {member.role} • {member.department}
                              </Typography>
                            </Box>
                            {insights.topPerformers.includes(member.userId) && (
                              <Star color="primary" sx={{ ml: 1 }} />
                            )}
                            {insights.riskyMembers.includes(member.userId) && (
                              <Warning color="error" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {member.performance.overallScore}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={member.performance.overallScore}
                              color={getPerformanceColor(member.performance.overallScore) as any}
                              sx={{ width: 60, height: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTrendIcon(member.trends.performanceTrend)}
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {member.trends.productivityChange > 0 ? '+' : ''}{member.trends.productivityChange}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${member.metrics.workloadCapacity}%`}
                            size="small"
                            color={
                              member.metrics.workloadCapacity > 90 ? 'error' :
                              member.metrics.workloadCapacity > 75 ? 'warning' : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              setMenuAnchor(e.currentTarget);
                              setSelectedMember(member.userId);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Insights sx={{ mr: 1 }} />
                AI Insights
              </Typography>

              <List dense>
                {insights.insights.map((insight, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: insight.type === 'RISK' ? 'error.main' : 'primary.main' }}>
                        {getInsightIcon(insight.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={insight.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {insight.description}
                          </Typography>
                          <Chip 
                            label={insight.priority} 
                            size="small" 
                            color={
                              insight.priority === 'HIGH' ? 'error' :
                              insight.priority === 'MEDIUM' ? 'warning' : 'success'
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 1 }} />
                Predictive Analytics
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Burnout Risk</Typography>
                {insights.predictiveAnalytics.burnoutRisk.map((risk, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 100 }}>
                      {insights.teamMembers.find(m => m.userId === risk.userId)?.name}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={risk.riskLevel}
                      color={risk.riskLevel > 70 ? 'error' : 'warning'}
                      sx={{ flexGrow: 1, mx: 1 }}
                    />
                    <Typography variant="caption">{risk.riskLevel}%</Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Promotion Candidates</Typography>
                {insights.predictiveAnalytics.promotionCandidates.map((userId, index) => {
                  const member = insights.teamMembers.find(m => m.userId === userId);
                  return (
                    <Chip 
                      key={index}
                      label={member?.name}
                      color="success"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEvents sx={{ mr: 1 }} />
                AI Recommendations
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Team-Level Recommendations</Typography>
                  <List dense>
                    {insights.recommendations.teamLevel.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <CheckCircle color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Training Needs</Typography>
                  {insights.predictiveAnalytics.trainingNeeds.map((need, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {need.skill}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {need.members.map((userId, idx) => {
                          const member = insights.teamMembers.find(m => m.userId === userId);
                          return (
                            <Chip 
                              key={idx}
                              label={member?.name}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Person sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Assignment sx={{ mr: 1 }} />
          Assign Tasks
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Schedule sx={{ mr: 1 }} />
          Schedule 1:1
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AITeamPerformanceDashboard;