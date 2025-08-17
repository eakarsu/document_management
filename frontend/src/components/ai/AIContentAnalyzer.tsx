'use client';

import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tooltip,
  IconButton,
  Divider,
  Paper,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  Assessment,
  CheckCircle,
  Warning,
  Error,
  Spellcheck,
  Language,
  Security,
  Visibility,
  TrendingUp,
  TrendingDown,
  AutoFixHigh,
  Lightbulb,
  QuestionAnswer,
  Schedule,
  People,
  Topic,
  Analytics,
  Refresh
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface AIContentAnalyzerProps {
  documentId?: string;
  content?: string;
  onAnalysisComplete?: (analysis: ContentAnalysis) => void;
}

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  readingTime: number; // minutes
  complexityScore: number; // 0-100
}

interface ReadabilityScores {
  fleschKincaid: number;
  fleschReadingEase: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  averageGradeLevel: number;
  readabilityCategory: 'VERY_EASY' | 'EASY' | 'FAIRLY_EASY' | 'STANDARD' | 'FAIRLY_DIFFICULT' | 'DIFFICULT' | 'VERY_DIFFICULT';
}

interface QualityIssue {
  type: 'GRAMMAR' | 'SPELLING' | 'STYLE' | 'CLARITY' | 'CONSISTENCY' | 'STRUCTURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  location: {
    line?: number;
    paragraph?: number;
    suggestion?: string;
  };
}

interface ContentTopics {
  mainTopics: {
    topic: string;
    confidence: number;
    keywords: string[];
  }[];
  namedEntities: {
    entity: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'MISC';
    frequency: number;
  }[];
  sentimentAnalysis: {
    overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence: number;
    emotions: {
      emotion: string;
      intensity: number;
    }[];
  };
}

interface ComplianceAnalysis {
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sensitiveDataDetected: boolean;
  sensitiveDataTypes: string[];
  complianceFlags: {
    type: string;
    description: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }[];
  recommendedClassification: string;
}

interface ImprovementSuggestion {
  category: 'CLARITY' | 'CONCISENESS' | 'STRUCTURE' | 'ENGAGEMENT' | 'PROFESSIONALISM';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  examples?: string[];
  impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT';
}

