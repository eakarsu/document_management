'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Check, 
  X, 
  Edit3, 
  Sparkles,
  AlertTriangle,
  Clock,
  User,
  FileText,
  ChevronRight
} from 'lucide-react';

interface Feedback {
  id: string;
  lineNumber: number;
  content: string;
  reviewerName: string;
  reviewerEmail: string;
  severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  timestamp: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MERGED';
  originalContent?: string;
  mergedContent?: string;
  mergeStrategy?: string;
}

interface FeedbackReviewInterfaceProps {
  documentId: string;
  documentContent: string;
  currentStage: number;
  onSave?: (feedback: any) => void;
}

export function FeedbackReviewInterface({
  documentId,
  documentContent,
  currentStage,
  onSave
}: FeedbackReviewInterfaceProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<string>('MANUAL');
  const [originalContent, setOriginalContent] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [mergedContent, setMergedContent] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | ''>('');

  // Load feedback for the current stage
  useEffect(() => {
    loadFeedback();
  }, [documentId, currentStage]);

  const loadFeedback = async () => {
    try {
      const response = await fetch(`/api/opr-workflow-feedback/document/${documentId}/stage/${currentStage}/feedback`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Mock data for demonstration
        const mockFeedback: Feedback[] = [
          {
            id: 'fb-1',
            lineNumber: 2,
            content: 'This line requires better clarity and proper grammar structure.',
            reviewerName: 'John Smith',
            reviewerEmail: 'john.smith@demo.mil',
            severity: 'CRITICAL',
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            originalContent: 'Line 2 needs improvement'
          },
          {
            id: 'fb-2',
            lineNumber: 3,
            content: 'Technical specifications should follow military standards.',
            reviewerName: 'Jane Doe',
            reviewerEmail: 'jane.doe@demo.mil',
            severity: 'MAJOR',
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            originalContent: 'Technical specs are defined here'
          },
          {
            id: 'fb-3',
            lineNumber: 5,
            content: 'Consider adding more detail about performance metrics.',
            reviewerName: 'Mike Johnson',
            reviewerEmail: 'mike.j@demo.mil',
            severity: 'SUBSTANTIVE',
            timestamp: new Date().toISOString(),
            status: 'PENDING',
            originalContent: 'Performance metrics meet requirements'
          }
        ];
        setFeedbackList(data.feedback || mockFeedback);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleFeedbackSelect = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setOriginalContent(feedback.originalContent || '');
    setFeedbackContent(feedback.content);
    setMergedContent(feedback.originalContent || '');
    setDecision('');
    setAiSuggestion('');
  };

  const generateAiSuggestion = async () => {
    if (!selectedFeedback) return;
    
    setIsProcessing(true);
    try {
      // Mock AI suggestion - in production, call actual AI service
      const suggestion = `${originalContent.trim()} has been updated to address the feedback: ${feedbackContent.substring(0, 50)}...`;
      setAiSuggestion(suggestion);
      if (mergeStrategy === 'AI') {
        setMergedContent(suggestion);
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessFeedback = async () => {
    if (!selectedFeedback) return;
    
    setIsProcessing(true);
    try {
      let finalContent = mergedContent;
      
      // Determine final content based on strategy
      if (mergeStrategy === 'AI' && !aiSuggestion) {
        await generateAiSuggestion();
        finalContent = aiSuggestion;
      }
      
      const response = await fetch('/api/opr-workflow-feedback/process-feedback-merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          feedbackId: selectedFeedback.id,
          originalContent,
          feedbackContent,
          mergeStrategy: decision === 'ACCEPT' ? 'ACCEPT_ALL' : decision === 'REJECT' ? 'REJECT_ALL' : mergeStrategy === 'MANUAL' ? 'MANUAL_MERGE' : 'AI_SUGGEST',
          manualMerge: mergeStrategy === 'MANUAL' || mergeStrategy === 'HYBRID' ? mergedContent : undefined,
          aiSuggestion: mergeStrategy === 'AI' || mergeStrategy === 'HYBRID' ? aiSuggestion : undefined,
          lineNumber: selectedFeedback.lineNumber,
          mergeType: mergeStrategy
        })
      });

      if (response.ok) {
        // Update feedback status
        setFeedbackList(prev => 
          prev.map(fb => 
            fb.id === selectedFeedback.id 
              ? { ...fb, status: decision === 'REJECT' ? 'REJECTED' : 'ACCEPTED', mergedContent: finalContent }
              : fb
          )
        );
        
        // Clear selection
        setSelectedFeedback(null);
        setOriginalContent('');
        setFeedbackContent('');
        setMergedContent('');
        setDecision('');
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'MAJOR': return 'orange';
      case 'SUBSTANTIVE': return 'blue';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <Check className="h-4 w-4 text-green-600" />;
      case 'REJECTED': return <X className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left Panel - Document and Merge Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Document Review - Stage {currentStage}</CardTitle>
            <CardDescription>
              Review and process feedback with manual or AI-assisted merging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFeedback ? (
              <>
                {/* Selected Feedback Info */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(selectedFeedback.severity) as any}>
                        {selectedFeedback.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Line {selectedFeedback.lineNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {selectedFeedback.reviewerName}
                    </div>
                  </div>
                  {selectedFeedback.severity === 'CRITICAL' && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Critical feedback must be addressed before approval
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Merge Strategy Selector */}
                <div className="space-y-2">
                  <Label>Merge Strategy</Label>
                  <Select value={mergeStrategy} onValueChange={setMergeStrategy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select merge strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4" />
                          Manual Merge
                        </div>
                      </SelectItem>
                      <SelectItem value="AI">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          AI Suggestion
                        </div>
                      </SelectItem>
                      <SelectItem value="HYBRID">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          AI + Manual Edit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Original Content */}
                <div className="space-y-2">
                  <Label>Original Content</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{originalContent}</pre>
                  </div>
                </div>

                {/* Feedback Content */}
                <div className="space-y-2">
                  <Label>Reviewer Feedback</Label>
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <pre className="whitespace-pre-wrap text-sm">{feedbackContent}</pre>
                  </div>
                </div>

                {/* AI Suggestion (if applicable) */}
                {(mergeStrategy === 'AI' || mergeStrategy === 'HYBRID') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>AI Suggestion</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={generateAiSuggestion}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Generating...' : 'Generate'}
                      </Button>
                    </div>
                    {aiSuggestion && (
                      <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                        <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Merged Content Editor */}
                <div className="space-y-2">
                  <Label>Merged Content</Label>
                  <Textarea
                    value={mergedContent}
                    onChange={(e) => setMergedContent(e.target.value)}
                    className="min-h-[150px] font-mono"
                    placeholder="Edit the merged content here..."
                    disabled={mergeStrategy === 'AI' && !aiSuggestion}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setMergedContent(originalContent)}
                    >
                      Reset to Original
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setMergedContent(feedbackContent)}
                    >
                      Use Feedback
                    </Button>
                    {aiSuggestion && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setMergedContent(aiSuggestion)}
                      >
                        Use AI Suggestion
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setDecision('REJECT');
                      handleProcessFeedback();
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      setDecision('ACCEPT');
                      handleProcessFeedback();
                    }}
                    disabled={isProcessing || !mergedContent.trim()}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept & Apply
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                  <p>Select feedback from the list to review and process</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Feedback List */}
      <div className="w-[400px] border-l bg-muted/10">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Feedback List</h3>
          <p className="text-sm text-muted-foreground">
            {feedbackList.filter(f => f.status === 'PENDING').length} pending, 
            {' '}{feedbackList.filter(f => f.status === 'ACCEPTED').length} accepted,
            {' '}{feedbackList.filter(f => f.status === 'REJECTED').length} rejected
          </p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-3">
            {feedbackList.map((feedback) => (
              <Card 
                key={feedback.id}
                className={`cursor-pointer transition-colors ${
                  selectedFeedback?.id === feedback.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleFeedbackSelect(feedback)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(feedback.status)}
                      <Badge 
                        variant={getSeverityColor(feedback.severity) as any}
                        className="text-xs"
                      >
                        {feedback.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Line {feedback.lineNumber}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <p className="text-sm font-medium mb-1">
                    {feedback.reviewerName}
                  </p>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {feedback.content}
                  </p>
                  
                  {feedback.status !== 'PENDING' && (
                    <div className="mt-2 pt-2 border-t">
                      <span className={`text-xs ${
                        feedback.status === 'ACCEPTED' ? 'text-green-600' : 
                        feedback.status === 'REJECTED' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {feedback.status}
                        {feedback.mergeStrategy && ` - ${feedback.mergeStrategy}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}