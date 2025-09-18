'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Sparkles, 
  AlertTriangle,
  Merge,
  FileText
} from 'lucide-react';

interface FeedbackMergeDialogProps {
  open: boolean;
  onClose: () => void;
  originalContent: string;
  feedbackContent: string;
  feedbackSeverity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  feedbackId: string;
  lineNumber: number;
  onMergeComplete: (mergedContent: string, mergeType: string) => void;
}

export function FeedbackMergeDialog({
  open,
  onClose,
  originalContent,
  feedbackContent,
  feedbackSeverity,
  feedbackId,
  lineNumber,
  onMergeComplete
}: FeedbackMergeDialogProps) {
  const [mergeStrategy, setMergeStrategy] = useState<string>('MANUAL_MERGE');
  const [manualContent, setManualContent] = useState(originalContent);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // Generate AI suggestion (mock for now, would call API)
  const generateAiSuggestion = async () => {
    setIsProcessing(true);
    try {
      // In real implementation, this would call the AI service
      const mockSuggestion = `${originalContent.trim()}. ${feedbackContent.trim()}`;
      setAiSuggestion(mockSuggestion);
      setManualContent(mockSuggestion); // Pre-fill manual editor with AI suggestion
      setActiveTab('ai');
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    setIsProcessing(true);
    try {
      let finalContent = originalContent;
      let mergeType = mergeStrategy;

      switch (mergeStrategy) {
        case 'ACCEPT_ALL':
          finalContent = feedbackContent;
          break;
        case 'REJECT_ALL':
          finalContent = originalContent;
          break;
        case 'MANUAL_MERGE':
          finalContent = manualContent;
          mergeType = activeTab === 'ai' ? 'HYBRID' : 'MANUAL';
          break;
        case 'AI_SUGGEST':
          finalContent = aiSuggestion || originalContent;
          mergeType = 'AI';
          break;
      }

      // Call the API to save the merge
      const response = await fetch('/api/opr-workflow-feedback/process-feedback-merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          feedbackId,
          originalContent,
          feedbackContent,
          mergeStrategy,
          manualMerge: finalContent,
          lineNumber,
          mergeType,
          aiSuggestion: activeTab === 'ai' ? aiSuggestion : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to process merge');

      onMergeComplete(finalContent, mergeType);
      onClose();
    } catch (error) {
      console.error('Error processing merge:', error);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Process Feedback - Line {lineNumber}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getSeverityColor(feedbackSeverity) as any}>
              {feedbackSeverity}
            </Badge>
            {feedbackSeverity === 'CRITICAL' && (
              <Alert className="p-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Critical feedback must be addressed
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Original Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{originalContent}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Reviewer Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{feedbackContent}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <Edit3 className="h-4 w-4 mr-2" />
              Manual Merge
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assist
            </TabsTrigger>
            <TabsTrigger value="quick">
              <FileText className="h-4 w-4 mr-2" />
              Quick Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Manual Merge Editor</CardTitle>
                <CardDescription>
                  Edit the content below to create your merged version
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="min-h-[200px] font-mono"
                  placeholder="Enter your merged content here..."
                />
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManualContent(originalContent)}
                  >
                    Reset to Original
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManualContent(feedbackContent)}
                  >
                    Use Feedback
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManualContent(`${originalContent}\n\n[Updated based on feedback:]\n${feedbackContent}`)}
                  >
                    Combine Both
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI-Assisted Merge</CardTitle>
                <CardDescription>
                  Let AI suggest a merge, then edit as needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!aiSuggestion ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Button onClick={generateAiSuggestion} disabled={isProcessing}>
                      {isProcessing ? 'Generating...' : 'Generate AI Suggestion'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm font-medium mb-2">AI Suggestion:</p>
                      <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
                    </div>
                    <Textarea
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      className="min-h-[150px] font-mono"
                      placeholder="Edit AI suggestion if needed..."
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateAiSuggestion}
                      >
                        Regenerate
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setManualContent(aiSuggestion)}
                      >
                        Reset to AI Suggestion
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
                <CardDescription>
                  Choose a quick merge action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={mergeStrategy} onValueChange={setMergeStrategy}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted">
                      <RadioGroupItem value="ACCEPT_ALL" id="accept" />
                      <Label htmlFor="accept" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Accept Feedback</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Replace original with reviewer's feedback
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted">
                      <RadioGroupItem value="REJECT_ALL" id="reject" />
                      <Label htmlFor="reject" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Reject Feedback</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Keep original content unchanged
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted">
                      <RadioGroupItem value="MANUAL_MERGE" id="manual" />
                      <Label htmlFor="manual" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Manual Merge</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use content from Manual Merge tab
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={isProcessing || (activeTab === 'manual' && !manualContent.trim())}
          >
            {isProcessing ? 'Processing...' : 'Apply Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}