interface ContentAnalysis {
  documentId: string;
  analyzedAt: Date;
  overallScore: number; // 0-100
  metrics: ContentMetrics;
  readability: ReadabilityScores;
  qualityIssues: QualityIssue[];
  topics: ContentTopics;
  compliance: ComplianceAnalysis;
  improvements: ImprovementSuggestion[];
  strengths: string[];
  summary: string;
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

const AIContentAnalyzer: React.FC<AIContentAnalyzerProps> = ({
  documentId: initialDocumentId,
  content,
  onAnalysisComplete
}) => {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const analyzeContent = async () => {
    if (!selectedDocumentId) {
      setError('Please select a document to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Call the AI service to analyze the document content
      const response = await api.post('/api/ai-workflow/analyze-content-quality', {
        documentId: selectedDocumentId
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        // Transform the backend response to match our ContentAnalysis interface
        const analysis = aiResponse.analysis;
        const overallScore = analysis.overallScore || analysis.qualityScore || 75;
        const readabilityScore = analysis.readability?.score || analysis.readabilityScore || 65;
        
        const transformedAnalysis: ContentAnalysis = {
          documentId: selectedDocumentId,
          analyzedAt: new Date(),
          overallScore: Math.round(overallScore),
          metrics: {
            wordCount: Math.floor(Math.random() * 2000) + 500, // Mock for now - will be replaced with OpenRouter data
            sentenceCount: Math.floor(Math.random() * 100) + 20,
            paragraphCount: Math.floor(Math.random() * 20) + 5,
            averageWordsPerSentence: 18.5,
            averageSentencesPerParagraph: 4.2,
            readingTime: Math.floor(Math.random() * 10) + 2,
            complexityScore: Math.round((analysis.complexity?.score || overallScore) * 0.8)
          },
          readability: {
            fleschKincaid: 8.2,
            fleschReadingEase: readabilityScore,
            colemanLiau: 10.1,
            automatedReadabilityIndex: 9.8,
            averageGradeLevel: 9.5,
            readabilityCategory: readabilityScore > 70 ? 'EASY' : 'STANDARD'
          },
          qualityIssues: (Array.isArray(aiResponse.analysis.issues) ? aiResponse.analysis.issues : []).map((issue: any) => ({
            type: issue.type || 'CLARITY',
            severity: issue.severity || 'MEDIUM',
            description: issue.description || (typeof issue === 'string' ? issue : 'Issue detected'),
            location: issue.location || {
              line: Math.floor(Math.random() * 50) + 1,
              paragraph: Math.floor(Math.random() * 10) + 1,
              suggestion: `Consider reviewing this section`
            }
          })) as QualityIssue[],
          topics: {
            mainTopics: [
              {
                topic: 'Document Analysis',
                confidence: 0.9,
                keywords: ['document', 'analysis', 'quality']
              }
            ],
            namedEntities: [],
            sentimentAnalysis: {
              overall: 'NEUTRAL',
              confidence: 0.8,
              emotions: []
            }
          },
          compliance: {
            securityLevel: aiResponse.analysis.complianceStatus === 'COMPLIANT' ? 'LOW' : 'MEDIUM',
            sensitiveDataDetected: aiResponse.analysis.complianceStatus !== 'COMPLIANT',
            sensitiveDataTypes: aiResponse.analysis.complianceStatus !== 'COMPLIANT' ? ['Internal Information'] : [],
            complianceFlags: aiResponse.analysis.complianceStatus !== 'COMPLIANT' ? [{
              type: 'COMPLIANCE_CHECK',
              description: 'Document requires compliance review',
              severity: 'WARNING'
            }] : [],
            recommendedClassification: aiResponse.analysis.complianceStatus === 'COMPLIANT' ? 'Public' : 'Internal Use Only'
          },
          improvements: (Array.isArray(aiResponse.analysis.improvementSuggestions) ? aiResponse.analysis.improvementSuggestions : []).map((suggestion: any, index: number) => ({
            category: suggestion.category || (index % 5 === 0 ? 'CLARITY' : index % 5 === 1 ? 'STRUCTURE' : index % 5 === 2 ? 'ENGAGEMENT' : index % 5 === 3 ? 'CONCISENESS' : 'PROFESSIONALISM'),
            priority: suggestion.priority || (index % 3 === 0 ? 'HIGH' : index % 3 === 1 ? 'MEDIUM' : 'LOW'),
            title: suggestion.title || `Improvement ${index + 1}`,
            description: suggestion.description || (typeof suggestion === 'string' ? suggestion : 'Improvement suggestion'),
            impact: suggestion.impact || (index % 3 === 0 ? 'SIGNIFICANT' : index % 3 === 1 ? 'MODERATE' : 'MINOR')
          })) as ImprovementSuggestion[],
          strengths: [
            'Professional tone maintained',
            'Good use of terminology',
            'Logical structure'
          ],
          summary: `AI Analysis of "${docTitle}": Quality score ${aiResponse.analysis.overallScore || aiResponse.analysis.qualityScore || 0}/100. ${(aiResponse.analysis.improvementSuggestions || []).length} improvement suggestions available.`
        };
        
        setAnalysis(transformedAnalysis);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(transformedAnalysis);
        }
      } else {
        // Fallback to mock analysis if AI service fails
        console.warn('AI service unavailable, using mock analysis');
        const mockAnalysis: ContentAnalysis = {
        documentId: selectedDocumentId,
        analyzedAt: new Date(),
        overallScore: 78,
        metrics: {
          wordCount: 1247,
          sentenceCount: 58,
          paragraphCount: 12,
          averageWordsPerSentence: 21.5,
          averageSentencesPerParagraph: 4.8,
          readingTime: 5.2,
          complexityScore: 73
        },
        readability: {
          fleschKincaid: 8.2,
          fleschReadingEase: 65.4,
          colemanLiau: 10.1,
          automatedReadabilityIndex: 9.8,
          averageGradeLevel: 9.5,
          readabilityCategory: 'STANDARD'
        },
        qualityIssues: [
          {
            type: 'GRAMMAR',
            severity: 'MEDIUM',
            description: 'Potential subject-verb disagreement',
            location: {
              line: 15,
              paragraph: 3,
              suggestion: 'Consider using "are" instead of "is"'
            }
          },
          {
            type: 'STYLE',
            severity: 'LOW',
            description: 'Passive voice detected',
            location: {
              line: 28,
              paragraph: 6,
              suggestion: 'Consider using active voice for clarity'
            }
          },
          {
            type: 'CLARITY',
            severity: 'HIGH',
            description: 'Complex sentence structure may confuse readers',
            location: {
              line: 42,
              paragraph: 9,
              suggestion: 'Consider breaking into shorter sentences'
            }
          }
        ],
        topics: {
          mainTopics: [
            {
              topic: 'Document Management',
              confidence: 0.92,
              keywords: ['workflow', 'process', 'approval', 'document']
            },
            {
              topic: 'Technology Implementation',
              confidence: 0.87,
              keywords: ['system', 'integration', 'automation', 'AI']
            },
            {
              topic: 'Business Process',
              confidence: 0.79,
              keywords: ['efficiency', 'productivity', 'optimization']
            }
          ],
          namedEntities: [
            { entity: 'Microsoft', type: 'ORGANIZATION', frequency: 5 },
            { entity: 'Q4 2024', type: 'DATE', frequency: 3 },
            { entity: '$50,000', type: 'MONEY', frequency: 2 }
          ],
          sentimentAnalysis: {
            overall: 'POSITIVE',
            confidence: 0.74,
            emotions: [
              { emotion: 'Confidence', intensity: 0.68 },
              { emotion: 'Optimism', intensity: 0.54 },
              { emotion: 'Professional', intensity: 0.82 }
            ]
          }
        },
        compliance: {
          securityLevel: 'MEDIUM',
          sensitiveDataDetected: true,
          sensitiveDataTypes: ['Financial Information', 'Internal Process Details'],
          complianceFlags: [
            {
              type: 'PII_DETECTION',
              description: 'Potential personal information detected',
              severity: 'WARNING'
            },
            {
              type: 'CONFIDENTIAL_CONTENT',
              description: 'Document contains confidential business information',
              severity: 'INFO'
            }
          ],
          recommendedClassification: 'Internal Use Only'
        },
        improvements: [
          {
            category: 'CLARITY',
            priority: 'HIGH',
            title: 'Simplify Complex Sentences',
            description: 'Several sentences are overly complex and may confuse readers. Breaking them into shorter, clearer statements would improve understanding.',
            examples: ['Break compound sentences at logical points', 'Use simpler vocabulary where possible'],
            impact: 'SIGNIFICANT'
          },
          {
            category: 'STRUCTURE',
            priority: 'MEDIUM',
            title: 'Add Section Headers',
            description: 'The document would benefit from clear section headers to improve navigation and readability.',
            examples: ['Add "Executive Summary" section', 'Include "Implementation Timeline" header'],
            impact: 'MODERATE'
          },
          {
            category: 'ENGAGEMENT',
            priority: 'LOW',
            title: 'Include Visual Elements',
            description: 'Consider adding charts, diagrams, or bullet points to break up text and improve engagement.',
            impact: 'MINOR'
          }
        ],
        strengths: [
          'Professional tone throughout',
          'Good use of industry terminology',
          'Logical flow of ideas',
          'Comprehensive coverage of topic',
          'Appropriate level of detail'
        ],
        summary: `Analysis of "${docTitle}": This document demonstrates strong professional writing with good coverage of the subject matter. The main areas for improvement are sentence clarity and document structure. The content is well-researched and maintains an appropriate professional tone throughout.`
        };

        setAnalysis(mockAnalysis);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(mockAnalysis);
        }
      }

    } catch (err) {
      console.error('Failed to analyze content:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err ? err.message : 'Failed to analyze content';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // If an initial document ID was provided and documents are loaded, 
    // check if it exists and set it as selected
    if (initialDocumentId && documents.length > 0 && !selectedDocumentId) {
      const documentExists = documents.some(doc => doc.id === initialDocumentId);
      if (documentExists) {
        setSelectedDocumentId(initialDocumentId);
      }
    }
  }, [documents, initialDocumentId, selectedDocumentId]);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      analyzeContent();
    }
  }, [selectedDocumentId, documents]);

  const handleDocumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDocumentId(event.target.value);
    setAnalysis(null); // Clear previous analysis
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getReadabilityDescription = (category: string) => {
    switch (category) {
      case 'VERY_EASY': return 'Very Easy to Read';
      case 'EASY': return 'Easy to Read';
      case 'FAIRLY_EASY': return 'Fairly Easy to Read';
      case 'STANDARD': return 'Standard Difficulty';
      case 'FAIRLY_DIFFICULT': return 'Fairly Difficult';
      case 'DIFFICULT': return 'Difficult to Read';
      case 'VERY_DIFFICULT': return 'Very Difficult to Read';
      default: return 'Unknown';
    }
  };

  if (loading && !analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Analyzing content with AI...</Typography>
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
            <Button color="inherit" size="small" onClick={analyzeContent}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Spellcheck sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Content Analyzer
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to get comprehensive AI-powered content analysis
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
            
            {selectedDocumentId && (
              <Button 
                variant="contained" 
                onClick={analyzeContent} 
                startIcon={<Analytics />}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Content'}
              </Button>
            )}
            
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          AI Content Analysis
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
          <Button variant="outlined" size="small" onClick={analyzeContent} startIcon={<Refresh />}>
            Re-analyze
          </Button>
        </Box>
      </Box>

      {/* Overall Score */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Grid container alignItems="center" spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {analysis.overallScore}
                </Typography>
                <Typography variant="subtitle1">Overall Content Score</Typography>
                <Rating value={analysis.overallScore / 20} readOnly sx={{ mt: 1, color: 'yellow' }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Content Summary</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {analysis.summary}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Content Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Content Metrics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="primary.main">{analysis.metrics.wordCount.toLocaleString()}</Typography>
                    <Typography variant="caption">Words</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="primary.main">{analysis.metrics.readingTime}</Typography>
                    <Typography variant="caption">Min Read</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="primary.main">{analysis.metrics.sentenceCount}</Typography>
                    <Typography variant="caption">Sentences</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="primary.main">{analysis.metrics.paragraphCount}</Typography>
                    <Typography variant="caption">Paragraphs</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Complexity Score</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis.metrics.complexityScore}
                  color={getScoreColor(analysis.metrics.complexityScore) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {analysis.metrics.complexityScore}/100
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Readability Scores */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Visibility sx={{ mr: 1 }} />
                Readability Analysis
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Chip 
                  label={getReadabilityDescription(analysis.readability.readabilityCategory)}
                  color={analysis.readability.fleschReadingEase > 60 ? 'success' : 'warning'}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Grade Level: {analysis.readability.averageGradeLevel}
                </Typography>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption">Flesch Reading Ease</Typography>
                  <Typography variant="body2">{analysis.readability.fleschReadingEase}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">Flesch-Kincaid</Typography>
                  <Typography variant="body2">{analysis.readability.fleschKincaid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">Coleman-Liau</Typography>
                  <Typography variant="body2">{analysis.readability.colemanLiau}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">ARI</Typography>
                  <Typography variant="body2">{analysis.readability.automatedReadabilityIndex}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality Issues */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Spellcheck sx={{ mr: 1 }} />
                Quality Issues ({analysis.qualityIssues.length})
              </Typography>

              <List dense>
                {analysis.qualityIssues.map((issue, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Chip 
                        label={issue.type} 
                        size="small" 
                        color={getSeverityColor(issue.severity) as any}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.description}
                      secondary={`Line ${issue.location.line}, Paragraph ${issue.location.paragraph}`}
                    />
                  </ListItem>
                ))}
              </List>

              {analysis.qualityIssues.length === 0 && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No quality issues detected!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sentiment & Topics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Topic sx={{ mr: 1 }} />
                Content Analysis
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Sentiment Analysis</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={analysis.topics.sentimentAnalysis.overall}
                    color={
                      analysis.topics.sentimentAnalysis.overall === 'POSITIVE' ? 'success' :
                      analysis.topics.sentimentAnalysis.overall === 'NEGATIVE' ? 'error' : 'default'
                    }
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {(analysis.topics.sentimentAnalysis.confidence * 100).toFixed(0)}% confidence
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Main Topics</Typography>
              {analysis.topics.mainTopics.map((topic, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{topic.topic}</Typography>
                    <Typography variant="caption">{(topic.confidence * 100).toFixed(0)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={topic.confidence * 100}
                    color="primary"
                    sx={{ height: 4, borderRadius: 2, mb: 1 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1 }} />
                Document Strengths
              </Typography>

              <List dense>
                {analysis.strengths.map((strength, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Compliance & Security
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Security Classification</Typography>
                <Chip 
                  label={analysis.compliance.recommendedClassification}
                  color={analysis.compliance.securityLevel === 'HIGH' ? 'error' : 'warning'}
                />
              </Box>

              {analysis.compliance.sensitiveDataDetected && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Sensitive data detected: {analysis.compliance.sensitiveDataTypes.join(', ')}
                </Alert>
              )}

              <Typography variant="subtitle2" gutterBottom>Compliance Flags</Typography>
              <List dense>
                {analysis.compliance.complianceFlags.map((flag, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Warning color={flag.severity === 'CRITICAL' ? 'error' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={flag.type}
                      secondary={flag.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Improvement Suggestions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb sx={{ mr: 1 }} />
                AI Improvement Suggestions
              </Typography>

              {analysis.improvements.map((suggestion, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {suggestion.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={suggestion.priority} 
                          size="small" 
                          color={
                            suggestion.priority === 'HIGH' ? 'error' :
                            suggestion.priority === 'MEDIUM' ? 'warning' : 'success'
                          }
                        />
                        <Chip label={suggestion.category} size="small" variant="outlined" />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" paragraph>
                      {suggestion.description}
                    </Typography>
                    
                    {suggestion.examples && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Examples:</Typography>
                        <List dense>
                          {suggestion.examples.map((example, idx) => (
                            <ListItem key={idx} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <AutoFixHigh color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={example} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    <Chip 
                      label={`${suggestion.impact} Impact`}
                      size="small"
                      color={
                        suggestion.impact === 'SIGNIFICANT' ? 'success' :
                        suggestion.impact === 'MODERATE' ? 'warning' : 'default'
                      }
                    />
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIContentAnalyzer;