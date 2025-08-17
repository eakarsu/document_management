'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Fab,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Psychology,
  Send,
  Group,
  TrendingUp,
  Warning,
  CheckCircle,
  Close,
  ExpandLess,
  ExpandMore,
  Lightbulb,
  Chat,
  Analytics,
  AutoFixHigh,
  People,
  Speed
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface CollaborativeAIAssistantProps {
  publishingId?: string;
  participantIds?: string[];
  organizationId?: string;
  onClose?: () => void;
}

interface CollaborationInsights {
  meetingSummary: string;
  actionItems: {
    assignee: string;
    task: string;
    deadline: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  consensusLevel: number;
  disagreements: {
    topic: string;
    participants: string[];
    resolution: string;
  }[];
  nextSteps: string[];
}

interface RealTimeAnalysis {
  consensusLevel: number;
  engagementLevel: number;
  conflictDetected: boolean;
  recommendedInterventions: string[];
  participantInsights: {
    userId: string;
    engagement: number;
    sentiment: string;
  }[];
}

interface AISession {
  sessionId: string;
  publishingId: string;
  participants: {
    userId: string;
    role: string;
    joinedAt: Date;
    lastActive: Date;
    status: 'ACTIVE' | 'IDLE' | 'DISCONNECTED';
  }[];
  aiAssistant: {
    enabled: boolean;
    suggestions: string[];
    moderationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  realTimeAnalysis: {
    consensusLevel: number;
    conflictAreas: string[];
    recommendedActions: string[];
    urgencyScore: number;
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

const CollaborativeAIAssistant: React.FC<CollaborativeAIAssistantProps> = ({
  publishingId,
  participantIds,
  organizationId,
  onClose
}) => {
  const [session, setSession] = useState<AISession | null>(null);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState<RealTimeAnalysis | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    type: 'ai' | 'user' | 'system';
    content: string;
    timestamp: Date;
    sender?: string;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mediationDialog, setMediationDialog] = useState(false);
  const [consensusDialog, setConsensusDialog] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(publishingId || '');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!publishingId) {
      fetchDocuments();
    }
  }, []);

  useEffect(() => {
    if ((publishingId || selectedDocumentId) && (participantIds?.length || 0) > 0) {
      initializeAISession();
    }
  }, [publishingId, selectedDocumentId, participantIds]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up real-time analysis polling
    const interval = setInterval(() => {
      if (session) {
        analyzeCollaborationRealTime();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeAISession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/ai-workflow/collaborative/create-ai-session', {
        publishingId,
        participantIds,
        options: {
          aiModerationLevel: 'MEDIUM',
          autoSuggestions: true,
          realTimeAnalysis: true
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create AI collaborative session');
      }

      const data = await response.json();
      setSession(data.session);

      // Add initial AI messages
      setMessages([
        {
          type: 'system',
          content: 'AI Collaborative Assistant activated',
          timestamp: new Date()
        },
        {
          type: 'ai',
          content: `Welcome to the collaborative session! I'm here to help facilitate productive discussion and resolve any conflicts. I've detected ${participantIds.length} participants are ready to collaborate.`,
          timestamp: new Date()
        }
      ]);

      // Add initial suggestions as messages
      if (data.session.aiAssistant.suggestions) {
        data.session.aiAssistant.suggestions.forEach((suggestion: string) => {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: suggestion,
            timestamp: new Date()
          }]);
        });
      }

      // Start real-time analysis
      analyzeCollaborationRealTime();

    } catch (error) {
      console.error('Failed to initialize AI session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize AI session');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCollaborationRealTime = async () => {
    if (!session) return;

    try {
      const response = await api.get(`/api/ai-workflow/collaborative/analyze/${session.sessionId}`);

      if (response.ok) {
        const data = await response.json();
        setRealTimeAnalysis(data.analysis);

        // Add AI recommendations as messages if consensus is low or conflict detected
        if (data.analysis.conflictDetected || data.analysis.consensusLevel < 50) {
          if (data.analysis.recommendedInterventions.length > 0) {
            setMessages(prev => [...prev, {
              type: 'ai',
              content: `⚠️ I've detected some collaboration challenges. Here are my recommendations: ${data.analysis.recommendedInterventions.join(', ')}`,
              timestamp: new Date()
            }]);
          }
        }

        // Positive reinforcement for good collaboration
        if (data.analysis.consensusLevel > 80 && data.analysis.engagementLevel > 70) {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: '✅ Excellent collaboration! High consensus and engagement detected. Great time to finalize decisions.',
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to analyze collaboration:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date(),
      sender: 'You'
    };

    setMessages(prev => [...prev, userMessage]);

    // Process AI response based on message content
    let aiResponse = '';
    const lowerInput = inputMessage.toLowerCase();

    if (lowerInput.includes('conflict') || lowerInput.includes('disagree')) {
      aiResponse = "I can help resolve this conflict. Would you like me to facilitate a mediation session or suggest compromise solutions?";
    } else if (lowerInput.includes('consensus') || lowerInput.includes('agreement')) {
      aiResponse = "I can help build consensus. Let me analyze the current positions and suggest common ground areas.";
    } else if (lowerInput.includes('summary') || lowerInput.includes('action')) {
      aiResponse = "I can generate a summary of our discussion and extract action items. Would you like me to do that now?";
    } else {
      aiResponse = "I understand your input. How can I help facilitate better collaboration on this workflow?";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
    }, 1000);

    setInputMessage('');
  };

  const handleMediateConflict = async () => {
    try {
      const response = await api.post('/api/ai-workflow/collaborative/mediate-conflict', {
        publishingId,
        conflictDescription: 'Automated conflict detection from AI collaborative session',
        involvedUserIds: participantIds
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `🤝 I've prepared a conflict mediation plan:\n\nStrategy: ${data.mediation.mediationPlan.join('\n')}\n\nSuggested compromises: ${data.mediation.suggestedCompromises.join(', ')}\n\nExpected resolution time: ${data.mediation.timelineToResolution} hours`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to mediate conflict:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error while preparing the mediation plan. Please try again.',
        timestamp: new Date()
      }]);
    }
    setMediationDialog(false);
  };

  const handleBuildConsensus = async () => {
    try {
      const response = await api.post('/api/ai-workflow/collaborative/build-consensus', {
        publishingId
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `🎯 Consensus Building Analysis:\n\nCommon Ground: ${data.consensus.commonGround.join(', ')}\n\nDisagreement Points: ${data.consensus.disagreementPoints.join(', ')}\n\nProposed Resolution: ${data.consensus.proposedResolution}\n\nConfidence Level: ${data.consensus.confidenceLevel}%`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to build consensus:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error while analyzing consensus. Please try again.',
        timestamp: new Date()
      }]);
    }
    setConsensusDialog(false);
  };

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setSession(null); // Clear previous session
    setMessages([]); // Clear previous messages
    setRealTimeAnalysis(null); // Clear previous analysis
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'success';
      case 'NEGATIVE': return 'error';
      default: return 'default';
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement > 70) return 'success';
    if (engagement > 40) return 'warning';
    return 'error';
  };

  if (!expanded) {
    return (
      <Fab
        color="primary"
        onClick={() => setExpanded(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <Psychology />
      </Fab>
    );
  }

  if (!publishingId && !selectedDocumentId) {
    return (
      <Card sx={{ position: 'fixed', bottom: 16, right: 16, width: 400, maxHeight: 600 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Collaborative AI Assistant
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
              Select a document to start collaborative AI assistance
            </Typography>
            
            <FormControl fullWidth size="small">
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
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {doc.category}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {documentsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <LinearProgress sx={{ width: '100%' }} />
              </Box>
            )}

            {onClose && (
              <IconButton 
                onClick={onClose}
                sx={{ position: 'absolute', top: 8, right: 8 }}
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 400,
        maxHeight: 600,
        zIndex: 1000,
        boxShadow: 3
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 1, color: 'primary.main' }} />
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!publishingId && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedDocumentId}
                  onChange={handleDocumentChange}
                  disabled={documentsLoading}
                  displayEmpty
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="caption">Select Doc</Typography>
                  </MenuItem>
                  {documents.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                        {doc.title}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <IconButton size="small" onClick={() => setExpanded(false)}>
              <ExpandLess />
            </IconButton>
            {onClose && (
              <IconButton size="small" onClick={onClose}>
                <Close />
              </IconButton>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Real-time Analysis */}
        {realTimeAnalysis && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Real-time Analysis
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Consensus
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={realTimeAnalysis.consensusLevel}
                    color={realTimeAnalysis.consensusLevel > 70 ? 'success' : 'warning'}
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption">
                    {realTimeAnalysis.consensusLevel}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Engagement
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={realTimeAnalysis.engagementLevel}
                    color={getEngagementColor(realTimeAnalysis.engagementLevel) as any}
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption">
                    {realTimeAnalysis.engagementLevel}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {realTimeAnalysis.conflictDetected && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Conflict detected - AI mediation available
              </Alert>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoFixHigh />}
            onClick={() => setMediationDialog(true)}
          >
            Mediate
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<People />}
            onClick={() => setConsensusDialog(true)}
          >
            Consensus
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Analytics />}
            onClick={analyzeCollaborationRealTime}
          >
            Analyze
          </Button>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            height: 300,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            mb: 2
          }}
        >
          {messages.map((message, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    bgcolor: message.type === 'ai' ? 'primary.main' : 
                             message.type === 'system' ? 'secondary.main' : 'info.main'
                  }}
                >
                  {message.type === 'ai' ? <Psychology sx={{ fontSize: 16 }} /> :
                   message.type === 'system' ? <Analytics sx={{ fontSize: 16 }} /> :
                   <Chat sx={{ fontSize: 16 }} />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {message.type === 'ai' ? 'AI Assistant' : 
                     message.type === 'system' ? 'System' : 
                     message.sender || 'User'} • {message.timestamp.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask AI for help..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
          >
            <Send />
          </Button>
        </Box>

        {/* Participant Insights */}
        {realTimeAnalysis && realTimeAnalysis.participantInsights.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Participant Insights
            </Typography>
            <List dense>
              {realTimeAnalysis.participantInsights.map((insight, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip
                      label={insight.sentiment}
                      size="small"
                      color={getSentimentColor(insight.sentiment) as any}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`User ${insight.userId.substring(0, 8)}`}
                    secondary={`Engagement: ${insight.engagement}%`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>

      {/* Mediation Dialog */}
      <Dialog open={mediationDialog} onClose={() => setMediationDialog(false)}>
        <DialogTitle>AI Conflict Mediation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            I can help mediate the current conflict by analyzing different perspectives 
            and suggesting compromise solutions. Would you like me to proceed?
          </Typography>
          <Alert severity="info">
            This will generate a structured mediation plan and facilitate discussion 
            between conflicting parties.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMediationDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMediateConflict}>
            Start Mediation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Consensus Dialog */}
      <Dialog open={consensusDialog} onClose={() => setConsensusDialog(false)}>
        <DialogTitle>AI Consensus Building</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            I can analyze current approval responses and identify common ground 
            to help build consensus among participants.
          </Typography>
          <Alert severity="info">
            This will provide insights into shared perspectives and suggest 
            paths toward agreement.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsensusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBuildConsensus}>
            Analyze Consensus
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CollaborativeAIAssistant;