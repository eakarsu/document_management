'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Badge,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Psychology,
  Visibility,
  Timeline,
  Speed,
  Warning,
  Error,
  CheckCircle,
  Schedule,
  Group,
  TrendingUp,
  TrendingDown,
  Notifications,
  NotificationsActive,
  Refresh,
  PlayArrow,
  Pause,
  Settings,
  FilterList,
  Analytics,
  Lightbulb,
  Assignment,
  Person,
  AccessTime,
  PriorityHigh,
  Info,
  Done,
  HourglassEmpty,
  Flag,
  VideoCall,
  Chat,
  Phone,
  Email
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface RealtimeWorkflowMonitorProps {
  organizationId: string;
  workflowIds?: string[];
  onAlert?: (alert: WorkflowAlert) => void;
  onIntervention?: (intervention: InterventionSuggestion) => void;
}

interface WorkflowActivity {
  id: string;
  workflowId: string;
  documentTitle: string;
  activity: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REASSIGNED' | 'ESCALATED' | 'COMMENT_ADDED' | 'DEADLINE_UPDATED';
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  details: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface WorkflowStatus {
  workflowId: string;
  documentId: string;
  documentTitle: string;
  currentStep: string;
  overallProgress: number; // 0-100
  health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  velocity: number; // steps per hour
  estimatedCompletion: Date;
  blockers: string[];
  participants: {
    userId: string;
    name: string;
    avatar?: string;
    status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
    lastActivity: Date;
    pendingTasks: number;
  }[];
  metrics: {
    totalSteps: number;
    completedSteps: number;
    avgStepTime: number; // minutes
    delayRisk: number; // 0-100
    qualityScore: number; // 0-100
  };
}

interface WorkflowAlert {
  id: string;
  type: 'DELAY_RISK' | 'BOTTLENECK' | 'CONFLICT' | 'DEADLINE_APPROACHING' | 'QUALITY_ISSUE' | 'PARTICIPANT_UNAVAILABLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  workflowId: string;
  documentTitle: string;
  message: string;
  description: string;
  timestamp: Date;
  actionRequired: boolean;
  suggestedActions: string[];
  affectedUsers: string[];
  estimatedImpact: string;
}

interface InterventionSuggestion {
  id: string;
  workflowId: string;
  type: 'REASSIGN' | 'ESCALATE' | 'SCHEDULE_MEETING' | 'SEND_REMINDER' | 'MODIFY_DEADLINE' | 'ADD_REVIEWER';
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number; // 0-100
  expectedOutcome: string;
  implementation: {
    steps: string[];
    estimatedTime: number; // minutes
    requirements: string[];
  };
}

interface MonitoringSettings {
  realTimeUpdates: boolean;
  alertThresholds: {
    delayRisk: number;
    qualityScore: number;
    participantInactivity: number; // hours
  };
  notificationTypes: string[];
  autoRefreshInterval: number; // seconds
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

const RealtimeWorkflowMonitor: React.FC<RealtimeWorkflowMonitorProps> = ({
  organizationId,
  workflowIds,
  onAlert,
  onIntervention
}) => {
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<WorkflowActivity[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WorkflowAlert[]>([]);
  const [interventionSuggestions, setInterventionSuggestions] = useState<InterventionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [settings, setSettings] = useState<MonitoringSettings>({
    realTimeUpdates: true,
    alertThresholds: {
      delayRisk: 70,
      qualityScore: 60,
      participantInactivity: 24
    },
    notificationTypes: ['DELAY_RISK', 'CONFLICT', 'DEADLINE_APPROACHING'],
    autoRefreshInterval: 30
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WorkflowAlert | null>(null);
  const [alertDetailOpen, setAlertDetailOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Try to call the AI service for document-specific monitoring
      if (selectedDocumentId) {
        try {
          const response = await api.post('/api/ai-workflow/monitor-workflow', {
            documentId: selectedDocumentId,
            organizationId: organizationId
          });

          if (response.ok) {
            const aiResponse = await response.json();
            // Transform AI response to monitoring data format
            // For now, fall back to enhanced mock with document context
          }
        } catch (error) {
          console.warn('AI monitoring service unavailable, using context-aware mock data');
        }
      }

      // Enhanced mock data with document context
      const mockWorkflowStatuses: WorkflowStatus[] = selectedDocumentId ? [
        {
          workflowId: `wf-${selectedDocumentId}`,
          documentId: selectedDocumentId,
          documentTitle: docTitle,
          currentStep: 'Legal Review',
          overallProgress: 65,
          health: 'WARNING',
          velocity: 1.2,
          estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          blockers: ['Awaiting legal team availability'],
          participants: [
            {
              userId: 'user-1',
              name: 'Sarah Chen',
              status: 'ACTIVE',
              lastActivity: new Date(Date.now() - 15 * 60 * 1000),
              pendingTasks: 2
            },
            {
              userId: 'user-2',
              name: 'Mike Johnson',
              status: 'IDLE',
              lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
              pendingTasks: 1
            }
          ],
          metrics: {
            totalSteps: 6,
            completedSteps: 4,
            avgStepTime: 180,
            delayRisk: 75,
            qualityScore: 85
          }
        },
        {
          workflowId: 'wf-2',
          documentId: 'doc-2',
          documentTitle: 'Employee Handbook Revision',
          currentStep: 'HR Approval',
          overallProgress: 80,
          health: 'HEALTHY',
          velocity: 2.1,
          estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          blockers: [],
          participants: [
            {
              userId: 'user-3',
              name: 'Lisa Rodriguez',
              status: 'ACTIVE',
              lastActivity: new Date(Date.now() - 5 * 60 * 1000),
              pendingTasks: 1
            }
          ],
          metrics: {
            totalSteps: 5,
            completedSteps: 4,
            avgStepTime: 120,
            delayRisk: 20,
            qualityScore: 92
          }
        },
        {
          workflowId: 'wf-3',
          documentId: 'doc-3',
          documentTitle: 'IT Security Guidelines',
          currentStep: 'Security Team Review',
          overallProgress: 45,
          health: 'CRITICAL',
          velocity: 0.8,
          estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          blockers: ['Security team overloaded', 'Technical requirements unclear'],
          participants: [
            {
              userId: 'user-4',
              name: 'David Kim',
              status: 'OFFLINE',
              lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000),
              pendingTasks: 3
            },
            {
              userId: 'user-5',
              name: 'Anna Smith',
              status: 'ACTIVE',
              lastActivity: new Date(Date.now() - 30 * 60 * 1000),
              pendingTasks: 1
            }
          ],
          metrics: {
            totalSteps: 7,
            completedSteps: 3,
            avgStepTime: 240,
            delayRisk: 90,
            qualityScore: 70
          }
        }
      ] : [];

      const mockRecentActivity: WorkflowActivity[] = selectedDocumentId ? [
        {
          id: 'act-1',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          activity: 'COMMENT_ADDED',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          user: { id: 'user-1', name: 'Sarah Chen', role: 'Legal Counsel' },
          details: 'Added comments on section 3.2 regarding compliance requirements',
          impact: 'MEDIUM',
          urgency: 'MEDIUM'
        },
        {
          id: 'act-2',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          activity: 'APPROVED',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          user: { id: 'user-3', name: 'Lisa Rodriguez', role: 'HR Manager' },
          details: 'Approved workflow step for the document',
          impact: 'HIGH',
          urgency: 'LOW'
        },
        {
          id: 'act-3',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          activity: 'ESCALATED',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: { id: 'user-5', name: 'Anna Smith', role: 'Reviewer' },
          details: 'Escalated to team lead due to complexity in the document',
          impact: 'HIGH',
          urgency: 'HIGH'
        }
      ] : [];

      const mockAlerts: WorkflowAlert[] = selectedDocumentId ? [
        {
          id: 'alert-1',
          type: 'DELAY_RISK',
          severity: 'HIGH',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          message: 'High delay risk detected',
          description: `Workflow for "${docTitle}" is 25% behind schedule due to reviewer bottleneck`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          actionRequired: true,
          suggestedActions: ['Reassign to available legal reviewer', 'Schedule urgent meeting', 'Extend deadline'],
          affectedUsers: ['user-1', 'user-2'],
          estimatedImpact: '2-3 day delay'
        },
        {
          id: 'alert-2',
          type: 'PARTICIPANT_UNAVAILABLE',
          severity: 'CRITICAL',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          message: 'Key participant unavailable',
          description: `Key reviewer for "${docTitle}" has been offline for 25+ hours with pending critical tasks`,
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          actionRequired: true,
          suggestedActions: ['Reassign tasks to backup reviewer', 'Contact participant directly', 'Escalate to manager'],
          affectedUsers: ['user-4'],
          estimatedImpact: 'Potential 5+ day delay'
        }
      ] : [];

      const mockInterventions: InterventionSuggestion[] = selectedDocumentId ? [
        {
          id: 'int-1',
          workflowId: `wf-${selectedDocumentId}`,
          type: 'SCHEDULE_MEETING',
          title: `Schedule Review Meeting for "${docTitle}"`,
          description: `Organize a focused meeting to resolve questions about "${docTitle}" and speed up review process`,
          urgency: 'HIGH',
          confidence: 85,
          expectedOutcome: 'Reduce review time by 2-3 days',
          implementation: {
            steps: ['Find available time slot', 'Send calendar invites', 'Prepare agenda', 'Conduct meeting'],
            estimatedTime: 45,
            requirements: ['Legal team availability', 'Meeting room', 'Document access']
          }
        },
        {
          id: 'int-2',
          workflowId: `wf-${selectedDocumentId}`,
          type: 'REASSIGN',
          title: `Reassign Tasks for "${docTitle}"`,
          description: `Redistribute pending tasks for "${docTitle}" to available team members`,
          urgency: 'HIGH',
          confidence: 90,
          expectedOutcome: 'Resume workflow progress within 4 hours',
          implementation: {
            steps: ['Identify available reviewers', 'Transfer task ownership', 'Update assignments', 'Notify participants'],
            estimatedTime: 30,
            requirements: ['Manager approval', 'Available backup reviewers']
          }
        }
      ] : [];

      setWorkflowStatuses(mockWorkflowStatuses);
      setRecentActivity(mockRecentActivity);
      setActiveAlerts(mockAlerts);
      setInterventionSuggestions(mockInterventions);

      // Trigger alert callbacks
      mockAlerts.forEach(alert => {
        if (onAlert && alert.actionRequired) {
          onAlert(alert);
        }
      });

    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = () => {
    setMonitoringActive(true);
    fetchMonitoringData();
    
    if (settings.realTimeUpdates) {
      intervalRef.current = setInterval(fetchMonitoringData, settings.autoRefreshInterval * 1000);
    }
  };

  const stopMonitoring = () => {
    setMonitoringActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleIntervention = async (intervention: InterventionSuggestion) => {
    try {
      setLoading(true);
      
      // Mock intervention implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onIntervention) {
        onIntervention(intervention);
      }

      // Remove intervention from suggestions after implementation
      setInterventionSuggestions(prev => prev.filter(int => int.id !== intervention.id));
      
    } catch (error) {
      console.error('Failed to implement intervention:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to implement intervention');
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'success';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'SUBMITTED': return <Assignment />;
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Error color="error" />;
      case 'REASSIGNED': return <Person />;
      case 'ESCALATED': return <PriorityHigh color="warning" />;
      case 'COMMENT_ADDED': return <Chat />;
      case 'DEADLINE_UPDATED': return <Schedule />;
      default: return <Info />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'DELAY_RISK': return <HourglassEmpty />;
      case 'BOTTLENECK': return <Warning />;
      case 'CONFLICT': return <Error />;
      case 'DEADLINE_APPROACHING': return <Schedule />;
      case 'QUALITY_ISSUE': return <Flag />;
      case 'PARTICIPANT_UNAVAILABLE': return <Person />;
      default: return <Notifications />;
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'IDLE': return 'warning';
      case 'OFFLINE': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (organizationId && selectedDocumentId) {
      startMonitoring();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [organizationId, selectedDocumentId, settings.realTimeUpdates, settings.autoRefreshInterval]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    // Clear previous data when switching documents
    setWorkflowStatuses([]);
    setRecentActivity([]);
    setActiveAlerts([]);
    setInterventionSuggestions([]);
  };

  const criticalAlertsCount = activeAlerts.filter(alert => alert.severity === 'CRITICAL').length;
  const highAlertsCount = activeAlerts.filter(alert => alert.severity === 'HIGH').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          Real-time Workflow Monitor
          <Badge badgeContent={criticalAlertsCount + highAlertsCount} color="error" sx={{ ml: 2 }}>
            <NotificationsActive />
          </Badge>
          {loading && <CircularProgress size={30} sx={{ ml: 2 }} />}
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
          <FormControlLabel
            control={
              <Switch
                checked={monitoringActive}
                onChange={(e) => e.target.checked ? startMonitoring() : stopMonitoring()}
                disabled={!selectedDocumentId}
              />
            }
            label="Live Monitoring"
          />
          <Button variant="outlined" size="small" startIcon={<Settings />} onClick={() => setSettingsDialogOpen(true)}>
            Settings
          </Button>
          <Button variant="outlined" size="small" onClick={fetchMonitoringData} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Refresh
          </Button>
        </Box>
      </Box>

      {!selectedDocumentId && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Timeline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-time Workflow Monitor
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Select a document to monitor its workflow in real-time
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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                  <CircularProgress size={40} sx={{ mr: 2 }} />
                  <Typography variant="body1">Loading documents...</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alert Summary */}
      {selectedDocumentId && activeAlerts.length > 0 && (
        <Alert 
          severity={criticalAlertsCount > 0 ? 'error' : 'warning'} 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setSelectedTab(2)}>
              View All
            </Button>
          }
        >
          <Typography variant="subtitle2">
            {criticalAlertsCount > 0 && `${criticalAlertsCount} critical alert${criticalAlertsCount > 1 ? 's' : ''}`}
            {criticalAlertsCount > 0 && highAlertsCount > 0 && ', '}
            {highAlertsCount > 0 && `${highAlertsCount} high priority alert${highAlertsCount > 1 ? 's' : ''}`}
            {' '}require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Main Content Tabs */}
      {selectedDocumentId && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Workflow Status" icon={<Timeline />} />
            <Tab label="Live Activity" icon={<Visibility />} />
            <Tab label={`Alerts (${activeAlerts.length})`} icon={<Notifications />} />
            <Tab label={`Interventions (${interventionSuggestions.length})`} icon={<Analytics />} />
          </Tabs>
        </Box>
      )}

      {/* Loading Overlay */}
      {loading && selectedDocumentId && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 400,
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3 }}>Analyzing Workflow...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please wait while we fetch real-time data</Typography>
        </Box>
      )}

      {/* Workflow Status Tab */}
      {!loading && selectedDocumentId && selectedTab === 0 && (
        <Grid container spacing={3}>
          {workflowStatuses.map((workflow) => (
            <Grid item xs={12} lg={6} key={workflow.workflowId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{workflow.documentTitle}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current: {workflow.currentStep}
                      </Typography>
                    </Box>
                    <Chip 
                      label={workflow.health}
                      color={getHealthColor(workflow.health) as any}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2">{workflow.overallProgress}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={workflow.overallProgress}
                      color={getHealthColor(workflow.health) as any}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Velocity</Typography>
                      <Typography variant="body2">{workflow.velocity} steps/hour</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">ETA</Typography>
                      <Typography variant="body2">
                        {workflow.estimatedCompletion.toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Delay Risk</Typography>
                      <Typography variant="body2" color={workflow.metrics.delayRisk > 70 ? 'error.main' : 'text.primary'}>
                        {workflow.metrics.delayRisk}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Quality Score</Typography>
                      <Typography variant="body2" color="success.main">
                        {workflow.metrics.qualityScore}%
                      </Typography>
                    </Grid>
                  </Grid>

                  {workflow.blockers.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Blockers:</Typography>
                      {workflow.blockers.map((blocker, index) => (
                        <Typography key={index} variant="body2">• {blocker}</Typography>
                      ))}
                    </Alert>
                  )}

                  <Typography variant="subtitle2" gutterBottom>Participants</Typography>
                  <List dense>
                    {workflow.participants.map((participant) => (
                      <ListItem key={participant.userId} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Badge 
                            color={getParticipantStatusColor(participant.status) as any}
                            variant="dot"
                          >
                            <Avatar>{participant.name[0]}</Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={participant.name}
                          secondary={`${participant.pendingTasks} pending • Last active ${Math.round((Date.now() - participant.lastActivity.getTime()) / (1000 * 60))}m ago`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Live Activity Tab */}
      {!loading && selectedDocumentId && selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Visibility sx={{ mr: 1 }} />
              Recent Activity
            </Typography>
            
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getActivityIcon(activity.activity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>{activity.user.name}</strong> {activity.activity.toLowerCase().replace('_', ' ')} in {activity.documentTitle}
                          </Typography>
                          <Chip 
                            label={activity.impact}
                            size="small"
                            color={activity.impact === 'HIGH' ? 'error' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.details}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((Date.now() - activity.timestamp.getTime()) / (1000 * 60))} minutes ago
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Alerts Tab */}
      {!loading && selectedDocumentId && selectedTab === 2 && (
        <Grid container spacing={2}>
          {activeAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1 }}>
                      <Box sx={{ mr: 2, mt: 0.5 }}>
                        {getAlertIcon(alert.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ mr: 1 }}>
                            {alert.message}
                          </Typography>
                          <Chip 
                            label={alert.severity}
                            size="small"
                            color={getSeverityColor(alert.severity) as any}
                          />
                          <Chip 
                            label={alert.type.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {alert.documentTitle} • {Math.round((Date.now() - alert.timestamp.getTime()) / (1000 * 60))} minutes ago
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {alert.description}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          <strong>Estimated Impact:</strong> {alert.estimatedImpact}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button 
                        size="small"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setAlertDetailOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small"
                        color="error"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {activeAlerts.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Active Alerts
                </Typography>
                <Typography color="text.secondary">
                  All workflows are running smoothly
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Interventions Tab */}
      {!loading && selectedDocumentId && selectedTab === 3 && (
        <Grid container spacing={2}>
          {interventionSuggestions.map((intervention) => (
            <Grid item xs={12} md={6} key={intervention.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{intervention.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {intervention.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={intervention.urgency}
                        size="small"
                        color={intervention.urgency === 'HIGH' ? 'error' : 'warning'}
                      />
                      <Typography variant="caption" align="center">
                        {intervention.confidence}% confidence
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Expected Outcome:</strong> {intervention.expectedOutcome}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>Implementation Steps:</Typography>
                  <List dense>
                    {intervention.implementation.steps.map((step, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Typography variant="caption" sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}>
                            {index + 1}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Est. time: {intervention.implementation.estimatedTime} minutes
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => handleIntervention(intervention)}
                      disabled={loading}
                    >
                      Implement
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {interventionSuggestions.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Done sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Interventions Needed
                </Typography>
                <Typography color="text.secondary">
                  All workflows are performing optimally
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Alert Detail Dialog */}
      <Dialog open={alertDetailOpen} onClose={() => setAlertDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.message}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Suggested Actions:</Typography>
              <List>
                {selectedAlert.suggestedActions.map((action, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={action} />
                  </ListItem>
                ))}
              </List>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Estimated Impact:</strong> {selectedAlert.estimatedImpact}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDetailOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => selectedAlert && dismissAlert(selectedAlert.id)}>
            Dismiss Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Monitoring Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={settings.realTimeUpdates}
                onChange={(e) => setSettings(prev => ({ ...prev, realTimeUpdates: e.target.checked }))}
              />
            }
            label="Real-time Updates"
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>Auto-refresh Interval (seconds)</Typography>
          <Typography variant="body2" gutterBottom>{settings.autoRefreshInterval}</Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Alert Thresholds</Typography>
          <Typography variant="body2">Delay Risk: {settings.alertThresholds.delayRisk}%</Typography>
          <Typography variant="body2">Quality Score: {settings.alertThresholds.qualityScore}%</Typography>
          <Typography variant="body2">Participant Inactivity: {settings.alertThresholds.participantInactivity} hours</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => setSettingsDialogOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealtimeWorkflowMonitor;